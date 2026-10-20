import test from 'node:test';
import assert from 'node:assert/strict';
import {createDecipheriv} from 'node:crypto';
// Test-only: this helper reads only the SDK's public China IP fixture. It is
// intentionally absent from the deployed edge module dependency graph.
import sdkUtil from '@neteasecloudmusicapienhanced/api/util/index.js';
import {createNetEaseSdk, resolveTrack} from './netease.mjs';
import {encodeEapi, encodeWeapi, parseCookie, serializeCookie} from './netease-protocol.mjs';

const json = (body, headers = {}) => {
  const merged = new Headers(headers);
  if (!merged.has('Content-Type')) merged.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), {headers: merged});
};
function unpack(init) {
  const params = new URLSearchParams(init.body).get('params');
  const cipher = createDecipheriv('aes-128-ecb', Buffer.from('e82ckenh8dichen8'), Buffer.alloc(0));
  const plain = Buffer.concat([cipher.update(Buffer.from(params, 'hex')), cipher.final()]).toString();
  const [uri, data, digest] = plain.split('-36cd479b6b5-');
  assert.match(digest, /^[a-f\d]{32}$/);
  return {uri, data: JSON.parse(data)};
}

test('native crypto matches fixed SDK 4.41.1 protocol vectors', () => {
  // Fixtures generated from the upstream MIT crypto module, never an account.
  assert.deepEqual(encodeWeapi({type: 3, e_r: false, csrf_token: ''}, 'aaaaaaaaaaaaaaaa'), {
    params: 'I35d2kSsV0O/f6Zwbm0zYZk18L57q4nZGrVurElSvnlNrOwVA7FuxcVUi2+eVWS6VKYul+QGooY0p87OiZNIKjFRDG54VVf/dUi7hiILgCc=',
    encSecKey: 'd473b9eca232f1b4090dd606b0df86de318748dd2eec307e4ed4345030fc4ee30331e598f41d5a6f5befaab94630ea1a1eda7cfade84fbec1a907913d2e4d2c8744bc572b99a050075e075b4537f645ecfa994f95906c32818e076aeda6bdb906bfa0bb96c4cf4bc3ed6d9ab76cf08441153d9d85e1ea3d78fa8d9210d581cee',
  });
  assert.deepEqual(encodeEapi('/api/song/detail', {c: '[{"id":123}]', e_r: false}), {
    params: '7D398AA5036D61F11B22021C618C2424C1CAC2F4704326F57C979FCAFFE3E07E167623F20725B511E0D163732C2CA31C48CBE449D3518A71D6772DFFBB675E3975E2D06CB0BC3B7AE178AA9E5A9EFED9395A43E5E2FFD920A42E645DAD891BF654BC2B7629454252439909432930637D',
  });
});

test('fixed SDK surface excludes QR encoder and arbitrary methods', () => {
  const sdk = createNetEaseSdk({fetcher: () => { throw Error('fixture must not fetch'); }});
  assert.equal(Object.keys(sdk).length, 43);
  for (const name of ['login_qr_key', 'login_qr_check', 'login_status', 'song_url_v1', 'cloudsearch', 'recommend_songs', 'dj_program', 'lyric', 'playlist_create']) assert.equal(typeof sdk[name], 'function');
  assert.equal(sdk.login_qr_create, undefined);
  assert.equal(sdk.cloud, undefined);
  assert.equal(sdk.register_checktoken_v2, undefined);
  sdk.login_qr_create = async () => ({body: {code: 200}});
  assert.equal(typeof sdk.login_qr_create, 'function');
});

test('cookie string and plain-object encoding match the actual SDK main entry', () => {
  // main.js uses cookieToJson directly. Only server.js's HTTP adapter performs
  // safe-decode on an entire query/body cookie string before this helper.
  for (const value of ['', 'MUSIC_U=A%2BB%2FC%3D; __csrf=fixture', 'MUSIC_U=plain-fixture']) {
    assert.equal(serializeCookie(parseCookie(value)), sdkUtil.cookieObjToString(sdkUtil.cookieToJson(value)));
  }
  assert.equal(parseCookie('MUSIC_U=A%2BB%2FC%3D').MUSIC_U, 'A%2BB%2FC%3D');
  assert.equal(serializeCookie(parseCookie('MUSIC_U=A%2BB%2FC%3D')), 'MUSIC_U=A%252BB%252FC%253D');
  const object = {MUSIC_U: 'A+B/C='};
  assert.equal(serializeCookie(parseCookie(object)), sdkUtil.cookieObjToString(object));
  assert.equal(serializeCookie(parseCookie(object)), 'MUSIC_U=A%2BB%2FC%3D');
  assert.deepEqual(object, {MUSIC_U: 'A+B/C='});
});

test('QR polling preserves waiting, confirmed and account envelopes with multiple cookies', async () => {
  const requests = [];
  const sdk = createNetEaseSdk({fetcher: async (url, init) => {
    requests.push({url, init});
    assert.equal(init.redirect, 'manual');
    assert.equal(init.method, 'POST');
    assert.ok(init.signal instanceof AbortSignal);
    const form = new URLSearchParams(init.body);
    assert.match(form.get('encSecKey'), /^[a-f\d]{256}$/);
    if (url.endsWith('/unikey')) return json({code: 200, unikey: 'fixture-key'});
    if (url.endsWith('/client/login')) {
      const headers = new Headers({'Content-Type': 'application/json'});
      headers.append('Set-Cookie', 'MUSIC_U=fixture-A; Domain=.music.163.com; Path=/; HttpOnly');
      headers.append('Set-Cookie', '__csrf=fixture-csrf; Expires=Wed, 01 Jan 2031 00:00:00 GMT; Path=/');
      return json({code: 803}, headers);
    }
    return json({code: 200, profile: {userId: 17, nickname: 'Fixture'}});
  }});
  assert.equal((await sdk.login_qr_key({})).body.data.unikey, 'fixture-key');
  const checked = await sdk.login_qr_check({key: 'fixture-key'});
  assert.equal(checked.body.code, 803);
  assert.match(checked.body.cookie, /MUSIC_U=fixture-A/);
  assert.match(checked.body.cookie, /__csrf=fixture-csrf/);
  assert.equal(checked.cookie.length, 2);
  assert.doesNotMatch(checked.body.cookie, /Domain=/);
  const status = await sdk.login_status({cookie: checked.body.cookie});
  assert.equal(status.body.data.profile.userId, 17);
  assert.match(requests.at(-1).init.headers.Cookie, /MUSIC_U=fixture-A/);
  assert.doesNotMatch(requests.at(-1).init.headers.Cookie, /Expires|Path|HttpOnly/);
  assert.ok(requests.every(row => row.url.startsWith('https://music.163.com/weapi/')));
  for (const code of [800, 801, 802]) {
    const waiting = createNetEaseSdk({fetcher: async () => json({code})});
    assert.equal((await waiting.login_qr_check({key: 'fixture'})).body.code, code);
  }
});

test('eapi fetches keep independent account cookies, full ID precision and explicit false', async () => {
  const calls = [];
  const sdk = createNetEaseSdk({fetcher: async (url, init) => {
    calls.push({url, init, ...unpack(init)});
    return json({code: 200, data: []});
  }});
  const cookieA = {MUSIC_U: 'fixture-A', __csrf: 'A'};
  const cookieB = {MUSIC_U: 'fixture-B', __csrf: 'B'};
  await Promise.all([
    sdk.song_url_v1({id: '12345678901234567890', level: 'hires', cookie: cookieA}),
    sdk.song_url_v1({id: '42', level: 'standard', cookie: cookieB}),
  ]);
  assert.equal(calls[0].data.ids, '[12345678901234567890]');
  assert.equal(calls[0].data.encodeType, 'flac');
  assert.equal(calls[0].data.e_r, false);
  assert.equal(calls[0].data.header.MUSIC_U, 'fixture-A');
  assert.equal(calls[1].data.header.MUSIC_U, 'fixture-B');
  assert.doesNotMatch(calls[0].init.headers.Cookie, /fixture-B/);
  assert.doesNotMatch(calls[1].init.headers.Cookie, /fixture-A/);
  assert.deepEqual(cookieA, {MUSIC_U: 'fixture-A', __csrf: 'A'});
  assert.deepEqual(cookieB, {MUSIC_U: 'fixture-B', __csrf: 'B'});
  assert.ok(calls.every(call => call.url.startsWith('https://interfacepc.music.163.com/eapi/')));
  await sdk.song_detail({ids: '12345678901234567890', crypto: 'eapi'});
  assert.equal(calls.at(-1).data.c, '[{"id":12345678901234567890}]');
});

test('SDK browse/DJ/write payloads retain their actual wire contracts', async () => {
  const calls = [];
  const sdk = createNetEaseSdk({fetcher: async (url, init) => {
    calls.push(unpack(init));
    return json({code: 200, data: [], songs: []});
  }});
  await sdk.cloudsearch({keywords: 'fixture', type: 1009, offset: 30, crypto: 'eapi'});
  assert.equal(calls.at(-1).data.s, 'fixture');
  assert.equal(calls.at(-1).data.type, 1009);
  await sdk.dj_program({rid: '21', asc: 'false', crypto: 'eapi'});
  assert.equal(calls.at(-1).data.radioId, '21');
  assert.equal(calls.at(-1).data.asc, false);
  const args = {id: '17', t: '1', crypto: 'eapi'};
  await sdk.artist_sub(args);
  assert.equal(calls.at(-1).data.artistId, '17');
  assert.equal(args.t, '1');
  await sdk.like({id: '19', like: 'false', crypto: 'eapi'});
  assert.equal(calls.at(-1).data.trackId, '19');
  assert.equal(calls.at(-1).data.like, false);
  await sdk.playlist_update({id: '12345678901234567890', name: 'A "quoted" title', desc: 'line\nnext', tags: ''});
  const data = calls.at(-1).data;
  assert.equal(JSON.parse(data['/api/playlist/update/name']).name, 'A "quoted" title');
  assert.equal(JSON.parse(data['/api/playlist/desc/update']).desc, 'line\nnext');
  assert.match(data['/api/playlist/update/name'], /"id":12345678901234567890/);
});

test('playlist-track 512 retry survives sanitized upstream errors', async () => {
  const calls = [];
  const sdk = createNetEaseSdk({fetcher: async (url, init) => {
    calls.push(unpack(init));
    return json({code: calls.length === 1 ? 512 : 200});
  }});
  const result = await sdk.playlist_tracks({pid: '4', tracks: '9,10', op: 'add'});
  assert.equal(result.body.code, 200);
  assert.equal(calls[0].data.trackIds, '["9","10"]');
  assert.equal(calls[1].data.trackIds, '["9","10","9","10"]');
});

test('unsupported protocols, external routing and playlist verification fail without fetching', async () => {
  let count = 0;
  const sdk = createNetEaseSdk({fetcher: async () => { count++; return json({code: 200}); }});
  await assert.rejects(sdk.playlist_subscribe({id: '12', t: 1}), error => error.body.code === 501);
  for (const args of [{proxy: 'http://fixture.invalid'}, {domain: 'https://fixture.invalid'}, {headers: {Cookie: 'other'}}, {crypto: 'xeapi'}, {unblock: true}, {checkToken: 'v2'}, {e_r: true}, {cookie: 'MUSIC_U=x\r\nother=y'}, {cookie: true}]) {
    await assert.rejects(sdk.cloudsearch(args), error => error.body.code === 400);
  }
  assert.equal(count, 0);
});

test('network, redirects, malformed payloads and auth errors never expose upstream secrets', async () => {
  const secret = 'PRIVATE-fixture-cookie';
  for (const fetcher of [
    async () => { throw Error(secret); },
    async () => new Response(secret),
    async () => new Response('', {status: 302, headers: {Location: `https://fixture.invalid/${secret}`}}),
    async () => json({code: 401, message: secret, cookie: secret}),
    async () => json({message: secret}),
    async () => json({code: 0, message: secret}),
    async () => new Response('x'.repeat(2 * 1024 * 1024 + 1)),
  ]) {
    const sdk = createNetEaseSdk({fetcher});
    await assert.rejects(sdk.login_qr_check({key: 'fixture'}), error => {
      assert.doesNotMatch(error.message + JSON.stringify(error.body), /PRIVATE/);
      assert.equal(typeof error.body.code, 'number');
      if (error.body.code === 401) assert.equal(error.auth, true);
      return true;
    });
  }
});

test('body 302 remains a business login failure; HTTP redirects never become auth claims', async () => {
  const sdk = createNetEaseSdk({fetcher: async () => json({code: 302})});
  assert.equal((await sdk.login_status({cookie: 'MUSIC_U=fixture'})).body.code, 302);
  await assert.rejects(resolveTrack(sdk, {}, '19'), error => error.auth === true && error.body.code === 302);
  const redirected = createNetEaseSdk({fetcher: async () => new Response('', {status: 302, headers: {Location: 'https://music.163.com/login'}})});
  await assert.rejects(redirected.login_status({}), error => error.auth === false && error.body.code === 502);
});

function playbackFixture(changes = {}, media = () => new Response(new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0, 0, 0]), {status: 206, headers: {'Content-Type': 'audio/mpeg'}})) {
  const calls = [];
  const sdk = createNetEaseSdk({fetcher: async (url, init) => {
    calls.push({url, init});
    if (url.startsWith('https://interfacepc.')) return json({code: 200, data: [{id: 19, code: 200, url: 'http://m7.music.126.net/fixture.mp3', expi: 1200, level: 'exhigh', freeTrialInfo: null, ...changes}]});
    return media(url, init);
  }});
  return {sdk, calls};
}

test('resolver returns PlaybackIndex full/preview DTO after bounded HTTPS Range verification', async () => {
  for (const [freeTrialInfo, expected] of [[null, 'full'], [{start: 15, end: 45}, 'preview']]) {
    const {sdk, calls} = playbackFixture({freeTrialInfo});
    const before = Date.now();
    const result = await resolveTrack(sdk, 'MUSIC_U=fixture', '19', 'hires');
    assert.equal(result.version, 1);
    assert.ok(Date.parse(result.updatedAt) >= before);
    const track = result.tracks[0];
    assert.equal(track.id, '19');
    assert.equal(track.status, expected);
    assert.equal(track.audioUrl, 'https://m7.music.126.net/fixture.mp3');
    assert.equal(track.quality, 'exhigh');
    assert.equal(track.previewSeconds, expected === 'preview' ? 30 : null);
    assert.ok(Date.parse(track.expiresAt) > before + 590000);
    assert.ok(Date.parse(track.expiresAt) <= Date.now() + 600000);
    assert.equal(calls[1].init.headers.Range, 'bytes=0-1023');
    assert.equal(calls[1].init.redirect, 'manual');
    assert.equal(calls[1].init.headers.Cookie, undefined);
  }
});

test('resolver refuses unknown hosts, credentials, ports, expiry and invalid preview claims', async () => {
  const variants = [
    {url: 'https://fixture.invalid/a.mp3'}, {url: 'https://m1.music.126.net.evil.invalid/a.mp3'},
    {url: 'file://m1.music.126.net/a.mp3'}, {url: 'https://user:pass@m1.music.126.net/a.mp3'},
    {url: 'https://m1.music.126.net:444/a.mp3'}, {code: 404}, {expi: 0}, {expi: -1}, {expi: 'invalid'}, {expi: 45},
    {freeTrialInfo: {start: 30, end: 0}}, {freeTrialInfo: {start: 0, end: 0}},
    {freeTrialInfo: {start: 0, end: 121}}, {freeTrialInfo: {}}, {freeTrialInfo: 'null'},
  ];
  for (const changes of variants) {
    const {sdk, calls} = playbackFixture(changes);
    const track = (await resolveTrack(sdk, {}, '19')).tracks[0];
    assert.equal(track.status, 'unavailable', JSON.stringify(changes));
    assert.equal(track.audioUrl, null);
    assert.equal(calls.length, 1);
  }
});

test('resolver requires real audio bytes, correct MIME and no CDN redirect', async () => {
  for (const response of [
    () => new Response('<html>login</html>', {headers: {'Content-Type': 'audio/mpeg'}}),
    () => new Response('ID3fixture', {headers: {'Content-Type': 'text/html'}}),
    () => new Response('', {status: 302, headers: {Location: 'https://fixture.invalid'}}),
  ]) {
    const {sdk} = playbackFixture({}, response);
    assert.equal((await resolveTrack(sdk, {}, '19')).tracks[0].status, 'unavailable');
  }
  const sdk = createNetEaseSdk({fetcher: async () => json({code: 301})});
  await assert.rejects(resolveTrack(sdk, {}, '19'), error => error.auth === true);
  await assert.rejects(resolveTrack(sdk, {}, '019'), error => error.body.code === 400);
  await assert.rejects(resolveTrack(sdk, {}, '19', 'unblock'), error => error.body.code === 400);
});
