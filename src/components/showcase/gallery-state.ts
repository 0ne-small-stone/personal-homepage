export function clampSelection(index: number, count: number) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index));
}

// Vertical intent belongs to the browser, including page scrolling and pinch zoom.
export function dragIntent(dx: number, dy: number): 'pending' | 'horizontal' | 'vertical' {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return 'pending';
  return Math.abs(dx) > Math.abs(dy) * 1.3 ? 'horizontal' : 'vertical';
}

export function releaseSelection(index: number, count: number, dx: number, width: number) {
  const threshold = Math.min(80, Math.max(36, width * .18));
  return clampSelection(index + (Math.abs(dx) >= threshold ? (dx < 0 ? 1 : -1) : 0), count);
}

export function exhibitPose(offset: number, reduced = false) {
  const distance = Math.abs(offset);
  return {
    x: offset * 78,
    z: distance ? -Math.min(distance, 3) * 220 : 0,
    rotate: reduced ? 0 : -Math.sign(offset) * Math.min(distance, 1) * 18,
    opacity: distance >= 2.5 ? 0 : Math.max(0, 1 - distance * .58),
    layer: Math.max(0, 50 - Math.round(distance * 10)),
  };
}
