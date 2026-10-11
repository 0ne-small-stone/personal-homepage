import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed=new Set(['index.html','review.css','review.js','images/a-still.png','images/b-echo.png','images/c-refraction.png','images/d-interval.png','images/e-signature.png']);
const mime={html:'text/html; charset=utf-8',css:'text/css',js:'text/javascript',png:'image/png'};
createServer(async(req,res)=>{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}const file=new URL(req.url,'http://127.0.0.1').pathname.slice(1)||'index.html';if(!allowed.has(file)){res.writeHead(404);res.end('Not found');return;}try{const data=await readFile(new URL(file,import.meta.url));res.writeHead(200,{'Content-Type':mime[file.split('.').pop()],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(503);res.end('Asset unavailable');}}).listen(4326,'127.0.0.1',()=>console.log('LSSH AI logo review: http://127.0.0.1:4326/'));

