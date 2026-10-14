import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { formatDuration, lxSearchUrl, parseMusicCatalog, qualityLabel, type MusicCatalog, type MusicTrack } from '../../lib/music';
import VinylTurntable from './VinylTurntable';
import LocalRadioLibrary from './LocalRadioLibrary';
import NetEaseLibrary from './NetEaseLibrary';
import AlbumSwitcher, { type SwitcherAlbum } from './AlbumSwitcher';
import { audioSession, type AudioTrack } from '../../lib/audio-session';
import { useAudioSession } from './useAudioSession';

export interface RadioConfig { cloudUrl: string; lxInstallUrl: string; lxSourceUrl: string; playlistUrl: string; playlistEmbedUrl: string; catalogUrl: string; recommendationApi: string; }
const albumKey = (track: MusicTrack) => JSON.stringify([track.albumArtist, track.album]);
function Icon({ name }: { name: 'play' | 'pause' | 'previous' | 'next' | 'volume' | 'download' | 'back' | 'chevron' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{name === 'play' ? <path d="m9 5 10 7-10 7Z" /> : name === 'pause' ? <path d="M8 5v14M16 5v14" /> : name === 'previous' ? <path d="M5 5v14m14-14L9 12l10 7Z" /> : name === 'next' ? <path d="M19 5v14M5 5l10 7-10 7Z" /> : name === 'volume' ? <path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : name === 'download' ? <path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4" /> : name === 'back' ? <path d="m14 5-7 7 7 7" /> : <path d="m6 9 6 6 6-6" />}</svg>;
}

export default function RadioExperience({ initialCatalog, config }: { initialCatalog: MusicCatalog; config: RadioConfig }) {
  const [mode, setMode] = useState<'cloud' | 'netease'>('cloud');
  const [catalog, setCatalog] = useState(initialCatalog);
  const [selectedId, setSelectedId] = useState(initialCatalog.tracks[0]?.id || '');
  const [albumFilter, setAlbumFilter] = useState('');
  const [libraryView, setLibraryView] = useState<'songs' | 'albums'>('albums');
  const [query, setQuery] = useState('');
  const [downloadQuery, setDownloadQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const media = useAudioSession();
  const cloudActive = media.track?.source === 'cloud';
  const { volume } = media;
  const { playing, waiting, time, duration, error: playerError } = cloudActive ? media : { playing: false, waiting: false, time: 0, duration: 0, error: '' };
  const [switcher, setSwitcher] = useState<{ albumId?: string } | null>(null);
  const library = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const selected = catalog.tracks.find(track => track.id === (cloudActive ? media.track?.id : selectedId)) || catalog.tracks[0];
  const asAudioTrack = (track: MusicTrack): AudioTrack => ({ ...track, audioUrl: track.audioUrl!, source: 'cloud' });
  const albumCount = new Set(catalog.tracks.map(albumKey)).size;
  const switcherAlbums = useMemo(() => {
    const albums = new Map<string, SwitcherAlbum>();
    for (const track of catalog.tracks) {
      const id = albumKey(track);
      if (!albums.has(id)) albums.set(id, { id, title: track.album, artist: track.albumArtist, coverUrl: track.coverUrl, tracks: [] });
      const album = albums.get(id)!;album.coverUrl ||= track.coverUrl;
      album.tracks.push({ id: track.id, title: track.title, artist: track.artist, duration: track.duration, playable: Boolean(track.audioUrl) });
    }
    return [...albums.values()];
  }, [catalog]);
  const visibleTracks = catalog.tracks.filter(t => (!albumFilter || albumKey(t) === albumFilter) && `${t.title} ${t.artist} ${t.album}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const trackIndex = visibleTracks.findIndex(t => t.id === selected?.id);
  const localPlayback = selected?.audioUrl?.startsWith('/') === true;

  async function refresh(manual = false) {
    request.current?.abort();const controller = new AbortController();request.current = controller;
    if (manual) setBusy(true);
    try {
      const response = await fetch(config.catalogUrl, { cache: 'no-store', credentials: 'omit', signal: controller.signal });
      if (!response.ok) throw new Error('无法读取曲目清单');
      const next = parseMusicCatalog(await response.json(), import.meta.env.DEV);
      if (!mounted.current) return;
      setCatalog(next);setNotice(manual ? `目录已刷新，共 ${next.tracks.length} 首。` : '');
    } catch { if (mounted.current && !controller.signal.aborted) setNotice('目录暂时无法更新，保留上次曲目。请稍后刷新。'); }
    finally { if (mounted.current && !controller.signal.aborted) setBusy(false); }
  }
  useEffect(() => {
    mounted.current = true;
    const restore = () => {
      const requested = new URL(location.href).searchParams.get('mode');
      const activeSource = audioSession.getSnapshot().track?.source;
      const next = requested === 'netease' || requested === 'cloud' ? requested : activeSource || 'cloud';
      if (activeSource && activeSource !== next) audioSession.pause();
      setSwitcher(null);setMode(next);
    };
    restore();window.addEventListener('popstate', restore);
    return () => { mounted.current = false;request.current?.abort();window.removeEventListener('popstate', restore); };
  }, []);
  useEffect(() => {
    if (mode !== 'cloud') return;
    void refresh();const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    return () => { clearInterval(interval);request.current?.abort(); };
  }, [mode]);
  function changeMode(next: 'cloud' | 'netease') {
    if (next === mode) return;
    audioSession.pause();setBusy(false);setSwitcher(null);setMode(next);
    const url = new URL(location.href);url.searchParams.set('mode', next);history.pushState(null, '', url);
  }
  async function togglePlayback() {
    if (!selected?.audioUrl) return;
    if (cloudActive && media.track?.id === selected.id) audioSession.toggle();
    else audioSession.select(asAudioTrack(selected), visibleTracks.filter(t => t.audioUrl).map(asAudioTrack), true);
  }
  function chooseTrack(track: MusicTrack, autoPlay = false) {
    setSelectedId(track.id);
    if (!track.audioUrl) { audioSession.stop();return; }
    audioSession.select(asAudioTrack(track), visibleTracks.filter(t => t.audioUrl).map(asAudioTrack), autoPlay);
  }
  function nextTrack(direction: -1 | 1, autoPlay = playing) { const next = visibleTracks[trackIndex + direction];if (next) chooseTrack(next, autoPlay); }

  return <div className="radio-app">
    <header className="radio-topline"><div className="radio-heading"><a className="radio-back" href={`${import.meta.env.BASE_URL}#radio`} aria-label="返回首页"><Icon name="back" /></a><div><h1>Echoes</h1><p>收藏喜欢的声音，也听听彼此的回响。</p></div></div><div className="radio-mode" role="group" aria-label="音源模式"><button type="button" aria-pressed={mode === 'cloud'} onClick={() => changeMode('cloud')}>本地收藏</button><button type="button" aria-pressed={mode === 'netease'} onClick={() => changeMode('netease')}>网易云音乐</button></div></header>
    {mode === 'cloud' ? <section aria-label="本地收藏电台" className="radio-cloud">
      <section className="radio-listening" aria-label="黑胶播放器">
        <div className="radio-toolbar"><div><h2>当前唱片</h2><p>{selected?.album || '等待第一张专辑'}</p></div><button type="button" className="radio-refresh" disabled={!switcherAlbums.length} onClick={() => setSwitcher({ albumId: selected ? albumKey(selected) : undefined })}>切换音乐 / 专辑</button></div>
        <VinylTurntable track={selected} playing={playing} progress={duration ? time / duration : 0} onToggle={() => void togglePlayback()} onLibrary={() => { if (switcherAlbums.length) setSwitcher({ albumId: selected ? albumKey(selected) : undefined }); }} />
        <div className="turntable-controls"><div className="turntable-transport"><button type="button" aria-label="上一首" disabled={trackIndex <= 0} onClick={() => nextTrack(-1)}><Icon name="previous" /></button><button type="button" className="turntable-play" aria-label={playing ? '暂停' : '播放'} disabled={!selected?.audioUrl} onClick={() => void togglePlayback()}><Icon name={playing ? 'pause' : 'play'} /></button><button type="button" aria-label="下一首" disabled={trackIndex < 0 || trackIndex >= visibleTracks.length - 1} onClick={() => nextTrack(1)}><Icon name="next" /></button></div><div className="turntable-track-info"><h2>{selected?.title || '等待第一首歌'}</h2><p>{selected?.artist || '用洛雪下载歌曲，再刷新目录。'}</p></div><p className="radio-quality">{selected ? qualityLabel(selected) : ''}</p></div>
        <div className="turntable-adjustments"><label className="turntable-progress"><span className="radio-sr-only">播放进度</span><span>{time > 0 ? formatDuration(time) : '0:00'}</span><input type="range" aria-label="播放进度" min="0" max={duration || 1} step=".1" value={Math.min(time, duration || 1)} disabled={!duration} style={{ '--range-fill': `${duration ? Math.min(100, time / duration * 100) : 0}%` } as CSSProperties} onChange={event => audioSession.seek(Number(event.target.value))} /><span>{formatDuration(duration || selected?.duration || 0)}</span></label></div>
        <div className="turntable-status-row"><p className="radio-playback-source">{selected?.audioUrl ? localPlayback ? '本机播放 · 考拉云盘待连接' : '考拉云盘音源' : '播放待连接 · 连接考拉音乐文件夹后即可收听'}{waiting && ' · 正在缓冲'}</p><label className="turntable-volume"><span className="radio-sr-only">音量</span><Icon name="volume" /><input type="range" aria-label="音量" min="0" max="1" step=".01" value={volume} style={{ '--range-fill': `${volume * 100}%` } as CSSProperties} onChange={event => audioSession.setVolume(Number(event.target.value))} /></label></div>{playerError && <p role="alert" className="radio-error">{playerError}</p>}
      </section>
      <div ref={library} className="radio-library" tabIndex={-1}><div className="radio-library-title"><div><h2>音乐库</h2><p>{catalog.tracks.length} 首单曲 · {albumCount} 张专辑</p></div><a className="radio-library-download" href={lxSearchUrl(downloadQuery.trim() || (selected ? `${selected.title} ${selected.artist}` : 'Echoes'))} aria-label="下载音乐（打开洛雪）"><Icon name="download" /><span>打开洛雪</span></a></div><LocalRadioLibrary catalog={catalog} selectedId={selected?.id || ''} view={libraryView} setView={setLibraryView} query={query} setQuery={setQuery} albumFilter={albumFilter} setAlbumFilter={setAlbumFilter} onSelect={chooseTrack} onOpenAlbum={albumId => setSwitcher({ albumId })} busy={busy} onRefresh={() => void refresh(true)} notice={notice} /></div>
      {switcher && <AlbumSwitcher albums={switcherAlbums} initialAlbumId={switcher.albumId} currentTrackId={selected?.id} onClose={() => setSwitcher(null)} onPlay={id => { const track = catalog.tracks.find(t => t.id === id);if (track) { setAlbumFilter('');setQuery('');chooseTrack(track, true); } else setNotice('这首歌已不在当前目录中，请刷新后重新选择。'); }} />}
      <details className="radio-download-disclosure" id="radio-download"><summary><Icon name="download" /><span>下载与音源</span><span className="radio-download-summary-hint">洛雪下载 · 考拉收藏</span><Icon name="chevron" /></summary><section className="radio-download" aria-labelledby="download-title"><div><h2 id="download-title">在洛雪里找音乐</h2><p>打开洛雪，选择这首歌可用的最高音质下载。下载后，电台按真实文件整理单曲和专辑。</p></div><form onSubmit={event => { event.preventDefault();const words = downloadQuery.trim();if (words) location.href = lxSearchUrl(words); }}><label htmlFor="lx-keywords">歌曲或歌手</label><div className="radio-download-fields"><input id="lx-keywords" value={downloadQuery} onChange={event => setDownloadQuery(event.target.value)} placeholder="例如：Echoes 或 Pink Floyd" required maxLength={200} /><button type="submit" className="radio-primary">打开洛雪下载</button></div><p className="radio-hint">音质和下载操作在洛雪中完成。</p></form><div className="radio-help"><a className="radio-link" href={config.lxInstallUrl} target="_blank" rel="noopener noreferrer">安装洛雪（新窗口）</a><a className="radio-link" href={config.lxSourceUrl} target="_blank" rel="noopener noreferrer">音源更新（新窗口）</a><a className="radio-link" href={config.cloudUrl} target="_blank" rel="noopener noreferrer">打开考拉云盘（新窗口）</a></div></section></details>
    </section> : <NetEaseLibrary config={config} />}
    <p className="radio-design-credit">界面参考 <a href="https://github.com/Ventuss-OvO/Vinyl-Vue" target="_blank" rel="noopener noreferrer">Vinyl Vue</a>、<a href="https://compscout.dev/comps/vinyl-player" target="_blank" rel="noopener noreferrer">COMPScout</a> 与 <a href="https://github.com/XiangZi7/GlassMusicPlayer" target="_blank" rel="noopener noreferrer">GlassMusicPlayer</a> · <a href={`${import.meta.env.BASE_URL}music/attribution.txt`}>来源与许可</a></p>
  </div>;
}
