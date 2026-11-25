import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { installHomeChapterFocus } from '../src/components/home/home-chapter-focus.ts';

function fixture(hash = '') {
  const dom = new JSDOM(`<section id="intro" data-chapter><a href="#album" class="home-scroll">向下探索</a></section>
    <section id="album" data-chapter><a class="home-cta" href="/gallery/">进入</a></section>
    <section id="wall" data-chapter><a class="home-cta" href="/guestbook/">查看留言区</a></section>
    <nav class="home-chapter-index"><a href="#intro">序章</a><a href="#album">相册</a><a href="#wall">留言</a></nav>`, { url: 'https://example.org/'+hash, pretendToBeVisual: true });
  const win = dom.window;
  const doc = win.document;
  doc.body.className = 'has-journey';
  // Represent the production motion controller's existing capture-phase replaceState.
  doc.addEventListener('click', event => {
    event.preventDefault();
    if (!event.ctrlKey) win.history.replaceState({}, '', event.target.hash);
  }, true);
  const dispose = installHomeChapterFocus(doc);
  return { win, doc, dispose() { dispose(); win.close(); } };
}

test('explore hands focus to the native album entry while retaining its URL', async () => {
  const { win, doc, dispose } = fixture();
  try {
    const explore = doc.querySelector('.home-scroll');
    explore.focus();
    explore.click();
    await new Promise(resolve => win.requestAnimationFrame(resolve));
    assert.equal(doc.activeElement, doc.querySelector('#album .home-cta'));
    assert.equal(win.location.hash, '#album');
    assert.equal(doc.querySelector('nav [aria-current="location"]').hash, '#album');
  } finally { dispose(); }
});

test('chapter index waits for motion to release the destination before moving focus', async () => {
  const { win, doc, dispose } = fixture();
  try {
    const section = doc.getElementById('wall');
    section.setAttribute('inert', '');
    const index = doc.querySelector('nav a[href="#wall"]');
    index.focus();
    index.click();
    await new Promise(resolve => win.requestAnimationFrame(resolve));
    assert.equal(doc.activeElement, index);
    section.removeAttribute('inert');
    await Promise.resolve();
    assert.equal(doc.activeElement, section.querySelector('.home-cta'));
  } finally { dispose(); }
});

test('a new keyboard gesture, history traversal or modified click retains visitor focus', async () => {
  for (const interrupt of ['keydown', 'popstate', 'modified']) {
    const { win, doc, dispose } = fixture();
    try {
      const section = doc.getElementById('wall');
      section.setAttribute('aria-hidden', 'true');
      const index = doc.querySelector('nav a[href="#wall"]');
      index.focus();
      index.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: interrupt === 'modified' }));
      if (interrupt === 'keydown') win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Tab' }));
      if (interrupt === 'popstate') {
        win.history.replaceState({}, '', '#intro');
        win.dispatchEvent(new win.PopStateEvent('popstate'));
        win.history.replaceState({}, '', '#wall');
      }
      section.removeAttribute('aria-hidden');
      await new Promise(resolve => win.requestAnimationFrame(resolve));
      assert.equal(doc.activeElement, index, interrupt);
    } finally { dispose(); }
  }
});

test('the native index follows deep links and history, and yields to the hydrated controller', () => {
  const { win, doc, dispose } = fixture('#wall');
  const current = () => [...doc.querySelectorAll('nav [aria-current="location"]')].map(link => link.hash);
  try {
    assert.deepEqual(current(), ['#wall']);
    win.history.replaceState({}, '', '#album');
    win.dispatchEvent(new win.PopStateEvent('popstate'));
    assert.deepEqual(current(), ['#album']);
    doc.body.dataset.homeStatus = 'ready';
    win.history.replaceState({}, '', '#intro');
    win.dispatchEvent(new win.HashChangeEvent('hashchange'));
    assert.deepEqual(current(), ['#album']);
    delete doc.body.dataset.homeStatus;
    win.dispatchEvent(new win.PageTransitionEvent('pageshow'));
    assert.deepEqual(current(), ['#intro']);
  } finally { dispose(); }
});

test('native scrolling marks the chapter at reading height while leaving the deep link intact', async () => {
  const { win, doc, dispose } = fixture('#intro');
  try {
    for (const [id, top] of [['intro', -900], ['album', 0], ['wall', 900]]) {
      doc.getElementById(id).getBoundingClientRect = () => ({ top, height: 900 });
    }
    win.dispatchEvent(new win.Event('scroll'));
    await new Promise(resolve => win.requestAnimationFrame(resolve));
    assert.equal(doc.querySelector('nav [aria-current="location"]').hash, '#album');
    assert.equal(win.location.hash, '#intro');
  } finally { dispose(); }
});
