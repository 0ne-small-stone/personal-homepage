import {useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent} from 'react';
import {createPortal, flushSync} from 'react-dom';
import type {NetEaseView} from '../../lib/netease-core';
import {featureMotionGeometry} from './feature-motion-geometry';
import {MusicIcon} from './RadioNowPlaying';
import '../../styles/music-feature-cards.css';

type FeatureView = Extract<NetEaseView, 'daily' | 'heart' | 'fm'>;

const features = [
  {view: 'daily', title: '每日推荐', caption: '每天，新的聆听', compact: '每日更新', artwork: 'interval-daily.webp'},
  {view: 'heart', title: '心动模式', caption: '从喜欢，听见更多', compact: '依喜好播放', artwork: 'interval-heart.webp'},
  {view: 'fm', title: '私人漫游', caption: '让下一首，自然发生', compact: '随心发现', artwork: 'interval-roam.webp'},
] satisfies {view: FeatureView; title: string; caption: string; compact: string; artwork: string}[];

type Feature = typeof features[number];
type Rect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
type Phase = 'empty' | 'loading' | 'loaded' | 'ejecting' | 'returning';
type Drag = {
  feature: Feature; pointerId: number; capture: HTMLButtonElement; source: Rect; bay: Rect;
  offsetX: number; offsetY: number; x: number; y: number; startX: number; startY: number; active: boolean; over: boolean;
};
const selectionKey = 'lssh:netease-cassette';

function badgePlacement({view}: Feature): CSSProperties {
  const {cx, cy, diameter} = featureMotionGeometry[view];
  return {
    width: `${1254 * .86 / diameter * 100}%`,
    left: `${(.5 - cx * .86 / diameter) * 100}%`,
    top: `${(.5 - cy * .86 / diameter) * 100}%`,
  };
}

function Spool() {
  return <svg className="cassette-spool" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" /><path d="M16 4v7m10.4-1-6.1 3.5m6.1 8-6.1-3.5M16 28v-7M5.6 22l6.1-3.5M5.6 10l6.1 3.5" /><circle cx="16" cy="16" r="3" /></svg>;
}

function Cassette({feature}: {feature: Feature}) {
  return <span className="cassette-body" aria-hidden="true">
    <span className="cassette-label"><strong>{feature.title}</strong><span className="cassette-label-rule" /><span className="cassette-badge"><img src={`${import.meta.env.BASE_URL}music/features/${feature.artwork}`} style={badgePlacement(feature)} width="800" height="800" alt="" draggable={false} decoding="async" /></span></span>
    <span className="cassette-window"><Spool /><span className="cassette-tape" /><Spool /></span>
    <span className="cassette-head"><i /><i /><i /></span>
    <span className="cassette-screw screw-tl" /><span className="cassette-screw screw-tr" /><span className="cassette-screw screw-bl" /><span className="cassette-screw screw-br" />
  </span>;
}

export default function NetEaseFeatureCards({onSelect}: {onSelect: (view: FeatureView) => void}) {
  const [loaded, setLoaded] = useState<Feature | null>(null), [phase, setPhase] = useState<Phase>('empty');
  const [moving, setMoving] = useState<FeatureView | null>(null), [ghostFeature, setGhostFeature] = useState(features[0]);
  const [over, setOver] = useState(false), [mounted, setMounted] = useState(false);
  const instruction = useId();
  const loadedRef = useRef<Feature | null>(null), busyRef = useRef(false), alive = useRef(false), reduced = useRef(false);
  const bay = useRef<HTMLDivElement>(null), slot = useRef<HTMLSpanElement>(null), ghost = useRef<HTMLDivElement>(null), listen = useRef<HTMLButtonElement>(null);
  const choices = useRef<Partial<Record<FeatureView, HTMLButtonElement | null>>>({});
  const animation = useRef<Animation | null>(null), drag = useRef<Drag | null>(null), blockClickUntil = useRef(0);
  const busy = phase !== 'empty' && phase !== 'loaded';

  function assign(feature: Feature | null) {
    loadedRef.current = feature; setLoaded(feature);
    try { if (feature) sessionStorage.setItem(selectionKey, feature.view); else sessionStorage.removeItem(selectionKey); } catch { /* Selection can remain local to this mount. */ }
  }
  function hideGhost() {
    if (!ghost.current) return;
    ghost.current.style.visibility = 'hidden'; ghost.current.style.willChange = ''; ghost.current.dataset.active = 'false';
  }
  function release(pointer: Drag) { try { pointer.capture.releasePointerCapture(pointer.pointerId); } catch { /* The browser may already have released it. */ } }
  function choiceRect(feature: Feature) { return choices.current[feature.view]?.querySelector('.cassette-body')?.getBoundingClientRect(); }

  async function flight(feature: Feature, from: Rect | undefined, to: Rect | undefined, duration: number, angle = 0) {
    if (!from || !to || !alive.current || reduced.current) { hideGhost(); return; }
    flushSync(() => setGhostFeature(feature));
    const element = ghost.current;
    if (!element) return;
    element.style.width = `${from.width}px`; element.style.visibility = 'visible'; element.style.willChange = 'transform'; element.dataset.active = 'true';
    const scale = to.width / from.width;
    const effect = element.animate([
      {transform: `translate3d(${from.left}px,${from.top}px,0) rotate(${angle}deg)`},
      {transform: `translate3d(${to.left}px,${to.top - 10}px,0) rotate(0deg) scale(${scale})`, offset: .78},
      {transform: `translate3d(${to.left}px,${to.top}px,0) rotate(0deg) scale(${scale})`},
    ], {duration, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards'});
    animation.current = effect;
    try { await effect.finished; } catch { /* Resize, reduced motion, or unmount snaps to the final state. */ }
    finally { if (animation.current === effect) { effect.cancel(); animation.current = null; hideGhost(); } }
  }
  async function load(feature: Feature, from?: Rect) {
    if (busyRef.current) return;
    if (loadedRef.current?.view === feature.view) { hideGhost(); setMoving(null); listen.current?.focus({preventScroll: true}); return; }
    busyRef.current = true;
    try {
      const previous = loadedRef.current;
      if (previous) {
        setPhase('ejecting'); setMoving(previous.view); assign(null);
        await flight(previous, slot.current?.getBoundingClientRect(), choiceRect(previous), 360);
      }
      if (!alive.current) return;
      setPhase('loading'); setMoving(feature.view);
      await flight(feature, from ?? choiceRect(feature), slot.current?.getBoundingClientRect(), 520, from ? -3 : 0);
      if (alive.current) { assign(feature); setPhase('loaded'); }
    } finally { if (alive.current) { setMoving(null); busyRef.current = false; } }
  }
  async function eject() {
    const feature = loadedRef.current;
    if (!feature || busyRef.current) return;
    busyRef.current = true; setPhase('ejecting'); setMoving(feature.view); assign(null);
    await flight(feature, slot.current?.getBoundingClientRect(), choiceRect(feature), 360);
    if (alive.current) { setMoving(null); setPhase('empty'); busyRef.current = false; }
  }
  async function returnDrag(pointer: Drag) {
    busyRef.current = true; setPhase('returning');
    await flight(pointer.feature, {left: pointer.x, top: pointer.y, width: pointer.source.width, height: pointer.source.height}, choiceRect(pointer.feature), 320, -3);
    if (alive.current) { setMoving(null); setPhase(loadedRef.current ? 'loaded' : 'empty'); busyRef.current = false; }
  }
  function finishDrag(accept: boolean) {
    const pointer = drag.current;
    if (!pointer) return;
    drag.current = null; release(pointer); setOver(false);
    if (!pointer.active) return;
    blockClickUntil.current = performance.now() + 400;
    if (accept && pointer.over) void load(pointer.feature, {left: pointer.x, top: pointer.y, width: pointer.source.width, height: pointer.source.height});
    else void returnDrag(pointer);
  }
  function beginDrag(event: PointerEvent<HTMLButtonElement>, feature: Feature) {
    if (event.button !== 0 || busyRef.current || drag.current || loadedRef.current?.view === feature.view) return;
    const source = choiceRect(feature), target = bay.current?.getBoundingClientRect();
    if (!source || !target) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {feature, pointerId: event.pointerId, capture: event.currentTarget, source, bay: target, offsetX: event.clientX - source.left, offsetY: event.clientY - source.top, startX: event.clientX, startY: event.clientY, x: source.left, y: source.top, active: false, over: false};
  }
  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const pointer = drag.current;
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    if (!pointer.active) {
      if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) < 6) return;
      pointer.active = true;
      flushSync(() => { setGhostFeature(pointer.feature); setMoving(pointer.feature.view); });
    }
    event.preventDefault();
    pointer.x = event.clientX - pointer.offsetX; pointer.y = event.clientY - pointer.offsetY;
    const element = ghost.current;
    if (element) { element.style.width = `${pointer.source.width}px`; element.style.visibility = 'visible'; element.style.willChange = 'transform'; element.dataset.active = 'true'; element.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0) rotate(-3deg)`; }
    const inside = event.clientX >= pointer.bay.left - 12 && event.clientX <= pointer.bay.left + pointer.bay.width + 12 && event.clientY >= pointer.bay.top - 12 && event.clientY <= pointer.bay.top + pointer.bay.height + 12;
    if (inside !== pointer.over) { pointer.over = inside; setOver(inside); }
  }

  useEffect(() => {
    alive.current = true; setMounted(true);
    try { const saved = features.find(feature => feature.view === sessionStorage.getItem(selectionKey)); if (saved) { loadedRef.current = saved; setLoaded(saved); setPhase('loaded'); } } catch { /* Storage is optional. */ }
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => { reduced.current = preference.matches; if (reduced.current) { animation.current?.cancel(); finishDrag(false); } };
    const resize = () => { animation.current?.cancel(); finishDrag(false); };
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape' && drag.current) { event.preventDefault(); finishDrag(false); } };
    updatePreference(); preference.addEventListener('change', updatePreference); window.addEventListener('resize', resize); window.addEventListener('keydown', cancel);
    return () => { alive.current = false; animation.current?.cancel(); if (drag.current) release(drag.current); drag.current = null; preference.removeEventListener('change', updatePreference); window.removeEventListener('resize', resize); window.removeEventListener('keydown', cancel); };
  }, []);

  const status = phase === 'loading' ? '正在装带' : phase === 'ejecting' ? '正在退带' : phase === 'returning' ? '磁带归位' : loaded ? `已装入 · ${loaded.title}` : '等待装带';
  return <div className={`cassette-station${busy ? ' is-busy' : ''}`} aria-label="磁带电台">
    <div className="cassette-radio">
      <div className="cassette-radio-header"><span className="cassette-brand">Echoes</span><span className="cassette-status" role="status"><i className={loaded ? 'is-ready' : ''} />{status}</span></div>
      <div className="cassette-speaker" aria-hidden="true"><span /></div>
      <div className="cassette-deck">
        <div ref={bay} className={`cassette-bay${over ? ' is-over' : ''}${busy ? ' is-changing' : ''}`} role="group" aria-label="磁带卡座" aria-describedby={instruction}>
          <span ref={slot} className="cassette-slot"><span className="cassette-empty-spindles" aria-hidden="true"><i /><i /></span>{loaded && <Cassette feature={loaded} />}</span>
          {!loaded && !busy && <span className="cassette-bay-prompt" aria-hidden="true">放入磁带</span>}
          <span className="cassette-glass" aria-hidden="true" />
        </div>
        <div className="cassette-deck-footer"><span id={instruction} className="cassette-instruction">点选磁带，或拖入卡座</span><div className="cassette-keys">
          <button ref={listen} type="button" className="cassette-key cassette-key-play" disabled={!loaded || busy} onClick={() => { if (loadedRef.current && !busyRef.current) onSelect(loadedRef.current.view); }} aria-label={loaded ? `收听${loaded.title}` : '收听'}><MusicIcon name="play" /><span>收听</span></button>
          <button type="button" className="cassette-key" disabled={!loaded || busy} onClick={() => void eject()} aria-label="退出磁带"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 14 7-8 7 8Z" /><path d="M5 18h14" /></svg><span>退带</span></button>
        </div></div>
      </div>
    </div>
    <div className="cassette-shelf" role="group" aria-label="选择磁带">{features.map(feature => {
      const selected = loaded?.view === feature.view;
      return <button key={feature.view} ref={element => { choices.current[feature.view] = element; }} type="button" className={`cassette-choice${selected ? ' is-selected' : ''}${moving === feature.view ? ' is-moving' : ''}`} aria-label={selected ? `${feature.title}磁带已装入` : `装入${feature.title}磁带`} aria-pressed={selected} disabled={busy}
        onPointerDown={event => beginDrag(event, feature)} onPointerMove={moveDrag} onPointerUp={() => finishDrag(true)} onPointerCancel={() => finishDrag(false)} onLostPointerCapture={() => { if (drag.current) finishDrag(false); }}
        onClick={() => { if (performance.now() >= blockClickUntil.current) void load(feature); }}>
        <span className="cassette-choice-case"><Cassette feature={feature} /><span className="cassette-loaded-note" aria-hidden="true"><strong>{feature.title}</strong><span>已装入卡座</span></span></span>
        <span className="cassette-choice-caption">{feature.caption}</span>
      </button>;
    })}</div>
    {mounted && createPortal(<div ref={ghost} className="cassette-flight" aria-hidden="true"><Cassette feature={ghostFeature} /></div>, document.body)}
  </div>;
}
