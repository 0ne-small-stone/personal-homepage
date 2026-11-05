import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountInviteMarks } from '../src/lib/invite-motion.ts';
import { gesturePoint, gestureSignal, gestureDuration } from '../src/lib/invite-gestures.ts';
import { homeControlStrokes, homeControlGesture } from '../src/lib/home-control-shapes.ts';

function fixture(t) {
  const markup = ['sound','motion','wall'].map(kind => '<button><span data-home-control-mark data-invite-gesture="'+homeControlGesture(kind,kind==='motion')+'"><svg>'+homeControlStrokes(kind,kind==='motion').map(({part,arrow,person}) => '<path data-invite-part="'+part+'" data-invite-arrow="'+arrow+'" data-invite-person="'+person+'" d="'+arrow+'"/>').join('')+'</svg></span></button>').join('');
  const dom = new JSDOM(markup,{pretendToBeVisual:true});
  const view=dom.window,root=view.document.body;
  view.matchMedia=query=>Object.assign(new view.EventTarget(),{matches:!query.includes('reduce')});
  let now=0,id=0;const frames=new Map();
  view.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};
  view.cancelAnimationFrame=id=>frames.delete(id);
  const marks=[...root.querySelectorAll('[data-home-control-mark]')];
  const buttons=marks.map(mark=>mark.closest('button'));
  const step=ms=>{now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(now));};
  const run=ms=>{for(let n=0;n<ms;n+=10)step(Math.min(10,ms-n));};
  const event=(index,type)=>buttons[index].dispatchEvent(new view.Event(type));
  let cleanup=()=>{};
  t.after(()=>{cleanup();dom.window.close();});
  return {root,view,marks,buttons,frames,step,run,event,mount(selector){cleanup=mountInviteMarks(root,view,selector);},dispose(){cleanup();cleanup=()=>{};}};
}
const paths=mark=>[...mark.querySelectorAll('path')];
const endpoint=(mark,name)=>paths(mark).every(path=>path.getAttribute('d')===path.dataset[name]);

test('局部顶栏控制器独占自有图形，多个按钮共用有限帧且不影响原生点击', t=>{
  const f=fixture(t);f.mount();f.event(0,'pointerenter');assert.equal(f.frames.size,0);f.dispose();
  f.mount('[data-home-control-mark]');f.event(0,'pointerenter');f.event(1,'pointerenter');f.event(2,'pointerenter');
  assert.equal(f.frames.size,1);f.step(0);f.run(3600);
  f.marks.forEach(mark=>assert.ok(endpoint(mark,'invitePerson')));assert.equal(f.frames.size,0);
  let clicks=0;f.buttons.forEach(button=>button.addEventListener('click',()=>clicks++));
  f.buttons.forEach(button=>button.click());assert.equal(clicks,3);
  f.buttons.forEach((_,index)=>f.event(index,'pointerleave'));f.run(1600);
  f.marks.forEach(mark=>assert.ok(endpoint(mark,'inviteArrow')));assert.equal(f.frames.size,0);
});

test('悬停或折返中更新实际开关状态，保持人形进度并收回至最新播放图形', async t=>{
  const f=fixture(t);f.mount('[data-home-control-mark]');
  f.event(1,'pointerenter');f.step(0);f.run(3600);
  const mark=f.marks[1];assert.ok(endpoint(mark,'invitePerson'));assert.equal(f.frames.size,0);
  const update=(kind,active)=>homeControlStrokes(kind,active).forEach((stroke,index)=>{
    const path=paths(mark)[index];path.dataset.inviteArrow=stroke.arrow;path.dataset.invitePerson=stroke.person;path.setAttribute('d',stroke.arrow);
  });
  const before=paths(mark).map(path=>path.getAttribute('d'));
  update('motion',false);mark.dataset.inviteGesture=homeControlGesture('motion',false);await Promise.resolve();
  const numeric=d=>d.match(/-?\d*\.?\d+/g).map(Number);
  paths(mark).forEach((path,index)=>numeric(path.getAttribute('d')).forEach((n,i)=>assert.ok(Math.abs(n-numeric(before[index])[i])<.0011,'点击后首帧保留当前姿态')));
  assert.equal(f.frames.size,1);f.run(3200);assert.ok(endpoint(mark,'invitePerson'));assert.equal(f.frames.size,0);
  f.event(1,'pointerleave');f.run(1600);assert.ok(endpoint(mark,'inviteArrow'));
  assert.deepEqual(paths(mark).map(path=>path.getAttribute('d')),homeControlStrokes('motion',false).map(stroke=>stroke.arrow));
  f.event(1,'pointerenter');f.run(100);const progress=mark.style.getPropertyValue('--invite-progress');
  update('motion',true);await Promise.resolve();assert.equal(mark.style.getPropertyValue('--invite-progress'),progress);
  assert.ok(paths(mark).every(path=>!path.getAttribute('d').includes('NaN')));
  f.event(1,'pointerleave');f.run(1700);assert.ok(endpoint(mark,'inviteArrow'));assert.equal(f.frames.size,0);
});


test('四种功能姿态各自可辨，音乐两种开关共用耳机人形并有限收敛', async t=>{
  const f=fixture(t);f.mount('[data-home-control-mark]');
  const signatures=new Set();
  for(const [kind,active,index] of [['wall',false,2],['sound',false,0],['sound',true,0],['motion',true,1],['motion',false,1]]) {
    const strokes=homeControlStrokes(kind,active);signatures.add(strokes.map(s=>s.person).join(''));
    const mark=f.marks[index];mark.dataset.inviteGesture=homeControlGesture(kind,active);
    strokes.forEach((stroke,n)=>{
      assert.equal(stroke.arrow.replace(/[-+]?\d*\.?\d+/g,''),stroke.person.replace(/[-+]?\d*\.?\d+/g,''),'同一笔画拓扑匹配');
      const p=paths(mark)[n];p.dataset.inviteArrow=stroke.arrow;p.dataset.invitePerson=stroke.person;
    });
    await Promise.resolve();f.event(index,'pointerenter');f.run(3400);
    assert.ok(endpoint(mark,'invitePerson'));assert.equal(f.frames.size,0);
    f.event(index,'pointerleave');f.run(1600);assert.ok(endpoint(mark,'inviteArrow'));
  }
  assert.equal(signatures.size,4);
});

test('姿态切换中再次切换和移开，始终可回到最新图标且取消帧', async t=>{
  const f=fixture(t);f.mount('[data-home-control-mark]');const mark=f.marks[1];
  f.event(1,'pointerenter');f.run(3200);
  for(const active of [false,true,false,true]) {
    const before=paths(mark).map(p=>p.getAttribute('d').match(/-?\d*\.?\d+/g).map(Number));
    homeControlStrokes('motion',active).forEach((stroke,index)=>{const p=paths(mark)[index];p.dataset.inviteArrow=stroke.arrow;p.dataset.invitePerson=stroke.person;});
    mark.dataset.inviteGesture=homeControlGesture('motion',active);await Promise.resolve();
    paths(mark).forEach((p,n)=>p.getAttribute('d').match(/-?\d*\.?\d+/g).map(Number).forEach((v,i)=>assert.ok(Math.abs(v-before[n][i])<.0011,'动作中切换没有几何跳变')));f.run(260);
    assert.ok(paths(mark).every(p=>!p.getAttribute('d').includes('NaN')));
  }
  f.event(1,'pointerleave');f.run(1800);assert.ok(endpoint(mark,'inviteArrow'));assert.equal(f.frames.size,0);
});


test('耳机随头和扶耳手臂同步轻晃，开关状态保留唱针差异', t=>{
  const off=homeControlStrokes('sound',false),on=homeControlStrokes('sound',true);
  assert.deepEqual(off.map(s=>s.person),on.map(s=>s.person));
  assert.notDeepEqual(off.map(s=>s.arrow),on.map(s=>s.arrow));
  assert.deepEqual(off.slice(7).map(s=>s.part),['headband','left-earcup','right-earcup']);
  assert.equal(homeControlGesture('sound',false),'home-music');
  assert.equal(homeControlGesture('sound',true),'home-music');
  assert.ok(gestureDuration('home-music')<1.5);
  assert.equal(gestureSignal('home-music',0),0);
  assert.ok(Math.abs(gestureSignal('home-music',1))<1e-10);
  const signal=gestureSignal('home-music',.35);
  const head=gesturePoint('home-music','head',12,5,signal);
  for(const part of ['headband','left-earcup','right-earcup','forearm','right-arm','body']) {
    assert.deepEqual(gesturePoint('home-music',part,12,5,signal),head,'耳机和手臂不脱离头部');
  }
  assert.deepEqual(gesturePoint('home-music','left-leg',10,15.5,signal),[10,15.5]);
});


test('平衡支撑脚固定，倾听保持手掌连接，小跳全身共同起落', ()=>{
  assert.equal(homeControlGesture('wall',false),'home-warm-listen');
  assert.equal(homeControlGesture('motion',true),'home-balance');
  assert.equal(homeControlGesture('motion',false),'home-hop');
  for(const phase of [.1,.35,.6,.9]) {
    const balance=gestureSignal('home-balance',phase);
    assert.deepEqual(gesturePoint('home-balance','left-leg',7.2,21,balance),[7.2,21]);
    const listen=gestureSignal('home-warm-listen',phase);
    assert.deepEqual(gesturePoint('home-warm-listen','palm',14.2,5.1,listen),gesturePoint('home-warm-listen','forearm',14.2,5.1,listen));
    const hop=gestureSignal('home-hop',phase);
    const displacement=gesturePoint('home-hop','head',10,5,hop)[1]-5;
    for(const part of ['forearm','left-leg','body','right-leg'])assert.ok(Math.abs(gesturePoint('home-hop',part,10,15,hop)[1]-15-displacement)<1e-12);
  }
  for(const profile of ['home-warm-listen','home-balance','home-hop']) {
    assert.equal(gestureSignal(profile,0),0);assert.ok(Math.abs(gestureSignal(profile,1))<1e-10);assert.ok(gestureDuration(profile)<=1.25);
  }
});
