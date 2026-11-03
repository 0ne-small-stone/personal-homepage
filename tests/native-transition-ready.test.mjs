import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeTransitionCancelled,observeNativeReady} from '../src/lib/native-transition-ready.mjs';

test('only native skip and the specific viewport cancellation are expected',()=>{
  assert(nativeTransitionCancelled(new DOMException('Transition was skipped','AbortError')));
  assert(nativeTransitionCancelled(new DOMException('Viewport size changed','InvalidStateError')));
  assert(nativeTransitionCancelled(new DOMException('Viewport size changed.','InvalidStateError')));
  assert(nativeTransitionCancelled(new DOMException('Transition was aborted because of invalid state. Viewport size changed','InvalidStateError')));
  for(const error of [new Error('Viewport size changed'),new DOMException('Duplicate view-transition-name','InvalidStateError'),new DOMException('Viewport size changed and update callback failed','InvalidStateError'),new TypeError('update failed'),null])assert(!nativeTransitionCancelled(error));
});
test('ready cancellation is observed without swallowing unrelated errors or owning navigation',async()=>{
  const cancelled=[],unexpected=[];
  for(const error of [new DOMException('Transition was skipped','AbortError'),new DOMException('Viewport size changed','InvalidStateError'),new Error('swap failed')]){
    observeNativeReady({ready:Promise.reject(error)},{cancelled:e=>cancelled.push(e),unexpected:e=>unexpected.push(e)});
  }
  await Promise.resolve();assert.equal(cancelled.length,2);assert.equal(unexpected.length,1);assert.equal(unexpected[0].message,'swap failed');
});
