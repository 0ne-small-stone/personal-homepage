export interface PdfReadingPosition {
  page: number;
  x: number;
  y: number;
  scale: string;
  rotation: number;
  scrollMode: number;
  spreadMode: number;
}
export interface PdfReadingProgress extends PdfReadingPosition {
  version: 1;
  fingerprint: string;
  frameTop: number;
}
export function parsePdfReadingProgress(raw: string | null, fingerprint: string, pages: number): PdfReadingProgress | undefined {
  try {
    const value = JSON.parse(raw || 'null');
    if (!value || value.version !== 1 || value.fingerprint !== fingerprint || !Number.isInteger(value.page) || value.page < 1 || value.page > pages ||
      ![value.x, value.y, value.frameTop].every((number) => Number.isFinite(number) && Math.abs(number) <= 1_000_000) ||
      typeof value.scale !== 'string' || !(['auto', 'page-fit', 'page-width', 'page-actual'].includes(value.scale) || (/^\d+(\.\d+)?$/.test(value.scale) && +value.scale > 0 && +value.scale <= 100)) ||
      ![0, 90, 180, 270].includes(value.rotation) || ![0, 1, 2, 3].includes(value.scrollMode) || ![0, 1, 2].includes(value.spreadMode)) return;
    return value;
  } catch { return; }
}
