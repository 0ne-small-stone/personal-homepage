import bodyParser from 'body-parser';
import send from 'send';
import { resolve } from 'node:path';

export function sendJson(res, status, data) {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

export function sameOrigin(req, origin, required = false) {
  return req.headers['sec-fetch-site'] !== 'cross-site' &&
    (req.headers.origin ? req.headers.origin === origin : !required);
}

const parsers = new Map();
function inputError(status) {
  return Object.assign(new Error(status === 413 ? '请求过长。' : '请求格式无效。'), { status });
}
export async function readJson(req, res, limit = 8192) {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') throw inputError(400);
  if (!parsers.has(limit)) parsers.set(limit, bodyParser.json({
    limit, strict: true, inflate: false,
    verify: (_req, _res, buffer) => { if (!buffer.length) throw inputError(400); },
  }));
  await new Promise((accept, reject) => parsers.get(limit)(req, res, error => error ? reject(inputError(error.status === 413 ? 413 : 400)) : accept()));
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw inputError(400);
  return req.body;
}

/** Public preview files only. Private audio keeps its indexed/fingerprint gate. */
export function sendStaticFile(req, res, root, pathname) {
  const immutable = /(?:^|\/)_astro\/[^/]+\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(pathname)
    || /(?:^|\/)music\/lyrics\/[a-f0-9]{24}\.json$/.test(pathname);
  res.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  return new Promise(accept => {
    const done = () => { res.off('finish', done); res.off('close', done); accept(); };
    res.once('finish', done); res.once('close', done);
    const fail = error => {
      if (res.destroyed || res.writableEnded) { done(); return; }
      if (res.headersSent) { res.destroy(); return; }
      res.setHeader('Cache-Control', 'no-store');
      res.removeHeader('Content-Length');
      res.statusCode = [400, 403, 404, 412, 416].includes(error.status) ? error.status : 404;
      if (error.headers?.['Content-Range']) res.setHeader('Content-Range', error.headers['Content-Range']);
      res.end();
    };
    const transfer = relative => {
      const encoded = relative.split('/').map(encodeURIComponent).join('/');
      const stream = send(req, encoded, { root: resolve(root), dotfiles: 'deny', etag: immutable, lastModified: immutable, cacheControl: false });
      stream.on('error', fail);
      // Preserve existing no-redirect directory reads, including the site's base.
      stream.on('directory', () => relative.endsWith('/') ? fail({ status: 404 }) : transfer(relative + '/'));
      stream.pipe(res);
    };
    transfer(pathname);
  });
}
