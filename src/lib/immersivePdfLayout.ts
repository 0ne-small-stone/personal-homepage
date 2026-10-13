interface LayoutInput {
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
  pages: number;
}

// PDF.js dimensions at scale 1, with native page borders and 16px page gaps.
export function comfortablePdfLayout(input: LayoutInput) {
  const { width, height, pageWidth, pageHeight, pages } = input;
  if (![width, height, pageWidth, pageHeight, pages].every((value) => Number.isFinite(value) && value > 0)) return undefined;
  const columns = pages > 1 && width >= 1280 && width >= height && pageWidth < pageHeight ? 2 : 1;
  const pageSpace = 32;
  const rowSpace = 4 * columns;
  const columnWidth = Math.max(1, (width - rowSpace) / columns - pageSpace);
  const fitWidth = columnWidth / pageWidth;
  const fitHeight = Math.max(1, height - pageSpace) / pageHeight;
  const readable = Math.min(600, columnWidth) / pageWidth;
  const scale = Math.max(0.1, Math.min(10, width < 768 ? fitWidth : Math.min(fitWidth, Math.max(fitHeight, readable))));
  const roundedScale = Math.floor(scale * 1000) / 1000;
  return {
    columns,
    scale: roundedScale,
    rowWidth: Math.min(width, Math.ceil(columns * (pageWidth * roundedScale + pageSpace) + rowSpace)),
  };
}
