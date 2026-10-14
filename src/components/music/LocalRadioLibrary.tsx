import { useMemo } from 'react';
import AlbumArtwork from './AlbumArtwork';
import { formatDuration, type MusicCatalog, type MusicTrack } from '../../lib/music';
const albumKey = (track: MusicTrack) => JSON.stringify([track.albumArtist, track.album]);

export default function LocalRadioLibrary({ catalog, selectedId, view, setView, query, setQuery, albumFilter, setAlbumFilter, onSelect, onOpenAlbum, busy, onRefresh, notice }: {
  catalog: MusicCatalog; selectedId: string; view: 'songs' | 'albums'; setView: (view: 'songs' | 'albums') => void;
  query: string; setQuery: (value: string) => void; albumFilter: string; setAlbumFilter: (value: string) => void;
  onSelect: (track: MusicTrack, autoPlay?: boolean) => void; busy: boolean; onRefresh: () => void; notice: string;
  onOpenAlbum: (id: string) => void;
}) {
  const albums = useMemo(() => {
    const groups = new Map<string, MusicTrack[]>();
    for (const t of catalog.tracks) { const key = albumKey(t);groups.set(key, [...(groups.get(key) || []), t]); }
    return [...groups.entries()];
  }, [catalog]);
  const normalized = query.trim().toLocaleLowerCase();
  const matches = (t: MusicTrack) => `${t.title} ${t.artist} ${t.album}`.toLocaleLowerCase().includes(normalized);
  const tracks = catalog.tracks.filter(t => (!albumFilter || albumKey(t) === albumFilter) && matches(t));
  const filteredAlbums = albums.filter(([, tracks]) => tracks.some(matches));
  const activeAlbum = albums.find(([key]) => key === albumFilter)?.[1][0];
  return <>
    <div className="radio-library-heading"><div className="radio-view" role="group" aria-label="目录视图"><button type="button" aria-pressed={view === 'albums'} onClick={() => { setView('albums');setAlbumFilter(''); }}>专辑</button><button type="button" aria-pressed={view === 'songs'} onClick={() => { setView('songs');setAlbumFilter(''); }}>单曲</button></div><button type="button" className="radio-refresh" disabled={busy} onClick={onRefresh}>{busy ? '刷新中…' : '刷新目录'}</button></div>
    <label className="radio-search"><span className="radio-sr-only">查找歌曲、歌手或专辑</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索歌曲、歌手或专辑" /></label><p className="radio-notice" role="status">{notice}</p>
    <div className="radio-library-results">
    {activeAlbum && <div className="radio-filter"><p>{activeAlbum.album}</p><button type="button" onClick={() => setAlbumFilter('')}>查看全部单曲</button></div>}
    {!catalog.tracks.length ? <div className="radio-empty"><h3>目录还没有接进来</h3><p>用洛雪下载歌曲，再将音乐文件夹连接到考拉云盘。</p><a className="radio-link" href="#radio-download" onClick={() => { const panel = document.getElementById('radio-download');if (panel instanceof HTMLDetailsElement) panel.open = true; }}>去洛雪找一首歌</a></div> : view === 'songs' ? <><p className="radio-results">{tracks.length} 首单曲</p><ol className="radio-track-list">{tracks.map((track, index) => <li key={track.id}><button type="button" className="radio-track" aria-pressed={selectedId === track.id} onClick={() => onSelect(track, true)}><span className="radio-track-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="radio-track-info"><strong>{track.title}</strong><span>{track.artist}<span className="radio-track-album"> · {track.album}</span></span></span><span className="radio-track-meta"><span>{track.format.toUpperCase()}</span><span>{formatDuration(track.duration)}</span></span></button></li>)}</ol>{!tracks.length && <p className="radio-empty-result">没有找到匹配的歌曲。试试其他关键词。</p>}</> : <><p className="radio-results">{filteredAlbums.length} 张专辑</p><ul className="radio-album-list local-albums">{filteredAlbums.map(([key, tracks]) => <li key={key}><button type="button" onClick={() => onOpenAlbum(key)}><AlbumArtwork className="local-album-art" src={tracks.find(t => t.coverUrl)?.coverUrl} title={tracks[0].album} artist={tracks[0].albumArtist} /><strong>{tracks[0].album}</strong><span>{tracks[0].albumArtist}</span><small>{tracks.length} 首</small></button></li>)}</ul>{!filteredAlbums.length && <p className="radio-empty-result">没有找到匹配的专辑。</p>}</>}
    </div>{catalog.updatedAt && <p className="radio-updated">目录更新于 <time dateTime={catalog.updatedAt}>{new Date(catalog.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</time></p>}
  </>;
}
