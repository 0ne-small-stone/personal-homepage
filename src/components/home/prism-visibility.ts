export const PRISM_WALL_EXIT = .3 / .35;
const LIGHT_FADE_START = .72;

export function prismOpticalOpacity(wallProgress: number) {
  const t = Math.max(0, Math.min(1, (wallProgress - LIGHT_FADE_START) / (PRISM_WALL_EXIT - LIGHT_FADE_START)));
  return 1 - t * t * (3 - 2 * t);
}
