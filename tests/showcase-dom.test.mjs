import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import { showcaseWorks } from '../src/data/showcase.ts';

// Component tests only: JSDOM does not render CSS, perform touch scrolling or play B站.
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/personal-homepage/showcase/', pretendToBeVisual: true });
const { window } = dom;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = function () {};
Object.defineProperty(globalThis, 'scrollY', { get: () => window.scrollY, configurable: true });
for (const name of ['window', 'document', 'HTMLElement', 'HTMLAnchorElement', 'HTMLButtonElement', 'HTMLImageElement', 'customElements', 'location', 'history', 'sessionStorage', 'AbortController']) {
  Object.defineProperty(globalThis, name, { value: name === 'window' ? window : window[name], configurable: true });
}
const frames = new Map();
let frameId = 0;
globalThis.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
globalThis.cancelAnimationFrame = id => frames.delete(id);
const motion = new window.EventTarget();
motion.matches = false;
globalThis.matchMedia = () => motion;
const capture = new WeakMap();
window.HTMLElement.prototype.setPointerCapture = function (id) { capture.set(this, id); };
window.HTMLElement.prototype.hasPointerCapture = function (id) { return capture.get(this) === id; };
window.HTMLElement.prototype.releasePointerCapture = function () { capture.delete(this); };
let pauses = 0;
globalThis.__afterimageAudio = { pause() { pauses++; } };

async function loadComponent(path, replace) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  source = replace(source);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
await loadComponent('../src/components/showcase/showcase-gallery.ts', source => source.replace("from './gallery-state'", `from '${new URL('../src/components/showcase/gallery-state.ts', import.meta.url).href}'`));
await loadComponent('../src/components/showcase/showcase-video.ts', source => source.replace("import { audioSession } from '../../lib/audio-session';", 'const audioSession = globalThis.__afterimageAudio;'));

function flushFrames() {
  const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(0));
}
function gallery(t, query = '') {
  history.replaceState({}, '', `/personal-homepage/showcase/${query}`);
  const element = document.createElement('afterimage-gallery');
  element.dataset.pagePath = '/personal-homepage/showcase/';
  element.innerHTML = `<div>${['all', 'project', 'video', 'writing'].map(kind => `<button data-filter="${kind}">${kind}</button>`).join('')}<button data-view-button="exhibition">展览</button><button data-view-button="index">目录</button></div><p data-announcement role="status"></p><div class="ai-rail" tabindex="0">${showcaseWorks.map(work => `<article class="ai-work" data-slug="${work.slug}" data-kind="${work.kind}" data-title="${work.title}"><a class="ai-work-link" href="/personal-homepage/projects/${work.slug}/"><div class="ai-cover"><img><span class="ai-cover-fallback" hidden></span></div>${work.title}</a></article>`).join('')}</div><div class="ai-empty" hidden><button data-show-all>全部</button></div><div class="ai-exhibition-footer"><span data-position></span><button data-step="-1">上一件</button><button data-step="1">下一件</button></div>`;
  element.querySelectorAll('.ai-work').forEach(card => Object.defineProperty(card, 'offsetWidth', { value: 600 }));
  document.body.append(element);
  t.after(() => { element.remove(); frames.clear(); sessionStorage.clear(); });
  return element;
}
function ready() { document.dispatchEvent(new window.Event('astro:page-load')); flushFrames(); }
const selected = element => element.querySelector('[data-active="true"]')?.dataset.slug;
const click = (element, selector) => element.querySelector(selector).click();
function pointer(target, type, x, y, id = 1) {
  const event = new window.MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperties(event, { pointerId: { value: id }, isPrimary: { value: true }, pointerType: { value: 'touch' } });
  target.dispatchEvent(event);
}

test('Astro新页面连接时不读取旧详情URL，page-load后才恢复筛选与作品', t => {
  const element = gallery(t);
  history.replaceState({}, '', '/personal-homepage/projects/the-wolf/');
  ready();
  assert.equal(location.pathname, '/personal-homepage/projects/the-wolf/');
  history.replaceState({}, '', '/personal-homepage/showcase/?type=video&work=the-wolf');
  ready();
  assert.equal(selected(element), 'the-wolf');
  assert.equal(element.querySelectorAll('.ai-work:not([hidden])').length, 2);
  assert.equal(element.querySelector('[data-step="1"]').disabled, true);
  assert.equal(element.querySelectorAll('.ai-work-link[tabindex="0"]').length, 1);
  assert.equal(element.querySelector('[data-active="true"]').hasAttribute('aria-hidden'), false);
  assert.equal(frames.size, 0);
});

test('按钮、方向键、首尾与目录共享选择，文字空态可恢复全部', t => {
  const element = gallery(t); ready();
  click(element, '[data-step="1"]');
  assert.equal(selected(element), 'opening-performance');
  const rail = element.querySelector('.ai-rail');
  rail.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(selected(element), 'inspection-robot');
  rail.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(selected(element), 'little-stone-still-here');
  click(element, '[data-view-button="index"]');
  assert.equal(element.dataset.view, 'index');
  assert.equal(element.querySelectorAll('.ai-work-link[tabindex="0"]').length, 6);
  assert.equal(element.querySelectorAll('.ai-work[aria-hidden]').length, 0);
  click(element, '[data-filter="writing"]');
  assert.equal(element.querySelector('.ai-empty').hidden, false);
  assert.equal(rail.hidden, true);
  click(element, '[data-show-all]');
  assert.equal(rail.hidden, false);
  assert.equal(document.activeElement.dataset.filter, 'all');
  assert.equal(new URL(location.href).searchParams.get('type'), null);
  assert.equal(frames.size, 0);
});

test('侧面作品第一次选择、中央作品可进入；返回恢复焦点及原视图', t => {
  const element = gallery(t); ready();
  const link = element.querySelector('[data-slug="the-wolf"] a');
  const prevented = [];
  element.addEventListener('click', event => { if (event.target === link) { prevented.push(event.defaultPrevented); event.preventDefault(); } });
  link.click(); link.click();
  assert.deepEqual(prevented, [true, false]);
  assert.equal(selected(element), 'the-wolf');
  assert.equal(new URL(link.href).searchParams.get('from'), 'exhibition');
  history.replaceState({}, '', '/personal-homepage/showcase/?work=the-wolf&return=1');
  ready();
  assert.equal(document.activeElement, link);
  assert.equal(selected(element), 'the-wolf');
});

test('目录返回没有匹配滚动记录时，让当前作品进入视口', t => {
  const element = gallery(t, '?view=index&work=inspection-robot&return=1');
  const card = element.querySelector('[data-slug="inspection-robot"]');
  const visible = t.mock.method(card, 'scrollIntoView');
  ready();
  assert.equal(visible.mock.callCount(), 1);
  assert.equal(visible.mock.calls[0].arguments[0].block, 'center');
  assert.equal(document.activeElement, card.querySelector('a'));
});

test('目录返回有匹配记录时保留滚动值，不再居中覆盖原位置', t => {
  const element = gallery(t, '?view=index&type=project&work=inspection-robot&return=1');
  sessionStorage.setItem('lssh.afterimage.return', JSON.stringify({ slug: 'inspection-robot', view: 'index', filter: 'project', y: 173 }));
  const card = element.querySelector('[data-slug="inspection-robot"]');
  const visible = t.mock.method(card, 'scrollIntoView');
  const scroll = t.mock.method(window, 'scrollTo');
  ready();
  assert.equal(scroll.mock.calls[0].arguments[0].top, 173);
  assert.equal(visible.mock.callCount(), 0);
  assert.equal(document.activeElement, card.querySelector('a'));
});

test('横向拖动选择、抑制误入；纵向输入和取消恢复原作品，离页释放指针', t => {
  const element = gallery(t); ready();
  const rail = element.querySelector('.ai-rail');
  pointer(rail, 'pointerdown', 300, 200);
  pointer(rail, 'pointermove', 180, 204);
  assert.equal(rail.dataset.dragging, 'true');
  pointer(window, 'pointerup', 180, 204);
  assert.equal(selected(element), 'opening-performance');
  const link = element.querySelector('[data-active="true"] a');
  const event = new window.MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
  link.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  pointer(rail, 'pointerdown', 200, 200);
  pointer(rail, 'pointermove', 205, 320);
  assert.equal(rail.dataset.dragging, undefined);
  pointer(rail, 'pointerdown', 300, 200);
  pointer(rail, 'pointermove', 170, 202);
  pointer(window, 'pointercancel', 170, 202);
  assert.equal(selected(element), 'opening-performance');
  assert.equal(rail.dataset.dragging, undefined);
  pointer(rail, 'pointerdown', 300, 200);
  pointer(rail, 'pointermove', 170, 202);
  element.remove();
  assert.equal(rail.hasPointerCapture(1), false);
  assert.equal(frames.size, 0);
});

test('减少动画偏好变更保留选择并撤去旋转；卸载取消尚未执行的恢复帧', t => {
  const element = gallery(t); ready();
  click(element, '[data-step="1"]');
  motion.matches = true; motion.dispatchEvent(new window.Event('change'));
  assert.equal(selected(element), 'opening-performance');
  assert.ok([...element.querySelectorAll('.ai-work:not([hidden])')].every(card => card.style.getPropertyValue('--work-turn') === '0deg'));
  motion.matches = false; motion.dispatchEvent(new window.Event('change'));
  document.dispatchEvent(new window.Event('astro:page-load'));
  assert.equal(frames.size, 1);
  element.remove();
  assert.equal(frames.size, 0);
});

test('拖动后方向键和Enter不被鼠标误点保护拦截', t => {
  const element = gallery(t); ready();
  const rail = element.querySelector('.ai-rail');
  pointer(rail, 'pointerdown', 300, 200); pointer(rail, 'pointermove', 180, 204); pointer(window, 'pointerup', 180, 204);
  let keyboardAllowed = false;
  element.addEventListener('click', event => { if (event.target.closest('.ai-work-link')) { keyboardAllowed = !event.defaultPrevented; event.preventDefault(); } });
  rail.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(keyboardAllowed, true);
});

test('pagehide撤手势与待执行恢复帧，BFCache返回不覆盖浏览器滚动', t => {
  const element = gallery(t); ready();
  const rail = element.querySelector('.ai-rail');
  pointer(rail, 'pointerdown', 300, 200); pointer(rail, 'pointermove', 180, 204);
  window.dispatchEvent(new window.Event('pagehide'));
  assert.equal(rail.hasPointerCapture(1), false);
  assert.equal(rail.dataset.dragging, undefined);
  document.dispatchEvent(new window.Event('astro:page-load'));
  assert.equal(frames.size, 1);
  window.dispatchEvent(new window.Event('pagehide'));
  assert.equal(frames.size, 0);
  const scroll = t.mock.method(window, 'scrollTo');
  const event = new window.Event('pageshow'); Object.defineProperty(event, 'persisted', { value: true }); window.dispatchEvent(event);
  assert.equal(element.dataset.ready, 'true');
  assert.equal(scroll.mock.callCount(), 0);
  assert.equal(frames.size, 0);
});

function video(t) {
  const element = document.createElement('afterimage-video');
  element.dataset.playerSrc = 'https://player.bilibili.com/player.html?bvid=BV1gu4y1s7YC&autoplay=0';
  element.dataset.playerTitle = '选入影像';
  element.innerHTML = '<div class="ai-video-poster"><img><span class="ai-cover-fallback" hidden></span><button class="ai-video-load">加载</button></div><div class="ai-video-screen" hidden></div><p data-video-status></p><button data-video-retry hidden>重连</button><button data-video-close hidden>关闭</button>';
  document.body.append(element); t.after(() => element.remove()); return element;
}

test('视频按需加载并暂停共享音频，重连清理旧iframe，关闭恢复焦点', t => {
  const element = video(t);
  const before = pauses;
  assert.equal(element.querySelector('iframe'), null);
  click(element, '.ai-video-load');
  const first = element.querySelector('iframe');
  assert.equal(pauses, before + 1);
  assert.equal(element.querySelector('.ai-video-screen').getAttribute('aria-busy'), 'true');
  first.dispatchEvent(new window.Event('load'));
  assert.match(element.querySelector('[data-video-status]').textContent, /尝试播放/);
  assert.equal(element.querySelector('.ai-video-screen').getAttribute('aria-busy'), 'false');
  click(element, '[data-video-retry]');
  const next = element.querySelector('iframe');
  assert.notEqual(next, first);
  assert.equal(element.querySelectorAll('iframe').length, 1);
  first.dispatchEvent(new window.Event('load'));
  assert.match(element.querySelector('[data-video-status]').textContent, /正在连接/);
  click(element, '[data-video-close]');
  assert.equal(element.querySelector('iframe'), null);
  assert.equal(document.activeElement, element.querySelector('.ai-video-load'));
  assert.equal(element.querySelector('[data-video-retry]').hidden, true);
  first.dispatchEvent(new window.Event('load'));
  assert.match(element.querySelector('[data-video-status]').textContent, /已关闭/);
});

test('慢连接可重试、失败有反馈、Esc关闭，离页不保留播放器', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const element = video(t);
  click(element, '.ai-video-load');
  t.mock.timers.tick(12000);
  assert.match(element.querySelector('[data-video-status]').textContent, /耗时较长/);
  click(element, '[data-video-retry]');
  element.querySelector('iframe').dispatchEvent(new window.Event('error'));
  assert.match(element.querySelector('[data-video-status]').textContent, /未完成/);
  element.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(element.querySelector('iframe'), null);
  click(element, '.ai-video-load');
  element.remove();
  assert.equal(element.querySelector('iframe'), null);
  t.mock.timers.tick(12000);
  assert.match(element.querySelector('[data-video-status]').textContent, /已关闭/);
});

test('视频节点卸载再接入时恢复封面，并能重新加载', t => {
  const element = video(t); click(element, '.ai-video-load');
  const outside = document.createElement('button'); document.body.append(outside); outside.focus(); t.after(() => outside.remove());
  element.remove(); document.body.append(element);
  assert.equal(element.querySelector('.ai-video-poster').hidden, false);
  assert.equal(element.querySelector('.ai-video-screen').hidden, true);
  assert.equal(element.querySelector('[data-video-close]').hidden, true);
  assert.equal(document.activeElement, outside);
  click(element, '.ai-video-load');
  assert.equal(element.querySelectorAll('iframe').length, 1);
});

test('pagehide即使DOM仍保留，也清空视频与旧计时器；回来可重开', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const element = video(t); click(element, '.ai-video-load');
  const old = element.querySelector('iframe');
  window.dispatchEvent(new window.Event('pagehide'));
  assert.equal(element.querySelector('iframe'), null);
  assert.equal(element.querySelector('.ai-video-poster').hidden, false);
  assert.equal(element.querySelector('.ai-video-screen').getAttribute('aria-busy'), 'false');
  t.mock.timers.tick(12000); old.dispatchEvent(new window.Event('load'));
  assert.match(element.querySelector('[data-video-status]').textContent, /已关闭/);
  click(element, '.ai-video-load');
  assert.equal(element.querySelectorAll('iframe').length, 1);
});
