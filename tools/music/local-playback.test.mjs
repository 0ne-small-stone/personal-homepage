import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { localAudioMiddleware, localAudioUrls } from './local-playback.mjs';
import { parseMusicCatalog } from '../../src/lib/music.ts';

test('local music HTTP playback and private-file boundaries', async t => {
  const folder = path.resolve('.local-tools/music/local-playback-test', `${Date.now()}`);
  const directory = path.join(folder, 'audio');
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, 'sample.flac');
  await writeFile(file, '0123456789abcdef');
  const info = await stat(file);
  const id = 'a'.repeat(24);
  const coverDirectory = path.join(folder, 'covers');
  await mkdir(coverDirectory, { recursive: true });
  const cover = Buffer.from('UklGRhIAAABXRUJQVlA4TAUAAAAvAAAAAA==', 'base64');
  await writeFile(path.join(coverDirectory, `${id}.webp`), cover);
  const outsideId = 'b'.repeat(24);
  const outside = path.join(folder, 'outside.flac');
  await writeFile(outside, 'private');
  const outsideInfo = await stat(outside);
  const manifestFile = path.join(folder, 'audio-map.json');
  await writeFile(manifestFile, JSON.stringify({ version: 1, directory, files: [
    { id, relative: 'sample.flac', size: info.size, mtimeMs: info.mtimeMs, cover: true },
    { id: outsideId, relative: '../outside.flac', size: outsideInfo.size, mtimeMs: outsideInfo.mtimeMs },
  ] }));
  const middleware = localAudioMiddleware({ base: '/personal-homepage', manifestFile });
  const server = http.createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const url = `${origin}/personal-homepage/music/local-audio/${id}/`;
  const coverUrl = `${origin}/personal-homepage/music/local-cover/${id}/`;
  try {
    await t.test('HEAD provides metadata without file body', async () => {
      const r = await fetch(url, { method: 'HEAD' });
      assert.equal(r.status, 200); assert.equal(r.headers.get('content-length'), '16');
      assert.equal(r.headers.get('content-type'), 'audio/flac'); assert.equal(await r.text(), '');
    });
    await t.test('indexed artwork has image MIME and HEAD without content', async () => {
      const r = await fetch(coverUrl);
      assert.equal(r.status, 200);assert.equal(r.headers.get('content-type'), 'image/webp');
      assert.deepEqual(Buffer.from(await r.arrayBuffer()), cover);
      const head = await fetch(coverUrl, { method: 'HEAD' });
      assert.equal(head.status, 200);assert.equal(head.headers.get('content-length'), String(cover.length));assert.equal(await head.text(), '');
    });
    await t.test('artwork rejects cross-site requests and unknown/unindexed IDs', async () => {
      assert.equal((await fetch(coverUrl, { headers: { Origin: 'https://example.com' } })).status, 403);
      assert.equal((await fetch(coverUrl, { method: 'POST' })).status, 405);
      for (const target of [outsideId, 'c'.repeat(24), '%2e%2e%2fprivate']) {
        assert.equal((await fetch(`${origin}/personal-homepage/music/local-cover/${target}/`)).status, 404);
      }
    });
    await t.test('partial and suffix requests provide seekable bytes', async () => {
      const r = await fetch(url, { headers: { Range: 'bytes=4-7' } });
      assert.equal(r.status, 206); assert.equal(r.headers.get('content-range'), 'bytes 4-7/16');
      assert.equal(await r.text(), '4567');
      const suffix = await fetch(url, { headers: { Range: 'bytes=-3' } });
      assert.equal(suffix.status, 206); assert.equal(await suffix.text(), 'def');
    });
    await t.test('invalid and multipart ranges do not read files', async () => {
      for (const Range of ['bytes=16-', 'bytes=0-1,4-5', 'bytes=-0', 'bytes=99999999999999999999-']) {
        const r = await fetch(url, { headers: { Range } });
        assert.equal(r.status, 416); assert.equal(r.headers.get('content-range'), 'bytes */16');
        assert.equal(await r.text(), '');
      }
    });
    await t.test('foreign origins, cross-site and rebound Host are rejected', async () => {
      for (const headers of [{ Origin: 'https://example.com' }, { 'Sec-Fetch-Site': 'cross-site' }, { Host: 'example.com' }]) {
        const status = await new Promise((resolve, reject) => {
          const request = http.get(url, { headers }, response => {
            response.resume(); response.on('end', () => resolve(response.statusCode));
          });
          request.on('error', reject);
        });
        assert.equal(status, 403, JSON.stringify(headers));
      }
    });
    await t.test('unknown IDs and filesystem escape cannot expose audio', async () => {
      for (const target of ['c'.repeat(24), outsideId, '%2e%2e%2foutside.flac']) {
        const r = await fetch(`${origin}/personal-homepage/music/local-audio/${target}/`);
        assert.equal(r.status, 404); assert.equal(await r.text(), '');
      }
      assert.equal((await fetch(url, { method: 'POST' })).status, 405);
    });
    await t.test('cloud outages use the verified original audio and artwork without exposing paths', async () => {
      const remote = value => `https://pan.koala-studio.org.cn/public.php/dav/files/share/tracks/${value}.flac`;
      const catalog = { version: 1, tracks: [id, outsideId, 'c'.repeat(24)].map(value => ({ id: value, title: 'Cloud song', audioUrl: remote(value), coverUrl: `https://example.com/${value}.webp` })) };
      const mapped = await localAudioUrls(catalog, '/personal-homepage', manifestFile, { preferLocal: true });
      assert.equal(mapped.tracks[0].audioUrl, new URL(url).pathname);
      assert.equal(mapped.tracks[0].coverUrl, new URL(coverUrl).pathname);
      assert.equal(mapped.tracks[1].audioUrl, remote(outsideId), 'directory escapes must retain the remote URL');
      assert.equal(mapped.tracks[2].audioUrl, remote('c'.repeat(24)), 'unavailable files must retain the remote URL');
      assert.equal(await (await fetch(origin + mapped.tracks[0].audioUrl)).text(), '0123456789abcdef');
      assert.deepEqual(Buffer.from(await (await fetch(origin + mapped.tracks[0].coverUrl)).arrayBuffer()), cover);
      assert.ok(!JSON.stringify(mapped).includes(directory));
      assert.equal(parseMusicCatalog(mapped).tracks[0].audioUrl, null, 'production still strips local playback URLs');
    });
    await t.test('new web downloads can fall through without bypassing indexed file boundaries', async () => {
      let fallthrough = 0;
      const local = localAudioMiddleware({ base: '/personal-homepage', manifestFile, fallthroughIfMissing: true });
      const combined = http.createServer((req, res) => local(req, res, () => { fallthrough++;res.statusCode = 404;res.end(); }));
      await new Promise(resolve => combined.listen(0, '127.0.0.1', resolve));
      const combinedOrigin = `http://127.0.0.1:${combined.address().port}`;
      try {
        assert.equal((await fetch(`${combinedOrigin}/personal-homepage/music/local-audio/${'c'.repeat(24)}/`)).status, 404);
        assert.equal(fallthrough, 1);
        assert.equal((await fetch(`${combinedOrigin}/personal-homepage/music/local-audio/${outsideId}/`)).status, 404);
        assert.equal((await fetch(`${combinedOrigin}/personal-homepage/music/local-audio/${id}/`, { headers: { Origin: 'https://example.com' } })).status, 403);
        assert.equal(fallthrough, 1, 'unsafe requests never reach another file handler');
      } finally { await new Promise(resolve => combined.close(resolve)); }
    });
    await t.test('changed downloads are unavailable until reindexed', async () => {
      await writeFile(file, 'changed download bytes');
      assert.equal((await fetch(url)).status, 409);
      assert.equal((await fetch(url)).headers.get('cache-control'), 'no-store');
      const remote = 'https://example.com/original.flac';
      const mapped = await localAudioUrls({ version: 1, tracks: [{ id, audioUrl: remote }] }, '/personal-homepage', manifestFile, { preferLocal: true });
      assert.equal(mapped.tracks[0].audioUrl, remote);
    });
    await t.test('public catalog contains no private paths; production strips local URLs', async () => {
      const catalog = { version: 1, updatedAt: null, tracks: [{ id, title: 'Test', audioUrl: null }] };
      const mapped = await localAudioUrls(catalog, '/personal-homepage/', manifestFile);
      assert.ok(mapped.tracks[0].audioUrl.endsWith(`${id}/`));
      assert.ok(!JSON.stringify(mapped).includes(directory));
      assert.equal(parseMusicCatalog(mapped).tracks[0].audioUrl, null);
      assert.equal(parseMusicCatalog(mapped, true).tracks[0].audioUrl, mapped.tracks[0].audioUrl);
      assert.ok(mapped.tracks[0].coverUrl.endsWith(`${id}/`));
      assert.equal(parseMusicCatalog(mapped).tracks[0].coverUrl, null);
      assert.equal(parseMusicCatalog(mapped, true).tracks[0].coverUrl, mapped.tracks[0].coverUrl);
      for (const audioUrl of ['file:///secret.flac', '//example.com/song', '/other/secret.flac']) {
        assert.equal(parseMusicCatalog({ ...catalog, tracks: [{ id, title: 'Test', audioUrl }] }, true).tracks[0].audioUrl, null);
      }
      assert.equal(JSON.parse(await readFile(manifestFile, 'utf8')).directory, directory);
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
