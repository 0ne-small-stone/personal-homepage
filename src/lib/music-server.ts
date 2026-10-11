import { readFile } from 'node:fs/promises';
import { emptyMusicCatalog, parseMusicCatalog, type MusicCatalog } from './music';

/** Local generated metadata only; never read the owner's music files from a web request. */
export async function loadMusicCatalog(): Promise<MusicCatalog> {
  try {
    return parseMusicCatalog(JSON.parse(await readFile('.local-tools/music/catalog.json', 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.warn('音乐目录读取失败，保留未连接状态。');
    return emptyMusicCatalog;
  }
}
