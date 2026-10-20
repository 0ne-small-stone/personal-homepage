import {useAudioSession} from './useAudioSession';
import '../../styles/music-return.css';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { audioSession, type AudioState } from '../../lib/audio-session';
import { formatDuration } from '../../lib/music';
import { DivisionBellReturnLink } from '../navigation/DivisionBellReturn';

type Position = { x: number; y: number };
type IconName = 'play' | 'pause' | 'prev' | 'next' | 'volume' | 'hide' | 'return' | 'more' | 'drag' | 'expand' | 'compact';
function Icon({ name }: { name: IconName }) {
  const path = name === 'play' ? 'm9 5 10 7-10 7Z' : name === 'pause' ? 'M8 5v14M16 5v14' : name === 'prev' ? 'M5 5v14m14-14L9 12l10 7Z' : name === 'next' ? 'M19 5v14M5 5l10 7-10 7Z' : name === 'volume' ? 'M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14' : name === 'hide' ? 'm6 6 12 12M18 6 6 18' : name === 'return' ? 'M8 4H4v16h16v-4M13 4h7v7m0-7L10 14' : '';
  return <svg viewBox="0 0 24 24" aria-hidden="true">{path ? <path d={path} /> : name === 'more' ? <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></> : <path d={name === 'drag' ? 'M3 12h18' : name === 'expand' ? 'M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4' : 'M9 3v6H3m12-6v6h6M3 15h6v6m12-6h-6v6'} />}</svg>;
}

export default function FloatingMusicPlayer({ state: initialState, open, onHide }: { state: AudioState; open: boolean; onHide: () => void }) {
  const live = useAudioSession(open);
  const state = open ? live : initialState;
  const panel = useRef<HTMLElement>(null);
  const drag = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [compact, setCompact] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [failedCover, setFailedCover] = useState('');
  function bounds() {
    if (!panel.current) return null;
    const rect = panel.current.getBoundingClientRect();const styles = getComputedStyle(panel.current);
    const edge = parseFloat(styles.getPropertyValue('--float-edge')) || 16;
    const safeBottom = parseFloat(styles.getPropertyValue('--float-safe-bottom')) || 0;
    const viewport = window.visualViewport;
    const left = (viewport?.offsetLeft || 0) + edge;const top = (viewport?.offsetTop || 0) + edge;
    return { left, top, right: Math.max(left, (viewport?.offsetLeft || 0) + (viewport?.width || document.documentElement.clientWidth) - rect.width - edge), bottom: Math.max(top, (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight) - rect.height - edge - safeBottom) };
  }
  function clamp(next: Position) {
    const box = bounds();return box ? { x: Math.max(box.left, Math.min(box.right, next.x)), y: Math.max(box.top, Math.min(box.bottom, next.y)) } : next;
  }
  function resetPosition() { const box = bounds();if (box) setPosition({ x: box.right, y: box.bottom }); }
  useEffect(() => {
    if (!open || !panel.current) return;
    const fit = () => setPosition(current => {
      const box = bounds();if (!box) return current;
      const next = current ? clamp(current) : { x: box.right, y: box.bottom };
      return current?.x === next.x && current?.y === next.y ? current : next;
    });
    fit();const observer = new ResizeObserver(fit);observer.observe(panel.current);
    window.addEventListener('resize', fit);window.visualViewport?.addEventListener('resize', fit);
    return () => { observer.disconnect();window.removeEventListener('resize', fit);window.visualViewport?.removeEventListener('resize', fit);drag.current = null; };
  }, [open]);
  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !panel.current) return;
    const rect = panel.current.getBoundingClientRect();drag.current = { id: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;if (active?.id === event.pointerId) setPosition(clamp({ x: event.clientX - active.offsetX, y: event.clientY - active.offsetY }));
  }
  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function moveByKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Home') { event.preventDefault();event.stopPropagation();resetPosition();return; }
    const step = 24;const delta = event.key === 'ArrowLeft' ? [-step, 0] : event.key === 'ArrowRight' ? [step, 0] : event.key === 'ArrowUp' ? [0, -step] : event.key === 'ArrowDown' ? [0, step] : null;
    if (!delta || !panel.current) return;
    event.preventDefault();event.stopPropagation();const rect = panel.current.getBoundingClientRect();setPosition(clamp({ x: rect.left + delta[0], y: rect.top + delta[1] }));
  }
  function closeMenu(action: () => void) {
    if (menu.current) { menu.current.open = false;menu.current.querySelector<HTMLElement>('summary')?.focus(); }
    action();
  }
  if (!open || !state.track) return null;
  const track = state.track;const index = state.queue.findIndex(item => item.id === track.id && item.source === track.source);
  const active = state.playing || state.waiting;const progress = state.duration ? Math.min(100, state.time / state.duration * 100) : 0;
  const musicUrl = `${import.meta.env.BASE_URL}music/?mode=${track.source}`;
  const dragProps = { 'aria-label': '移动音乐悬窗', title: '拖动封面移动；方向键微调，Home 还原位置', onPointerDown: startDrag, onPointerMove: moveDrag, onPointerUp: endDrag, onPointerCancel: endDrag, onLostPointerCapture: () => { drag.current = null; }, onKeyDown: moveByKeyboard };
  const cover = track.coverUrl && failedCover !== track.coverUrl ? <img src={track.coverUrl} alt={`${track.album} 专辑封面`} width="320" height="320" draggable="false" onError={() => setFailedCover(track.coverUrl || '')} /> : <span className="lssh-floating-fallback"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" /><circle cx="50" cy="50" r="32" /><circle cx="50" cy="50" r="20" /><circle cx="50" cy="50" r="4" /></svg><span>{track.album}</span></span>;
  return <section ref={panel} className={`lssh-floating-player${compact ? ' is-compact' : ''}`} data-size={compact ? 'compact' : 'cover'} aria-label="音乐悬窗" style={position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault();if (showVolume) { setShowVolume(false);menu.current?.querySelector<HTMLElement>('summary')?.focus(); } else if (menu.current?.open) { menu.current.open = false;menu.current.querySelector<HTMLElement>('summary')?.focus(); } else onHide(); }
  }}>
    <div className="lssh-floating-close-area"><button type="button" className="lssh-floating-close" aria-label="隐藏音乐悬窗" title="隐藏悬窗，音乐继续播放" onClick={onHide}><Icon name="hide" /></button></div>
    {!compact && <button type="button" className="lssh-floating-artwork" {...dragProps}>{cover}</button>}
    <div className="lssh-floating-content">
      <div className="lssh-floating-track">{compact && <button type="button" className="lssh-floating-small-art" {...dragProps}>{cover}</button>}<a className="lssh-floating-track-text" href={musicUrl} aria-label={`返回音乐电台：${track.title}`}><strong title={track.title}>{track.title}</strong><span title={track.artist}>{track.artist}</span></a></div>
      <label className="lssh-floating-progress"><input type="range" aria-label="悬窗播放进度" min="0" max={state.duration || 1} step=".1" value={Math.min(state.time, state.duration || 1)} disabled={!state.duration} style={{ '--range-fill': `${progress}%` } as CSSProperties} onChange={event => audioSession.seek(Number(event.target.value))} /><span><time>{formatDuration(state.time)}</time><time>{formatDuration(state.duration)}</time></span></label>
      <div className="lssh-floating-transport">
        <button type="button" aria-label={compact ? '展开大封面悬窗' : '切换为迷你悬窗'} title={compact ? '展开大封面' : '切换迷你版'} onClick={() => setCompact(current => !current)}><Icon name={compact ? 'expand' : 'compact'} /></button>
        <button type="button" aria-label="悬窗上一首" disabled={index <= 0} onClick={() => audioSession.next(-1)}><Icon name="prev" /></button>
        <button type="button" className="lssh-floating-play" aria-label={active ? '暂停音乐' : '继续播放音乐'} onClick={audioSession.toggle}><Icon name={active ? 'pause' : 'play'} /></button>
        <button type="button" aria-label="悬窗下一首" disabled={index < 0 || index >= state.queue.length - 1} onClick={() => audioSession.next(1)}><Icon name="next" /></button>
        <details ref={menu} className="lssh-floating-more"><summary aria-label="更多悬窗操作" title="更多操作"><Icon name="more" /></summary><div><button type="button" aria-label="调节悬窗音量" aria-expanded={showVolume} aria-controls="lssh-floating-volume" onClick={() => closeMenu(() => setShowVolume(current => !current))}>音量</button><DivisionBellReturnLink href={musicUrl} label="返回音乐电台" className="music-floating-return" compact /><button type="button" onClick={() => closeMenu(resetPosition)}>还原悬窗位置</button><button type="button" onClick={() => closeMenu(audioSession.stop)}>停止播放</button></div></details>
      </div>
      {showVolume && <label id="lssh-floating-volume" className="lssh-floating-volume">音量<input type="range" aria-label="悬窗音量" min="0" max="1" step=".01" value={state.volume} style={{ '--range-fill': `${state.volume * 100}%` } as CSSProperties} onChange={event => audioSession.setVolume(Number(event.target.value))} /></label>}
      {state.error ? <p className="lssh-floating-message" role="alert">{state.error}</p> : state.waiting && <p className="lssh-floating-message" role="status">正在缓冲…</p>}
      {state.notice && <p className="lssh-floating-message" role="status">{state.notice}</p>}
      {(state.notice || state.error) && track.source === 'netease' && <a className="lssh-floating-source" href={`https://music.163.com/#/song?id=${encodeURIComponent(track.id)}`} target="_blank" rel="noreferrer">在网易云打开（新窗口）</a>}
    </div>
  </section>;
}
