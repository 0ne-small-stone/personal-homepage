import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import playlist from '../../data/music/netease-playlist.json';
import { formatDuration } from '../../lib/music';
import VinylSleeve from './VinylSleeve';
import type { RadioConfig } from './RadioExperience';
import AlbumSwitcher, { type SwitcherAlbum } from './AlbumSwitcher';
import { audioSession, type AudioTrack } from '../../lib/audio-session';
import { useAudioSession } from './useAudioSession';

// GlassMusicPlayer's sidebar/library/mobile organization adapted to Astro/React.
// See /music/attribution.txt: Copyright Yxcr, PolyForm Noncommercial 1.0.0.
export default function NetEaseLibrary({ config }: { config: RadioConfig }) {
  const [view, setView] = useState<'albums' | 'songs'>('albums');
  const [query, setQuery] = useState('');
  const media = useAudioSession();
  const active = media.track?.source === 'netease';
  const selectedId = active ? media.track?.id || '' : '';
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const { volume } = media;
  const { playing, time, duration, error } = active ? media : { playing: false, time: 0, duration: 0, error: '' };
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const embed = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const origin = useRef<HTMLButtonElement | null>(null);
  const selected = playlist.tracks.find(t => t.id === selectedId);
  const switcherAlbums = useMemo(() => {
    const groups = new Map<string, SwitcherAlbum>();
    for (const track of playlist.tracks) {
      const id = `${track.artist}\n${track.album}`;
      if (!groups.has(id)) groups.set(id, { id, title: track.album, artist: track.artist, coverUrl: track.coverUrl, tracks: [] });
      groups.get(id)!.tracks.push({ id: track.id, title: track.title, artist: track.artist, duration: track.duration, playable: true });
    }
    return [...groups.values()];
  }, []);
  const tracks = playlist.tracks.filter(t => `${t.title} ${t.artist} ${t.album}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const albums = useMemo(() => {
    const groups = new Map<string, typeof playlist.tracks>();
    for (const t of tracks) { const key = `${t.artist}\n${t.album}`;groups.set(key, [...(groups.get(key) || []), t]); }
    return [...groups.entries()];
  }, [query]);
  useEffect(() => {
    const container = embed.current;if (!open || !container) return;
    const fit = () => setScale(Math.min(1, container.clientWidth / 330));fit();
    const observer = new ResizeObserver(fit);observer.observe(container);heading.current?.focus();
    return () => observer.disconnect();
  }, [open]);
  function openPlayer() {
    audioSession.pause();
    origin.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    setOpen(true);
    if (open) heading.current?.focus();
  }
  function closePlayer() { setOpen(false);origin.current?.focus(); }
  function selectTrack(id: string) {
    setOpen(false);
    if (id === selectedId) { audioSession.toggle();return; }
    const asAudioTrack = (track: typeof playlist.tracks[number]): AudioTrack => ({ ...track, source: 'netease', audioUrl: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3` });
    const track = playlist.tracks.find(t => t.id === id);
    if (track) audioSession.select(asAudioTrack(track), playlist.tracks.map(asAudioTrack), true);
  }
  return <section className="glass-music-shell" aria-label="网易云音乐电台">
    <aside className="glass-sidebar"><p className="glass-identity">网易云音乐</p><div className="glass-nav" role="group" aria-label="网易云目录视图"><button type="button" aria-pressed={view === 'albums'} onClick={() => setView('albums')}>专辑收藏</button><button type="button" aria-pressed={view === 'songs'} onClick={() => setView('songs')}>共享歌单</button></div><a className="radio-link" href={config.playlistUrl} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6m0-6L10 14M10 4H4v16h16v-6" /></svg><span>在网易云打开（新窗口）</span></a></aside>
    <div className="glass-content"><div className="glass-topbar"><label className="radio-search"><span className="radio-sr-only">搜索共享歌单</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索歌曲、歌手或专辑" /></label><span>{playlist.tracks.length} 首</span></div><header className="glass-playlist-heading"><h2>共享歌单</h2><p>陈世先stt · Echoes</p></header>
      {view === 'albums' ? <div className="net-album-layout"><ul className="glass-album-grid">{albums.map(([key, tracks]) => <li key={key}><VinylSleeve title={tracks[0].album} artist={tracks[0].artist} coverUrl={tracks[0].coverUrl} selected={tracks.some(t => t.id === selectedId)} playing={playing && tracks.some(t => t.id === selectedId)} progress={duration ? time / duration : 0} action={playing && tracks.some(t => t.id === selectedId) ? '暂停' : '播放'} onSelect={() => selectTrack(tracks[0].id)} /></li>)}</ul><section className="net-album-tracks" aria-label="共享歌单曲目"><h3>歌单曲目</h3><ol className="radio-track-list">{tracks.map((track, index) => <li key={track.id}><button type="button" className="radio-track" aria-label={`播放歌曲：${track.title}`} aria-pressed={track.id === selectedId} onClick={() => selectTrack(track.id)}><span className="radio-track-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="radio-track-info"><strong>{track.title}</strong><span>{track.artist}</span></span><span className="radio-track-meta">{formatDuration(track.duration)}</span></button></li>)}</ol></section></div> : <ol className="radio-track-list glass-track-list">{tracks.map((track, index) => <li key={track.id}><button type="button" className="radio-track" aria-pressed={track.id === selectedId} onClick={() => selectTrack(track.id)}><span className="radio-track-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="radio-track-info"><strong>{track.title}</strong><span>{track.artist} · {track.album}</span></span><span className="radio-track-meta">{formatDuration(track.duration)}</span></button></li>)}</ol>}
      <button type="button" className="radio-refresh net-album-switcher" disabled={!switcherAlbums.length} onClick={() => setSwitcherOpen(true)}>切换音乐 / 专辑</button>
      {!tracks.length && <p className="radio-empty-result">没有找到匹配的歌曲。试试其他关键词。</p>}
      <p className="radio-updated">歌单信息读取于 <time dateTime={playlist.fetchedAt}>{new Date(playlist.fetchedAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}</time></p>
      {selected && <div className="glass-mini-player" aria-label="网易云当前曲目"><div><strong>{selected.title}</strong><span>{selected.artist}</span></div><button type="button" aria-label={playing ? '暂停网易云歌曲' : '播放网易云歌曲'} onClick={() => selectTrack(selected.id)}>{playing ? '暂停' : '播放'}</button><label className="turntable-progress"><span>{time > 0 ? formatDuration(time) : '0:00'}</span><input type="range" aria-label="网易云播放进度" min="0" max={duration || 1} step=".1" value={Math.min(time, duration || 1)} disabled={!duration} style={{ '--range-fill': `${duration ? Math.min(100, time / duration * 100) : 0}%` } as CSSProperties} onChange={e => audioSession.seek(Number(e.target.value))} /><span>{formatDuration(duration || selected.duration)}</span></label><label className="turntable-volume"><span>音量</span><input type="range" aria-label="网易云音量" min="0" max="1" step=".01" value={volume} style={{ '--range-fill': `${volume * 100}%` } as CSSProperties} onChange={e => audioSession.setVolume(Number(e.target.value))} /></label></div>}
      {error && <p className="radio-error" role="alert">{error}</p>}
      <button type="button" className="radio-refresh" aria-expanded={open} onClick={() => openPlayer()}>使用网易云官方播放器</button>
      {open && <section className="glass-external-player" aria-labelledby="netease-player-heading"><div><h3 ref={heading} id="netease-player-heading" tabIndex={-1}>网易云官方播放器</h3><p>歌曲权限由网易云决定。无法直接播放时，可在这里收听或打开原站。官方播放器离开本页会停止；跨页播放请使用上方歌曲播放按钮。</p>{selectedId && <a className="radio-link" href={`https://music.163.com/#/song?id=${selectedId}`} target="_blank" rel="noopener noreferrer">打开歌曲（新窗口）</a>}<button type="button" className="radio-refresh" onClick={closePlayer}>关闭播放器</button></div><div ref={embed} className="radio-embed" style={{ height: 450 * scale }}><iframe title="Echoes 网易云共享歌单播放器" src={config.playlistEmbedUrl} width="330" height="450" style={{ transform: `scale(${scale})` }} allow="encrypted-media" referrerPolicy="strict-origin-when-cross-origin" /></div></section>}
    </div>
    {switcherOpen && <AlbumSwitcher albums={switcherAlbums} initialAlbumId={selected ? `${selected.artist}\n${selected.album}` : undefined} currentTrackId={selectedId} onClose={() => setSwitcherOpen(false)} onPlay={id => { if (id !== selectedId || !playing) selectTrack(id); }} />}
  </section>;
}
