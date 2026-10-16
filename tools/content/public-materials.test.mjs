import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { validateManifest, stageAsset } from './prepare-public-materials.mjs';

const bytes = Buffer.from('%PDF-small-fixture');
const asset = { sourceId: 'source-example', file: 'materials/source-example.pdf', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), url: 'https://github.com/0ne-small-stone/personal-homepage/releases/download/learning-materials-test/source-example.pdf' };
const manifest = { schemaVersion: 1, repository: '0ne-small-stone/personal-homepage', releaseTag: 'learning-materials-test', files: [asset] };
const tempRoot = resolve('.ci-tmp'); mkdirSync(tempRoot, { recursive: true });
async function fixture(run) { const root = mkdtempSync(join(tempRoot, 'materials-test-')); try { await run(root); } finally { assert(resolve(root).startsWith(tempRoot + sep)); rmSync(root, { recursive: true, force: true }); } }

test('publishing manifest rejects external origins, traversal, duplicate IDs and stale identity', () => {
  assert.equal(validateManifest(manifest).length, 1);
  for (const change of [{ url: 'https://example.invalid/file.pdf' }, { file: '../secret.pdf' }, { sourceId: '../secret' }, { bytes: -1 }, { sha256: '' }]) assert.throws(() => validateManifest({ ...manifest, files: [{ ...asset, ...change }] }));
  assert.throws(() => validateManifest({ ...manifest, files: [asset, asset] }));
  assert.throws(() => validateManifest({ ...manifest, repository: 'another/repo' }));
});
test('download checks bytes before publishing and only valid cache avoids network', () => fixture(async root => {
  let requests = 0;
  const fetchImpl = async () => { requests++; return new Response(bytes); };
  assert.equal(await stageAsset(root, asset, { fetchImpl }), 'downloaded');
  assert.deepEqual(readFileSync(join(root, asset.file)), bytes);
  assert.equal(await stageAsset(root, asset, { fetchImpl }), 'cached');
  assert.equal(requests, 1);
}));
test('corrupt or truncated downloads cannot replace the previous file and leave no partial asset', () => fixture(async root => {
  mkdirSync(join(root, 'materials')); const target = join(root, asset.file); writeFileSync(target, 'previous-invalid-copy');
  for (const body of [Buffer.alloc(bytes.length, 0), bytes.subarray(0, 5), Buffer.concat([bytes, bytes])]) {
    await assert.rejects(stageAsset(root, asset, { fetchImpl: async () => new Response(body) }), /checksum|size/i);
    assert.equal(readFileSync(target, 'utf8'), 'previous-invalid-copy');
    assert.deepEqual(readdirSync(join(root, 'materials')), ['source-example.pdf']);
  }
}));
test('HTTP failure never creates a readable target', () => fixture(async root => {
  await assert.rejects(stageAsset(root, asset, { fetchImpl: async () => new Response('not found', { status: 404 }) }), /HTTP 404/);
  assert.equal(existsSync(join(root, asset.file)), false);
}));
test('validated local staging uses the same path and rejects changed originals', () => fixture(async root => {
  const sourceFile = join(root, 'original.pdf'); writeFileSync(sourceFile, bytes);
  assert.equal(await stageAsset(root, asset, { sourceFile }), 'staged');
  writeFileSync(sourceFile, Buffer.alloc(bytes.length)); writeFileSync(join(root, asset.file), 'invalid-cache');
  await assert.rejects(stageAsset(root, asset, { sourceFile }), /checksum/);
  assert.equal(readFileSync(join(root, asset.file), 'utf8'), 'invalid-cache');
}));
