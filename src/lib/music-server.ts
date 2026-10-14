import { readFile } from 'node:fs/promises';
import { emptyMusicCatalog, parseMusicCatalog, type MusicCatalog } from './music';
import { localAudioUrls } from '../../tools/music/local-playback.mjs';
import { loadCloudCatalog } from '../../tools/music/cloud-library.mjs';

/** Read public cloud metadata first; local fallback never reads original audio in this request. */
export async function loadMusicCatalog(): Promise<MusicCatalog> {
  const cloud = await loadCloudCatalog();
  if (cloud?.tracks.length) return import.meta.env.DEV ? await localAudioUrls(cloud, import.meta.env.BASE_URL) : cloud;
  try {
    const catalog = parseMusicCatalog(JSON.parse(await readFile('.local-tools/music/catalog.json', 'utf8')));
    return import.meta.env.DEV ? await localAudioUrls(catalog, import.meta.env.BASE_URL) : catalog;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.warn('音乐目录读取失败，保留未连接状态。');
    return emptyMusicCatalog;
  }
}
