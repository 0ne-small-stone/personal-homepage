import { useEffect, useRef, useState } from 'react';
import { lxSearchUrl, parseMusicCatalog, type MusicCatalog, type MusicTrack } from '../../lib/music';
import { audioSession, type AudioTrack } from '../../lib/audio-session';
import { useAudioSession } from './useAudioSession';
import LocalMusicCatalog from './LocalMusicCatalog';
import NetEaseMusicCatalog from './NetEaseMusicCatalog';
import RadioNowPlaying, { type PlaybackPresentation } from './RadioNowPlaying';
import ListeningRoom from './ListeningRoom';
import type { RadioConfig } from './RadioExperience';

const albumKey = (track: MusicTrack) => JSON.stringify([track.albumArtist, track.album]);
const asAudioTrack = (track: MusicTrack): AudioTrack => ({ id: track.id, title: track.title, artist: track.artist, album: track.album, coverUrl: track.coverUrl || undefined, audioUrl: track.audioUrl!, source: 'cloud' });

export default function RadioLibraryExperience({ initialCatalog, config }: { initialCatalog: MusicCatalog; config: RadioConfig }) {
  const state = useAudioSession();
  const [mode, setMode] = useState<'cloud' | 'netease'>('cloud');
  const [catalog, setCatalog] = useState(initialCatalog);
  const [selectedId, setSelectedId] = useState(initialCatalog.tracks[0]?.id || '');
  const [albumFilter, setAlbumFilter] = useState('');
  const [view, setView] = useState<'songs' | 'albums'>('albums');
  const [query, setQuery] = useState('');
  const [downloadQuery, setDownloadQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [room, setRoom] = useState(false);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const selected = catalog.tracks.find(track => track.id === (state.track?.source === 'cloud' ? state.track.id : selectedId)) || catalog.tracks[0];
  const active = state.track?.source === 'cloud' && state.track.id === selected?.id;
  const queue = catalog.tracks.filter(track => track.audioUrl).map(asAudioTrack);
  const playbackQueue = active ? state.queue : queue;
  const trackIndex = playbackQueue.findIndex(track => track.id === selected?.id);
  async function refresh(manual = false) {
    request.current?.abort();const controller = new AbortController();request.current = controller;
    if (manual) setBusy(true);
    try {
      const response = await fetch(config.catalogUrl, { cache: 'no-store', credentials: 'omit', signal: controller.signal });
      if (!response.ok) throw new Error('目录不可用');
      const next = parseMusicCatalog(await response.json(), import.meta.env.DEV);
      if (mounted.current) { setCatalog(next);setNotice(manual ? `目录已刷新，共 ${next.tracks.length} 首。` : ''); }
    } catch { if (mounted.current && !controller.signal.aborted) setNotice('目录暂时无法更新，保留上次曲目。请稍后刷新。'); }
    finally { if (mounted.current && !controller.signal.aborted) setBusy(false); }
  }
  useEffect(() => {
    mounted.current = true;
    const restore = () => {
      const requested = new URL(location.href).searchParams.get('mode');
      const source = audioSession.getSnapshot().track?.source;
      const next = requested === 'netease' || requested === 'cloud' ? requested : source || 'cloud';
      if (source && source !== next) audioSession.pause();
      setRoom(false);setMode(next);
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
    audioSession.pause();setBusy(false);setRoom(false);setMode(next);
    const url = new URL(location.href);url.searchParams.set('mode', next);history.pushState(null, '', url);
  }
  function chooseTrack(track: MusicTrack, autoPlay = false, albumOnly = false) {
    setSelectedId(track.id);
    if (track.audioUrl) audioSession.select(asAudioTrack(track), albumOnly ? catalog.tracks.filter(item => item.audioUrl && albumKey(item) === albumKey(track)).map(asAudioTrack) : queue, autoPlay);
    else setNotice('这首歌的音源尚未连接，请刷新目录或打开洛雪。');
  }
  const playback: PlaybackPresentation = {
    track: selected, playing: active && state.playing, waiting: active && state.waiting,
    time: active ? state.time : 0, duration: active ? state.duration : 0, volume: state.volume,
    source: selected?.audioUrl ? selected.audioUrl.startsWith('/') ? '本机播放 · 考拉云盘待连接' : '考拉云盘音源' : '音源待连接',
    canPrevious: trackIndex > 0, canNext: trackIndex >= 0 && trackIndex < playbackQueue.length - 1,
    onToggle: () => { if (active) audioSession.toggle();else if (selected) chooseTrack(selected, true); },
    onPrevious: () => { if (active) audioSession.next(-1, true);else { const track = catalog.tracks.find(track => track.id === playbackQueue[trackIndex - 1]?.id);if (track) chooseTrack(track, true); } },
    onNext: () => { if (active) audioSession.next(1, true);else { const track = catalog.tracks.find(track => track.id === playbackQueue[trackIndex + 1]?.id);if (track) chooseTrack(track, true); } },
    onSeek: audioSession.seek, onVolume: audioSession.setVolume,
  };
  const downloads = <details className="radio-download-disclosure" id="radio-download"><summary><span>下载与音源</span><span className="radio-download-summary-hint">洛雪下载 · 考拉收藏</span></summary><section className="radio-download" aria-labelledby="download-title"><div><h2 id="download-title">在洛雪里找音乐</h2><p>打开洛雪，选择这首歌可用的最高音质下载。下载后，电台按真实文件整理单曲和专辑。</p></div><form onSubmit={event => { event.preventDefault();if (downloadQuery.trim()) location.href = lxSearchUrl(downloadQuery.trim()); }}><label htmlFor="lx-keywords">歌曲或歌手</label><div className="radio-download-fields"><input id="lx-keywords" value={downloadQuery} onChange={event => setDownloadQuery(event.target.value)} placeholder="歌曲或歌手" required maxLength={200} /><button type="submit" className="radio-primary">打开洛雪下载</button></div></form><div className="radio-help"><button type="button" className="radio-refresh" disabled={busy} onClick={() => void refresh(true)}>{busy ? '刷新中…' : '刷新目录'}</button><a className="radio-link" href={config.lxInstallUrl} target="_blank" rel="noopener noreferrer">安装洛雪（新窗口）</a><a className="radio-link" href={config.lxSourceUrl} target="_blank" rel="noopener noreferrer">音源更新（新窗口）</a><a className="radio-link" href={config.cloudUrl} target="_blank" rel="noopener noreferrer">打开考拉云盘（新窗口）</a></div></section></details>;
  return <div className="radio-app">
    {mode === 'cloud' ? <section aria-label="本地收藏电台" className="radio-cloud">
      <LocalMusicCatalog catalog={catalog} selectedId={selected?.id || ''} view={view} setView={setView} query={query} setQuery={setQuery} albumFilter={albumFilter} setAlbumFilter={setAlbumFilter} onSelect={chooseTrack} notice={notice} error={active ? state.error : ''} onMode={changeMode} footer={downloads} />
      <RadioNowPlaying {...playback} onExpand={() => setRoom(true)} />
      <ListeningRoom {...playback} open={room} error={active ? state.error : ''} onClose={() => setRoom(false)} />
    </section> : <NetEaseMusicCatalog config={config} onMode={changeMode} />}
  </div>;
}
