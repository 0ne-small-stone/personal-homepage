import {createHash,randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,open,readFile,realpath,rename,stat,unlink,link} from 'node:fs/promises';
import {lookup} from 'node:dns/promises';
import {BlockList,isIP} from 'node:net';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {parseFile} from 'music-metadata';
import sharp from 'sharp';
import {createLxEngine,currentLxSettings} from './lx-engine.mjs';
import {byteRange} from './local-playback.mjs';
const project=fileURLToPath(new URL('../../',import.meta.url));
const runtime=path.join(project,'.local-tools/music');
export const webManifest=path.join(runtime,'web-downloads.json');
const platforms={kw:'酷我',kg:'酷狗',tx:'QQ 音乐',wy:'网易云',mg:'咪咕'};
const qualityOrder=['128k','320k','flac','flac24bit','hires'];
const blocked=new BlockList();
for(const [address,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.168.0.0',16],['100.64.0.0',10],['192.0.0.0',24],['198.18.0.0',15],['224.0.0.0',4],['240.0.0.0',4]])blocked.addSubnet(address,prefix,'ipv4');
for(const [address,prefix] of [['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8],['2001:db8::',32]])blocked.addSubnet(address,prefix,'ipv6');
export async function publicDestination(value,resolveDns=lookup) {
  const url=new URL(value);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||(url.port&&!['80','443'].includes(url.port)))throw new Error('下载地址不符合要求。');
  const hostname=url.hostname.replace(/^\[|\]$/g,'');
  const addresses=isIP(hostname)?[{address:hostname,family:isIP(hostname)}]:await resolveDns(hostname,{all:true});
  if(!addresses.length||addresses.some(({address,family})=>address.startsWith('::ffff:')||blocked.check(address,family===6?'ipv6':'ipv4')))throw new Error('下载地址不能指向本机或内网。');
  return {url,address:addresses[0]};
}
// Each redirect gets a fresh public-IP check; the request uses that exact DNS result.
export async function publicResponse(value,signal,redirects=0) {
  if(redirects>4)throw new Error('下载跳转过多。');
  const {url,address}=await publicDestination(value);
  const response=await new Promise((resolve,reject)=>{
    const transport=url.protocol==='https:'?https:http;
    const request=transport.get(url,{agent:false,signal,headers:{'User-Agent':'Mozilla/5.0','Accept-Encoding':'identity'},lookup:(_host,options,callback)=>options.all?callback(null,[address]):callback(null,address.address,address.family)},resolve);
    request.on('error',reject);
  });
  if([301,302,303,307,308].includes(response.statusCode)){
    response.destroy();if(!response.headers.location)throw new Error('下载跳转无效。');
    return publicResponse(new URL(response.headers.location,url).href,signal,redirects+1);
  }
  if(response.statusCode!==200){response.destroy();throw new Error('音源下载暂时不可用。');}
  return response;
}
export function safeFileStem(song) {
  const clean=value=>String(value||'').normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g,' ').replace(/[. ]+$/g,'').trim().slice(0,90);
  return `${clean(song.singer)||'未知歌手'} - ${clean(song.name)||'歌曲'}`;
}
export function verifiedFormat(format,quality,duration) {
  if(!format.duration||format.duration<Math.max(1,duration-3))throw new Error('音源长度不足，未加入曲库。');
  const codec=String(format.codec||'').toUpperCase();
  const ext=codec.includes('FLAC')?'flac':codec.includes('MPEG')?'mp3':codec.includes('ALAC')||codec.includes('AAC')?'m4a':null;
  if(!ext)throw new Error('暂不支持这个音频格式。');
  if(['flac','flac24bit','hires'].includes(quality)&&ext!=='flac'&&!codec.includes('ALAC'))throw new Error('音源未返回无损文件，请选择其他音质。');
  if(quality==='flac24bit'&&(format.bitsPerSample||0)<24)throw new Error('音源未返回 24 bit 音频，请选择其他音质。');
  if(quality==='hires'&&(format.bitsPerSample||0)<24&&(format.sampleRate||0)<=48000)throw new Error('音源未返回 Hi-Res 音频，请选择其他音质。');
  if(quality==='320k'&&ext==='mp3'&&format.bitrate&&format.bitrate<270000)throw new Error('音源未返回所选高品质，请选择其他音质。');
  return ext;
}
export async function completedWebFiles(manifest=webManifest) {
  try {
    const data=JSON.parse(await readFile(manifest,'utf8'));if(data.version!==1||!Array.isArray(data.files))return [];
    const root=await realpath(data.directory);const verified=[];
    for(const entry of data.files){
      if(entry.status!=='completed'||!/^[a-f0-9]{24}$/.test(entry.id)||typeof entry.relative!=='string')continue;
      const file=await realpath(path.resolve(root,entry.relative)).catch(()=>null);if(!file)continue;
      const relative=path.relative(root,file);
      if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))continue;
      const info=await stat(file);
      if(info.isFile()&&info.size===entry.size&&info.mtimeMs===entry.mtimeMs)verified.push({...entry,file});
    }
    return verified;
  }catch{return [];}
}
export function createLxDownloads({engine=createLxEngine(),settings=currentLxSettings,manifest=webManifest,request=publicResponse,tagger,parseAudio=parseFile}={}) {
  const cache=new Map(),jobs=new Map();let queue=Promise.resolve(),disposed=false,restored=false;
  const clean=text=>String(text||'').slice(0,500);
  const publicJob=job=>({id:job.id,resultId:job.resultId,title:job.song.name,artist:job.song.singer,quality:job.quality,status:job.status,received:job.received,total:job.total,error:job.error||'',trackId:job.trackId||''});
  async function status(){
    const sources=await engine.status();
    if(!restored){restored=true;for(const entry of await completedWebFiles(manifest))if(entry.source&&entry.quality){const job={id:entry.id,resultId:'',song:{name:entry.track.title,singer:entry.track.artist,songmid:entry.songmid},source:entry.source,quality:entry.quality,status:'completed',received:entry.size,total:entry.size,trackId:entry.id,controller:new AbortController()};jobs.set(job.id,job);}}
    return {ready:true,platforms:Object.entries(platforms).filter(([id])=>sources[id]).map(([id,name])=>({id,name})),jobs:[...jobs.values()].map(publicJob)};
  }
  async function search(source,keyword,page=1){
    if(!platforms[source]||typeof keyword!=='string'||!keyword.trim()||keyword.length>200||!Number.isInteger(page)||page<1||page>50)throw new Error('请输入有效的歌曲或歌手。');
    const supported=await engine.status();if(!supported[source])throw new Error('当前音源不支持此平台。');
    const data=await engine.search(source,keyword.trim(),page);
    const tracks=(data.list||[]).slice(0,20).map(song=>{
      const id=randomUUID();const qualities=qualityOrder.filter(type=>supported[source].qualitys.includes(type)&&song.types?.some(item=>item.type===type));
      const item={id,title:clean(song.name),artist:clean(song.singer),album:clean(song.albumName),duration:String(song.interval||''),coverUrl:/^https:\/\//.test(song.img||'')?song.img:null,qualities};
      cache.set(id,{song,source,qualities});return item;
    });
    while(cache.size>400)cache.delete(cache.keys().next().value);
    return {tracks,page,hasMore:page<Math.min(50,data.allPage||1)};
  }
  async function finish(job){
    let temporary,handle;
    try {
      job.status='resolving';const audio=await engine.resolve(job.source,job.song,job.quality);
      if(job.controller.signal.aborted)throw new Error('cancelled');
      const config=await settings();const directory=await realpath(config.directory);
      temporary=path.join(directory,`.lssh-${job.id}.part`);handle=await open(temporary,'wx');
      job.status='downloading';const signal=AbortSignal.any([job.controller.signal,AbortSignal.timeout(600000)]);
      const response=await request(audio.url,signal);
      job.total=Number(response.headers['content-length']||0);
      if(job.total>512*1024*1024){response.destroy();throw new Error('音频超过 512 MB 下载限制。');}
      for await(const chunk of response){
        if(signal.aborted)throw new Error('cancelled');job.received+=chunk.length;
        if(job.received>512*1024*1024){response.destroy();throw new Error('音频超过下载限制。');}
        await handle.writeFile(chunk);
      }
      await handle.close();handle=null;
      if(job.total&&job.total!==job.received)throw new Error('音频未完整下载，请重试。');
      job.status='verifying';const duration=String(job.song.interval||'').split(':').reduce((value,part)=>value*60+Number(part),0);
      const metadata=await parseAudio(temporary,{duration:true});const extension=verifiedFormat(metadata.format,job.quality,duration);
      let cover;
      if(job.song.img){try{
        const response=await request(job.song.img,signal);const chunks=[];let size=0;
        for await(const chunk of response){size+=chunk.length;if(size>8*1024*1024){response.destroy();throw new Error('COVER_LIMIT');}chunks.push(chunk);}
        cover=await sharp(Buffer.concat(chunks),{limitInputPixels:40_000_000}).resize({width:800,height:800,fit:'inside',withoutEnlargement:true}).jpeg({quality:90}).toBuffer();
      }catch{/* A missing cover does not discard valid audio. */}}
      if(job.controller.signal.aborted)throw new Error('cancelled');
      const native=tagger||createRequire(import.meta.url)(path.join(runtime,'lx-runtime/node_modules/music-tag-native'));
      const tags=new native.MusicTagger();
      try{tags.loadPath(temporary);tags.title=job.song.name;tags.artist=job.song.singer;tags.album=job.song.albumName||'未标注专辑';tags.albumArtist=job.song.singer;if(cover)tags.pictures=[new native.MetaPicture('image/jpeg',cover,'Cover')];tags.save();}finally{tags.dispose();}
      const relative=`${safeFileStem(job.song)} [${job.source}-${job.song.songmid}-${job.quality}].${extension}`.replace(/[<>:"/\\|?*\x00-\x1f]/g,' ');
      const target=path.join(directory,relative);
      // Exclusive hard link publishes the complete file without replacing an existing song.
      await link(temporary,target);await unlink(temporary);temporary=null;
      const info=await stat(target);const id=createHash('sha256').update(relative).digest('hex').slice(0,24);
      const track={id,title:clean(job.song.name),artist:clean(job.song.singer),album:clean(job.song.albumName)||'未标注专辑',albumArtist:clean(job.song.singer),trackNumber:0,discNumber:0,duration:metadata.format.duration,format:extension,sampleRate:metadata.format.sampleRate||0,bitsPerSample:metadata.format.bitsPerSample||0,audioUrl:`/personal-homepage/music/local-audio/${id}/`,coverUrl:cover?`/personal-homepage/music/local-cover/${id}/`:null,lyrics:null};
      if(cover){await mkdir(path.join(path.dirname(manifest),'web-covers'),{recursive:true});await sharp(cover).webp({quality:85}).toFile(path.join(path.dirname(manifest),'web-covers',`${id}.webp`));}
      let prior;try{prior=JSON.parse(await readFile(manifest,'utf8'));}catch{}
      const files=prior?.directory===directory&&Array.isArray(prior.files)?prior.files.filter(file=>file.id!==id):[];
      files.push({id,relative,size:info.size,mtimeMs:info.mtimeMs,status:'completed',source:job.source,songmid:String(job.song.songmid),quality:job.quality,track});
      await mkdir(path.dirname(manifest),{recursive:true});const output=await open(`${manifest}.tmp`,'w');await output.writeFile(JSON.stringify({version:1,directory,files}));await output.close();await rename(`${manifest}.tmp`,manifest);
      job.trackId=id;job.status='completed';
    }catch(error){job.status=job.controller.signal.aborted?'cancelled':'failed';job.error=job.status==='cancelled'?'':error.code==='EEXIST'?'同音质的文件已存在，没有覆盖。':/^音源|^音频|^暂不支持/.test(error.message)?error.message:'下载未完成，请重试。';}
    finally{await handle?.close().catch(()=>{});if(temporary)await unlink(temporary).catch(()=>{});}
  }
  function download(id,quality){
    if(disposed)throw new Error('下载服务已停止。');
    const item=cache.get(id);if(!item||!item.qualities.includes(quality))throw new Error('搜索结果已过期或音质不可用，请重新搜索。');
    const existing=[...jobs.values()].find(job=>job.source===item.source&&job.song.songmid===item.song.songmid&&job.quality===quality&&!['failed','cancelled'].includes(job.status));
    if(existing){existing.resultId=id;return publicJob(existing);}
    if([...jobs.values()].filter(job=>!['failed','cancelled','completed'].includes(job.status)).length>=10)throw new Error('下载队列已满，请等待当前任务。');
    const job={id:randomUUID(),resultId:id,...item,quality,status:'queued',received:0,total:0,controller:new AbortController()};jobs.set(job.id,job);
    while(jobs.size>100){const old=[...jobs.values()].find(job=>['failed','cancelled','completed'].includes(job.status));if(!old)break;jobs.delete(old.id);}
    queue=queue.then(()=>job.controller.signal.aborted?job.status='cancelled':finish(job));return publicJob(job);
  }
  return {status,search,download,jobs:()=>[...jobs.values()].map(publicJob),cancel:id=>{const job=jobs.get(id);if(job&&!['completed','failed','cancelled'].includes(job.status)){job.controller.abort();if(job.status==='queued')job.status='cancelled';}},dispose:()=>{disposed=true;for(const job of jobs.values())job.controller.abort();engine.dispose();}};
}
export async function webAudioMiddleware(req,res,next) {
  const match=/^\/personal-homepage\/music\/local-(audio|cover)\/([a-f0-9]{24})\/$/.exec(new URL(req.url,'http://localhost').pathname);if(!match)return next();
  const entry=(await completedWebFiles()).find(entry=>entry.id===match[2]);if(!entry)return next();
  try {
    const cover=match[1]==='cover';const file=cover?path.join(runtime,'web-covers',`${entry.id}.webp`):entry.file;const info=await stat(file);
    const range=byteRange(req.headers.range,info.size);if(!range){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
    res.writeHead(range.partial?206:200,{'Content-Type':cover?'image/webp':entry.track.format==='mp3'?'audio/mpeg':entry.track.format==='m4a'?'audio/mp4':'audio/flac','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Content-Length':range.end-range.start+1,...(range.partial?{'Content-Range':`bytes ${range.start}-${range.end}/${info.size}`}:{})});
    if(req.method==='HEAD'){res.end();return;}const stream=createReadStream(file,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch{res.writeHead(404);res.end();}
}
