import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createMusicPreview } from './preview-service.mjs';
import { createRecommendationService } from './recommendation-service.mjs';

const base = '/personal-homepage';
async function running(t, server) {
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return `http://127.0.0.1:${server.address().port}`;
}
async function files() {
  const root = path.resolve('.local-tools/music/http-test', randomUUID());
  await mkdir(path.join(root, 'music'), { recursive: true });
  await writeFile(path.join(root, 'music/index.html'), '<h1>HTTP fixture</h1>');
  await writeFile(path.join(root, 'music/中文 #%.txt'), '0123456789abcdef');
  await writeFile(path.join(root, '.private'), 'PRIVATE_FILE');
  await writeFile(path.join(root, 'empty.txt'), '');
  return root;
}
function splitPost(url, value) {
  const buffer = Buffer.from(JSON.stringify(value));
  const split = buffer.findIndex(byte => byte >= 128) + 1;
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST', headers: { Origin: new URL(url).origin, 'Content-Type': 'application/json', 'Content-Length': buffer.length } }, response => {
      const chunks = []; response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    req.on('error', reject); req.write(buffer.subarray(0, split));
    setTimeout(() => req.end(buffer.subarray(split)), 15);
  });
}
const post = (origin, route, body, headers = {}) => fetch(origin + base + route, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body });

test('real preview JSON handles split Unicode and keeps each endpoint byte limit', async t => {
  const keywords = []; let qr = 0;
  const server = createMusicPreview({ root: await files(), playback: { start() {}, stop() {} }, account: { state: () => ({ authorized: false }), createQr: async () => { qr++; return {}; }, dispose() {} }, downloads: {
    search: async (_source, keyword) => { keywords.push(keyword); return { ok: true }; }, jobs: () => [], dispose() {},
  } });
  const origin = await running(t, server);
  const keyword = '中文搜索🎵';
  assert.equal((await splitPost(origin + base + '/api/music/lx/search', { source: 'kw', keyword })).status, 200);
  assert.deepEqual(keywords, [keyword]);
  for (const [route, limit] of [['/api/music/playback/qr', 1024], ['/api/music/lx/search', 2048], ['/api/music/netease', 8192]]) {
    assert.equal((await post(origin, route, JSON.stringify({ padding: '界'.repeat(Math.ceil(limit / 3)) }))).status, 413);
    for (const body of ['', '[]', 'null', '42', '{"secret":"PRIVATE_REQUEST"']) {
      const response = await post(origin, route, body);
      assert.equal(response.status, 400); assert.doesNotMatch(await response.text(), /PRIVATE_REQUEST|SyntaxError|Unexpected/);
    }
  }
  assert.equal(qr, 0); assert.equal(keywords.length, 1);
  assert.equal((await post(origin, '/api/music/playback/qr', '{}', { 'Content-Encoding': 'gzip' })).status, 400);
  assert.equal((await post(origin, '/api/music/playback/qr', '{}')).status, 200); assert.equal(qr, 1);
});

test('both real servers stream public files with HEAD, Range and encoded names', async t => {
  const root = await files();
  const servers = [
    createMusicPreview({ root, playback: { start() {}, stop() {} }, account: { dispose() {} } }),
    createRecommendationService({ root, adapter: {}, store: {} }),
  ];
  for (const server of servers) {
    const origin = await running(t, server);
    const page = origin + base + '/music';
    for (const url of [page, page + '/']) { const result = await fetch(url, { redirect: 'manual' }); assert.equal(result.status, 200); assert.match(await result.text(), /HTTP fixture/); }
    const url = page + '/' + encodeURIComponent('中文 #%.txt');
    const head = await fetch(url, { method: 'HEAD' });
    assert.equal(head.status, 200); assert.equal(head.headers.get('content-length'), '16'); assert.equal(await head.text(), '');
    assert.equal(head.headers.get('cache-control'), 'no-store'); assert.equal(head.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(head.headers.get('etag'), null); assert.equal(head.headers.get('last-modified'), null);
    const part = await fetch(url, { headers: { Range: 'bytes=4-7' } });
    assert.equal(part.status, 206); assert.equal(part.headers.get('content-range'), 'bytes 4-7/16'); assert.equal(await part.text(), '4567');
    const invalid = await fetch(url, { headers: { Range: 'bytes=99-' } });
    assert.equal(invalid.status, 416); assert.equal(invalid.headers.get('content-range'), 'bytes */16');
    assert.equal((await fetch(origin + base + '/.private')).status, 403);
    assert.ok([403, 404].includes((await fetch(page + '/%2e%2e%5c%2e%2e%5c.private')).status));
    const missing = await fetch(page + '/missing'); assert.equal(missing.status, 404); assert.doesNotMatch(await missing.text(), /http-test|Error|stack/);
    const empty = await fetch(origin + base + '/empty.txt'); assert.equal(empty.status, 200); assert.equal(await empty.text(), '');
    assert.equal((await fetch(page, { method: 'POST' })).status, 405);
  }
});

test('recommendation adapter preserves origin gates, rate limiting and review contracts', async t => {
  const submitted = []; const reviewed = [];
  const adapter = { authorized: () => false, account: () => null, logout() {} };
  const store = { status: () => null, list: () => [], submit: async input => { submitted.push(input); return { ok: true }; }, review: async (...args) => { reviewed.push(args); return { ok: true }; } };
  const origin = await running(t, createRecommendationService({ root: await files(), adapter, store }));
  const route = '/api/music/recommendations';
  const response = await splitPost(origin + base + route, { nickname: '测试访客', song: '1', reason: '模拟推荐，不写真实歌单' });
  assert.equal(response.status, 201); assert.equal(submitted[0].nickname, '测试访客');
  for (const headers of [{ Origin: '' }, { Origin: 'https://foreign.example' }, { 'Sec-Fetch-Site': 'cross-site' }]) assert.equal((await post(origin, route, '{}', headers)).status, 403);
  const forgedHost = await new Promise((resolve, reject) => {
    const req = http.request(origin + base + route, { method: 'POST', headers: { Host: 'foreign.example', Origin: origin, 'Content-Type': 'application/json' } }, response => { response.resume(); response.on('end', () => resolve(response.statusCode)); });
    req.on('error', reject); req.end('{}');
  });
  assert.equal(forgedHost, 403);
  for (const body of ['[]', 'null', '{PRIVATE_REQUEST']) assert.equal((await post(origin, route, body)).status, 400);
  assert.equal((await post(origin, route, JSON.stringify({ reason: 'x'.repeat(8193) }))).status, 413);
  for (let i = 1; i < 10; i++) assert.equal((await post(origin, route, '{}')).status, 201);
  assert.equal((await post(origin, route, '{}')).status, 429); assert.equal(submitted.length, 10);
  assert.equal((await post(origin, '/api/music/admin/review', '{"id":"fixture","decision":"approve"}')).status, 200);
  assert.deepEqual(reviewed, [['fixture', 'approve']]);
  assert.equal((await post(origin, '/api/music/unknown', '{}')).status, 404);
});
