import { useEffect, useMemo } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { CanvasTexture, SRGBColorSpace, type Scene } from 'three';

function softboxTexture(side: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const horizontal = context.createLinearGradient(0, 0, 256, 0);
  horizontal.addColorStop(0, '#000000');
  horizontal.addColorStop(.15, '#777777');
  horizontal.addColorStop(.4, '#ffffff');
  horizontal.addColorStop(.65, '#eeeeee');
  horizontal.addColorStop(.85, '#555555');
  horizontal.addColorStop(1, '#000000');
  context.fillStyle = horizontal;
  context.fillRect(0, 0, 256, 512);
  const vertical = context.createLinearGradient(0, 0, 0, 512);
  const stops: [number, string][] = side
    ? [[0, '#000000'], [.12, '#444444'], [.28, '#ffffff'], [.52, '#999999'], [.8, '#333333'], [1, '#000000']]
    : [[0, '#000000'], [.12, '#444444'], [.3, '#cccccc'], [.6, '#dddddd'], [.9, '#444444'], [1, '#000000']];
  stops.forEach(([offset, color]) => vertical.addColorStop(offset, color));
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = vertical;
  context.fillRect(0, 0, 256, 512);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Reflection-only studio. The content scene keeps its existing environment. */
export default function GlassReflectionEnvironment({ scene }: { scene: Scene }) {
  const maps = useMemo(() => ({ front: softboxTexture(false), side: softboxTexture(true) }), []);
  useEffect(() => () => { maps.front.dispose(); maps.side.dispose(); }, [maps]);
  return <Environment scene={scene} resolution={128} frames={1} background={false}>
    <color attach="background" args={['#080808']} />
    <Lightformer form="rect" color="#ffffff" intensity={.78} position={[-3, 1, 4]} scale={[4.5, 5.5, 1]} target={[0, 0, 0]} map={maps.front} />
    <Lightformer form="rect" color="#ffffff" intensity={.72} position={[3, 1, -4]} scale={[3.2, 5.5, 1]} target={[0, 0, 0]} map={maps.side} />
    <Lightformer form="rect" color="#ffffff" intensity={.18} position={[3, -2, 3]} scale={[2.5, 3.5, 1]} target={[0, 0, 0]} map={maps.front} />
    <Lightformer form="rect" color="#ffffff" intensity={.12} position={[-2, -3, -2]} scale={[6, 1.2, 1]} target={[0, 0, 0]} map={maps.front} />
  </Environment>;
}
