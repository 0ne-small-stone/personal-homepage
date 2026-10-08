import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextureLoader, SRGBColorSpace, MathUtils, type Group } from 'three';
import type { JourneyModel } from './scene-state';

export default function ProjectScene({model, mobile, wordmarkUrl}: {model: JourneyModel; mobile: boolean; wordmarkUrl: string}) {
  const group = useRef<Group>(null);
  const texture = useLoader(TextureLoader,wordmarkUrl);
  const {viewport} = useThree();
  const geometry = useMemo(()=>new RoundedBoxGeometry(3.8,2.54,.1,2,.04),[]);
  useEffect(()=>{texture.colorSpace=SRGBColorSpace;return ()=>geometry.dispose();},[texture,geometry]);
  useFrame(()=>{
    if(!group.current)return;
    const enter=MathUtils.smoothstep(model.progress,.65,1);
    const exit=MathUtils.smoothstep(model.progress,1.65,2);
    group.current.visible=model.progress>.65&&model.progress<2;
    group.current.position.set((mobile?0:viewport.width*.2)+(1-enter)*viewport.width-exit*viewport.width, mobile?viewport.height*.19:viewport.height*.08, -.5-exit*3);
    group.current.rotation.set(.02,-.15+exit*.45,-.03);
    group.current.scale.setScalar(mobile?Math.min(.66,viewport.width/3.8*.86):.86);
  },-1);
  return <group ref={group}>
    <mesh geometry={geometry}><meshStandardMaterial color="#1f1f1f" roughness={.68} metalness={.1} /></mesh>
    <mesh position={[0,0,.058]}><planeGeometry args={[3.68,2.45]} /><meshBasicMaterial map={texture} transparent toneMapped={false} /></mesh>
    <mesh geometry={geometry} position={[.55,.3,-.7]} rotation={[0,.15,.06]}><meshStandardMaterial color="#101010" roughness={.8} /></mesh>
  </group>;
}
