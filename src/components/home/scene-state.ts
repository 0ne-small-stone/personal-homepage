export interface JourneyModel {
  progress: number;
  pointer: { x: number; y: number; vx: number; vy: number };
  invalidate: () => void;
  lastFrame: number;
}
export function createJourneyModel(): JourneyModel {
  return { progress: 0, pointer: { x: 0, y: 0, vx: 0, vy: 0 }, invalidate: () => {}, lastFrame: 0 };
}

export function chapterPose(progress: number) {
  const index = Math.min(5, Math.floor(progress));
  const local = progress - index;
  const blend = local < .65 ? 0 : Math.min(1, (local - .65) / .35);
  return { index, next: Math.min(5, index + 1), blend: blend * blend * (3 - 2 * blend) };
}
