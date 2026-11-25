const chapterLinks = '.home-chapter-index a, .home-scroll, .home-header-wall, .home-wall-bottom a[href="#intro"]';

/** Native chapter navigation works before the optional motion controller mounts. */
export function installHomeChapterFocus(doc: Document = document) {
  const win = doc.defaultView!;
  const lifetime = new win.AbortController();
  const options = { signal: lifetime.signal };
  const nativeIndex = () => doc.body.classList.contains('has-journey') && !doc.body.dataset.homeStatus && !doc.body.dataset.homeMotion;
  const syncIndex = (hash: string) => {
    if (!nativeIndex()) return;
    const links = [...doc.querySelectorAll<HTMLAnchorElement>('.home-chapter-index a[href^="#"]')];
    let current = links.find(link => link.hash === hash);
    if (!current) {
      current = links[0];
      for (const link of links) {
        const rect = doc.getElementById(link.hash.slice(1))?.getBoundingClientRect();
        if (rect && rect.height > 0 && rect.top <= win.innerHeight * .25) current = link;
      }
    }
    for (const link of links) {
      if (link === current) {
        if (!link.hasAttribute('aria-current')) link.setAttribute('aria-current', 'location');
      } else if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
    }
  };
  const syncLocation = () => syncIndex(win.location.hash);
  let scrollFrame = 0;
  const onScroll = () => {
    if (scrollFrame || !nativeIndex()) return;
    scrollFrame = win.requestAnimationFrame(() => { scrollFrame = 0; syncIndex(''); });
  };
  for (const type of ['pageshow', 'hashchange', 'popstate']) win.addEventListener(type, syncLocation, options);
  doc.addEventListener('astro:page-load', syncLocation, options);
  win.addEventListener('scroll', onScroll, { ...options, passive: true });
  syncLocation();
  let cancel = () => {};
  const activate = (event: MouseEvent) => {
    cancel();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target instanceof win.Element ? event.target.closest<HTMLAnchorElement>(chapterLinks) : null;
    if (!link || link.origin !== win.location.origin || link.pathname !== win.location.pathname || link.search !== win.location.search) return;
    const section = doc.getElementById(link.hash.slice(1));
    const entry = section?.querySelector<HTMLAnchorElement>('.home-cta, .home-scroll');
    if (!section?.matches('[data-chapter]') || !entry) return;

    const events = new win.AbortController();
    const focusWhenReady = () => {
      if (link.hash !== win.location.hash || entry.closest('[inert], [aria-hidden="true"]') || win.getComputedStyle(entry).visibility !== 'visible') return;
      syncIndex(link.hash);
      entry.focus({ preventScroll: true });
      cancel();
    };
    const observer = new win.MutationObserver(focusWhenReady);
    observer.observe(section, { subtree: true, attributes: true, attributeFilter: ['inert', 'aria-hidden'] });
    const frame = win.requestAnimationFrame(focusWhenReady);
    cancel = () => {
      observer.disconnect();
      win.cancelAnimationFrame(frame);
      events.abort();
      cancel = () => {};
    };
    // A second gesture or history traversal belongs to the visitor.
    for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'pagehide']) {
      win.addEventListener(type, cancel, { capture: true, passive: true, signal: events.signal });
    }
    doc.addEventListener('astro:before-swap', cancel, { signal: events.signal });
    win.addEventListener('popstate', () => { if (win.location.hash !== link.hash) cancel(); }, { signal: events.signal });
    win.addEventListener('hashchange', focusWhenReady, { signal: events.signal });
  };
  doc.addEventListener('click', activate, true);
  return () => {
    cancel();
    lifetime.abort();
    win.cancelAnimationFrame(scrollFrame);
    doc.removeEventListener('click', activate, true);
  };
}
