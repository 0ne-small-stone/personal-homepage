import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { homeChapterStrokes,homeChapterGesture } from '../src/lib/home-chapter-shapes.ts';
import { mountInviteMarks } from '../src/lib/invite-motion.ts';
import { gesturePoint,gestureSignal } from '../src/lib/invite-gestures.ts';

const chapters=['intro','album','radio','projects','wall'];
test('五个编号与姿态逐笔兼容，整个变形和有限动作的坐标留在图标内',()=>{
  const signature=new Set();
  chapters.forEach((chapter,index)=>{
    const strokes=homeChapterStrokes(chapter,index);
    signature.add(strokes.map(s=>s.person).join(''));
    for(const stroke of strokes) {
      assert.equal(stroke.arrow.replace(/-?\d*\.?\d+/g,''),stroke.person.replace(/-?\d*\.?\d+/g,''));
      const a=stroke.arrow.match(/-?\d*\.?\d+/g).map(Number),b=stroke.person.match(/-?\d*\.?\d+/g).map(Number);
      for(const amount of [0,.25,.5,.75,1]) a.forEach((v,n)=>{
        const point=v+(b[n]-v)*amount;
        assert.ok(Number.isFinite(point)&&point>=0&&point<=24,chapter+' '+stroke.part);
      });
      for(const phase of [0,.125,.25,.5,.75,.875,1]) for(let i=0;i<b.length;i+=2) {
        const gesture=homeChapterGesture(chapter);
        const point=gesturePoint(gesture,stroke.part,b[i],b[i+1],gestureSignal(gesture,phase));
        assert.ok(point.every(v=>Number.isFinite(v)&&v>=0&&v<=24),chapter+' gesture '+stroke.part);
      }
    }
  });
  assert.equal(signature.size,5);
  assert.throws(()=>homeChapterStrokes('intro',5),RangeError);
});

test('五个原生章节链接共用有限帧，折返、停驻和卸载不留后台动画',t=>{
  const dom=new JSDOM(chapters.map((chapter,index)=>`<a href="#${chapter}"><span data-invite-mark data-invite-gesture="${homeChapterGesture(chapter)}"><svg>${homeChapterStrokes(chapter,index).map(s=>`<path data-invite-part="${s.part}" data-invite-arrow="${s.arrow}" data-invite-person="${s.person}" d="${s.arrow}"/>`).join('')}</svg></span></a>`).join(''),{pretendToBeVisual:true});
  const view=dom.window;
  view.matchMedia=query=>Object.assign(new view.EventTarget(),{matches:!query.includes('reduce')});
  const frames=new Map();let id=0,now=0;
  view.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};
  view.cancelAnimationFrame=id=>frames.delete(id);
  const run=duration=>{for(let ms=0;ms<duration;ms+=10){now+=10;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
  const cleanup=mountInviteMarks(view.document.body,view);
  t.after(()=>{cleanup();view.close();});
  for(const link of view.document.querySelectorAll('a')) {
    const endpoint=name=>[...link.querySelectorAll('path')].every(p=>p.getAttribute('d')===p.dataset[name]);
    link.dispatchEvent(new view.Event('pointerenter'));run(100);
    link.dispatchEvent(new view.Event('pointerleave'));run(50);
    link.dispatchEvent(new view.Event('pointerenter'));run(3600);
    assert.ok(endpoint('invitePerson'));assert.equal(frames.size,0);
    assert.ok([...link.querySelectorAll('path')].every(p=>!p.getAttribute('d').includes('NaN')));
    link.dispatchEvent(new view.Event('pointerleave'));run(1600);
    assert.ok(endpoint('inviteArrow'));assert.equal(frames.size,0);
    let clicked=false;link.addEventListener('click',event=>{event.preventDefault();clicked=true;},{once:true});link.click();assert.ok(clicked);
  }
  view.document.querySelector('a').dispatchEvent(new view.Event('pointerenter'));run(50);cleanup();assert.equal(frames.size,0);
});
