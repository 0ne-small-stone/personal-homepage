// Only observe the existing native scroller; never replace its input or position.
export function mountMusicSidebarScroll(frame: HTMLElement) {
  const nav = frame.querySelector<HTMLElement>('nav');
  const view = frame.ownerDocument.defaultView;
  if (!nav || !view) return () => {};
  let idle: number | undefined;
  let disposed = false;
  const set = (name: string, value: boolean) => {
    const next = String(value);
    if (frame.dataset[name] !== next) frame.dataset[name] = next;
  };
  const measure = () => {
    if (disposed) return;
    const remaining = nav.scrollHeight - nav.clientHeight;
    const overflow = nav.clientHeight > 0 && remaining > 1;
    set('overflow', overflow);
    set('above', overflow && nav.scrollTop > 1);
    set('below', overflow && remaining - nav.scrollTop > 1);
  };
  const clear = () => {
    if (idle !== undefined) view.clearTimeout(idle);
    idle = undefined;
    set('scrolling', false);
  };
  const scroll = () => {
    measure();
    clear();
    if (frame.ownerDocument.hidden) return;
    set('scrolling', true);
    idle = view.setTimeout(() => { idle = undefined; set('scrolling', false); }, 1000);
  };
  const visibility = () => { if (frame.ownerDocument.hidden) clear(); else measure(); };
  nav.addEventListener('scroll', scroll, {passive: true});
  frame.ownerDocument.addEventListener('visibilitychange', visibility);
  const observer = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(measure) : undefined;
  if (observer) {
    observer.observe(nav);
    for (const child of nav.children) observer.observe(child);
  } else view.addEventListener('resize', measure);
  measure();
  return () => {
    disposed = true;
    clear();
    observer?.disconnect();
    nav.removeEventListener('scroll', scroll);
    view.removeEventListener('resize', measure);
    frame.ownerDocument.removeEventListener('visibilitychange', visibility);
    for (const name of ['overflow', 'above', 'below', 'scrolling']) delete frame.dataset[name];
  };
}
