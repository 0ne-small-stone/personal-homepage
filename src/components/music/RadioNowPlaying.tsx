import {useAudioSession} from './useAudioSession';
import type { CSSProperties } from 'react';
import AlbumArtwork from './AlbumArtwork';
import { formatDuration, type MusicTrack } from '../../lib/music';

export interface PlaybackPresentation {
  track?: MusicTrack; playing: boolean; waiting?: boolean; time: number; duration: number; volume: number; source: string; notice?: string;
  canPrevious: boolean; canNext: boolean; onToggle: () => void; onPrevious: () => void; onNext: () => void;
  onSeek: (value: number) => void; onVolume: (value: number) => void;
}

export function MusicIcon({ name }: { name: 'play' | 'pause' | 'previous' | 'next' | 'volume' | 'expand' | 'back' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{name === 'play' ? <path d="m9 5 10 7-10 7Z" /> : name === 'pause' ? <path d="M8 5v14M16 5v14" /> : name === 'previous' ? <path d="M5 5v14m14-14L9 12l10 7Z" /> : name === 'next' ? <path d="M19 5v14M5 5l10 7-10 7Z" /> : name === 'volume' ? <path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : name === 'back' ? <path d="m14 5-7 7 7 7" /> : <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />}</svg>;
}

export function PlaybackControls(props: PlaybackPresentation) {
  const live=useAudioSession();
  const current=live.track?.id===props.track?.id;
  const { track, playing, waiting, duration, volume, canPrevious, canNext, onToggle, onPrevious, onNext, onSeek, onVolume } = props;
  const time=current?live.time:props.time;
  const active = playing || waiting;
  return <>
    <div className="music-playback-center">
      <div className="music-transport"><button type="button" aria-label="上一首" disabled={!canPrevious} onClick={onPrevious}><MusicIcon name="previous" /></button><button type="button" className="music-play-button" aria-label={active ? '暂停' : '播放'} disabled={!track?.audioUrl} onClick={onToggle}><MusicIcon name={active ? 'pause' : 'play'} /></button><button type="button" aria-label="下一首" disabled={!canNext} onClick={onNext}><MusicIcon name="next" /></button></div>
      <label className="music-progress"><span>{time > 0 ? formatDuration(time) : '0:00'}</span><input type="range" aria-label="播放进度" min="0" max={duration || 1} step=".1" value={Math.min(time, duration || 1)} disabled={!duration} style={{ '--range-fill': `${duration ? Math.min(100, time / duration * 100) : 0}%` } as CSSProperties} onChange={event => onSeek(Number(event.target.value))} /><span>{formatDuration(duration || track?.duration || 0)}</span></label>
      {waiting && <span className="radio-sr-only" role="status">正在缓冲</span>}
    </div>
    <label className="music-volume"><MusicIcon name="volume" /><input type="range" aria-label="音量" min="0" max="1" step=".01" value={volume} style={{ '--range-fill': `${volume * 100}%` } as CSSProperties} onChange={event => onVolume(Number(event.target.value))} /></label>
  </>;
}

export default function RadioNowPlaying(props: PlaybackPresentation & { onExpand: () => void }) {
  return <section className="music-now-playing" aria-label="当前播放">
    <button type="button" className="music-now-track" onClick={props.onExpand} aria-label="打开黑胶播放页"><AlbumArtwork src={props.track?.coverUrl} title={props.track?.album || 'Echoes'} artist={props.track?.artist || ''} /><span><strong>{props.track?.title || '还没有选择歌曲'}</strong><small>{props.track?.artist || '从音乐库选一首歌'}{props.waiting ? ' · 正在缓冲' : ''}</small></span></button>
    <PlaybackControls {...props} />
  </section>;
}
