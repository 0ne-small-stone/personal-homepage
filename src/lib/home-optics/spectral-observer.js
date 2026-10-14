import {ShaderMaterial,Vector2} from 'three';
import {ObserverOptics,transportGLSL} from './observer-optics.js';
import {capAccelerator,capGLSL} from './cap-accelerator.js';
export const sellmeierGLSL=`float silicaIOR(float nm){float q=nm*nm*1e-6;return sqrt(1.+.6961663*q/(q-.0684043*.0684043)+.4079426*q/(q-.1162414*.1162414)+.8974794*q/(q-9.896161*9.896161));}`;
export const spectrumGLSL=transportGLSL
  .replace('uniform int nodeCount;','int nodeCount;int nodeBase,beamBase;uniform sampler2D spectralMeta,orientedMap;uniform bool orientedEnabled;uniform int bandIndex,bandCount;uniform bool flatIOR,hasSource;')
  .replace('bool glassHit',`uniform sampler2D hullPlanes;uniform int hullPlaneCount;float hullFallbackCount,hullFailure;vec3 missingOrigin,missingDirection;
    bool hullHit(vec3 o,vec3 d,out vec3 point,out vec3 normal,out float distance){vec3 p=(inversePrism*vec4(o,1.)).xyz,v=(inversePrism*vec4(d,0.)).xyz,enterN=vec3(0),exitN=vec3(0);float enter=0.,exit=1e20;for(int i=0;i<hullPlaneCount;i++){vec4 plane=texelFetch(hullPlanes,ivec2(i,0),0);float slope=dot(plane.xyz,v),gap=plane.w-dot(plane.xyz,p);if(abs(slope)<1e-9){if(gap< -3e-7){hullFailure=1.;return false;}}else if(slope<0.){float t=gap/slope;if(t>enter){enter=t;enterN=plane.xyz;}}else{float t=gap/slope;if(t<exit){exit=t;exitN=-plane.xyz;}}if(exit<enter-3e-7){hullFailure=2.;return false;}}distance=requiredSide>0.?enter:exit;if(distance<=0.||distance>50.){hullFailure=3.;return false;}point=o+d*distance;normal=normalize(transpose(mat3(inversePrism))*(requiredSide>0.?enterN:exitN));hullFallbackCount+=1.;return true;}
    bool glassHit`)
  .replace('if(!hit||distance<0.){point=o;normal=vec3(0);return false;}','if(!hit||distance<1e-6){point=o;normal=vec3(0);return hullHit(o,d,point,normal,distance);}')
  .replace('uniform float sigmaT,sigmaS,radius,ior,epsilon;','uniform float sigmaT,sigmaS,radius,epsilon;float ior;')
  .replace('float fieldRadiance',`vec4 nodeFetch(int index,int row){int id=(nodeBase+index)*2+row;return texelFetch(nodeMap,ivec2(id%256,id/256),0);}
    vec4 beamFetch(int index,int row){int id=(beamBase+index)*2+row;return texelFetch(beamMap,ivec2(id%256,id/256),0);}
    ${sellmeierGLSL}
    void setBand(int band){vec4 meta=texelFetch(spectralMeta,ivec2(band,0),0),color=texelFetch(spectralMeta,ivec2(band,1),0);nodeCount=int(meta.y);nodeBase=int(meta.z);beamBase=int(meta.w);ior=silicaIOR(flatIOR?550.:color.w);}
    vec4 orientedFetch(int index,int row){int id=(nodeBase+index)*4+row;return texelFetch(orientedMap,ivec2(id%256,id/256),0);}
    bool orientedRay(int index,vec3 o,vec3 d,float end){if(!orientedEnabled)return true;vec4 center=orientedFetch(index,0);if(center.w<.5)return true;vec4 u=orientedFetch(index,1),v=orientedFetch(index,2),a=orientedFetch(index,3);vec3 q=o-center.xyz,origin=vec3(dot(q,u.xyz),dot(q,v.xyz),dot(q,a.xyz)),direction=vec3(dot(d,u.xyz),dot(d,v.xyz),dot(d,a.xyz)),halfSize=vec3(u.w,v.w,a.w);return boxHit(origin,direction,-halfSize,halfSize,end);}
    bool orientedPoint(int index,vec3 p){if(!orientedEnabled)return true;vec4 center=orientedFetch(index,0);if(center.w<.5)return true;vec4 u=orientedFetch(index,1),v=orientedFetch(index,2),a=orientedFetch(index,3);vec3 q=p-center.xyz;return abs(dot(q,u.xyz))<=u.w&&abs(dot(q,v.xyz))<=v.w&&abs(dot(q,a.xyz))<=a.w;}
    float fieldRadiance`)
  .replace('if(!boxHit(o,d,lo.xyz,hi.xyz,maxT))','if(!boxHit(o,d,lo.xyz,hi.xyz,maxT)||!orientedRay(cursor,o,d,maxT))')
  .replace('if(any(lessThan(point,lo.xyz))||any(greaterThan(point,hi.xyz)))','if(any(lessThan(point,lo.xyz))||any(greaterThan(point,hi.xyz))||!orientedPoint(cursor,point))')
  .replaceAll('texelFetch(nodeMap,ivec2(cursor,0),0)','nodeFetch(cursor,0)')
  .replaceAll('texelFetch(nodeMap,ivec2(cursor,1),0)','nodeFetch(cursor,1)')
  .replaceAll('texelFetch(beamMap,ivec2(index,0),0)','beamFetch(index,0)')
  .replaceAll('texelFetch(beamMap,ivec2(index,1),0)','beamFetch(index,1)')
  .replace('o=hit+d*epsilon-normal*epsilon','o=hit-normal*epsilon*.02')
  .replace('o=p+d*epsilon+n*epsilon','o=p+n*epsilon*.02')
  .replace('hit+normal*epsilon,reflect(direction,normal)','hit+reflect(direction,normal)*epsilon,reflect(direction,normal)')
  .replace('p-n*epsilon,normalize(transmitted)','p+normalize(transmitted)*epsilon,normalize(transmitted)')
  .replace('remaining=0.;failureKind=0.;','remaining=0.;failureKind=0.;requiredSide=1.;hullFallbackCount=0.;hullFailure=0.;missingOrigin=vec3(0);missingDirection=vec3(0);')
  .replace('for(int bounce=0;','requiredSide=-1.;for(int bounce=0;')
  .replace('remaining=weight*ior*ior;failureKind=2.;break;','remaining=weight*ior*ior;failureKind=2.;missingOrigin=o;missingDirection=d;break;')
  .replace('float failureKind;',capGLSL.replace('if(accelerateCaps){','if(!accelerateCaps)return glassHit(o,d,point,normal,distance);{').replace('}return glassHit(o,d,point,normal,distance);','}return hullHit(o,d,point,normal,distance);')+'float failureKind;')
  .replace('if(!glassHit(o,d,p,n,dist))','if(!internalHit(o,d,p,n,dist))')
  .replace('float failureKind;','vec3 carriedOrigin,carriedDirection;float carriedWeight,carriedDistance;float failureKind;')
  .replace('remaining=0.;failureKind=0.;','remaining=0.;failureKind=0.;carriedOrigin=vec3(0);carriedDirection=vec3(0);carriedWeight=0.;carriedDistance=0.;')
  .replace('return value*exp(-sigmaT*distance);','carriedOrigin=o;carriedDirection=d;carriedWeight=weight;carriedDistance=distance;return value*exp(-sigmaT*distance);');

export class SpectralObserver extends ObserverOptics{
  constructor(geometry,dummy){super(geometry,dummy);const original=this.material;
    const cap=capAccelerator(geometry);this.cap=cap;
    Object.assign(this.uniforms,{capEdges:{value:cap.edges},sidePlanes:{value:cap.sides.map(s=>s.plane)},sideExtents:{value:cap.sides.map(s=>s.extent)},capZ:{value:new Vector2(cap.min,cap.max)},accelerateCaps:{value:true},orientedMap:{value:null},orientedEnabled:{value:true},hullPlanes:{value:null},hullPlaneCount:{value:0},spectralMeta:{value:null},bandIndex:{value:0},bandCount:{value:0},flatIOR:{value:false},hasSource:{value:true},checker:{value:-1}});
    // BVH's barycentric seam epsilon also accepts tiny negative ray distances.
    // Reject these inside traversal, so a self-hit cannot hide the next surface.
    const prefix=original.fragmentShader.slice(0,original.fragmentShader.indexOf(transportGLSL)).replace('bool intersectTriangles(','float requiredSide=0.;\nbool intersectTriangles(').replace('&& localDist < minDistance','&& localDist > 0. && localDist < minDistance && (requiredSide==0.||localSide==requiredSide)');const vertex=original.vertexShader;
    this.material=new ShaderMaterial({toneMapped:false,uniforms:this.uniforms,defines:{...original.defines,OBSERVER_BOUNCES:32},vertexShader:vertex,fragmentShader:prefix+spectrumGLSL+`
      uniform int checker;varying vec3 vWorld;layout(location=1) out vec4 rayAnchor;layout(location=2) out vec4 pathOrigin;layout(location=3) out vec4 pathDirection;
      void main(){if(checker>=0&&(int(gl_FragCoord.x)%2+2*(int(gl_FragCoord.y)%2))!=checker)discard;rayAnchor=vec4(vWorld,1.);if(!hasSource){gl_FragColor=vec4(0.);return;}setBand(bandIndex);float remaining;float value=observe(cameraPosition,normalize(vWorld-cameraPosition),remaining);pathOrigin=vec4(carriedOrigin,carriedWeight);pathDirection=vec4(carriedDirection,carriedDistance);gl_FragColor=vec4(vec3(value),remaining);}`});
    this.previewMaterial=new ShaderMaterial({toneMapped:false,uniforms:this.uniforms,defines:{...original.defines},vertexShader:vertex,fragmentShader:prefix+spectrumGLSL+`
      varying vec3 vWorld;void main(){vec3 result=vec3(0);if(hasSource){for(int band=0;band<64;band++){if(band>=bandCount)break;setBand(band);float remain;float value=observe(cameraPosition,normalize(vWorld-cameraPosition),remain);result+=value*texelFetch(spectralMeta,ivec2(band,1),0).rgb;}}gl_FragColor=vec4(result,1.);}`});
    this.tailMaterial=new ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,uniforms:this.uniforms,defines:{...original.defines},vertexShader: `attribute vec4 pathOrigin,pathDirection;attribute float waveIndex;varying vec4 vOrigin,vDirection;varying float vBand;void main(){vOrigin=pathOrigin;vDirection=pathDirection;vBand=waveIndex;gl_Position=vec4(position.xy,0.,1.);gl_PointSize=1.;}`,fragmentShader:prefix+spectrumGLSL+`
      varying vec4 vOrigin,vDirection;varying float vBand;layout(location=1) out vec4 nextOrigin;layout(location=2) out vec4 nextDirection;
      void main(){setBand(int(vBand+.5));requiredSide=-1.;hullFallbackCount=0.;hullFailure=0.;vec3 o=vOrigin.xyz,d=vDirection.xyz;float weight=vOrigin.w,value=0.,remaining=0.,failure=0.,steps=0.;
        for(int bounce=0;bounce<32;bounce++){if(weight*ior*ior<1e-7){remaining=weight*ior*ior;break;}vec3 p,n;float dist;if(!internalHit(o,d,p,n,dist)){remaining=weight*ior*ior;failure=2.;break;}
          float c=clamp(-dot(d,n),0.,1.),r=interfaceF(c,ior,1.);vec3 transmitted=refract(d,n,ior);if(r<1.&&dot(transmitted,transmitted)>.5)value+=weight*(1.-r)*ior*ior*airRadiance(p+normalize(transmitted)*epsilon,normalize(transmitted));
          weight*=r;d=normalize(reflect(d,n));o=p+n*epsilon*.02;steps+=1.;remaining=weight*ior*ior;}
        nextOrigin=vec4(o,weight);nextDirection=vec4(d,vDirection.w);gl_FragColor=vec4(value*exp(-sigmaT*vDirection.w),remaining,failure,steps);}`});original.dispose();
  }
  useAtlas(atlas,bands,flat,source){this.uniforms.orientedMap.value=atlas.oriented;this.uniforms.beamMap.value=atlas.beams;this.uniforms.nodeMap.value=atlas.nodes;this.uniforms.spectralMeta.value=atlas.meta;this.uniforms.bandCount.value=bands.length;this.uniforms.flatIOR.value=flat;this.uniforms.hasSource.value=source;}
  dispose(){this.previewMaterial.dispose();this.tailMaterial.dispose();super.dispose();}
}
