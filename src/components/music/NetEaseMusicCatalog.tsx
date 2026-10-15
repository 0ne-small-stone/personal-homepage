import {lazy,Suspense,useEffect,useState} from 'react';
import SharedPlaylistCatalog from './SharedPlaylistCatalog';
import type {RadioConfig} from './RadioExperience';
const NetEaseCoreExperience=lazy(()=>import('./NetEaseCoreExperience'));
export default function NetEaseMusicCatalog({config,onMode}:{config:RadioConfig;onMode:(mode:'cloud'|'netease')=>void}){
  const [service,setService]=useState<'checking'|'ready'|'unavailable'>('checking');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();let active=true;setService('checking');void fetch(`${import.meta.env.BASE_URL}api/music/playback/account`,{cache:'no-store',credentials:'omit',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(5000)])}).then(async response=>{if(!response.ok)throw Error('Unavailable');const state=await response.json();if(active)setService(state.available===true&&typeof state.authorized==='boolean'?'ready':'unavailable');}).catch(()=>{if(active&&!controller.signal.aborted)setService('unavailable');});return()=>{active=false;controller.abort();};},[attempt]);
  if(service==='ready')return <Suspense fallback={<p className="radio-hint" role="status">正在打开音乐库…</p>}><NetEaseCoreExperience config={config} onMode={onMode}/></Suspense>;
  return <><p className="radio-hint" role="status">{service==='checking'?'正在检查在线音乐服务，当前显示共享歌单。':'在线音乐服务尚未接通，当前显示共享歌单快照。搜索、订阅与账号操作需要可用的音乐服务。'} <button type="button" className="radio-refresh" disabled={service==='checking'} onClick={()=>setAttempt(value=>value+1)}>重试连接</button></p><SharedPlaylistCatalog config={config} onMode={onMode}/></>;
}
