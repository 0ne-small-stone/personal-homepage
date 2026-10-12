import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { BoxGeometry, PlaneGeometry, CanvasTexture, TextureLoader, SRGBColorSpace, MathUtils, type Texture, type Group, type BufferGeometry, type MeshBasicMaterial } from 'three';
import type { JourneyModel } from './scene-state';
import { sceneUnitScale, workCount } from './works-motion';
import { selectedLinks } from './home-chapters';

function curve(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) position.setZ(i, .2 * position.getZ(i) + 1.5 * Math.cos(position.getX(i) * Math.PI / 16) - 1);
  geometry.computeVertexNormals(); return geometry;
}

function WorkCard({ model, index, texture, imageAspect }: { model: JourneyModel; index: number; texture: Texture; imageAspect: number }) {
  const group = useRef<Group>(null), carrier = useRef<MeshBasicMaterial>(null), image = useRef<MeshBasicMaterial>(null);
  const { size } = useThree();
  const geometries = useMemo(() => {
    const face = new PlaneGeometry(4.5 * imageAspect, 4.5, 16, 16);
    face.translate(0, 0, .1);
    return [curve(new BoxGeometry(8, 4.5, .1, 16, 16, 1)), curve(face)];
  }, [imageAspect]);
  texture.colorSpace = SRGBColorSpace;
  useEffect(() => () => geometries.forEach(geometry => geometry.dispose()), [geometries]);
  useFrame(() => {
    if (!group.current || !carrier.current || !image.current) return;
    const u = model.motion.rendered.index, d = index + 1 - u;
    const sp = MathUtils.clamp((16 / 9 - size.width / size.height) / (16 / 9 - 9 / 16), 0, 1);
    const localScale = .9 + .1 * sp + .2 * (1 - Math.min(1, Math.abs(d)));
    const alpha = (1 - MathUtils.smoothstep(Math.abs(d), .8, 2.5)) * Math.min(1, 2 * u) * Math.min(1, 2 * (workCount + 1 - u));
    const responsiveScale = MathUtils.lerp(1, .6, sp) * sceneUnitScale;
    group.current.position.set(11 * Math.sin(d) * responsiveScale, (-d * MathUtils.lerp(1, .6, sp) + .8 * sp) * sceneUnitScale, (5 * Math.cos(d) - 6) * responsiveScale);
    group.current.rotation.set(0, .6 * d, 0);
    group.current.scale.setScalar(localScale * responsiveScale);
    group.current.visible = alpha > .01;
    carrier.current.opacity = alpha; image.current.opacity = alpha;
    model.motion.cards[index] = { index, position: group.current.position.toArray(), rotationY: group.current.rotation.y, scale: group.current.scale.x, alpha, visible: group.current.visible };
  }, -1);
  return <group ref={group}>
    <mesh geometry={geometries[0]} layers-mask={2} renderOrder={100}><meshBasicMaterial ref={carrier} color="#101010" transparent depthTest={false} depthWrite={false} toneMapped={false} /></mesh>
    <mesh geometry={geometries[1]} layers-mask={2} renderOrder={101}><meshBasicMaterial ref={image} map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} /></mesh>
  </group>;
}

function ImageWorkCard({ url, ...props }: { model: JourneyModel; index: number; url: string; imageAspect: number }) {
  const texture = useLoader(TextureLoader, url);
  return <WorkCard {...props} texture={texture} />;
}

function LinksWorkCard({ model }: { model: JourneyModel }) {
  const { size } = useThree();
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const texture = useMemo(() => { const value = new CanvasTexture(canvas); value.colorSpace = SRGBColorSpace; return value; }, [canvas]);
  useEffect(() => {
    let disposed = false;
    const list = document.querySelector<HTMLElement>('.home-links-preview');
    if (!list) return;
    const draw = () => {
      if (disposed) return;
      canvas.width = 2048; canvas.height = 1152;
      const context = canvas.getContext('2d')!;
      context.clearRect(0, 0, canvas.width, canvas.height);
      const bounds = list.getBoundingClientRect();
      const rows = [...list.querySelectorAll<HTMLLIElement>('li')];
      const padding = parseFloat(getComputedStyle(rows[0].querySelector('a')!).gap);
      const ratio = canvas.width / (bounds.width + 2 * padding);
      const inset = padding * ratio, top = (canvas.height - bounds.height * ratio) / 2;
      context.textBaseline = 'middle';
      rows.forEach((row, index) => {
        const titleStyle = getComputedStyle(row.querySelector('strong')!);
        const detailStyle = getComputedStyle(row.querySelector('span')!);
        const rect = row.getBoundingClientRect(), y = top + (rect.top - bounds.top + rect.height / 2) * ratio;
        context.font = `${titleStyle.fontWeight} ${parseFloat(titleStyle.fontSize) * ratio}px ${titleStyle.fontFamily}`;
        context.fillStyle = titleStyle.color; context.textAlign = 'left';
        context.fillText(selectedLinks[index].title, inset, y);
        context.font = `${detailStyle.fontWeight} ${parseFloat(detailStyle.fontSize) * ratio}px ${detailStyle.fontFamily}`;
        context.fillStyle = detailStyle.color; context.textAlign = 'right';
        context.fillText(selectedLinks[index].detail, canvas.width - inset, y);
        context.strokeStyle = getComputedStyle(row).borderBottomColor; context.lineWidth = ratio;
        const bottom = top + (rect.bottom - bounds.top) * ratio;
        context.beginPath(); context.moveTo(inset, bottom); context.lineTo(canvas.width - inset, bottom); context.stroke();
      });
      texture.needsUpdate = true; model.invalidate();
    };
    draw(); void document.fonts.ready.then(draw);
    return () => { disposed = true; };
  }, [canvas, texture, size.width, size.height, model]);
  useEffect(() => () => texture.dispose(), [texture]);
  // An aria-hidden visual copy of the same list; DOM links own navigation.
  return <WorkCard model={model} index={3} texture={texture} imageAspect={16 / 9} />;
}

export default function WorksScene({ model, projectUrl, neighborUrl, albumUrl }: { model: JourneyModel; projectUrl: string; neighborUrl: string; albumUrl: string }) {
  return <>
    <ImageWorkCard model={model} index={0} url={projectUrl} imageAspect={1500 / 1350} />
    <ImageWorkCard model={model} index={1} url={neighborUrl} imageAspect={1} />
    <ImageWorkCard model={model} index={2} url={albumUrl} imageAspect={1500 / 1356} />
    <LinksWorkCard model={model} />
  </>;
}
