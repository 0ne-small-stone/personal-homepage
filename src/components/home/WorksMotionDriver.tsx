import { useFrame } from '@react-three/fiber';
import type { JourneyModel } from './scene-state';

export default function WorksMotionDriver({ model,stopped=false }: { model: JourneyModel;stopped?:boolean }) {
  // R3F owns the only clock that advances Lenis; no autoRaf or second ticker.
  useFrame(() => {if(!stopped)model.drive?.(performance.now(), model.frameDelta);}, -3);
  useFrame(() => {if(!stopped)model.afterFrame?.(model.frameDelta);}, 0);
  return null;
}
