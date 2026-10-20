import {createDeviceSessions} from './device-sessions.mjs';
import {createNetEaseSdk, resolveTrack} from './netease.mjs';
import {createNetEaseCore} from '../../tools/music/netease-core.mjs';
import {qrImage} from './qr.mjs';

const prefix = '/personal-homepage/api/music/';
const actions = new Set(['browse','search','detail','lyrics','liked-ids','jobs','like','subscribe','create-playlist','edit-playlist','playlist-track','cloud-delete']);
const qualities = new Set(['standard','exhigh','lossless','hires']);
const known = new WeakSet();
function fail(status, message, code) { const error = Object.assign(Error(message), {status, code}); known.add(error); return error; }
const bodyOf = result => { let body = result?.body || result; for (let i = 0; i < 3 && body?.code === undefined && body?.body; i++) body = body.body; return body; };
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, '0')).join('');

async function readInput(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json' || request.headers.has('Content-Encoding')) throw fail(400, '请求格式无效。');
  if (Number(request.headers.get('Content-Length')) > 12288) throw fail(413, '请求过长。');
  const reader = request.body?.getReader(); const parts = []; let size = 0;
  if (reader) try { while (true) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > 12288) throw fail(413, '请求过长。'); parts.push(value); } } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  try { const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes), input = JSON.parse(text); if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error(); return {text, input}; }
  catch { throw fail(400, '请求格式无效。'); }
}

/** An API only. Pages HTML, local files and arbitrary upstream URLs are never served. */
export function createEdgeMusic({sdk = createNetEaseSdk(), encodeQr = qrImage, now = Date.now} = {}) {
  const profiles = new Map();
  return {
    async fetch(request, env, ctx) {
      const allowed = env.MUSIC_PAGE_ORIGIN || 'https://0ne-small-stone.github.io';
      const origin = request.headers.get('Origin');
      const cors = origin === allowed ? {'Access-Control-Allow-Origin': allowed, 'Access-Control-Expose-Headers': 'Retry-After', Vary: 'Origin'} : {Vary: 'Origin'};
      const json = (status, value, extra = {}) => Response.json(value, {status, headers: {...cors, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...extra}});
      let session, sessions, store, loadedCookie = '', activeRoute = '';
      try {
        const url = new URL(request.url);
        if (url.pathname === '/healthz' && ['GET','HEAD'].includes(request.method)) {
          if (!env.DB || !env.MUSIC_SESSION_KEY) return json(503, {ok: false, service: 'echoes-music'});
          await env.DB.prepare('SELECT 1 FROM music_device_sessions LIMIT 1').first();
          return json(200, {ok: true, service: 'echoes-music', version: 1});
        }
        if (origin !== allowed || new URL(allowed).protocol !== 'https:') throw fail(403, '请从电台正式页面访问。');
        if (!url.pathname.startsWith(prefix) || url.search || /[%\\\x00-\x1f]/.test(url.pathname)) throw fail(404, '功能入口不存在。');
        if (request.method === 'OPTIONS') {
          const method = request.headers.get('Access-Control-Request-Method');
          const headers = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
          if (!['GET','POST'].includes(method) || headers.some(value => !['content-type','x-music-session','x-music-time','x-music-nonce','x-music-proof'].includes(value))) throw fail(403, '请求方式无效。');
          return new Response(null, {status: 204, headers: {...cors, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type, X-Music-Session, X-Music-Time, X-Music-Nonce, X-Music-Proof', 'Access-Control-Max-Age': '600'}});
        }
        const route = url.pathname.slice(prefix.length); activeRoute = route;
        if (request.method === 'GET' && route !== 'playback/account' || !['GET','POST'].includes(request.method)) throw fail(405, '请求方式无效。');
        const {text, input} = request.method === 'POST' ? await readInput(request) : {text: '', input: {}};
        sessions = createDeviceSessions({db: env.DB, key: env.MUSIC_SESSION_KEY, now});
        async function consume(name, limit, windowMs) {
          const at = now(), bucket = `${name}:${Math.floor(at / windowMs)}`;
          const row = await env.DB.prepare(`INSERT INTO music_rate_limits (bucket, count, expires_at) VALUES (?, 1, ?)
            ON CONFLICT(bucket) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`).bind(bucket, at + windowMs * 2, limit).first();
          if (!row) throw fail(429, '操作太频繁，请稍后重试。');
        }
        // CF supplies this header at the edge. Never log or persist raw client IPs.
        const peer = await hash(`${env.MUSIC_SESSION_KEY}:${request.headers.get('CF-Connecting-IP') || 'local'}`);
        await consume(`ip:${peer}`, 240, 60000);
        if (route === 'session' && request.method === 'POST') {
          await consume(`enroll:${peer}`, 10, 60000); await consume('enroll:day', 500, 86400000);
          const enrolled = await sessions.enroll({publicJwk: input.publicJwk, origin});
          return json(200, enrolled);
        }
        try { session = await sessions.authenticate(request, text, origin); }
        catch (error) { if (error.status === 401) throw fail(401, '设备会话已过期，正在重新连接。', 'device_session_invalid'); throw error; }
        store = sessions.credentialStore(session);
        let cookie = await store.load() || '', profile; loadedCookie = cookie;
        async function verifyProfile(candidate) {
          const result = bodyOf(await sdk.login_status({cookie: candidate, crypto: 'weapi', e_r: false, timeout: 12000}));
          const data = result?.data || result, user = data?.profile;
          if (Number(data?.code) !== 200 || !/^[1-9]\d{0,19}$/.test(String(user?.userId || ''))) throw fail(401, '网易云登录已失效，请重新扫码。', 'account_required');
          let avatarUrl = null;
          try { const url = new URL(user.avatarUrl); if (url.protocol === 'https:' && /^p\d+\.music\.126\.net$/.test(url.hostname) && !url.username && !url.password && !url.port) avatarUrl = url.href; } catch {}
          return {id: String(user.userId), nickname: String(user.nickname || '网易云账号').slice(0, 100), avatarUrl};
        }
        async function accountProfile() {
          if (!cookie) return null;
          if (profile) return profile;
          const fingerprint = await hash(cookie), cached = profiles.get(session.hash);
          if (cached?.fingerprint === fingerprint && cached.until > now()) return profile = cached.profile;
          try { profile = await verifyProfile(cookie); }
          catch (error) { if (error.auth || known.has(error) && error.code === 'account_required') { await store.clearIfMatches(cookie); profiles.delete(session.hash); cookie = ''; loadedCookie = ''; profile = null; throw fail(401, '网易云登录已失效，请重新扫码。', 'account_required'); } throw error; }
          for (const [key, cached] of profiles) if (cached.until <= now()) profiles.delete(key);
          while (profiles.size >= 100) profiles.delete(profiles.keys().next().value);
          profiles.set(session.hash, {fingerprint, profile, until: now() + 60000});
          return profile;
        }
        const state = () => ({available: true, local: false, authorized: Boolean(cookie && profile), account: profile || null, saved: Boolean(cookie), restoring: false});
        if (route === 'playback/logout') { await sessions.revoke(session); profiles.delete(session.hash); return json(200, {available: true, local: false, authorized: false, account: null, saved: false}); }
        if (route === 'playback/cancel') { await sessions.clearQr(session); return json(200, {ok: true}); }
        if (route === 'playback/qr') {
          await consume(`qr:${session.hash}`, 4, 60000); await consume(`qr-ip:${peer}`, 8, 60000); await consume('qr:global', 30, 60000);
          const generation = await sessions.beginQr(session);
          const result = bodyOf(await sdk.login_qr_key({cookie: {}, crypto: 'weapi', e_r: false, timeout: 12000})), key = result?.data?.unikey;
          if (Number(result?.code) !== 200 || typeof key !== 'string') throw fail(503, '登录二维码暂时无法获取，请重试。');
          const image = encodeQr(key), expiresAt = now() + 180000;
          if (!await sessions.setQr(session, {key, expiresAt}, generation)) throw fail(409, '本次扫码已取消，请重新获取。');
          return json(200, {image, expiresAt});
        }
        if (route === 'playback/qr-check') {
          await consume(`qr-check:${session.hash}`, 40, 60000);
          const qr = await sessions.getQr(session); if (!qr) return json(200, {code: 800, message: '二维码已过期，请重新获取。'});
          const result = bodyOf(await sdk.login_qr_check({key: qr.key, cookie: {}, crypto: 'weapi', e_r: false, timeout: 12000})), code = Number(result?.code);
          if (code === 803 && typeof result.cookie === 'string' && result.cookie) {
            const candidate = result.cookie, verified = await verifyProfile(candidate);
            if (!await sessions.completeQr(session, qr.key, candidate, qr.generation)) return json(200, {code: 800, message: '本次扫码已取消，请重新获取。'});
            cookie = candidate; profile = verified; profiles.delete(session.hash);
            return json(200, {...state(), code: 803, message: '登录成功，已加密保存；下次打开自动恢复。'});
          }
          if (code === 800) await sessions.clearQr(session, qr.key, qr.generation);
          return json(200, {code: [801,802].includes(code) ? code : 800, message: code === 802 ? '已扫码，请在网易云 App 中确认。' : code === 801 ? '请用网易云 App 扫码。' : '二维码已过期，请重新获取。'});
        }
        if (route === 'playback/account' || route === 'playback/restore' || route === 'playback/remember') {
          try { await accountProfile(); } catch (error) { if (known.has(error) && error.code === 'account_required') return json(200, state()); throw error; }
          return json(200, state());
        }
        if (route === 'playback/resolve') {
          await consume(`resolve:${session.hash}`, 30, 60000);
          if (typeof input.id !== 'string' || !/^[1-9]\d{0,19}$/.test(input.id) || input.quality !== undefined && !qualities.has(input.quality)) throw fail(400, '歌曲或音质无效。');
          await accountProfile(); return json(200, await resolveTrack(sdk, cookie || {}, input.id, input.quality || 'standard'));
        }
        if (route === 'netease') {
          if (['download','cancel-download'].includes(input.action)) throw fail(501, '在线服务暂不提供文件下载，请使用本机下载页面。');
          if (!actions.has(input.action)) throw fail(400, '功能入口无效。');
          if (input.action === 'subscribe' && input.kind === 'playlist') throw fail(501, '网易云歌单收藏需要额外验证，请在网易云完成。');
          await accountProfile();
          const account = {state, async request(method, args = {}, personal = false) {
            if (personal && !profile) throw fail(401, '请先登录网易云。', 'account_required');
            if (typeof sdk[method] !== 'function') throw fail(501, '当前服务暂不支持此功能。');
            const body = bodyOf(await sdk[method]({...args, cookie: cookie || {}, e_r: false, unblock: false, timeout: 15000}));
            if (Number(body?.code) !== 200) { const auth = [301,302,401,403].includes(Number(body?.code)); throw fail(auth ? 401 : 503, '网易云暂未返回内容，请重试。', auth ? 'account_required' : undefined); }
            return body;
          }};
          return json(200, await createNetEaseCore({account}).handle(input));
        }
        throw fail(404, '功能入口不存在。');
      } catch (error) {
        const trusted = known.has(error);
        if (store && loadedCookie && activeRoute !== 'playback/qr-check' && (error.auth || trusted && error.code === 'account_required')) { try { await store.clearIfMatches(loadedCookie); profiles.delete(session.hash); } catch { return json(503, {error: '登录状态暂时无法清理，请重试。'}); } }
        return json(trusted ? error.status : error.auth ? 401 : 503, {error: trusted ? error.message : error.auth ? '网易云登录已失效，请重新扫码。' : '服务暂时不可用，请稍后重试。', ...(trusted && error.code ? {code: error.code} : {})}, error.status === 429 ? {'Retry-After': '60'} : {});
      }
    },
    async scheduled(_event, env) { await createDeviceSessions({db: env.DB, key: env.MUSIC_SESSION_KEY, now}).prune(); },
  };
}

export default createEdgeMusic();
