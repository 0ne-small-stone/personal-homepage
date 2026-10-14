import { homeWorkChapters } from './home-chapters.ts';
export const workCount = homeWorkChapters.length;
export const introGap = 100;

export type MotionChannel = 'kv' | 'intro' | 'works' | 'event' | 'snap' | 'outro' | 'prepare' | 'expand' | 'wall';

export function motionRange(channel: MotionChannel, height: number): [number, number] {
  const h = height, g = introGap, n = workCount;
  return {
    kv: [-h, g], intro: [g, h + g], works: [h + g, (n + 2) * h + g],
    event: [h + g, (n + 1) * h + g], snap: [2 * h + g, (n + 1) * h + g],
    outro: [(n + 1) * h + g, (n + 2.5) * h + g],
    prepare: [(n + 2.5) * h + g, (n + 3.5) * h + g],
    expand: [(n + 3.5) * h + g, (n + 6.5) * h + g],
    wall: [(n + 6.5) * h + g, (n + 8.5) * h + g],
  }[channel] as [number, number];
}
