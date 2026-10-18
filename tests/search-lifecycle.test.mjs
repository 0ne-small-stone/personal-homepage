import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import { JSDOM } from 'jsdom';

// Exercise the installed, patched component. Only the virtual config and UI import
// are substituted; Pagefind indexing and native modality are checked in a browser.
const upstream = await readFile(new URL('../node_modules/@astrojs/starlight/dist/components/Search.astro', import.meta.url), 'utf8');
const source = upstream.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace("import { pagefindUserConfig } from 'virtual:starlight/pagefind-config';", 'const pagefindUserConfig = {};')
  .replace("await import('@pagefind/default-ui')", 'await window.loadPagefind()');
const compile = async dev => (await transform(source, { loader: 'ts', format: 'iife', define: {
  'import.meta.env.DEV': String(dev), 'import.meta.env.BASE_URL': JSON.stringify('/personal-homepage/'),
} })).code;
const production = await compile(false);
const development = await compile(true);

function fixture(t, { ready = 'complete', dev = false, delayed = false } = {}) {
  const dom = new JSDOM('<button id="entry">Entry</button>', { url: 'https://example.test/personal-homepage/', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const { window } = dom; const { document } = window;
  Object.defineProperty(document, 'readyState', { configurable: true, value: ready });
  const pending = new Map(); let id = 0; let opens = 0;
  window.requestIdleCallback = callback => { pending.set(++id, callback); return id; };
  window.cancelIdleCallback = task => pending.delete(task);
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; opens++; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new window.Event('close')); };
  const instances = [];
  class PagefindUI {
    constructor(options) {
      this.options = options; this.destroyed = 0;
      this.input = document.createElement('input');
      document.querySelector(options.element).append(this.input); instances.push(this);
    }
    destroy() { this.destroyed++; this.input.remove(); }
  }
  let resolveImport;
  const module = delayed ? new Promise(resolve => { resolveImport = resolve; }) : Promise.resolve({ PagefindUI });
  window.loadPagefind = () => module;
  window.eval(dev ? development : production);
  const append = () => {
    const holder = document.createElement('div');
    holder.innerHTML = '<site-search data-translations="{}"><button data-open-modal disabled>Search<kbd style="display:none"><kbd>Ctrl</kbd>K</kbd></button><dialog><div class="dialog-frame"><button data-close-modal>Close</button><div id="starlight__search"><a href="#section"><mark>Result</mark></a></div></div></dialog></site-search>';
    const search = holder.firstElementChild; document.body.append(search); return search;
  };
  const pageLoad = () => document.dispatchEvent(new window.Event('astro:page-load'));
  const shortcut = () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
  const flushIdle = async () => {
    const callbacks = [...pending.values()]; pending.clear();
    await Promise.all(callbacks.map(callback => callback()));
  };
  return { window, document, pending, instances, append, pageLoad, shortcut, flushIdle, opens: () => opens,
    resolveImport: () => resolveImport({ PagefindUI }) };
}

test('direct and client-side arrivals initialize once across repeated Astro page events', async t => {
  for (const ready of ['loading', 'complete']) {
    const f = fixture(t, { ready }); const search = f.append();
    f.pageLoad(); f.pageLoad(); f.window.dispatchEvent(new f.window.Event('DOMContentLoaded'));
    assert.equal(f.pending.size, 1); await f.flushIdle(); f.pageLoad(); await f.flushIdle();
    assert.equal(f.instances.length, 1);
    assert.equal(search.querySelector('kbd').style.display, '');
    assert.equal(f.instances[0].options.baseUrl, '/personal-homepage/');
    assert.equal(f.instances[0].options.bundlePath, '/personal-homepage/pagefind/');
    search.remove(); assert.equal(f.instances[0].destroyed, 1);
  }
});

test('leaving before idle cancels initialization and removes the global shortcut', async t => {
  const f = fixture(t); const search = f.append();
  search.remove(); assert.equal(f.pending.size, 0); f.pageLoad(); f.shortcut(); await f.flushIdle();
  assert.equal(f.opens(), 0); assert.equal(f.instances.length, 0);
});

test('a late UI import cannot mount into the next page search container', async t => {
  const f = fixture(t, { delayed: true }); const old = f.append(); const oldIdle = f.flushIdle();
  old.remove(); const next = f.append(); const nextIdle = f.flushIdle();
  f.resolveImport(); await Promise.all([oldIdle, nextIdle]);
  assert.equal(f.instances.length, 1); assert.ok(next.contains(f.instances[0].input));
  next.remove(); assert.equal(f.instances[0].destroyed, 1);
});

test('reconnecting the same element owns one shortcut, closes nested result markup and releases the body', async t => {
  const f = fixture(t); const search = f.append(); await f.flushIdle();
  f.shortcut(); assert.equal(f.opens(), 1); assert.ok(search.querySelector('dialog').open);
  search.querySelector('mark').click(); assert.equal(search.querySelector('dialog').open, false);
  f.shortcut(); search.remove();
  assert.equal(f.document.body.hasAttribute('data-search-modal-open'), false); assert.equal(f.instances[0].destroyed, 1);
  f.document.body.append(search); await f.flushIdle(); f.shortcut();
  assert.equal(f.opens(), 3); assert.equal(f.instances.length, 2); assert.ok(search.querySelector('dialog').open);
  f.shortcut(); assert.equal(search.querySelector('dialog').open, false);
  search.remove(); assert.equal(f.instances[1].destroyed, 1);
});

test('replacement body state is not cleared by an old detached search or its queued close', async t => {
  const f = fixture(t); const search = f.append(); await f.flushIdle(); f.shortcut();
  const oldBody = f.document.body; const nextBody = f.document.createElement('body');
  nextBody.setAttribute('data-search-modal-open', ''); oldBody.replaceWith(nextBody);
  search.querySelector('dialog').dispatchEvent(new f.window.Event('close'));
  assert.equal(oldBody.hasAttribute('data-search-modal-open'), false);
  assert.equal(nextBody.hasAttribute('data-search-modal-open'), true); assert.equal(f.instances[0].destroyed, 1);
});

test('development warning keeps native controls without importing the production UI', async t => {
  const f = fixture(t, { dev: true }); const search = f.append(); f.pageLoad(); await f.flushIdle();
  f.shortcut(); assert.ok(search.querySelector('dialog').open); assert.equal(f.instances.length, 0);
  search.querySelector('[data-close-modal]').click(); assert.equal(search.querySelector('dialog').open, false);
  search.remove(); f.shortcut(); assert.equal(f.opens(), 1);
});
