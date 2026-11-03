import test from 'node:test';
import assert from 'node:assert/strict';
import {FlowInput} from '../src/components/home/flow-input.mjs';
import {FlowActivity} from '../src/components/home/flow-activity.mjs';

const pointer=()=>({x:0,y:0,movedAt:0,active:true,revision:1});
test('stationary active tail does not dilute the next small input segment',()=>{
  for(const hz of [30,60,120])for(const idle of [100,2300]){
    const input=new FlowInput(),p=pointer(),activity=new FlowActivity(),dt=1/hz;
    input.align(p);activity.update(0,p,1,true,'black');
    p.movedAt=100;p.x=.01;activity.update(100,p,1,true,'black');input.sample(p,dt,{fresh:true});
    for(let time=100+1000/hz;time<100+idle;time+=1000/hz){activity.update(time,p,1,true,'black');input.sample(p,dt);}
    const before=activity.update(100+idle,p,1,true,'black').amount;
    p.x+=.005;p.movedAt=100+idle;
    const state=activity.update(p.movedAt,p,1,true,'black'),sample=input.sample(p,dt);
    assert(Math.abs(sample.from[0]-.01)<1e-10,JSON.stringify({hz,idle,sample}));
    assert(sample.source[0]>.005*60*.75,JSON.stringify({hz,idle,sample}));
    assert.equal(state.amount,before);assert.equal(state.clear,false);
  }
});
test('fast motion followed by a tiny reverse follows the new direction immediately',()=>{
  for(const hz of [30,60,120]){
    const input=new FlowInput(),p=pointer(),dt=1/hz;input.align(p);
    for(let i=1;i<=10;i++){p.x+=1.8*dt;p.movedAt=i*1000/hz;input.sample(p,dt);}
    p.x-=.0005;p.movedAt+=1000/hz;assert(input.sample(p,dt).source[0]<0);
  }
});
test('reversing one input component keeps orthogonal motion and field lifecycle untouched',()=>{
  const input=new FlowInput(),p=pointer(),dt=1/60;input.align(p);
  for(let i=1;i<=10;i++){p.x+=dt;p.y+=dt;p.movedAt=i*1000/60;input.sample(p,dt);}
  p.x-=.0005;p.y+=dt;p.movedAt+=1000/60;const s=input.sample(p,dt);
  assert(s.source[0]<0);assert(s.source[1]>0);assert(s.buffer[1]>0);
});
test('one long stalled render remains backlog-limited rather than a stationary reentry',()=>{
  const input=new FlowInput(),p=pointer();input.align(p);p.x=.1;p.movedAt=100;
  const s=input.sample(p,.1);assert(Math.abs(s.from[0]-.06666666666666668)<1e-10);
  assert(s.source[0]<=2);
});
test('stationary reentry still discards displacement older than the solver time cap',()=>{
  const input=new FlowInput(),p=pointer();input.align(p);
  for(let i=0;i<4;i++)input.sample(p,1/60);
  p.x=.1;p.movedAt=166.6666667;
  const s=input.sample(p,.1);
  assert(Math.abs(s.from[0]-.06666666666666668)<1e-10);
  assert(s.source[0]<=2);
});
