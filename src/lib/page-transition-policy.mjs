// F07 is a home/entry relationship, never an all-route animation.
export const transitionTiming = Object.freeze({ exit: 160, enter: 340, quiet: 120, restoreDeadline: 1000 });
export function entryRoute(url, base = '/personal-homepage/') {
  const prefix = base.replace(/\/$/, '');
  const path = url.pathname.replace(/\/$/, '');
  if (path === prefix) return 'home';
  const entries = new Map([
    [`${prefix}/about`, 'someone-en'], [`${prefix}/zh/about`, 'someone-zh'],
    [`${prefix}/links`, 'elsewhere'], [`${prefix}/knowledge`, 'becoming'],
    [`${prefix}/music`, 'music'], [`${prefix}/showcase`, 'afterimage'],
  ]);
  return entries.get(path) ?? null;
}
export function transitionPair(from, to, base) {
  if (from.origin !== to.origin || from.pathname === to.pathname) return null;
  const source = entryRoute(from, base), target = entryRoute(to, base);
  return source && target && (source === 'home') !== (target === 'home') ? { source, target } : null;
}
export function transitionMotion({ supported, reduced, paused, staticPage, preview = '' }) {
  if (!supported || staticPage || preview === 'off' || preview === 'static') return 'none';
  return reduced || paused || preview === 'reduced' ? 'quiet' : 'full';
}
