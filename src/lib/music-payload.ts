import { createHash } from 'node:crypto';
import type { MusicCatalog, MusicTrack } from './music';

export function lyricAssetId(track: MusicTrack) {
  return createHash('sha256').update(track.id + '\0' + (track.lyrics ?? '')).digest('hex').slice(0, 24);
}

/** Server-only projection. Preserve the catalog; deliver long text separately. */
export function musicSummary(catalog: MusicCatalog): MusicCatalog {
  return { ...catalog, tracks: catalog.tracks.map(track => ({ ...track, lyrics: null,
    lyricsUrl: track.lyrics ? `${import.meta.env?.BASE_URL ?? '/personal-homepage/'}music/lyrics/${lyricAssetId(track)}.json` : track.lyricsUrl ?? null,
  })) };
}
