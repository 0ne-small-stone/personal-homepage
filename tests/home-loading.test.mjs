import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HomeLoadingGate,wantsIntroReveal} from '../src/components/home/loading-state.ts';

const entry={seen:false,returning:false,hash:'',scrollY:0,quiet:false};
test('only a fresh first-screen visit requests the intro',()=>{
  assert.equal(wantsIntroReveal(entry),true);
  for(const change of [{seen:true},{returning:true},{hash:'#wall'},{scrollY:150},{quiet:true}])assert.equal(wantsIntroReveal({...entry,...change}),false);
});
test('all real prerequisites must complete, in any order, before revealing',()=>{
  const gate=new HomeLoadingGate(true);
  for(const key of ['frame','compiled','layout'])gate.mark(key);
  assert.equal(gate.phase,'waiting');gate.mark('frame');assert.equal(gate.phase,'waiting');
  gate.mark('wordmark');assert.equal(gate.phase,'revealing');assert.equal(gate.progress,0);
  gate.advance(.5);assert.equal(gate.progress,.5);gate.finish();assert.equal(gate.phase,'ready');assert.equal(gate.active,false);
});
test('ordinary browsing cannot be resurrected by late resources or completion',()=>{
  const gate=new HomeLoadingGate(true);gate.fallback();
  for(const key of ['wordmark','frame','compiled','layout'])gate.mark(key);
  gate.finish();gate.advance(.5);assert.equal(gate.phase,'fallback');assert.equal(gate.active,false);
});
test('failure and disposal ignore late work, including a queued completion',()=>{
  const gate=new HomeLoadingGate(true);let calls=0;gate.subscribe(()=>calls++);
  gate.fallback(true,'resource-timeout');const final=calls;
  gate.dispose();gate.mark('frame');gate.finish();assert.equal(calls,final);assert.equal(gate.phase,'error');
});
test('return/deep-link/quiet readiness skips the animation and a preference interrupt completes safely',()=>{
  const gate=new HomeLoadingGate(false);
  for(const key of ['compiled','frame','layout','wordmark'])gate.mark(key);
  assert.equal(gate.phase,'ready');assert.equal(gate.progress,1);
  const intro=new HomeLoadingGate(true);for(const key of ['compiled','frame','layout','wordmark'])intro.mark(key);
  intro.advance(.3);intro.bypass();intro.finish();assert.equal(intro.phase,'ready');assert.equal(intro.progress,1);
});
