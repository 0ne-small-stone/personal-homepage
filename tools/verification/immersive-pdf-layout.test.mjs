import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptivePdfGeometry, automaticPdfColumns, fitPdfMode, pdfModeGeometry, pdfModeGroup } from '../../src/lib/immersivePdfLayout.ts';
const portrait = { width: 560, height: 792 };
test('automatic choice applies only to entry, not to zoom', () => {
  assert.equal(automaticPdfColumns(3440, 1440, portrait, 4), 2);
  assert.equal(automaticPdfColumns(390, 844, portrait, 4), 1);
  assert.equal(automaticPdfColumns(1280, 1600, portrait, 4), 1);
  assert.equal(automaticPdfColumns(1920, 1080, { width: 792, height: 560 }, 4), 1);
});
test('short screens show complete pages instead of enforcing a minimum width', () => {
  const layout = fitPdfMode({ width: 1280, height: 720, sizes: [portrait, portrait], columns: 2 });
  assert(layout.fits);
  assert(layout.scale * portrait.height + 48 <= 720);
  assert(layout.rowWidth + 16 <= 1280);
});
test('zoom changes paper size but never changes selected column count', () => {
  for (const columns of [1, 2, 3, 4, 5]) {
    const input = { width: 1280, height: 720, sizes: [portrait], columns };
    const fitted = fitPdfMode(input);
    for (const factor of [0.5, 0.9, 1, 1.1, 3]) {
      const geometry = pdfModeGeometry({ ...input, scale: fitted.scale * factor });
      assert.equal(geometry.columns, columns);
      assert.equal(geometry.slotHeight, 720);
    }
  }
});
test('mixed paper sizes all fit, including landscape pages', () => {
  const sizes = [portrait, { width: 1120, height: 560 }];
  const layout = fitPdfMode({ width: 1920, height: 1080, sizes, columns: 2 });
  assert(layout.fits);
  for (const size of sizes) {
    assert(size.height * layout.scale + 48 <= 1080);
    assert(size.width * layout.scale + 34 <= layout.cellWidth);
  }
});
test('page groups preserve the current page and handle incomplete final groups', () => {
  assert.deepEqual(pdfModeGroup(3, 4, 2), [3, 4]);
  assert.deepEqual(pdfModeGroup(3, 4, 3), [1, 2, 3]);
  assert.deepEqual(pdfModeGroup(4, 4, 3), [4]);
  assert.deepEqual(pdfModeGroup(1, 1, 4), [1]);
});
test('screen, paper and mode matrix always fits every edge', () => {
  let combinations = 0;
  for (const width of [320, 390, 768, 1024, 1279, 1280, 1920, 3440]) {
    for (const height of [390, 720, 1080, 1440, 1920]) {
      for (const sizes of [[portrait], [{ width: 792, height: 560 }], [{ width: 600, height: 600 }]]) {
        for (const columns of [1, 2, 3, 4, 5]) {
          const layout = fitPdfMode({ width, height, sizes, columns });
          assert(layout && layout.fits);
          assert.equal(layout.columns, columns);
          assert(layout.rowWidth <= width);
          assert(sizes[0].height * layout.scale + 48 <= height);
          combinations++;
        }
      }
    }
  }
  assert.equal(combinations, 600);
});
test('invalid dimensions and modes do not generate a layout', () => {
  for (const width of [0, -1, NaN, Infinity]) assert.equal(fitPdfMode({ width, height: 720, sizes: [portrait], columns: 2 }), undefined);
  for (const columns of [0, 6, 1.5]) assert.equal(fitPdfMode({ width: 1280, height: 720, sizes: [portrait], columns }), undefined);
});

test('free flow responds to scale and available width with continuous rows', () => {
  const input = { width: 1920, height: 1080, sizes: [portrait], pages: 40 };
  const small = adaptivePdfGeometry({ ...input, scale: 0.4 });
  const large = adaptivePdfGeometry({ ...input, scale: 1.2 });
  assert(small.columns > 5);
  assert(small.columns > large.columns);
  assert(small.slotHeight < large.slotHeight);
  assert(small.rowWidth + 16 <= input.width);
  assert.equal(adaptivePdfGeometry({ ...input, scale: 0.4, width: 390 }).columns, 1);
  assert.equal(adaptivePdfGeometry({ ...input, scale: 0.1, pages: 2 }).columns, 2);
  assert.equal(adaptivePdfGeometry({ ...input, scale: NaN }), undefined);
});
