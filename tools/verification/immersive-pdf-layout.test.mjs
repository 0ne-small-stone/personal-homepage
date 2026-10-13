import test from 'node:test';
import assert from 'node:assert/strict';
import { comfortablePdfLayout } from '../../src/lib/immersivePdfLayout.ts';

const paper = { pageWidth: 560, pageHeight: 792, pages: 4 };
test('ultrawide screens choose readable two-page rows rather than four thumbnails', () => {
  const layout = comfortablePdfLayout({ ...paper, width: 3440, height: 1440 });
  assert.equal(layout.columns, 2);
  assert(layout.scale * paper.pageWidth >= 600);
  assert(layout.rowWidth < 3440);
  assert(layout.scale * paper.pageHeight + 32 <= 1440);
});
test('short desktop screens keep readable paper width even when vertical scrolling is needed', () => {
  const layout = comfortablePdfLayout({ ...paper, width: 1280, height: 720 });
  assert.equal(layout.columns, 2);
  assert(layout.scale * paper.pageWidth >= 599);
  assert(layout.scale * paper.pageHeight > 720);
});
test('portrait viewports and landscape paper use one column', () => {
  assert.equal(comfortablePdfLayout({ ...paper, width: 1280, height: 1600 }).columns, 1);
  assert.equal(comfortablePdfLayout({ ...paper, width: 1920, height: 1080, pageWidth: 792, pageHeight: 560 }).columns, 1);
  assert.equal(comfortablePdfLayout({ ...paper, width: 1920, height: 1080, pages: 1 }).columns, 1);
});
test('phone widths fit the paper without horizontal overflow', () => {
  for (const width of [320, 390, 430, 767]) {
    const layout = comfortablePdfLayout({ ...paper, width, height: 844 });
    assert.equal(layout.columns, 1);
    assert(layout.scale * paper.pageWidth + 36 <= width);
    assert(layout.rowWidth <= width);
  }
});
test('invalid document or viewport dimensions do not produce an infinite scale', () => {
  for (const value of [0, -1, NaN, Infinity]) {
    assert.equal(comfortablePdfLayout({ ...paper, width: value, height: 720 }), undefined);
    assert.equal(comfortablePdfLayout({ ...paper, width: 1280, height: 720, pageHeight: value }), undefined);
  }
});
test('screen and paper matrix stays finite and inside the viewport', () => {
  for (const width of [320, 390, 768, 1024, 1279, 1280, 1920, 3440]) {
    for (const height of [390, 720, 1080, 1440, 1920]) {
      for (const dimensions of [[560, 792], [792, 560], [600, 600]]) {
        const layout = comfortablePdfLayout({ width, height, pageWidth: dimensions[0], pageHeight: dimensions[1], pages: 4 });
        assert(Number.isFinite(layout.scale));
        assert(layout.scale > 0);
        assert(layout.rowWidth <= width);
        assert(layout.columns === 1 || layout.columns === 2);
      }
    }
  }
});
