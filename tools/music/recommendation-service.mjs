import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRecommendationStore } from './recommendations.mjs';
import { createNetEaseAdapter } from './netease-adapter.mjs';
import { startPlaybackIndex } from './playback-index.mjs';
import { readJson, sameOrigin, sendJson, sendStaticFile } from './http.mjs';

const project = fileURLToPath(new URL('../../', import.meta.url));
const base = '/personal-homepage';
const apiBase = base + '/api/music';
const adminFiles = new Map([
  [base + '/music/manage/', 'recommendation-admin.html'],
  [base + '/music/manage/admin.js', 'recommendation-admin.js'],
  [base + '/music/manage/admin.css', 'recommendation-admin.css'],
]);

export function createRecommendationService({ root, adapter, store }) {
  const rates = new Map();
  const server = http.createServer(async (req, res) => {
    const send = (status, data) => sendJson(res, status, data);
    const origin = `http://127.0.0.1:${server.address()?.port}`;
    if (req.headers.host !== new URL(origin).host) { send(403, { error: '仅允许本机同源访问。' }); return; }
    let url;
    try {
      url = new URL(req.url, origin);
      if (url.pathname.startsWith(apiBase + '/')) {
        if (!sameOrigin(req, origin)) { send(403, { error: '不允许跨站请求。' }); return; }
        const route = url.pathname.slice(apiBase.length);
        if (req.method === 'GET' && route === '/status') { send(200, { available: true, local: true, authorized: adapter.authorized() }); return; }
        if (req.method === 'GET' && route === '/recommendations/status') {
          const id = url.searchParams.get('submissionId');
          if (!/^[\da-f-]{36}$/i.test(id || '')) { send(400, { error: '记录标识无效。' }); return; }
          const record = store.status(id); send(record ? 200 : 404, record || { error: '没有找到这条推荐。' }); return;
        }
        if (req.method === 'GET' && route === '/admin/state') { send(200, { account: adapter.account(), records: store.list() }); return; }
        if (req.method !== 'POST' || !sameOrigin(req, origin, true)) { send(403, { error: '写入操作需要同源页面。' }); return; }
        const input = await readJson(req, res, 8192);
        if (route === '/recommendations') {
          const address = req.socket.remoteAddress; const now = Date.now();
          const hits = (rates.get(address) || []).filter(time => now - time < 60000);
          if (hits.length >= 10) { send(429, { error: '提交频率较高，请稍后再试。' }); return; }
          hits.push(now); rates.set(address, hits); send(201, await store.submit(input)); return;
        }
        if (route === '/admin/qr') { send(200, await adapter.createQr()); return; }
        if (route === '/admin/qr-check') { const state = await adapter.checkQr(); send(200, state); if (state.code === 803) void store.resume().catch(() => {}); return; }
        if (route === '/admin/logout') { adapter.logout(); send(200, { ok: true }); return; }
        if (route === '/admin/review') { send(200, await store.review(input.id, input.decision)); return; }
        send(404, { error: '接口不存在。' }); return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) { send(405, { error: '请求方法无效。' }); return; }
      if (adminFiles.has(url.pathname)) {
        await sendStaticFile(req, res, fileURLToPath(new URL('./', import.meta.url)), adminFiles.get(url.pathname)); return;
      }
      if (!url.pathname.startsWith(base + '/')) { send(404, { error: '页面不存在。' }); return; }
      await sendStaticFile(req, res, root, decodeURIComponent(url.pathname.slice(base.length)));
    } catch (error) {
      if (res.destroyed || res.writableEnded) return;
      const api = url?.pathname.startsWith(apiBase + '/');
      send(api ? error.status === 413 ? 413 : 400 : 404, { error: api ? error.message?.slice(0, 160) || '操作未完成。' : '页面不存在。' });
    }
  });
  return server;
}

export async function startRecommendationService() {
  const port = Number(process.env.MUSIC_RECOMMEND_PORT || 4348);
  const root = path.resolve(project, process.env.MUSIC_PREVIEW_DIR || '.local-tools/music/persistent-audio-dist');
  const adapter = createNetEaseAdapter();
  // SDK diagnostics may contain Set-Cookie; retain the existing bounded console filter.
  const serviceLog = console.log.bind(console);
  console.log = (...args) => { if (args[0] !== '[ERR]') serviceLog(...args); };
  const store = await createRecommendationStore(path.resolve(project, '.local-tools/music/recommendations/queue.json'), adapter);
  const server = createRecommendationService({ root, adapter, store });
  const stopPlayback = startPlaybackIndex(root);
  server.once('close', stopPlayback);
  server.listen(port, '127.0.0.1', () => process.stdout.write(`Echoes 本机推歌服务 http://127.0.0.1:${port}${base}/music/?mode=netease\n管理页 http://127.0.0.1:${port}${base}/music/manage/\n`));
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) void startRecommendationService();
