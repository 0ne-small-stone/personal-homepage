import {useEffect, useId, useRef, useState, type PointerEvent} from 'react';
import {flushSync} from 'react-dom';
import type {NetEaseView} from '../../lib/netease-core';
import {createCassetteFoley} from '../../lib/cassette-foley';
import {MusicIcon} from './RadioNowPlaying';
import '../../styles/music-feature-cards.css';
import '../../styles/music-cassette-reels.css';

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
const insertDuration = 1850, ejectDuration = 1100;

function Cassette({feature, playing}: {feature: Feature; playing?: boolean}) {
  const material = `${import.meta.env.BASE_URL}music/hardware/tape-vintage-v2.webp`;
  return <span className="cassette-body" data-mode={feature.view} data-playing={playing} aria-hidden="true">
    <img className="cassette-material" src={material} width="1000" height="636" alt="" draggable={false} decoding="sync" />
    {playing !== undefined && ['left', 'right'].map(side => <span className={`cassette-reel cassette-reel-${side}`} key={side}>
      <span className="cassette-reel-background"><img src={material} width="1000" height="636" alt="" draggable={false} decoding="sync" /></span>
      <span className="cassette-reel-turn"><img src={material} width="1000" height="636" alt="" draggable={false} decoding="sync" /></span>
    </span>)}
    <strong className="cassette-paper-title"><span>{feature.title}</span></strong>
  </span>;
}

export default function NetEaseFeatureCards({onSelect, playing = false}: {onSelect: (view: FeatureView) => void; playing?: boolean}) {
  const [loaded, setLoaded] = useState<Feature | null>(null), [phase, setPhase] = useState<Phase>('empty');
  const [moving, setMoving] = useState<FeatureView | null>(null), [ghostFeature, setGhostFeature] = useState(features[0]);
  const [over, setOver] = useState(false);
  const instanceId = useId();
  const faceMask = `${instanceId}-face`, handleClip = `${instanceId}-handle`;
  const hardwareUrl = `${import.meta.env.BASE_URL}music/hardware/radio-vintage-v1.webp`;
  const opening = {left: '59.3%', top: '33%', width: '36%', height: '37.5%'};
  const loadedRef = useRef<Feature | null>(null), busyRef = useRef(false), alive = useRef(false), reduced = useRef(false);
  const radio = useRef<HTMLDivElement>(null), bay = useRef<HTMLDivElement>(null), slot = useRef<HTMLSpanElement>(null), ghost = useRef<HTMLDivElement>(null), listen = useRef<HTMLButtonElement>(null);
  const choices = useRef<Partial<Record<FeatureView, HTMLButtonElement | null>>>({});
  const animation = useRef<Animation | null>(null), drag = useRef<Drag | null>(null), blockClickUntil = useRef(0);
  const sound = useRef<ReturnType<typeof createCassetteFoley> | null>(null);
  const busy = phase !== 'empty' && phase !== 'loaded';

  function assign(feature: Feature | null) {
    loadedRef.current = feature; setLoaded(feature);
    try { if (feature) sessionStorage.setItem(selectionKey, feature.view); else sessionStorage.removeItem(selectionKey); } catch { /* Selection can remain local to this mount. */ }
  }
  function hideGhost() {
    if (!ghost.current) return;
    ghost.current.style.visibility = 'hidden'; ghost.current.style.willChange = ''; ghost.current.style.clipPath = ''; ghost.current.dataset.active = 'false';
  }
  function release(pointer: Drag) { try { pointer.capture.releasePointerCapture(pointer.pointerId); } catch { /* The browser may already have released it. */ } }
  function choiceRect(feature: Feature) { return choices.current[feature.view]?.querySelector('.cassette-body')?.getBoundingClientRect(); }
  function headRect(feature: Feature) { return choices.current[feature.view]?.querySelector('.cassette-choice-case')?.getBoundingClientRect(); }

  function frameClip(rect: Rect, frame: Rect | undefined) {
    if (!frame || !rect.width || !rect.height) return 'inset(0%)';
    const inset = [
      (frame.top - rect.top) / rect.height,
      (rect.left + rect.width - frame.left - frame.width) / rect.width,
      (rect.top + rect.height - frame.top - frame.height) / rect.height,
      (frame.left - rect.left) / rect.width,
    ].map(value => `${Math.max(0, Math.min(1, value)) * 100}%`).join(' ');
    return `inset(${inset})`;
  }
  async function flight(feature: Feature, from: Rect | undefined, to: Rect | undefined, duration: number, angle = 0, direction?: 'insert' | 'eject') {
    if (!from || !to || !alive.current || reduced.current) { hideGhost(); return; }
    flushSync(() => setGhostFeature(feature));
    const element = ghost.current;
    if (!element) return;
    element.style.width = `${from.width}px`; element.style.visibility = 'visible'; element.style.clipPath = ''; element.style.willChange = 'transform'; element.dataset.active = 'true';
    const targetBay = bay.current?.getBoundingClientRect();
    const head = headRect(feature);
    const origin = radio.current?.getBoundingClientRect();
    if (!origin) { hideGhost(); return; }
    const transform = (rect: Rect, rotation = 0) => `translate3d(${rect.left - origin.left}px,${rect.top - origin.top}px,0) rotate(${rotation}deg) scale(${rect.width / from.width})`;
    // Stay behind the hardware: move sideways along the rack, then down inside.
    const dock: Rect = direction === 'eject'
      ? {left: from.left, top: to.top, width: from.width, height: from.height}
      : {left: to.left, top: from.top, width: to.width, height: to.height};
    const full = 'inset(0%)';
    const keyframes: Keyframe[] = direction === 'insert' ? [
      {transform: transform(from, angle), clipPath: angle ? full : frameClip(from, head), offset: 0, easing: 'cubic-bezier(.22,.61,.36,1)'},
      {transform: transform(dock), clipPath: full, offset: .42},
      {transform: transform(dock), clipPath: full, offset: .53, easing: 'cubic-bezier(.45,0,.2,1)'},
      {transform: transform(to), clipPath: frameClip(to, targetBay), offset: 1},
    ] : direction === 'eject' ? [
      {transform: transform(from), clipPath: frameClip(from, targetBay), offset: 0},
      {transform: transform(dock), clipPath: full, offset: .5},
      {transform: transform(to), clipPath: frameClip(to, head), offset: 1},
    ] : [
      {transform: transform(from, angle), clipPath: full},
      {transform: transform(to), clipPath: frameClip(to, head)},
    ];
    const effect = element.animate(keyframes, {duration, easing: direction === 'insert' ? 'linear' : 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'});
    animation.current = effect;
    const stopSound = direction ? sound.current?.play(direction, duration) : undefined;
    try { await effect.finished; } catch { /* Resize, reduced motion, or unmount snaps to the final state. */ }
    finally { stopSound?.(); if (animation.current === effect) { effect.cancel(); animation.current = null; hideGhost(); } }
  }
  async function load(feature: Feature, from?: Rect) {
    if (busyRef.current) return;
    if (loadedRef.current?.view === feature.view) { hideGhost(); setMoving(null); listen.current?.focus({preventScroll: true}); return; }
    (sound.current ??= createCassetteFoley()).unlock();
    busyRef.current = true;
    try {
      const previous = loadedRef.current;
      if (previous) {
        setPhase('ejecting'); setMoving(previous.view); assign(null);
        await flight(previous, slot.current?.getBoundingClientRect(), choiceRect(previous), ejectDuration, 0, 'eject');
      }
      if (!alive.current) return;
      setPhase('loading'); setMoving(feature.view);
      await flight(feature, from ?? choiceRect(feature), slot.current?.getBoundingClientRect(), insertDuration, from ? -3 : 0, 'insert');
      if (alive.current) { assign(feature); setPhase('loaded'); }
    } finally { if (alive.current) { setMoving(null); busyRef.current = false; } }
  }
  async function eject() {
    const feature = loadedRef.current;
    if (!feature || busyRef.current) return;
    (sound.current ??= createCassetteFoley()).unlock();
    busyRef.current = true; setPhase('ejecting'); setMoving(feature.view); assign(null);
    await flight(feature, slot.current?.getBoundingClientRect(), choiceRect(feature), ejectDuration, 0, 'eject');
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
    const source = choiceRect(feature), head = headRect(feature), target = bay.current?.getBoundingClientRect();
    if (!source || !head || !target) return;
    // Only the exposed head is interactive; the hidden tape must not cover the radio.
    if (event.clientX < head.left || event.clientX > head.left + head.width || event.clientY < head.top || event.clientY > head.top + head.height) return;
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
    const origin = radio.current?.getBoundingClientRect();
    if (element && origin) { element.style.width = `${pointer.source.width}px`; element.style.visibility = 'visible'; element.style.willChange = 'transform'; element.dataset.active = 'true'; element.style.transform = `translate3d(${pointer.x - origin.left}px,${pointer.y - origin.top}px,0) rotate(-3deg)`; }
    const inside = event.clientX >= pointer.bay.left - 12 && event.clientX <= pointer.bay.left + pointer.bay.width + 12 && event.clientY >= pointer.bay.top - 12 && event.clientY <= pointer.bay.top + pointer.bay.height + 12;
    if (inside !== pointer.over) { pointer.over = inside; setOver(inside); }
  }

  useEffect(() => {
    alive.current = true;
    try { const saved = features.find(feature => feature.view === sessionStorage.getItem(selectionKey)); if (saved) { loadedRef.current = saved; setLoaded(saved); setPhase('loaded'); } } catch { /* Storage is optional. */ }
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => { reduced.current = preference.matches; if (reduced.current) { animation.current?.cancel(); finishDrag(false); } };
    const resize = () => { animation.current?.cancel(); finishDrag(false); };
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape' && drag.current) { event.preventDefault(); finishDrag(false); } };
    const visibility = () => { if (document.hidden) resize(); };
    updatePreference(); preference.addEventListener('change', updatePreference); window.addEventListener('resize', resize); window.addEventListener('keydown', cancel); window.addEventListener('pagehide', resize); document.addEventListener('visibilitychange', visibility);
    return () => { alive.current = false; animation.current?.cancel(); sound.current?.dispose(); sound.current = null; if (drag.current) release(drag.current); drag.current = null; preference.removeEventListener('change', updatePreference); window.removeEventListener('resize', resize); window.removeEventListener('keydown', cancel); window.removeEventListener('pagehide', resize); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  const displayFeature = loaded ?? features.find(feature => feature.view === moving);
  const status = phase === 'loading' ? '正在装带' : phase === 'ejecting' ? '正在退带' : phase === 'returning' ? '磁带归位' : loaded ? '已装带' : '待装带';
  return <div className={`cassette-station${busy ? ' is-busy' : ''}`} aria-label="磁带电台">
    <div className="cassette-hardware-stack">
    <div ref={radio} className="cassette-radio" aria-label="Echoes 复古收录机">
      <img className="cassette-radio-material" src={hardwareUrl} width="1800" height="800" alt="" draggable={false} decoding="async" />
    <div className="cassette-shelf" role="group" aria-label="选择磁带">{features.map(feature => {
      const selected = loaded?.view === feature.view;
      return <button key={feature.view} ref={element => { choices.current[feature.view] = element; }} type="button" className={`cassette-choice${selected ? ' is-selected' : ''}${moving === feature.view ? ' is-moving' : ''}`} aria-label={selected ? `${feature.title}磁带已装入` : `装入${feature.title}磁带`} aria-pressed={selected} disabled={busy}
        onPointerDown={event => beginDrag(event, feature)} onPointerMove={moveDrag} onPointerUp={() => finishDrag(true)} onPointerCancel={() => finishDrag(false)} onLostPointerCapture={() => { if (drag.current) finishDrag(false); }}
        onClick={() => { if (performance.now() >= blockClickUntil.current) void load(feature); }}>
        <span className="cassette-choice-case"><Cassette feature={feature} /></span>
      </button>;
    })}</div>
      <div ref={ghost} className="cassette-flight" aria-hidden="true"><Cassette feature={ghostFeature} /></div>
        <div ref={bay} className={`cassette-bay${over ? ' is-over' : ''}${busy ? ' is-changing' : ''}`} style={opening} role="group" aria-label="磁带卡座">
        <span ref={slot} className="cassette-slot">{loaded && <Cassette feature={loaded} playing={playing} />}</span>
          <span className="cassette-glass" aria-hidden="true" />
        </div>
        <svg className="cassette-handle-extension" viewBox="0 80 1881 56" preserveAspectRatio="none" aria-hidden="true"><image href={hardwareUrl} width="1881" height="836" /></svg>
        <svg className="cassette-radio-handle" viewBox="0 0 1881 836" preserveAspectRatio="none" aria-hidden="true">
          <defs><clipPath id={handleClip}><rect width="1881" height="133.76" /></clipPath></defs>
          <image href={hardwareUrl} width="1881" height="836" clipPath={`url(#${handleClip})`} />
        </svg>
        <svg className="cassette-radio-front" viewBox="0 0 1881 836" preserveAspectRatio="none" aria-hidden="true">
          <defs><mask id={faceMask} maskUnits="userSpaceOnUse" x="0" y="0" width="1881" height="836"><rect width="1881" height="836" fill="white" /><rect width="1881" height="133.76" fill="black" /><rect x={opening.left} y={opening.top} width={opening.width} height={opening.height} fill="black" /></mask></defs>
          <image href={hardwareUrl} width="1881" height="836" mask={`url(#${faceMask})`} />
        </svg>
        <div className="cassette-keys">
          <button ref={listen} type="button" className="cassette-key cassette-key-play" disabled={!loaded || busy} onClick={() => { if (loadedRef.current && !busyRef.current) onSelect(loadedRef.current.view); }} aria-label={loaded ? `收听${loaded.title}` : '收听'}><span className="cassette-key-content"><MusicIcon name="play" /><span>收听</span></span></button>
          <button type="button" className="cassette-key" disabled={!loaded || busy} onClick={() => void eject()} aria-label="退出磁带"><span className="cassette-key-content"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 14 7-8 7 8Z" /><path d="M5 18h14" /></svg><span>退带</span></span></button>
        </div>
    </div>
    </div>
    <div className="cassette-radio-footer">
      <div className="cassette-lcd" role="status" aria-atomic="true">
        <div className="cassette-lcd-screen">
          <svg className="cassette-lcd-symbol" viewBox="0 0 24 18" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="15" rx="1" /><path d="m5 16 1.5-4h11l1.5 4M8 6h8" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="7" r="2" /></svg>
          <strong className="cassette-lcd-mode">{displayFeature?.title ?? '选择磁带'}</strong>
          <span className="cassette-lcd-state">{status}</span>
        </div>
      </div>
    </div>
  </div>;
}
