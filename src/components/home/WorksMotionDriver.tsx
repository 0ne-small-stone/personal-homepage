import { useFrame } from '@react-three/fiber';
import type { JourneyModel } from './scene-state';

export default function WorksMotionDriver({ model }: { model: JourneyModel }) {
  // R3F owns the only clock that advances Lenis; no autoRaf or second ticker.
  useFrame((_, dt) => model.drive?.(performance.now(), dt), -3);
  useFrame((_, dt) => model.afterFrame?.(dt), 0);
  return null;
}
