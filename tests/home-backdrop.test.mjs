import test from 'node:test';
import assert from 'node:assert/strict';
import { backdropState } from '../src/components/home/backdrop-state.ts';
const state=(index,intro=1,outro=0,prepare=0,mobile=false,quiet=false)=>backdropState(index,intro,outro,prepare,1,mobile,quiet);

test('three card centers share one continuous neutral field without chapter switching',()=>{
  assert.deepEqual(state(1).light,[.72,.36]);assert.deepEqual(state(2).light,[.5,.30]);
  assert.ok(Math.abs(state(3).light[0]-.28)<1e-12);
  assert.ok(Math.abs(state(1.999).light[0]-state(2.001).light[0])<.001);
  assert.equal(state(1).weight,1);assert.equal(state(3).weight,1);
});
test('outro dims continuously and preparation removes all new space layers exactly',()=>{
  assert.ok(state(3,1,.5).weight<1);assert.ok(state(3,1,1).weight>0);
  assert.equal(state(3,1,1,.25).weight,0);assert.equal(state(3,1,1,1).weight,0);
  assert.ok(state(3,1,1,.1).weight>state(3,1,1,.2).weight);
});
test('reverse input restores the same state, while quiet removes new movement',()=>{
  const before=state(1.8,1,.1,.05);state(3,1,1,1);assert.deepEqual(state(1.8,1,.1,.05),before);
  const quiet=state(3,1,1,1,true,true);assert.equal(quiet.weight,0);assert.equal(quiet.intro,1);assert.equal(quiet.q,0);
});
test('travel, mobile light range and spacing stay inside the design envelope',()=>{
  const start=state(1),end=state(3),mobileStart=state(1,1,0,0,true),mobileEnd=state(3,1,0,0,true);
  assert.ok(Math.abs(end.farOffset[0]-start.farOffset[0])<=.035);
  assert.ok(Math.abs(end.gridOffset[1]-start.gridOffset[1])<=.025);
  assert.equal(mobileStart.light[0],.62);assert.equal(mobileEnd.light[0],.38);assert.ok(mobileStart.spacing>=72);
});
