/** The native picture owns both resolutions. The renderer consumes its decoded image. */
export function installReliefLoading(doc: Document = document) {
  const sections = [...doc.querySelectorAll<HTMLElement>('[data-work-item]')];
  if (!sections.length) return () => {};
  const win = doc.defaultView!;
  const lifetime = new win.AbortController();
  const { signal } = lifetime;
  const pending = new Map<HTMLElement, HTMLImageElement>();
  let observer: IntersectionObserver | undefined;

  function request(section: HTMLElement | null, explicit = false) {
    if (signal.aborted) return;
    const link = section?.querySelector<HTMLElement>('[data-relief-full]');
    const picture = link?.querySelector('picture');
    const preview = picture?.querySelector('img');
    if (!section || !link?.dataset.reliefFull || !picture || !preview) return;
    const active = pending.get(section);
    if (active) {
      if (explicit) active.fetchPriority = 'high';
      return;
    }

    const image = new win.Image();
    image.className = preview.className;
    image.alt = preview.alt;
    image.width = Number(preview.getAttribute('width'));
    image.height = Number(preview.getAttribute('height'));
    image.fetchPriority = explicit ? 'high' : 'low';
    pending.set(section, image);
    image.src = link.dataset.reliefFull;
    image.decode().then(() => {
      if (signal.aborted || !picture.isConnected) return;
      picture.replaceWith(image);
      observer?.unobserve(section);
      link.dispatchEvent(new win.Event('lssh:relief-ready'));
    }).catch(() => {
      // Keep the inline painting. A later approach or selection can retry this chapter.
    }).finally(() => { pending.delete(section); });
  }

  const followLocation = () => request(doc.getElementById(win.location.hash.slice(1)), true);
  const followLink = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof win.Element ? event.target.closest<HTMLAnchorElement>('a[href*="#"]') : null;
    if (link?.hash && link.origin === win.location.origin && link.pathname === win.location.pathname && link.search === win.location.search) {
      request(doc.getElementById(link.hash.slice(1)), true);
    }
  };
  const observe = () => {
    observer?.disconnect();
    // Observe the sections in document flow. The enhanced artwork itself is fixed.
    observer = new win.IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) request(entry.target as HTMLElement);
    }, { rootMargin: `${Math.round(win.innerHeight * .6)}px 0px` });
    sections.forEach(section => observer!.observe(section));
  };
  const startProximity = () => { if (!observer) observe(); };
  // A deep link or Back can pass through several sections while the native
  // page becomes the enhanced scene. Load its destination through that handoff.
  const navigation = win.performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  const restoring = win.history.state?.lsshHome || (navigation &&
    new URL(navigation.name).pathname === win.location.pathname && ['reload', 'back_forward'].includes(navigation.type));
  if (!restoring) followLocation();
  if (!restoring && (!win.location.hash || win.location.hash === '#intro')) startProximity();
  doc.addEventListener('lssh:home-return-target', event => {
    request(doc.getElementById((event as CustomEvent<{chapterId:string}>).detail.chapterId), true);
  }, { signal });
  doc.addEventListener('lssh:home-restored', startProximity, { signal });
  // Native, reduced-motion and fallback pages can also resume ordinary browsing.
  for (const type of ['wheel','touchstart']) doc.addEventListener(type, startProximity, { passive:true, signal });
  doc.addEventListener('keydown', event => {
    if (['Tab','ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) startProximity();
  }, { signal });
  doc.addEventListener('pointerdown', event => {
    if (event.target === doc.documentElement) startProximity();
  }, { signal });
  doc.addEventListener('focusin', event => {
    if (event.target instanceof win.Element) request(event.target.closest('[data-work-item]'), true);
  }, { signal });
  doc.addEventListener('click', followLink, { capture: true, signal });
  win.addEventListener('hashchange', followLocation, { signal });
  win.addEventListener('resize', () => { if (observer) observe(); }, { signal });
  return () => {
    lifetime.abort();
    observer?.disconnect();
    for (const image of pending.values()) {
      if (!image.isConnected) image.removeAttribute('src');
    }
    pending.clear();
  };
}
