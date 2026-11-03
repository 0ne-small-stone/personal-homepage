import test from 'node:test';
import assert from 'node:assert/strict';
import {captureChapterPosition,projectChapterPosition}from '../src/components/home/home-layout-position.mjs';
const dynamic=[{id:'intro',y:0,height:100},{id:'album',y:1540,height:720},{id:'radio',y:2260,height:720},{id:'projects',y:2980,height:720},{id:'wall',y:8380,height:720}];
const native=dynamic.map((s,i)=>({id:s.id,y:i*600,height:600}));
test('wall and intermediate positions migrate by semantic chapter and progress',()=>{
  for(const chapter of dynamic)for(const progress of [0,.2,.8]){
    const state={chapterId:chapter.id,localProgress:progress};
    const quiet=projectChapterPosition(native,state),captured=captureChapterPosition(native,quiet);
    assert.equal(captured.chapterId,state.chapterId);assert(Math.abs(captured.localProgress-progress)<1e-10);
    assert(Math.abs(projectChapterPosition(dynamic,captured)-(chapter.y+chapter.height*progress))<1e-9);
  }
});
test('authored project spacer progress is not clamped to the chapter endpoint',()=>{
  const state=captureChapterPosition(dynamic,2980+720*3.25);assert.equal(state.chapterId,'projects');assert.equal(state.localProgress,3.25);
  assert.equal(projectChapterPosition(native,state),1800+600*3.25);assert.equal(projectChapterPosition(dynamic,state),5320);
});
test('actual section wins when wheel scrolling leaves a stale hash behind',()=>{
  assert.equal(captureChapterPosition(dynamic,2260).chapterId,'radio');
  assert.equal(projectChapterPosition(dynamic,{chapterId:'missing',localProgress:2}),0);
});
