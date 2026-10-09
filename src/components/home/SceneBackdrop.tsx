import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, Vector3, type Mesh, type MeshBasicMaterial, MathUtils } from 'three';
import type { JourneyModel } from './scene-state';

export default function SceneBackdrop({ model, mobile }: { model: JourneyModel; mobile: boolean }) {
  const ref = useRef<Mesh>(null);
  const { viewport, camera, size } = useThree();
  const aspect = size.width / size.height;
  const width = mobile ? 768 : 1536, height = Math.round(width / aspect);
  const overscan = 1.12;
  const center = useMemo(() => new Vector3(0, 0, -2), []);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const brickWidth = mobile ? 128 : 256, brickHeight = brickWidth / 2;
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,width,height);
    for (let row=0;row<Math.ceil(height/brickHeight);row++) for(let col=-1;col<=Math.ceil(width/brickWidth);col++) {
      const x=col*brickWidth+(row%2)*brickWidth/2, y=row*brickHeight;
      const gradient=ctx.createLinearGradient(x,y,x+brickWidth,y+brickHeight);
      gradient.addColorStop(0,'#111'); gradient.addColorStop(1,'#050505');
      ctx.fillStyle=gradient;ctx.fillRect(x+1,y+1,brickWidth-2,brickHeight-2);
    }
    // SYSTEM 9.3.1 coordinates describe the visible frame, within the overscan.
    const frameX = (x: number) => width * (.5 + (x - .5) / overscan);
    const frameY = (y: number) => height * (.5 + (y - .5) / overscan);
    const edgeLight = (x: number, y: number, rx: number, ry: number, color: string) => {
      ctx.save();
      ctx.translate(frameX(x), frameY(y)); ctx.scale(width * rx / overscan, height * ry / overscan);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      const value = parseInt(color.slice(1, 3), 16);
      gradient.addColorStop(0, color);
      gradient.addColorStop(.25, `rgba(${value},${value},${value},.55)`);
      gradient.addColorStop(.5, `rgba(${value},${value},${value},.16)`);
      gradient.addColorStop(.8, `rgba(${value},${value},${value},.025)`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gradient; ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    };
    edgeLight(1.04, .64, .26, .48, '#484848');
    edgeLight(-.08, .22, .22, .35, '#282828');
    const beam=ctx.createLinearGradient(0,height*.390625,width,height*.56);
    beam.addColorStop(0,'#000');beam.addColorStop(.4,'#222');beam.addColorStop(.7,'#b2b2b2');beam.addColorStop(1,'#444');
    ctx.strokeStyle=beam;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(frameX(.09765625),frameY(.677083));ctx.bezierCurveTo(frameX(.345052),frameY(.638021),frameX(.651042),frameY(.234375),frameX(1),frameY(.351563));ctx.stroke();
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [width, height, mobile]);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    if (!ref.current) return;
    const fade = 1 - MathUtils.smoothstep(model.progress, .6, 1);
    ref.current.visible = fade > .001;
    (ref.current.material as MeshBasicMaterial).opacity = fade;
    const view = viewport.getCurrentViewport(camera, center);
    ref.current.position.copy(center);
    ref.current.scale.set(view.width * overscan, view.height * overscan, 1);
  },-1);
  return <mesh ref={ref} position={[0,0,-2]}>
    <planeGeometry /><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}
