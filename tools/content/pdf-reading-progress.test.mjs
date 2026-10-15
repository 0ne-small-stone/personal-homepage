import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePdfReadingProgress } from '../../src/lib/pdf-reading-progress-state.ts';
const progress = { version: 1, fingerprint: 'sample', page: 8, x: -20.25, y: 455.5, scale: '1.5', rotation: 90, scrollMode: 0, spreadMode: 0, frameTop: 112 };
test('PDF progress preserves page coordinates, zoom and rotation without quantizing the reading point', () => {
  assert.deepEqual(parsePdfReadingProgress(JSON.stringify(progress), 'sample', 20), progress);
  for (const scale of ['auto', 'page-width', 'page-fit', 'page-actual', '0.25', '4']) assert.equal(parsePdfReadingProgress(JSON.stringify({ ...progress, scale }), 'sample', 20)?.scale, scale);
});
test('changed PDFs, invalid pages, malformed data and unsafe numeric values cannot restore stale positions', () => {
  assert.equal(parsePdfReadingProgress(JSON.stringify(progress), 'changed', 20), undefined);
  assert.equal(parsePdfReadingProgress(JSON.stringify(progress), 'sample', 4), undefined);
  for (const value of [null, '{', '[]', ...[{page:0},{page:1.2},{scale:'javascript:1'},{scale:'0'},{rotation:45},{x:'3'},{y:1e9},{frameTop:null},{scrollMode:9},{spreadMode:-1}].map(change=>JSON.stringify({...progress,...change}))]) assert.equal(parsePdfReadingProgress(value, 'sample', 20), undefined);
});
