import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { introGap, workCount, motionRange, MotionLerper, type MotionChannel } from './works-motion';
import type { JourneyModel } from './scene-state';

export function installWorksMotion(model: JourneyModel) {
  gsap.registerPlugin(ScrollTrigger);
  const body = document.body;
  const sections = [...document.querySelectorAll<HTMLElement>('[data-work-item]')];
  const hero = document.querySelector<HTMLElement>('#intro .home-chapter-viewport')!;
  const introTitle = document.querySelector<HTMLElement>('.home-works-intro-title')!;
  const controller = new AbortController();
  const timelines = new Map<number, gsap.core.Timeline>();
  const headings = sections.map(section => section.querySelector<HTMLHeadingElement>('h2')!);
  const originals = headings.map(heading => heading.textContent!);
  const characters = headings.map((heading, index) => {
    heading.setAttribute('aria-label', originals[index]);
    heading.replaceChildren(...Array.from(originals[index], char => {
      const span = document.createElement('span'); span.textContent = char; span.setAttribute('aria-hidden', 'true');
      span.className = 'home-title-char'; return span;
    }));
    return [...heading.children];
  });
  const containers = sections.map(section => section.querySelector<HTMLElement>('.home-chapter-viewport')!);
  const details = sections.map(section => [...section.querySelectorAll<HTMLElement>('.home-description, .home-cta, .home-chapter-note')]);

  function hide(index: number, immediate = false) {
    timelines.get(index)?.kill();
    sections[index].inert = true;
    sections[index].setAttribute('aria-hidden', 'true');
    sections[index].dataset.workActive = 'false';
    if (model.motion.activeItem === index) model.motion.activeItem = -1;
    if (immediate) {
      gsap.set(containers[index], { autoAlpha: 0 });
      gsap.set(characters[index], { y: 10, opacity: 0 });
      gsap.set(details[index], { opacity: 0 });
      return;
    }
    const tl = gsap.timeline({ onComplete: () => { sections[index].dataset.workVisible = 'false'; } });
    tl.to(characters[index], { y: -10, opacity: 0, duration: .4, ease: 'power2.in', stagger: .001 }, 0)
      .to(details[index], { opacity: 0, duration: .3 }, 0)
      .to(containers[index], { autoAlpha: 0, duration: .5, ease: 'power2.inOut' }, 0);
    timelines.set(index, tl);
  }

  function show(index: number, keyboard = false) {
    if (model.motion.activeItem === index && !keyboard) return;
    if (model.motion.activeItem >= 0 && model.motion.activeItem !== index) hide(model.motion.activeItem);
    timelines.get(index)?.kill();
    const wasHidden = Number(gsap.getProperty(containers[index], 'opacity')) < .001;
    if (wasHidden) gsap.set(characters[index], { y: 10, opacity: 0 });
    sections[index].dataset.workVisible = 'true';
    sections[index].dataset.workActive = 'true';
    sections[index].inert = false; sections[index].removeAttribute('aria-hidden');
    model.motion.activeItem = index;
    gsap.set(containers[index], { visibility: 'visible' });
    if (keyboard) {
      gsap.set(containers[index], { opacity: 1 });
      gsap.set(characters[index], { y: 0, opacity: 1 });
      gsap.set(details[index], { opacity: 1 }); return;
    }
    const tl = gsap.timeline();
    tl.to(containers[index], { opacity: 1, duration: .3, ease: 'power2.out' }, 0)
      .to(characters[index], { y: 0, opacity: 1, duration: .7, ease: 'power4.out', stagger: .01 }, 0)
      .to(details[index], { opacity: 1, duration: .5, ease: 'power2.out' }, .3);
    timelines.set(index, tl);
  }

  const measure = () => {
    model.motion.height = innerHeight;
    body.style.setProperty('--journey-height', `${innerHeight}px`);
  };
  measure(); sections.forEach((_, index) => hide(index, true));
  const channels: MotionChannel[] = ['kv', 'intro', 'works', 'event', 'snap', 'outro', 'wall'];
  const triggers = channels.map(channel => ScrollTrigger.create({
    id: `lssh-${channel}`, start: () => motionRange(channel, model.motion.height)[0],
    end: () => motionRange(channel, model.motion.height)[1],
    onUpdate: trigger => { model.motion.raw[channel] = trigger.progress; },
    onRefresh: trigger => { model.motion.raw[channel] = trigger.progress; },
    ...(channel === 'snap' ? { snap: { snapTo: 1 / (workCount - 1), duration: 1, delay: .1, ease: 'power3', directional: false } } : {}),
  }));
  sections.forEach((_, index) => triggers.push(ScrollTrigger.create({
    id: `lssh-item-${index}`, start: () => (1.5 + index) * model.motion.height + introGap,
    end: () => (2.5 + index) * model.motion.height + introGap,
    onEnter: () => show(index), onEnterBack: () => show(index),
    onLeave: () => hide(index), onLeaveBack: () => hide(index),
  })));

  const lenis = new Lenis({ lerp: .1, smoothWheel: true, syncTouch: false, autoRaf: false,
    prevent: node => node.matches('input, textarea, select, [contenteditable], [data-lenis-prevent], .home-guestbook'),
  });
  const disconnect = lenis.on('scroll', () => ScrollTrigger.update());
  const progress = new MotionLerper(1), center = new MotionLerper(.5), background = new MotionLerper(.7), title = new MotionLerper(.3);
  const allLerpers = [progress, center, background, title];
  model.drive = (time, _dt) => {
    lenis.raf(time);
    model.motion.time = time; model.motion.frame++;
    model.motion.scrollY = scrollY; model.motion.velocity = lenis.velocity;
    const h = model.motion.height, s = scrollY;
    model.motion.phase = s <= introGap ? 'kv' : s < h + introGap ? 'works_intro' : s < (workCount + 1) * h + introGap ? 'works' : s < (workCount + 2.5) * h + introGap ? 'works_outro' : 'wall';
    const p = progress.read(model.motion.raw.works), o = (workCount + 1) * p;
    // Stabilize the exact half index after N=6 → N=4 floating point conversion.
    // The 8-ULP tie tolerance is far smaller than a physical scroll pixel.
    const rounded = Math.round(o + Number.EPSILON * 8);
    model.motion.rendered = { progress: p, index: center.read(rounded + .4 * (o - rounded)),
      background: background.read(model.motion.raw.works) * (workCount + 1), intro: title.read(model.motion.raw.intro) };
    model.motion.snapActive = Boolean(triggers[4].getTween(true)?.isActive());
    // Existing glass/wall poses are retained until their separate interaction slices.
    model.progress = s < h + introGap ? model.motion.raw.intro : model.motion.raw.wall > 0 ? 4.65 + .35 * model.motion.raw.wall : 1 + Math.max(0, model.motion.rendered.index - 1);
    hero.style.opacity = String(1 - model.motion.raw.intro);
    hero.inert = s > introGap;
    const current = s < h + introGap ? 0 : model.motion.activeItem >= 0 ? model.motion.activeItem + 1 : Math.min(4, Math.max(1, Math.round(model.motion.rendered.index)));
    body.dataset.chapter = s >= motionRange('wall', h)[0] ? 'wall' : s < h + introGap ? 'intro' : sections[Math.max(0, current - 1)]?.id || 'projects';
    body.classList.toggle('home-on-wall', model.motion.raw.wall > .98);
    document.querySelectorAll('.home-chapter-index a').forEach((link, index) => index === (body.dataset.chapter === 'wall' ? 5 : current) ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
  };
  model.afterFrame = dt => {
    // Optional read-only diagnostics: browser tests subscribe; no product controls or text.
    if (document.documentElement.dataset.motionDiagnostics === 'true')
      document.dispatchEvent(new CustomEvent('lssh:motion', { detail: structuredClone(model.motion) }));
    allLerpers.forEach(lerper => lerper.update(dt));
  };
  const abortSnap = () => triggers[4].getTween(true)?.kill();
  window.addEventListener('wheel', abortSnap, { passive: true, signal: controller.signal });
  window.addEventListener('touchstart', abortSnap, { passive: true, signal: controller.signal });
  const resize = () => { measure(); lenis.resize(); ScrollTrigger.refresh(); model.invalidate(); };
  window.addEventListener('resize', resize, { signal: controller.signal });
  window.addEventListener('pageshow', () => { lenis.resize(); lenis.scrollTo(scrollY, { immediate: true, force: true }); ScrollTrigger.refresh(); }, { signal: controller.signal });
  document.addEventListener('click', event => {
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('.home-chapter-index a, .home-scroll, .home-header-wall, .home-wall-bottom a[href="#intro"]') : null;
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const url = new URL(anchor.href); if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(url.hash.slice(1)); if (!target) return;
    event.preventDefault(); abortSnap();
    lenis.scrollTo(target.offsetTop, { duration: 1.2, easing: t => Math.min(1, 1.001 - 2 ** (-10 * t)) });
    history.replaceState(history.state, '', url.hash);
  }, { signal: controller.signal });
  document.addEventListener('focusin', event => {
    const section = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-work-item]') : null;
    if (!section) return; const index = sections.indexOf(section);
    if (index >= 0 && model.motion.activeItem !== index) {
      abortSnap(); lenis.scrollTo(section.offsetTop, { immediate: true, force: true }); show(index, true);
    }
  }, { signal: controller.signal });
  document.addEventListener('lssh:home-restore', event => {
    const { y, focusOrigin } = (event as CustomEvent<{ y: number; focusOrigin: string }>).detail;
    abortSnap(); lenis.scrollTo(y, { immediate: true, force: true }); ScrollTrigger.update();
    const focus = document.getElementById(focusOrigin), section = focus?.closest<HTMLElement>('[data-work-item]');
    const index = section ? sections.indexOf(section) : -1;
    if (index >= 0) show(index, true);
    focus?.focus({ preventScroll: true });
  }, { signal: controller.signal });
  ScrollTrigger.refresh(); ScrollTrigger.update(); model.invalidate();
  body.dataset.homeMotion = 'ready'; document.dispatchEvent(new Event('lssh:home-layout-ready'));
  return () => {
    model.drive = undefined; model.afterFrame = undefined;
    controller.abort(); disconnect(); triggers.forEach(trigger => trigger.kill()); lenis.destroy();
    delete body.dataset.homeMotion;
    timelines.forEach(timeline => timeline.kill());
    sections.forEach((section, index) => {
      section.inert = false; section.removeAttribute('aria-hidden'); delete section.dataset.workActive; delete section.dataset.workVisible;
      gsap.set(containers[index], { clearProps: 'all' }); gsap.set(details[index], { clearProps: 'all' });
      headings[index].textContent = originals[index]; headings[index].removeAttribute('aria-label');
    });
    hero.inert = false; hero.style.removeProperty('opacity'); introTitle.removeAttribute('style');
  };
}
