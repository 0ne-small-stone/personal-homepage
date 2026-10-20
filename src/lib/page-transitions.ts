import { transitionPair, transitionMotion, transitionTiming } from './page-transition-policy.mjs';

interface Job {
  id: number; from: string; to: string; home: boolean; mode: string; preview: string;
  debug: boolean; signal: AbortSignal; animations: Animation[]; timers: number[];
  observer?: MutationObserver; ready?: EventListener; deadline?: number; started: boolean;
}
let installed = false;
export function installPageTransitions() {
  if (installed) return;
  installed = true;
  let sequence = 0, current: Job | undefined;
  const base = import.meta.env.BASE_URL;
  const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
  const preview = (url: URL) => local ? url.searchParams.get('transitionPreview') ?? '' : '';
  const debug = (url: URL) => local && url.searchParams.get('transitionDebug') === '1';
  const inspectSession = debug(new URL(location.href));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const paused = () => {
    try { return document.body.dataset.homePaused === 'true' || sessionStorage.getItem('lssh.home.paused') === 'true'; }
    catch { return document.body.dataset.homePaused === 'true'; }
  };
  const history: Record<string, unknown>[] = [];
  // Internal React/filter URLs can add entries without Astro's index. Preserve
  // its last router index so Back can load that entry instead of ignoring null state.
  let routerIndex: number | undefined;
  const rememberRouter = () => {
    const index = window.history?.state?.index;
    if (Number.isFinite(index)) routerIndex = index;
  };
  rememberRouter();
  const note = (job: Job, phase: string, reason = '') => {
    if (!job.debug) return;
    const main = document.querySelector('main'), title = main?.querySelector('h1');
    const row = { id: job.id, phase, reason, from: job.from, to: job.to, mode: job.mode,
      at: performance.now(), url: location.href, gate: document.documentElement.dataset.f07Incoming ?? null,
      restoring: document.body.dataset.homeRestoring ?? null,
      opacity: main ? getComputedStyle(main).opacity : null, transform: title ? getComputedStyle(title).transform : null };
    history.push(row); if (history.length > 40) history.shift();
    (window as Window & { __lsshPageTransition?: unknown }).__lsshPageTransition = { ...row, history: [...history] };
    document.documentElement.dataset.pageTransitionSample = JSON.stringify({ ...row, history: [...history] });
  };
  const releaseGate = () => { delete document.documentElement.dataset.f07Incoming; };
  const stopWaiting = (job: Job) => {
    job.observer?.disconnect(); job.observer = undefined;
    if (job.ready) document.removeEventListener('lssh:home-restored', job.ready);
    job.ready = undefined;
    if (job.deadline !== undefined) clearTimeout(job.deadline);
    job.deadline = undefined;
  };
  const finish = (job: Job, reason: string) => {
    stopWaiting(job); job.timers.forEach(clearTimeout); job.timers = [];
    job.animations.forEach(animation => animation.cancel()); job.animations = [];
    if (current !== job) return;
    releaseGate(); delete document.body.dataset.homeReturnNavigation;
    note(job, 'idle', reason); current = undefined;
  };
  const cancel = (reason: string) => { if (current) finish(current, reason); else releaseGate(); };
  const later = (job: Job, callback: () => void, duration: number) => {
    const timer = window.setTimeout(() => { if (current === job) callback(); }, duration);
    job.timers.push(timer);
  };
  const enter = (job: Job, reason: string) => {
    if (current !== job || job.started || job.signal.aborted) return;
    job.started = true; stopWaiting(job);
    // A live preference may have changed during fetch/hydration.
    if (reduced.matches || paused() || document.body.classList.contains('home-quiet')) job.mode = 'quiet';
    if (document.body.classList.contains('home-static')) job.mode = 'none';
    const main = document.querySelector<HTMLElement>('main');
    if (!main || job.mode === 'none' || document.hidden) { finish(job, 'direct'); return; }
    try {
      if (job.preview === 'failure') throw new Error('Local F07 animation-failure preview');
      const duration = job.mode === 'quiet' ? transitionTiming.quiet : transitionTiming.enter;
      const animation = main.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease', fill: 'both' });
      job.animations.push(animation); releaseGate();
      // Title only: never translate the fixed scene, header, sticky tools, or player.
      const title = !job.home && main.querySelector<HTMLElement>('h1');
      if (title && job.mode === 'full') {
        const y = innerWidth < 768 ? 8 : 12;
        job.animations.push(title.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(0)' }], { duration, easing: 'ease', fill: 'both' }));
      }
      note(job, 'enter', reason);
      if (job.debug) later(job, () => note(job, 'sample'), Math.round(duration / 2));
      animation.finished.then(() => finish(job, 'complete'), () => { if (current === job) finish(job, 'cancelled'); });
    } catch { finish(job, 'animation-failed'); }
  };
  const homeReady = () => !document.body.hasAttribute('data-home-restoring') &&
    ['home-enhanced', 'home-static'].some(name => document.body.classList.contains(name));
  const pageLoaded = () => {
    rememberRouter();
    const job = current;
    if (!job || location.href !== job.to) return;
    // This callback is after Astro's updateCallbackDone, never inside event.swap().
    if (!job.home || homeReady()) { enter(job, 'page-ready'); return; }
    note(job, 'restore-wait');
    const ready = () => { if (current === job && homeReady()) enter(job, 'home-ready'); };
    job.ready = ready; document.addEventListener('lssh:home-restored', ready);
    job.observer = new MutationObserver(ready);
    job.observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-home-restoring', 'data-home-motion', 'data-home-status'] });
    job.deadline = window.setTimeout(() => {
      if (current !== job) return;
      // Release only visibility, never modify the pending chapter/scroll/focus state.
      delete document.body.dataset.homeRestoring;
      finish(job, 'restore-deadline');
    }, transitionTiming.restoreDeadline);
    ready();
  };
  document.addEventListener('astro:before-preparation', raw => {
    const event = raw;
    cancel('superseded');
    const pair = transitionPair(event.from, event.to, base);
    if (!pair) return;
    if (!Number.isFinite(window.history?.state?.index) && routerIndex !== undefined) {
      window.history.replaceState({ ...window.history.state, index: routerIndex,
        scrollX: window.scrollX ?? 0, scrollY: window.scrollY ?? 0 }, '');
    }
    const simulation = preview(event.to) || preview(event.from);
    const mode = transitionMotion({ supported: typeof document.startViewTransition === 'function' && typeof Element.prototype.animate === 'function',
      reduced: reduced.matches, paused: paused(), staticPage: document.body.classList.contains('home-static'), preview: simulation });
    const job: Job = { id: ++sequence, from: event.from.href, to: event.to.href, home: pair.target === 'home',
      mode, preview: simulation, debug: inspectSession || debug(event.from) || debug(event.to), signal: event.signal, animations: [], timers: [], started: false };
    current = job; note(job, 'prepare');
    event.signal.addEventListener('abort', () => { if (current === job) finish(job, 'aborted'); }, { once: true });
    const main = document.querySelector<HTMLElement>('main');
    if (main && mode === 'full' && !document.hidden) {
      try { job.animations.push(main.animate([{ opacity: 1 }, { opacity: 0 }], { duration: transitionTiming.exit, easing: 'ease', fill: 'both' })); }
      catch { job.mode = 'none'; }
      // A slow/failed fetch cannot leave the current page invisible indefinitely.
      later(job, () => { job.animations.forEach(a => a.cancel()); job.animations = []; note(job, 'fetch-visible'); }, transitionTiming.restoreDeadline);
    }
  });
  document.addEventListener('astro:before-swap', raw => {
    const event = raw, job = current;
    if (!job || job.to !== event.to.href) return;
    // Release native rendering freeze. No waiting for R3F or promises here.
    // ready rejects on an intentional skip; handle only this native promise,
    // without hiding application errors or adding a global rejection handler.
    event.viewTransition?.ready?.catch(() => {});
    event.viewTransition?.skipTransition();
    job.animations.forEach(a => a.cancel()); job.animations = [];
    job.timers.forEach(clearTimeout); job.timers = [];
    if (job.home) event.newDocument.body.dataset.homeReturnNavigation = 'true';
    if (job.home && (event.navigationType === 'traverse' || [...event.newDocument.querySelectorAll('[data-chapter]')].some(section => `#${section.id}` === event.to.hash))) {
      // Start the existing restore visibility guard before the first target paint.
      // Position still belongs exclusively to home-return/home-motion.
      event.newDocument.body.dataset.homeRestoring = 'true';
    }
    if (job.mode !== 'none') event.newDocument.documentElement.dataset.f07Incoming = job.home ? 'home' : 'entry';
    const swap = event.swap;
    event.swap = () => { swap(); note(job, 'swapped'); };
  });
  document.addEventListener('astro:page-load', pageLoaded);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel('hidden'); });
  window.addEventListener('pagehide', () => cancel('pagehide'));
  // Astro emits an untrusted popstate while moving to a hash after swap.
  // A real Back cancels the old job in capture phase, before Astro prepares its successor.
  window.addEventListener('popstate', event => {
    // If Astro has already prepared this Back target, keep that successor.
    if (event.isTrusted && current && current.to !== location.href) cancel('popstate');
  }, { capture: true });
  const preference = () => {
    if (!current || (!reduced.matches && !paused())) return;
    if (!current.started) current.mode = 'quiet';
    else cancel('preference');
  };
  reduced.addEventListener('change', preference);
  document.addEventListener('lssh:home-controls-state', preference);
}
