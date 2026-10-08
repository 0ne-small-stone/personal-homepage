import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, type Mesh, type MeshBasicMaterial, MathUtils } from 'three';
import type { JourneyModel } from './scene-state';

export default function SceneBackdrop({ model, mobile }: { model: JourneyModel; mobile: boolean }) {
  const ref = useRef<Mesh>(null);
  const { viewport } = useThree();
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 768;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,1536,768);
    for (let row=0;row<6;row++) for(let col=-1;col<8;col++) {
      const x=col*256+(row%2)*128, y=row*128;
      const gradient=ctx.createLinearGradient(x,y,x+256,y+128);
      gradient.addColorStop(0,'#111'); gradient.addColorStop(1,'#050505');
      ctx.fillStyle=gradient;ctx.fillRect(x+1,y+1,254,126);
    }
    const beam=ctx.createLinearGradient(0,300,1536,430);
    beam.addColorStop(0,'#000');beam.addColorStop(.4,'#222');beam.addColorStop(.7,'#b2b2b2');beam.addColorStop(1,'#444');
    ctx.strokeStyle=beam;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(150,520);ctx.bezierCurveTo(530,490,1000,180,1536,270);ctx.stroke();
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    if (!ref.current) return;
    const fade = 1 - MathUtils.smoothstep(model.progress, .6, 1);
    ref.current.visible = fade > .001;
    (ref.current.material as MeshBasicMaterial).opacity = fade;
    ref.current.position.set(mobile ? 0 : viewport.width * .12, mobile ? viewport.height * .2 : 0, -2);
  },-1);
  return <mesh ref={ref} scale={[mobile ? 6 : 12, mobile ? 3 : 6, 1]} position={[0,0,-2]}>
    <planeGeometry /><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}
