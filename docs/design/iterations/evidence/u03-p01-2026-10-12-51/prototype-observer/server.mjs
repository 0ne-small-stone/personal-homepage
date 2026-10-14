import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('.ci-tmp/optics-engine');
const routes = new Map([['/', ['index.html','text/html; charset=utf-8']], ['/bundle.js',['bundle.js','text/javascript; charset=utf-8']], ['/white/', ['white.html','text/html; charset=utf-8']], ['/white/white-bundle.js',['white-bundle.js','text/javascript; charset=utf-8']]]);
http.createServer(async (request, response) => {
  const route = routes.get(new URL(request.url, 'http://127.0.0.1:4339').pathname);
  if (!route) { response.writeHead(404); response.end(); return; }
  try { response.writeHead(200, {'Content-Type': route[1], 'Cache-Control':'no-store'}); response.end(await fs.readFile(path.join(root, route[0]))); }
  catch { response.writeHead(500); response.end('Local sample unavailable'); }
}).listen(4339, '127.0.0.1');
