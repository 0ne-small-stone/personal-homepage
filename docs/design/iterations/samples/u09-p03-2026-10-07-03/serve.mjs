import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const origin = process.env.UPSTREAM || 'http://127.0.0.1:4322';
const port = Number(process.env.PORT || 4324);
const pagePath = '/personal-homepage/knowledge/';
const assets = { '/__lssh_design__/design.css': ['design.css', 'text/css'], '/__lssh_design__/design.js': ['design.js', 'text/javascript'] };
createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  const address = new URL(request.url, `http://127.0.0.1:${port}`);
  if (address.pathname === '/') { response.writeHead(302, { Location: pagePath + address.search }); response.end(); return; }
  try {
    const asset = assets[address.pathname];
    if (asset) {
      response.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8`, 'Cache-Control': 'no-store' });
      response.end(await readFile(new URL(asset[0], import.meta.url))); return;
    }
    // Read-only preview proxy. All upstream paths stay on the existing local server.
    const source = await fetch(origin + address.pathname + address.search);
    const type = source.headers.get('content-type') || 'application/octet-stream';
    let body;
    if (address.pathname === pagePath && source.ok && type.includes('text/html')) {
      body = (await source.text()).replace('</head>', '<link rel="stylesheet" href="/__lssh_design__/design.css"></head>')
        .replace('</body>', '<script src="/__lssh_design__/design.js" defer></script></body>');
    } else body = Buffer.from(await source.arrayBuffer());
    response.writeHead(source.status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('设计预览暂不可用。请先启动开发预览 4322；本服务不修改开发工程。');
  }
}).listen(port, '127.0.0.1', () => console.log(`LSSH reading design: http://127.0.0.1:${port}${pagePath}`));
