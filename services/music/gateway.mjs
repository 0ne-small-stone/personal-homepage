import {createServer} from 'node:http';
import {createHash} from 'node:crypto';

const base='/personal-homepage';
const apiPrefix=`${base}/api/music/`;
const publicSite='https://0ne-small-stone.github.io';
const cookieName='__Host-echoes-music';
const actions=new Set(['browse','search','detail','lyrics','liked-ids','jobs','like','subscribe','create-playlist','edit-playlist','playlist-track','cloud-delete']);
const qualities=new Set(['standard','exhigh','lossless','hires']);

const clientErrors=new WeakSet();
function failure(status,message){const error=Object.assign(Error(message),{status});clientErrors.add(error);return error;}
function json(res,status,data){
  if(res.destroyed||res.writableEnded)return;
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Cookie'});
  res.end(JSON.stringify(data));
}
async function readInput(req){
  if(req.headers['content-type']?.split(';')[0].trim().toLowerCase()!=='application/json'||req.headers['content-encoding'])throw failure(400,'请求格式无效。');
  if(Number(req.headers['content-length'])>12288)throw failure(413,'请求过长。');
  let size=0;const parts=[];
  for await(const part of req){size+=part.length;if(size>12288)throw failure(413,'请求过长。');parts.push(part);}
  try{const value=JSON.parse(Buffer.concat(parts).toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}
  catch{throw failure(400,'请求格式无效。');}
}
function token(req){
  const pairs=(req.headers.cookie||'').split(';').map(part=>part.trim()).filter(part=>part.startsWith(cookieName+'='));
  if(pairs.length>1)throw failure(400,'会话Cookie无效。');
  return pairs[0]?.slice(cookieName.length+1)||'';
}
function setCookie(res,session,at){
  const remaining=Math.max(0,Math.floor((session.expiresAt-at)/1000));
  res.setHeader('Set-Cookie',`${cookieName}=${session.id}; Path=/; Max-Age=${remaining}; HttpOnly; Secure; SameSite=Lax`);
}
function rateLimiter(now){
  const rows=new Map();
  return(key,limit,ms)=>{
    const at=now();let row=rows.get(key);
    if(!row||row.until<=at){if(rows.size>=4096){for(const [name,item]of rows)if(item.until<=at)rows.delete(name);if(rows.size>=4096)throw failure(429,'服务繁忙，请稍后重试。');}row={until:at+ms,count:0};rows.set(key,row);}
    if(++row.count>limit)throw failure(429,'操作太频繁，请稍后重试。');
  };
}

/** Same-origin public music UI/API. No loopback files, arbitrary proxy or shared account. */
export function createOnlineMusic({origin,sessions,accountFactory,coreFactory,fetcher=fetch,now=Date.now,trustProxy=false,allowHttpForTests=false}){
  const published=new URL(origin);
  if(published.origin!==origin||published.username||published.password||(!allowHttpForTests&&published.protocol!=='https:')||!['http:','https:'].includes(published.protocol))throw Error('A canonical HTTPS origin is required.');
  if(typeof accountFactory!=='function'||typeof coreFactory!=='function')throw Error('Account factories are required.');
  const consume=rateLimiter(now),entries=new Map(),queues=new Map(),staticCache=new Map();let cacheBytes=0;
  function peer(req){
    const forwarded=trustProxy?String(req.headers['x-forwarded-for']||'').split(',').at(-1)?.trim():'';
    return createHash('sha256').update(forwarded||req.socket.remoteAddress||'unknown').digest('hex');
  }
  function drop(hash){const entry=entries.get(hash);entry?.account.dispose?.();entries.delete(hash);}
  function entryFor(session){
    for(const [hash,item]of entries)if(now()-item.used>300000)drop(hash);
    let entry=entries.get(session.hash);
    if(entry&&now()-entry.used>300000){drop(session.hash);entry=null;}
    if(!entry){
      while(entries.size>=100)drop(entries.keys().next().value);
      const account=accountFactory(sessions.credentialStore(session));
      entry={session,account,core:coreFactory(account),used:now()};entries.set(session.hash,entry);
    }
    entry.used=now();return entry;
  }
  async function serial(hash,operation){
    const previous=queues.get(hash)||{promise:Promise.resolve(),count:0};
    if(previous.count>=8)throw failure(429,'请求正在处理，请稍后重试。');
    const task={count:previous.count+1,promise:null};
    task.promise=previous.promise.catch(()=>{}).then(operation);queues.set(hash,task);
    try{return await task.promise;}finally{task.count--;if(queues.get(hash)===task)queues.delete(hash);}
  }
  async function staticPage(req,res,pathname){
    if(pathname===`${base}/music`){res.writeHead(302,{Location:`${base}/music/`});res.end();return;}
    if(pathname==='/'||pathname===base||pathname===base+'/'){
      res.writeHead(302,{Location:pathname==='/'?`${base}/music/?mode=netease`:`${publicSite}${base}/#radio`});res.end();return;
    }
    const html=pathname===`${base}/music/`;
    const asset=/^\/personal-homepage\/(?:_astro\/[A-Za-z0-9_.-]+|music\/(?!local-)[A-Za-z0-9_./-]+)\.(?:js|mjs|css|json|svg|webp|png|jpg|jpeg|avif|woff2?|ttf|txt)$/.test(pathname);
    if(!html&&!asset)throw failure(404,'页面不存在。');
    const cached=staticCache.get(pathname);let result=cached?.until>now()?cached:null;
    if(!result){
      const response=await fetcher(publicSite+pathname,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000)});
      if(!response.ok){await response.body?.cancel();throw failure(response.status===404?404:503,'页面资源暂时不可用，请刷新重试。');}
      const parts=[];let size=0;
      for await(const part of response.body){size+=part.length;if(size>8*1024*1024)throw failure(502,'页面资源超出限制。');parts.push(Buffer.from(part));}
      let bytes=Buffer.concat(parts);
      if(html)bytes=Buffer.from(bytes.toString('utf8').replace(/href="\/personal-homepage\/(?!music(?:[/?"]|$)|_astro\/)/g,`href="${publicSite}${base}/`));
      result={bytes,type:response.headers.get('content-type')||'application/octet-stream',until:now()+60000};
      if(cached){cacheBytes-=cached.bytes.length;staticCache.delete(pathname);}
      while(cacheBytes+bytes.length>20*1024*1024||staticCache.size>=256){const first=staticCache.keys().next().value;if(first===undefined)break;cacheBytes-=staticCache.get(first).bytes.length;staticCache.delete(first);}
      staticCache.set(pathname,result);cacheBytes+=bytes.length;
    }
    res.writeHead(200,{'Content-Type':result.type,'Content-Length':result.bytes.length,'Cache-Control':html?'no-store':pathname.startsWith(`${base}/_astro/`)?'public, max-age=31536000, immutable':'public, max-age=300'});
    res.end(req.method==='HEAD'?undefined:result.bytes);
  }
  const server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    try{
      if(req.url==='/healthz'&&['GET','HEAD'].includes(req.method)){await sessions.ready();json(res,200,{ok:true,service:'echoes-music'});return;}
      if(req.headers.host!==published.host)throw failure(403,'请从电台正式地址访问。');
      if(/[\\\x00-\x1f]/.test(req.url)||/%(?:2e|2f|5c|00)/i.test(req.url))throw failure(400,'地址无效。');
      const pathname=new URL(req.url,origin).pathname;
      if(!pathname.startsWith(apiPrefix)){
        if(!['GET','HEAD'].includes(req.method))throw failure(405,'只支持读取。');
        consume('static:'+peer(req),600,60000);await staticPage(req,res,pathname);return;
      }
      if(req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&req.headers.origin!==origin)throw failure(403,'请在当前电台页面操作。');
      if(req.method==='POST'&&req.headers.origin!==origin)throw failure(403,'请在当前电台页面操作。');
      const route=pathname.slice(apiPrefix.length);
      if(req.method==='GET'&&route!=='playback/account'||!['GET','POST'].includes(req.method))throw failure(405,'请求方式无效。');
      if(route==='netease-upload'||route.startsWith('lx/'))throw failure(501,'在线电台暂不提供文件传输，请使用本机下载页面。');
      consume('api:'+peer(req),240,60000);
      const input=req.method==='POST'?await readInput(req):{};
      let session=await sessions.lookup(token(req));
      if(!session){
        if(req.method!=='GET'||route!=='playback/account')throw failure(401,'会话已失效，请刷新页面后重新登录。');
        consume('new:'+peer(req),10,60000);consume('new:global',100,60000);consume('new:daily',500,86400000);
        session=await sessions.create();setCookie(res,session,now());
      }
      await serial(session.hash,async()=>{
        if(!await sessions.lookup(session.id))throw failure(401,'会话已失效，请刷新页面。');
        const entry=entryFor(session),account=entry.account;
        await account.ready();
        const state=()=>({...account.state(),local:false});
        try{
        if(route==='playback/account'&&req.method==='GET'){json(res,200,state());return;}
        if(req.method!=='POST')throw failure(405,'请求方式无效。');
        if(route==='playback/qr'){consume('qr:'+session.hash,4,60000);consume('qr-ip:'+peer(req),8,60000);consume('qr-global',30,60000);json(res,200,await account.createQr());return;}
        if(route==='playback/qr-check'){
          consume('check:'+session.hash,40,60000);const result=await account.checkQr();
          if(result.code===803){
            const before=entry.session.hash;await sessions.rotate(entry.session);entries.delete(before);entries.set(entry.session.hash,entry);setCookie(res,entry.session,now());
          }
          json(res,200,{...result,local:false});return;
        }
        if(route==='playback/cancel'){account.cancel();json(res,200,{ok:true});return;}
        if(route==='playback/logout'){
          await sessions.revoke(entry.session);drop(entry.session.hash);
          const fresh=await sessions.create();setCookie(res,fresh,now());json(res,200,{available:true,local:false,authorized:false,account:null,saved:false});return;
        }
        if(route==='playback/remember'||route==='playback/restore'){
          if(route.endsWith('remember'))await account.remember();else await account.retryRestore();json(res,200,state());return;
        }
        if(route==='playback/resolve'){
          consume('resolve:'+session.hash,30,60000);
          if(typeof input.id!=='string'||!(/^[1-9]\d{0,19}$/).test(input.id)||input.quality!==undefined&&!qualities.has(input.quality))throw failure(400,'歌曲或音质无效。');
          await account.prepare?.();json(res,200,await account.resolveTrack(input.id,input.quality||'standard'));return;
        }
        if(route==='netease'){
          if(['download','cancel-download'].includes(input.action))throw failure(501,'在线电台暂不提供文件下载，请使用本机下载页面。');
          if(!actions.has(input.action))throw failure(400,'功能入口无效。');
          json(res,200,await entry.core.handle(input));return;
        }
        throw failure(404,'功能入口不存在。');
        }catch(error){
          if(error.auth)await account.logout().catch(()=>{});
          throw error;
        }
      });
    }catch(error){const trusted=clientErrors.has(error);json(res,error.auth?401:trusted?error.status:503,{error:error.auth?'网易云登录已失效，请重新扫码。':trusted?error.message:'服务暂时不可用，请稍后重试。'});}
  });
  server.headersTimeout=15000;server.requestTimeout=30000;server.maxHeadersCount=60;
  server.on('close',()=>{for(const hash of entries.keys())drop(hash);staticCache.clear();});
  return server;
}
