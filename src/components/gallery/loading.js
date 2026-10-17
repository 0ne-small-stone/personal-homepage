// Loading ownership for the independent gallery. No renderer or animation loop.
export async function waitForOverview(host,{signal,onProgress,timeoutMs=8000}={}){
 const images=[...new Map([...host.querySelectorAll('.item[data-src]')].map(node=>[node.dataset.src,node.querySelector('img')])).values()].filter(Boolean);
 let finished=0,loaded=0;
 return Promise.all(images.map(image=>new Promise(resolve=>{
  let timer,done=false;
  const finish=ok=>{if(done)return;done=true;clearTimeout(timer);image.removeEventListener('load',load);image.removeEventListener('error',error);signal?.removeEventListener('abort',error);finished++;if(ok)loaded++;onProgress?.(finished,images.length);resolve(ok);};
  const load=()=>finish(image.naturalWidth>0),error=()=>finish(false);
  if(signal?.aborted)return finish(false);
  if(image.complete)return finish(image.naturalWidth>0);
  image.addEventListener('load',load);image.addEventListener('error',error);signal?.addEventListener('abort',error,{once:true});timer=setTimeout(error,timeoutMs);
 }))).then(()=>({total:images.length,loaded,missing:images.length-loaded}));
}

export async function loadSpaceImages(photos,{signal,onProgress,concurrency=4,timeoutMs=20000,ImageClass=globalThis.Image}={}){
 const images=new Array(photos.length);let cursor=0,settled=0;
 const aborted=()=>signal?.reason??new DOMException('Gallery unloaded','AbortError');
 async function load(src){return new Promise((resolve,reject)=>{
  const image=new ImageClass();let timer,done=false;
  const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;signal?.removeEventListener('abort',cancel);if(error){image.src='';reject(error);}else resolve(value);};
  const cancel=()=>finish(null,aborted());
  if(signal?.aborted)return cancel();
  image.decoding='async';image.crossOrigin='anonymous';image.onload=()=>finish(image);image.onerror=()=>finish(null);signal?.addEventListener('abort',cancel,{once:true});timer=setTimeout(()=>{image.src='';finish(null);},timeoutMs);image.src=src;
 });}
 async function worker(){while(cursor<photos.length){if(signal?.aborted)throw aborted();const index=cursor++;images[index]=await load(photos[index].image);onProgress?.(++settled,photos.length);}}
 const workers=await Promise.allSettled(Array.from({length:Math.min(concurrency,photos.length)},worker));
 if(signal?.aborted){for(const image of images)if(image)image.src='';throw aborted();}
 const failure=workers.find(item=>item.status==='rejected');if(failure)throw failure.reason;return images;
}
