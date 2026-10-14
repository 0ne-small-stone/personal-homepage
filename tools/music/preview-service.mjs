import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPlaybackIndexService } from './playback-index.mjs';
import { createPlaybackAccount } from './playback-account.mjs';
import { createSavedLoginStore } from './saved-login.mjs';
import playlist from '../../src/data/music/netease-playlist.json' with {type:'json'};
import {createLxDownloads,completedWebFiles,webAudioMiddleware} from './lx-downloads.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
const base='/personal-homepage';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
export function createMusicPreview({root=resolve(project,'.local-tools/music/library-layout-dist'), playback=createPlaybackIndexService(resolve(project,'.local-tools/music/playback-runtime')), account=createPlaybackAccount(), downloads=null}={}) {
  // Playback addresses are runtime data, outside the directory Astro rebuilds.
  const server=createServer(async(req,res)=>{
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    if(req.headers.host!==`127.0.0.1:${server.address()?.port}`){send(403,{error:'仅允许本机访问。'});return;}
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
      const origin=`http://127.0.0.1:${server.address().port}`;
      if(pathname.startsWith(`${base}/api/music/lx/`)) {
        if((req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site'){send(403,{error:'请在当前电台页面操作。'});return;}
        if(!downloads){send(503,{error:'网页下载服务尚未启动，请打开本机音乐预览。'});return;}
        const route=pathname.slice(`${base}/api/music/lx/`.length);
        try {
          if(req.method==='GET'&&route==='status'){send(200,await downloads.status());return;}
          if(req.method==='GET'&&route==='jobs'){send(200,{jobs:downloads.jobs()});return;}
          if(req.method!=='POST'||req.headers.origin!==origin){send(403,{error:'下载需要同源页面。'});return;}
          if(req.headers['content-type']?.split(';')[0]!=='application/json'){send(400,{error:'请求格式无效。'});return;}
          let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>2048){send(413,{error:'请求过长。'});return;}}
          let input;try{input=JSON.parse(raw);}catch{send(400,{error:'请求格式无效。'});return;}
          if(!input||typeof input!=='object'||Array.isArray(input)){send(400,{error:'请求格式无效。'});return;}
          if(route==='search'){send(200,await downloads.search(input.source,input.keyword,input.page||1));return;}
          if(route==='download'){send(200,downloads.download(input.id,input.quality));return;}
          if(route==='cancel'){downloads.cancel(input.id);send(200,{ok:true});return;}
          send(404,{error:'入口不存在。'});
        }catch(error){send(503,{error:error.message?.slice(0,160)||'下载服务暂时不可用。'});}
        return;
      }
      if(pathname.startsWith(`${base}/api/music/playback/`)){
        if((req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site'){send(403,{error:'请在当前电台页面操作。'});return;}
        const route=pathname.slice(`${base}/api/music/playback/`.length);
        if(route==='account'&&req.method==='GET'){send(200,account.state());return;}
        if(req.method!=='POST'||req.headers.origin!==origin){send(403,{error:'登录和播放需要同源页面。'});return;}
        if(req.headers['content-type']?.split(';')[0]!=='application/json'){send(400,{error:'请求格式无效。'});return;}
        let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>1024){send(413,{error:'请求过长。'});return;}}
        let input;try{input=JSON.parse(raw);}catch{send(400,{error:'请求格式无效。'});return;}
        if(!input||typeof input!=='object'||Array.isArray(input)){send(400,{error:'请求格式无效。'});return;}
        try{
          if(route==='qr'){send(200,await account.createQr());return;}
          if(route==='qr-check'){send(200,await account.checkQr());return;}
          if(route==='cancel'){account.cancel();send(200,{ok:true});return;}
          if(route==='logout'){await account.logout();send(200,account.state());return;}
          if(route==='remember'){await account.remember();send(200,account.state());return;}
          if(route==='restore'){await account.retryRestore();send(200,account.state());return;}
          if(route==='resolve'){
            if(!playlist.tracks.some(track=>track.id===input.id)){send(400,{error:'这首歌不在当前歌单。'});return;}
            await account.ready();await account.prepare?.();const index=account.state().authorized?await account.index():await playback.get();
            send(200,{...index,tracks:index.tracks.filter(track=>track.id===input.id)});return;
          }
          send(404,{error:'入口不存在。'});
        }catch(error){send(error.auth?401:503,{error:error.auth?'网易云登录已失效，请重新扫码。':error.persistence?error.message:'网易云服务暂时不可用，请重试。'});}
        return;
      }
      if(!['GET','HEAD'].includes(req.method)){send(405,{error:'只支持读取。'});return;}
      if(pathname.startsWith(`${base}/music/local-`)) {
        if((req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site'){send(403,{error:'仅允许电台读取。'});return;}
        let next=false;await webAudioMiddleware(req,res,()=>{next=true;});if(!next)return;
      }
      if(downloads&&pathname===`${base}/music/catalog.json`) {
        let catalog;try{catalog=JSON.parse(await readFile(resolve(project,'.local-tools/music/cloud-library/catalog.json'),'utf8'));}catch{catalog=JSON.parse(await readFile(resolve(root,'music/catalog.json'),'utf8'));}
        const files=await completedWebFiles();const ids=new Set(catalog.tracks.map(track=>track.id));
        send(200,{...catalog,tracks:[...catalog.tracks,...files.filter(entry=>!ids.has(entry.id)).map(entry=>entry.track)]});return;
      }
      if(pathname===`${base}/music/netease-playback.json`){
        try{send(200,await playback.get());}catch{send(503,{error:'网易云播放服务暂时不可用，请稍后重试。'});}
        return;
      }
      if(!pathname.startsWith(base+'/')){res.writeHead(404);res.end();return;}
      let target=resolve(root,'.'+pathname.slice(base.length));
      if(target!==resolve(root)&&!target.startsWith(resolve(root)+sep)){send(403,{error:'路径无效。'});return;}
      if((await stat(target)).isDirectory())target=resolve(target,'index.html');
      const content=await readFile(target);
      res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
      res.end(req.method==='HEAD'?undefined:content);
    }catch{res.writeHead(404);res.end();}
  });
  server.on('listening',()=>playback.start());server.on('close',()=>{playback.stop();account.dispose?.();downloads?.dispose();});
  return server;
}
export function startMusicPreview() {
  // SDK diagnostics can contain response cookies; expose only our bounded state.
  console.log=()=>{};console.error=()=>{};
  const root=resolve(project,process.env.MUSIC_PREVIEW_DIR||'.local-tools/music/library-layout-dist');
  const server=createMusicPreview({root,account:createPlaybackAccount({store:createSavedLoginStore()}),downloads:createLxDownloads()});
  server.listen(Number(process.env.LSSH_MUSIC_PREVIEW_PORT||61173),'127.0.0.1',()=>process.stdout.write(`音乐预览：http://127.0.0.1:${server.address().port}${base}/music/\n`));
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)startMusicPreview();
