import {ShaderMaterial,Matrix4,DataTexture,RGBAFormat,FloatType,WebGLRenderTarget,Vector3,DoubleSide} from './node_modules/three/build/three.module.js';
import {MeshBVH,MeshBVHUniformStruct,SAH,shaderStructs,shaderIntersectFunction} from './node_modules/three-mesh-bvh/src/index.js';
import {FullScreenQuad} from './node_modules/three/examples/jsm/postprocessing/Pass.js';
import {receiverUniforms} from './receiver.js';
import {KERNEL_RADIUS} from './beam-field.js';
import {PrismRaySolver} from './ray.js';

const transportGLSL=`
uniform BVH prismBVH;uniform mat4 inversePrism;uniform sampler2D beamMap,nodeMap;uniform int nodeCount;
uniform float sigmaT,sigmaS,radius,ior,epsilon;uniform bool whiteEnvironment;
uniform bool receiverEnabled,backEnabled;uniform vec4 receiverPlane,backPlane;uniform vec3 receiverCenter,receiverU,receiverV,receiverSize,backCenter,backU,backV,backSize;
bool boxHit(vec3 o,vec3 d,vec3 lo,vec3 hi,float maxT){float nearT=0.,farT=maxT;for(int j=0;j<3;j++){if(abs(d[j])<1e-9){if(o[j]<lo[j]||o[j]>hi[j])return false;}else{float a=(lo[j]-o[j])/d[j],b=(hi[j]-o[j])/d[j];nearT=max(nearT,min(a,b));farT=min(farT,max(a,b));if(farT<nearT)return false;}}return true;}
float sheetHit(vec3 o,vec3 d,bool enabled,vec4 plane,vec3 center,vec3 u,vec3 v,vec3 size){if(!enabled)return 50.;float denom=dot(plane.xyz,d);if(abs(denom)<1e-9)return 50.;float t=(plane.w-dot(plane.xyz,o))/denom;if(t<=epsilon)return 50.;vec3 q=o+d*t-center;return abs(dot(q,u))<=size.x&&abs(dot(q,v))<=size.y?min(t,50.):50.;}
bool glassHit(vec3 o,vec3 d,out vec3 point,out vec3 normal,out float distance){uvec4 face=uvec4(0);vec3 localNormal=vec3(0),bary=vec3(0);float side=0.;distance=1e20;
  bool hit=bvhIntersectFirstHit(prismBVH,(inversePrism*vec4(o,1.)).xyz,(inversePrism*vec4(d,0.)).xyz,face,localNormal,bary,side,distance);
  if(!hit||distance<0.){point=o;normal=vec3(0);return false;}point=o+d*distance;normal=normalize(transpose(mat3(inversePrism))*localNormal);return true;}
float interfaceF(float cosine,float n1,float n2){if(abs(n1-n2)<1e-7)return 0.;float eta=n1/n2,s2=eta*eta*max(0.,1.-cosine*cosine);if(s2>=1.)return 1.;float c=sqrt(max(0.,1.-s2));float rs=(n1*cosine-n2*c)/(n1*cosine+n2*c),rp=(n2*cosine-n1*c)/(n2*cosine+n1*c);return .5*(rs*rs+rp*rp);}
float beamIntegral(vec3 o,vec3 d,float maxT,vec4 a,vec4 b){if(sigmaS<=0.||a.w<=0.)return 0.;vec3 axis=normalize(b.xyz-a.xyz);float len=length(b.xyz-a.xyz);vec3 relative=o-a.xyz;float along=dot(relative,axis),slope=dot(d,axis);vec3 across=relative-axis*along,side=d-axis*slope;
  float qa=dot(side,side),qb=dot(across,side),qc=dot(across,across)-16.*radius*radius,nearT=0.,farT=maxT;
  if(qa>1e-6){float disc=qb*qb-qa*qc;if(disc<=0.)return 0.;float root=sqrt(disc);nearT=max(nearT,(-qb-root)/qa);farT=min(farT,(-qb+root)/qa);}else if(qc>0.)return 0.;
  if(abs(slope)>1e-6){float x=-along/slope,y=(len-along)/slope;nearT=max(nearT,min(x,y));farT=min(farT,max(x,y));}else if(along<0.||along>len)return 0.;if(farT<=nearT)return 0.;
  float dt=(farT-nearT)/16.,t0=nearT+.5*dt,r2=radius*radius;vec3 offset=across+side*t0;
  float weight=exp(-dot(offset,offset)/(2.*r2)-sigmaT*(along+(1.+slope)*t0))/(6.28318530718*r2),ratio=exp(-(dot(offset,side)*dt+.5*qa*dt*dt)/r2-sigmaT*(1.+slope)*dt),decay=exp(-qa*dt*dt/r2),sum=0.;
  for(int j=0;j<16;j++){sum+=weight;weight*=ratio;ratio*=decay;}float g=.2,c=dot(axis,-d),phase=(1.-g*g)/(12.56637061436*pow(1.+g*g-2.*g*c,1.5));return sum*a.w*sigmaS*phase*dt;}
float fieldRadiance(vec3 o,vec3 d,float maxT){if(sigmaS<=0.)return 0.;float value=0.;int cursor=0;for(int visit=0;visit<4096;visit++){if(cursor>=nodeCount)break;vec4 lo=texelFetch(nodeMap,ivec2(cursor,0),0),hi=texelFetch(nodeMap,ivec2(cursor,1),0);
  if(!boxHit(o,d,lo.xyz,hi.xyz,maxT)){cursor=int(hi.w);continue;}if(lo.w>=0.){int index=int(lo.w);value+=beamIntegral(o,d,maxT,texelFetch(beamMap,ivec2(index,0),0),texelFetch(beamMap,ivec2(index,1),0));}cursor++;}return value;}
float surfaceRadiance(vec3 point,vec3 view,int receiverId,vec3 normal){float value=0.;int cursor=0;for(int visit=0;visit<4096;visit++){if(cursor>=nodeCount)break;vec4 lo=texelFetch(nodeMap,ivec2(cursor,0),0),hi=texelFetch(nodeMap,ivec2(cursor,1),0);
  if(any(lessThan(point,lo.xyz))||any(greaterThan(point,hi.xyz))){cursor=int(hi.w);continue;}if(lo.w>=0.){int index=int(lo.w);vec4 a=texelFetch(beamMap,ivec2(index,0),0),b=texelFetch(beamMap,ivec2(index,1),0);if(int(b.w)==receiverId+1){vec3 axis=normalize(b.xyz-a.xyz);if(dot(-view,normal)*dot(axis,normal)<0.){vec3 q=point-b.xyz;float along=dot(q,axis),r2=radius*radius,dist2=max(0.,dot(q,q)-along*along);value+=a.w*exp(-sigmaT*length(b.xyz-a.xyz))*abs(dot(axis,normal))*exp(-dist2/(2.*r2))/(6.28318530718*r2);}}}cursor++;}
  return value*.65/3.14159265359;}
float airRadiance(vec3 o,vec3 d){if(whiteEnvironment)return 1.;float right=sheetHit(o,d,receiverEnabled,receiverPlane,receiverCenter,receiverU,receiverV,receiverSize),back=sheetHit(o,d,backEnabled,backPlane,backCenter,backU,backV,backSize),end=min(right,back),radiance=fieldRadiance(o,d,end);
  if(end<50.)radiance+=surfaceRadiance(o+d*end,d,right<=back?0:1,right<=back?receiverPlane.xyz:backPlane.xyz)*exp(-sigmaT*end);return radiance;}
float failureKind;
float observe(vec3 origin,vec3 direction,out float remaining){vec3 hit,normal;float distance;remaining=0.;failureKind=0.;if(!glassHit(origin,direction,hit,normal,distance))return airRadiance(origin,direction);
  if(!whiteEnvironment){float firstReceiver=min(sheetHit(origin,direction,receiverEnabled,receiverPlane,receiverCenter,receiverU,receiverV,receiverSize),sheetHit(origin,direction,backEnabled,backPlane,backCenter,backU,backV,backSize));if(firstReceiver<distance)return 0.;}
  float cosine=clamp(-dot(direction,normal),0.,1.),f=interfaceF(cosine,1.,ior),value=f*airRadiance(hit+normal*epsilon,reflect(direction,normal)),weight=(1.-f)/(ior*ior);
  vec3 d=normalize(refract(direction,normal,1./ior)),o=hit+d*epsilon-normal*epsilon;
  for(int bounce=0;bounce<OBSERVER_BOUNCES;bounce++){if(weight*ior*ior<1e-7){remaining=weight*ior*ior;break;}vec3 p,n;float dist;if(!glassHit(o,d,p,n,dist)){remaining=weight*ior*ior;failureKind=2.;break;}
    float c=clamp(-dot(d,n),0.,1.),r=interfaceF(c,ior,1.);vec3 transmitted=refract(d,n,ior);if(r<1.&&dot(transmitted,transmitted)>.5)value+=weight*(1.-r)*ior*ior*airRadiance(p-n*epsilon,normalize(transmitted));
    weight*=r;d=normalize(reflect(d,n));o=p+d*epsilon+n*epsilon;if(bounce==OBSERVER_BOUNCES-1){remaining=weight*ior*ior;failureKind=1.;}}
  return value*exp(-sigmaT*distance);}
`;

export class ObserverOptics {
  constructor(geometry,field){this.geometry=geometry.clone();this.geometry.clearGroups();this.bvh=new MeshBVH(this.geometry,{strategy:SAH,targetLeafSize:4,indirect:true});this.bvhUniform=new MeshBVHUniformStruct();this.bvhUniform.updateFrom(this.bvh);
    this.uniforms={prismBVH:{value:this.bvhUniform},inversePrism:{value:new Matrix4()},beamMap:{value:field.beamTexture},nodeMap:{value:field.nodeTexture},nodeCount:{value:0},radius:{value:KERNEL_RADIUS},sigmaT:{value:0},sigmaS:{value:0},ior:{value:1.45},epsilon:{value:3e-5},whiteEnvironment:{value:false},diagnostic:{value:false},...receiverUniforms(null),...receiverUniforms(null,'back')};
    this.material=new ShaderMaterial({toneMapped:false,uniforms:this.uniforms,defines:{BVH_STACK_DEPTH:32,OBSERVER_BOUNCES:32,TRI_INTERSECT_EPSILON:'1e-8'},vertexShader:'varying vec3 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',fragmentShader:`precision highp float;precision highp int;precision highp usampler2D;${shaderStructs}${shaderIntersectFunction}${transportGLSL}\nuniform bool diagnostic;varying vec3 vWorld;layout(location=1) out vec4 rayAnchor;void main(){rayAnchor=vec4(vWorld,1.);float remaining;float value=observe(cameraPosition,normalize(vWorld-cameraPosition),remaining);gl_FragColor=vec4(diagnostic?vec3(remaining,failureKind*.25,0.):vec3(value),remaining);}`});
  }
  update(matrix,field,receivers,extinction,scattering,ior){this.uniforms.inversePrism.value.copy(matrix).invert();this.uniforms.nodeCount.value=field.nodeCount;this.uniforms.sigmaT.value=extinction;this.uniforms.sigmaS.value=scattering;this.uniforms.ior.value=ior;const values={...receiverUniforms(receivers[0]??null),...receiverUniforms(receivers[1]??null,'back')};for(const name of Object.keys(values))this.uniforms[name].value=values[name].value;}
  dispose(){this.material.dispose();this.bvhUniform.dispose();this.geometry.dispose();}
}

export {transportGLSL};

// Small GPU readback is only run by the explicit verification button, never by the animation loop.
export function verifyObserver(renderer,optics,geometry,matrix,camera,ior){
  const rays=[];for(let y=0;y<7;y++)for(let x=0;x<9;x++){const origin=camera.position.clone(),direction=new Vector3(-.5+x/8,-.5+y/6,0).sub(origin).normalize();rays.push({origin,direction});}
  const count=rays.length,data=new Float32Array(count*8);rays.forEach((r,i)=>{data.set([...r.origin,0],i*4);data.set([...r.direction,0],count*4+i*4);});
  const texture=new DataTexture(data,count,2,RGBAFormat,FloatType);texture.needsUpdate=true;
  const uniforms=Object.fromEntries(Object.entries(optics.uniforms).map(([name,u])=>[name,{value:u.value}]));uniforms.rays={value:texture};uniforms.probePass={value:0};uniforms.whiteEnvironment={value:true};uniforms.sigmaT={value:0};uniforms.sigmaS={value:0};
  const material=new ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,uniforms,defines:{BVH_STACK_DEPTH:32,OBSERVER_BOUNCES:512,TRI_INTERSECT_EPSILON:'1e-8'},vertexShader:'varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`precision highp float;precision highp int;precision highp usampler2D;${shaderStructs}${shaderIntersectFunction}${transportGLSL}
    varying vec2 vUv;uniform sampler2D rays;uniform int probePass;
    void main(){int index=int(gl_FragCoord.x);vec3 origin=texelFetch(rays,ivec2(index,0),0).xyz,direction=normalize(texelFetch(rays,ivec2(index,1),0).xyz),o=origin,d=direction,exitPoint=vec3(0),outputDirection=vec3(0);bool inside=false;float airLength=0.,glassLength=0.,status=3.,interfaces=0.;
      for(int hop=0;hop<8;hop++){vec3 point,normal;float distance;if(!glassHit(o,d,point,normal,distance)){status=hop==0?2.:4.;break;}interfaces+=1.;if(inside)glassLength+=distance+(hop>0?epsilon:0.);else airLength+=distance;
        float eta=inside?ior:1./ior;vec3 transmitted=refract(d,normal,eta);if(dot(transmitted,transmitted)>.5){d=normalize(transmitted);inside=!inside;}else d=normalize(reflect(d,normal));
        if(!inside){status=1.;exitPoint=point;outputDirection=d;break;}o=point+d*epsilon;}
      if(probePass==0)gl_FragColor=vec4(outputDirection,status);else if(probePass==1)gl_FragColor=vec4(exitPoint,interfaces);else if(probePass==2)gl_FragColor=vec4(airLength,glassLength,0.,status);else{float remaining;float value=observe(origin,direction,remaining);gl_FragColor=vec4(value,remaining,0.,1.);}}
  `});
  const target=new WebGLRenderTarget(count,1,{type:FloatType,depthBuffer:false}),quad=new FullScreenQuad(material),prior=renderer.getRenderTarget(),outputs=[];
  for(let pass=0;pass<4;pass++){uniforms.probePass.value=pass;renderer.setRenderTarget(target);quad.render(renderer);const pixels=new Float32Array(count*4);renderer.readRenderTargetPixels(target,0,0,count,1,pixels);outputs.push(pixels);}
  renderer.setRenderTarget(prior);quad.dispose();material.dispose();target.dispose();texture.dispose();
  const solver=new PrismRaySolver(geometry),rows=[],statusCodes={exited:1,miss:2,truncated:3,degenerate:4};
  rays.forEach((r,i)=>{solver.trace(matrix,r.origin,r.direction,ior);const expectedStatus=statusCodes[solver.status],actualStatus=Math.round(outputs[0][i*4+3]),gpuDirection=Array.from(outputs[0].slice(i*4,i*4+3)),gpuPoint=Array.from(outputs[1].slice(i*4,i*4+3));let directionError=0,pointError=0,airError=0,glassError=0;
    if(solver.status==='exited'){directionError=new Vector3(...gpuDirection).distanceTo(solver.outputDirection);pointError=new Vector3(...gpuPoint).distanceTo(solver.events[solver.eventCount-1].point);let prior=r.origin,air=0,glass=0,inside=false;for(let j=0;j<solver.eventCount;j++){const e=solver.events[j];if(inside)glass+=prior.distanceTo(e.point);else air+=prior.distanceTo(e.point);if(e.kind==='refract')inside=!inside;prior=e.point;}airError=Math.abs(outputs[2][i*4]-air);glassError=Math.abs(outputs[2][i*4+1]-glass);}
    rows.push({index:i,cpuStatus:solver.status,gpuStatus:actualStatus,statusMatches:actualStatus===expectedStatus,directionError,pointError,airError,glassError,whiteEnvironment:outputs[3][i*4],remaining:outputs[3][i*4+1],tir:solver.events.slice(0,solver.eventCount).filter(e=>e.kind==='reflect').length});
  });
  return {ior,rays:count,passed:rows.every(r=>r.statusMatches&&r.directionError<.0005&&r.pointError<.0005&&r.airError<.0005&&r.glassError<.0005&&Math.abs(r.whiteEnvironment-1)<.00001&&r.remaining<.00001),maxDirectionError:Math.max(...rows.map(r=>r.directionError)),maxPointError:Math.max(...rows.map(r=>r.pointError)),maxMediumLengthError:Math.max(...rows.map(r=>Math.max(r.airError,r.glassError))),maxEnergyError:Math.max(...rows.map(r=>Math.abs(r.whiteEnvironment-1))),maxRemaining:Math.max(...rows.map(r=>r.remaining)),tir:rows.reduce((s,r)=>s+r.tir,0),rows};
}
