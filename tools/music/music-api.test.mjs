import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {musicApiFetch} from '../../src/lib/music-api.ts';

test('music transport preserves payload, headers and cancellation while enforcing same-origin, uncached requests', async () => {
  const controller = new AbortController();
  const headers = new Headers({'Content-Type': 'application/octet-stream', 'X-Music-Name': 'fixture.flac'});
  const body = new Uint8Array([1, 2, 3]);
  const init = {method: 'POST', headers, body, signal: controller.signal, credentials: 'include', cache: 'force-cache'};
  const response = new Response('ok');
  let received;
  const result = await musicApiFetch('/personal-homepage/api/music/netease-upload', init, async (url, options) => {
    received = {url, options};return response;
  });
  assert.equal(result, response);
  assert.equal(received.url, '/personal-homepage/api/music/netease-upload');
  assert.equal(received.options.credentials, 'same-origin');
  assert.equal(received.options.cache, 'no-store');
  assert.equal(received.options.body, body);
  assert.equal(received.options.headers, headers);
  assert.equal(received.options.signal, controller.signal);
  assert.equal(received.options.method, 'POST');
  assert.equal(init.credentials, 'include');assert.equal(init.cache, 'force-cache');
});

test('music transport leaves caller abort reasons intact', async () => {
  const controller = new AbortController();
  const reason = new DOMException('Navigation cancelled', 'AbortError');
  const pending = musicApiFetch('/personal-homepage/api/music/playback/account', {signal: controller.signal}, (_url, options) =>
    new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), {once: true})));
  controller.abort(reason);
  await assert.rejects(pending, error => error === reason);
});

const compiled = await build({entryPoints: [fileURLToPath(new URL('../../src/lib/netease-core.ts', import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node', define: {'import.meta.env.BASE_URL': '"/personal-homepage/"'}});
const {neteaseRequest} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

test('real NetEase requests carry the site session, keep the JSON contract and honor route cancellation', async t => {
  const original = globalThis.fetch;
  t.after(() => {globalThis.fetch = original;});
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({url, options});return Response.json({tracks: [], more: false});
  };
  const input = {action: 'browse', view: 'liked', page: 0};
  const controller = new AbortController();
  assert.deepEqual(await neteaseRequest(input, controller.signal), {tracks: [], more: false});
  assert.equal(requests[0].url, '/personal-homepage/api/music/netease');
  assert.equal(requests[0].options.credentials, 'same-origin');
  assert.equal(requests[0].options.cache, 'no-store');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(requests[0].options.body), input);
  assert.ok(requests[0].options.signal instanceof AbortSignal);
  const reason = new DOMException('Route changed', 'AbortError');
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), {once: true}));
  const pending = neteaseRequest(input, controller.signal);
  controller.abort(reason);
  await assert.rejects(pending, error => error === reason);
});
