import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { distributeDomePhotos, createWallPhotoPicker } from '../src/components/gallery/photo-distribution.js';
import { fieldCandidates, createFieldQuery, chunkPlanes } from '../src/components/gallery/infinite-field.js';

const source = readFileSync(new URL('../src/components/gallery/vendor/DomeGallery.jsx', import.meta.url), 'utf8');
const file = ts.createSourceFile('DomeGallery.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
const build = vm.runInNewContext('(' + file.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'buildItems').getText(file) + ')', { distributeDomePhotos });
const coords = Array.from(build(['one'], 34, true), c => ({ ...c }));
const directions = coords.map(c => {
  const yaw = (c.x + .5) * Math.PI / 34, pitch = (c.y - .5) * Math.PI / 34;
  return [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
});
function closePairs(ids) {
  let pairs = 0;
  for (let i = 0; i < ids.length; i++) for (let j = 0; j < i; j++) if (ids[i] === ids[j]) {
    const dot = directions[i].reduce((sum, v, axis) => sum + v * directions[j][axis], 0);
    if (dot > Math.cos(35 * Math.PI / 180)) pairs++;
  }
  return pairs;
}

test('actual Dome rings and seam spread repeated photos while preserving coverage and balanced counts', () => {
  for (const count of [36, 101]) {
    const slots = coords.map(c => Object.freeze({ ...c }));
    const assigned = distributeDomePhotos(slots, 34, count);
    assert.equal(assigned.length, 358);
    assert.deepEqual(assigned, distributeDomePhotos(slots, 34, count));
    const uses = Array.from({ length: count }, (_, id) => assigned.filter(value => value === id).length);
    assert(uses.every(n => n > 0));assert(Math.max(...uses) - Math.min(...uses) <= 1);
    const old = coords.map((_, i) => i % count);
    assert(closePairs(assigned) < closePairs(old));
    if (count === 101) assert.equal(closePairs(assigned), 0);
  }
});

test('one-photo and empty collections terminate without dropping Dome slots', () => {
  assert.deepEqual(distributeDomePhotos(coords, 34, 0), []);
  assert.deepEqual(distributeDomePhotos(coords, 34, 1), Array(358).fill(0));
  const two = distributeDomePhotos(coords, 34, 2);
  assert.equal(two.filter(n => n === 0).length, 179);
  assert.equal(two.filter(n => n === 1).length, 179);
});

test('wall neighbourhoods contain distinct photos across negative coordinates and repeated visits', () => {
  for (const [count, width] of [[101, 8], [36, 5]]) {
    const pick = createWallPhotoPicker(count), again = createWallPhotoPicker(count);
    for (const [row, col] of [[0, 0], [-15, -18], [20, -30]]) {
      const ids = [];
      for (let y = row; y < row + width; y++) for (let x = col; x < col + width; x++) {
        const id = pick(y, x);assert.equal(id, again(y, x));assert(id >= 0 && id < count);ids.push(id);
      }
      assert.equal(new Set(ids).size, width * width);
    }
  }
});

const at = (key, x, z, media, height = 4) => ({ key, x, y: 0, z, media, height });
const chunks = entries => (x, y, z) => x === 0 && y === 0 && z === 0 ? entries : [];
test('space resolves actual photo IDs, keeps the nearest instance and retains other world identities', () => {
  const entries = [at('near', -14, -40, 7), at('repeat', 14, -50, 108), at('other', 0, -45, 8)];
  const result = fieldCandidates({ x: 0, y: 0, z: 0 }, 1.7, 0, () => 1, chunks(entries), 101);
  assert.deepEqual(result.map(p => p.key), ['near', 'other']);
  assert.equal(result[0].media, 7);assert.equal(result[1].media, 8);
});

test('entry anchor owns its photo; offscreen and projection-rejected duplicates do not reserve a photo', () => {
  const anchored = fieldCandidates({ x: 0, y: 0, z: 45 }, 1.7, 7, () => 1,
    chunks([at('same-photo', 35, -60, 108), at('other', -35, -60, 9)]), 101);
  assert(anchored.some(p => p.key === 'anchor'));
  assert(!anchored.some(p => p.key === 'same-photo'));assert(anchored.some(p => p.key === 'other'));
  const entries = [at('blocker', -12, -30, 2), at('blocked', -12, -35, 7), at('visible', 12, -45, 108)];
  const visible = fieldCandidates({ x: 0, y: 0, z: 0 }, 1.7, 0, () => 1, chunks(entries), 101);
  assert.deepEqual(visible.map(p => p.key), ['blocker', 'visible']);
});

test('cached space queries remain deterministic across chunk boundaries and never duplicate an accepted ID', () => {
  const query = createFieldQuery(), views = [{ x: 0, y: 0, z: -45 }, { x: 112, y: -115, z: -280 }, { x: -1200, y: 850, z: -970 }];
  for (const camera of views) {
    const result = query(camera, 1.7, 20, () => 1.3, 101);
    const ids = result.map(p => p.key === 'anchor' ? 20 : p.media % 101);
    assert.equal(new Set(ids).size, ids.length);assert(result.length <= 96);assert(result.length > 0);
    const direct = fieldCandidates(camera, 1.7, 20, () => 1.3, chunkPlanes, 101);
    assert.deepEqual(result.map(p => [p.key, p.media]), direct.map(p => [p.key, p.media]));
  }
  assert.deepEqual(query(views[0], 1.7, 20, () => 1.3, 101).map(p => [p.key, p.media]),
    fieldCandidates(views[0], 1.7, 20, () => 1.3, chunkPlanes, 101).map(p => [p.key, p.media]));
});
