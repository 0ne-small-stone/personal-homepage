// Fixed public repository read bridge. No cookies, authentication or write proxy.
const BASE='/personal-homepage';
const routes=new Map([[BASE+'/api/discussions/categories','/api/discussions/categories'],[BASE+'/api/discussions','/api/discussions']]);
export function createPublicGuestbookRead(config,{fetcher=fetch,timeoutMs=10000,maxBytes=8*1024*1024}={}){
  return async(req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');const path=routes.get(url.pathname);if(!path)return false;
    const send=(status,body)=>{const text=JSON.stringify(body);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(text),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:text);};
    if(!['GET','HEAD'].includes(req.method)){send(405,{error:'Public guestbook is read only'});return true;}
    const host=req.headers.host||'';
    if(!/^127\.0\.0\.1:\d+$/.test(host)||(req.headers.origin&&req.headers.origin!==`http://${host}`)){send(403,{error:'Local preview only'});return true;}
    const query=new URLSearchParams({repo:config.repo});
    if(path==='/api/discussions'){
      const after=url.searchParams.get('after');if(after?.length>512){send(400,{error:'Invalid cursor'});return true;}
      query.set('term',config.term);query.set('strict','true');query.set('first','100');query.set('category',config.category);
      if(after)query.set('after',after);
    }
    try{
      const response=await fetcher('https://giscus.app'+path+'?'+query,{signal:AbortSignal.timeout(timeoutMs),redirect:'error',headers:{Accept:'application/json'}});
      const text=await response.text();if(Buffer.byteLength(text)>maxBytes)throw Error('oversized');
      send(response.status,JSON.parse(text));
    }catch{send(502,{error:'Public guestbook is temporarily unavailable'});}
    return true;
  };
}
