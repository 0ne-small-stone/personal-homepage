import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountMusicSidebarScroll} from '../src/lib/music-sidebar-scroll.ts';

function fixture(t) {
  const dom = new JSDOM('<div class="frame"><nav><div><button>首页</button></div><div><button>历史</button></div></nav></div>', {pretendToBeVisual: true});
  const view = dom.window, frame = view.document.querySelector('.frame'), nav = frame.querySelector('nav');
  let height = 200, content = 500, hidden = false, next = 0, resize, disconnected = 0;
  const timers = new Map();
  Object.defineProperties(nav, {clientHeight: {get: () => height}, scrollHeight: {get: () => content}});
  Object.defineProperty(view.document, 'hidden', {get: () => hidden});
  view.setTimeout = callback => {timers.set(++next, callback); return next;};
  view.clearTimeout = id => timers.delete(id);
  view.ResizeObserver = class {constructor(callback) {resize = callback;} observe() {} disconnect() {disconnected++;}};
  let dispose = mountMusicSidebarScroll(frame);
  t.after(() => {dispose(); dom.window.close();});
  return {frame, nav, timers, view,
    scroll(top) {nav.scrollTop = top; nav.dispatchEvent(new view.Event('scroll'));},
    resize(h, c) {height = h; content = c; resize();},
    idle() {const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn());},
    hide(value) {hidden = value; view.document.dispatchEvent(new view.Event('visibilitychange'));},
    dispose() {dispose(); dispose = () => {};},
    disconnected: () => disconnected,
  };
}

test('溢出和两端提示跟随真实滚动位置，尺寸不足及无溢出不留渐隐', t => {
  const f = fixture(t);
  assert.equal(f.frame.dataset.above, 'false'); assert.equal(f.frame.dataset.below, 'true');
  f.scroll(120); assert.equal(f.frame.dataset.above, 'true'); assert.equal(f.frame.dataset.below, 'true');
  f.scroll(300); assert.equal(f.frame.dataset.above, 'true'); assert.equal(f.frame.dataset.below, 'false');
  f.resize(700, 500); assert.equal(f.frame.dataset.overflow, 'false'); assert.equal(f.frame.dataset.above, 'false');
  f.resize(0, 500); assert.equal(f.frame.dataset.below, 'false');
});
test('连续滚动只续一个有限计时，停止后回落，不拦截原生滚动或点击', t => {
  const f = fixture(t); let clicks = 0;
  f.nav.querySelector('button').addEventListener('click', () => clicks++);
  f.scroll(10); f.scroll(20); f.scroll(30);
  assert.equal(f.timers.size, 1); assert.equal(f.frame.dataset.scrolling, 'true'); assert.equal(f.nav.scrollTop, 30);
  f.nav.querySelector('button').click(); assert.equal(clicks, 1);
  f.idle(); assert.equal(f.frame.dataset.scrolling, 'false'); assert.equal(f.timers.size, 0);
});
test('隐藏与卸载清理计时及观察，卸载后不写状态，重挂载按实际位置恢复', t => {
  const f = fixture(t);
  f.scroll(80); f.hide(true); assert.equal(f.timers.size, 0); assert.equal(f.frame.dataset.scrolling, 'false');
  f.hide(false); f.scroll(100); f.dispose(); assert.equal(f.timers.size, 0); assert.equal(f.disconnected(), 1);
  f.scroll(300); assert.equal(f.frame.dataset.below, undefined);
  const dispose = mountMusicSidebarScroll(f.frame);
  assert.equal(f.frame.dataset.below, 'false'); assert.equal(f.frame.dataset.above, 'true'); dispose();
});
