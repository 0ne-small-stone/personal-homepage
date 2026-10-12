import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, MathUtils, type Group } from 'three';
import type { JourneyModel } from './scene-state';
export default function RadioScene({model,mobile}: {model:JourneyModel;mobile:boolean}) {
  const ref=useRef<Group>(null);const {viewport}=useThree();
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#090909';ctx.fillRect(0,0,1024,1024);
    for(let r=205;r<510;r+=3){ctx.beginPath();ctx.arc(512,512,r,0,Math.PI*2);ctx.strokeStyle=r%2===0?'#252525':'#171717';ctx.lineWidth=1;ctx.stroke();}
    ctx.beginPath();ctx.arc(512,512,190,0,Math.PI*2);ctx.fillStyle='#e8e4dc';ctx.fill();
    ctx.textAlign='center';ctx.fillStyle='#272a2c';ctx.font='400 38px "IBM Plex Sans",sans-serif';ctx.fillText('Pink Floyd',512,458);ctx.font='500 70px "IBM Plex Sans",sans-serif';ctx.fillText('Echoes',512,546);
    ctx.beginPath();ctx.arc(512,590,10,0,Math.PI*2);ctx.fillStyle='#121212';ctx.fill();
    const t=new CanvasTexture(canvas);t.colorSpace=SRGBColorSpace;return t;
  },[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  useFrame(()=>{
    if(!ref.current)return;const enter=MathUtils.smoothstep(model.progress,1.65,2),exit=MathUtils.smoothstep(model.progress,2.65,3);
    ref.current.visible=model.progress>1.65&&model.progress<3;
    ref.current.position.set((mobile?0:viewport.width*.2)+(1-enter)*viewport.width*.7, (mobile?viewport.height*.2:viewport.height*.09)+exit*viewport.height*.6, -.35-exit*4);
    ref.current.rotation.set(.08,-.24, -.14+exit*.2);ref.current.scale.setScalar(mobile?Math.min(.67,viewport.width/3*.86):.9);
  },-1);
  return <group ref={ref}>
    <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[1.5,1.5,.05,80]} /><meshStandardMaterial color="#151515" roughness={.3} metalness={.35} /></mesh>
    <mesh position={[0,0,.028]}><circleGeometry args={[1.495,80]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
  </group>;
}
