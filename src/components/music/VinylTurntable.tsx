import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import AlbumArtwork from './AlbumArtwork';
import type { MusicTrack } from '../../lib/music';
import { tonearmAngle, turntableLayout } from '../../lib/turntable-geometry';
import { albumIdentity, jacketChoreography, jacketMotionStyle } from '../../lib/album-presentation';

type AlbumPresentation = { album: string; display?: MusicTrack; outgoing?: MusicTrack; revision: number };

// Composition adapted from Ventuss-OvO/Vinyl-Vue (CC BY-NC 4.0).
// The metal tonearm is an original generated bitmap; geometry is calibrated here.
export default function VinylTurntable({ track, playing, progress, onToggle, onLibrary, active = true }: {
  track?: MusicTrack; playing: boolean; progress: number; onToggle: () => void; onLibrary?: () => void; active?: boolean;
}) {
  const base = import.meta.env.BASE_URL;
  const latest = useRef(track);
  const reduced = useRef(false);
  const [presentation, setPresentation] = useState<AlbumPresentation>(() => ({ album: albumIdentity(track), display: track, revision: 0 }));
  const nextAlbum = albumIdentity(track);
  // Derive the outgoing snapshot before paint, so a new cover never flashes first.
  if (active && !presentation.outgoing && (nextAlbum !== presentation.album || track?.id !== presentation.display?.id || track?.coverUrl !== presentation.display?.coverUrl)) {
    setPresentation({ album: nextAlbum, display: track, outgoing: track && nextAlbum !== presentation.album && !reduced.current ? presentation.display : undefined, revision: presentation.revision + (nextAlbum !== presentation.album ? 1 : 0) });
  }
  useEffect(() => { latest.current = track; }, [track]);
  const finish = useCallback(() => {
    setPresentation(current => {
      const target = latest.current;
      const album = albumIdentity(target);
      if (!reduced.current && album !== current.album && current.display && target) {
        return { album, display: target, outgoing: current.display, revision: current.revision + 1 };
      }
      return { album, display: target, revision: current.revision };
    });
  }, []);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reduced.current = preference.matches; if (preference.matches) finish(); };
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, [finish]);
  const changing = Boolean(presentation.outgoing);
  useEffect(() => { if (!active && changing) finish(); }, [active, changing, finish]);
  useEffect(() => {
    if (!changing) return;
    const timer = window.setTimeout(finish, jacketChoreography.total + 250);
    return () => window.clearTimeout(timer);
  }, [changing, presentation.revision, finish]);
  const adoptLatest = () => setPresentation(current => ({ ...current, album: albumIdentity(latest.current), display: latest.current }));
  const angle = tonearmAngle(playing && !changing, progress);
  const artwork = (item?: MusicTrack) => <AlbumArtwork src={item?.coverUrl} title={item?.album || '等待第一张专辑'} artist={item?.albumArtist || 'Echoes'} />;
  const record = (item?: MusicTrack) => <><span className="turntable-disc" aria-hidden="true"><img className="turntable-record-art" src={`${base}music/vinyl-vue/record-surface.svg`} alt="" /><span className="turntable-label">{artwork(item)}</span></span><span className="turntable-reflection" aria-hidden="true" /><span className="turntable-spindle" aria-hidden="true" /></>;
  return <div className={`vinyl-turntable ${playing && !changing ? 'is-playing' : ''} ${changing ? 'is-changing-album' : ''}`} data-album-revision={presentation.revision} data-album-transition={changing ? 'changing' : 'idle'} style={{ ...turntableLayout, ...jacketMotionStyle, '--tonearm-angle': `${angle}deg` } as CSSProperties}>
    {presentation.outgoing && <div key={`old-${presentation.revision}`} className="turntable-scene is-outgoing" aria-hidden="true" inert onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'jacket-album-leave') adoptLatest(); }}>
      <div className="turntable-sleeve">{artwork(presentation.outgoing)}</div>
      <div className="turntable-platter"><div className="turntable-disc-button">{record(presentation.outgoing)}</div></div>
    </div>}
    <div key={`new-${presentation.revision}`} className={`turntable-scene ${changing ? 'is-incoming' : ''}`} data-visual-album={presentation.display?.album} onAnimationEnd={event => { if (event.animationName === 'jacket-disc-settle') finish(); }}>
      {onLibrary ? <button type="button" className="turntable-sleeve" disabled={changing} aria-label="查看收藏专辑" onClick={onLibrary}>{artwork(presentation.display)}<span className="turntable-sleeve-action">查看专辑</span></button> : <div className="turntable-sleeve">{artwork(presentation.display)}</div>}
      <div className="turntable-platter"><button type="button" className="turntable-disc-button" disabled={changing || !track?.audioUrl} aria-label={playing ? `暂停 ${track?.title}` : `播放 ${track?.title || '当前曲目'}`} onClick={onToggle}>{record(presentation.display)}</button></div>
    </div>
    <div className="turntable-arm-mount"><button type="button" className="turntable-tonearm" disabled={!track?.audioUrl} aria-label={playing ? '抬起唱臂并暂停' : '落下唱臂并播放'} onClick={onToggle}><span className="turntable-arm-art" aria-hidden="true"><img src={`${base}music/turntable/tonearm-metal-v1.webp`} alt="" /><span className="turntable-stylus" /></span></button></div>
  </div>;
}
