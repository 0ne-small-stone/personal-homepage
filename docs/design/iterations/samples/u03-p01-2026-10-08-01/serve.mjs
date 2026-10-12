import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const allowed = new Set(['index.html','review.css','review.js','fonts/instrument-sans.ttf','fonts/OFL.txt',...['a-still','b-echo','c-through','d-threshold','e-lssh'].map(name => `marks/${name}.svg`)]);
const mime = { html:'text/html',css:'text/css',js:'text/javascript',ttf:'font/ttf',svg:'image/svg+xml',txt:'text/plain' };
const port = Number(process.env.PORT || 4325);
createServer(async (req,res) => {
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  const file = new URL(req.url,'http://127.0.0.1').pathname.slice(1) || 'index.html';
  if (!allowed.has(file)) {res.writeHead(404);res.end('Not found');return;}
  try {const data=await readFile(new URL(file,import.meta.url));res.writeHead(200,{'Content-Type':mime[file.split('.').pop()],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);}
  catch {res.writeHead(503);res.end('Logo review assets unavailable');}
}).listen(port,'127.0.0.1',()=>console.log(`LSSH logo review: http://127.0.0.1:${port}/`));
