import { useEffect, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { MathUtils, TextureLoader, SRGBColorSpace, type Group } from 'three';
import type { JourneyModel } from './scene-state';
export default function AlbumScene({model,mobile,photoUrl}: {model:JourneyModel;mobile:boolean;photoUrl:string}){
  const ref=useRef<Group>(null);const texture=useLoader(TextureLoader,photoUrl);const {viewport}=useThree();
  useEffect(()=>{texture.colorSpace=SRGBColorSpace;document.body.classList.add('home-photo-ready');return()=>document.body.classList.remove('home-photo-ready');},[texture]);
  useFrame(()=>{
    if(!ref.current)return;const enter=MathUtils.smoothstep(model.progress,2.65,3),exit=MathUtils.smoothstep(model.progress,3.65,4);
    ref.current.visible=model.progress>2.65&&model.progress<4;
    ref.current.position.set((mobile?0:viewport.width*.2)+(1-enter)*viewport.width*.55-exit*viewport.width*.45,mobile?viewport.height*.19:viewport.height*.07,-.35-(1-enter)*3-exit*4);
    ref.current.rotation.set(.04,-.1+exit*.35,.025);ref.current.scale.setScalar(mobile?Math.min(.66,viewport.width/3.7*.86):.86);
  },-1);
  return <group ref={ref}>
    <mesh position={[.55,.3,-.9]} rotation={[0,.16,.04]}><planeGeometry args={[3.7,2.46]} /><meshBasicMaterial map={texture} color="#505050" toneMapped={false} /></mesh>
    <mesh><planeGeometry args={[3.7,2.46]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
  </group>;
}
