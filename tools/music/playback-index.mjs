import api from '@neteasecloudmusicapienhanced/api';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../../', import.meta.url));
function audioURL(value) {
  try { const url=new URL(value);if(!/^m\d{1,4}\.music\.126\.net$/.test(url.hostname)||url.username||url.password||url.port) return null;url.protocol='https:';return url.href; } catch { return null; }
}
async function verifyAudio(url) {
  const response=await fetch(url,{headers:{Range:'bytes=0-1023'},signal:AbortSignal.timeout(12000)});
  if(![200,206].includes(response.status)){await response.body?.cancel();return false;}
  const type=(response.headers.get('content-type')||'').split(';')[0];
  const reader=response.body?.getReader();if(!reader)return false;
  const first=await reader.read();await reader.cancel();
  const bytes=first.value||[];
  const mp3=bytes[0]===0x49&&bytes[1]===0x44&&bytes[2]===0x33 || bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0;
  return Boolean(mp3 && (type.startsWith('audio/')||type==='application/octet-stream'));
}
export async function fetchPlaybackIndex({ cookie = {}, sdk = api, verify = verifyAudio, now = Date.now } = {}) {
  const playlist=JSON.parse(await readFile(path.resolve(project,'src/data/music/netease-playlist.json'),'utf8'));
  const ids=playlist.tracks.map(track=>track.id);
  if(!ids.length||ids.length>500||!ids.every(id=>/^[1-9]\d{0,19}$/.test(id)))throw Error('Invalid playlist IDs');
  // Only standard platform playback; cookie comes from the dedicated local
  // listening login, never the recommendation administrator or unlock module.
  let result;
  try{result=await sdk.song_url_v1({id:ids.join(','),level:'standard',cookie,crypto:'eapi',unblock:false,e_r:false,timeout:15000});}
  catch(cause){const error=Error('NetEase resolver unavailable');error.auth=[301,302,401,403].includes(Number(cause?.body?.code||cause?.code));throw error;}
  if(result.body?.code!==200||!Array.isArray(result.body.data)){const error=Error('NetEase resolver unavailable');error.auth=[301,302,401,403].includes(Number(result.body?.code));throw error;}
  const tracks=[];
  for(const id of ids) {
    const item=result.body.data.find(track=>String(track.id)===id);
    const url=audioURL(item?.url);let usable=false;
    if(url&&item.code===200){try{usable=await verify(url);}catch{}}
    const trial=item?.freeTrialInfo;const previewSeconds=trial && Number.isFinite(trial.end) && Number.isFinite(trial.start) ? trial.end-trial.start : null;
    const expiresAt=new Date(now()+Math.min(600,Math.max(60,(Number(item?.expi)||1200)-30))*1000).toISOString();
    tracks.push({id,status:usable?previewSeconds?'preview':'full':'unavailable',audioUrl:usable?url:null,expiresAt,previewSeconds});
  }
  return {version:1,updatedAt:new Date(now()).toISOString(),tracks};
}
export async function updatePlaybackIndex(root = path.resolve(project, process.env.MUSIC_PREVIEW_DIR || '.local-tools/music/persistent-audio-dist')) {
  // Disk indexes are always anonymous. Account URLs remain in process memory.
  const index=await fetchPlaybackIndex();
  const folder=path.join(root,'music');await mkdir(folder,{recursive:true});
  const file=path.join(folder,'netease-playback.json');await writeFile(file+'.tmp',JSON.stringify(index));await rename(file+'.tmp',file);
  return index;
}
export function createPlaybackIndexService(root, { update = () => updatePlaybackIndex(root), load = async () => JSON.parse(await readFile(path.join(root,'music/netease-playback.json'),'utf8')), now = Date.now, retryMs = 15000 } = {}) {
  let cached=null;let pending=null;let retryAt=0;let loaded=false;let timer=null;let revision=0;
  const valid=()=>cached?.version===1 && cached.tracks?.length>0 && cached.tracks.every(track=>Date.parse(track.expiresAt)>now()+30000);
  async function get(force=false) {
    if(pending)return pending;
    if(!force && valid())return cached;
    const expected=revision;
    const job=(async()=>{
      if(!loaded){loaded=true;let stored=null;try{stored=await load();}catch{}if(expected!==revision)throw Error('Playback account changed');cached=stored;}
      if(!force && valid())return cached;
      if(now()<retryAt){if(valid())return cached;throw Error('Playback index unavailable');}
      try{const result=await update();if(expected!==revision)throw Error('Playback account changed');cached=result;retryAt=0;}
      catch(error){if(expected!==revision)throw Error('Playback account changed');retryAt=now()+retryMs;if(!valid()){const failure=Error('Playback index unavailable');failure.auth=Boolean(error?.auth);throw failure;}}
      if(!valid())throw Error('Playback index unavailable');
      return cached;
    })();
    pending=job;
    try{return await job;}finally{if(pending===job)pending=null;}
  }
  function start() {
    if(timer)return;
    const refresh=()=>void get(true).catch(()=>{});
    refresh();timer=setInterval(refresh,120000);
  }
  function stop(){if(timer)clearInterval(timer);timer=null;}
  function invalidate(){revision++;cached=null;pending=null;retryAt=0;loaded=true;}
  return {get,start,stop,invalidate};
}
export function startPlaybackIndex(root) {
  const folder=root || path.resolve(project,process.env.MUSIC_PREVIEW_DIR || '.local-tools/music/persistent-audio-dist');
  const service=createPlaybackIndexService(folder);service.start();return service.stop;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log=()=>{};console.error=()=>{};
  if(process.argv.includes('--watch'))startPlaybackIndex();
  else {
    try { const index=await updatePlaybackIndex();process.stdout.write(JSON.stringify(index.tracks.map(({id,status,previewSeconds})=>({id,status,previewSeconds})))+'\n'); }
    catch { process.stdout.write('网易云播放索引暂时无法更新，请稍后重试。\n');process.exitCode=1; }
  }
}
