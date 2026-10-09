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
      const lines = [...element.querySelectorAll<HTMLElement>('[data-intro-line]')].map(line => line.textContent || '');
      const baseSize = parseFloat(style.fontSize) * ratio, spacing = (parseFloat(style.letterSpacing) || 0) * ratio;
      const font = (factor: number) => {
        context.font = `${style.fontWeight} ${baseSize * factor}px ${style.fontFamily}`;
        if ('letterSpacing' in context) context.letterSpacing = `${spacing * factor}px`;
      };
      context.textAlign = 'center'; context.textBaseline = 'alphabetic'; context.fillStyle = style.color;
      font(1);
      const safeWidth = canvas.width * .82;
      const factor = Math.min(1, safeWidth / Math.max(1, ...lines.map(line => context.measureText(line).width)));
      font(factor);
      const metrics = lines.map(line => context.measureText(line));
      const lineHeight = (parseFloat(style.lineHeight) || parseFloat(style.fontSize) * .98) * ratio * factor;
      const first = metrics[0], last = metrics.at(-1);
      const firstBaseline = canvas.height * .48 - ((lines.length - 1) * lineHeight + (last?.actualBoundingBoxDescent || 0) - (first?.actualBoundingBoxAscent || 0)) / 2;
      lines.forEach((line, index) => context.fillText(line, canvas.width / 2, firstBaseline + index * lineHeight));
      if (document.documentElement.dataset.motionDiagnostics === 'true') document.dispatchEvent(new CustomEvent('lssh:intro-title', { detail: {
        lines, canvas: [canvas.width, canvas.height], ratio, factor, fontSize: baseSize * factor / ratio, safeWidth: safeWidth / ratio,
        widths: metrics.map(m => m.width / ratio), bounds: metrics.map((m, i) => [(canvas.width / 2 - m.actualBoundingBoxLeft) / ratio, (firstBaseline + i * lineHeight - m.actualBoundingBoxAscent) / ratio, (canvas.width / 2 + m.actualBoundingBoxRight) / ratio, (firstBaseline + i * lineHeight + m.actualBoundingBoxDescent) / ratio]),
      } }));
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
