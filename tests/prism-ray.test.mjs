import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Matrix4, Vector3 } from 'three';
import { MAX_INTERFACES, PRISM_INCIDENT_SLOPE, PrismRaySolver, snellDirection } from '../src/components/home/prism-ray.ts';
import { makeTriangleGeometry } from '../src/components/home/prism-geometry.ts';
import { PRISM_DISPERSION, PRISM_WAVELENGTHS, prismIOR, sameInterfaceTopology } from '../src/components/home/prism-spectrum.ts';

// Use the same shared prism geometry as the React scene and spectral worker.
const prism = makeTriangleGeometry();
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

const coverOrigin = new Vector3(-12, -12 * PRISM_INCIDENT_SLOPE, 0);
const coverDirection = new Vector3(1, PRISM_INCIDENT_SLOPE, 0).normalize();
const channels = PRISM_WAVELENGTHS.map(() => new PrismRaySolver(prism));
function spectrum(degree) {
  const transform = new Matrix4().makeRotationY(degree * Math.PI / 180).multiply(matrix);
  channels.forEach((ray, i) => ray.trace(transform, coverOrigin, coverDirection, prismIOR(PRISM_WAVELENGTHS[i])));
}

test('Cauchy uses nm-to-µm conversion and independently disperses the cover source', () => {
  near(prismIOR(550), 1.45); near((prismIOR(486.1) - prismIOR(656.3)) / PRISM_DISPERSION, 1.52238 - 1.51432);
  assert.ok(prismIOR(410) > prismIOR(700)); spectrum(0);
  const angles = channels.map(ray => Math.atan2(ray.outputDirection.y, ray.outputDirection.x) * 180 / Math.PI);
  near(angles[0], -16.293672, 1e-5); near(angles[3], -19.008540, 1e-5); near(angles[6], -25.170493, 1e-5);
  assert.ok(angles.every((a, i) => i === 0 || a < angles[i - 1]));
  for (let i = 1; i < channels.length; i++) assert.ok(sameInterfaceTopology(channels[i - 1], channels[i]));
});

test('wavelength critical boundary keeps independent output states and rejects mixed ribbons', () => {
  // New enhanced-glass boundary, independently found by a rotation sweep.
  spectrum(21.25);
  assert.ok(channels.slice(0, 4).every(ray => ray.status === 'exited' && ray.rightward && ray.events.slice(0, ray.eventCount).map(e => e.kind).join() === 'refract,reflect,refract'));
  for (const ray of channels.slice(4)) {
    assert.equal(ray.status, 'truncated'); assert.equal(ray.eventCount, MAX_INTERFACES);
    assert.equal(ray.rightward, false); near(ray.outputDirection.length(), 0);
  }
  assert.equal(sameInterfaceTopology(channels[3], channels[4]), false);
});

test('ribbon topology accepts coplanar triangles and rejects a different exit plane', () => {
  spectrum(0); const a = channels[0], b = channels[1];
  const face = b.events[1].face; b.events[1].face = face + 1;
  assert.equal(sameInterfaceTopology(a, b), true);
  b.events[1].point.addScaledVector(b.events[1].normal, .1);
  assert.equal(sameInterfaceTopology(a, b), false);
  spectrum(0); b.events[1].normal.set(0, 0, 1);
  assert.equal(sameInterfaceTopology(a, b), false);
});

test('seven independent wavelengths preserve Snell and finite states across actual rotation', () => {
  for (let degree = 0; degree <= 360; degree += 5) {
    spectrum(degree);
    for (const ray of channels) {
      finite(ray); assert.equal(ray.rightward, ray.status === 'exited' && ray.outputDirection.x > 1e-6);
      for (const e of ray.events.slice(0, ray.eventCount)) {
        if (e.kind === 'refract') near(e.n1 * e.incoming.clone().cross(e.normal).length(), e.n2 * e.outgoing.clone().cross(e.normal).length(), 1e-6);
        else if (e.kind === 'reflect') near(e.incoming.dot(e.normal), -e.outgoing.dot(e.normal), 1e-6);
      }
      ray.trace(matrix, new Vector3(-12, 20, 0), coverDirection, 1.45);
      assert.equal(ray.status, 'miss'); near(ray.outputDirection.length(), 0); assert.equal(ray.rightward, false);
    }
  }
});

test('enhancement retains every green node and direction at the prior IOR across rotation', () => {
  const priorGreen = new PrismRaySolver(prism);
  for (let degree = 0; degree <= 360; degree += 5) {
    spectrum(degree);
    priorGreen.trace(new Matrix4().makeRotationY(degree * Math.PI / 180).multiply(matrix), coverOrigin, coverDirection, 1.45);
    const green = channels[3];
    assert.equal(green.status, priorGreen.status); assert.equal(green.count, priorGreen.count);
    near(green.outputDirection.distanceTo(priorGreen.outputDirection), 0);
    for (let i = 0; i < green.count; i++) near(green.points[i].distanceTo(priorGreen.points[i]), 0);
  }
});
