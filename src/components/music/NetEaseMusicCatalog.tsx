import {lazy,Suspense} from 'react';
import type {RadioConfig} from './RadioExperience';
import {useMusicAccount} from './useMusicAccount';
const NetEaseCoreExperience=lazy(()=>import('./NetEaseCoreExperience'));
export default function NetEaseMusicCatalog({config,onMode}:{config:RadioConfig;onMode:(mode:'cloud'|'netease')=>void}){
  const {service,refetch}=useMusicAccount(true);
  return <Suspense fallback={<p className="radio-hint" role="status">正在打开音乐库…</p>}><NetEaseCoreExperience config={config} onMode={onMode} service={service} onRetry={()=>void refetch()}/></Suspense>;
}
