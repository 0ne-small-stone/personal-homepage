import {lazy,Suspense,useEffect,useState} from 'react';
import type {RadioConfig} from './RadioExperience';
const NetEaseCoreExperience=lazy(()=>import('./NetEaseCoreExperience'));
export default function NetEaseMusicCatalog({config,onMode}:{config:RadioConfig;onMode:(mode:'cloud'|'netease')=>void}){
  const [service,setService]=useState<'checking'|'ready'|'unavailable'>('checking');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();let active=true;setService('checking');void fetch(`${import.meta.env.BASE_URL}api/music/playback/account`,{cache:'no-store',credentials:'omit',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(5000)])}).then(async response=>{if(!response.ok)throw Error('Unavailable');const state=await response.json();if(active)setService(state.available===true&&typeof state.authorized==='boolean'?'ready':'unavailable');}).catch(()=>{if(active&&!controller.signal.aborted)setService('unavailable');});return()=>{active=false;controller.abort();};},[attempt]);
  return <Suspense fallback={<p className="radio-hint" role="status">正在打开音乐库…</p>}><NetEaseCoreExperience config={config} onMode={onMode} service={service} onRetry={()=>setAttempt(value=>value+1)}/></Suspense>;
}
