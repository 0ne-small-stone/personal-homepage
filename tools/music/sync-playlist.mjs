import { mkdir, writeFile, rename } from 'node:fs/promises';
import api from '@neteasecloudmusicapienhanced/api';

// Public metadata only; independent of audio playback and playlist writes.
const url = 'https://music.163.com/api/v6/playlist/detail?id=18476425375';
const response = await fetch(url, { headers: { Referer: 'https://music.163.com/' }, signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`歌单读取失败 HTTP ${response.status}`);
const data = await response.json();
if (data.code !== 200 || String(data.playlist?.id) !== '18476425375' || !Array.isArray(data.playlist.tracks)) throw new Error('共享歌单未返回有效数据');
const ids = (data.playlist.trackIds || []).map(track => String(track.id));
if (!ids.length || !ids.every(id => /^\d+$/.test(id))) throw new Error('歌单歌曲标识不完整');
const tracks = new Map(data.playlist.tracks.map(track => [String(track.id), track]));
// The public playlist endpoint returns only the first ten full track objects.
// Resolve missing IDs through the same public catalog, without login credentials.
const missing = ids.filter(id => !tracks.has(id));
for (let offset = 0; offset < missing.length; offset += 100) {
  const result = await api.song_detail({ ids: missing.slice(offset, offset + 100).join(','), cookie: {}, timeout: 15000, crypto: 'weapi', e_r: false });
  if (result.body?.code !== 200 || !Array.isArray(result.body.songs)) throw new Error('部分歌曲信息暂时无法读取，保留上次快照');
  result.body.songs.forEach(track => tracks.set(String(track.id), track));
}
if (ids.some(id => !tracks.has(id))) throw new Error('歌曲信息不足，保留上次快照');
const picture = value => {
  try { const u = new URL(value); if (!['p1.music.126.net', 'p2.music.126.net', 'p3.music.126.net', 'p4.music.126.net'].includes(u.hostname)) return null; u.protocol = 'https:'; return u.href; } catch { return null; }
};
const text = value => typeof value === 'string' ? value.slice(0, 500) : '';
const snapshot = { id: '18476425375', name: text(data.playlist.name), coverUrl: picture(data.playlist.coverImgUrl), fetchedAt: new Date().toISOString(), sourceUrl: url, total: data.playlist.trackCount,
  tracks: ids.map(id => tracks.get(id)).map(t => ({ id: String(t.id), title: text(t.name), artist: (t.ar || []).map(a => text(a.name)).join(', '), album: text(t.al?.name), coverUrl: picture(t.al?.picUrl), duration: typeof t.dt === 'number' ? t.dt / 1000 : 0 })) };
if (!snapshot.tracks.every(t => /^\d+$/.test(t.id) && t.title)) throw new Error('歌单曲目格式不完整');
await mkdir('src/data/music', { recursive: true });
await writeFile('src/data/music/netease-playlist.json.tmp', JSON.stringify(snapshot, null, 2) + '\n');
await rename('src/data/music/netease-playlist.json.tmp', 'src/data/music/netease-playlist.json');
console.log(`已读取 ${snapshot.tracks.length}/${snapshot.total} 首公开曲目信息；未读取音频或账号。`);
