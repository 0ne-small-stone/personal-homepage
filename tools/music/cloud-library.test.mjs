import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { cloudBase, stageTrack, verifyRemoteFile, syncCloudLibrary, snapshotUrls } from './cloud-library.mjs';
import { createUploader } from './cloud-upload.mjs';

test('cloud staging never publishes pending or changing downloads', async t => {
  const folder = path.resolve('.local-tools/music/cloud-test', String(Date.now()));
  const root = path.join(folder, 'source');
  const destination = path.join(folder, 'mirror');
  await mkdir(root, { recursive: true });
  const source = path.join(root, 'track.flac');
  await writeFile(source, 'fLaCtest fixture');
  const info = await stat(source), id = 'a'.repeat(24);
  const entry = { id, relative: 'track.flac', size: info.size, mtimeMs: info.mtimeMs };
  const track = { id, title: '测试文件', format: 'flac', duration: 5 };
  const configPath = path.join(folder, 'config.json'), mapPath = path.join(folder, 'map.json'), catalogPath = path.join(folder, 'catalog.json');
  await writeFile(configPath, JSON.stringify({ version: 1, shareUrl: 'https://pan.koala-studio.org.cn/s/testShare', initialImportFiles: [entry] }));
  await writeFile(mapPath, JSON.stringify({ version: 1, directory: root, files: [entry] }));
  await writeFile(catalogPath, JSON.stringify({ version: 1, tracks: [track] }));
  const options = { directory: destination, configPath, mapPath, catalogPath };
  const remote = (status, length, modified) => async () => new Response(null, { status, headers: { 'Content-Length': String(length), 'Last-Modified': modified } });
  await t.test('only the configured Koala share is accepted', () => {
    assert.equal(cloudBase('https://pan.koala-studio.org.cn/s/testShare'), 'https://pan.koala-studio.org.cn/public.php/dav/files/testShare/');
    for (const url of ['http://pan.koala-studio.org.cn/s/test', 'https://example.com/s/test', 'https://pan.koala-studio.org.cn/s/test?secret=x', 'https://user:pass@pan.koala-studio.org.cn/s/test']) assert.throws(() => cloudBase(url));
  });
  await t.test('staging preserves original bytes and modification time', async () => {
    const staged = await stageTrack(entry, track, root, destination);
    assert.ok(staged);assert.equal(await readFile(source, 'utf8'), 'fLaCtest fixture');
    assert.deepEqual(await readFile(path.join(destination, staged.name)), await readFile(source));
    assert.ok(Math.abs((await stat(path.join(destination, staged.name))).mtimeMs - info.mtimeMs) < 2);
  });
  await t.test('directory escape and changed source are excluded', async () => {
    const outside = path.join(folder, 'outside.flac');await writeFile(outside, 'private');
    await assert.rejects(stageTrack({ ...entry, relative: '../outside.flac' }, track, root, destination));
    assert.equal(await stageTrack({ ...entry, size: info.size + 1 }, track, root, destination), null);
  });
  await t.test('missing and partial remote files remain unpublished', async () => {
    for (const request of [remote(404, 0, info.mtime.toUTCString()), remote(200, info.size - 1, info.mtime.toUTCString()), remote(200, info.size, new Date(0).toUTCString())]) {
      assert.equal(await verifyRemoteFile('https://pan.koala-studio.org.cn/test', { size: info.size, modified: Math.floor(info.mtimeMs / 1000) }, request), false);
      assert.deepEqual(await syncCloudLibrary({ ...options, request }), { indexed: 1, verified: 0, pending: 1 });
      assert.equal(JSON.parse(await readFile(path.join(destination, 'catalog.json'), 'utf8')).tracks.length, 0);
    }
  });
  await t.test('verified remote file is published without private paths', async () => {
    const request = remote(200, info.size, info.mtime.toUTCString());
    assert.deepEqual(await syncCloudLibrary({ ...options, request }), { indexed: 1, verified: 1, pending: 0 });
    const text = await readFile(path.join(destination, 'catalog.json'), 'utf8'), catalog = JSON.parse(text);
    assert.ok(catalog.tracks[0].audioUrl.endsWith(`/tracks/${id}.flac`));
    assert.ok(!text.includes(root));assert.ok(!text.includes('mtimeMs'));assert.ok(!text.includes('relative'));
    await syncCloudLibrary({ ...options, request });
    assert.equal(await readFile(path.join(destination, 'catalog.json'), 'utf8'), text);
  });
  await t.test('remote deletion removes the published entry while original remains', async () => {
    assert.deepEqual(await syncCloudLibrary({ ...options, request: remote(404, 0, info.mtime.toUTCString()) }), { indexed: 1, verified: 0, pending: 1 });
    assert.equal(JSON.parse(await readFile(path.join(destination, 'catalog.json'), 'utf8')).tracks.length, 0);
    assert.equal(await readFile(source, 'utf8'), 'fLaCtest fixture');
  });
  await t.test('rate limiting preserves the previous public catalog', async () => {
    const before = await readFile(path.join(destination, 'catalog.json'), 'utf8');
    await assert.rejects(syncCloudLibrary({ ...options, request: remote(429, 0, info.mtime.toUTCString()) }));
    assert.equal(await readFile(path.join(destination, 'catalog.json'), 'utf8'), before);
  });
  await t.test('future downloads require LX completion, even if file bytes are stable', async () => {
    await writeFile(configPath, JSON.stringify({ version: 1, shareUrl: 'https://pan.koala-studio.org.cn/s/testShare' }));
    const request = remote(200, info.size, info.mtime.toUTCString());
    assert.deepEqual(await syncCloudLibrary({ ...options, request, completedFiles: new Set() }), { indexed: 1, verified: 0, pending: 1 });
    await writeFile(configPath, JSON.stringify({ version: 1, shareUrl: 'https://pan.koala-studio.org.cn/s/testShare', initialImportFiles: [{ ...entry, size: entry.size + 1 }] }));
    assert.deepEqual(await syncCloudLibrary({ ...options, request, completedFiles: new Set() }), { indexed: 1, verified: 0, pending: 1 });
    assert.deepEqual(await syncCloudLibrary({ ...options, request, completedFiles: new Set([source.toLowerCase()]) }), { indexed: 1, verified: 1, pending: 0 });
  });
  await t.test('covers verify decompressed bytes and reject incorrect or oversized data', async () => {
    const bytes = Buffer.from('artwork fixture');
    const expected = { size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
    assert.equal(await verifyRemoteFile('https://example.test/cover', expected, async () => new Response(bytes, { headers: { 'Content-Length': '7', 'Content-Encoding': 'gzip' } })), true);
    assert.equal(await verifyRemoteFile('https://example.test/cover', expected, async () => new Response('different bytes')), false);
    await assert.rejects(verifyRemoteFile('https://example.test/cover', expected, async () => new Response(Buffer.alloc(2 * 1024 * 1024 + 1))));
  });
  await t.test('read-only snapshot discovery rejects other folders and entity definitions', () => {
    const base = cloudBase('https://pan.koala-studio.org.cn/s/testShare');
    const name = `1791863787733-${'a'.repeat(64)}.json`;
    const good = `${base}LSSH-AutoSync/catalogs/${name}`;
    assert.deepEqual(snapshotUrls(`<d:href>${good}</d:href><d:href>https://evil.test/${name}</d:href><d:href>${base}other/${name}</d:href>`, base), [good]);
    assert.throws(() => snapshotUrls('<!DOCTYPE x><d:href>bad</d:href>', base));
  });
  await t.test('new completed audio is uploaded before its immutable snapshot; retries do not duplicate it', async () => {
    const config = { base: cloudBase('https://pan.koala-studio.org.cn/s/testShare') };
    const cloud = new Map(), calls = [];
    const request = async (url, options = {}) => {
      url = String(url);calls.push({ url, method: options.method || 'GET' });
      if (options.method === 'PUT') {
        assert.ok(url.includes('/writeOnly/'));
        assert.equal(options.headers['X-NC-Nickname'], 'LSSH-AutoSync');
        assert.equal(options.headers['If-None-Match'], '*');
        assert.equal(options.headers.Authorization, undefined);
        const chunks = [];for await (const chunk of options.body) chunks.push(chunk);
        const body = Buffer.concat(chunks);
        assert.equal(body.length, Number(options.headers['Content-Length']));
        assert.equal(options.headers['OC-Checksum'], `SHA256:${createHash('sha256').update(body).digest('hex')}`);
        const reader = url.replace('/writeOnly/', '/testShare/LSSH-AutoSync/');
        assert.equal(cloud.has(reader), false); // Existing objects are never overwritten.
        cloud.set(reader, { body, modified: Number(options.headers['X-OC-MTime']) });
        return new Response(null, { status: 201 });
      }
      const entry = cloud.get(url);
      if (!entry) return new Response(null, { status: 404 });
      return new Response(options.method === 'HEAD' ? null : entry.body, { headers: { 'Content-Length': String(entry.body.length), 'Last-Modified': new Date(entry.modified * 1000).toUTCString() } });
    };
    const uploader = await createUploader(config, { request, secret: 'https://pan.koala-studio.org.cn/s/writeOnly' });
    const completedFiles = new Set([source.toLowerCase()]);
    const result = await syncCloudLibrary({ ...options, request, completedFiles, uploader });
    assert.deepEqual(result, { indexed: 1, verified: 1, pending: 0 });
    const catalog = JSON.parse(await readFile(path.join(destination, 'catalog.json'), 'utf8'));
    assert.ok(catalog.tracks[0].audioUrl.includes('/testShare/LSSH-AutoSync/tracks/'));
    const puts = calls.filter(c => c.method === 'PUT');
    assert.equal(puts.length, 2);assert.ok(puts[0].url.includes('/tracks/'));assert.ok(puts[1].url.includes('/catalogs/'));
    await syncCloudLibrary({ ...options, request, completedFiles, uploader });
    assert.equal(calls.filter(c => c.method === 'PUT').length, 2);
    const oldBytes = await readFile(path.join(destination, 'catalog.json'));
    const failUploader = { ensureFile: async () => { throw new Error('429'); }, publishCatalog: async () => assert.fail('failed audio must not publish') };
    await assert.rejects(syncCloudLibrary({ ...options, request: remote(404, 0, info.mtime.toUTCString()), completedFiles, uploader: failUploader }));
    assert.deepEqual(await readFile(path.join(destination, 'catalog.json')), oldBytes);
  });
});
