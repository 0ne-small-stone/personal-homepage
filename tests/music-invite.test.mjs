import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountInviteMarks as mountWebsiteInvites } from '../src/lib/invite-motion.ts';
import {inviteStrokes, rotateInviteArrow} from '../src/lib/invite-shapes.ts';

const button = '<button type="button"><span data-invite-mark data-invite-direction="right" aria-hidden="true"><svg>'+inviteStrokes.map(({part,arrow,person}) => {const d=rotateInviteArrow(arrow);return '<path data-invite-part="'+part+'" data-invite-arrow="'+d+'" data-invite-person="'+person+'" d="'+d+'"/>';}).join('')+'</svg></span>打开每日推荐</button>';
const markup = '<div>'+button+'</div>';
function fixture(t, reduce = false, source = markup, intersections = false) {
  const dom = new JSDOM(source, { pretendToBeVisual: true });
  const view = dom.window, root = view.document.querySelector('[data-website-directory]') ?? view.document.body;
  const media = query => Object.assign(new view.EventTarget(), { media: query, matches: query.includes('reduce') ? reduce : true });
  const reduced = media('reduce'), pointer = media('pointer');
  view.matchMedia = query => query.includes('reduce') ? reduced : pointer;
  let now = 0, id = 0, hidden = false;
  const callbacks = new Map();
  view.requestAnimationFrame = callback => { callbacks.set(++id, callback); return id; };
  view.cancelAnimationFrame = frame => callbacks.delete(frame);
  Object.defineProperty(view.document, 'hidden', { get: () => hidden });
  let intersect;
  if (intersections) view.IntersectionObserver = class {
    constructor(callback) { intersect = callback; }
    observe() {}
    disconnect() { intersect = undefined; }
  };
  let cleanup = mountWebsiteInvites(root, view);
  const mark = root.querySelector('[data-invite-mark]'), card = mark.closest('button');
  const paths = [...mark.querySelectorAll('path')];
  const snapshot = () => paths.map(path => path.getAttribute('d'));
  const step = ms => { now += ms; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(callback => callback(now)); };
  const run = (duration, interval = 10) => { for (let n = 0; n < duration; n += interval) step(Math.min(interval, duration - n)); };
  const enter = (touch = false) => { const event = new view.Event('pointerenter'); Object.defineProperty(event, 'pointerType', { value: touch ? 'touch' : 'mouse' }); card.dispatchEvent(event); };
  const leave = () => card.dispatchEvent(new view.Event('pointerleave'));
  t.after(() => { cleanup(); dom.window.close(); });
  return { root, view, card, mark, paths, snapshot, step, run, enter, leave, callbacks, reduced, pointer,
    intersect(value) { intersect?.([{ target: mark, isIntersecting: value }]); },
    remount() { cleanup(); cleanup = mountWebsiteInvites(root, view); },
    reduce(value) { reduced.matches = value; reduced.dispatchEvent(new view.Event('change')); },
    hide(value) { hidden = value; view.document.dispatchEvent(new view.Event('visibilitychange')); },
    dispose() { cleanup(); cleanup = () => {}; },
  };
}
const coordinates = d => d.match(/-?\d*\.?\d+/g).map(Number);
const progress = f => Number(f.mark.style.getPropertyValue('--invite-progress'));
const isArrow = f => f.paths.every(path => path.getAttribute('d') === path.dataset.inviteArrow);
const isPerson = f => f.paths.every(path => path.getAttribute('d') === path.dataset.invitePerson);

test('快速折返保持当前几何与速度，最终归位并彻底停帧', t => {
  const f = fixture(t);
  assert.equal(f.paths.length, 7); assert.ok(isArrow(f));
  f.enter(); f.step(0); f.run(80);
  const before = f.snapshot(), p = progress(f);
  assert.ok(p > .1 && p < .8);
  f.leave(); assert.deepEqual(f.snapshot(), before);
  f.step(10); assert.ok(progress(f) > p, '保留展开速度，经过连续转向后收回');
  f.run(1500); assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  const rest = f.snapshot(); f.run(2000); assert.deepEqual(f.snapshot(), rest);
});

const someoneButton = button;
test('真实横向邀请支持键盘进入、祖先隐藏及重新挂载，无重复帧', async t => {
  const f = fixture(t, false, `<section>${someoneButton}</section>`);
  assert.equal(f.mark.dataset.inviteDirection, 'right');
  f.card.focus(); f.step(0); f.run(3500);
  assert.ok(isPerson(f)); assert.equal(f.callbacks.size, 0);
  f.card.parentElement.hidden = true; await Promise.resolve();
  assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  f.card.blur(); f.card.parentElement.hidden = false;
  f.remount(); f.enter(); assert.equal(f.callbacks.size, 1);
  f.step(0); f.run(100); f.remount();
  assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  f.card.focus(); assert.equal(f.callbacks.size, 1);
  f.step(0); f.run(3500); assert.ok(isPerson(f));
  f.card.blur(); f.run(1600); assert.ok(isArrow(f));
});
test('离屏或切换隐藏视图立即复位，回到视口后仍可邀请', t => {
  const f = fixture(t, false, someoneButton, true);
  f.enter(); f.step(0); f.run(100); assert.ok(progress(f) > 0);
  f.intersect(false); assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  f.enter(); assert.equal(f.callbacks.size, 0);
  f.intersect(true); f.enter(); f.step(0); f.run(3500);
  assert.ok(isPerson(f)); assert.equal(f.callbacks.size, 0);
});
test('招手中移开没有路径跳变，收回后静止；持续悬停也有限停止', t => {
  const f = fixture(t);
  f.enter(); f.step(0); f.run(750);
  const arm = f.paths.find(path => path.dataset.invitePart === 'forearm');
  assert.notEqual(arm.getAttribute('d'), arm.dataset.invitePerson);
  const before = f.snapshot(), beforeArm = coordinates(arm.getAttribute('d'));
  f.leave(); assert.deepEqual(f.snapshot(), before);
  f.step(10);
  const delta = coordinates(arm.getAttribute('d')).map((value, i) => Math.abs(value - beforeArm[i]));
  assert.ok(Math.max(...delta) < 1, '退出首帧手臂延续当前形状');
  f.run(1600); assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  f.enter(); f.step(0); f.run(3500);
  assert.ok(isPerson(f)); assert.equal(f.callbacks.size, 0);
});
test('连续多次打断及卸载不遗留帧或事件', t => {
  const f = fixture(t);
  for (let i = 0; i < 12; i++) {
    f.enter(); f.step(0); f.run(40); f.leave(); f.run(40);
    assert.ok(f.snapshot().flatMap(coordinates).every(Number.isFinite));
    assert.ok(progress(f) >= 0 && progress(f) <= 1);
  }
  f.enter(); f.step(0); f.run(100); f.dispose();
  assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  f.enter(); assert.equal(f.callbacks.size, 0);
});
test('减少动画即时静态端点，无帧请求；触摸不触发悬停', t => {
  const f = fixture(t, true);
  f.enter(true); assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  f.enter(); assert.ok(isPerson(f)); assert.equal(f.callbacks.size, 0);
  f.leave(); assert.ok(isArrow(f));
  f.reduce(false); f.enter(); f.step(0); f.run(100);
  f.card.focus(); f.reduce(true);
  assert.ok(isPerson(f)); assert.equal(f.callbacks.size, 0);
});
test('筛选隐藏、页面隐藏及时取消动画，重新进入可以正常启动', async t => {
  const f = fixture(t);
  f.enter(); f.step(0); f.run(200);
  f.card.hidden = true; await Promise.resolve();
  assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  f.card.hidden = false; f.enter(); f.step(0); f.run(200);
  f.hide(true); assert.ok(isArrow(f)); assert.equal(f.callbacks.size, 0);
  f.hide(false); f.enter(); f.step(0); f.run(3500); assert.ok(isPerson(f));
});
test('解析解在不同常规帧间隔下得到相同展开进度', t => {
  const positions = [5, 10, 20].map(interval => {
    const f = fixture(t); f.enter(); f.step(0); f.run(200, interval); return progress(f);
  });
  assert.ok(Math.max(...positions) - Math.min(...positions) < .0002);
});

test('禁用原生按钮立即停止邀请，卸载后重新挂载不重复监听', async t => {
  const f=fixture(t);
  f.enter();f.step(0);f.run(300);assert.ok(progress(f)>0);
  f.card.disabled=true;await Promise.resolve();assert.ok(isArrow(f));assert.equal(f.callbacks.size,0);
  f.enter();assert.equal(f.callbacks.size,0);
  f.card.disabled=false;f.remount();f.enter();assert.equal(f.callbacks.size,1);
  f.step(0);f.run(200);f.dispose();assert.ok(isArrow(f));assert.equal(f.callbacks.size,0);
  f.card.focus();f.enter();assert.equal(f.callbacks.size,0);
});

test('多个入口共用一个有限帧循环，不消费点击事件', t => {
  const f=fixture(t,false,'<div>'+button.repeat(3)+'</div>');
  const buttons=[...f.root.querySelectorAll('button')];let clicks=0;
  buttons.forEach(button=>button.addEventListener('click',()=>clicks++));
  for(const button of buttons)button.dispatchEvent(new f.view.Event('pointerenter'));
  assert.equal(f.callbacks.size,1);f.step(0);f.run(3500);assert.equal(f.callbacks.size,0);
  buttons.forEach(button=>button.click());assert.equal(clicks,3);
  f.dispose();assert.equal(f.callbacks.size,0);
});
