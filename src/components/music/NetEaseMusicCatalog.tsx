import { useMemo, useRef, useState, useEffect } from 'react';
import playlist from '../../data/music/netease-playlist.json';
import { type MusicTrack } from '../../lib/music';
import { audioSession, type AudioTrack } from '../../lib/audio-session';
import { useAudioSession } from './useAudioSession';
import VinylSleeve from './VinylSleeve';
import MusicLibraryHeader from './MusicLibraryHeader';
import MusicTrackList from './MusicTrackList';
import LibrarySidebar from './LibrarySidebar';
type CatalogAlbum = { id: string; title: string; artist: string; coverUrl: string; tracks: typeof playlist.tracks };
import RadioNowPlaying, { MusicIcon, type PlaybackPresentation } from './RadioNowPlaying';
import ListeningRoom from './ListeningRoom';
import type { RadioConfig } from './RadioExperience';
import RecommendationForm from './RecommendationForm';
import NetEaseAccount from './NetEaseAccount';
import '../../styles/music-recommendations.css';

const albumKey = (track: typeof playlist.tracks[number]) => `${track.artist}\n${track.album}`;
const mediaUrl = (id: string) => `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
const asAudioTrack = (track: typeof playlist.tracks[number]): AudioTrack => ({ ...track, audioUrl: mediaUrl(track.id), source: 'netease' });

export default function NetEaseMusicCatalog({ config, onMode }: { config: RadioConfig; onMode: (mode: 'cloud' | 'netease') => void }) {
  const state = useAudioSession();
  const [view, setView] = useState<'albums' | 'songs'>('albums');
  const [query, setQuery] = useState('');
  const [albumFilter, setAlbumFilter] = useState('');
  const [selectedId, setSelectedId] = useState(playlist.tracks[0]?.id || '');
  const [room, setRoom] = useState(false);
  const [officialOpen, setOfficialOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const embed = useRef<HTMLDivElement>(null);
  const officialHeading = useRef<HTMLHeadingElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const selected = playlist.tracks.find(track => track.id === (state.track?.source === 'netease' ? state.track.id : selectedId)) || playlist.tracks[0];
  const active = state.track?.source === 'netease' && state.track.id === selected?.id;
  const albums = useMemo(() => {
    const groups = new Map<string, CatalogAlbum>();
    for (const track of playlist.tracks) {
      const id = albumKey(track);
      if (!groups.has(id)) groups.set(id, { id, title: track.album, artist: track.artist, coverUrl: track.coverUrl, tracks: [] });
      groups.get(id)!.tracks.push(track);
    }
    return [...groups.values()];
  }, []);
  const normalized = query.trim().toLocaleLowerCase();
  const matches = (track: typeof playlist.tracks[number]) => `${track.title} ${track.artist} ${track.album}`.toLocaleLowerCase().includes(normalized);
  const tracks = playlist.tracks.filter(track => (!albumFilter || albumKey(track) === albumFilter) && matches(track));
  const filteredAlbums = albums.filter(album => playlist.tracks.some(track => albumKey(track) === album.id && matches(track)));
  const activeAlbum = albums.find(album => album.id === albumFilter);
  const queue = playlist.tracks.map(asAudioTrack);
  const playbackQueue = active ? state.queue : queue;
  const index = playbackQueue.findIndex(track => track.id === selected?.id);
  const vinylTrack: MusicTrack | undefined = selected ? { ...selected, albumArtist: selected.artist, trackNumber: 0, discNumber: 0, format: 'MP3', sampleRate: 0, bitsPerSample: 0, audioUrl: mediaUrl(selected.id) } : undefined;
  function select(id: string, albumOnly = false) {
    const track = playlist.tracks.find(track => track.id === id);if (!track) return;
    setOfficialOpen(false);setSelectedId(id);audioSession.select(asAudioTrack(track), albumOnly ? playlist.tracks.filter(item => albumKey(item) === albumKey(track)).map(asAudioTrack) : queue, true);
  }
  function changeView(next: 'albums' | 'songs') { setView(next);setAlbumFilter(''); }
  function openOfficial() {
    audioSession.pause();origin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;setOfficialOpen(true);
  }
  useEffect(() => {
    if (!officialOpen || !embed.current) return;
    const container = embed.current;
    const fit = () => setScale(Math.min(1, container.clientWidth / 330));fit();
    const observer = new ResizeObserver(fit);observer.observe(container);officialHeading.current?.focus();
    return () => observer.disconnect();
  }, [officialOpen]);
  const playback: PlaybackPresentation = {
    track: vinylTrack, playing: active && state.playing, waiting: active && state.waiting, time: active ? state.time : 0,
    duration: active ? state.duration : 0, volume: state.volume, source: active && state.previewSeconds ? `网易云 · ${Math.round(state.previewSeconds)} 秒试听` : '网易云共享歌单', notice: active ? state.notice : '',
    canPrevious: index > 0, canNext: index >= 0 && index < playbackQueue.length - 1,
    onToggle: () => { if (active) audioSession.toggle();else if (selected) select(selected.id); },
    onPrevious: () => { if (active) audioSession.next(-1, true);else if (playbackQueue[index - 1]) select(playbackQueue[index - 1].id); }, onNext: () => { if (active) audioSession.next(1, true);else if (playbackQueue[index + 1]) select(playbackQueue[index + 1].id); },
    onSeek: audioSession.seek, onVolume: audioSession.setVolume,
  };
  return <section className="music-net-library" aria-label="网易云音乐电台">
    <MusicLibraryHeader mode="netease" onMode={onMode} query={query} onQuery={setQuery} searchLabel="搜索共享歌单" account={<NetEaseAccount/>} />
    <div className="music-catalog-shell">
      <LibrarySidebar view={view} onView={changeView} source="网易云音乐" />
      <div className="music-catalog-content" tabIndex={0} role="region" aria-label="音乐库内容"><div className="music-catalog-reading">
        {activeAlbum ? <><button type="button" className="music-library-back" onClick={() => { setAlbumFilter('');setQuery(''); }}><MusicIcon name="back" /><span>返回专辑</span></button><header className="music-album-detail music-net-detail"><div className="music-net-detail-art"><VinylSleeve title={activeAlbum.title} artist={activeAlbum.artist} coverUrl={activeAlbum.coverUrl} selected={activeAlbum.tracks.some(track => track.id === selected?.id)} playing={active && state.playing} action="播放专辑" onSelect={() => select(activeAlbum.tracks[0].id, true)} /></div><div><h2>{activeAlbum.title}</h2><p>{activeAlbum.artist}</p><small>{activeAlbum.tracks.length} 首歌曲</small><div className="music-album-actions"><button type="button" className="radio-primary" onClick={() => select(activeAlbum.tracks[0].id, true)}>播放专辑</button></div></div></header></> : <header className="music-catalog-heading"><h2>{view === 'albums' ? '专辑' : '共享歌单'}</h2><p>Echoes · 陈世先stt · {playlist.tracks.length} 首歌曲</p></header>}
        {view === 'albums' && !activeAlbum ? <ul className="glass-album-grid music-net-albums">{filteredAlbums.map(album => <li key={album.id}><VinylSleeve title={album.title} artist={album.artist} coverUrl={album.coverUrl} selected={album.tracks.some(track => track.id === selected?.id)} playing={active && state.playing && album.tracks.some(track => track.id === selected?.id)} progress={state.duration && active ? state.time / state.duration : 0} action="查看曲目" actionIcon="open" onSelect={() => { setAlbumFilter(album.id);setQuery(''); }} /></li>)}</ul> : <MusicTrackList tracks={tracks} selectedId={selected?.id || ''} onSelect={track => select(track.id, Boolean(activeAlbum))} />}
        {!tracks.length && <p className="radio-empty-result">没有找到匹配的歌曲。试试其他关键词。</p>}
        <div className="music-catalog-secondary"><RecommendationForm apiUrl={config.recommendationApi} /><details className="music-source-options"><summary>音源选项</summary><div><a href={config.playlistUrl} target="_blank" rel="noopener noreferrer">打开共享歌单（新窗口）</a><button type="button" className="radio-refresh" aria-expanded={officialOpen} onClick={openOfficial}>使用网易云官方播放器</button><p className="radio-updated">歌单信息读取于 <time dateTime={playlist.fetchedAt}>{new Date(playlist.fetchedAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}</time></p></div></details></div>
        {active && state.error && <p className="radio-error" role="alert">{state.error}</p>}
        {active && state.notice && <p className="radio-hint" role="status">{state.notice} <a className="radio-link" href={`https://music.163.com/#/song?id=${selected.id}`} target="_blank" rel="noopener noreferrer">在网易云完整收听（新窗口）</a></p>}
        {officialOpen && <section className="glass-external-player" aria-labelledby="netease-official-heading"><div><h3 ref={officialHeading} id="netease-official-heading" tabIndex={-1}>网易云官方播放器</h3><p>歌曲权限由网易云决定。无法直接播放时，可在这里收听或打开原站。</p>{selected && <a className="radio-link" href={`https://music.163.com/#/song?id=${selected.id}`} target="_blank" rel="noopener noreferrer">打开歌曲（新窗口）</a>}<button type="button" className="radio-refresh" onClick={() => { setOfficialOpen(false);origin.current?.focus(); }}>关闭播放器</button></div><div ref={embed} className="radio-embed" style={{ height: 450 * scale }}><iframe title="Echoes 网易云共享歌单播放器" src={config.playlistEmbedUrl} width="330" height="450" style={{ transform: `scale(${scale})` }} allow="encrypted-media" referrerPolicy="strict-origin-when-cross-origin" /></div></section>}
        <p className="radio-design-credit">专辑与唱片机来源 · <a href={`${import.meta.env.BASE_URL}music/attribution.txt`}>来源与许可</a></p>
      </div></div>
    </div>
    <RadioNowPlaying {...playback} onExpand={() => setRoom(true)} />
    <ListeningRoom {...playback} open={room} error={active ? state.error : ''} onClose={() => setRoom(false)} />
  </section>;
}
