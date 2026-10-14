import { useMemo, type ReactNode } from 'react';
import MusicLibraryHeader from './MusicLibraryHeader';
import MusicTrackList from './MusicTrackList';
import MusicAlbumDetail from './MusicAlbumDetail';
import AlbumArtwork from './AlbumArtwork';
import LibrarySidebar, { type LibraryView } from './LibrarySidebar';
import { type MusicCatalog, type MusicTrack } from '../../lib/music';
const albumKey = (track: MusicTrack) => JSON.stringify([track.albumArtist, track.album]);

export default function LocalMusicCatalog({ catalog, selectedId, view, setView, query, setQuery, albumFilter, setAlbumFilter, onSelect, notice, error, onMode, downloadPage }: {
  catalog: MusicCatalog; selectedId: string; view: LibraryView; setView: (view: LibraryView) => void;
  query: string; setQuery: (value: string) => void; albumFilter: string; setAlbumFilter: (value: string) => void;
  onSelect: (track: MusicTrack, autoPlay?: boolean, albumOnly?: boolean) => void; notice: string; error?: string; onMode: (mode: 'cloud' | 'netease') => void; downloadPage: ReactNode;
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
  function changeView(next: LibraryView) { setView(next);setAlbumFilter(''); }
  return <><MusicLibraryHeader mode="cloud" onMode={onMode} query={query} onQuery={setQuery} searchLabel="查找歌曲、歌手或专辑" showSearch={view !== 'discover'} /><div className="music-catalog-shell">
    <LibrarySidebar view={view} onView={changeView} onDiscover={() => changeView('discover')} source="本地收藏" />
    <div className="music-catalog-content" tabIndex={0} role="region" aria-label={view === 'discover' ? '找音乐页面' : '音乐库内容'}><div className="music-catalog-reading">
      <div hidden={view !== 'discover'} className="music-discovery-page">{downloadPage}</div>
      {view !== 'discover' && <>
      {notice && <p className="radio-notice" role="status">{notice}</p>}
      {error && <p className="radio-error" role="alert">{error}</p>}
      {activeAlbum ? <MusicAlbumDetail title={activeAlbum.album} artist={activeAlbum.albumArtist} coverUrl={activeTracks?.find(track => track.coverUrl)?.coverUrl} trackCount={activeTracks?.length || 0} onBack={() => { setAlbumFilter('');setQuery(''); }} disabled={!activeTracks?.some(track => track.audioUrl)} onPlay={() => { const first = activeTracks?.find(track => track.audioUrl);if (first) onSelect(first, true, true); }} /> : <header className="music-catalog-heading"><h2>{view === 'albums' ? '专辑' : '歌曲'}</h2><p>{catalog.tracks.length} 首歌曲 · {albums.length} 张专辑</p></header>}
      {!catalog.tracks.length ? <div className="radio-empty"><h3>还没有收藏的歌曲</h3><p>在找音乐页面搜索一首歌，下载完成后会加入曲库。</p><button type="button" className="radio-primary" onClick={() => changeView('discover')}>找音乐</button></div> : view === 'songs' || activeAlbum ? <>
        <MusicTrackList tracks={tracks} selectedId={selectedId} onSelect={track => onSelect(track, true, Boolean(activeAlbum))} />{!tracks.length && <p className="radio-empty-result">没有找到匹配的歌曲。试试其他关键词。</p>}
      </> : <><ul className="radio-album-list local-albums music-catalog-albums">{filteredAlbums.map(([key, tracks]) => <li key={key}><button type="button" aria-label={`查看专辑：${tracks[0].album}`} onClick={() => { setAlbumFilter(key);setQuery(''); }}><AlbumArtwork className="local-album-art" src={tracks.find(track => track.coverUrl)?.coverUrl} title={tracks[0].album} artist={tracks[0].albumArtist} /><strong>{tracks[0].album}</strong><span>{tracks[0].albumArtist}</span><small>{tracks.length} 首歌曲</small></button></li>)}</ul>{!filteredAlbums.length && <p className="radio-empty-result">没有找到匹配的专辑。</p>}</>}
      <div className="music-catalog-footer">
      {catalog.updatedAt && <p className="radio-updated">目录更新于 <time dateTime={catalog.updatedAt}>{new Date(catalog.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</time></p>}
      <p className="radio-design-credit">专辑与唱片机来源 · <a href={`${import.meta.env.BASE_URL}music/attribution.txt`}>来源与许可</a></p></div>
      </>}
    </div></div>
  </div></>;
}
