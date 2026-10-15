/** Native language links enhanced with a one-use reading position, scoped to Someone. */
export function setupSomeoneLanguage(page: HTMLElement, signal: AbortSignal) {
  const link = document.querySelector<HTMLAnchorElement>('[data-language-switch]');
  if (!link) return () => {};
  const storageKey = 'lssh.someone.reading';
  const safeTop = () => (document.querySelector('.home-header')?.getBoundingClientRect().bottom ?? 72) + 24;
  let frame: number | undefined;

  link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href);
    destination.hash = '';
    try {
      sessionStorage.removeItem(storageKey);
      if (window.scrollY > 0) {
        const blocks = [...page.querySelectorAll<HTMLElement>('[data-reading-block]')];
        const anchor = blocks.filter(block => block.getBoundingClientRect().top <= safeTop()).at(-1) ?? blocks[0];
        if (anchor) {
          const rect = anchor.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (safeTop() - rect.top) / Math.max(1, rect.height)));
          destination.hash = anchor.id;
          sessionStorage.setItem(storageKey, JSON.stringify({ path: destination.pathname, id: anchor.id, ratio, created: Date.now() }));
        }
      }
    } catch { /* Storage is optional; the static link still reaches the other language. */ }
    link.href = destination.href;
  }, { signal });

  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      const pending = JSON.parse(raw) as { path?: unknown; id?: unknown; ratio?: unknown; created?: unknown };
      if (pending.path === location.pathname) {
        sessionStorage.removeItem(storageKey);
        if (typeof pending.id === 'string' && typeof pending.ratio === 'number' && Number.isFinite(pending.ratio)
          && typeof pending.created === 'number' && Date.now() - pending.created < 30_000) {
          const target = page.querySelector<HTMLElement>(`[data-reading-block][id="${CSS.escape(pending.id)}"]`);
          const ratio = Math.max(0, Math.min(1, pending.ratio));
          if (target) frame = requestAnimationFrame(() => {
            if (signal.aborted) return;
            const rect = target.getBoundingClientRect();
            window.scrollTo({ top: Math.max(0, window.scrollY + rect.top + ratio * rect.height - safeTop()), behavior: 'instant' });
            link.focus({ preventScroll: true });
          });
        }
      }
    }
  } catch { /* Malformed or unavailable storage must not block navigation. */ }

  return () => { if (frame !== undefined) cancelAnimationFrame(frame); };
}
