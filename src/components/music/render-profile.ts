/** Explicit loopback-only measurement, read through DOM without exposing app state. */
export function markMusicRender(name: string) {
  if (typeof document === 'undefined' || !['127.0.0.1', 'localhost'].includes(location.hostname)
    || new URLSearchParams(location.search).get('performanceDebug') !== '1') return;
  const counts = JSON.parse(document.body.dataset.musicRenders ?? '{}');
  counts[name] = (counts[name] ?? 0) + 1;
  document.body.dataset.musicRenders = JSON.stringify(counts);
}
