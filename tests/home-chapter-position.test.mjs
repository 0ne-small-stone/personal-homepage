import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterPosition } from '../src/components/home/chapter-position.mjs';

test('chapter poses and the intro/outro endpoints remain exact', () => {
  for (const count of [1,3,5]) {
    for (let i=0;i<=count+1;i++) assert.equal(chapterPosition(i/(count+1),count),i);
    assert.equal(chapterPosition(-.1,count),0);
    assert.equal(chapterPosition(1.1,count),count+1);
  }
});
test('no target teleport at former half chapters, in either direction', () => {
  for (let i=0;i<4;i++) {
    const mid=(i+.5)/4,epsilon=1e-8;
    const left=chapterPosition(mid-epsilon,3),right=chapterPosition(mid+epsilon,3);
    assert(Math.abs(right-left)<2e-7);
    assert(Math.abs((left+right)/2-(i+.5))<1e-12);
  }
});
test('forward and reverse movement are monotonic with a bounded target speed', () => {
  let previous=chapterPosition(0,3);
  for(let i=1;i<=10000;i++) {
    const value=chapterPosition(i/10000,3),step=value-previous;
    assert(step>=0 && step<=1.3*4/10000+1e-12);
    assert.equal(chapterPosition(i/10000,3),value);
    previous=value;
  }
});
test('chapter boundary velocity is continuous and retains a quiet dwell', () => {
  const h=1e-6;
  for(let i=1;i<4;i++) {
    const p=i/4,c=chapterPosition(p,3);
    const left=(c-chapterPosition(p-h,3))/h,right=(chapterPosition(p+h,3)-c)/h;
    assert(Math.abs(left-right)<1e-6);
    assert(Math.abs(left-1.6)<.0001);
  }
});
