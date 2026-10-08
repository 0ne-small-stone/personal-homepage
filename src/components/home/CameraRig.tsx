import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera, Vector2 } from 'three';
import type { JourneyModel } from './scene-state';
import { sceneUnitScale } from './works-motion';
const sigmoid=(t:number)=>{const f=(x:number)=>1/(1+Math.exp(-6*(x-.5)));return(f(t)-f(0))/(f(1)-f(0));};
export default function CameraRig({model,mobile:_mobile,quiet}: {model:JourneyModel;mobile:boolean;quiet:boolean}){
  const transition=useRef({from:1,value:1,target:1,start:0});
  const initialized=useRef(-1);
  const offset=useRef(new Vector2());const {camera,size}=useThree();
  useEffect(()=>{camera.layers.enable(1);return()=>camera.layers.disable(1);},[camera]);
  useFrame((_,rawDt)=>{
    if(!(camera instanceof PerspectiveCamera))return;
    if(quiet){camera.position.set(0,0,6);camera.fov=40;camera.updateProjectionMatrix();camera.lookAt(0,0,0);return;}
    const zoom=transition.current,target=model.motion.phase==='kv'?1:0,time=performance.now();
    if(initialized.current!==model.motion.initialization.revision){
      initialized.current=model.motion.initialization.revision;
      Object.assign(zoom,{from:target,value:target,target,start:time});
    }
    if(target!==zoom.target)Object.assign(zoom,{from:zoom.value,target,start:time});
    zoom.value=MathUtils.lerp(zoom.from,zoom.target,sigmoid(MathUtils.clamp((time-zoom.start)/1000,0,1)));
    const dt=Math.min(rawDt,1/30);offset.current.lerp(new Vector2(model.pointer.x*.5,model.pointer.y*.5),Math.min(3*dt,1));
    camera.position.set(offset.current.x*sceneUnitScale,offset.current.y*sceneUnitScale,(10-.5*zoom.value)*sceneUnitScale);
    camera.fov=35+18/(size.width/size.height)-4*zoom.value;camera.updateProjectionMatrix();camera.lookAt(0,0,0);
    model.motion.camera={position:camera.position.toArray(),fov:camera.fov};
  },-2);
  return null;
}
