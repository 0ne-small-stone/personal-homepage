// Native page navigation and Pagefind remain in charge. Only article return context is added.
interface ReadingVisit {
  id: string;
  from: string;
  to: string;
  scrollY: number;
  search: string | null;
  label: string;
}

const storageKey = 'lssh:article-visits:v1';
const pendingKey = 'lssh:article-pending:v1';
const sourceKey = 'lsshArticleSource';
const returnKey = 'lsshArticleReturn';
const articlePaths = new Set<string>(JSON.parse(
  document.querySelector<HTMLMetaElement>('meta[name="lssh-article-paths"]')?.content || '[]',
));
let controller: AbortController | undefined;

function localUrl(value: string): URL | null {
  try {
    const url = new URL(value, location.href);
    return url.origin === location.origin ? url : null;
  } catch { return null; }
}

function visits(): ReadingVisit[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ReadingVisit =>
      typeof item?.id === 'string' && typeof item.from === 'string' && typeof item.to === 'string' &&
      Boolean(localUrl(item.from)) && articlePaths.has(localUrl(item.to)?.pathname || '') &&
      Number.isFinite(item.scrollY) && item.scrollY >= 0 &&
      (item.search === null || typeof item.search === 'string') && typeof item.label === 'string',
    ).slice(-20);
  } catch { return []; }
}

function plainClick(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  return !event.defaultPrevented && event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
    (!anchor.target || anchor.target === '_self') && !anchor.hasAttribute('download');
}

function remember(event: MouseEvent) {
  const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
  if (!anchor || !plainClick(event, anchor) || anchor.hasAttribute('data-article-return')) return;
  const destination = localUrl(anchor.href);
  if (!destination || !articlePaths.has(destination.pathname) || destination.pathname === location.pathname) return;
  const searchInput = anchor.closest('#starlight__search')?.querySelector<HTMLInputElement>('input');
  const visit: ReadingVisit = {
    id: crypto.randomUUID(), from: location.href, to: destination.href,
    scrollY: window.scrollY, search: searchInput?.value || null,
    label: searchInput ? '← 返回搜索结果' :
      document.querySelector('knowledge-type-filter') ? '← 返回学习总览' :
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
    const link = Array.from(document.querySelectorAll<HTMLAnchorElement>('.knowledge-list a, .sl-blog-preview-link'))
      .find((item) => item.href === visit.to);
    link?.focus({ preventScroll: true });
    // Wait until the browser has performed its native scroll restoration.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!signal.aborted) window.scrollTo({ top: visit.scrollY, behavior: 'instant' });
    }));
  }
}

function activate() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  const saved = visits();
  const back = document.querySelector<HTMLAnchorElement>('[data-article-return]');
  if (back) {
    const referrer = localUrl(document.referrer);
    let pending: string | null = null;
    try { pending = sessionStorage.getItem(pendingKey); } catch { /* Ordinary fallback. */ }
    const visit = [...saved].reverse().find((item) => {
      if (localUrl(item.to)?.pathname !== location.pathname) return false;
      if (history.state?.[returnKey] === item.id) return true;
      const from = localUrl(item.from);
      return item.id === pending && Boolean(referrer && from && referrer.pathname === from.pathname && referrer.search === from.search);
    });
    if (visit) {
      try {
        history.replaceState({ ...history.state, [returnKey]: visit.id }, '');
        // sessionStorage can be copied into a new tab; consume the same-tab handoff once.
        if (pending === visit.id) sessionStorage.removeItem(pendingKey);
      } catch { /* Keep real href. */ }
      back.href = visit.from;
      back.textContent = visit.label;
      back.addEventListener('click', (event) => {
        if (!plainClick(event, back) || history.length <= 1) return;
        event.preventDefault();
        history.back();
      }, { signal });
    }
  }
  const source = saved.find((item) => item.id === history.state?.[sourceKey]);
  if (source) restoreSource(source, signal);
  document.addEventListener('click', remember, { capture: true, signal });
}

window.addEventListener('pageshow', activate);
window.addEventListener('pagehide', () => controller?.abort());
// Astro's bundled module is deferred; install before any user interaction.
activate();
