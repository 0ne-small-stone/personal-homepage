import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDuration, lxSearchUrl, parseMusicCatalog, qualityLabel, type MusicCatalog, type MusicTrack } from '../../lib/music';

interface Props {
  initialCatalog: MusicCatalog;
  config: { cloudUrl: string; lxInstallUrl: string; lxSourceUrl: string; playlistUrl: string; playlistEmbedUrl: string; catalogUrl: string };
}

export default function RadioPlayer({ initialCatalog, config }: Props) {
  const [mode, setMode] = useState<'cloud' | 'netease'>('cloud');
  const [catalog, setCatalog] = useState(initialCatalog);
  const [view, setView] = useState<'songs' | 'albums'>('songs');
  const [query, setQuery] = useState('');
  const [downloadQuery, setDownloadQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialCatalog.tracks[0]?.id || '');
  const [albumFilter, setAlbumFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [embedScale, setEmbedScale] = useState(1);
  const audio = useRef<HTMLAudioElement>(null);
  const embed = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const selected = catalog.tracks.find(track => track.id === selectedId) || catalog.tracks[0];
  const albumKey = (track: MusicTrack) => JSON.stringify([track.albumArtist, track.album]);
  const albums = useMemo(() => {
    const groups = new Map<string, { name: string; artist: string; tracks: MusicTrack[] }>();
    for (const track of catalog.tracks) {
      const key = albumKey(track);
      if (!groups.has(key)) groups.set(key, { name: track.album, artist: track.albumArtist, tracks: [] });
      groups.get(key)!.tracks.push(track);
    }
    return [...groups.entries()];
  }, [catalog]);
  const normalized = query.trim().toLocaleLowerCase();
  const visibleTracks = catalog.tracks.filter(track => (!albumFilter || albumKey(track) === albumFilter) && `${track.title} ${track.artist} ${track.album}`.toLocaleLowerCase().includes(normalized));
  const visibleAlbums = albums.filter(([, album]) => `${album.name} ${album.artist} ${album.tracks.map(t => t.title).join(' ')}`.toLocaleLowerCase().includes(normalized));

  async function refresh(manual = false) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    if (manual) setBusy(true);
    try {
      const response = await fetch(config.catalogUrl, { cache: 'no-store', credentials: 'omit', signal: controller.signal });
      if (!response.ok) throw new Error('无法读取曲目清单');
      const next = parseMusicCatalog(await response.json());
      if (!mounted.current) return;
      setCatalog(next);
      setNotice(manual ? `目录已刷新，共 ${next.tracks.length} 首。` : '');
    } catch {
      if (mounted.current && !controller.signal.aborted) setNotice('目录暂时无法更新，保留上次曲目。请稍后刷新。');
    } finally {
      if (mounted.current && !controller.signal.aborted) setBusy(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    const restore = () => setMode(new URL(location.href).searchParams.get('mode') === 'netease' ? 'netease' : 'cloud');
    restore();
    window.addEventListener('popstate', restore);
    return () => {
      mounted.current = false;
      request.current?.abort();
      window.removeEventListener('popstate', restore);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'cloud') return;
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    return () => { clearInterval(interval); request.current?.abort(); setBusy(false); };
  }, [mode]);

  useEffect(() => { setPlayerError(''); }, [selected?.id, selected?.audioUrl]);

  useEffect(() => {
    const container = embed.current;
    if (mode !== 'netease' || !container) return;
    const fit = () => setEmbedScale(Math.min(1, container.clientWidth / 330));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [mode]);

  function changeMode(next: 'cloud' | 'netease') {
    if (next === mode) return;
    audio.current?.pause();
    setMode(next);
    const url = new URL(location.href);
    url.searchParams.set('mode', next);
    history.pushState(null, '', url);
  }

  function chooseTrack(track: MusicTrack) {
    audio.current?.pause();
    setSelectedId(track.id);
    setPlayerError('');
  }

  const activeAlbum = albums.find(([key]) => key === albumFilter)?.[1];
  return <div className="radio-app">
    <div className="radio-mode" role="group" aria-label="音源模式">
      <button type="button" aria-pressed={mode === 'cloud'} onClick={() => changeMode('cloud')}>考拉云盘</button>
      <button type="button" aria-pressed={mode === 'netease'} onClick={() => changeMode('netease')}>网易云音乐</button>
    </div>

    {mode === 'cloud' ? <section aria-label="考拉云盘电台" className="radio-cloud">
      <div className="radio-toolbar">
        <p>{catalog.tracks.length ? `${catalog.tracks.length} 首单曲，${albums.length} 张专辑` : '音乐目录待连接'}<span>洛雪下载 · 考拉收藏</span></p>
        <a className="radio-link" href={lxSearchUrl(downloadQuery.trim() || (selected ? `${selected.title} ${selected.artist}` : 'Echoes'))}>下载音乐（打开洛雪）</a>
      </div>
      <div className="radio-desk">
        <aside className="radio-now" aria-label="当前曲目">
          <div className="radio-cover" aria-hidden="true"><span>{selected?.artist.slice(0, 1) || '♪'}</span><small>{selected ? '已下载收藏' : 'Echoes'}</small></div>
          <p className="radio-caption">{selected ? '当前曲目' : '等待第一首歌'}</p>
          <h2>{selected?.title || '把喜欢的声音留在这里。'}</h2>
          {selected && <><p className="radio-artist">{selected.artist}</p><p className="radio-album-name">{selected.album}</p><p className="radio-quality">{qualityLabel(selected)}</p></>}
          {selected?.audioUrl ? <>
            <audio ref={audio} key={selected.audioUrl} src={selected.audioUrl} controls preload="none" aria-label={`播放 ${selected.title}`} onError={() => setPlayerError('音频暂时无法播放。请检查云盘分享，或打开洛雪收听。')} onEnded={() => {
              const index = visibleTracks.findIndex(t => t.id === selected.id);
              const next = index >= 0 ? visibleTracks[index + 1] : undefined;
              if (next?.audioUrl) chooseTrack(next);
            }} />
            {playerError && <p role="alert" className="radio-error">{playerError}</p>}
          </> : <div className="radio-unlinked"><button type="button" disabled>播放待连接</button><p>已下载的歌曲信息可以浏览。连接考拉音乐文件夹后，可在这里收听。</p></div>}
          {selected && <a className="radio-link" href={lxSearchUrl(`${selected.title} ${selected.artist}`)}>在洛雪中打开</a>}
        </aside>

        <div className="radio-library">
          <div className="radio-library-heading">
            <div className="radio-view" role="group" aria-label="目录视图">
              <button type="button" aria-pressed={view === 'songs'} onClick={() => { setView('songs'); setAlbumFilter(''); }}>单曲</button>
              <button type="button" aria-pressed={view === 'albums'} onClick={() => { setView('albums'); setAlbumFilter(''); }}>专辑</button>
            </div>
            <button type="button" className="radio-refresh" disabled={busy} onClick={() => void refresh(true)}>{busy ? '刷新中…' : '刷新目录'}</button>
          </div>
          <label className="radio-search"><span>查找歌曲、歌手或专辑</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索收藏" /></label>
          <p className="radio-notice" role="status">{notice}</p>
          {activeAlbum && <div className="radio-filter"><p>{activeAlbum.name}</p><button type="button" onClick={() => setAlbumFilter('')}>查看全部单曲</button></div>}
          {!catalog.tracks.length ? <div className="radio-empty"><h3>目录还没有接进来</h3><p>用洛雪下载歌曲，再将音乐文件夹连接到考拉云盘。</p><a className="radio-link" href="#radio-download">去洛雪找一首歌</a></div> : view === 'songs' ? <>
            <p className="radio-results">{visibleTracks.length} 首{normalized ? '匹配' : ''}单曲</p>
            <ol className="radio-track-list">
              {visibleTracks.map((track, index) => <li key={track.id}><button type="button" className="radio-track" aria-pressed={selected?.id === track.id} onClick={() => chooseTrack(track)}>
                <span className="radio-track-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="radio-track-info"><strong>{track.title}</strong><span>{track.artist}<span className="radio-track-album"> · {track.album}</span></span></span>
                <span className="radio-track-meta"><span>{track.format.toUpperCase()}</span><span>{formatDuration(track.duration)}</span></span>
              </button></li>)}
            </ol>
            {!visibleTracks.length && <p className="radio-empty-result">没有找到匹配的歌曲。试试其他关键词。</p>}
          </> : <>
            <p className="radio-results">{visibleAlbums.length} 张{normalized ? '匹配' : ''}专辑</p>
            <ul className="radio-album-list">{visibleAlbums.map(([key, album]) => <li key={key}><button type="button" onClick={() => { setAlbumFilter(key); setView('songs'); setQuery(''); chooseTrack(album.tracks[0]); }}><span className="radio-album-art" aria-hidden="true">{album.artist.slice(0, 1)}</span><strong>{album.name}</strong><span>{album.artist}</span><small>{album.tracks.length} 首</small></button></li>)}</ul>
            {!visibleAlbums.length && <p className="radio-empty-result">没有找到匹配的专辑。</p>}
          </>}
          {catalog.updatedAt && <p className="radio-updated">目录更新时间 <time dateTime={catalog.updatedAt}>{new Date(catalog.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</time></p>}
        </div>
      </div>

      <section className="radio-download" id="radio-download" aria-labelledby="download-title">
        <div><h2 id="download-title">在洛雪里找音乐</h2><p>打开洛雪，选择这首歌可用的最高音质下载。下载后，电台按真实文件整理单曲和专辑。</p></div>
        <form onSubmit={event => { event.preventDefault(); const words = downloadQuery.trim(); if (words) location.href = lxSearchUrl(words); }}>
          <label htmlFor="lx-keywords">歌曲或歌手</label><div className="radio-download-fields"><input id="lx-keywords" value={downloadQuery} onChange={event => setDownloadQuery(event.target.value)} placeholder="例如：Echoes 或 Pink Floyd" required maxLength={200} /><button type="submit" className="radio-primary">打开洛雪下载</button></div>
          <p className="radio-hint">浏览器可能会询问是否打开洛雪。音质和下载操作在洛雪中完成。</p>
        </form>
        <div className="radio-help"><a className="radio-link" href={config.lxInstallUrl} target="_blank" rel="noopener noreferrer">安装洛雪（新窗口）</a><a className="radio-link" href={config.lxSourceUrl} target="_blank" rel="noopener noreferrer">音源更新（新窗口）</a><a className="radio-link" href={config.cloudUrl} target="_blank" rel="noopener noreferrer">打开考拉云盘（新窗口）</a></div>
      </section>
    </section> : <section className="radio-netease" aria-label="网易云音乐电台">
      <div className="radio-netease-copy"><p className="radio-caption">共享歌单</p><h2>Echoes</h2><p>陈世先stt 的共享歌单。一起听，也让喜欢的歌继续回响。</p><a className="radio-link" href={config.playlistUrl} target="_blank" rel="noopener noreferrer">在网易云打开歌单（新窗口）</a><p className="radio-hint">播放由网易云提供。如果播放器空白或歌曲无法播放，请打开原歌单收听。</p></div>
      <div ref={embed} className="radio-embed" style={{ height: 450 * embedScale }}><iframe title="Echoes 网易云共享歌单播放器" src={config.playlistEmbedUrl} width="330" height="450" style={{ transform: `scale(${embedScale})` }} allow="encrypted-media" referrerPolicy="strict-origin-when-cross-origin" /></div>
    </section>}
  </div>;
}
