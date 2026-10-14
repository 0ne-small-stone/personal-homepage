export interface LyricLine { time: number; text: string; }

/** LRC timestamps only. Playback timing remains owned by the real audio element. */
export function parseLyrics(value?: string | null): { lines: LyricLine[]; plain: string } {
  if (!value || value.length > 65536) return { lines: [], plain: '' };
  const source = value.replace(/^\uFEFF/, '').replaceAll('\u0000', '');
  const offset = Number(/\[offset:([+-]?\d+)\]/i.exec(source)?.[1] || 0) / 1000;
  const grouped = new Map<number, string[]>();
  const plain: string[] = [];
  for (const row of source.split(/\r?\n|\r/)) {
    const stamps = [...row.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    const text = row.replace(/\[[^\]]*\]/g, '').replace(/<\d{1,3}:\d{2}(?:[.:]\d{1,3})?>/g, '').trim();
    if (!stamps.length) { if (text) plain.push(text);continue; }
    for (const stamp of stamps) {
      if (Number(stamp[2]) >= 60) continue;
      const time = Math.max(0, Number(stamp[1]) * 60 + Number(stamp[2]) + Number(`0.${stamp[3] || '0'}`) + offset);
      const parts = grouped.get(time) || [];
      if (text && !parts.includes(text)) parts.push(text);
      grouped.set(time, parts);
    }
  }
  return { lines: [...grouped].sort(([a], [b]) => a - b).map(([time, parts]) => ({ time, text: parts.join('\n') })), plain: plain.join('\n') };
}

export function currentLyric(lines: LyricLine[], time: number): number {
  if (!Number.isFinite(time)) return -1;
  let low = 0, high = lines.length - 1, result = -1;
  while (low <= high) { const middle = (low + high) >>> 1;if (lines[middle].time <= time) { result = middle;low = middle + 1; } else high = middle - 1; }
  return result;
}

export function matchesLyricRecording(record: { trackName?: string; artistName?: string; albumName?: string; duration?: number }, track: { title: string; artist: string; album: string; duration: number }) {
  const normalize = (value = '') => value.normalize('NFKC').trim().toLocaleLowerCase();
  return normalize(record.trackName) === normalize(track.title) && normalize(record.artistName) === normalize(track.artist) &&
    normalize(record.albumName) === normalize(track.album) && Number.isFinite(record.duration) && Math.abs(record.duration! - track.duration) <= 2;
}
