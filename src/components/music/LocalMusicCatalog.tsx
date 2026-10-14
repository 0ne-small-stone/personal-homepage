import { useMemo, type ReactNode } from 'react';
import MusicLibraryHeader from './MusicLibraryHeader';
import MusicTrackList from './MusicTrackList';
import { MusicIcon } from './RadioNowPlaying';
import AlbumArtwork from './AlbumArtwork';
import LibrarySidebar from './LibrarySidebar';
import { lxSearchUrl, type MusicCatalog, type MusicTrack } from '../../lib/music';
const albumKey = (track: MusicTrack) => JSON.stringify([track.albumArtist, track.album]);

export default function LocalMusicCatalog({ catalog, selectedId, view, setView, query, setQuery, albumFilter, setAlbumFilter, onSelect, notice, error, onMode, footer }: {
  catalog: MusicCatalog; selectedId: string; view: 'songs' | 'albums'; setView: (view: 'songs' | 'albums') => void;
  query: string; setQuery: (value: string) => void; albumFilter: string; setAlbumFilter: (value: string) => void;
  onSelect: (track: MusicTrack, autoPlay?: boolean, albumOnly?: boolean) => void; notice: string; error?: string; onMode: (mode: 'cloud' | 'netease') => void; footer: ReactNode;
}) {
  const albums = useMemo(() => {
    const groups = new Map<string, MusicTrack[]>();
    for (const track of catalog.tracks) { const key = albumKey(track);groups.set(key, [...(groups.get(key) || []), track]); }
    return [...groups.entries()];
  }, [catalog]);
  const normalized = query.trim().toLocaleLowerCase();
  const matches = (track: MusicTrack) => `${track.title} ${track.artist} ${track.album}`.toLocaleLowerCase().includes(normalized);
  const tracks = catalog.tracks.filter(track => (!albumFilter || albumKey(track) === albumFilter) && matches(track));
  const filteredAlbums = albums.filter(([, tracks]) => tracks.some(matches));
  const activeTracks = albums.find(([key]) => key === albumFilter)?.[1];
  const activeAlbum = activeTracks?.[0];
  function changeView(next: 'albums' | 'songs') { setView(next);setAlbumFilter(''); }
  return <><MusicLibraryHeader mode="cloud" onMode={onMode} query={query} onQuery={setQuery} searchLabel="查找歌曲、歌手或专辑" /><div className="music-catalog-shell">
    <LibrarySidebar view={view} onView={changeView} source="本地收藏"><a href={lxSearchUrl('Echoes')} className="music-sidebar-link">打开洛雪下载</a><a href="#radio-download" className="music-sidebar-link" onClick={() => { const panel = document.getElementById('radio-download');if (panel instanceof HTMLDetailsElement) panel.open = true; }}>下载与音源</a></LibrarySidebar>
    <div className="music-catalog-content" tabIndex={0} role="region" aria-label="音乐库内容"><div className="music-catalog-reading">
      {notice && <p className="radio-notice" role="status">{notice}</p>}
      {error && <p className="radio-error" role="alert">{error}</p>}
      {activeAlbum ? <>
        <button type="button" className="music-library-back" onClick={() => { setAlbumFilter('');setQuery(''); }}><MusicIcon name="back" /><span>返回专辑</span></button>
        <header className="music-album-detail"><AlbumArtwork src={activeTracks?.find(track => track.coverUrl)?.coverUrl} title={activeAlbum.album} artist={activeAlbum.albumArtist} /><div><h2>{activeAlbum.album}</h2><p>{activeAlbum.albumArtist}</p><small>{activeTracks?.length} 首歌曲</small><div className="music-album-actions"><button type="button" className="radio-primary" disabled={!activeTracks?.some(track => track.audioUrl)} onClick={() => { const first = activeTracks?.find(track => track.audioUrl);if (first) onSelect(first, true, true); }}>播放专辑</button></div></div></header>
      </> : <header className="music-catalog-heading"><h2>{view === 'albums' ? '专辑' : '歌曲'}</h2><p>{catalog.tracks.length} 首歌曲 · {albums.length} 张专辑</p></header>}
      {!catalog.tracks.length ? <div className="radio-empty"><h3>目录还没有接进来</h3><p>用洛雪下载歌曲，再将音乐文件夹连接到考拉云盘。</p><a className="radio-link" href="#radio-download" onClick={() => { const panel = document.getElementById('radio-download');if (panel instanceof HTMLDetailsElement) panel.open = true; }}>去洛雪找一首歌</a></div> : view === 'songs' || activeAlbum ? <>
        <MusicTrackList tracks={tracks} selectedId={selectedId} onSelect={track => onSelect(track, true, Boolean(activeAlbum))} />{!tracks.length && <p className="radio-empty-result">没有找到匹配的歌曲。试试其他关键词。</p>}
      </> : <><ul className="radio-album-list local-albums music-catalog-albums">{filteredAlbums.map(([key, tracks]) => <li key={key}><button type="button" aria-label={`查看专辑：${tracks[0].album}`} onClick={() => { setAlbumFilter(key);setQuery(''); }}><AlbumArtwork className="local-album-art" src={tracks.find(track => track.coverUrl)?.coverUrl} title={tracks[0].album} artist={tracks[0].albumArtist} /><strong>{tracks[0].album}</strong><span>{tracks[0].albumArtist}</span><small>{tracks.length} 首歌曲</small></button></li>)}</ul>{!filteredAlbums.length && <p className="radio-empty-result">没有找到匹配的专辑。</p>}</>}
      <div className="music-catalog-footer">{footer}
      {catalog.updatedAt && <p className="radio-updated">目录更新于 <time dateTime={catalog.updatedAt}>{new Date(catalog.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</time></p>}
      <p className="radio-design-credit">专辑与唱片机来源 · <a href={`${import.meta.env.BASE_URL}music/attribution.txt`}>来源与许可</a></p></div>
    </div></div>
  </div></>;
}
