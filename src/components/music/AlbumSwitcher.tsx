import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import AlbumArtwork from './AlbumArtwork';
import { formatDuration } from '../../lib/music';

const JewelCaseScene = lazy(() => import('./JewelCaseScene'));
export interface SwitcherTrack { id: string; title: string; artist: string; duration: number; playable: boolean; }
export interface SwitcherAlbum { id: string; title: string; artist: string; coverUrl?: string | null; tracks: SwitcherTrack[]; }
class SceneBoundary extends Component<{ children: ReactNode; album: SwitcherAlbum; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? <div className="album-case-fallback"><AlbumArtwork src={this.props.album.coverUrl} title={this.props.album.title} artist={this.props.album.artist} /><p>3D 视图暂时不可用，仍可选择曲目。</p></div> : this.props.children; }
}

export default function AlbumSwitcher({ albums, initialAlbumId, currentTrackId, onPlay, onClose }: {
  albums: SwitcherAlbum[]; initialAlbumId?: string; currentTrackId?: string; onPlay: (id: string) => void; onClose: () => void;
}) {
  const start = Math.max(0, albums.findIndex(a => a.id === initialAlbumId));
  const [index, setIndex] = useState(start);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const [changeKey, setChangeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewAngle, setViewAngle] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const artwork = useRef<HTMLDivElement>(null);
  const previousArtwork = useRef<HTMLDivElement>(null);
  const indexRef = useRef(start);
  const busyRef = useRef(false);
  const pending = useRef<number | null>(null);
  const nextFrame = useRef(0);
  const moveRef = useRef<(target: number) => void>(() => {});
  const album = albums[index] || albums[0];
  useEffect(() => {
    const el = dialog.current;if (!el) return;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);update();preference.addEventListener('change', update);
    const previousOverflow = document.body.style.overflow;document.body.style.overflow = 'hidden';
    el.showModal();heading.current?.focus();
    return () => { cancelAnimationFrame(nextFrame.current);pending.current = null;preference.removeEventListener('change', update);el.close();document.body.style.overflow = previousOverflow;origin?.focus({ preventScroll: true }); };
  }, []);
  function moveTo(target: number) {
    const next = Math.min(albums.length - 1, Math.max(0, target));
    if (busyRef.current) { pending.current = next;return; }
    const previous = indexRef.current;if (next === previous) return;
    setOpen(false);setViewAngle(0);setDirection(next > previous ? 1 : -1);indexRef.current = next;
    if (reduced || sceneFailed) { setIndex(next);setOutgoing(null);return; }
    busyRef.current = true;setBusy(true);setOutgoing(previous);setIndex(next);setChangeKey(key => key + 1);
  }
  moveRef.current = moveTo;
  const settled = useCallback(() => {
    if (!busyRef.current) return;
    busyRef.current = false;setBusy(false);setOutgoing(null);
    const latest = pending.current;pending.current = null;
    if (latest !== null && latest !== indexRef.current) nextFrame.current = requestAnimationFrame(() => moveRef.current(latest));
  }, []);
  if (!album) return null;
  const selectedTrack = album.tracks.find(t => t.id === currentTrackId) || album.tracks[0];
  function sceneFailure() { pending.current = null;busyRef.current = false;setBusy(false);setOutgoing(null);setSceneFailed(true); }
  return <dialog ref={dialog} className="album-switcher" aria-labelledby="album-switcher-title" onCancel={event => { event.preventDefault();onClose(); }}>
    <header className="album-switcher-heading"><h2 ref={heading} id="album-switcher-title" tabIndex={-1}>选择专辑与歌曲</h2><button type="button" className="album-switcher-close" aria-label="关闭专辑切换" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>
    <div className="album-switcher-body"><div className="album-switcher-visual">
      <div className="album-case-stage" aria-busy={busy} data-album={album.title}><SceneBoundary album={album} onFailure={sceneFailure}><Suspense fallback={<p className="album-case-loading" role="status">正在准备专辑盒…</p>}><JewelCaseScene album={album} outgoing={outgoing === null ? null : albums[outgoing]} direction={direction} changeKey={changeKey} open={open} angle={viewAngle} reduced={reduced} artwork={artwork} previousArtwork={previousArtwork} onToggle={() => { if (!busyRef.current) setOpen(value => !value); }} onSettled={settled} /></Suspense></SceneBoundary>
        {!sceneFailed && [outgoing === null ? null : albums[outgoing], album].map((item, slot) => item && <div key={slot} className="album-case-disc-layer" aria-hidden="true"><div className="album-case-disc-camera"><div ref={slot === 0 ? previousArtwork : artwork} className="album-case-disc-transform"><div className="album-case-disc-art"><AlbumArtwork src={item.coverUrl} title={item.title} artist={item.artist} /></div></div></div></div>)}
      </div>
      <div className="album-case-actions"><button type="button" disabled={busy} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? '合上专辑盒' : '打开专辑盒'}</button><button type="button" disabled={busy} onClick={() => setViewAngle(value => value === 0 ? .7 : 0)}>{viewAngle ? '回到正面' : '转动查看'}</button></div><p className="album-case-hint">点击盒盖开合，拖动查看角度。浏览不会打断正在播放的音乐。</p>
      <div className="album-case-navigation"><button type="button" aria-label="上一张专辑" disabled={index === 0} onClick={() => moveTo(indexRef.current - 1)}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg></button><span role="status">{busy ? '正在切换专辑…' : `${index + 1} / ${albums.length}`}</span><button type="button" aria-label="下一张专辑" disabled={index === albums.length - 1} onClick={() => moveTo(indexRef.current + 1)}><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg></button></div>
      <ul className="album-case-thumbnails" aria-label="选择专辑">{albums.map((item, itemIndex) => <li key={item.id}><button type="button" aria-label={`查看专辑：${item.title}`} aria-pressed={index === itemIndex} onClick={() => moveTo(itemIndex)}><AlbumArtwork src={item.coverUrl} title={item.title} artist={item.artist} /></button></li>)}</ul>
    </div><section className="album-switcher-track-panel" aria-label="专辑曲目"><h3>{album.title}</h3><p>{album.artist} · {album.tracks.length} 首</p><button type="button" className="album-case-play" disabled={busy || !selectedTrack?.playable} onClick={() => { onPlay(selectedTrack.id);onClose(); }}>收听这张专辑</button>
      <ol className="album-case-tracks">{album.tracks.map((track, trackIndex) => <li key={track.id}><button type="button" disabled={busy || !track.playable} aria-label={`播放：${track.title}`} aria-current={track.id === currentTrackId ? 'true' : undefined} onClick={() => { onPlay(track.id);onClose(); }}><span>{String(trackIndex + 1).padStart(2, '0')}</span><span><strong>{track.title}</strong><small>{track.playable ? track.artist : '音源待连接'}</small></span><span>{formatDuration(track.duration)}</span></button></li>)}</ol>
    </section></div>
  </dialog>;
}
