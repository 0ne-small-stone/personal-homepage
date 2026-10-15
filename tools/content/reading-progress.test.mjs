import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReadingProgress, readingBlockIndex, readingSignature, shouldResumeReading } from '../../src/lib/reading-progress-state.ts';

const progress = { version: 1, block: 3, signature: readingSignature('Reading paragraph'), fraction: .4, gap: 0, ratio: .6, start: false, heading: 'chapter' };
test('valid progress round-trips and malformed or out-of-range storage is ignored', () => {
  assert.deepEqual(parseReadingProgress(JSON.stringify(progress)), progress);
  for (const value of [null, '{', '[]', JSON.stringify({ ...progress, block: -1 }), JSON.stringify({ ...progress, ratio: 2 }), JSON.stringify({ ...progress, fraction: '0.4' }), JSON.stringify({ ...progress, signature: '<script>' })]) assert.equal(parseReadingProgress(value), undefined);
});
test('default and generic top entries resume, explicit chapters and native history retain their targets', () => {
  assert.equal(shouldResumeReading(''), true);
  assert.equal(shouldResumeReading('#_top'), true);
  assert.equal(shouldResumeReading('#%5Ftop'), true);
  assert.equal(shouldResumeReading('#chapter'), false);
  assert.equal(shouldResumeReading('#%invalid'), false);
  assert.equal(shouldResumeReading('', 'traverse'), false);
  assert.equal(shouldResumeReading('', undefined, true), false);
});
test('paragraph identity survives inserted blocks and repeated text uses the nearest match', () => {
  assert.equal(readingSignature('same\n paragraph'), readingSignature('same paragraph'));
  const other = readingSignature('other');
  assert.equal(readingBlockIndex([other, other, other, progress.signature], progress), 3);
  assert.equal(readingBlockIndex([other, other, other, other, progress.signature], progress), 4);
  assert.equal(readingBlockIndex([progress.signature, other, progress.signature, other], progress), 2);
  assert.equal(readingBlockIndex([other], progress), undefined);
});
