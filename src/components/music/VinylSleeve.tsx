import { useEffect, useRef, useState } from 'react';
import AlbumArtwork from './AlbumArtwork';

/** Independently implemented sleeve/disc composition; visual reference: COMPScout. */
export default function VinylSleeve({ title, artist, coverUrl, selected, onSelect, action = '查看曲目', playing = false, progress = 0, actionIcon = 'play' }: {
  title: string; artist: string; coverUrl?: string | null; selected: boolean; onSelect: () => void; action?: string; playing?: boolean; progress?: number; actionIcon?: 'play' | 'open';
}) {
  const button = useRef<HTMLButtonElement>(null);
  const [motionVisible, setMotionVisible] = useState(false);
  useEffect(() => {
    const element = button.current;
    if (!element) return;
    let inView = false;
    const update = () => setMotionVisible(inView && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return <button ref={button} type="button" className={`vinyl-sleeve ${selected ? 'is-selected' : ''} ${playing ? 'is-playing' : ''}`} data-motion-visible={motionVisible} aria-pressed={selected} aria-label={`${action}：${title}`} onClick={onSelect}>
    <span className="sleeve-composition" aria-hidden="true">
      <span className="sleeve-record-pocket"><span className="sleeve-record"><span className="sleeve-record-label">{artist.slice(0, 1)}<i /></span></span></span>
      <span className="sleeve-cover"><AlbumArtwork src={coverUrl} title={title} artist={artist} /><span className="sleeve-cover-overlay"><strong>{title}</strong><small>{artist}</small><span className="sleeve-action">{action}<span className="sleeve-play-circle"><svg viewBox="0 0 24 24">{actionIcon === 'open' ? <path d="m9 5 7 7-7 7" /> : playing ? <path d="M8 5v14M16 5v14" /> : <path d="m9 5 10 7-10 7Z" />}</svg></span></span>{selected && <span className="sleeve-progress"><span style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} /></span>}</span></span>
    </span>
    <span className="sleeve-caption"><strong>{title}</strong><span>{artist}</span></span>
  </button>;
}
