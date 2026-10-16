import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { introGap, workCount, motionRange, MotionLerper, type MotionChannel } from './works-motion';
import type { JourneyModel } from './scene-state';
import { wallReadingReady } from './wall-assembly';
import { workCopyState } from './copy-state';
import { hasActiveSnap } from './frame-activity';

export function installWorksMotion(model: JourneyModel) {
  gsap.registerPlugin(ScrollTrigger);
  const body = document.body;
  const sections = [...document.querySelectorAll<HTMLElement>('[data-work-item]')];
  const hero = document.querySelector<HTMLElement>('#intro .home-chapter-viewport')!;
  const identityFallback = document.querySelector<HTMLAnchorElement>('.home-chapter-index a[href="#intro"]')!;
  const wallContent=document.querySelector<HTMLElement>('#wall .home-chapter-content')!;
  const controller = new AbortController();
  const headings = sections.map(section => section.querySelector<HTMLHeadingElement>('h2')!);
  const containers = sections.map(section => section.querySelector<HTMLElement>('.home-chapter-viewport')!);
  const ctas = sections.map(section => section.querySelector<HTMLAnchorElement>('.home-cta')!);
  const chapterLinks=[...document.querySelectorAll<HTMLAnchorElement>('.home-chapter-index a')];
  const copyCache: (ReturnType<typeof workCopyState> | undefined)[] = [];
  let lastIdentity=-1,lastIdentityHidden:boolean|undefined,lastChapter='',lastWall:boolean|undefined,lastPortal:boolean|undefined,lastCurrent=-1;

  function enableCta(index: number, enabled: boolean) {
    ctas[index].inert = !enabled;
    if (enabled) ctas[index].removeAttribute('aria-hidden');
    else ctas[index].setAttribute('aria-hidden', 'true');
  }

  function syncCopy() {
    model.motion.activeItem = -1;
    sections.forEach((section, index) => {
      const state = workCopyState(model.motion.rendered.index, index,
        model.motion.raw.prepare > 0 || model.motion.rendered.prepare > .001);
      const previous = copyCache[index];
      if (state.visible) model.motion.activeItem = index;
      if (!previous || previous.opacity !== state.opacity) containers[index].style.opacity = String(state.opacity);
      if (!previous || previous.y !== state.y) headings[index].style.transform = `translateY(${state.y}px)`;
      if (!previous || previous.visible !== state.visible) {
        containers[index].style.visibility = state.visible ? 'visible' : 'hidden';
        section.dataset.workVisible = String(state.visible);
      }
      if (!previous || previous.interactive !== state.interactive) {
        if (!state.interactive && section.contains(document.activeElement)) chapterLinks[index + 1]?.focus({ preventScroll: true });
        section.inert = !state.interactive;
        if (state.interactive) section.removeAttribute('aria-hidden');
        else section.setAttribute('aria-hidden', 'true');
        section.dataset.workActive = String(state.interactive);
        enableCta(index, state.interactive);
      }
      copyCache[index] = state;
    });
  }

  const measure = () => {
    model.motion.height = innerHeight;
    body.style.setProperty('--journey-height', `${innerHeight}px`);
  };
  measure();
  const channels: MotionChannel[] = ['kv', 'intro', 'works', 'event', 'snap', 'outro', 'prepare', 'expand', 'wall'];
  const triggers = channels.map(channel => ScrollTrigger.create({
    id: `lssh-${channel}`, start: () => motionRange(channel, model.motion.height)[0],
    end: () => motionRange(channel, model.motion.height)[1],
    onUpdate: trigger => { model.motion.raw[channel] = trigger.progress; model.invalidate(); },
    onRefresh: trigger => { model.motion.raw[channel] = trigger.progress; model.invalidate(); },
    ...(channel === 'snap' ? { snap: { snapTo: 1 / (workCount - 1), duration: 1, delay: .1, ease: 'power3', directional: false } } : {}),
  }));

  const lenis = new Lenis({ lerp: .1, smoothWheel: true, syncTouch: false, autoRaf: false,
    prevent: node => node.matches('input, textarea, select, [contenteditable], [data-lenis-prevent], .home-guestbook'),
  });
  const disconnect = lenis.on('scroll', () => ScrollTrigger.update());
  const progress = new MotionLerper(1), center = new MotionLerper(.5), background = new MotionLerper(.7), title = new MotionLerper(.3);
  const prepare = new MotionLerper(.5), expand = new MotionLerper(1), wall = new MotionLerper(1.5);
  const allLerpers = [progress, center, background, title, prepare, expand, wall];
  let pendingFocus: string | undefined;
  let lenisTime=0;
  const phaseAt = (s: number) => {
    const h = model.motion.height;
    return s <= introGap ? 'kv' : s < h + introGap ? 'works_intro' : s < (workCount + 1) * h + introGap ? 'works' : s < (workCount + 2.5) * h + introGap ? 'works_outro' : s < motionRange('wall', h)[0] ? 'portal' : 'wall';
  };
  const centeredIndex = (p: number) => {
    const o = (workCount + 1) * p, rounded = Math.round(o + Number.EPSILON * 8);
    return rounded + .4 * (o - rounded);
  };
  function initialize(y: number, reason: string) {
    abortSnap(); lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); ScrollTrigger.update();
    const s = scrollY, h = model.motion.height;
    for (const channel of channels) {
      const [start, end] = motionRange(channel, h);
      model.motion.raw[channel] = Math.max(0, Math.min(1, (s - start) / (end - start)));
    }
    const p = model.motion.raw.works, u = centeredIndex(p);
    progress.reset(p); center.reset(u); background.reset(p); title.reset(model.motion.raw.intro);
    prepare.reset(model.motion.raw.prepare); expand.reset(model.motion.raw.expand); wall.reset(model.motion.raw.wall);
    model.motion.portalCovered = model.motion.raw.expand === 1;
    model.motion.portal = null;
    model.motion.rendered = { progress: p, index: u, background: p * (workCount + 1), intro: model.motion.raw.intro,
      prepare: model.motion.raw.prepare, expand: model.motion.raw.expand, wall: model.motion.raw.wall };
    model.motion.scrollY = s; model.motion.phase = phaseAt(s); model.motion.snapActive = false;
    model.motion.initialization = { revision: model.motion.initialization.revision + 1, y: s, zoom: s <= introGap ? 1 : 0, reason };
    syncCopy();
    model.invalidate();
  }
  model.drive = (time, dt) => {
    // Lenis also computes its delta from its RAF timestamp. Exclude demand-idle
    // time so the first wheel after a pause does not complete in a single step.
    lenisTime+=dt*1000;lenis.raf(lenisTime);
    model.motion.time = time; model.motion.frame++;
    model.motion.scrollY = scrollY; model.motion.velocity = lenis.velocity;
    const h = model.motion.height, s = scrollY;
    model.motion.phase = phaseAt(s);
    const p = progress.read(model.motion.raw.works);
    const renderedWall = wall.read(model.motion.portalCovered ? model.motion.raw.wall : 0);
    const renderedExpand = expand.read(renderedWall > .001 ? 1 : model.motion.raw.expand);
    // Stabilize the exact half index after N=6 → N=4 floating point conversion.
    // The 8-ULP tie tolerance is far smaller than a physical scroll pixel.
    model.motion.rendered = { progress: p, index: center.read(centeredIndex(p)),
      background: background.read(model.motion.raw.works) * (workCount + 1), intro: title.read(model.motion.raw.intro),
      prepare: prepare.read(model.motion.raw.prepare), expand: renderedExpand, wall: renderedWall };
    const nextPortalMode = model.motion.raw.prepare > 0;
    syncCopy();
    // ScrollTrigger uses numeric 0 after completion/interruption, not only undefined.
    const snapTween = triggers[4].getTween(true);
    model.motion.snapActive = hasActiveSnap(snapTween);
    // Legacy progress fades the intro only; assembly consumes shared rendered state.
    model.progress = s < h + introGap ? model.motion.raw.intro : 1;
    const identityProgress = Math.max(0, Math.min(1, s / introGap));
    const identityHidden = s >= introGap;
    if(identityProgress!==lastIdentity){lastIdentity=identityProgress;hero.style.opacity = String(1 - identityProgress ** 2 * (3 - 2 * identityProgress));}
    // Move only focus that would otherwise remain inside the hidden identity layer.
    if (identityHidden && hero.contains(document.activeElement)) identityFallback.focus({ preventScroll: true });
    if(identityHidden!==lastIdentityHidden){
      lastIdentityHidden=identityHidden;hero.style.visibility = identityHidden ? 'hidden' : 'visible';hero.inert = identityHidden;
      if (identityHidden) hero.setAttribute('aria-hidden', 'true');else hero.removeAttribute('aria-hidden');
    }
    const current = s < h + introGap ? 0 : model.motion.activeItem >= 0 ? model.motion.activeItem + 1 : Math.min(workCount, Math.max(1, Math.round(model.motion.rendered.index)));
    const chapter=s >= motionRange('wall', h)[0] ? 'wall' : s < h + introGap ? 'intro' : sections[Math.max(0, current - 1)]?.id || sections[0]?.id || 'intro';
    if(chapter!==lastChapter){lastChapter=chapter;body.dataset.chapter=chapter;}
    const onWall = wallReadingReady(renderedExpand,renderedWall,model.motion.portalCovered);
    if(onWall!==lastWall){
      lastWall=onWall;body.classList.toggle('home-wall-ready',onWall);body.classList.toggle('home-on-wall',onWall);wallContent.inert=!onWall;
      if(onWall)wallContent.removeAttribute('aria-hidden');else wallContent.setAttribute('aria-hidden','true');
    }
    const covered=(nextPortalMode || model.motion.rendered.prepare > .001) && !onWall;
    if(covered!==lastPortal){lastPortal=covered;body.classList.toggle('home-portal-cover',covered);}
    const currentIndex=chapter==='wall'?workCount+1:current;
    if(currentIndex!==lastCurrent){lastCurrent=currentIndex;chapterLinks.forEach((link,index)=>index===currentIndex?link.setAttribute('aria-current','location'):link.removeAttribute('aria-current'));}
  };
  model.afterFrame = dt => {
    // Camera and cards have consumed this revision in the same R3F frame.
    if (pendingFocus !== undefined && body.classList.contains('home-enhanced')) {
      const focusOrigin = pendingFocus; pendingFocus = undefined;
      delete body.dataset.homeRestoring;
      document.getElementById(focusOrigin)?.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent('lssh:home-restored', { detail: { ...model.motion.initialization, focusOrigin } }));
    }
    // Optional read-only diagnostics: browser tests subscribe; no product controls or text.
    if (document.documentElement.dataset.motionDiagnostics === 'true') {
      const snapshot = { ...structuredClone(model.motion), lerpers: {
        progress: progress.snapshot(), index: center.snapshot(), background: background.snapshot(), intro: title.snapshot(),
        prepare: prepare.snapshot(), expand: expand.snapshot(), wall: wall.snapshot(),
      } };
      // Opt-in inspection only: browser validation reads the latest event sample
      // without adding a second clock or mutating motion through page scripts.
      (window as Window & { __lsshHomeMotion?: unknown }).__lsshHomeMotion = snapshot;
      if (model.motion.frame % 3 === 0) body.dataset.homeMotionSample = JSON.stringify({
        frame: snapshot.frame, scrollY: snapshot.scrollY, phase: snapshot.phase,
        raw: snapshot.raw, rendered: snapshot.rendered, portal: snapshot.portal, portalCovered: snapshot.portalCovered,
        wall: snapshot.wall, glass: snapshot.glass, initialization: snapshot.initialization,
        cards: snapshot.cards, camera: snapshot.camera,
      });
      document.dispatchEvent(new CustomEvent('lssh:motion', { detail: snapshot }));
    }
    allLerpers.forEach(lerper => lerper.update(dt));
  };
  function abortSnap() {
    const tween = triggers[4].getTween(true);
    if (tween) tween.pause().kill();
  }
  window.addEventListener('wheel', abortSnap, { passive: true, signal: controller.signal });
  window.addEventListener('touchstart', abortSnap, { passive: true, signal: controller.signal });
  const resize = () => { measure(); lenis.resize(); ScrollTrigger.refresh(); model.invalidate(); };
  window.addEventListener('resize', resize, { signal: controller.signal });
  window.addEventListener('pageshow', event => { if (event.persisted) { ScrollTrigger.refresh(); initialize(scrollY, 'pageshow'); } }, { signal: controller.signal });
  document.addEventListener('click', event => {
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('.home-chapter-index a, .home-scroll, .home-header-wall, .home-wall-bottom a[href="#intro"]') : null;
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const url = new URL(anchor.href); if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(url.hash.slice(1)); if (!target) return;
    event.preventDefault(); abortSnap();
    lenis.scrollTo(target.offsetTop, { duration: 1.2, easing: t => Math.min(1, 1.001 - 2 ** (-10 * t)) });
    model.invalidate();
    const chapterHistory={...history.state};delete chapterHistory.lsshHome;
    history.replaceState(chapterHistory, '', url.hash);
  // Own same-page chapter links before Astro's bubble-phase route handler.
  }, { signal: controller.signal,capture:true });
  document.addEventListener('focusin', event => {
    const section = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-work-item]') : null;
    if (!section) return; const index = sections.indexOf(section);
    if (index >= 0 && model.motion.activeItem !== index) {
      initialize(section.offsetTop, 'keyboard');
    }
  }, { signal: controller.signal });
  document.addEventListener('lssh:home-restore', event => {
    const { y, focusOrigin, reason } = (event as CustomEvent<{ y: number; focusOrigin: string; reason?: string }>).detail;
    pendingFocus = focusOrigin;
    initialize(y, reason || 'restore');
  }, { signal: controller.signal });
  ScrollTrigger.refresh(); initialize(scrollY, 'layout');
  body.dataset.homeMotion = 'ready'; document.dispatchEvent(new Event('lssh:home-layout-ready'));
  return () => {
    model.drive = undefined; model.afterFrame = undefined;
    controller.abort(); disconnect(); triggers.forEach(trigger => trigger.kill()); lenis.destroy();
    delete body.dataset.homeMotion;
    delete body.dataset.homeMotionSample;
    delete (window as Window & { __lsshHomeMotion?: unknown }).__lsshHomeMotion;
    body.classList.remove('home-portal-cover', 'home-on-wall','home-wall-ready');
    wallContent.inert=false;wallContent.removeAttribute('aria-hidden');
    sections.forEach((section, index) => {
      section.inert = false; section.removeAttribute('aria-hidden'); delete section.dataset.workActive; delete section.dataset.workVisible;
      enableCta(index, true);
      containers[index].style.removeProperty('opacity'); containers[index].style.removeProperty('visibility');
      headings[index].style.removeProperty('transform');
    });
    hero.inert = false; hero.removeAttribute('aria-hidden');
    hero.style.removeProperty('opacity'); hero.style.removeProperty('visibility');
  };
}
