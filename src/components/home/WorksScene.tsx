import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { BoxGeometry, PlaneGeometry, TextureLoader, SRGBColorSpace, MathUtils, type Texture, type Group, type BufferGeometry, type MeshBasicMaterial } from 'three';
import type { JourneyModel } from './scene-state';
import { sceneUnitScale, workCount } from './works-motion';
import { homeWorkChapters } from './home-chapters';

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

export default function WorksScene({ model, projectUrl, neighborUrl, albumUrl }: { model: JourneyModel; projectUrl: string; neighborUrl: string; albumUrl: string }) {
  const images = {
    album: { url: albumUrl, imageAspect: 1500 / 1356 },
    radio: { url: neighborUrl, imageAspect: 1 },
    projects: { url: projectUrl, imageAspect: 1500 / 1350 },
  };
  return <>{homeWorkChapters.map((chapter, index) => <ImageWorkCard key={chapter.id} model={model} index={index} {...images[chapter.id]} />)}</>;
}
