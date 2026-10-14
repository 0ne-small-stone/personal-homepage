// Deck units are independent of viewport size. The pivot and stylus were
// measured on this site's generated 1024 × 1536 metal tonearm bitmap.
// The mount remains at the previous deck pivot; only image-local anchors change.
export const turntableGeometry = {
  deckWidth: 450, deckHeight: 400,
  discDiameter: 380, discTop: 10,
  armLeft: 305.77, armTop: 14.64, armWidth: 175,
  imageWidth: 1024, imageHeight: 1536,
  pivot: { x: 738, y: 309 },
  stylus: { x: 220, y: 1468 },
  outerGroove: 174, innerGroove: 76, parkedAngle: -15,
} as const;

export function tonearmAngle(playing: boolean, progress: number): number {
  const g = turntableGeometry;
  if (!playing) return g.parkedAngle;
  const fraction = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const radius = g.outerGroove + (g.innerGroove - g.outerGroove) * fraction;
  const scale = g.armWidth / g.imageWidth;
  const pivotX = g.armLeft + g.pivot.x * scale;
  const pivotY = g.armTop + g.pivot.y * scale;
  const centerX = g.discDiameter / 2;
  const centerY = g.discTop + centerX;
  const dx = centerX - pivotX, dy = centerY - pivotY;
  const armX = (g.stylus.x - g.pivot.x) * scale;
  const armY = (g.stylus.y - g.pivot.y) * scale;
  const distance = Math.hypot(dx, dy), length = Math.hypot(armX, armY);
  const cosine = (distance * distance + length * length - radius * radius) / (2 * distance * length);
  // The right-hand intersection keeps the cartridge clear of the center label.
  return (Math.atan2(dy, dx) - Math.acos(Math.min(1, Math.max(-1, cosine))) - Math.atan2(armY, armX)) * 180 / Math.PI;
}

const g = turntableGeometry;
export const turntableLayout = {
  '--deck-ratio': `${g.deckWidth} / ${g.deckHeight}`,
  '--disc-width': `${g.discDiameter / g.deckWidth * 100}%`,
  '--disc-top': `${g.discTop / g.deckHeight * 100}%`,
  '--arm-left': `${g.armLeft / g.deckWidth * 100}%`,
  '--arm-top': `${g.armTop / g.deckHeight * 100}%`,
  '--arm-width': `${g.armWidth / g.deckWidth * 100}%`,
  '--arm-pivot-x': `${g.pivot.x / g.imageWidth * 100}%`,
  '--arm-pivot-y': `${g.pivot.y / g.imageHeight * 100}%`,
  '--stylus-x': `${g.stylus.x / g.imageWidth * 100}%`,
  '--stylus-y': `${g.stylus.y / g.imageHeight * 100}%`,
};
