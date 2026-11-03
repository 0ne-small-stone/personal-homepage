import test from 'node:test';
import assert from 'node:assert/strict';
import {createRestorationSnap}from '../src/components/home/restoration-snap.mjs';

test('restored fractional reading positions survive delayed GSAP snap including inertia',()=>{
  const gate=createRestorationSnap(value=>Math.round(value*2)/2);
  // ScrollTrigger computes round(start + snapFunc(naturalEnd, self) * change).
  const start=820,change=4320;
  for(const scroll of [2379,2368,3160])for(const naturalEnd of [0,.5,1]){
    const actual=(scroll-start)/change;
    assert.equal(Math.round(start+gate.snapTo(naturalEnd,{progress:actual})*change),scroll);
  }
});
test('real scrolling resumes the original card snap; a later restore holds again',()=>{
  const gate=createRestorationSnap(value=>Math.round(value*2)/2);
  gate.release();assert.equal(gate.snapTo(.41,{progress:.36}),.5);
  gate.hold();assert.equal(gate.snapTo(.41,{progress:.36}),.36);
  gate.release();assert.equal(gate.snapTo(.91,{progress:.8}),1);
});
