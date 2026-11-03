import {GISCUS_ORIGIN} from './guestbook-data.mjs';
import wallTheme from './giscus-theme.css?inline';
// Public, bundled CSS only. A data URL avoids a public iframe requesting loopback.
const wallThemeUrl='data:text/css;charset=utf-8,'+encodeURIComponent(wallTheme);
export function mountGiscus(host,config,{onStatus,onDiscussion}){
  const attributes={repo:config.repo,'repo-id':config.repoId,category:config.category,'category-id':config.categoryId,
    mapping:'specific',term:config.term,strict:'1','reactions-enabled':'0','emit-metadata':'1','input-position':'top',theme:'light',lang:'zh-CN',loading:'eager'};
  let timer,script,failed=false,themedFrame=null;
  const watch=()=>{clearTimeout(timer);onStatus('connecting');timer=setTimeout(()=>onStatus('timeout'),15000);};
  const loadScript=()=>{
    failed=false;script=document.createElement('script');script.src=GISCUS_ORIGIN+'/client.js';script.async=true;script.crossOrigin='anonymous';
    for(const [name,value]of Object.entries(attributes))script.setAttribute('data-'+name,value);
    script.onerror=()=>{failed=true;clearTimeout(timer);onStatus('error');};host.replaceChildren(script);
  };
  const receive=event=>{
    const iframe=host.querySelector('iframe');
    if(event.origin!==GISCUS_ORIGIN||event.source!==iframe?.contentWindow||!event.data||typeof event.data.giscus!=='object')return;
    const data=event.data.giscus;
    if(themedFrame!==iframe&&(data.discussion||data.resizeHeight||data.error)){
      themedFrame=iframe;
      // Official setConfig keeps the already loaded light stylesheet if this fails.
      iframe.contentWindow.postMessage({giscus:{setConfig:{theme:wallThemeUrl}}},GISCUS_ORIGIN);
    }
    if(data.error){clearTimeout(timer);onStatus(String(data.error).includes('Discussion not found')?'ready':'error');return;}
    if(data.discussion){clearTimeout(timer);onStatus('ready');onDiscussion(data.discussion);}
    else if(data.resizeHeight){clearTimeout(timer);onStatus('ready');}
  };
  window.addEventListener('message',receive);
  watch();loadScript();
  return {
    retry(){watch();const iframe=host.querySelector('iframe');if(iframe)iframe.src=iframe.src;else if(failed)loadScript();},
    dispose(){clearTimeout(timer);window.removeEventListener('message',receive);}
  };
}
