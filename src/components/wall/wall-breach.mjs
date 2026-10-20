import * as THREE from 'three';

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=(a,b,x)=>{const p=clamp((x-a)/(b-a));return p*p*(3-2*p);};
const random=n=>{n=Math.imul(n^n>>>16,0x45d9f3b);n=Math.imul(n^n>>>16,0x45d9f3b);return ((n^n>>>16)>>>0)/4294967296;};
export const BREACH_DURATION=2.35;
export const polygonArea=face=>Math.abs(face.reduce((s,p,i)=>{const q=face[(i+1)%face.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2);
function centroid(face){let a=0,x=0,y=0;face.forEach((p,i)=>{const q=face[(i+1)%face.length],cross=p[0]*q[1]-q[0]*p[1];a+=cross;x+=(p[0]+q[0])*cross;y+=(p[1]+q[1])*cross;});return [x/(3*a),y/(3*a)];}

// Convex Voronoi cells share exact cuts. No gaps are manufactured by scaling faces.
function clip(face,nx,ny,limit){
  const result=[];
  for(let i=0;i<face.length;i++){
    const a=face[i],b=face[(i+1)%face.length],da=a[0]*nx+a[1]*ny-limit,db=b[0]*nx+b[1]*ny-limit;
    if(da<=1e-8)result.push(a);
    if((da<0)!==(db<0)){const t=da/(da-db);result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
  }
  return result;
}
export function fractureFaces(width,height,seed,count){
  const rectangle=[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]];
  if(count===1)return [rectangle];
  const sites=Array.from({length:count},(_,i)=>[(i/(count-1)-.5)*width*.72+(random(seed+i*13)-.5)*width*.12,(random(seed+i*29+71)-.5)*height*.75]);
  const faces=sites.map((a,i)=>sites.reduce((face,b,j)=>i===j?face:clip(face,b[0]-a[0],b[1]-a[1],(b[0]**2+b[1]**2-a[0]**2-a[1]**2)/2),rectangle));
  return faces.map(face=>face.flatMap((a,i)=>{
    const b=face[(i+1)%face.length],outer=Math.abs(a[0]-b[0])<1e-5&&Math.abs(Math.abs(a[0])-width/2)<1e-5||Math.abs(a[1]-b[1])<1e-5&&Math.abs(Math.abs(a[1])-height/2)<1e-5;
    if(outer||Math.hypot(a[0]-b[0],a[1]-b[1])<12)return [a];
    const forward=a[0]<b[0]||Math.abs(a[0]-b[0])<1e-7&&a[1]<b[1],start=forward?a:b,end=forward?b:a,dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy);
    const key=seed+Math.round(start[0]*113+start[1]*41+end[0]*271+end[1]*79);
    const cuts=[.32,.66].map((t,j)=>{const edge=(random(key+j*31)-.5)*2.4;return [start[0]+dx*t-dy/length*edge,start[1]+dy*t+dx/length*edge];});
    return [a,...(forward?cuts:cuts.reverse())];
  }));
}
export function breachPieces(tiles,origin,width,height){
  const diagonal=Math.hypot(width,height),pieces=[];
  tiles.forEach((tile,tileIndex)=>{
    if(tile.width<=0||tile.height<=0||tile.x+tile.width<-4||tile.x>width+4||tile.y+tile.height<-4||tile.y>height+4)return;
    const tcx=tile.x+tile.width/2,tcy=tile.y+tile.height/2,distance=Math.hypot(tcx-origin.x,tcy-origin.y);
    const seed=(Math.round(tile.x)*73856093^Math.round(tile.y)*19349663)>>>0;
    const count=distance<Math.min(diagonal*.23,310)?(distance<Math.min(diagonal*.12,155)?3:2):1;
    const faces=fractureFaces(tile.width,tile.height,seed,count);
    faces.forEach((face,index)=>{
      const area=polygonArea(face),[cx,cy]=centroid(face);
      const dx=tcx+cx-origin.x,dy=tcy+cy-origin.y,length=Math.max(1,Math.hypot(dx,dy)),r=random(seed+index*37+113);
      pieces.push({face:face.map(p=>[p[0]-cx,p[1]-cy]),cx:tcx+cx,cy:tcy+cy,tileIndex,tile,area,mass:area/(tile.width*tile.height),
        split:count>1,seed:seed+index*37,r,ux:dx/length,uy:dy/length,distance,diagonal,width,height,
        depth:26+r*9,delay:.1+clamp(distance/(diagonal*.75))*.5+r*.045});
    });
  });
  return pieces;
}
export function breachCamera(time,origin,width,height){
  const distance=Math.max(width,height)*1.05+600,travel=smooth(.48,BREACH_DURATION,time);
  return {distance,travel,x:(origin.x-width/2)*travel,y:(height/2-origin.y)*travel,z:distance*(1-.82*travel)};
}
export function breachPose(piece,time,origin){
  const duration=1.36+Math.sqrt(piece.mass)*.16,p=clamp((time-piece.delay)/duration),accelerate=p**1.85;
  const pressure=Math.sin(clamp(time/piece.delay)*Math.PI)*Math.exp(-((piece.distance/(piece.diagonal*.26))**2));
  const f=Math.max(piece.width,piece.height)*1.05+600,turn=smooth(0,.88,p);
  const out=piece.diagonal*(.12+piece.r*.055)*accelerate;
  return {p,backing:1-smooth(.015,.19,p),
    position:[piece.cx-piece.width/2+piece.ux*out, piece.height/2-piece.cy-piece.uy*out-piece.height*(.16+piece.r*.12)*p*p,
      f*(.9+piece.r*.16)*p**2.05-pressure*7],
    rotation:[piece.uy*(.48+piece.r*.6)*turn,piece.ux*(.6+piece.r*.65)*turn,(piece.r-.5)*.30*turn]};
}
export function fragmentGeometry(piece){
  const shape=new THREE.Shape();piece.face.forEach(([x,y],i)=>i?shape.lineTo(x,-y):shape.moveTo(x,-y));shape.closePath();
  const bevel=piece.split?.65:1.2;
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:piece.depth,bevelEnabled:true,bevelSize:piece.split?.65:1.3,bevelThickness:bevel,bevelSegments:piece.split?1:2,steps:1,curveSegments:1});
  geometry.translate(0,0,-piece.depth-bevel);
  const position=geometry.attributes.position,uv=geometry.attributes.uv;
  for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i)/piece.tile.width+.5,position.getY(i)/piece.tile.height+.5);
  return geometry;
}

function chalkTexture(){
  const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,128,128);
  for(let i=0;i<1200;i++){const x=random(i*7+5)*128,y=random(i*11+9)*128;ctx.fillStyle='rgba(76,82,68,'+(.015+random(i+3)*.035)+')';ctx.fillRect(x,y,random(i+13)*1.7+.4,.4+random(i+31));}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function sculptedWorld(canvas,pieces,origin,d){
  const w=d.viewWidth,h=d.viewHeight,ratio=Math.min(devicePixelRatio||1,1.35,Math.sqrt(2200000/(w*h)));
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);canvas.style.width=w+'px';canvas.style.height=h+'px';
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),f=breachCamera(0,origin,w,h).distance;
  camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(h/(2*f)));camera.aspect=w/h;camera.near=8;camera.far=f*5;camera.updateProjectionMatrix();
  scene.add(new THREE.AmbientLight('#f2f3ef',1.15));scene.add(new THREE.HemisphereLight('#ffffff','#60645c',1.35));
  const light=new THREE.DirectionalLight('#ffffff',3.1);light.position.set(-w*.48,h*.8,f*.7);light.castShadow=true;
  light.shadow.mapSize.set(w<651?768:1536,w<651?768:1536);Object.assign(light.shadow.camera,{left:-w*.8,right:w*.8,top:h*.8,bottom:-h*.8,near:1,far:f*4});
  light.shadow.bias=-.00016;light.shadow.normalBias=.8;light.shadow.radius=3.2;light.shadow.intensity=.82;scene.add(light);scene.add(light.target);
  const texture=chalkTexture(),front=new THREE.MeshStandardMaterial({color:'#fafbf7',map:texture,bumpMap:texture,bumpScale:.16,roughness:.96,metalness:0}),side=new THREE.MeshStandardMaterial({color:'#c1c3ba',bumpMap:texture,bumpScale:.55,roughness:1,metalness:0});
  const geometries=new Set(),materials=[front,side],objects=[],dummy=new THREE.Object3D();
  const wholes=pieces.filter(p=>!p.split),wholeGeometry=wholes.length?fragmentGeometry(wholes[0]):null;
  if(wholeGeometry)geometries.add(wholeGeometry);
  const wholeMesh=wholeGeometry?new THREE.InstancedMesh(wholeGeometry,[front,side],wholes.length):null;
  if(wholeMesh){wholeMesh.castShadow=true;wholeMesh.receiveShadow=true;wholeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);wholeMesh.frustumCulled=false;scene.add(wholeMesh);}
  let wholeIndex=0;
  for(const piece of pieces){
    const rgb=piece.tile.color||[229,230,222],color=new THREE.Color().setRGB(rgb[0]/255,rgb[1]/255,rgb[2]/255,THREE.SRGBColorSpace);
    if(!piece.split){wholeMesh.setColorAt(wholeIndex,color);objects.push({piece,index:wholeIndex++});}
    else{const geometry=fragmentGeometry(piece);geometries.add(geometry);const cap=front.clone();cap.color.copy(color);materials.push(cap);
      const mesh=new THREE.Mesh(geometry,[cap,side]);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);objects.push({piece,mesh});}
  }
  const tiles=[...new Map(pieces.map(p=>[p.tileIndex,p])).values()],backGeometry=new THREE.PlaneGeometry(1,1);geometries.add(backGeometry);
  const fades=new THREE.InstancedBufferAttribute(new Float32Array(tiles.length).fill(1),1);backGeometry.setAttribute('instanceFade',fades);
  const backMaterial=new THREE.MeshStandardMaterial({color:'#bfc3b6',roughness:1,transparent:true,depthWrite:false});materials.push(backMaterial);
  backMaterial.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float instanceFade; varying float vFade;').replace('#include <begin_vertex>','#include <begin_vertex>\nvFade=instanceFade;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vFade;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vFade;');
  };
  const backing=new THREE.InstancedMesh(backGeometry,backMaterial,tiles.length);backing.receiveShadow=true;backing.frustumCulled=false;scene.add(backing);
  tiles.forEach((p,i)=>{const t=p.tile;dummy.position.set(t.x+t.width/2-w/2,h/2-t.y-t.height/2,-p.depth-4);dummy.rotation.set(0,0,0);dummy.scale.set(t.width+4.5,t.height+4.5,1);dummy.updateMatrix();backing.setMatrixAt(i,dummy.matrix);});
  return {draw(time){
    const state=breachCamera(time,origin,w,h);camera.position.set(state.x,state.y,state.z);
    for(const {piece,mesh,index} of objects){const pose=breachPose(piece,time,origin);const object=mesh||dummy;object.position.set(...pose.position);object.rotation.set(...pose.rotation);
      if(!mesh){object.scale.set(piece.tile.width/wholes[0].tile.width,piece.tile.height/wholes[0].tile.height,piece.depth/wholes[0].depth);object.updateMatrix();wholeMesh.setMatrixAt(index,object.matrix);}}
    if(wholeMesh)wholeMesh.instanceMatrix.needsUpdate=true;
    tiles.forEach((p,i)=>fades.setX(i,breachPose(p,time,origin).backing));fades.needsUpdate=true;
    renderer.render(scene,camera);return {travel:state.travel,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
  },dispose(){for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();texture.dispose();light.shadow.map?.dispose();wholeMesh?.dispose();backing.dispose();const memory={...renderer.info.memory},loss=renderer.getContext().getExtension('WEBGL_lose_context');renderer.dispose();loss?.loseContext();scene.clear();return {...memory,contextReleased:Boolean(loss),retireCanvas:true};}};
}

// The only continuous clock is owned by this short reveal and always released.
export function mountBreach(canvas,stage,createWorld=sculptedWorld){
  let raf=0,timer=0,active=false,started=0,last=0,frames=0,world=null;
  function cancel(){cancelAnimationFrame(raf);clearTimeout(timer);raf=0;timer=0;active=false;const memory=world?.dispose();if(memory){stage.dataset.breachGeometries=String(memory.geometries);stage.dataset.breachTextures=String(memory.textures);stage.dataset.breachContext=memory.contextReleased?'released':'disposed';}world=null;canvas.hidden=true;canvas.width=1;canvas.height=1;if(memory?.retireCanvas){const next=canvas.cloneNode(false);canvas.replaceWith(next);canvas=next;}stage.dataset.breachState='idle';stage.dataset.breachResources='released';}
  return {cancel,start(tiles,origin,d,onComplete,onFrame=()=>{}){
    cancel();const pieces=breachPieces(tiles,origin,d.viewWidth,d.viewHeight);
    try{world=createWorld(canvas,pieces,origin,d);}catch{stage.dataset.breachMode='fallback';cancel();onComplete();return;}
    if(!world){stage.dataset.breachMode='fallback';onComplete();return;}
    stage.dataset.breachMode='sculpted';stage.dataset.breachResources='active';stage.dataset.breachPieces=String(pieces.length);stage.dataset.breachOrigin=origin.x.toFixed(1)+':'+origin.y.toFixed(1);
    active=true;canvas.hidden=false;last=0;frames=0;
    function draw(time){const state=world.draw(time)||{};onFrame(state);stage.dataset.breachProgress=(time/BREACH_DURATION).toFixed(3);stage.dataset.breachFrames=String(++frames);stage.dataset.breachDrawCalls=String(state.calls||0);stage.dataset.breachTriangles=String(state.triangles||0);}
    function finish(){if(!active)return;cancel();onComplete();}
    function tick(now){if(!active)return;const time=(now-started)/1000;if(time>=BREACH_DURATION){finish();return;}if(now-last>=1000/60-.5){draw(time);last=now;}raf=requestAnimationFrame(tick);}
    try{draw(0);}catch{stage.dataset.breachMode='fallback';cancel();onComplete();return;}
    started=performance.now();stage.dataset.breachState='active';raf=requestAnimationFrame(tick);timer=setTimeout(finish,(BREACH_DURATION+.25)*1000);
  }};
}

