import test from 'node:test';
import assert from 'node:assert/strict';
import {FlowInput,flowInputConfig} from '../src/components/home/flow-input.mjs';
import {FlowActivity,flowTailMs} from '../src/components/home/flow-activity.mjs';

const pointer=()=>({x:0,y:0,movedAt:0,active:true,revision:1});
function replay(hz,eventHz=hz){
  const input=new FlowInput(),p=pointer();input.align(p);
  let impulse=0,maxLag=0;
  for(let i=1;i<=hz*2;i++){
    const t=i/hz,stamp=Math.floor((t+1e-8)*eventHz)/eventHz;
    if(stamp*1000>p.movedAt){p.x=Math.min(1,stamp)*.5;p.movedAt=stamp*1000;}
    const s=input.sample(p,1/hz);impulse+=s.source[0];maxLag=Math.max(maxLag,Math.abs(p.x-s.position[0]));
  }
  return {hz,eventHz,impulse,maxLag};
}
test('30/60/120Hz and sparse input conserve the same path impulse',()=>{
  for(const hz of [30,60,120])for(const eventHz of [30,60,120]){
    const r=replay(hz,eventHz);assert(Math.abs(r.impulse-30)<1e-6,JSON.stringify(r));assert.equal(r.maxLag,0);
  }
});
test('first valid segment after a settled alignment responds in this solve',()=>{
  const input=new FlowInput(),p=pointer();input.align(p);p.x=.005;p.movedAt=4000;
  const s=input.sample(p,1/60,{fresh:true});assert(s.source[0]>0);assert.equal(s.position[0],p.x);assert(s.source[0]>.005*60*.75);
});
test('short moves remain linear and reversal has immediate signed response',()=>{
  const a=new FlowInput(),b=new FlowInput(),p=pointer(),q=pointer();a.align(p);b.align(q);
  p.x=.001;q.x=.002;p.movedAt=q.movedAt=16.6666667;
  const first=a.sample(p,1/60),double=b.sample(q,1/60);
  assert(Math.abs(double.source[0]/first.source[0]-2)<1e-8);
  p.x=0;p.movedAt=33.3333334;assert(a.sample(p,1/60).source[0]<0);
});
test('long frames discard backlog and share the solver time cap',()=>{
  const input=new FlowInput(),p=pointer();input.align(p);p.x=.1;p.movedAt=100;
  const s=input.sample(p,.1);assert.equal(s.seconds,flowInputConfig.maxStep);assert(Math.abs(s.from[0]-.06666666666666668)<1e-9);assert(s.source[0]<=2);
});
test('entry alignment and no-inject transitions cannot replay input',()=>{
  const input=new FlowInput(),p=pointer();input.align(p);p.x=.5;p.movedAt=16;
  input.align(p);assert.equal(input.sample(p,1/60).source[0],0);
  p.x=.6;p.movedAt=32;assert.equal(input.sample(p,1/60,{inject:false}).source[0],0);
});
test('tail re-entry preserves its current envelope and reaches one smoothly',()=>{
  const f=new FlowActivity(),p=pointer();f.update(0,p,1,true,'black');p.movedAt=100;f.update(100,p,1,true,'black');
  const before=f.update(2400,p,1,true,'black').amount;
  p.movedAt=2400;const reentered=f.update(2400,p,1,true,'black');assert.equal(reentered.amount,before);assert(before>0&&before<.3);
  let previous=before;
  for(let t=2410;t<=2520;t+=10){const value=f.update(t,p,1,true,'black').amount;assert(value>=previous);assert(value-previous<.15);previous=value;}
  assert.equal(previous,1);assert.equal(f.until,2400+flowTailMs);
  assert.equal(f.update(f.until,p,1,true,'black').amount,0);
});
test('continuous motion during a re-entry rise cannot keep restarting the rise',()=>{
  const f=new FlowActivity(),p=pointer();f.update(0,p,1,true,'black');p.movedAt=100;f.update(100,p,1,true,'black');
  for(let t=2400;t<=2540;t+=10){p.movedAt=t;f.update(t,p,1,true,'black');}
  assert.equal(f.update(2540,p,1,true,'black').amount,1);
});

if(process.env.FLOW_REPLAY_REPORT)console.log(JSON.stringify({kind:'mathematical replay, not display refresh/GPU measurement',cases:[30,60,120].flatMap(hz=>[30,60,120].map(eventHz=>replay(hz,eventHz)))}));
