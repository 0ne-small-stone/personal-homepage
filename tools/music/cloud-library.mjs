import { copyFile, mkdir, readFile, realpath, rename, stat, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { parseMusicCatalog } from '../../src/lib/music.ts';
import { completedWebFiles } from './lx-downloads.mjs';

const origin = 'https://pan.koala-studio.org.cn';
const configFile = '.local-tools/music/cloud-library-config.json';
const idPattern = /^[a-f0-9]{24}$/;
const formats = new Set(['flac', 'mp3', 'm4a', 'ogg', 'opus', 'wav', 'aac', 'aiff']);
const verifiedCache = new Map();

export function cloudBase(shareUrl) {
  const url = new URL(shareUrl);
  if (url.origin !== origin || url.username || url.password || url.search || url.hash || !/^\/s\/[a-zA-Z0-9]+\/?$/.test(url.pathname)) throw new Error('需要考拉的公开音乐文件夹分享链接。');
  return `${origin}/public.php/dav/files/${url.pathname.split('/')[2]}/`;
}

export async function readCloudConfig(file = configFile) {
  let text;
  try { text = await readFile(file, 'utf8'); } catch (error) {
    if (file !== configFile || error.code !== 'ENOENT') throw error;
    text = await readFile('src/config/music-cloud.json', 'utf8');
  }
  const config = JSON.parse(text);
  if (config.version !== 1) throw new Error('云盘配置版本不支持。');
  return { ...config, base: cloudBase(config.shareUrl) };
}

async function atomicWrite(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.tmp`, value);
  await rename(`${file}.tmp`, file);
}

export async function boundedBody(response, limit) {
  const chunks = [];
  let length = 0;
  try {
    for await (const chunk of response.body) {
      length += chunk.length;
      if (length > limit) throw new Error('云端文件超过大小限制。');
      chunks.push(Buffer.from(chunk));
    }
  } catch (error) { await response.body?.cancel().catch(() => {});throw error; }
  return Buffer.concat(chunks);
}

export function completedDownloads() {
  if (!process.env.APPDATA) return new Set();
  let db;
  try {
    db = new DatabaseSync(path.join(process.env.APPDATA, 'lx-music-desktop/LxDatas/lx.data.db'), { readOnly: true });
    // These are the only fields read. No music URLs, user APIs or account data.
    return new Set(db.prepare("SELECT filePath FROM download_list WHERE isComplate=1 AND status='completed'").all()
      .filter(row => typeof row.filePath === 'string').map(row => path.resolve(row.filePath).toLowerCase()));
  } catch { return new Set(); } finally { db?.close(); }
}

export async function stageTrack(entry, track, root, destination) {
  if (!idPattern.test(entry.id) || entry.id !== track.id || !formats.has(track.format)) throw new Error('曲目映射不完整。');
  const source = await realpath(path.resolve(root, entry.relative));
  const relative = path.relative(root, source);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('音频超出下载目录。');
  const before = await stat(source);
  if (!before.isFile() || before.size !== entry.size || before.mtimeMs !== entry.mtimeMs) return null;
  const name = `tracks/${entry.id}.${track.format}`;
  const target = path.join(destination, name);
  let current;
  try { current = await stat(target); } catch { /* First staging. */ }
  if (!current || current.size !== before.size || Math.abs(current.mtimeMs - before.mtimeMs) > 2) {
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.tmp`;
    await copyFile(source, temporary);
    const after = await stat(source);
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs) return null;
    await utimes(temporary, before.atime, before.mtime);
    await rename(temporary, target);
  }
  return { name, size: before.size, modified: Math.floor(before.mtimeMs / 1000) };
}

export async function verifyRemoteFile(url, expected, request = fetch) {
    const response = await request(url, { method: expected.sha256 ? 'GET' : 'HEAD', redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (response.status === 429 || response.status >= 500) throw new Error('云盘暂时限流或不可用，请稍后重试。');
    if (expected.sha256) {
      if (!response.ok || expected.size > 2 * 1024 * 1024) { await response.body?.cancel();return false; }
      const data = await boundedBody(response, 2 * 1024 * 1024);
      return data.byteLength === expected.size && createHash('sha256').update(data).digest('hex') === expected.sha256;
    }
    return response.ok && Number(response.headers.get('content-length')) === expected.size &&
      Math.floor(Date.parse(response.headers.get('last-modified') || '') / 1000) === expected.modified;
}

async function verifiedRemote(url, expected, request) {
  const key = `${url}:${expected.size}:${expected.sha256 || expected.modified}`;
  const cached = request === fetch ? verifiedCache.get(key) : null;
  if (cached && Date.now() < cached.expires) return cached.verified;
  const verified = await verifyRemoteFile(url, expected, request);
  if (request === fetch) verifiedCache.set(key, { verified, expires: Date.now() + (verified ? 300000 : 60000) });
  return verified;
}

/** No credentials: only publishes files already readable through the public share. */
export async function syncCloudLibrary({ directory = '.local-tools/music/cloud-library', configPath = configFile, mapPath = '.local-tools/music/audio-map.json', catalogPath = '.local-tools/music/catalog.json', request = fetch, completedFiles, uploader } = {}) {
  const config = await readCloudConfig(configPath);
  const map = JSON.parse(await readFile(mapPath, 'utf8'));
  const local = parseMusicCatalog(JSON.parse(await readFile(catalogPath, 'utf8')));
  if (map.version !== 1 || !Array.isArray(map.files)) throw new Error('私有索引不完整。');
  const root = await realpath(map.directory);
  const completed = completedFiles || completedDownloads();
  if (!completedFiles) for (const entry of await completedWebFiles()) completed.add(entry.file.toLowerCase());
  const initialImport = new Map((config.initialImportFiles || []).filter(file => idPattern.test(file.id))
    .map(file => [file.id, `${file.size}:${file.mtimeMs}`]));
  const destination = path.resolve(directory);
  if (destination === root || destination.startsWith(`${root}${path.sep}`)) throw new Error('同步暂存区不能位于洛雪下载目录内。');
  await mkdir(destination, { recursive: true });
  const file = path.join(destination, 'catalog.json');
  let previous;
  try { previous = parseMusicCatalog(JSON.parse(await readFile(file, 'utf8'))); } catch {}
  const verified = [];
  for (const track of local.tracks) {
    const entry = map.files.find(file => file.id === track.id);
    if (!entry) continue;
    if (initialImport.get(track.id) !== `${entry.size}:${entry.mtimeMs}` && !completed.has(path.resolve(root, entry.relative).toLowerCase())) continue;
    const staged = await stageTrack(entry, track, root, destination);
    if (!staged) continue;
    let audioUrl = new URL(staged.name, config.base).href;
    const priorUrl = previous?.tracks.find(item => item.id === track.id)?.audioUrl;
    const versionPrefix = `${config.base}LSSH-AutoSync/tracks/${track.id}-${staged.modified}-`;
    if (priorUrl?.startsWith(versionPrefix) && new RegExp(`^[a-f0-9]{64}\\.${track.format}$`).test(priorUrl.slice(versionPrefix.length))) audioUrl = priorUrl;
    if (!await verifiedRemote(audioUrl, staged, request)) {
      if (!uploader) continue;
      audioUrl = await uploader.ensureFile(path.join(destination, staged.name), 'tracks', staged);
    }
    let coverUrl = null;
    if (config.publishCovers === true && entry.cover === true) {
      const source = path.join(path.dirname(mapPath), 'covers', `${track.id}.webp`);
      try {
        const info = await stat(source);
        const coverName = `covers/${track.id}.webp`;
        const target = path.join(destination, coverName);
        let existing;
        try { existing = await stat(target); } catch {}
        if (!existing || existing.size !== info.size || Math.abs(existing.mtimeMs - info.mtimeMs) > 2) {
          await mkdir(path.dirname(target), { recursive: true });
          await copyFile(source, `${target}.tmp`);await utimes(`${target}.tmp`, info.atime, info.mtime);await rename(`${target}.tmp`, target);
        }
        const url = new URL(coverName, config.base).href;
        const sha256 = createHash('sha256').update(await readFile(source)).digest('hex');
        if (await verifiedRemote(url, { size: info.size, sha256 }, request)) coverUrl = url;
        else if (uploader) coverUrl = await uploader.ensureFile(target, 'covers', { size: info.size, sha256 });
      } catch (error) { if (uploader) throw error; /* Artwork is optional in read-only mode. */ }
    }
    verified.push({ ...track, audioUrl, coverUrl });
  }
  if (JSON.stringify(previous?.tracks) !== JSON.stringify(verified)) {
    await atomicWrite(file, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), tracks: verified }, null, 2) + '\n');
  }
  if (uploader) await uploader.publishCatalog(file);
  return { indexed: local.tracks.length, verified: verified.length, pending: local.tracks.length - verified.length };
}

export function snapshotUrls(xml, base) {
  if (xml.length > 2 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('云端目录列表不合法。');
  const prefix = `${base}LSSH-AutoSync/catalogs/`;
  return [...xml.matchAll(/<(?:[A-Za-z0-9_-]+:)?href>([^<]+)<\/(?:[A-Za-z0-9_-]+:)?href>/g)]
    .map(match => new URL(match[1].replaceAll('&amp;', '&'), base).href)
    .filter(url => url.startsWith(prefix) && /^\d{13}-[a-f0-9]{64}\.json$/.test(url.slice(prefix.length)))
    .sort().reverse();
}
let remoteCache = { base: '', at: 0, catalog: null };
export async function loadCloudCatalog({ request = fetch, configPath = configFile, useCache = true } = {}) {
  try {
    const config = await readCloudConfig(configPath);
    if (useCache && remoteCache.base === config.base && Date.now() - remoteCache.at < 10000) return remoteCache.catalog;
    let urls = [];
    // A blocked WebDAV listing must not prevent the public GET fallback.
    try {
      const list = await request(new URL('LSSH-AutoSync/catalogs/', config.base), { method: 'PROPFIND', headers: { Depth: '1', 'X-Requested-With': 'XMLHttpRequest' }, redirect: 'error', signal: AbortSignal.timeout(8000) });
      if (list.status === 207) urls = snapshotUrls((await boundedBody(list, 2 * 1024 * 1024)).toString('utf8'), config.base).slice(0, 3);
      else await list.body?.cancel();
    } catch { /* Try the public catalog before the versioned build fallback. */ }
    urls.push(new URL('catalog.json', config.base).href);
    let catalog = null;
    for (const url of urls) {
    const response = await request(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (response.ok && Number(response.headers.get('content-length') || 0) <= 1024 * 1024) {
      const text = (await boundedBody(response, 1024 * 1024)).toString('utf8');
      if (text.length <= 1024 * 1024) {
        const hash = /-(\w{64})\.json$/.exec(url)?.[1];
        if (hash && createHash('sha256').update(text).digest('hex') !== hash) continue;
        const parsed = parseMusicCatalog(JSON.parse(text));
        const permitted = (value, folder) => [config.base, `${config.base}LSSH-AutoSync/`].some(base => value.startsWith(`${base}${folder}/`) && /^[a-zA-Z0-9.-]+$/.test(value.slice(`${base}${folder}/`.length)));
        if (parsed.tracks.every(track => track.audioUrl && permitted(track.audioUrl, 'tracks') && (!track.coverUrl || permitted(track.coverUrl, 'covers')))) catalog = parsed;
      }
    }
    if (catalog) break;
    }
    remoteCache = { base: config.base, at: Date.now(), catalog };
    return catalog;
  } catch { return remoteCache.catalog; }
}
