import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { currentLyric, matchesLyricRecording, parseLyrics } from '../../lib/music-lyrics';
import type { MusicTrack } from '../../lib/music';

type LyricsResult = { text: string; status: 'ready' | 'missing' | 'instrumental' | 'error'; };
const cache = new Map<string, LyricsResult>();
let retryAt = 0;

export default function LyricPanel({ track, time, playing, seekVersion = 0, canSeek, onSeek }: { track?: MusicTrack; time: number; playing: boolean; seekVersion?: number; canSeek: boolean; onSeek: (time: number) => void }) {
  const key = track ? JSON.stringify([track.title, track.artist, track.album, track.duration]) : '';
  const [result, setResult] = useState<{ key: string; value: LyricsResult } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [follow, setFollow] = useState(true);
  const [inset, setInset] = useState(160);
  const viewport = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<number | undefined>(undefined);
  const holding = useRef(false);
  const following = useRef(true);
  const clearResume = useCallback(() => { window.clearTimeout(resumeTimer.current);resumeTimer.current = undefined; }, []);
  const resume = useCallback(() => { clearResume();following.current = true;setFollow(true); }, [clearResume]);
  const scheduleResume = useCallback(() => {
    clearResume();
    if (!playing || holding.current || document.hidden) return;
    resumeTimer.current = window.setTimeout(resume, 6000);
  }, [playing, clearResume, resume]);
  function browse() { following.current = false;setFollow(false);scheduleResume(); }
  useEffect(() => { holding.current = false;resume();return clearResume; }, [key, seekVersion, resume, clearResume]);
  useEffect(() => { if (!follow) scheduleResume();else clearResume();return clearResume; }, [follow, scheduleResume, clearResume]);
  useEffect(() => {
    const release = (event: Event) => {
      if (event instanceof PointerEvent && event.pointerType === 'touch') return;
      holding.current = false;if (!following.current) scheduleResume();
    };
    const visibility = () => { if (document.hidden) clearResume();else if (!following.current) scheduleResume(); };
    window.addEventListener('pointerup', release);window.addEventListener('pointercancel', release);window.addEventListener('touchend', release);window.addEventListener('touchcancel', release);window.addEventListener('blur', release);document.addEventListener('visibilitychange', visibility);
    return () => { clearResume();window.removeEventListener('pointerup', release);window.removeEventListener('pointercancel', release);window.removeEventListener('touchend', release);window.removeEventListener('touchcancel', release);window.removeEventListener('blur', release);document.removeEventListener('visibilitychange', visibility); };
  }, [scheduleResume, clearResume]);
  useEffect(() => {
    if (!viewport.current) return;
    const element = viewport.current, fit = () => setInset(element.clientHeight * .4);
    fit();const observer = new ResizeObserver(fit);observer.observe(element);return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!track || track.lyrics || !track.duration) return;
    const saved = cache.get(key);if (saved) { setResult({ key, value: saved });return; }
    const controller = new AbortController();
    async function load() {
      try {
        if (Date.now() < retryAt) throw new Error('cooldown');
        const url = new URL('https://lrclib.net/api/get');
        url.search = new URLSearchParams({ track_name: track!.title, artist_name: track!.artist, album_name: track!.album, duration: String(track!.duration) }).toString();
        const response = await fetch(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]), credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Lrclib-Client': 'LSSH/0.1 (https://github.com/0ne-small-stone/personal-homepage)' } });
        if (response.status === 429 || response.status === 503) {
          const value = response.headers.get('retry-after') || '60';
          retryAt = Math.max(Date.now() + 1000, /^\d+$/.test(value) ? Date.now() + Number(value) * 1000 : Date.parse(value) || Date.now() + 60000);
          throw new Error('cooldown');
        }
        let next: LyricsResult = { text: '', status: 'missing' };
        if (response.status !== 404) {
          if (!response.ok || Number(response.headers.get('content-length') || 0) > 262144) throw new Error('response');
          const text = await response.text();if (text.length > 262144) throw new Error('size');
          const record = JSON.parse(text);
          if (matchesLyricRecording(record, track!)) {
            const lyric = record.syncedLyrics || record.plainLyrics || '';
            if (typeof lyric !== 'string' || lyric.length > 65536) throw new Error('lyrics');
            next = { text: lyric, status: record.instrumental === true ? 'instrumental' : lyric ? 'ready' : 'missing' };
          }
        }
        if (controller.signal.aborted) return;
        if (cache.size >= 128) cache.delete(cache.keys().next().value!);
        cache.set(key, next);setResult({ key, value: next });
      } catch { if (!controller.signal.aborted) setResult({ key, value: { text: '', status: 'error' } }); }
    }
    void load();return () => controller.abort();
  }, [key, track?.lyrics, attempt]);
  const current = track?.lyrics ? { text: track.lyrics, status: 'ready' as const } : result?.key === key ? result.value : track && !track.duration ? { text: '', status: 'missing' as const } : null;
  const parsed = useMemo(() => parseLyrics(current?.text), [current?.text]);
  const active = currentLyric(parsed.lines, time);
  useEffect(() => {
    if (!follow || !viewport.current) return;
    const element = viewport.current.querySelector<HTMLElement>(`[data-line="${Math.max(0, active)}"]`);if (!element) return;
    const top = element.getBoundingClientRect().top - viewport.current.getBoundingClientRect().top + viewport.current.scrollTop;
    viewport.current.scrollTo({ top: Math.max(0, top - viewport.current.clientHeight * .4), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [active, follow, key, parsed.lines, inset]);
  return <section className="music-lyrics" aria-label="歌词" data-follow={follow ? 'auto' : 'manual'}>
    <div ref={viewport} className="music-lyrics-scroll" style={{ '--lyrics-inset': `${inset}px` } as CSSProperties} tabIndex={0} aria-label="浏览歌词" aria-description="滚动浏览歌词；播放时停止操作6秒后自动跟随。点击歌词可跳转。" onWheel={browse} onScroll={() => { if (!following.current) scheduleResume(); }} onPointerDown={event => { if (event.pointerType !== 'touch') { holding.current = true;browse(); } }} onTouchStart={() => { holding.current = true;browse(); }} onKeyDown={event => { if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key)) browse(); }}>
      {parsed.lines.length ? <ol className="music-lyric-lines">{parsed.lines.map((line, index) => <li key={`${line.time}:${index}`} data-line={index}><button type="button" aria-current={index === active ? 'true' : undefined} disabled={!canSeek} className={index === active ? 'is-current' : ''} onClick={() => { resume();onSeek(line.time); }}>{line.text || <span className="music-lyric-break" aria-label="间奏">•••</span>}</button></li>)}</ol> : parsed.plain ? <div className="music-plain-lyrics"><p className="music-lyrics-note">这首歌暂未提供时间轴</p><p>{parsed.plain}</p></div> : <div className="music-lyrics-empty" role="status"><p>{!track ? '选一首歌，开始听' : !current ? '正在加载歌词…' : current.status === 'instrumental' ? '纯音乐' : current.status === 'error' ? '歌词暂时无法加载' : '暂无歌词'}</p>{current?.status === 'error' && <button type="button" className="radio-refresh" onClick={() => { setResult(null);setAttempt(value => value + 1); }}>重试</button>}</div>}
    </div>
  </section>;
}
