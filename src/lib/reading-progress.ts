import { parseReadingProgress, readingBlockIndex, readingSignature, shouldResumeReading, type ReadingProgress } from './reading-progress-state';

interface ReadingSession {
  content: HTMLElement;
  key: string;
  controller: AbortController;
  ready: boolean;
  paused: boolean;
  interacted: boolean;
  timer?: number;
}

let current: ReadingSession | undefined;
let navigationType: string | undefined;

function blocks(content: HTMLElement): HTMLElement[] {
  return Array.from(content.querySelectorAll<HTMLElement>('h2, h3, p, li, pre, blockquote, figure, table'))
    .filter((element) => !element.closest('.sl-blog-post-footer') && element.getBoundingClientRect().height > 0);
}

function readingLine(): number {
  if (document.documentElement.hasAttribute('data-reading-immersive')) return 24;
  const toolbar = document.querySelector<HTMLElement>('.article-reading-actions');
  if (toolbar) return (parseFloat(getComputedStyle(toolbar).top) || 0) + toolbar.offsetHeight + 16;
  return Math.max(24, parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
}

function scroller(): Element {
  return document.documentElement.hasAttribute('data-reading-immersive')
    ? document.querySelector('.main-frame')! : document.scrollingElement!;
}

function snapshot(session: ReadingSession): ReadingProgress | undefined {
  const candidates = blocks(session.content), line = readingLine();
  const block = candidates.findIndex((element) => element.getBoundingClientRect().bottom > line);
  if (block < 0) return;
  const element = candidates[block], rect = element.getBoundingClientRect(), scroll = scroller();
  const heading = candidates.slice(0, block + 1).reverse().find((item) => item.matches('h2[id], h3[id]'))?.id;
  return {
    version: 1, block, signature: readingSignature(element.textContent || ''),
    fraction: Math.max(0, Math.min(1, (line - rect.top) / rect.height)),
    gap: Math.max(0, rect.top - line),
    ratio: Math.max(0, Math.min(1, scroll.scrollTop / Math.max(1, scroll.scrollHeight - scroll.clientHeight))),
    start: scroll.scrollTop <= 1 && !document.documentElement.hasAttribute('data-reading-immersive'),
    heading,
  };
}

function save() {
  const session = current;
  if (!session?.ready || session.paused || !session.content.isConnected) return;
  const progress = snapshot(session);
  if (progress) {
    try { localStorage.setItem(session.key, JSON.stringify(progress)); } catch { /* Reading remains available without storage. */ }
  }
}

function dispose() {
  if (current?.timer) clearTimeout(current.timer);
  current?.controller.abort();
  current = undefined;
}

function restore(session: ReadingSession, progress: ReadingProgress) {
  if (current !== session || session.controller.signal.aborted || session.interacted) return;
  const scroll = scroller();
  if (progress.start) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
  const candidates = blocks(session.content);
  const index = readingBlockIndex(candidates.map((element) => readingSignature(element.textContent || '')), progress);
  const element = index === undefined ? (progress.heading ? document.getElementById(progress.heading) : null) : candidates[index];
  if (element && session.content.contains(element)) {
    const rect = element.getBoundingClientRect();
    const delta = rect.top + (index === undefined ? 0 : progress.fraction * rect.height - progress.gap) - readingLine();
    window.scrollBy({ top: delta, behavior: 'instant' });
  } else window.scrollTo({ top: progress.ratio * Math.max(0, scroll.scrollHeight - scroll.clientHeight), behavior: 'instant' });
}

function activate(persisted = false) {
  const entry = document.querySelector<HTMLMetaElement>('meta[name="lssh-reading-article"]')?.content;
  const content = document.querySelector<HTMLElement>('.becoming-article .sl-markdown-content');
  if (!entry || !content) { dispose(); navigationType = undefined; return; }
  if (current?.content === content) return;
  dispose();
  const session: ReadingSession = { content, key: `lssh:reading-progress:v1:${entry}`, controller: new AbortController(), ready: false, paused: false, interacted: false };
  current = session;
  const { signal } = session.controller;
  let progress: ReadingProgress | undefined;
  if (shouldResumeReading(location.hash, navigationType, persisted)) {
    try { progress = parseReadingProgress(localStorage.getItem(session.key)); } catch { /* Storage is optional. */ }
  }
  navigationType = undefined;
  const cancelRefit = () => { session.interacted = true; session.ready = true; };
  for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) document.addEventListener(event, cancelRefit, { signal, capture: true, passive: true });
  const scheduleSave = () => {
    if (session.timer || session.paused || !session.ready) return;
    session.timer = window.setTimeout(() => { session.timer = undefined; save(); }, 500);
  };
  window.addEventListener('scroll', scheduleSave, { signal, passive: true });
  document.querySelector('.main-frame')?.addEventListener('scroll', scheduleSave, { signal, passive: true });
  const refit = () => requestAnimationFrame(() => {
    if (progress) restore(session, progress);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (signal.aborted) return;
    if (progress) restore(session, progress);
    session.ready = true;
  }));
  document.fonts.ready.then(refit);
  content.querySelectorAll('img').forEach((image) => {
    if (!image.complete) image.addEventListener('load', refit, { signal, once: true });
  });
}

// Save before route teardown or reading-mode cleanup can move the old document.
document.addEventListener('astro:before-preparation', (event) => {
  save();
  const session = current;
  if (!session) return;
  session.paused = true;
  const navigation = event as Event & { signal?: AbortSignal };
  navigation.signal?.addEventListener('abort', () => {
    if (current === session && session.content.isConnected) session.paused = false;
  }, { once: true });
}, { capture: true });
document.addEventListener('astro:before-swap', (event) => {
  navigationType = (event as Event & { navigationType?: string }).navigationType;
  dispose();
}, { capture: true });
document.addEventListener('astro:page-load', () => activate());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); }, { capture: true });
window.addEventListener('pagehide', () => { save(); dispose(); }, { capture: true });
window.addEventListener('pageshow', (event) => activate(event.persisted));
activate();
