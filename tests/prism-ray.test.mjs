import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { BoxGeometry, ExtrudeGeometry, Matrix4, Shape, Vector2, Vector3 } from 'three';
import { MAX_INTERFACES, PrismRaySolver, snellDirection } from '../src/components/home/prism-ray.ts';

// Use the actual established geometry without importing a React/TSX surface into Node.
const component = readFileSync(new URL('../src/components/home/GlassTriangle.tsx', import.meta.url), 'utf8');
const geometrySource = component.slice(component.indexOf('function roundedTriangle'), component.indexOf('export default function')).replace('export function', 'function');
const makeGeometry = new Function('ExtrudeGeometry', 'Shape', 'Vector2', 'Vector3', stripTypeScriptTypes(geometrySource) + '\nreturn makeTriangleGeometry();');
const prism = makeGeometry(ExtrudeGeometry, Shape, Vector2, Vector3);
const matrix = new Matrix4().makeScale(.5, .5, .5), start = new Vector3(-12, 0, 0), direction = new Vector3(1, 0, 0);
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
const finite = solver => assert.ok([...solver.points.slice(0, solver.count), solver.outputDirection].every(p => p.toArray().every(Number.isFinite)));

test('normal incidence retains direction for entry and exit', () => {
  const output = new Vector3();
  assert.equal(snellDirection(new Vector3(0, 0, -1), new Vector3(0, 0, 1), 1, 1.45, output), 'refract');
  near(output.distanceTo(new Vector3(0, 0, -1)), 0);
  assert.equal(snellDirection(output.clone(), new Vector3(0, 0, 1), 1.45, 1, output), 'refract');
  near(output.z, -1);
});

test('entry and exit satisfy Snell angle independently', () => {
  for (const [n1, n2, degree] of [[1, 1.45, 45], [1.45, 1, 30]]) {
    const theta = degree * Math.PI / 180, normal = new Vector3(0, 0, 1), output = new Vector3();
    const incident = new Vector3(Math.sin(theta), 0, -Math.cos(theta));
    assert.equal(snellDirection(incident, normal, n1, n2, output), 'refract');
    near(n1 * Math.sin(theta), n2 * Math.abs(output.x)); near(output.length(), 1);
  }
});

test('total internal reflection keeps the reflected ray and unit length', () => {
  const theta = Math.PI / 3, output = new Vector3();
  assert.equal(snellDirection(new Vector3(Math.sin(theta), 0, -Math.cos(theta)), new Vector3(0, 0, 1), 1.45, 1, output), 'reflect');
  near(output.x, Math.sin(theta)); near(output.z, Math.cos(theta)); near(output.length(), 1);
});

test('real solid prism has entry, internal segment and rightward exit at scale .5', () => {
  const solver = new PrismRaySolver(prism); solver.trace(matrix, start, direction);
  assert.equal(solver.status, 'exited'); assert.equal(solver.rightward, true); assert.ok(solver.eventCount >= 2); finite(solver);
  assert.equal(solver.events[0].n1, 1); assert.equal(solver.events[0].n2, 1.45);
  assert.equal(solver.events[solver.eventCount - 1].n1, 1.45); assert.equal(solver.events[solver.eventCount - 1].n2, 1);
  const full = new PrismRaySolver(prism); full.trace(new Matrix4(), start, direction);
  for (let i = 0; i < solver.eventCount; i++) near(solver.events[i].point.distanceTo(full.events[i].point.clone().multiplyScalar(.5)), 0, 1e-6);
});

test('miss resets old output and leaves only straight white incident light', () => {
  const solver = new PrismRaySolver(prism); solver.trace(matrix, start, direction); assert.equal(solver.rightward, true);
  solver.trace(matrix, new Vector3(-12, 20, 0), direction);
  assert.equal(solver.status, 'miss'); assert.equal(solver.eventCount, 0); assert.equal(solver.count, 2); assert.equal(solver.rightward, false);
  near(solver.outputDirection.length(), 0); near(solver.points[0].y, 20); near(solver.points[1].y, 20); near(solver.points[1].x, 12);
});

test('a TIR hit continues to another interface and can exit', () => {
  const solver = new PrismRaySolver(new BoxGeometry(2, 2, 2));
  solver.trace(matrix, new Vector3(.475, 0, 0), new Vector3(.5, Math.sqrt(.75), 0), 1.45, true);
  assert.equal(solver.events[0].kind, 'reflect'); assert.ok(solver.eventCount > 1); assert.equal(solver.status, 'exited');
  assert.equal(solver.events[1].kind, 'refract'); assert.equal(solver.events[1].n1, 1.45); finite(solver);
});

test('eight-interface cutoff is explicit and clears previous outgoing light', () => {
  const solver = new PrismRaySolver(new BoxGeometry(2, 2, 2));
  solver.trace(matrix, new Vector3(.1, 0, 0), new Vector3(1, 1, 0).normalize(), 1.45, true);
  assert.equal(solver.status, 'truncated'); assert.equal(solver.eventCount, MAX_INTERFACES); assert.equal(solver.count, MAX_INTERFACES + 1);
  assert.ok(solver.events.every(e => e.kind === 'reflect')); assert.equal(solver.rightward, false); near(solver.outputDirection.length(), 0); finite(solver);
});

test('rotation sweep stays finite and never forces a stale rightward output', () => {
  const solver = new PrismRaySolver(prism); let nonRight = 0;
  for (let degree = 0; degree <= 360; degree += 5) {
    const rotated = new Matrix4().makeRotationY(degree * Math.PI / 180).multiply(matrix);
    solver.trace(rotated, start, direction); finite(solver);
    assert.ok(solver.eventCount <= MAX_INTERFACES);
    assert.equal(solver.rightward, solver.status === 'exited' && solver.outputDirection.x > 1e-6);
    if (!solver.rightward) nonRight++;
    for (const event of solver.events.slice(0, solver.eventCount)) {
      assert.ok(event.normal.dot(event.incoming) <= 1e-9); near(event.outgoing.length(), 1, 1e-6);
    }
  }
  assert.ok(nonRight > 0, 'sweep must include a non-rightward physical state');
});

test('singular transform and zero direction fail without leaving drawable output', () => {
  const solver = new PrismRaySolver(prism); solver.trace(matrix, start, direction);
  solver.trace(new Matrix4().makeScale(0, 0, 0), start, direction);
  assert.equal(solver.status, 'degenerate'); assert.equal(solver.count, 1); assert.equal(solver.rightward, false);
  solver.trace(matrix, start, new Vector3()); assert.equal(solver.status, 'degenerate'); finite(solver);
});
