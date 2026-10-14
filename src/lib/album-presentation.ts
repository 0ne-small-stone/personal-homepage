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
export const jacketPacking = {
  x: (sleeveWidth / 2 - discCenterX) / discWidth * 100,
  y: (sleeveCenterY - discCenterY) / discWidth * 100,
  scale: 1,
};
// Milliseconds, with explicit rests after packing and after the new jacket lands.
export const jacketChoreography = {
  arm: 280,
  stow: { start: 280, duration: 900 },
  leave: { start: 1400, duration: 620 },
  arrive: { start: 2140, duration: 680 },
  eject: { start: 3080, duration: 1000 },
  total: 4080,
} as const;
export const jacketMotionStyle = {
  '--scene-ratio': '725 / 440',
  '--jacket-width': `${sleeveWidth * 100}%`,
  '--jacket-top': `${sleeveTop * 100}%`,
  '--platter-top': `${platterTop * 100}%`,
  '--jacket-insert-x': `${jacketPacking.x}%`,
  '--jacket-insert-y': `${jacketPacking.y}%`,
  '--jacket-insert-scale': jacketPacking.scale,
  '--jacket-arm-duration': `${jacketChoreography.arm}ms`,
  ...Object.fromEntries(['stow', 'leave', 'arrive', 'eject'].flatMap(name => {
    const stage = jacketChoreography[name as 'stow' | 'leave' | 'arrive' | 'eject'];
    return [[`--jacket-${name}-delay`, `${stage.start}ms`], [`--jacket-${name}-duration`, `${stage.duration}ms`]];
  })),
};
