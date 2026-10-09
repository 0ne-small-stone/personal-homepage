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
    // A sparse curved surface in the right light field, measured in CSS pixels.
    // It shares this texture's sampling, flow, fade and disposal with the bricks.
    const spacing = mobile ? 72 : 80;
    const weight = (x: number, y: number) => {
      const u = x / size.width, v = y / size.height;
      const distance = Math.hypot((u - 1.04) / .31, (v - .64) / .58);
      const field = 1 - MathUtils.smoothstep(distance, .18, 1);
      const edge = MathUtils.smoothstep(u, .74, .92);
      const top = MathUtils.smoothstep(v, .12, .22);
      const bottom = 1 - MathUtils.smoothstep(v, mobile ? .55 : .78, mobile ? .7 : .93);
      const title = (1 - MathUtils.smoothstep(u, .86, .94))
        * MathUtils.smoothstep(v, .2, .3) * (1 - MathUtils.smoothstep(v, .64, .74));
      // Two crossing strokes stay below the layer's .08 opacity ceiling.
      return .04 * field * edge * top * bottom * (1 - .75 * title);
    };
    const gridLine = (point: (t: number) => [number, number]) => {
      const start = point(0), end = point(1);
      const ink = ctx.createLinearGradient(...start, ...end);
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, [x, y] = point(t);
        ink.addColorStop(t, `rgba(237,237,237,${weight(x, y)})`);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ink; ctx.stroke();
    };
    ctx.save();
    ctx.translate(frameX(0), frameY(0));
    ctx.scale(width / (overscan * size.width), height / (overscan * size.height));
    ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let x = size.width * .76; x <= size.width * 1.12; x += spacing) {
      gridLine(t => {
        const v = .1 + .88 * t;
        return [x + size.width * .045 * Math.cos((v - .55) * Math.PI), size.height * v];
      });
    }
    for (let y = size.height * .1; y <= size.height * .98; y += spacing) {
      gridLine(t => {
        const u = .74 + .38 * t;
        return [size.width * u, y + size.height * .08 * ((u - 1.05) / .32) ** 2];
      });
    }
    ctx.restore();
    const beam=ctx.createLinearGradient(0,height*.390625,width,height*.56);
    beam.addColorStop(0,'#000');beam.addColorStop(.4,'#222');beam.addColorStop(.7,'#b2b2b2');beam.addColorStop(1,'#444');
    ctx.strokeStyle=beam;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(frameX(.09765625),frameY(.677083));ctx.bezierCurveTo(frameX(.345052),frameY(.638021),frameX(.651042),frameY(.234375),frameX(1),frameY(.351563));ctx.stroke();
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [width, height, mobile, size.width, size.height]);
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
