import {test} from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {once} from 'node:events';
import {createOnlineMusic} from './gateway.mjs';
import {createMemorySessions} from './session-store.mjs';

const origin = 'https://radio.example';
const api = '/personal-homepage/api/music/';
const cookieName = '__Host-echoes-music';
const secret = 'FAKE_SDK_COOKIE_DO_NOT_DISCLOSE';

function cookieFrom(response) {
  const value = response.headers['set-cookie']?.[0];
  assert.ok(value, 'expected a session Set-Cookie');
  assert.match(value, /; Path=\//);
  assert.match(value, /; HttpOnly/);
  assert.match(value, /; Secure/);
  assert.match(value, /; SameSite=Lax/);
  assert.doesNotMatch(value, /; Domain=/);
  const cookie = value.split(';')[0];
  assert.match(cookie, new RegExp(`^${cookieName}=[A-Za-z0-9_-]{43}$`));
  return cookie;
}

function idFrom(cookie) { return cookie.slice(cookieName.length + 1); }

async function fixture(t) {
  const sessions = createMemorySessions();
  const staticRequests = [];
  const accounts = [];
  let nextAccount = 0;
  const accountFactory = store => {
    const instance = ++nextAccount;
    let identity = '', qr = '', disposed = false;
    const ready = store.load().then(saved => { if (saved) identity = saved.slice((secret + ':').length); });
    const state = () => ({available: true, local: true, authorized: Boolean(identity), account: identity ? {id: identity, nickname: `Listener ${identity}`} : null, saved: Boolean(identity)});
    const account = {
      ready: () => ready,
      state,
      createQr: async () => { qr = `challenge-${instance}`;return {image: 'data:image/png;base64,' + Buffer.from(qr).toString('base64'), expiresAt: Date.now() + 180000}; },
      checkQr: async () => {
        if (!qr) return {code: 800};
        identity = String(instance);qr = '';await store.save(`${secret}:${identity}`);
        return {code: 803, message: 'Fixture login confirmed', ...state()};
      },
      cancel: () => { qr = ''; },
      logout: async () => { identity = '';qr = '';await store.clear(); },
      remember: async () => { if (identity) await store.save(`${secret}:${identity}`); },
      retryRestore: async () => { const saved = await store.load();if (saved) identity = saved.slice((secret + ':').length); },
      prepare: () => ready,
      resolveTrack: async (id, quality) => {
        if (id === '401') throw Object.assign(new Error(secret), {auth: true});
        return {version: 1, updatedAt: new Date().toISOString(), tracks: [{id, status: identity ? 'full' : 'preview', previewSeconds: identity ? null : 30, audioUrl: `https://m701.music.126.net/${identity || 'anonymous'}-${id}.mp3`, quality, expiresAt: new Date(Date.now() + 60000).toISOString()}]};
      },
      dispose: () => { disposed = true;identity = '';qr = ''; },
    };
    accounts.push({instance, account, disposed: () => disposed});
    return account;
  };
  const coreFactory = account => ({handle: async input => {
    if (input.keyword === 'sdk-error') throw Object.assign(new Error(`${secret}; database-password=fixture-only`), {status: 503, body: {cookie: secret}});
    if (input.keyword === 'auth-error') throw Object.assign(new Error(secret), {auth: true});
    return {owner: account.state().account?.id ?? null, tracks: [], action: input.action};
  }});
  const fetcher = async (url, options) => {
    staticRequests.push({url, options});
    const html = String(url).endsWith('/music/');
    return new Response(html ? '<a href="/personal-homepage/about/">About</a><a href="/personal-homepage/music/?mode=netease">Music</a>' : 'export const fixture = true;', {
      headers: {'Content-Type': html ? 'text/html' : 'text/javascript', 'Set-Cookie': `${secret}=upstream`},
    });
  };
  let server;
  async function start() {
    server = createOnlineMusic({origin, sessions, accountFactory, coreFactory, fetcher});
    server.listen(0, '127.0.0.1');await once(server, 'listening');
  }
  async function closeServer() {
    if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  await start();
  t.after(async () => {await closeServer();await sessions.close();});

  async function request(pathname, {method = 'GET', cookie, body, raw, originHeader = origin, host = 'radio.example', site = 'same-origin', headers = {}} = {}) {
    const bytes = raw === undefined ? body === undefined ? null : Buffer.from(JSON.stringify(body)) : Buffer.from(raw);
    const requestHeaders = {Host: host, 'Sec-Fetch-Site': site, ...(method === 'POST' && originHeader !== null ? {Origin: originHeader} : {}), ...(cookie ? {Cookie: cookie} : {}), ...(bytes ? {'Content-Type': 'application/json', 'Content-Length': bytes.length} : {}), ...headers};
    return new Promise((resolve, reject) => {
      const req = httpRequest({hostname: '127.0.0.1', port: server.address().port, path: pathname, method, headers: requestHeaders, agent: false}, res => {
        const parts = [];
        res.on('data', part => parts.push(part));
        res.on('error', reject);
        res.on('end', () => {
          const text = Buffer.concat(parts).toString('utf8');let data;
          try { data = JSON.parse(text); } catch { /* Static/HEAD responses are not JSON. */ }
          resolve({status: res.statusCode, headers: res.headers, text, data});
        });
      });
      req.on('error', reject);req.setTimeout(5000, () => req.destroy(Error('Fixture request timed out')));
      req.end(bytes);
    });
  }
  const getAccount = cookie => request(api + 'playback/account', {cookie});
  const post = (route, cookie, body = {}, extra = {}) => request(api + route, {method: 'POST', cookie, body, ...extra});
  async function login(cookie) {
    const qr = await post('playback/qr', cookie);assert.equal(qr.status, 200);
    const confirmed = await post('playback/qr-check', cookie);assert.equal(confirmed.status, 200);assert.equal(confirmed.data.code, 803);
    return {cookie: cookieFrom(confirmed), qr: qr.data.image, confirmed};
  }
  return {request, getAccount, post, login, sessions, staticRequests, accounts, restart: async () => {await closeServer();await start();}};
}

test('two browser sessions isolate QR challenges, accounts, core reads and full/preview playback', async t => {
  const f = await fixture(t);
  const anonymousA = await f.getAccount();
  const anonymousB = await f.getAccount();
  const cookieA = cookieFrom(anonymousA), cookieB = cookieFrom(anonymousB);
  assert.notEqual(cookieA, cookieB);
  assert.equal(anonymousA.data.authorized, false);assert.equal(anonymousB.data.authorized, false);
  assert.equal(anonymousA.data.local, false);
  const qrA = await f.post('playback/qr', cookieA), qrB = await f.post('playback/qr', cookieB);
  assert.notEqual(qrA.data.image, qrB.data.image);
  const confirmedA = await f.post('playback/qr-check', cookieA);
  const signedA = cookieFrom(confirmedA);
  assert.equal(confirmedA.data.code, 803);
  assert.equal((await f.getAccount(cookieB)).data.authorized, false);
  const previewB = await f.post('playback/resolve', cookieB, {id: '123', quality: 'standard'});
  assert.equal(previewB.data.tracks[0].status, 'preview');assert.equal(previewB.data.tracks[0].previewSeconds, 30);
  const confirmedB = await f.post('playback/qr-check', cookieB);
  const signedB = cookieFrom(confirmedB);
  const accountA = (await f.getAccount(signedA)).data, accountB = (await f.getAccount(signedB)).data;
  assert.notEqual(accountA.account.id, accountB.account.id);
  const fullA = await f.post('playback/resolve', signedA, {id: '123', quality: 'lossless'});
  const fullB = await f.post('playback/resolve', signedB, {id: '123', quality: 'hires'});
  assert.equal(fullA.data.tracks[0].status, 'full');assert.equal(fullA.data.tracks[0].previewSeconds, null);
  assert.equal(fullA.data.tracks[0].quality, 'lossless');assert.equal(fullB.data.tracks[0].quality, 'hires');
  assert.notEqual(fullA.data.tracks[0].audioUrl, fullB.data.tracks[0].audioUrl);
  assert.equal((await f.post('netease', signedA, {action: 'browse', view: 'liked'})).data.owner, accountA.account.id);
  assert.equal((await f.post('netease', signedB, {action: 'browse', view: 'liked'})).data.owner, accountB.account.id);
  for (const response of [confirmedA, confirmedB, fullA, fullB]) {
    assert.doesNotMatch(response.text, new RegExp(secret));
    assert.equal(response.headers['cache-control'], 'no-store');assert.equal(response.headers.vary, 'Cookie');
  }
  assert.equal(f.staticRequests.length, 0);
});

test('successful QR login rotates the cookie and the retired token cannot authorize subsequent API requests', async t => {
  const f = await fixture(t);
  const before = cookieFrom(await f.getAccount());
  const {cookie: after} = await f.login(before);
  assert.notEqual(before, after);
  assert.equal(await f.sessions.lookup(idFrom(before)), null);
  assert.equal((await f.post('playback/resolve', before, {id: '123'})).status, 401);
  assert.equal((await f.post('playback/qr', before)).status, 401);
  assert.equal((await f.getAccount(after)).data.authorized, true);
});

test('restart restores each persisted account and logout revokes only that browser session', async t => {
  const f = await fixture(t);
  const firstA = cookieFrom(await f.getAccount()), firstB = cookieFrom(await f.getAccount());
  const a = await f.login(firstA), b = await f.login(firstB);
  const identityA = a.confirmed.data.account.id, identityB = b.confirmed.data.account.id;
  await f.restart();
  assert.equal((await f.getAccount(a.cookie)).data.account.id, identityA);
  assert.equal((await f.getAccount(b.cookie)).data.account.id, identityB);
  const logout = await f.post('playback/logout', a.cookie);
  assert.equal(logout.status, 200);assert.equal(logout.data.authorized, false);
  const fresh = cookieFrom(logout);assert.notEqual(fresh, a.cookie);
  assert.equal(await f.sessions.lookup(idFrom(a.cookie)), null);
  assert.equal((await f.post('playback/resolve', a.cookie, {id: '123'})).status, 401);
  await f.restart();
  assert.equal((await f.getAccount(fresh)).data.authorized, false);
  assert.equal((await f.getAccount(b.cookie)).data.account.id, identityB);
  assert.ok(f.accounts.some(row => row.disposed()));
});

test('origin, Host, request size and path gates reject unauthorized traffic without proxying it', async t => {
  const f = await fixture(t);
  const cookie = cookieFrom(await f.getAccount());
  assert.equal((await f.post('playback/qr', cookie, {}, {originHeader: null})).status, 403);
  assert.equal((await f.post('playback/qr', cookie, {}, {originHeader: 'https://attacker.example'})).status, 403);
  assert.equal((await f.post('playback/qr', cookie, {}, {site: 'cross-site'})).status, 403);
  assert.equal((await f.getAccount(cookie)).status, 200);
  assert.equal((await f.request(api + 'playback/account', {cookie, host: 'attacker.example'})).status, 403);
  assert.equal((await f.post('netease', cookie, {}, {raw: JSON.stringify({action: 'search', keyword: 'x'.repeat(13000)})})).status, 413);
  assert.equal((await f.post('netease', cookie, {}, {raw: '[]'})).status, 400);
  assert.equal((await f.post('netease', cookie, {}, {headers: {'Content-Encoding': 'gzip'}})).status, 400);
  assert.equal((await f.request('/proxy?url=http://127.0.0.1:61173/private')).status, 404);
  assert.equal((await f.request('/personal-homepage/music/local-audio/' + 'a'.repeat(24) + '/', {cookie})).status, 404);
  assert.equal((await f.request('/personal-homepage/music/local-cover/' + 'a'.repeat(24) + '/', {cookie})).status, 404);
  assert.equal((await f.request('/personal-homepage/music/%2e%2e/private.json', {cookie})).status, 400);
  assert.equal((await f.post('netease', cookie, {action: 'arbitrary-sdk-method'})).status, 400);
  assert.equal((await f.post('playback/resolve', cookie, {id: 'https://attacker.example/audio'})).status, 400);
  assert.equal(f.staticRequests.length, 0);
});

test('static assets use only the fixed public origin, share public cache and never forward browser cookies', async t => {
  const f = await fixture(t);
  const cookieA = cookieFrom(await f.getAccount()), cookieB = cookieFrom(await f.getAccount());
  const path = '/personal-homepage/_astro/fixture.abc123.js';
  const first = await f.request(path, {cookie: cookieA});
  const second = await f.request(path, {cookie: cookieB});
  const head = await f.request(path, {method: 'HEAD', cookie: cookieB});
  assert.equal(first.status, 200);assert.equal(second.status, 200);assert.equal(head.status, 200);
  assert.equal(first.text, second.text);assert.equal(head.text, '');
  assert.equal(first.headers['cache-control'], 'public, max-age=31536000, immutable');
  assert.equal(first.headers['set-cookie'], undefined);assert.equal(second.headers['set-cookie'], undefined);
  assert.equal(f.staticRequests.length, 1);
  assert.equal(f.staticRequests[0].url, 'https://0ne-small-stone.github.io' + path);
  assert.equal(f.staticRequests[0].options.headers, undefined);
  assert.equal(f.staticRequests[0].options.redirect, 'error');
  assert.ok(f.staticRequests[0].options.signal instanceof AbortSignal);
  const html = await f.request('/personal-homepage/music/', {cookie: cookieA});
  assert.equal(html.status, 200);assert.equal(html.headers['cache-control'], 'no-store');
  assert.match(html.text, /href="https:\/\/0ne-small-stone\.github\.io\/personal-homepage\/about\/"/);
  assert.match(html.text, /href="\/personal-homepage\/music\/\?mode=netease"/);
});

test('online file downloads and uploads are explicitly unavailable', async t => {
  const f = await fixture(t);
  const cookie = cookieFrom(await f.getAccount());
  for (const action of ['download', 'cancel-download']) {
    const result = await f.post('netease', cookie, {action, id: '123'});
    assert.equal(result.status, 501);assert.match(result.data.error, /下载/);
  }
  const upload = await f.post('netease-upload', cookie);
  assert.equal(upload.status, 501);assert.match(upload.data.error, /上传|文件传输/);
  assert.equal(f.staticRequests.length, 0);
});

test('SDK errors cannot disclose credentials or private response fields', async t => {
  const f = await fixture(t);
  const cookie = cookieFrom(await f.getAccount());
  const failure = await f.post('netease', cookie, {action: 'search', keyword: 'sdk-error'});
  assert.equal(failure.status, 503);
  assert.deepEqual(failure.data, {error: '服务暂时不可用，请稍后重试。'});
  assert.doesNotMatch(failure.text, /FAKE_SDK_COOKIE|database-password|fixture-only|cookie/i);
  const invalid = await f.post('netease', cookie, {action: 'search', keyword: 'auth-error'});
  assert.equal(invalid.status, 401);assert.match(invalid.data.error, /登录已失效/);
  assert.doesNotMatch(invalid.text, new RegExp(secret));
});

test('upstream account expiry clears only the affected browser credentials across core and resolve failures', async t => {
  for (const failureAt of ['core', 'resolve']) {
    const f = await fixture(t);
    const a = await f.login(cookieFrom(await f.getAccount()));
    const b = await f.login(cookieFrom(await f.getAccount()));
    const identityB = b.confirmed.data.account.id;
    const storeA = f.sessions.credentialStore(await f.sessions.lookup(idFrom(a.cookie)));
    const storeB = f.sessions.credentialStore(await f.sessions.lookup(idFrom(b.cookie)));
    assert.equal(Boolean(await storeA.load()), true);
    assert.equal(Boolean(await storeB.load()), true);

    const expired = failureAt === 'core'
      ? await f.post('netease', a.cookie, {action: 'search', keyword: 'auth-error'})
      : await f.post('playback/resolve', a.cookie, {id: '401'});
    assert.equal(expired.status, 401, failureAt);
    assert.match(expired.data.error, /登录已失效/);
    assert.doesNotMatch(expired.text, new RegExp(secret));
    const accountA = await f.getAccount(a.cookie);
    assert.equal(accountA.status, 200);
    assert.equal(accountA.data.authorized, false, failureAt);
    assert.equal(accountA.data.account, null);
    assert.equal(accountA.data.saved, false);
    assert.equal(await storeA.load(), null, 'expired credentials must be removed from persistence');
    assert.equal((await f.getAccount(b.cookie)).data.account.id, identityB);
    assert.equal(Boolean(await storeB.load()), true);

    await f.restart();
    assert.equal((await f.getAccount(a.cookie)).data.authorized, false, 'expired login must not return after restart');
    assert.equal((await f.getAccount(b.cookie)).data.account.id, identityB);
    assert.equal((await f.post('playback/resolve', b.cookie, {id: '123'})).data.tracks[0].status, 'full');
  }
});
