import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { cancelNativeDialog, mountNativeDialog } from '../../src/lib/native-dialog.ts';

function fixture(t) {
  const dom = new JSDOM('<button id="entry">Open</button><dialog id="a"><button id="first">First</button></dialog><dialog id="b"><button id="second">Second</button></dialog>');
  const doc = dom.window.document;
  for (const dialog of doc.querySelectorAll('dialog')) {
    // Only lifecycle plumbing is simulated here; browser tests cover native modality.
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; };
  }
  t.after(() => dom.window.close());
  doc.getElementById('entry').focus();
  return { doc, entry: doc.getElementById('entry'), a: doc.getElementById('a'), b: doc.getElementById('b'), first: doc.getElementById('first'), second: doc.getElementById('second') };
}

test('native adapter restores overflow value/priority, initial focus and opener', t => {
  const { doc, entry, a, first } = fixture(t);
  doc.body.style.setProperty('overflow', 'auto', 'important');
  const cleanup = mountNativeDialog(a, first);
  assert.equal(a.open, true); assert.equal(doc.activeElement, first); assert.equal(doc.body.style.overflow, 'hidden');
  cleanup(); cleanup();
  assert.equal(a.open, false); assert.equal(doc.activeElement, entry);
  assert.equal(doc.body.style.overflow, 'auto'); assert.equal(doc.body.style.getPropertyPriority('overflow'), 'important');
});

test('nested windows keep the lock until the last closes and restore the parent focus', t => {
  const { doc, a, b, first, second, entry } = fixture(t);
  const closeA = mountNativeDialog(a, first); const closeB = mountNativeDialog(b, second);
  closeB(); assert.equal(doc.body.style.overflow, 'hidden'); assert.equal(doc.activeElement, first);
  closeA(); assert.equal(doc.body.style.overflow, ''); assert.equal(doc.activeElement, entry);
});

test('out-of-order close never steals focus from the remaining window or leaves a scroll lock', t => {
  const { doc, a, b, first, second, entry } = fixture(t);
  const closeA = mountNativeDialog(a, first); const closeB = mountNativeDialog(b, second);
  closeA(); assert.equal(doc.body.style.overflow, 'hidden'); assert.equal(doc.activeElement, second);
  closeB(); assert.equal(doc.body.style.overflow, ''); assert.equal(doc.activeElement, entry);
});

test('page teardown does not refocus a removed opener and reopening starts a fresh scope', t => {
  const { doc, a, first, entry } = fixture(t);
  const close = mountNativeDialog(a, first); entry.remove(); a.remove(); close();
  assert.equal(doc.body.style.overflow, '');
  doc.body.append(a); const next = mountNativeDialog(a, first); next();
  assert.equal(a.open, false); assert.equal(doc.body.style.overflow, '');
});

test('failed native open rolls back the lock; disconnected and already open windows are untouched', t => {
  const { doc, a } = fixture(t);
  a.showModal = () => { throw Error('native failure'); };
  assert.throws(() => mountNativeDialog(a), /native failure/); assert.equal(doc.body.style.overflow, '');
  a.remove(); assert.doesNotThrow(() => mountNativeDialog(a)());
  doc.body.append(a); a.open = true; mountNativeDialog(a)(); assert.equal(a.open, true); assert.equal(doc.body.style.overflow, '');
});

test('Astro body replacement isolates the old cleanup from the new page and its new dialog', t => {
  const { doc, a, first } = fixture(t);
  const oldBody = doc.body;
  const closeOld = mountNativeDialog(a, first);
  const nextBody = doc.createElement('body');
  nextBody.style.overflow = 'clip'; nextBody.innerHTML = '<button id="new-entry">New page</button><dialog><button>New dialog</button></dialog>';
  oldBody.replaceWith(nextBody);
  const next = nextBody.querySelector('dialog');
  next.showModal = () => { next.open = true; }; next.close = () => { next.open = false; };
  const entry = doc.getElementById('new-entry'); entry.focus();
  const closeNext = mountNativeDialog(next, next.querySelector('button'));
  closeOld();
  assert.equal(nextBody.style.overflow, 'hidden'); assert.equal(oldBody.style.overflow, ''); assert.equal(doc.activeElement, next.querySelector('button'));
  closeNext(); assert.equal(nextBody.style.overflow, 'clip'); assert.equal(doc.activeElement, entry);
});

test('React nested cancel dismisses only the top window, with native default prevented', async t => {
  const dom = new JSDOM('<div id="root"></div>');
  const doc = dom.window.document;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousAct = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.window = doc.defaultView; globalThis.document = doc;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const { act, createElement: h } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(doc.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    await new Promise(setImmediate);
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousAct === undefined) delete globalThis.IS_REACT_ACT_ENVIRONMENT; else globalThis.IS_REACT_ACT_ENVIRONMENT = previousAct;
    dom.window.close();
  });
  const calls = [];
  await act(async () => root.render(h('dialog', { onCancel: event => cancelNativeDialog(event, () => calls.push('outer')) },
    h('dialog', { id: 'react-inner', onCancel: event => cancelNativeDialog(event, () => calls.push('inner')) }))));
  const event = new doc.defaultView.Event('cancel', { cancelable: true });
  await act(async () => doc.getElementById('react-inner').dispatchEvent(event));
  assert.deepEqual(calls, ['inner']); assert.equal(event.defaultPrevented, true);
});
