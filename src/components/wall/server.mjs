import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {giscusConfig} from '../../../../../../src/config/giscus.ts';
const returnCandidate=process.argv.includes('--return-candidate'),port=returnCandidate?4363:4360;
const root=fileURLToPath(new URL('../../../../../../.local-tools/wall-prototype/'+(returnCandidate?'return-site/':'site/'),import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const url=new URL(req.url,'http://localhost'),requested=decodeURIComponent(url.pathname);
    if(['/api/discussions/categories','/api/discussions'].includes(requested)){
      const query=new URLSearchParams({repo:giscusConfig.repo});
      if(requested==='/api/discussions'){
        query.set('term',giscusConfig.term);query.set('strict','true');query.set('first','100');
        const category=giscusConfig.category||url.searchParams.get('category')||'Announcements';
        const after=url.searchParams.get('after');
        if(category.length>100||after?.length>512){res.writeHead(400);res.end();return;}
        query.set('category',category);if(after)query.set('after',after);
      }
      try{
        const upstream=await fetch('https://giscus.app'+requested+'?'+query,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});
        const body=await upstream.text();
        if(body.length>8*1024*1024)throw Error('oversized');
        JSON.parse(body);
        res.writeHead(upstream.status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
        res.end(req.method==='HEAD'?undefined:body);
      }catch{
        res.writeHead(502,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Public guestbook is temporarily unavailable'}));
      }
      return;
    }
    const target=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
    const relative=path.relative(root,target);
    if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end();return;}
    const data=await fs.readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log('The Wall: http://127.0.0.1:'+port+'/'));
