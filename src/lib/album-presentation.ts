import type { MusicTrack } from './music';
import { turntableGeometry as g } from './turntable-geometry';

const normalized = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
export function albumIdentity(track?: Pick<MusicTrack, 'id' | 'album' | 'albumArtist' | 'artist'>): string {
  if (!track) return '';
  const album = normalized(track.album);
  if (!album || album === '未标注专辑') return `track:${track.id}`;
  return JSON.stringify([normalized(track.albumArtist || track.artist), album]);
}

// The jacket is physically larger than the disc. Packing never changes disc size.
const sleeveWidth = .56, platterWidth = .62, sleeveTop = .04, platterTop = .05, sceneRatio = 725 / 440;
const discWidth = g.discDiameter / g.deckWidth * platterWidth;
const discCenterX = 1 - platterWidth + discWidth / 2;
const discCenterY = platterTop / sceneRatio + platterWidth * (g.discTop + g.discDiameter / 2) / g.deckWidth;
const sleeveCenterY = sleeveTop / sceneRatio + sleeveWidth / 2;
const sleeveAngle = 5 * Math.PI / 180;
const sleeveRight = sleeveWidth / 2 * (1 + Math.cos(sleeveAngle) + Math.sin(sleeveAngle));
export const jacketClearance = {
  // The whole circle must pass the rotated jacket's outer silhouette before lifting.
  x: (sleeveRight + .025 - (1 - platterWidth)) / discWidth * 100,
};
export const jacketPacking = {
  x: (sleeveWidth / 2 - discCenterX) / discWidth * 100,
  y: (sleeveCenterY - discCenterY) / discWidth * 100,
  scale: 1,
};
// Milliseconds, with explicit rests after packing and after the new jacket lands.
export const jacketChoreography = {
  arm: 280,
  clear: { start: 280, duration: 400 },
  behind: { start: 740, duration: 1 },
  stow: { start: 800, duration: 800 },
  leave: { start: 1820, duration: 620 },
  arrive: { start: 2560, duration: 680 },
  eject: { start: 3500, duration: 800 },
  front: { start: 4560, duration: 1 },
  settle: { start: 4820, duration: 1000 },
  total: 5820,
} as const;
export const jacketMotionStyle = {
  '--scene-ratio': '725 / 440',
  '--jacket-width': `${sleeveWidth * 100}%`,
  '--jacket-top': `${sleeveTop * 100}%`,
  '--platter-top': `${platterTop * 100}%`,
  '--jacket-insert-x': `${jacketPacking.x}%`,
  '--jacket-insert-y': `${jacketPacking.y}%`,
  '--jacket-insert-scale': jacketPacking.scale,
  '--jacket-clear-x': `${jacketClearance.x}%`,
  '--jacket-arm-duration': `${jacketChoreography.arm}ms`,
  ...Object.fromEntries(['clear', 'behind', 'stow', 'leave', 'arrive', 'eject', 'front', 'settle'].flatMap(name => {
    const stage = jacketChoreography[name as Exclude<keyof typeof jacketChoreography, 'arm' | 'total'>];
    return [[`--jacket-${name}-delay`, `${stage.start}ms`], [`--jacket-${name}-duration`, `${stage.duration}ms`]];
  })),
};
