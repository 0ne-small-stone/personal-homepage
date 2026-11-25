import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { installReliefLoading } from '../src/components/home/relief-loading.ts';

function fixture(hash = '', historyEntry) {
  const ids = ['album', 'radio', 'projects'];
  const dom = new JSDOM(ids.map(id => `<section id="${id}" data-work-item><a href="/${id}/" data-relief-full="/${id}.webp">
    <picture><img class="home-project-cover" width="1600" height="616" alt="${id}"></picture></a></section>
    <a href="#${id}">${id}</a>`).join(''), { url: 'https://example.test/' + hash });
  const win = dom.window;
  const doc = win.document;
  if (historyEntry) win.history.replaceState({ lsshHome: historyEntry }, '');
  const requests = [];
  const observed = new Set();
  let intersect;
  win.IntersectionObserver = class {
    constructor(callback) { intersect = callback; }
    observe(section) { observed.add(section); }
    unobserve(section) { observed.delete(section); }
    disconnect() { observed.clear(); }
  };
  win.HTMLImageElement.prototype.decode = function () {
    const { promise, resolve, reject } = Promise.withResolvers();
    requests.push({ image: this, resolve, reject });
    return promise;
  };
  doc.addEventListener('click', e => e.preventDefault());
  const release = installReliefLoading(doc);
  return { doc, requests, observed, release,
    approach: id => intersect?.([{ target: doc.getElementById(id), isIntersecting: true }]),
    target: chapterId => doc.dispatchEvent(new win.CustomEvent('lssh:home-return-target', { detail: {chapterId} })),
    settle: () => doc.dispatchEvent(new win.Event('lssh:home-restored')),
    jump: id => doc.querySelector(`a[href="#${id}"]`).click(),
    close: () => { release(); win.close(); } };
}

test('only approaching or requested chapters upgrade and concurrent requests share a decode', async () => {
  const f = fixture();
  try {
    assert.equal(f.requests.length, 0);
    f.approach('album');
    f.jump('album');
    f.jump('projects');
    assert.deepEqual(f.requests.map(r => new URL(r.image.src).pathname), ['/album.webp', '/projects.webp']);
    assert.equal(f.requests[0].image.fetchPriority, 'high');
    f.requests[1].resolve();
    await setImmediate();
    assert.equal(f.doc.querySelector('#projects img'), f.requests[1].image);
    assert.ok(f.doc.querySelector('#album picture'));
    assert.equal(f.observed.has(f.doc.getElementById('projects')), false);
    assert.equal(f.requests[1].image.alt, 'projects');
    assert.equal(f.requests[1].image.width, 1600);
  } finally { f.close(); }
});

test('deep links start immediately, failed upgrades retain the preview, and late completions respect teardown', async () => {
  const f = fixture('#radio');
  try {
    const preview = f.doc.querySelector('#radio img');
    assert.match(f.requests[0].image.src, /\/radio\.webp$/);
    assert.equal(f.observed.size, 0);
    f.requests[0].reject(Error('offline'));
    await setImmediate();
    assert.equal(f.doc.querySelector('#radio img'), preview);
    f.jump('radio');
    f.release();
    assert.equal(f.requests[1].image.hasAttribute('src'), false);
    f.approach('album');
    assert.equal(f.requests.length, 2);
    f.requests[1].resolve();
    await setImmediate();
    assert.equal(f.doc.querySelector('#radio img'), preview);
    assert.equal(f.observed.size, 0);
  } finally { f.close(); }
});

test('restored scroll position takes precedence over a stale chapter hash', () => {
  const f = fixture('#album', { chapterId: 'projects' });
  try {
    assert.equal(f.requests.length, 0);
    f.target('projects');
    assert.match(f.requests[0].image.src, /\/projects\.webp$/);
    assert.equal(f.observed.size, 0);
    f.settle();
    assert.equal(f.observed.size, 3);
  } finally { f.close(); }
});
