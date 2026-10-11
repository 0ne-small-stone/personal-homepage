import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const types = { 'index.html': 'text/html', 'sample.css': 'text/css', 'sample.js': 'text/javascript' };
const port = Number(process.env.PORT || 4323);
createServer(async (request, response) => {
  const path = new URL(request.url, `http://127.0.0.1:${port}`).pathname;
  const name = path === '/' ? 'index.html' : path.slice(1);
  if (!Object.hasOwn(types, name)) { response.writeHead(404); response.end(); return; }
  try {
    const content = await readFile(new URL(name, import.meta.url));
    response.writeHead(200, { 'Content-Type': `${types[name]}; charset=utf-8`, 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(500); response.end('Sample file unavailable.'); }
}).listen(port, '127.0.0.1', () => console.log(`Design sample: http://127.0.0.1:${port}/`));
