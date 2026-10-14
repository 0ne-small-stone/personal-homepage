import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

const mimeTypes = new Map([
  ['.flac', 'audio/flac'], ['.mp3', 'audio/mpeg'], ['.m4a', 'audio/mp4'],
  ['.ogg', 'audio/ogg'], ['.opus', 'audio/ogg'], ['.wav', 'audio/wav'],
  ['.aac', 'audio/aac'], ['.aiff', 'audio/aiff'],
]);
const defaultManifest = '.local-tools/music/audio-map.json';
const trackId = /^[a-f0-9]{24}$/;
const loopback = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

async function loadManifest(file) {
  const data = JSON.parse(await readFile(file, 'utf8'));
  if (data.version !== 1 || typeof data.directory !== 'string' || !Array.isArray(data.files)) throw new Error('Invalid local music map');
  return { directory: data.directory, files: data.files.filter(item =>
    trackId.test(item.id) && typeof item.relative === 'string' &&
    Number.isSafeInteger(item.size) && item.size > 0 && Number.isFinite(item.mtimeMs)) };
}

export async function localAudioUrls(catalog, base, manifestFile = defaultManifest) {
  try {
    const manifest = await loadManifest(manifestFile);
    const ids = new Set(manifest.files.map(file => file.id));
    const prefix = `${base.replace(/\/$/, '')}/music/local-audio/`;
    const covers = new Set(manifest.files.filter(file => file.cover === true).map(file => file.id));
    const coverPrefix = `${base.replace(/\/$/, '')}/music/local-cover/`;
    return { ...catalog, tracks: catalog.tracks.map(track => ({ ...track,
      audioUrl: track.audioUrl || (ids.has(track.id) ? `${prefix}${track.id}/` : null),
      coverUrl: track.coverUrl || (covers.has(track.id) ? `${coverPrefix}${track.id}/` : null),
    })) };
  } catch { return catalog; }
}

function allowedRequest(req) {
  if (!loopback.has(req.socket.remoteAddress)) return false;
  try {
    const target = new URL(`http://${req.headers.host}`);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) return false;
    if (req.headers.origin && new URL(req.headers.origin).origin !== target.origin) return false;
    return req.headers['sec-fetch-site'] !== 'cross-site';
  } catch { return false; }
}

export function byteRange(header, size) {
  if (!header) return { start: 0, end: size - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const suffix = !match[1];
  const first = Number(suffix ? match[2] : match[1]);
  const last = match[2] && !suffix ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || (suffix && first <= 0)) return null;
  const start = suffix ? Math.max(0, size - first) : first;
  const end = suffix ? size - 1 : Math.min(last, size - 1);
  return start >= size || start > end ? null : { start, end, partial: true };
}

/** Only installed on the local Vite development server; never in a static build. */
export function localAudioMiddleware({ base, manifestFile = defaultManifest }) {
  const prefix = `${base.replace(/\/$/, '')}/music/local-audio/`;
  const coverPrefix = `${base.replace(/\/$/, '')}/music/local-cover/`;
  return async (req, res, next) => {
    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; } catch { return next(); }
    const coverRequest = pathname.startsWith(coverPrefix);
    if (!coverRequest && !pathname.startsWith(prefix)) return next();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!allowedRequest(req)) { res.statusCode = 403; res.end(); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; res.setHeader('Allow', 'GET, HEAD'); res.end(); return; }
    const id = pathname.endsWith('/') ? pathname.slice((coverRequest ? coverPrefix : prefix).length, -1) : '';
    if (!trackId.test(id)) { res.statusCode = 404; res.end(); return; }
    try {
      const manifest = await loadManifest(manifestFile);
      const entry = manifest.files.find(file => file.id === id);
      if (!entry) { res.statusCode = 404; res.end(); return; }
      if (coverRequest) {
        if (entry.cover !== true) { res.statusCode = 404; res.end(); return; }
        const coverRoot = await realpath(path.join(path.dirname(manifestFile), 'covers'));
        const coverFile = await realpath(path.join(coverRoot, `${id}.webp`));
        if (path.relative(coverRoot, coverFile) !== `${id}.webp`) { res.statusCode = 404; res.end(); return; }
        const coverInfo = await stat(coverFile);
        if (!coverInfo.isFile() || coverInfo.size > 2 * 1024 * 1024) { res.statusCode = 404; res.end(); return; }
        const image = await readFile(coverFile);
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Content-Length', image.length);
        res.statusCode = 200;res.end(req.method === 'HEAD' ? undefined : image);return;
      }
      const root = await realpath(manifest.directory);
      const file = await realpath(path.resolve(root, entry.relative));
      const relative = path.relative(root, file);
      const mime = mimeTypes.get(path.extname(file).toLowerCase());
      if (!relative || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative) || !mime) { res.statusCode = 404; res.end(); return; }
      const info = await stat(file);
      if (!info.isFile() || info.size !== entry.size || info.mtimeMs !== entry.mtimeMs) { res.statusCode = 409; res.end(); return; }
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', mime);
      const range = byteRange(req.headers.range, info.size);
      if (!range) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${info.size}`); res.end(); return; }
      res.statusCode = range.partial ? 206 : 200;
      if (range.partial) res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${info.size}`);
      res.setHeader('Content-Length', range.end - range.start + 1);
      if (req.method === 'HEAD') { res.end(); return; }
      const stream = createReadStream(file, { start: range.start, end: range.end });
      res.on('close', () => stream.destroy());
      stream.on('error', () => { if (!res.headersSent) { res.statusCode = 404; res.removeHeader('Content-Length'); res.end(); } else res.destroy(); });
      stream.pipe(res);
    } catch { res.statusCode = 404; res.end(); }
  };
}

export function localMusicPlayback() {
  return { name: 'lssh-local-music', hooks: {
    'astro:server:setup': ({ server }) => {
      // Astro's dev base middleware strips the site's base before this handler.
      // Public catalog URLs keep the base; the incoming route is relative to it.
      server.middlewares.use(localAudioMiddleware({ base: '/' }));
    },
  } };
}
