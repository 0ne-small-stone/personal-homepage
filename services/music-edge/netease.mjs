// Fixed endpoint modules from @neteasecloudmusicapienhanced/api 4.41.1 (MIT).
// Copyright (c) 2013-2022 Binaryify. Full notice in netease-protocol.mjs.
// Deliberately never import SDK main/server, util/request, util/index or unblock.
import login_qr_key from '@neteasecloudmusicapienhanced/api/module/login_qr_key.js';
import login_status from '@neteasecloudmusicapienhanced/api/module/login_status.js';
import recommend_resource from '@neteasecloudmusicapienhanced/api/module/recommend_resource.js';
import personalized from '@neteasecloudmusicapienhanced/api/module/personalized.js';
import recommend_songs from '@neteasecloudmusicapienhanced/api/module/recommend_songs.js';
import personalized_newsong from '@neteasecloudmusicapienhanced/api/module/personalized_newsong.js';
import toplist from '@neteasecloudmusicapienhanced/api/module/toplist.js';
import top_playlist from '@neteasecloudmusicapienhanced/api/module/top_playlist.js';
import album_new from '@neteasecloudmusicapienhanced/api/module/album_new.js';
import dj_recommend from '@neteasecloudmusicapienhanced/api/module/dj_recommend.js';
import dj_recommend_type from '@neteasecloudmusicapienhanced/api/module/dj_recommend_type.js';
import dj_radio_hot from '@neteasecloudmusicapienhanced/api/module/dj_radio_hot.js';
import personal_fm_mode from '@neteasecloudmusicapienhanced/api/module/personal_fm_mode.js';
import user_playlist from '@neteasecloudmusicapienhanced/api/module/user_playlist.js';
import playmode_intelligence_list from '@neteasecloudmusicapienhanced/api/module/playmode_intelligence_list.js';
import likelist from '@neteasecloudmusicapienhanced/api/module/likelist.js';
import album_sublist from '@neteasecloudmusicapienhanced/api/module/album_sublist.js';
import artist_sublist from '@neteasecloudmusicapienhanced/api/module/artist_sublist.js';
import dj_sublist from '@neteasecloudmusicapienhanced/api/module/dj_sublist.js';
import user_cloud from '@neteasecloudmusicapienhanced/api/module/user_cloud.js';
import record_recent_song from '@neteasecloudmusicapienhanced/api/module/record_recent_song.js';
import cloudsearch from '@neteasecloudmusicapienhanced/api/module/cloudsearch.js';
import song_detail from '@neteasecloudmusicapienhanced/api/module/song_detail.js';
import playlist_detail from '@neteasecloudmusicapienhanced/api/module/playlist_detail.js';
import album from '@neteasecloudmusicapienhanced/api/module/album.js';
import album_detail_dynamic from '@neteasecloudmusicapienhanced/api/module/album_detail_dynamic.js';
import artists from '@neteasecloudmusicapienhanced/api/module/artists.js';
import artist_album from '@neteasecloudmusicapienhanced/api/module/artist_album.js';
import dj_detail from '@neteasecloudmusicapienhanced/api/module/dj_detail.js';
import dj_program_detail from '@neteasecloudmusicapienhanced/api/module/dj_program_detail.js';
import lyric from '@neteasecloudmusicapienhanced/api/module/lyric.js';
import like from '@neteasecloudmusicapienhanced/api/module/like.js';
import album_sub from '@neteasecloudmusicapienhanced/api/module/album_sub.js';
import artist_sub from '@neteasecloudmusicapienhanced/api/module/artist_sub.js';
import dj_sub from '@neteasecloudmusicapienhanced/api/module/dj_sub.js';
import playlist_create from '@neteasecloudmusicapienhanced/api/module/playlist_create.js';
import playlist_tracks from '@neteasecloudmusicapienhanced/api/module/playlist_tracks.js';
import user_cloud_del from '@neteasecloudmusicapienhanced/api/module/user_cloud_del.js';
import {Buffer} from 'node:buffer';
import {accountCookie, encodeEapi, encodeWeapi, parseCookie, serializeCookie} from './netease-protocol.mjs';

const QUALITY = new Set(['standard', 'exhigh', 'lossless', 'hires']);
const ID = /^[1-9]\d{0,19}$/;
const FETCHERS = new WeakMap();
const SPECIAL = new Set([201, 302, 400, 502, 800, 801, 802, 803]);
const WEB_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const API_UA = 'NeteaseMusic 9.0.90/5038 (iPhone; iOS 16.2; zh_CN)';

function failure(code = 502, message = 'NetEase service unavailable') {
  const error = Error(message);
  error.body = {code};
  error.status = code >= 400 && code <= 599 ? code : 502;
  error.auth = [301, 302, 401, 403].includes(code);
  return error;
}

function timeoutSignal(signal, timeout) {
  const milliseconds = Math.min(15000, Math.max(1, Number(timeout) || 15000));
  const timed = AbortSignal.timeout(milliseconds);
  return signal ? AbortSignal.any([signal, timed]) : timed;
}

async function boundedBytes(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts = []; let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw failure();
      parts.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return bytes;
}

function setCookies(headers) {
  const values = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : typeof headers.getAll === 'function' ? headers.getAll('Set-Cookie') : [];
  return values.filter(value => typeof value === 'string' && !/[\r\n]/.test(value)).map(value => value.replace(/;\s*Domain=[^;]*/gi, ''));
}

function nativeRequest(fetcher, signal) {
  return async (uri, input, options = {}) => {
    if (!/^\/api\/[a-zA-Z0-9/_-]+$/.test(uri)) throw failure(400, 'Unsupported endpoint');
    const crypto = options.crypto || 'eapi';
    if (!['eapi', 'weapi'].includes(crypto) || options.checkToken) throw failure(501, 'This endpoint requires an unsupported protocol');
    if (options.proxy || options.domain || options.realIP || Object.keys(options.headers || {}).length) throw failure(400, 'Custom upstream routing is not supported');
    const cookie = accountCookie(options.cookie, crypto);
    const data = {...input, e_r: false};
    const headers = {'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': crypto === 'weapi' ? WEB_UA : API_UA};
    let encrypted;
    let origin;
    if (crypto === 'weapi') {
      data.csrf_token = cookie.__csrf || '';
      headers.Referer = 'https://music.163.com';
      headers.Cookie = serializeCookie(cookie);
      encrypted = encodeWeapi(data);
      origin = 'https://music.163.com';
    } else {
      const header = {
        osver: cookie.osver, deviceId: cookie.deviceId, os: cookie.os, appver: cookie.appver,
        versioncode: cookie.versioncode || '140', mobilename: cookie.mobilename || '',
        buildver: cookie.buildver || String(Math.floor(Date.now() / 1000)), resolution: cookie.resolution || '1920x1080',
        __csrf: cookie.__csrf || '', channel: cookie.channel,
        requestId: `${Date.now()}_${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      };
      for (const key of ['MUSIC_U', 'MUSIC_A', 'NMTID']) if (cookie[key]) header[key] = cookie[key];
      headers.Cookie = serializeCookie(header);
      data.header = header;
      encrypted = encodeEapi(uri, data);
      origin = 'https://interfacepc.music.163.com';
    }
    let response; let body;
    try {
      response = await fetcher(`${origin}/${crypto}/${uri.slice(5)}`, {
        method: 'POST', headers, body: new URLSearchParams(encrypted).toString(),
        redirect: 'manual', signal: timeoutSignal(signal, options.timeout),
      });
      body = JSON.parse(new TextDecoder().decode(await boundedBytes(response, 2 * 1024 * 1024)));
    } catch { throw failure(); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw failure();
    if (response.status >= 300 && response.status < 400) throw failure();
    const code = Number(body.code);
    // A transport HTTP 200 cannot manufacture a successful business result.
    if (!Number.isInteger(code) || code <= 0) throw failure();
    if (response.status < 200 || response.status >= 300 || code !== 200 && !SPECIAL.has(code)) throw failure(code);
    return {status: 200, body: {...body, code}, cookie: setCookies(response.headers)};
  };
}

// Narrow adaptations avoid SDK filesystem/unblock dependencies and its QR-check
// catch-scope bug. They preserve the original endpoint payloads and envelopes.
const login_qr_check = async (query, request) => {
  const result = await request('/api/login/qrcode/client/login', {key: query.key, type: 3}, {...query, crypto: query.crypto || 'weapi'});
  return {status: 200, body: {...result.body, cookie: result.cookie.join(';')}, cookie: result.cookie};
};
const song_url_v1 = (query, request) => {
  const ids = String(query.id).split(',');
  if (!ids.length || ids.length > 500 || !ids.every(id => ID.test(id)) || !QUALITY.has(query.level)) throw failure(400, 'Invalid track or quality');
  return request('/api/song/enhance/player/url/v1', {ids: `[${ids.join(',')}]`, level: query.level, encodeType: 'flac'}, {...query, crypto: 'eapi'});
};
const dj_program = (query, request) => request('/api/dj/program/byradio', {
  radioId: query.rid, limit: query.limit || 30, offset: query.offset || 0,
  asc: query.asc === '' ? '' : query.asc === true || query.asc === 'true' || query.asc == 1,
}, {...query, crypto: query.crypto || 'weapi'});
const playlist_update = (query, request) => {
  if (!ID.test(String(query.id))) throw failure(400, 'Invalid playlist');
  // Keep the numeric ID literal without lossy Number conversion, while escaping text.
  const payload = (key, value) => `{"id":${query.id},${JSON.stringify(key)}:${JSON.stringify(String(value || ''))}}`;
  return request('/api/batch', {
    '/api/playlist/desc/update': payload('desc', query.desc),
    '/api/playlist/tags/update': payload('tags', query.tags),
    '/api/playlist/update/name': payload('name', query.name),
  }, {...query, crypto: query.crypto || 'eapi'});
};
const playlist_subscribe = async () => { throw failure(501, 'Playlist subscription requires NetEase verification unavailable on this backend'); };

const MODULES = Object.freeze({
  login_qr_key, login_qr_check, login_status, song_url_v1,
  recommend_resource, personalized, recommend_songs, personalized_newsong, toplist, top_playlist, album_new,
  dj_recommend, dj_recommend_type, dj_radio_hot, personal_fm_mode, user_playlist, playmode_intelligence_list,
  likelist, album_sublist, artist_sublist, dj_sublist, user_cloud, record_recent_song,
  cloudsearch, song_detail, playlist_detail, album, album_detail_dynamic, artists, artist_album,
  dj_detail, dj_program, dj_program_detail, lyric,
  like, playlist_subscribe, album_sub, artist_sub, dj_sub, playlist_create, playlist_update, playlist_tracks, user_cloud_del,
});

export function createNetEaseSdk({fetcher = fetch} = {}) {
  if (typeof fetcher !== 'function') throw TypeError('A Fetch implementation is required');
  const sdk = {};
  for (const [name, module] of Object.entries(MODULES)) sdk[name] = async (args = {}) => {
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw failure(400, 'Invalid endpoint arguments');
    if (args.unblock === true || args.unblock === 'true' || args.proxy || args.domain || args.realIP || args.ip || args.ua || args.randomCNIP === true || args.randomCNIP === 'true' || Object.keys(args.headers || {}).length) throw failure(400, 'Custom upstream routing is not supported');
    if (args.crypto && !['eapi', 'weapi'].includes(args.crypto) || args.e_r === true || args.checkToken) throw failure(400, 'Unsupported protocol');
    let cookie;
    try { cookie = parseCookie(args.cookie); } catch { throw failure(400, 'Invalid account cookie'); }
    const query = {...args, cookie, randomCNIP: false, e_r: false};
    if (name.startsWith('login_qr_') && !query.crypto) query.crypto = 'weapi';
    return module(query, nativeRequest(fetcher, args.signal));
  };
  // The gateway supplies login_qr_create on this same object. Keep its identity
  // so injected Fetch is also used for the resolver's bounded media probe.
  FETCHERS.set(sdk, fetcher);
  return sdk;
}

function audioURL(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || !/^m\d{1,4}\.music\.126\.net$/.test(url.hostname) || url.username || url.password || url.port) return null;
    url.protocol = 'https:';
    return url.href;
  } catch { return null; }
}

async function verifyAudio(fetcher, url) {
  const response = await fetcher(url, {headers: {Range: 'bytes=0-1023'}, redirect: 'manual', signal: AbortSignal.timeout(12000)});
  if (![200, 206].includes(response.status)) { await response.body?.cancel(); return false; }
  const type = (response.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (!type.startsWith('audio/') && type !== 'application/octet-stream') { await response.body?.cancel(); return false; }
  const reader = response.body?.getReader();
  if (!reader) return false;
  const bytes = new Uint8Array(16); let length = 0;
  try {
    while (length < bytes.length) {
      const chunk = await reader.read();
      if (chunk.done) break;
      const part = chunk.value.subarray(0, bytes.length - length);
      bytes.set(part, length); length += part.length;
    }
  } finally { await reader.cancel().catch(() => {}); }
  const tag = (start, end) => Buffer.from(bytes.subarray(start, end)).toString('ascii');
  return length >= 3 && (tag(0, 3) === 'ID3' || bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0 || tag(0, 4) === 'fLaC' || tag(0, 4) === 'OggS' || length >= 8 && tag(4, 8) === 'ftyp');
}

export async function resolveTrack(sdk, cookie, id, quality = 'standard') {
  if (typeof id !== 'string' || !ID.test(id) || !QUALITY.has(quality)) throw failure(400, 'Invalid track or quality');
  let result;
  try { result = await sdk.song_url_v1({id, level: quality, cookie, crypto: 'eapi', unblock: false, e_r: false, timeout: 15000}); }
  catch (cause) { throw failure(Number(cause?.body?.code || 502), 'NetEase resolver unavailable'); }
  if (Number(result?.body?.code) !== 200 || !Array.isArray(result.body.data)) throw failure(Number(result?.body?.code || 502), 'NetEase resolver unavailable');
  const now = Date.now();
  const item = result.body.data.find(row => String(row?.id) === id);
  const url = audioURL(item?.url);
  const ttl = item?.expi === undefined ? 1200 : Number(item.expi);
  const validExpiry = Number.isFinite(ttl) && ttl > 60;
  const lifetime = validExpiry ? Math.min(600, ttl - 30) : 60;
  const trial = item?.freeTrialInfo;
  const hasTrial = trial !== undefined && trial !== null;
  const previewSeconds = hasTrial && Number.isFinite(trial?.end) && Number.isFinite(trial?.start) ? trial.end - trial.start : null;
  const validTrial = !hasTrial || previewSeconds > 0 && previewSeconds <= 120;
  let usable = false;
  if (url && Number(item?.code) === 200 && validExpiry && validTrial) {
    try { usable = await verifyAudio(FETCHERS.get(sdk) || fetch, url); } catch {}
    if (now + lifetime * 1000 <= Date.now() + 30000) usable = false;
  }
  return {version: 1, updatedAt: new Date(now).toISOString(), tracks: [{
    id, status: usable ? hasTrial ? 'preview' : 'full' : 'unavailable', audioUrl: usable ? url : null,
    expiresAt: new Date(now + lifetime * 1000).toISOString(), previewSeconds: usable && hasTrial ? previewSeconds : null,
    quality: String(item?.level || quality),
  }]};
}
