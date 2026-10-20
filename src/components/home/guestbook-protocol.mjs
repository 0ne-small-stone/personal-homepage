export const GISCUS_ORIGIN = 'https://giscus.app';
export const CONNECTION_TIMEOUT = 15000;
// BFCache freezes an owned document; it does not destroy its listeners or SDK.
// Actual teardown aborts every listener registered with this single signal.
export function ownEmbedLifecycle(view, dispose) {
  const controller = new AbortController();
  view.addEventListener('pagehide',event => {
    if (event.persisted) return;
    dispose(); controller.abort();
  },{signal:controller.signal});
  return controller;
}
export function discussionURL(value, repo) {
  try {
    const url = new URL(value);
    return url.origin === 'https://github.com' && !url.username && !url.password &&
      url.pathname.startsWith('/' + repo + '/discussions/') &&
      /^\/[^/]+\/[^/]+\/discussions\/\d+\/?$/.test(url.pathname) ? url.href : null;
  } catch { return null; }
}
// Never forward viewer, session, raw errors, or arbitrary SDK data.
export function officialMessage(event, frameWindow, repo) {
  if (!frameWindow || event.origin !== GISCUS_ORIGIN || event.source !== frameWindow) return null;
  const data = event.data?.giscus;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (typeof data.error === 'string') return {state:data.error === 'Discussion not found' ? 'empty' : 'error'};
  const discussion = data.discussion;
  if (discussion && typeof discussion.repository?.nameWithOwner === 'string' && discussion.repository.nameWithOwner.toLowerCase() === repo.toLowerCase()) {
    const url = discussionURL(discussion.url, repo);
    if (url && Number.isSafeInteger(discussion.totalCommentCount) && discussion.totalCommentCount >= 0)
      return {state:discussion.totalCommentCount === 0 ? 'empty' : 'ready',url};
  }
  if (Number.isFinite(data.resizeHeight) && data.resizeHeight > 0 && data.resizeHeight <= 100000)
    return {height:Math.ceil(data.resizeHeight)};
  return null;
}
export function parentMessage(event, frameWindow, origin, repo) {
  if (!frameWindow || event.origin !== origin || event.source !== frameWindow) return null;
  const data = event.data?.lsshGuestbook;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (['connecting','ready','empty','error'].includes(data.state)) {
    const url = discussionURL(data.url,repo);
    return {state:data.state,...(url ? {url} : {})};
  }
  if (Number.isFinite(data.height) && data.height > 0 && data.height <= 100008) return {height:Math.ceil(data.height)};
  return null;
}
// One deadline per attempt. Invalidated callbacks cannot affect its successor.
export class ConnectionAttempt {
  active = true;
  settled = false;
  constructor(onTimeout, schedule = setTimeout, cancel = clearTimeout) {
    // Browser timer functions reject an arbitrary instance as their receiver.
    this.cancel = timer => cancel(timer);
    this.timer = schedule(() => {
      if (!this.active || this.settled) return;
      this.active = false; onTimeout();
    },CONNECTION_TIMEOUT);
  }
  settle() {
    if (!this.active) return false;
    this.settled = true; this.cancel(this.timer); return true;
  }
  dispose() { this.active = false; this.cancel(this.timer); }
}
