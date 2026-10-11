import type { PrismRaySolver } from './prism-ray';

// SYSTEM9.3.13: nm input, Cauchy uses µm. Virtual glass with the measured
// N-BK7 dispersion slope, offset to the existing green n=1.45 (not full BK7).
export const PRISM_WAVELENGTHS = [700, 620, 580, 550, 490, 450, 410] as const;
export const CAUCHY_A = 1.4360527699838093;
export const CAUCHY_B = .004219037079897656;
export function prismIOR(nm: number) {
  if (!Number.isFinite(nm) || nm <= 0) return NaN;
  return CAUCHY_A + CAUCHY_B / (nm / 1000) ** 2;
}

/** Join only the same physical interface family, not matching triangle IDs.
 * Adjacent coplanar triangles are one surface; equal event strings alone are
 * insufficient when rays leave through different faces of the solid. */
export function sameInterfaceTopology(a: PrismRaySolver, b: PrismRaySolver) {
  if (a.status !== 'exited' || b.status !== 'exited' || a.rightward !== b.rightward || a.eventCount !== b.eventCount) return false;
  const tolerance = Math.max(a.epsilon, b.epsilon) * 4;
  for (let i = 0; i < a.eventCount; i++) {
    const x = a.events[i], y = b.events[i];
    if (x.kind !== y.kind || (x.n1 > 1) !== (y.n1 > 1) || x.normal.dot(y.normal) < 1 - 1e-6) return false;
    const planeDistance = x.normal.x * (x.point.x - y.point.x) + x.normal.y * (x.point.y - y.point.y) + x.normal.z * (x.point.z - y.point.z);
    if (Math.abs(planeDistance) > tolerance) return false;
  }
  return true;
}
