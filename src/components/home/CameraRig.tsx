import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Matrix4, PerspectiveCamera, Vector2 } from 'three';
import type { JourneyModel } from './scene-state';
import { MotionLerper, sceneUnitScale } from './works-motion';
const sigmoid=(t:number)=>{const f=(x:number)=>1/(1+Math.exp(-6*(x-.5)));return(f(t)-f(0))/(f(1)-f(0));};
export default function CameraRig({model,mobile:_mobile,quiet}: {model:JourneyModel;mobile:boolean;quiet:boolean}){
  const transition=useRef({from:1,value:1,target:1,start:0});
  const initialized=useRef(-1);
  const dimensions=useRef('');
  const projectionFollow=useRef(new MotionLerper(1)),parallaxFollow=useRef(new MotionLerper(.5));
  const perspective=useRef(new Matrix4()),orthographic=useRef(new Matrix4());
  const offset=useRef(new Vector2()),offsetTarget=useRef(new Vector2());const {camera,size}=useThree();
  useEffect(()=>{camera.layers.enable(1);return()=>camera.layers.disable(1);},[camera]);
  useFrame((_,rawDt)=>{
    if(!(camera instanceof PerspectiveCamera))return;
    if(quiet){camera.position.set(0,0,6);camera.fov=40;camera.updateProjectionMatrix();camera.lookAt(0,0,0);return;}
    const zoom=transition.current,target=model.motion.phase==='kv'?1:0,time=performance.now();
    const resized=dimensions.current!==`${size.width}:${size.height}`;
    if(initialized.current!==model.motion.initialization.revision||resized){
      initialized.current=model.motion.initialization.revision;
      dimensions.current=`${size.width}:${size.height}`;
      Object.assign(zoom,{from:target,value:target,target,start:time});
      projectionFollow.current.reset(model.motion.raw.outro);parallaxFollow.current.reset(model.motion.raw.outro);
      offset.current.set(model.pointer.x*.5*(1-model.motion.raw.outro),model.pointer.y*.5*(1-model.motion.raw.outro));
    }
    if(target!==zoom.target)Object.assign(zoom,{from:zoom.value,target,start:time});
    zoom.value=MathUtils.lerp(zoom.from,zoom.target,sigmoid(MathUtils.clamp((time-zoom.start)/1000,0,1)));
    const outro=projectionFollow.current.read(model.motion.raw.outro),parallax=parallaxFollow.current.read(model.motion.raw.outro);
    const dt=Math.min(rawDt,1/30);offsetTarget.current.set(model.pointer.x*.5*(1-parallax),model.pointer.y*.5*(1-parallax));
    offset.current.lerp(offsetTarget.current,Math.min(3*dt,1));
    camera.position.set(offset.current.x*sceneUnitScale,offset.current.y*sceneUnitScale,(10-.5*zoom.value)*sceneUnitScale);
    const aspect=size.width/size.height;camera.aspect=aspect;
    camera.fov=35+18/aspect-4*zoom.value;camera.updateProjectionMatrix();camera.lookAt(0,0,0);
    perspective.current.copy(camera.projectionMatrix);
    const x=4*sceneUnitScale*Math.max(1,aspect),y=4*sceneUnitScale/Math.min(1,aspect);
    orthographic.current.makeOrthographic(-x,x,y,-y,camera.near,camera.far,camera.coordinateSystem);
    for(let i=0;i<16;i++)camera.projectionMatrix.elements[i]=MathUtils.lerp(perspective.current.elements[i],orthographic.current.elements[i],outro);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    model.motion.camera={position:camera.position.toArray(),fov:camera.fov,outro:{raw:model.motion.raw.outro,parallax,projection:outro},offset:offset.current.toArray(),offsetTarget:offsetTarget.current.toArray()};
    if(document.documentElement.dataset.motionDiagnostics==='true')Object.assign(model.motion.camera,{projection:camera.projectionMatrix.toArray(),inverse:camera.projectionMatrixInverse.toArray(),perspective:perspective.current.toArray(),orthographic:orthographic.current.toArray()});
    projectionFollow.current.update(rawDt);parallaxFollow.current.update(rawDt);
  },-2);
  return null;
}
