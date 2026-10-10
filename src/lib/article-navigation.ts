// Native navigation/Pagefind/PDF.js stay in charge. Reuse the article return adapter for all reading.
import { sitePath } from './paths';

interface ReadingVisit {
  id: string;
  from: string;
  to: string;
  scrollY: number;
  search: string | null;
  label: string;
  focusScope?: keyof typeof focusScopes;
}

const focusScopes = {
  list: '.knowledge-list a',
  blog: '.sl-blog-preview-link',
  related: '.related-knowledge a',
  content: '.sl-markdown-content a',
  sidebar: '.sidebar a',
};

const storageKey = 'lssh:article-visits:v1';
const pendingKey = 'lssh:article-pending:v1';
const sourceKey = 'lsshArticleSource';
const returnKey = 'lsshArticleReturn';
const tagRoot = sitePath('knowledge/blog/tags');
const readingPaths = new Set<string>(JSON.parse(
  document.querySelector<HTMLMetaElement>('meta[name="lssh-reading-paths"]')?.content || '[]',
));
const externalNotes = new Set<string>((JSON.parse(
  document.querySelector<HTMLMetaElement>('meta[name="lssh-external-notes"]')?.content || '[]',
) as string[]).map((value) => new URL(value).href));
let controller: AbortController | undefined;
let activeVisitId: string | undefined;

function localUrl(value: string): URL | null {
  try {
    const url = new URL(value, location.href);
    return url.origin === location.origin ? url : null;
  } catch { return null; }
}

function disabledTagSource(value: string): boolean {
  return document.querySelector<HTMLMetaElement>('meta[name="lssh-tag-browsing"]')?.content === 'false' &&
    Boolean(localUrl(value)?.pathname.startsWith(tagRoot));
}

function visits(): ReadingVisit[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ReadingVisit =>
      typeof item?.id === 'string' && typeof item.from === 'string' && typeof item.to === 'string' &&
      Boolean(localUrl(item.from)) && !disabledTagSource(item.from) && readingTarget(item.to) &&
      Number.isFinite(item.scrollY) && item.scrollY >= 0 &&
      (item.search === null || typeof item.search === 'string') && typeof item.label === 'string' &&
      (item.focusScope === undefined || (typeof item.focusScope === 'string' && Object.hasOwn(focusScopes, item.focusScope))),
    ).slice(-20);
  } catch { return []; }
}

function readingTarget(value: string): boolean {
  const local = localUrl(value);
  return local ? readingPaths.has(local.pathname) : externalNotes.has(value);
}

function plainClick(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  return !event.defaultPrevented && event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
    (!anchor.target || anchor.target === '_self') && !anchor.hasAttribute('download');
}

function remember(event: MouseEvent) {
  const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
  if (!anchor || !plainClick(event, anchor) || anchor.hasAttribute('data-article-return') ||
    disabledTagSource(location.href)) return;
  const destination = new URL(anchor.href);
  if (!readingTarget(destination.href) ||
    (destination.origin === location.origin && destination.pathname === location.pathname)) return;
  const searchInput = anchor.closest('#starlight__search')?.querySelector<HTMLInputElement>('input');
  const visit: ReadingVisit = {
    id: crypto.randomUUID(), from: location.href, to: destination.href,
    scrollY: window.scrollY, search: searchInput?.value || null,
    focusScope: (Object.keys(focusScopes) as (keyof typeof focusScopes)[])
      .find((scope) => anchor.matches(focusScopes[scope])),
    label: searchInput ? '← 返回搜索结果' :
      document.querySelector('knowledge-type-filter') ? '← 返回学习总览' :
      document.querySelector('.sl-blog-posts[data-blog-page="tag"]') ? '← 返回标签结果' :
      document.querySelector('.sl-blog-preview') ? '← 返回文章列表' : '← 返回上一页',
  };
  try {
    sessionStorage.setItem(storageKey, JSON.stringify([...visits(), visit].slice(-20)));
    sessionStorage.setItem(pendingKey, visit.id);
    history.replaceState({ ...history.state, [sourceKey]: visit.id }, '');
  } catch { /* Storage unavailable: ordinary links still work. */ }
}

// Pagefind initializes on idle and renders results asynchronously. Watch only its own subtree.
function whenAvailable(root: Node, ready: () => boolean, signal: AbortSignal) {
  if (signal.aborted || ready()) return;
  const observer = new MutationObserver(() => { if (ready()) stop(); });
  const timeout = window.setTimeout(stop, 10_000);
  function stop() { observer.disconnect(); window.clearTimeout(timeout); signal.removeEventListener('abort', stop); }
  signal.addEventListener('abort', stop, { once: true });
  observer.observe(root, { childList: true, subtree: true, attributes: true });
}

function restoreSource(visit: ReadingVisit, signal: AbortSignal) {
  if (visit.from !== location.href) return;
  if (visit.search !== null) {
    const search = document.querySelector('site-search');
    if (!search) return;
    whenAvailable(search, () => {
      const input = search.querySelector<HTMLInputElement>('.pagefind-ui__search-input');
      const open = search.querySelector<HTMLButtonElement>('[data-open-modal]');
      const dialog = search.querySelector('dialog');
      if (!input || !open || open.disabled || !dialog) return false;
      if (!dialog.open) open.click();
      input.value = visit.search!;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      whenAvailable(search.querySelector('#starlight__search')!, () => {
        // A new query or closing the dialog cancels the pending focus restoration.
        if (!dialog.open || input.value !== visit.search) return true;
        const links = Array.from(search.querySelectorAll<HTMLAnchorElement>('#starlight__search a[href]'));
        const result = links.find((link) => link.href === visit.to) ||
          links.find((link) => localUrl(link.href)?.pathname === localUrl(visit.to)?.pathname);
        if (!result) return false;
        result.focus({ preventScroll: true });
        return true;
      }, signal);
      return true;
    }, signal);
  } else {
    const selector = visit.focusScope && Object.hasOwn(focusScopes, visit.focusScope)
      ? focusScopes[visit.focusScope] : Object.values(focusScopes).join(', ');
    // Restore after native history/filter rendering so it cannot replace our focus.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (signal.aborted) return;
      const link = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector))
        .find((item) => item.href === visit.to && item.getClientRects().length > 0);
      link?.focus({ preventScroll: true });
      window.scrollTo({ top: visit.scrollY, behavior: 'instant' });
    }));
  }
}

function activate() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  const saved = visits();
  const referrer = localUrl(document.referrer);
  let pending: string | null = null;
  try { pending = sessionStorage.getItem(pendingKey); } catch { /* Ordinary fallback. */ }
  const back = document.querySelector<HTMLAnchorElement>('[data-article-return]');
  if (back) {
    const visit = [...saved].reverse().find((item) => {
      if (localUrl(item.to)?.pathname !== location.pathname) return false;
      // Native TOC links can replace history.state; retain this document's own handoff.
      if (history.state?.[returnKey] === item.id || activeVisitId === item.id) return true;
      const from = localUrl(item.from);
      return item.id === pending && Boolean(referrer && from && referrer.pathname === from.pathname && referrer.search === from.search);
    });
    if (visit) {
      activeVisitId = visit.id;
      try {
        history.replaceState({ ...history.state, [returnKey]: visit.id }, '');
        // sessionStorage can be copied into a new tab; consume the same-tab handoff once.
        if (pending === visit.id) sessionStorage.removeItem(pendingKey);
      } catch { /* Keep real href. */ }
      back.href = visit.from;
      back.textContent = visit.label;
      back.addEventListener('click', (event) => {
        if (!plainClick(event, back)) return;
        // A chapter hash can add another entry; follow the real source href directly.
        if (location.href !== visit.to) {
          try { sessionStorage.setItem(pendingKey, visit.id); } catch { /* Real href still works. */ }
          return;
        }
        if (history.length <= 1) return;
        event.preventDefault();
        history.back();
      }, { signal });
    }
  }
  const source = saved.find((item) => item.id === history.state?.[sourceKey]) || saved.find((item) =>
    item.id === pending && item.from === location.href && referrer?.pathname === localUrl(item.to)?.pathname,
  );
  if (source) {
    if (pending === source.id) {
      try {
        history.replaceState({ ...history.state, [sourceKey]: source.id }, '');
        sessionStorage.removeItem(pendingKey);
      } catch { /* Storage unavailable: keep native navigation. */ }
    }
    restoreSource(source, signal);
  }
  document.addEventListener('click', remember, { capture: true, signal });
}

window.addEventListener('pageshow', activate);
// Also refresh when the browser restores history state within the document.
window.addEventListener('popstate', activate);
window.addEventListener('pagehide', () => controller?.abort());
// Astro's bundled module is deferred; install before any user interaction.
activate();
