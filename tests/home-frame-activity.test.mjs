import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameActivity,activeFrameDelta} from '../src/components/home/frame-activity.ts';

test('input stays awake through delayed snapping, then a stationary scene sleeps',()=>{
  const clock=new FrameActivity();clock.wake(100);
  assert.equal(clock.inputActive(110),true);
  assert.equal(clock.advance(110,[0,1],false),true);
  assert.equal(clock.advance(1200,[0,1],false),true);
  assert.equal(clock.advance(1400,[0,1],false),false);
  assert.equal(clock.inputActive(1400),false);
});
test('real transform settling and active reveal/snap keep drawing after the input window',()=>{
  const clock=new FrameActivity();
  assert.equal(clock.advance(2000,[0],false),true);
  assert.equal(clock.advance(2250,[.1],false),true);
  assert.equal(clock.advance(2450,[.1],true),true);
  assert.equal(clock.advance(2500,[.1],false),false);
});
test('sleep can wake again, resize changes are observed, tiny numerical noise does not spin forever',()=>{
  const clock=new FrameActivity();clock.advance(0,[1],false);
  assert.equal(clock.advance(200,[1+1e-8],false),false);
  clock.wake(10000);assert.equal(clock.advance(10001,[1],false),true);
  assert.equal(clock.advance(13000,[1,2],false),true);
});
test('the first demand frame excludes idle wall-clock time from interpolation',()=>{
  assert.equal(activeFrameDelta(45,true),1/60);
  assert.equal(activeFrameDelta(1/50,true),1/50);
  assert.equal(activeFrameDelta(.5,false),.5);
});
