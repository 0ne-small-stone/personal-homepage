import { readdir, readFile, mkdir, writeFile, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseFile } from 'music-metadata';

const args = process.argv.slice(2);
function option(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }
const watching = args.includes('--watch');
const output = path.resolve(option('--output') || '.local-tools/music/catalog.json');
let directory = option('--directory');
if (args.includes('--auto-lx')) {
  if (!process.env.APPDATA) throw new Error('--auto-lx 目前只支持 Windows；其他系统使用 --directory');
  const config = JSON.parse(await readFile(path.join(process.env.APPDATA, 'lx-music-desktop/LxDatas/config_v2.json'), 'utf8'));
  directory ||= config.setting?.['download.savePath'];
}
if (!directory) throw new Error('请使用 --directory 指定下载目录，或使用 --auto-lx 只读洛雪配置。');
directory = path.resolve(directory);
const share = option('--share-url');
const shareUrl = share ? new URL(share) : null;
if (shareUrl && (shareUrl.protocol !== 'https:' || !/^\/s\/[a-zA-Z0-9]+\/?$/.test(shareUrl.pathname) || shareUrl.username || shareUrl.password)) throw new Error('请提供 HTTPS 的 Nextcloud 文件夹公开分享链接 /s/token');
const mirror = option('--mirror');
const extensions = new Set(['.flac', '.mp3', '.m4a', '.ogg', '.opus', '.wav', '.aac', '.aiff']);
const fingerprint = new Map();
const cached = new Map();
let lastSignature = '';
const id = text => createHash('sha256').update(text).digest('hex').slice(0, 24);
let stopped = false;
process.on('SIGINT', () => { stopped = true; });
process.on('SIGTERM', () => { stopped = true; });

async function filesIn(folder) {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) files.push(...await filesIn(file));
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) files.push(file);
  }
  return files.sort();
}

function audioUrl(relative) {
  if (!shareUrl) return null;
  const url = new URL(`${shareUrl.pathname.replace(/\/$/, '')}/download`, shareUrl.origin);
  const parts = relative.split('/');
  url.searchParams.set('path', `/${parts.slice(0, -1).join('/')}`);
  url.searchParams.set('files', parts.at(-1));
  return url.href;
}

async function atomicWrite(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, data, 'utf8');
  await rename(temporary, file);
}

async function scan() {
  const files = await filesIn(directory);
  const tracks = [];
  for (const file of files) {
    const info = await stat(file);
    const signature = `${info.size}:${info.mtimeMs}`;
    const previous = fingerprint.get(file);
    fingerprint.set(file, signature);
    // Wait for two unchanged observations; stability is not a download completion guarantee.
    if (watching && previous !== signature) {
      if (cached.has(file)) tracks.push(cached.get(file).track);
      continue;
    }
    const existing = cached.get(file);
    if (existing?.signature === signature) { tracks.push(existing.track); continue; }
    try {
      const { common, format } = await parseFile(file, { duration: true, skipCovers: true });
      const after = await stat(file);
      if (after.size !== info.size || after.mtimeMs !== info.mtimeMs || !format.duration || format.duration <= 0) continue;
      const relative = path.relative(directory, file).split(path.sep).join('/');
      const track = {
        id: id(relative), title: common.title || path.basename(file, path.extname(file)),
        artist: common.artist || '未知歌手', album: common.album || '未标注专辑',
        albumArtist: common.albumartist || common.artist || '未知歌手',
        trackNumber: common.track.no || 0, discNumber: common.disk.no || 0,
        duration: format.duration, format: path.extname(file).slice(1),
        sampleRate: format.sampleRate || 0, bitsPerSample: format.bitsPerSample || 0,
        audioUrl: audioUrl(relative),
      };
      cached.set(file, { signature, track });
      tracks.push(track);
    } catch {
      console.warn('一个音频文件未完成或无法解析，已跳过。');
      if (existing) tracks.push(existing.track);
    }
  }
  for (const file of cached.keys()) if (!files.includes(file)) { cached.delete(file); fingerprint.delete(file); }
  tracks.sort((a, b) => a.albumArtist.localeCompare(b.albumArtist, 'zh-CN') || a.album.localeCompare(b.album, 'zh-CN') || a.discNumber - b.discNumber || a.trackNumber - b.trackNumber || a.title.localeCompare(b.title, 'zh-CN'));
  const signature = JSON.stringify(tracks);
  // Do not replace a previously generated catalog while the initial watcher observations are pending.
  if (watching && files.length && !tracks.length && !lastSignature) return;
  if (signature === lastSignature) return;
  const catalog = JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), tracks }, null, 2) + '\n';
  await atomicWrite(output, catalog);
  if (mirror) await atomicWrite(path.resolve(mirror), catalog);
  lastSignature = signature;
  console.log(`已更新 ${tracks.length} 首真实曲目；${shareUrl ? '已生成云盘分享地址，仍需验证上传和播放' : '尚未连接云盘分享，曲目仅展示信息'}。`);
}

do {
  try { await scan(); } catch (error) {
    if (!watching) throw error;
    console.error('扫描失败，保留上次目录；稍后重试。');
  }
  if (!watching || stopped) break;
  await new Promise(resolve => setTimeout(resolve, 5000));
} while (!stopped);
