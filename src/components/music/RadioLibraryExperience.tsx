import { useEffect, useRef, useState } from 'react';
import { parseMusicCatalog, type MusicCatalog, type MusicTrack } from '../../lib/music';
import { audioSession, type AudioTrack } from '../../lib/audio-session';
import { useAudioSession } from './useAudioSession';
import LocalMusicCatalog from './LocalMusicCatalog';
import NetEaseMusicCatalog from './NetEaseMusicCatalog';
import RadioNowPlaying, { type PlaybackPresentation } from './RadioNowPlaying';
import ListeningRoom from './ListeningRoom';
import type { RadioConfig } from './RadioExperience';
import LxDownloadPanel from './LxDownloadPanel';
import type { LibraryView } from './LibrarySidebar';

const albumKey = (track: MusicTrack) => JSON.stringify([track.albumArtist, track.album]);
const asAudioTrack = (track: MusicTrack): AudioTrack => ({ id: track.id, title: track.title, artist: track.artist, album: track.album, coverUrl: track.coverUrl || undefined, audioUrl: track.audioUrl!, source: 'cloud' });

export default function RadioLibraryExperience({ initialCatalog, config }: { initialCatalog: MusicCatalog; config: RadioConfig }) {
  const state = useAudioSession();
  const [mode, setMode] = useState<'cloud' | 'netease'>('cloud');
  const [catalog, setCatalog] = useState(initialCatalog);
  const [selectedId, setSelectedId] = useState(initialCatalog.tracks[0]?.id || '');
  const [albumFilter, setAlbumFilter] = useState('');
  const [view, setView] = useState<LibraryView>('albums');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
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
    try {
      const response = await fetch(config.catalogUrl, { cache: 'no-store', credentials: 'omit', signal: controller.signal });
      if (!response.ok) throw new Error('目录不可用');
      const next = parseMusicCatalog(await response.json(), import.meta.env.DEV || location.hostname === '127.0.0.1');
      if (mounted.current) { setCatalog(next);setNotice(manual ? `目录已刷新，共 ${next.tracks.length} 首。` : ''); }
    } catch { if (mounted.current && !controller.signal.aborted) setNotice('目录暂时无法更新，保留上次曲目。请稍后刷新。'); }
  }
  useEffect(() => {
    mounted.current = true;
    const restore = () => {
      const url = new URL(location.href);
      const requested = url.searchParams.get('mode');
      const requestedView = url.searchParams.get('view');
      const source = audioSession.getSnapshot().track?.source;
      const next = requested === 'netease' || requested === 'cloud' ? requested : source || 'cloud';
      if (source && source !== next) audioSession.pause();
      setRoom(false);setMode(next);setAlbumFilter('');
      setView(requestedView === 'discover' || url.hash === '#radio-download' ? 'discover' : requestedView === 'songs' ? 'songs' : 'albums');
    };
    restore();window.addEventListener('popstate', restore);document.addEventListener('astro:page-load', restore);
    return () => { mounted.current = false;request.current?.abort();window.removeEventListener('popstate', restore);document.removeEventListener('astro:page-load', restore); };
  }, []);
  useEffect(() => {
    if (mode !== 'cloud') return;
    void refresh();const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    return () => { clearInterval(interval);request.current?.abort(); };
  }, [mode]);
  function changeMode(next: 'cloud' | 'netease') {
    if (next === mode) return;
    audioSession.pause();setRoom(false);setMode(next);
    const url = new URL(location.href);url.searchParams.set('mode', next);url.hash = '';
    if (next === 'cloud' && view !== 'albums') url.searchParams.set('view', view);else url.searchParams.delete('view');
    history.pushState(null, '', url);
  }
  function changeView(next: LibraryView) {
    if (next !== view) {
      setView(next);
      const url = new URL(location.href);url.hash = '';
      if (next === 'albums') url.searchParams.delete('view');else url.searchParams.set('view', next);
      history.pushState(null, '', url);
    }
    document.querySelector('.music-catalog-content')?.scrollTo({top:0});
  }
  function chooseTrack(track: MusicTrack, autoPlay = false, albumOnly = false) {
    setSelectedId(track.id);
    if (track.audioUrl) audioSession.select(asAudioTrack(track), albumOnly ? catalog.tracks.filter(item => item.audioUrl && albumKey(item) === albumKey(track)).map(asAudioTrack) : queue, autoPlay);
    else setNotice('这首歌的音源尚未连接，请刷新目录或打开洛雪。');
  }
  const playback: PlaybackPresentation = {
    track: selected, playing: active && state.playing, waiting: active && state.waiting,
    time: active ? state.time : 0, duration: active ? state.duration : 0, volume: state.volume,
    source: selected?.audioUrl ? selected.audioUrl.startsWith('/') ? '本机收藏音源' : '考拉云盘音源' : '音源待连接',
    canPrevious: trackIndex > 0, canNext: trackIndex >= 0 && trackIndex < playbackQueue.length - 1,
    onToggle: () => { if (active) audioSession.toggle();else if (selected) chooseTrack(selected, true); },
    onPrevious: () => { if (active) audioSession.next(-1, true);else { const track = catalog.tracks.find(track => track.id === playbackQueue[trackIndex - 1]?.id);if (track) chooseTrack(track, true); } },
    onNext: () => { if (active) audioSession.next(1, true);else { const track = catalog.tracks.find(track => track.id === playbackQueue[trackIndex + 1]?.id);if (track) chooseTrack(track, true); } },
    onSeek: audioSession.seek, onVolume: audioSession.setVolume,
  };
  const downloads = <LxDownloadPanel active={view === 'discover'} cloudUrl={config.cloudUrl} lxInstallUrl={config.lxInstallUrl} onComplete={() => void refresh()} onLibrary={title => { changeView('songs');setAlbumFilter('');setQuery(title);void refresh(); }} />;
  return <div className="radio-app">
    {mode === 'cloud' ? <section aria-label="本地收藏电台" className="radio-cloud">
      <LocalMusicCatalog catalog={catalog} selectedId={selected?.id || ''} view={view} setView={changeView} query={query} setQuery={setQuery} albumFilter={albumFilter} setAlbumFilter={setAlbumFilter} onSelect={chooseTrack} notice={notice} error={active ? state.error : ''} onMode={changeMode} downloadPage={downloads} />
      <RadioNowPlaying {...playback} onExpand={() => setRoom(true)} />
      <ListeningRoom {...playback} open={room} error={active ? state.error : ''} onClose={() => setRoom(false)} />
    </section> : <NetEaseMusicCatalog config={config} onMode={changeMode} />}
  </div>;
}
