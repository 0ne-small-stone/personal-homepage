import { useFrame } from '@react-three/fiber';
import type { JourneyModel } from './scene-state';

export default function WorksMotionDriver({ model,stopped=false }: { model: JourneyModel;stopped?:boolean }) {
  // R3F owns the only clock that advances Lenis; no autoRaf or second ticker.
  useFrame((_, dt) => {if(!stopped)model.drive?.(performance.now(), dt);}, -3);
  useFrame((_, dt) => {if(!stopped)model.afterFrame?.(dt);}, 0);
  return null;
}
