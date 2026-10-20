import { readFile } from 'node:fs/promises';
import { emptyMusicCatalog, parseMusicCatalog, type MusicCatalog } from './music';
import { localAudioUrls } from '../../tools/music/local-playback.mjs';
import { loadCloudCatalog } from '../../tools/music/cloud-library.mjs';
import { choosePublicMusicCatalog } from '../../tools/music/public-catalog.mjs';
import cloudSnapshot from '../data/music/cloud-catalog.json';
import cloudConfig from '../config/music-cloud.json';

// Static routes must share one public catalog for this build, including lyrics.
let productionCatalog: Promise<MusicCatalog> | undefined;

/** Read public cloud metadata first; local fallback never reads original audio in this request. */
export async function loadMusicCatalog(): Promise<MusicCatalog> {
  if (!import.meta.env.DEV) return productionCatalog ??= loadCloudCatalog().then(cloud =>
    choosePublicMusicCatalog({ remote: cloud, snapshot: cloudSnapshot, shareUrl: cloudConfig.shareUrl }).catalog);
  const cloud = await loadCloudCatalog();
  if (cloud?.tracks.length) return await localAudioUrls(cloud, import.meta.env.BASE_URL);
  try {
    const catalog = parseMusicCatalog(JSON.parse(await readFile('.local-tools/music/catalog.json', 'utf8')));
    return import.meta.env.DEV ? await localAudioUrls(catalog, import.meta.env.BASE_URL) : catalog;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.warn('音乐目录读取失败，保留未连接状态。');
    return emptyMusicCatalog;
  }
}
