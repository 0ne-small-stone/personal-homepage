import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {builtinModules} from 'node:module';
import {createServer} from 'node:http';
import {createHash, randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

const origin = 'https://0ne-small-stone.github.io';
const base = 'https://music-worker.test/personal-homepage/api/music/';
const initialTime = 1800000000000;
const key = Buffer.alloc(32, 37).toString('base64');

test('complete gateway runs in workerd with real D1 and synthetic upstream accounts', async t => {
  // A real pending HTTP subrequest keeps workerd's request context alive. Never
  // resolve a Promise created by another worker request: that is not a valid
  // substitute for a delayed upstream response in this runtime.
  const pending = [];
  const gateServer = createServer((request, response) => {
    const match = /^\/gate\/(key|check|status)$/.exec(request.url);
    if (!match) { response.writeHead(404).end(); return; }
    pending.push({kind: match[1], response});
  });
  await new Promise(resolve => gateServer.listen(0, '127.0.0.1', resolve));
  t.after(() => { for (const item of pending) item.response.end(); return new Promise(resolve => gateServer.close(resolve)); });
  const gateOrigin = `http://127.0.0.1:${gateServer.address().port}`;
  const builtins = new Set(builtinModules.map(name => name.replace(/^node:/, '')));
  const bundle = await build({
    stdin: {
      resolveDir: fileURLToPath(new URL('.', import.meta.url)), loader: 'js',
      sourcefile: 'gateway-runtime-fixture.mjs',
      contents: `
        import {createEdgeMusic} from './worker.mjs';
        const state = {sequence: 0, user: 'a', hold: '', keys: new Map(), invalid: new Set(), calls: [], at: ${initialTime}};
        const users = {a: {userId: 17, nickname: 'Synthetic A'}, b: {userId: 29, nickname: 'Synthetic B'}};
        const owner = cookie => typeof cookie === 'string' ? cookie.replace('synthetic-cookie-', '') : '';
        async function gate(kind) {
          if (state.hold === kind) await fetch(${JSON.stringify(gateOrigin)} + '/gate/' + kind);
        }
        const sdk = {
          async login_qr_key() {
            const key = 'synthetic-key-' + (++state.sequence); state.keys.set(key, state.user);
            await gate('key'); return {body: {code: 200, data: {unikey: key}}};
          },
          async login_qr_check({key}) {
            const user = state.keys.get(key);
            await gate('check');
            return {body: user ? {code: 803, cookie: 'synthetic-cookie-' + user} : {code: 800}};
          },
          async login_status({cookie}) {
            const id = owner(cookie); state.calls.push({method: 'status', user: id});
            const invalid = state.invalid.has(id); await gate('status');
            return {body: {code: 200, data: invalid ? {code: 301} : {code: 200, profile: users[id]}}};
          },
          async likelist({cookie, uid}) {
            const id = owner(cookie); state.calls.push({method: 'liked', user: id, uid});
            if (!users[id] || String(users[id].userId) !== String(uid)) throw Error('synthetic cross-account access');
            return {body: {code: 200, ids: id === 'a' ? [101, 102] : [201]}};
          },
          async song_url_v1({cookie}) {
            state.calls.push({method: 'resolve', user: owner(cookie)});
            return {body: {code: 200, data: [{id: 101, code: 404, url: null}]}};
          },
        };
        const gateway = createEdgeMusic({sdk, encodeQr: key => 'data:image/png;base64,' + btoa(key), now: () => state.at});
        export default {
          async fetch(request, env, ctx) {
            if (new URL(request.url).pathname === '/fixture') {
              const input = await request.json();
              if (input.operation === 'reset') {
                state.sequence = 0; state.user = 'a'; state.hold = ''; state.keys.clear(); state.invalid.clear(); state.calls.length = 0; state.at = ${initialTime};
              }
              if (input.user) state.user = input.user;
              if ('hold' in input) state.hold = input.hold;
              if (input.invalidate) state.invalid.add(input.invalidate);
              if (input.advance) state.at += input.advance;
              return Response.json({isolate: typeof WebSocketPair === 'function', sequence: state.sequence,
                calls: state.calls});
            }
            return gateway.fetch(request, {...env, MUSIC_PAGE_ORIGIN: ${JSON.stringify(origin)}, MUSIC_SESSION_KEY: ${JSON.stringify(key)}}, ctx);
          },
        };
      `,
    },
    bundle: true, write: false, format: 'esm', platform: 'neutral',
    mainFields: ['module', 'main'], conditions: ['workerd', 'worker', 'node'],
    banner: {js: 'import {createRequire as __testRequire} from "node:module"; const require = __testRequire("/index.js");'},
    plugins: [{name: 'node-builtins', setup(builder) {
      builder.onResolve({filter: /^(?:node:)?[\w/-]+$/}, ({path}) => {
        const name = path.replace(/^node:/, '');
        return builtins.has(name) ? {path: `node:${name}`, external: true} : undefined;
      });
    }}],
  });
  const options = revision => ({workers: [{config: {
    name: 'music-gateway-test', compatibilityDate: '2026-10-20', compatibilityFlags: ['nodejs_compat'],
    manifest: {mainModule: 'index.js', modules: {'index.js': {type: 'esm', contents: bundle.outputFiles[0].text + `\n// isolate revision ${revision}`}}},
    env: {DB: {type: 'd1', id: 'music-gateway-test'}},
  }}]});
  const mf = new Miniflare(options(0));
  t.after(() => mf.dispose());
  let db = await mf.getD1Database('DB'), revision = 0;
  const migration = await readFile(new URL('../../migrations/0001_sessions.sql', import.meta.url), 'utf8');
  for (const sql of migration.split(';').map(value => value.trim()).filter(Boolean)) await db.prepare(sql).run();
  const fixture = async input => {
    const response = await mf.dispatchFetch('https://music-worker.test/fixture', {method: 'POST', body: JSON.stringify(input)});
    assert.equal(response.status, 200, await response.clone().text());
    const body = await response.json(); assert.equal(body.isolate, true);
    if (input.release) {
      const index = pending.findIndex(item => item.kind === input.release);
      if (index >= 0) pending.splice(index, 1)[0].response.end('released');
    }
    return {...body, pending: pending.map(item => item.kind)};
  };
  t.beforeEach(async () => {
    assert.equal(pending.length, 0, 'previous synthetic upstream requests must have completed');
    await fixture({operation: 'reset'});
    await db.batch([db.prepare('DELETE FROM music_device_nonces'), db.prepare('DELETE FROM music_device_sessions'), db.prepare('DELETE FROM music_rate_limits')]);
  });
  const decode = async response => {
    const body = await response.text();
    assert.match(response.headers.get('Content-Type') || '', /application\/json/, body);
    return {status: response.status, headers: response.headers, body: JSON.parse(body)};
  };
  async function enroll() {
    const keys = await crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign', 'verify']);
    const publicJwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
    const result = await decode(await mf.dispatchFetch(base + 'session', {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify({publicJwk})}));
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return {...result.body, keys};
  }
  async function signed(device, route, input, {method = 'POST', time = initialTime} = {}) {
    const target = new URL(base + route), body = method === 'GET' ? '' : JSON.stringify(input || {});
    const nonce = randomBytes(16).toString('base64url'), milliseconds = String(time);
    const digest = createHash('sha256').update(body).digest('base64url');
    const proof = ['echoes-device-v1', device.id, milliseconds, nonce, method, target.pathname + target.search, origin, digest].join('\n');
    const signature = await crypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, device.keys.privateKey, new TextEncoder().encode(proof));
    return {url: target.href, init: {method, headers: {Origin: origin, 'Content-Type': 'application/json', 'X-Music-Session': device.id,
      'X-Music-Time': milliseconds, 'X-Music-Nonce': nonce, 'X-Music-Proof': Buffer.from(signature).toString('base64url')}, ...(method === 'GET' ? {} : {body})}};
  }
  const send = async (device, route, input, options) => { const request = await signed(device, route, input, options); return decode(await mf.dispatchFetch(request.url, request.init)); };
  async function loadQr(device, user) {
    await fixture({user}); const qr = await send(device, 'playback/qr');
    assert.equal(qr.status, 200, JSON.stringify(qr.body)); assert.match(qr.body.image, /^data:image\/png;base64,/);
    assert.equal('key' in qr.body, false); return qr;
  }
  async function login(device, user) {
    await loadQr(device, user); const checked = await send(device, 'playback/qr-check');
    assert.equal(checked.status, 200, JSON.stringify(checked.body)); assert.equal(checked.body.code, 803);
    assert.equal(checked.body.account.id, user === 'a' ? '17' : '29');
    assert.equal(checked.body.saved, true); assert.equal(checked.body.local, false);
    assert.equal(JSON.stringify(checked.body).includes('synthetic-cookie-'), false);
    return checked;
  }
  async function waitFor(kind) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await fixture({})).pending.includes(kind)) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail(`Synthetic upstream ${kind} request never reached its gate`);
  }

  await t.test('CORS is exact, unauthenticated access and arbitrary proxy paths are rejected', async () => {
    const allowed = await mf.dispatchFetch(base + 'playback/account', {method: 'OPTIONS', headers: {Origin: origin,
      'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'X-Music-Proof, X-Music-Session, X-Music-Time, X-Music-Nonce'}});
    assert.equal(allowed.status, 204); assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), origin);
    assert.equal(allowed.headers.get('Access-Control-Allow-Credentials'), null);
    const blocked = await mf.dispatchFetch(base + 'playback/account', {headers: {Origin: 'https://attacker.test'}});
    assert.equal(blocked.status, 403); assert.equal(blocked.headers.get('Access-Control-Allow-Origin'), null);
    const anonymous = await decode(await mf.dispatchFetch(base + 'playback/account', {headers: {Origin: origin}}));
    assert.equal(anonymous.status, 401); assert.equal(anonymous.body.code, 'device_session_invalid');
    assert.equal((await mf.dispatchFetch(base + 'proxy?url=https://attacker.test', {headers: {Origin: origin}})).status, 404);
    assert.equal((await mf.dispatchFetch('https://music-worker.test/healthz')).status, 200);
  });

  await t.test('two accounts, encrypted persistence, isolate restart, replay and logout stay independent', async () => {
    const a = await enroll(), b = await enroll();
    await login(a, 'a'); await login(b, 'b');
    const likes = await Promise.all([send(a, 'netease', {action: 'liked-ids'}), send(b, 'netease', {action: 'liked-ids'})]);
    assert.deepEqual(likes.map(value => value.body.ids), [['101', '102'], ['201']]);
    const stored = JSON.stringify((await db.prepare('SELECT * FROM music_device_sessions').all()).results);
    assert.equal(stored.includes('synthetic-cookie-'), false); assert.equal(stored.includes(a.id), false); assert.equal(stored.includes(b.id), false);
    const replay = await signed(a, 'playback/account', undefined, {method: 'GET'});
    assert.equal((await mf.dispatchFetch(replay.url, replay.init)).status, 200);
    await mf.setOptions(options(++revision)); db = await mf.getD1Database('DB');
    assert.equal((await fixture({})).sequence, 0, 'the worker isolate really restarted');
    assert.equal((await mf.dispatchFetch(replay.url, replay.init)).status, 401);
    assert.equal((await send(a, 'playback/account', undefined, {method: 'GET'})).body.account.id, '17');
    assert.equal((await send(b, 'playback/restore')).body.account.id, '29');
    const calls = (await fixture({})).calls;
    assert.deepEqual(calls.filter(item => item.method === 'status').map(item => item.user), ['a', 'b']);
    assert.equal((await send(a, 'playback/logout')).status, 200);
    assert.equal((await send(a, 'playback/account', undefined, {method: 'GET'})).status, 401);
    assert.equal((await send(b, 'netease', {action: 'liked-ids'})).body.ids[0], '201');
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM music_device_sessions').first()).count, 1);
  });

  await t.test('cancelling while a key is being fetched prevents a late key from reappearing', async () => {
    const device = await enroll(); await fixture({hold: 'key'});
    const loading = send(device, 'playback/qr'); await waitFor('key');
    assert.equal((await send(device, 'playback/cancel')).status, 200);
    await fixture({hold: '', release: 'key'});
    assert.equal((await loading).status, 409);
    assert.equal((await send(device, 'playback/qr-check')).body.code, 800);
    assert.equal((await send(device, 'playback/account', undefined, {method: 'GET'})).body.authorized, false);
  });

  await t.test('a late successful scan after cancellation cannot overwrite an existing login', async () => {
    const device = await enroll(); await login(device, 'a'); await loadQr(device, 'b');
    await fixture({hold: 'check'});
    const checking = send(device, 'playback/qr-check'); await waitFor('check');
    await send(device, 'playback/cancel'); await fixture({hold: '', release: 'check'});
    assert.equal((await checking).body.code, 800);
    assert.equal((await send(device, 'playback/account', undefined, {method: 'GET'})).body.account.id, '17');
  });

  await t.test('replacement QR wins over an old successful scan, and logout blocks in-flight login completion', async () => {
    const device = await enroll(); await loadQr(device, 'a'); await fixture({hold: 'check'});
    const checking = send(device, 'playback/qr-check'); await waitFor('check');
    await loadQr(device, 'b'); await fixture({hold: '', release: 'check'});
    assert.equal((await checking).body.code, 800);
    assert.equal((await send(device, 'playback/qr-check')).body.account.id, '29');
    await loadQr(device, 'a'); await fixture({hold: 'check'});
    const revoked = send(device, 'playback/qr-check'); await waitFor('check');
    await send(device, 'playback/logout'); await fixture({hold: '', release: 'check'});
    assert.equal((await revoked).body.code, 800);
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM music_device_sessions').first()).count, 0);
  });

  await t.test('an old delayed account-expired response cannot erase a newly verified login', async () => {
    const device = await enroll(); await login(device, 'a');
    await fixture({invalidate: 'a', hold: 'status'});
    const stale = send(device, 'playback/account', undefined, {method: 'GET'}); await waitFor('status');
    await fixture({hold: ''});
    await loadQr(device, 'b');
    assert.equal((await send(device, 'playback/qr-check')).body.account.id, '29');
    await fixture({release: 'status'});
    assert.equal((await stale).body.authorized, false);
    assert.equal((await send(device, 'playback/account', undefined, {method: 'GET'})).body.account.id, '29');
    assert.deepEqual((await send(device, 'netease', {action: 'liked-ids'})).body.ids, ['201']);
  });
});
