import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRecommendationStore } from './recommendations.mjs';
import { createNetEaseAdapter } from './netease-adapter.mjs';
import { startPlaybackIndex } from './playback-index.mjs';

const project = fileURLToPath(new URL('../../', import.meta.url));
const port = Number(process.env.MUSIC_RECOMMEND_PORT || 4348);
const origin = 'http://127.0.0.1:' + port;
const base = '/personal-homepage';
const apiBase = base + '/api/music';
const root = path.resolve(project, process.env.MUSIC_PREVIEW_DIR || '.local-tools/music/persistent-audio-dist');
const adapter = createNetEaseAdapter();
// The community SDK logs raw failed responses, which may include Set-Cookie.
// Keep those out of the terminal; our adapter exposes only bounded messages.
const serviceLog = console.log.bind(console);
console.log = (...args) => { if (args[0] !== '[ERR]') serviceLog(...args); };
const store = await createRecommendationStore(path.resolve(project,'.local-tools/music/recommendations/queue.json'),adapter);
startPlaybackIndex(root);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.xml':'application/xml'};
const rates=new Map();
function send(res, code, data) { res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data)); }
async function body(req) {
  if(req.headers['content-type']?.split(';')[0] !== 'application/json')throw Error('请求格式无效。');
  let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>8192)throw Error('请求过长。');}
  return JSON.parse(value);
}
http.createServer(async(req,res)=>{
  if(req.headers.host !== '127.0.0.1:' + port){send(res,403,{error:'仅允许本机同源访问。'});return;}
  const url=new URL(req.url,origin);
  try {
    if(url.pathname.startsWith(apiBase+'/')){
      if(req.headers.origin && req.headers.origin !== origin){send(res,403,{error:'不允许跨站请求。'});return;}
      if(req.headers['sec-fetch-site'] === 'cross-site'){send(res,403,{error:'不允许跨站请求。'});return;}
      const route=url.pathname.slice(apiBase.length);
      if(req.method==='GET' && route==='/status'){send(res,200,{available:true,local:true,authorized:adapter.authorized()});return;}
      if(req.method==='GET' && route==='/recommendations/status'){
        const id=url.searchParams.get('submissionId');if(!/^[\da-f-]{36}$/i.test(id||'')){send(res,400,{error:'记录标识无效。'});return;}
        const record=store.status(id);send(res,record?200:404,record||{error:'没有找到这条推荐。'});return;
      }
      if(req.method==='GET' && route==='/admin/state'){send(res,200,{account:adapter.account(),records:store.list()});return;}
      if(req.method !== 'POST' || req.headers.origin !== origin){send(res,403,{error:'写入操作需要同源页面。'});return;}
      const input=await body(req);
      if(route==='/recommendations'){
        const address=req.socket.remoteAddress;const now=Date.now();const hits=(rates.get(address)||[]).filter(time=>now-time<60000);
        if(hits.length>=10){send(res,429,{error:'提交频率较高，请稍后再试。'});return;}
        hits.push(now);rates.set(address,hits);send(res,201,await store.submit(input));return;
      }
      if(route==='/admin/qr'){send(res,200,await adapter.createQr());return;}
      if(route==='/admin/qr-check'){const state=await adapter.checkQr();send(res,200,state);if(state.code===803)void store.resume().catch(()=>{});return;}
      if(route==='/admin/logout'){adapter.logout();send(res,200,{ok:true});return;}
      if(route==='/admin/review'){send(res,200,await store.review(input.id,input.decision));return;}
      send(res,404,{error:'接口不存在。'});return;
    }
    if(!['GET','HEAD'].includes(req.method)){send(res,405,{error:'请求方法无效。'});return;}
    let file;
    if(url.pathname===base+'/music/manage/')file=new URL('./recommendation-admin.html',import.meta.url);
    else if(url.pathname===base+'/music/manage/admin.js')file=new URL('./recommendation-admin.js',import.meta.url);
    else if(url.pathname===base+'/music/manage/admin.css')file=new URL('./recommendation-admin.css',import.meta.url);
    else {
      if(!url.pathname.startsWith(base+'/'))throw Error();
      file=path.resolve(root,'.'+decodeURIComponent(url.pathname.slice(base.length)));
      const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative))throw Error();
      if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    }
    const data=await readFile(file);const ext=path.extname(file instanceof URL?file.pathname:file);
    res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});res.end(req.method==='HEAD'?undefined:data);
  }catch(error){send(res,url.pathname.startsWith(apiBase+'/')?400:404,{error:url.pathname.startsWith(apiBase+'/')?error.message:'页面不存在。'});}
}).listen(port,'127.0.0.1',()=>process.stdout.write('Echoes 本机推歌服务 '+origin+base+'/music/?mode=netease\n管理页 '+origin+base+'/music/manage/\n'));
