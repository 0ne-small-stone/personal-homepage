export interface PdfPaperSize { width: number; height: number; }
interface ModeInput { width: number; height: number; sizes: PdfPaperSize[]; columns: number; }

export function automaticPdfColumns(width: number, height: number, paper: PdfPaperSize, pages: number) {
  return pages > 1 && width >= 1280 && width >= height && paper.width < paper.height ? 2 : 1;
}

export function pdfModeGroup(page: number, pages: number, columns: number) {
  const count = Math.max(1, Math.min(columns, pages));
  const current = Math.max(1, Math.min(page, pages));
  const start = Math.floor((current - 1) / count) * count + 1;
  return Array.from({ length: Math.min(count, pages - start + 1) }, (_, index) => start + index);
}

export function pdfModeGeometry(input: ModeInput & { scale: number }) {
  const { width, height, sizes, columns, scale } = input;
  if (![width, height, scale].every((value) => Number.isFinite(value) && value > 0)
    || !Number.isInteger(columns) || columns < 1 || columns > 5 || !sizes.length
    || sizes.some((paper) => ![paper.width, paper.height].every((value) => Number.isFinite(value) && value > 0))) return undefined;
  const paperWidth = Math.max(...sizes.map((paper) => paper.width));
  const paperHeight = Math.max(...sizes.map((paper) => paper.height));
  // Native page borders (at most 18px), plus two 8px margins.
  const cellWidth = Math.ceil(paperWidth * scale + 34);
  return { columns, cellWidth, rowWidth: cellWidth * columns, slotHeight: height,
    fits: cellWidth * columns <= width && paperHeight * scale + 34 <= height };
}

export function fitPdfMode(input: ModeInput) {
  const { width, height, sizes, columns } = input;
  if (!pdfModeGeometry({ ...input, scale: 1 })) return undefined;
  const availableWidth = width - 16 - columns * 34;
  const availableHeight = height - 48;
  if (availableWidth <= 0 || availableHeight <= 0) return undefined;
  const scale = Math.floor((Math.min(10,
    availableWidth / columns / Math.max(...sizes.map((paper) => paper.width)),
    availableHeight / Math.max(...sizes.map((paper) => paper.height))) - 1e-8) * 10000) / 10000;
  const geometry = pdfModeGeometry({ ...input, scale });
  return geometry ? { ...geometry, scale } : undefined;
}

// Free flow follows the user's scale, without snapping back to a fitted mode.
export function adaptivePdfGeometry(input: { width: number; height: number; sizes: PdfPaperSize[]; scale: number; pages: number }) {
  const { width, height, sizes, scale, pages } = input;
  if (![width, height, scale, pages].every(value => Number.isFinite(value) && value > 0)
    || !Number.isInteger(pages) || !sizes.length
    || sizes.some(paper => ![paper.width, paper.height].every(value => Number.isFinite(value) && value > 0))) return undefined;
  const cellWidth = Math.ceil(Math.max(...sizes.map(paper => paper.width)) * scale + 34);
  const columns = Math.min(pages, Math.max(1, Math.floor((width - 16) / cellWidth)));
  return { columns, cellWidth, rowWidth: columns * cellWidth,
    slotHeight: Math.ceil(Math.max(...sizes.map(paper => paper.height)) * scale + 34), fits: false };
}
