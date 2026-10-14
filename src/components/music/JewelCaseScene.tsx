import { useEffect, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, RoundedBox } from '@react-three/drei';
import { DoubleSide, Vector3, type Group } from 'three';
import { gsap } from 'gsap';
import type { SwitcherAlbum } from './AlbumSwitcher';

const glass = { color: '#ffffff', transmission: .98, thickness: .07, roughness: .045, ior: 1.49, metalness: 0, clearcoat: .5, clearcoatRoughness: .06, envMapIntensity: .4, opacity: 1 };
function Rail({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  return <RoundedBox position={position} args={args} radius={.016} smoothness={2}><meshPhysicalMaterial {...glass} transmission={.72} roughness={.1} /></RoundedBox>;
}
function Frame({ z = 0 }: { z?: number }) {
  return <><Rail position={[0, 1.2, z]} args={[2.5, .045, .085]} /><Rail position={[0, -1.2, z]} args={[2.5, .045, .085]} /><Rail position={[-1.24, 0, z]} args={[.045, 2.43, .085]} /><Rail position={[1.24, 0, z]} args={[.045, 2.43, .085]} /></>;
}
function JewelCase({ open, angle, reduced, onToggle, artwork }: { open: boolean; angle: number; reduced: boolean; onToggle: () => void; artwork: RefObject<HTMLDivElement | null> }) {
  const lid = useRef<Group>(null);const object = useRef<Group>(null);const { invalidate, size, camera } = useThree();
  useFrame(() => {
    const image = artwork.current, group = object.current;
    if (!image || !group) return;
    group.updateWorldMatrix(true, false);
    // Project the disc plane's four corners and map the DOM cover onto that quad.
    // The image can use public cloud URLs without requiring WebGL CORS access.
    const p = [[-1.055, 1.055], [1.055, 1.055], [1.055, -1.055], [-1.055, -1.055]].map(([x, y]) => {
      const v = new Vector3(x, y, -.03).applyMatrix4(group.matrixWorld).project(camera);
      return { x: (v.x + 1) * size.width / 2, y: (1 - v.y) * size.height / 2 };
    });
    const dx1 = p[1].x - p[2].x, dx2 = p[3].x - p[2].x, dx3 = p[0].x - p[1].x + p[2].x - p[3].x;
    const dy1 = p[1].y - p[2].y, dy2 = p[3].y - p[2].y, dy3 = p[0].y - p[1].y + p[2].y - p[3].y;
    const denominator = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(denominator) < .001) { image.style.visibility = 'hidden';return; }
    const g = (dx3 * dy2 - dx2 * dy3) / denominator, h = (dx1 * dy3 - dx3 * dy1) / denominator;
    const width = image.offsetWidth, height = image.offsetHeight;
    if (!width || !height) return;
    const a = (p[1].x - p[0].x + g * p[1].x) / width, b = (p[3].x - p[0].x + h * p[3].x) / height;
    const d = (p[1].y - p[0].y + g * p[1].y) / width, e = (p[3].y - p[0].y + h * p[3].y) / height;
    image.style.transform = `matrix3d(${a},${d},0,${g / width},${b},${e},0,${h / height},0,0,1,0,${p[0].x},${p[0].y},0,1)`;
    image.style.visibility = 'visible';
  });
  useEffect(() => {
    if (!lid.current || !object.current) return;
    const tween = gsap.timeline({ onUpdate: invalidate });
    const scale = open ? size.width < 480 ? .65 : .78 : .94;
    tween.to(lid.current.rotation, { y: open ? -Math.PI * 170 / 180 : 0, duration: reduced ? 0 : .85, ease: 'power2.inOut' }, 0);
    tween.to(object.current.position, { x: open ? .85 : 0, duration: reduced ? 0 : .85, ease: 'power2.inOut' }, 0);
    tween.to(object.current.scale, { x: scale, y: scale, z: scale, duration: reduced ? 0 : .85, ease: 'power2.inOut' }, 0);
    tween.to(object.current.rotation, { y: .13 + angle, duration: reduced ? 0 : .6, ease: 'power2.inOut' }, 0);
    return () => { tween.kill(); };
  }, [open, angle, reduced, size.width, invalidate]);
  function toggle(event: ThreeEvent<MouseEvent>) { event.stopPropagation();if (event.delta < 6) onToggle(); }
  return <group ref={object} rotation={[-.12, .13, -.035]}>
    <RoundedBox args={[2.56, 2.5, .11]} radius={.04} smoothness={3} position={[0, 0, -.12]}><meshPhysicalMaterial {...glass} transparent opacity={.08} /></RoundedBox>
    <Frame z={-.055} /><Frame z={-.1} />
    <mesh position={[0, 0, -.035]}><ringGeometry args={[.085, 1.055, 96]} /><meshPhysicalMaterial color="#676767" metalness={.12} roughness={.32} side={DoubleSide} /></mesh>
    <mesh position={[0, 0, -.02]}><ringGeometry args={[.085, .195, 64]} /><meshPhysicalMaterial color="#b9bdc0" metalness={.9} roughness={.16} side={DoubleSide} /></mesh>
    <mesh position={[0, 0, -.007]}><ringGeometry args={[.205, .215, 64]} /><meshBasicMaterial color="#d2d4d7" transparent opacity={.8} side={DoubleSide} /></mesh>
    <mesh position={[0, 0, -.004]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.07, .075, .06, 24]} /><meshPhysicalMaterial {...glass} transmission={.5} /></mesh>
    {[-.8, .8].map(y => <Rail key={y} position={[-1.23, y, .005]} args={[.09, .24, .12]} />)}
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4;return <Rail key={i} position={[Math.cos(a) * 1.1, Math.sin(a) * 1.1, .015]} args={[.085, .035, .055]} />; })}
    <group ref={lid} position={[-1.27, 0, .085]} onClick={toggle}>
      <group position={[1.27, 0, 0]}>
        <RoundedBox args={[2.54, 2.48, .033]} radius={.035} smoothness={3}><meshPhysicalMaterial {...glass} transmission={1} thickness={.03} transparent opacity={.04} /></RoundedBox>
        <Frame /><Frame z={.027} />
        {[-.75, .75].map(x => <Rail key={x} position={[x, 1.16, .045]} args={[.18, .028, .055]} />)}
        <Rail position={[1.19, -.7, .044]} args={[.07, .28, .05]} />
      </group>
    </group>
  </group>;
}
function Scene({ album, outgoing, direction, changeKey, open, angle, reduced, onToggle, onSettled, artwork, previousArtwork }: {
  album: SwitcherAlbum; outgoing: SwitcherAlbum | null; direction: number; changeKey: number; open: boolean; angle: number; reduced: boolean; onToggle: () => void; onSettled: () => void; artwork: RefObject<HTMLDivElement | null>; previousArtwork: RefObject<HTMLDivElement | null>;
}) {
  const current = useRef<Group>(null);const previous = useRef<Group>(null);const { invalidate } = useThree();
  useEffect(() => {
    if (!current.current) return;
    if (!outgoing || !previous.current) { current.current.position.y = 0;invalidate();return; }
    const timeline = gsap.timeline({ onUpdate: invalidate, onComplete: onSettled });
    timeline.fromTo(current.current.position, { y: -direction * 4.2 }, { y: 0, duration: reduced ? 0 : .65, ease: 'power3.inOut' }, 0);
    timeline.fromTo(previous.current.position, { y: 0 }, { y: direction * 4.2, duration: reduced ? 0 : .65, ease: 'power3.inOut' }, 0);
    return () => { timeline.kill(); };
  }, [album.id, outgoing?.id, changeKey, direction, reduced, invalidate, onSettled]);
  return <>
    <color attach="background" args={['#151517']} />
    <ambientLight intensity={.45} /><directionalLight position={[4, 5, 6]} intensity={2.2} />
    <Environment resolution={128} frames={1}><Lightformer position={[-3, 2, 4]} scale={[3, 5, 1]} intensity={4} /><Lightformer position={[4, -2, 3]} scale={[2, 5, 1]} intensity={3} /><Lightformer position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[5, 1, 1]} intensity={2} /></Environment>
    {outgoing && <group ref={previous}><JewelCase open={false} angle={0} reduced={reduced} onToggle={() => {}} artwork={previousArtwork} /></group>}
    <group ref={current}><JewelCase key={album.id} open={open} angle={angle} reduced={reduced} onToggle={onToggle} artwork={artwork} /></group>
    <OrbitControls enablePan={false} enableZoom={false} enableDamping={false} minPolarAngle={Math.PI * .3} maxPolarAngle={Math.PI * .7} minAzimuthAngle={-.65} maxAzimuthAngle={.65} />
  </>;
}
export default function JewelCaseScene(props: Parameters<typeof Scene>[0]) {
  return <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 0, 7.5], fov: 32 }} gl={{ antialias: true, alpha: true }} aria-label="可开合和转动的透明专辑盒"><Scene {...props} /></Canvas>;
}
