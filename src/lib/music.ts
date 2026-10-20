export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  trackNumber: number;
  discNumber: number;
  duration: number;
  format: string;
  sampleRate: number;
  bitsPerSample: number;
  audioUrl: string | null;
  coverUrl?: string | null;
  lyrics?: string | null;
  lyricsUrl?: string | null;
}

export interface MusicCatalog {
  version: 1;
  updatedAt: string | null;
  tracks: MusicTrack[];
}

export const emptyMusicCatalog: MusicCatalog = { version: 1, updatedAt: null, tracks: [] };

export function safeAudioUrl(value: unknown, allowLocalAudio = false): string | null {
  if (typeof value !== 'string') return null;
  if (allowLocalAudio && /^\/personal-homepage\/music\/local-audio\/[a-f0-9]{24}\/$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function safeCoverUrl(value: unknown, allowLocal = false): string | null {
  if (allowLocal && typeof value === 'string' && /^\/personal-homepage\/music\/local-cover\/[a-f0-9]{24}\/$/.test(value)) return value;
  return safeAudioUrl(value);
}

/** Only allow public music fields through to the browser. */
export function parseMusicCatalog(value: unknown, allowLocalAudio = false): MusicCatalog {
  if (!value || typeof value !== 'object') throw new Error('曲目清单格式不正确');
  const data = value as Record<string, unknown>;
  if (data.version !== 1 || !Array.isArray(data.tracks)) throw new Error('曲目清单版本不支持');
  const seen = new Set<string>();
  const text = (value: unknown, fallback = '') => typeof value === 'string' ? value.slice(0, 500) : fallback;
  const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
  const tracks = data.tracks.map((item: unknown): MusicTrack => {
    if (!item || typeof item !== 'object') throw new Error('曲目信息不完整');
    const track = item as Record<string, unknown>;
    const id = text(track.id);
    if (!id || seen.has(id) || !text(track.title)) throw new Error('曲目编号重复或标题缺失');
    seen.add(id);
    return {
      id, title: text(track.title), artist: text(track.artist, '未知歌手'),
      album: text(track.album, '未标注专辑'), albumArtist: text(track.albumArtist, text(track.artist)),
      trackNumber: number(track.trackNumber), discNumber: number(track.discNumber),
      duration: number(track.duration), format: text(track.format),
      sampleRate: number(track.sampleRate), bitsPerSample: number(track.bitsPerSample),
      audioUrl: safeAudioUrl(track.audioUrl, allowLocalAudio),
      coverUrl: safeCoverUrl(track.coverUrl, allowLocalAudio),
      ...(typeof track.lyricsUrl === 'string' && /^\/personal-homepage\/music\/lyrics\/[a-f0-9]{24}\.json$/.test(track.lyricsUrl) ? { lyricsUrl: track.lyricsUrl } : {}),
      lyrics: typeof track.lyrics === 'string' && track.lyrics.length <= 65536 ? track.lyrics.replaceAll('\u0000', '') : null,
    };
  });
  return { version: 1, updatedAt: typeof data.updatedAt === 'string' && !Number.isNaN(Date.parse(data.updatedAt)) ? data.updatedAt : null, tracks };
}

export function lxSearchUrl(keywords: string): string {
  return `lxmusic://music/search?data=${encodeURIComponent(JSON.stringify({ keywords: keywords.trim() }))}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export function qualityLabel(track: MusicTrack): string {
  const details = [track.format.toUpperCase()];
  if (track.bitsPerSample) details.push(`${track.bitsPerSample} bit`);
  if (track.sampleRate) details.push(`${Number((track.sampleRate / 1000).toFixed(1))} kHz`);
  return details.filter(Boolean).join(' / ');
}
