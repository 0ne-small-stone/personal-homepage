import { useFrame } from '@react-three/fiber';
import type { JourneyModel } from './scene-state';

export default function WorksMotionDriver({ model,stopped=false }: { model: JourneyModel;stopped?:boolean }) {
  // R3F owns the only clock that advances Lenis; no autoRaf or second ticker.
  useFrame(() => {model.wallProbe?.start('scroll-motion');if(!stopped)model.drive?.(performance.now(), model.frameDelta);model.wallProbe?.end('scroll-motion');}, -3);
  useFrame(() => {model.wallProbe?.start('copy-after-frame');if(stopped)model.flushRestore?.();else model.afterFrame?.(model.frameDelta);model.wallProbe?.end('copy-after-frame');}, 0);
  return null;
}
