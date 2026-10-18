import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';

const installed = await readFile(new URL('../node_modules/@pagefind/default-ui/npm_dist/mjs/ui-core.mjs', import.meta.url), 'utf8');
// Run the actual installed UI. Substitute only the dynamic search-engine import.
const { code } = await transform(installed.replace('await import(`${base_path}pagefind.js`)', 'await window.loadSearchEngine()'), {
  format: 'iife', globalName: 'InstalledPagefind',
});
const settle = () => new Promise(setImmediate);
const empty = { results: [], filters: {}, unfilteredResultCount: 0 };

function fixture(t, { importPending = false, queryPending = false } = {}) {
  const errors = []; const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', error => errors.push(String(error)));
  virtualConsole.on('jsdomError', error => errors.push(String(error)));
  const dom = new JSDOM('<html lang="zh-CN"><body><div id="search"></div></body></html>', { runScripts: 'outside-only', virtualConsole });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, []); });
  const counts = { options: 0, queries: 0, preloads: 0, destroyed: 0 };
  let resolveImport; let resolveQuery;
  const query = queryPending ? new Promise(resolve => { resolveQuery = resolve; }) : Promise.resolve(empty);
  const engine = {
    options: async () => { counts.options++; }, filters: async () => ({}),
    search: () => { counts.queries++; return query; },
    preload: async () => { counts.preloads++; },
    destroy: () => { counts.destroyed++; throw Error('A shared engine must not be terminated by one UI'); },
  };
  const imported = importPending ? new Promise(resolve => { resolveImport = resolve; }) : Promise.resolve(engine);
  dom.window.loadSearchEngine = () => imported;
  dom.window.eval(code);
  const mount = (debounceTimeoutMs = 0) => new dom.window.InstalledPagefind.PagefindUI({ element: '#search', debounceTimeoutMs });
  const focus = async () => { dom.window.document.querySelector('input').focus(); await settle(); };
  return { dom, counts, mount, focus, resolveImport: () => resolveImport(engine), resolveQuery: () => resolveQuery(empty) };
}

test('destroy during engine import leaves no query or late UI initialization', async t => {
  const f = fixture(t, { importPending: true }); const ui = f.mount();
  await f.focus(); ui.triggerSearch('验证'); await settle(); ui.destroy();
  f.resolveImport(); await settle();
  // waitForApiInit uses a bounded 50ms tick; allow that pending tick to finish.
  await new Promise(resolve => setTimeout(resolve, 75));
  assert.equal(f.counts.options, 0); assert.equal(f.counts.queries, 0); assert.equal(f.counts.destroyed, 0);
  assert.equal(f.dom.window.document.querySelector('input'), null);
});

test('a pending old query can finish while a new UI reuses the engine', async t => {
  const f = fixture(t, { queryPending: true }); const old = f.mount(); await f.focus();
  old.triggerSearch('旧页面'); await settle(); assert.equal(f.counts.queries, 1); old.destroy();
  const next = f.mount(); await f.focus(); next.triggerSearch('新页面'); await settle();
  assert.equal(f.counts.queries, 2); f.resolveQuery(); await settle();
  assert.equal(f.counts.destroyed, 0); assert.equal(f.dom.window.document.querySelectorAll('input').length, 1);
  next.destroy(); assert.equal(f.dom.window.document.querySelector('input'), null);
});

test('destroy cancels the old debounce without terminating the shared engine', async t => {
  const f = fixture(t); const ui = f.mount(80); await f.focus();
  ui.triggerSearch('取消的查询'); await settle(); ui.destroy();
  await new Promise(resolve => setTimeout(resolve, 110));
  assert.equal(f.counts.queries, 0); assert.equal(f.counts.destroyed, 0);
});
