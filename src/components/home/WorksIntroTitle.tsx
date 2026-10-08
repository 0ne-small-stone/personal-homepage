import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, Vector3, MathUtils, type Mesh, type MeshBasicMaterial } from 'three';
import type { JourneyModel } from './scene-state';

export default function WorksIntroTitle({ model }: { model: JourneyModel }) {
  const mesh = useRef<Mesh>(null), material = useRef<MeshBasicMaterial>(null);
  const { camera, viewport, size } = useThree();
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const texture = useMemo(() => { const value = new CanvasTexture(canvas); value.colorSpace = SRGBColorSpace; return value; }, [canvas]);
  useEffect(() => {
    let disposed = false;
    const element = document.querySelector<HTMLElement>('.home-works-intro-title');
    if (!element) return;
    const style = getComputedStyle(element), ratio = 2048 / size.width;
    canvas.width = 2048; canvas.height = Math.round(size.height * ratio);
    const draw = () => {
      if (disposed) return;
      const context = canvas.getContext('2d')!;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = `${style.fontWeight} ${parseFloat(style.fontSize) * ratio}px ${style.fontFamily}`;
      context.textAlign = 'center'; context.textBaseline = 'top'; context.fillStyle = style.color;
      context.fillText(element.textContent || '', canvas.width / 2, canvas.height * .35);
      texture.needsUpdate = true; model.invalidate();
    };
    draw(); void document.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`).then(draw);
    return () => { disposed = true; };
  }, [canvas, texture, size.width, size.height, model]);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    if (!mesh.current || !material.current) return;
    const a = model.motion.rendered.intro;
    const alpha = MathUtils.smoothstep(a, .1, .3) * (1 - MathUtils.smoothstep(a, .9, 1));
    material.current.opacity = alpha; mesh.current.visible = alpha > .001;
    texture.offset.x = -.18 + .3 * a;
    const view = viewport.getCurrentViewport(camera, new Vector3(0, 0, -2.2));
    mesh.current.scale.set(view.width, view.height, 1);
  }, -.75);
  // The same approved type is a background texture, included in the glass snapshot.
  return <mesh ref={mesh} position={[0, 0, -2.2]} renderOrder={20}>
    <planeGeometry /><meshBasicMaterial ref={material} map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}
