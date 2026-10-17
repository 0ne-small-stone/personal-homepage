import test from 'node:test';
import assert from 'node:assert/strict';
import { InfiniteQueryObserver, QueryObserver } from '@tanstack/react-query';
import { createMusicQueryClient, musicScope, musicKeys, musicReadOptions, catalogQueryOptions, catalogInput, mergeMusicPages, updateMusicData } from '../../src/lib/music-query.ts';

const route = { view: 'search', kind: 'song', id: '', query: 'Echoes', category: 'all' };
const track = id => ({ id, title: id });
const card = id => ({ id, title: id });
function clientFor(t) {
  const client = createMusicQueryClient();
  t.after(() => client.clear());
  return client;
}

test('concurrent reads deduplicate and a fresh cache avoids another request', async t => {
  const client = clientFor(t); let calls = 0;
  const options = musicReadOptions('anonymous', { action: 'lyrics', id: '1' }, async () => { calls++; return { lyrics: null }; });
  const result = await Promise.all([client.fetchQuery(options), client.fetchQuery(options)]);
  assert.deepEqual(result, [{ lyrics: null }, { lyrics: null }]);
  await client.fetchQuery(options);
  assert.equal(calls, 1);
});

test('the read cache rejects writes and side-effectful manual refresh', t => {
  const client = clientFor(t); let calls = 0; const request = async () => { calls++; };
  for (const action of ['like', 'subscribe', 'create-playlist', 'playlist-track', 'cloud-delete', 'download']) {
    assert.throws(() => musicReadOptions('anonymous', { action }, request), /显式执行/);
  }
  assert.throws(() => musicReadOptions('anonymous', { action: 'browse', refresh: true }, request), /显式执行/);
  assert.equal(calls, 0);
  assert.equal(client.getDefaultOptions().mutations.retry, false);
});

test('read errors are surfaced once, with no automatic retry', async t => {
  const client = clientFor(t); let calls = 0;
  await assert.rejects(client.fetchQuery(musicReadOptions('anonymous', { action: 'jobs' }, async () => { calls++; throw Error('offline'); })), /offline/);
  assert.equal(calls, 1);
  const defaults = client.getDefaultOptions().queries;
  assert.equal(defaults.refetchOnWindowFocus, false);
  assert.equal(defaults.refetchOnReconnect, false);
});

test('identities never share cached data and clearing a departed identity keeps the new one', async t => {
  const client = clientFor(t); let calls = 0;
  const input = { action: 'liked-ids' };
  const old = musicReadOptions(musicScope('A'), input, async () => { calls++; return { ids: ['A'] }; });
  const next = musicReadOptions(musicScope('B'), input, async () => { calls++; return { ids: ['B'] }; });
  await client.fetchQuery(old); assert.equal(client.getQueryData(next.queryKey), undefined);
  assert.deepEqual(await client.fetchQuery(next), { ids: ['B'] });
  client.removeQueries({ queryKey: musicKeys.scope(musicScope('A')) });
  assert.equal(client.getQueryData(old.queryKey), undefined);
  assert.deepEqual(client.getQueryData(next.queryKey), { ids: ['B'] });
  assert.equal(calls, 2);
  assert.equal(musicScope(''), 'anonymous');
});

test('unsubscribing consumes AbortSignal and cancels an obsolete request', async t => {
  const client = clientFor(t); let signal;
  const observer = new QueryObserver(client, musicReadOptions('anonymous', { action: 'lyrics', id: 'slow' }, (_input, currentSignal) => {
    signal = currentSignal;
    return new Promise((_resolve, reject) => currentSignal.addEventListener('abort', () => reject(currentSignal.reason), { once: true }));
  }));
  const unsubscribe = observer.subscribe(() => {});
  assert.equal(signal.aborted, false);
  unsubscribe();
  assert.equal(signal.aborted, true);
  assert.equal(observer.getCurrentResult().data, undefined);
});

test('a late result cannot recreate data after its account scope is removed', async t => {
  const client = clientFor(t); let resolve;
  const options = musicReadOptions(musicScope('A'), { action: 'lyrics', id: 'late' }, () => new Promise(done => { resolve = done; }));
  const pending = client.fetchQuery(options).catch(() => undefined);
  client.removeQueries({ queryKey: musicKeys.scope(musicScope('A')) });
  resolve({ lyrics: 'old account' }); await pending;
  assert.equal(client.getQueryData(options.queryKey), undefined);
});

test('route queries distinguish category, keyword, content kind and detail id', () => {
  const request = async () => ({});
  const key = input => JSON.stringify(catalogQueryOptions('anonymous', input, request).queryKey);
  const keys = [route, { ...route, query: 'Time' }, { ...route, kind: 'album' }, { ...route, view: 'detail', id: '1' }, { ...route, view: 'detail', id: '2' }, { ...route, view: 'podcasts', category: 'knowledge' }].map(key);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(catalogInput({ ...route, view: 'podcasts', category: 'knowledge' }, 2), { action: 'browse', view: 'podcasts', category: 'knowledge', page: 2 });
});

test('pagination preserves cursors, deduplicates results and stops at the last page', async t => {
  const client = clientFor(t); const requested = [];
  const observer = new InfiniteQueryObserver(client, { ...catalogQueryOptions('anonymous', route, async input => {
    requested.push(input.page);
    return { tracks: input.page === 0 ? [track('1'), track('2')] : [track('2'), track('3')], more: input.page === 0 };
  }), enabled: false });
  const unsubscribe = observer.subscribe(() => {}); t.after(() => { unsubscribe(); client.clear(); });
  await observer.refetch(); await observer.fetchNextPage();
  const result = observer.getCurrentResult();
  assert.deepEqual(requested, [0, 1]);
  assert.deepEqual(result.data.pageParams, [0, 1]);
  assert.deepEqual(mergeMusicPages(result.data.pages).tracks.map(row => row.id), ['1', '2', '3']);
  assert.equal(result.hasNextPage, false);
  await observer.fetchNextPage(); assert.deepEqual(requested, [0, 1]);
});

test('detail metadata updates preserve pages, playback order and pagination', () => {
  const before = { pages: [{ tracks: [track('1')], subscribed: false, more: true }, { tracks: [track('2')], subscribed: false, more: false }], pageParams: [0, 1] };
  const after = updateMusicData(before, current => ({ ...current, subscribed: true }));
  assert.deepEqual(after.pageParams, [0, 1]);
  assert.deepEqual(after.pages.map(page => page.tracks.map(row => row.id)), [['1'], ['2']]);
  assert.equal(mergeMusicPages(after.pages).subscribed, true);
  assert.equal(mergeMusicPages(after.pages).more, false);
  assert.equal(before.pages[0].subscribed, false);
});

test('podcast cards exclude duplicates across featured and popular lists', () => {
  const data = mergeMusicPages([{ cards: [card('a')], popular: [card('b')], more: true }, { cards: [card('b')], popular: [card('c'), card('c')], more: false }]);
  assert.deepEqual(data.cards.map(row => row.id), ['a', 'b']);
  assert.deepEqual(data.popular.map(row => row.id), ['c']);
});

