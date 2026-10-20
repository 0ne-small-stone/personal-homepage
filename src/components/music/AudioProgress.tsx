import type { CSSProperties } from 'react';
import { audioSession } from '../../lib/audio-session';
import { useAudioSession } from './useAudioSession';
import { markMusicRender } from './render-profile';

export default function AudioProgress({ trackId, className }: { trackId?: string; className: string }) {
  const state = useAudioSession();
  markMusicRender('progress');
  const active = state.track?.id === trackId;
  const duration = active ? state.duration : 0, time = active ? state.time : 0;
  return <input className={className} type="range" min="0" max={duration || 1} step=".1"
    value={Math.min(time, duration || 1)} disabled={!duration} aria-label="播放进度"
    style={{ '--progress': `${duration ? time / duration * 100 : 0}%` } as CSSProperties}
    onChange={event => audioSession.seek(Number(event.target.value))} />;
}
