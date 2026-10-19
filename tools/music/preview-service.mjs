import { createServer } from 'node:http';
import { readFile, mkdir, open, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { parseFile } from 'music-metadata';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPlaybackIndexService } from './playback-index.mjs';
import { createPlaybackAccount } from './playback-account.mjs';
import { createSavedLoginStore } from './saved-login.mjs';
import playlist from '../../src/data/music/netease-playlist.json' with {type:'json'};
import {createLxDownloads,completedWebFiles,webAudioMiddleware} from './lx-downloads.mjs';
import {createNetEaseCore,musicId} from './netease-core.mjs';
import {verifyCloudUpload} from './netease-upload.mjs';
import {localAudioMiddleware,localAudioUrls} from './local-playback.mjs';
import {readJson,sameOrigin,sendJson,sendStaticFile} from './http.mjs';
import {createRecommendationHandler} from './recommendation-service.mjs';
import {createNetEaseAdapter} from './netease-adapter.mjs';
import {createRecommendationStore} from './recommendations.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
const base='/personal-homepage';
export function createMusicPreview({root=resolve(project,'.local-tools/music/library-layout-dist'), playback=createPlaybackIndexService(resolve(project,'.local-tools/music/playback-runtime')), account=createPlaybackAccount(), downloads=null,recommendations=null}={}) {
  const netease=createNetEaseCore({account,downloads});
  const localManifest=resolve(project,'.local-tools/music/audio-map.json');
  const localAudio=localAudioMiddleware({base,manifestFile:localManifest,fallthroughIfMissing:true});
  const recommendationHandler=recommendations?createRecommendationHandler({root,...recommendations,ownedRoutesOnly:true,getOrigin:()=>`http://127.0.0.1:${server.address()?.port}`}):null;
  // Playback addresses are runtime data, outside the directory Astro rebuilds.
  const server=createServer(async(req,res)=>{
    const send=(status,data)=>sendJson(res,status,data);
    if(req.headers.host!==`127.0.0.1:${server.address()?.port}`){send(403,{error:'仅允许本机访问。'});return;}
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
      const origin=`http://127.0.0.1:${server.address().port}`;
      if(recommendationHandler&&await recommendationHandler(req,res))return;
      if(pathname===`${base}/api/music/netease-upload`){
        if(req.method!=='POST'||!sameOrigin(req,origin,true)){send(403,{error:'请在当前电台页面上传。'});return;}
        await account.ready();if(!account.state().authorized){send(401,{error:'登录后上传到你的网易云云盘。'});return;}
        let name;try{name=decodeURIComponent(req.headers['x-music-name']||'');}catch{}
        if(typeof name!=='string'||name.length>200||/[<>:"/\\|?*\x00-\x1f]/.test(name)||!/\.(mp3|flac|m4a|wav|ogg)$/i.test(name)||req.headers['content-type']!=='application/octet-stream'){send(400,{error:'请上传有效的音乐文件。'});return;}
        if(Number(req.headers['content-length']||0)>128*1024*1024){send(413,{error:'请上传128 MB以内的音频。'});return;}
        const directory=resolve(project,'.local-tools/music/cloud-uploads');await mkdir(directory,{recursive:true});const temporary=resolve(directory,randomUUID()+'.'+name.split('.').pop().toLowerCase());let handle;
        try{handle=await open(temporary,'wx');let size=0;for await(const chunk of req){size+=chunk.length;if(size>128*1024*1024)throw Error('音频超过上传限制。');await handle.writeFile(chunk);}await handle.close();handle=null;
          const metadata=await parseFile(temporary,{duration:true});if(!metadata.format.duration)throw Error('无法识别这份音频。');
          const result=await account.request('cloud',{songFile:{name:Buffer.from(name,'utf8').toString('latin1'),tempFilePath:temporary,size}},true);
          const track=await verifyCloudUpload(account,result,{name,size});send(200,{ok:true,track});
        }catch{send(503,{error:'上传暂未完成，请重试。'});}finally{await handle?.close().catch(()=>{});await unlink(temporary).catch(()=>{});}return;
      }
      if(pathname===`${base}/api/music/netease`){
        if(req.method!=='POST'||!sameOrigin(req,origin,true)){send(403,{error:'请在当前电台页面操作。'});return;}
        let input;try{input=await readJson(req,res,8192);}catch(error){send(error.status,{error:error.message});return;}
        try{await account.ready();send(200,await netease.handle(input));}
        catch(error){send(error.auth?401:503,{error:error.message?.slice(0,160)||'网易云服务暂时不可用。'});}return;
      }
      if(pathname.startsWith(`${base}/api/music/lx/`)) {
        if(!sameOrigin(req,origin)){send(403,{error:'请在当前电台页面操作。'});return;}
        if(!downloads){send(503,{error:'网页下载服务尚未启动，请打开本机音乐预览。'});return;}
        const route=pathname.slice(`${base}/api/music/lx/`.length);
        try {
          if(req.method==='GET'&&route==='status'){send(200,await downloads.status());return;}
          if(req.method==='GET'&&route==='jobs'){send(200,{jobs:downloads.jobs()});return;}
          if(req.method!=='POST'||!sameOrigin(req,origin,true)){send(403,{error:'下载需要同源页面。'});return;}
          let input;try{input=await readJson(req,res,2048);}catch(error){send(error.status,{error:error.message});return;}
          if(route==='search'){send(200,await downloads.search(input.source,input.keyword,input.page||1));return;}
          if(route==='download'){send(200,downloads.download(input.id,input.quality));return;}
          if(route==='cancel'){downloads.cancel(input.id);send(200,{ok:true});return;}
          send(404,{error:'入口不存在。'});
        }catch(error){send(503,{error:error.message?.slice(0,160)||'下载服务暂时不可用。'});}
        return;
      }
      if(pathname.startsWith(`${base}/api/music/playback/`)){
        if(!sameOrigin(req,origin)){send(403,{error:'请在当前电台页面操作。'});return;}
        const route=pathname.slice(`${base}/api/music/playback/`.length);
        if(route==='account'&&req.method==='GET'){send(200,account.state());return;}
        if(req.method!=='POST'||!sameOrigin(req,origin,true)){send(403,{error:'登录和播放需要同源页面。'});return;}
        let input;try{input=await readJson(req,res,1024);}catch(error){send(error.status,{error:error.message});return;}
        try{
          if(route==='qr'){send(200,await account.createQr());return;}
          if(route==='qr-check'){const state=await account.checkQr();send(200,state);if(state.code===803)void recommendations?.store.resume().catch(()=>{});return;}
          if(route==='cancel'){account.cancel();send(200,{ok:true});return;}
          if(route==='logout'){await account.logout();send(200,account.state());return;}
          if(route==='remember'){await account.remember();send(200,account.state());return;}
          if(route==='restore'){await account.retryRestore();send(200,account.state());return;}
          if(route==='resolve'){
            try{musicId(input.id);}catch{send(400,{error:'歌曲编号无效。'});return;}
            if(input.quality!==undefined&&!['standard','exhigh','lossless','hires'].includes(input.quality)){send(400,{error:'音质无效。'});return;}
            await account.ready();await account.prepare?.();const standard=!input.quality||input.quality==='standard';const fixed=playlist.tracks.some(track=>track.id===input.id);
            const index=fixed&&standard?account.state().authorized?await account.index():await playback.get():account.resolveTrack?await account.resolveTrack(input.id,input.quality||'standard'):await playback.get();
            send(200,{...index,tracks:index.tracks.filter(track=>track.id===input.id)});return;
          }
          send(404,{error:'入口不存在。'});
        }catch(error){send(error.auth?401:503,{error:error.auth?'网易云登录已失效，请重新扫码。':error.persistence?error.message:'网易云服务暂时不可用，请重试。'});}
        return;
      }
      if(!['GET','HEAD'].includes(req.method)){send(405,{error:'只支持读取。'});return;}
      if(pathname.startsWith(`${base}/music/local-`)) {
        if(!sameOrigin(req,origin)){send(403,{error:'仅允许电台读取。'});return;}
        let next=false;await localAudio(req,res,()=>{next=true;});if(!next)return;
        next=false;await webAudioMiddleware(req,res,()=>{next=true;});if(!next)return;
      }
      if(downloads&&pathname===`${base}/music/catalog.json`) {
        let catalog;try{catalog=JSON.parse(await readFile(resolve(project,'.local-tools/music/cloud-library/catalog.json'),'utf8'));}catch{catalog=JSON.parse(await readFile(resolve(root,'music/catalog.json'),'utf8'));}
        const files=await completedWebFiles();const ids=new Set(catalog.tracks.map(track=>track.id));
        const combined={...catalog,tracks:[...catalog.tracks,...files.filter(entry=>!ids.has(entry.id)).map(entry=>entry.track)]};
        send(200,await localAudioUrls(combined,base,localManifest,{preferLocal:true}));return;
      }
      if(pathname===`${base}/music/netease-playback.json`){
        try{send(200,await playback.get());}catch{send(503,{error:'网易云播放服务暂时不可用，请稍后重试。'});}
        return;
      }
      if(!pathname.startsWith(base+'/')){res.writeHead(404);res.end();return;}
      await sendStaticFile(req,res,root,pathname.slice(base.length));
    }catch{res.writeHead(404);res.end();}
  });
  server.on('listening',()=>playback.start());server.on('close',()=>{playback.stop();account.dispose?.();downloads?.dispose();});
  return server;
}
export async function startMusicPreview() {
  // SDK diagnostics can contain response cookies; expose only our bounded state.
  console.log=console.info=console.warn=console.error=()=>{};
  const root=resolve(project,process.env.MUSIC_PREVIEW_DIR||'.local-tools/music/library-layout-dist');
  const account=createPlaybackAccount({store:createSavedLoginStore()});
  const adapter=createNetEaseAdapter({account});
  const store=await createRecommendationStore(resolve(project,'.local-tools/music/recommendations/queue.json'),adapter);
  const server=createMusicPreview({root,account,downloads:createLxDownloads(),recommendations:{adapter,store}});
  server.listen(Number(process.env.LSSH_MUSIC_PREVIEW_PORT||61173),'127.0.0.1',()=>process.stdout.write(`音乐预览：http://127.0.0.1:${server.address().port}${base}/music/\n`));
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)void startMusicPreview();
