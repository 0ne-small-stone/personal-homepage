import test from 'node:test';
import assert from 'node:assert/strict';
import { tonearmAngle, turntableGeometry as g } from '../../src/lib/turntable-geometry.ts';

// Measure the endpoint in deck units rather than asserting implementation angles.
function stylusAt(angle) {
  const scale = g.armWidth / g.imageWidth, a = angle * Math.PI / 180;
  const vx = (g.stylus.x - g.pivot.x) * scale, vy = (g.stylus.y - g.pivot.y) * scale;
  return { x: g.armLeft + g.pivot.x * scale + vx * Math.cos(a) - vy * Math.sin(a), y: g.armTop + g.pivot.y * scale + vx * Math.sin(a) + vy * Math.cos(a) };
}
const radius = (p) => Math.hypot(p.x - g.discDiameter / 2, p.y - g.discTop - g.discDiameter / 2);

test('playing stylus stays on the grooved annulus and moves monotonically inward', () => {
  let previous = Infinity;
  for (let progress = 0; progress <= 1; progress += .01) {
    const p = stylusAt(tonearmAngle(true, progress)), r = radius(p);
    assert.ok(r >= g.innerGroove - 1e-8 && r <= g.outerGroove + 1e-8);
    assert.ok(r < previous); previous = r;
    assert.ok(p.x > g.discDiameter / 2, 'use the right-hand intersection');
  }
  assert.ok(Math.abs(radius(stylusAt(tonearmAngle(true, 0))) - 174) < 1e-8);
  assert.ok(Math.abs(radius(stylusAt(tonearmAngle(true, 1))) - 76) < 1e-8);
});

test('paused arm parks outside the record; responsive scaling preserves contact', () => {
  assert.ok(radius(stylusAt(tonearmAngle(false, .5))) > g.discDiameter / 2);
  for (const deckWidth of [449.5, 99.2, 84.32, 68.2]) {
    for (const progress of [0, .5, 1]) {
      const p = stylusAt(tonearmAngle(true, progress)), scale = deckWidth / g.deckWidth;
      const measured = Math.hypot((p.x - 190) * scale, (p.y - 200) * scale) / scale;
      assert.ok(Math.abs(measured - (174 - 98 * progress)) < 1e-8);
    }
  }
});

test('unknown or invalid duration/progress lands at the outer groove', () => {
  for (const progress of [NaN, Infinity, -1]) assert.equal(tonearmAngle(true, progress), tonearmAngle(true, 0));
  assert.equal(tonearmAngle(true, 2), tonearmAngle(true, 1));
});
