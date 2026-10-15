import { parsePdfReadingProgress, type PdfReadingPosition, type PdfReadingProgress } from './pdf-reading-progress-state';

interface PdfViewer {
  currentPageNumber: number;
  currentScaleValue: string;
  pagesRotation: number;
  scrollMode: number;
  spreadMode: number;
  pagesPromise: Promise<unknown>;
  getPageView(index: number): { div: HTMLElement; viewport: { convertToPdfPoint(x: number, y: number): number[] } } | undefined;
  scrollPageIntoView(options: { pageNumber: number; destArray: unknown[]; ignoreDestinationZoom: boolean; allowNegativeOffset: boolean }): void;
  update(): void;
}
interface PdfApplication {
  isInitialViewSet: boolean;
  pdfDocument?: { fingerprints: string[]; numPages: number };
  pdfViewer: PdfViewer;
  eventBus: { on(name: string, listener: () => void): void; off(name: string, listener: () => void): void };
}
interface ReadingMode extends HTMLElement { pdfReadingPosition?(): PdfReadingPosition | undefined; }

// Keep lifecycle persistence outside PDF.js; native rendering and XYZ destinations stay intact.
export function attachPdfReadingProgress(reader: HTMLElement, frame: HTMLIFrameElement): () => void {
  const app = (frame.contentWindow as Window & { PDFViewerApplication?: PdfApplication })?.PDFViewerApplication;
  const frameDoc = frame.contentDocument;
  const container = frameDoc?.getElementById('viewerContainer');
  const resource = reader.dataset.resource;
  if (!app || !frameDoc || !container || !resource) return () => {};
  const controller = new AbortController(), { signal } = controller;
  const key = `lssh:pdf-reading-progress:v1:${resource}`;
  let ready = false, paused = false, interacted = false, initialized = false;
  let progress: PdfReadingProgress | undefined;
  let normalFrameTop = frame.getBoundingClientRect().top;
  const snapshot = (): PdfReadingProgress | undefined => {
    const pdf = app.pdfDocument, viewer = app.pdfViewer;
    if (!pdf || !ready || paused) return;
    let position = document.querySelector<ReadingMode>('learning-reading-mode')?.pdfReadingPosition?.();
    if (!position) {
      const page = viewer.getPageView(viewer.currentPageNumber - 1);
      if (!page) return;
      const paper = page.div.getBoundingClientRect(), area = container.getBoundingClientRect();
      const [x, y] = page.viewport.convertToPdfPoint(area.left - paper.left - page.div.clientLeft, area.top - paper.top - page.div.clientTop);
      position = { page: viewer.currentPageNumber, x, y, scale: String(viewer.currentScaleValue), rotation: viewer.pagesRotation, scrollMode: viewer.scrollMode, spreadMode: viewer.spreadMode };
    }
    if (!document.documentElement.hasAttribute('data-reading-immersive')) normalFrameTop = frame.getBoundingClientRect().top;
    return { ...position, version: 1, fingerprint: pdf.fingerprints[0], frameTop: normalFrameTop };
  };
  const save = () => {
    const value = snapshot();
    if (value) try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Reading does not depend on storage. */ }
  };
  const restore = () => {
    if (!progress || signal.aborted || interacted || paused || !reader.isConnected) return;
    const viewer = app.pdfViewer;
    viewer.pagesRotation = progress.rotation;
    viewer.spreadMode = progress.spreadMode;
    viewer.scrollMode = progress.scrollMode;
    viewer.currentScaleValue = progress.scale;
    viewer.scrollPageIntoView({ pageNumber: progress.page, destArray: [null, { name: 'XYZ' }, progress.x, progress.y, null], ignoreDestinationZoom: true, allowNegativeOffset: true });
    viewer.update();
    window.scrollBy({ top: frame.getBoundingClientRect().top - progress.frameTop, behavior: 'instant' });
  };
  const initialize = () => {
    if (initialized || !app.pdfDocument) return;
    initialized = true;
    // A deliberate PDF destination takes precedence over the local bookmark.
    if (!frame.contentWindow?.location.hash) {
      try { progress = parsePdfReadingProgress(localStorage.getItem(key), app.pdfDocument.fingerprints[0], app.pdfDocument.numPages); } catch { /* Optional storage. */ }
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (signal.aborted) return;
      restore(); ready = true;
    }));
    // Native initialization can refit mixed page sizes once all page metadata arrives.
    app.pdfViewer.pagesPromise.then(() => requestAnimationFrame(() => requestAnimationFrame(restore))).catch(() => {});
  };
  const pause = (event: Event) => {
    save(); paused = true;
    (event as Event & { signal?: AbortSignal }).signal?.addEventListener('abort', () => { paused = false; }, { once: true });
  };
  const interact = () => { interacted = true; };
  for (const doc of [document, frameDoc]) {
    for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) doc.addEventListener(event, interact, { signal, capture: true, passive: true });
    // Commit after native keyboard/drag navigation, even when a tab is closed immediately.
    for (const event of ['keyup', 'pointerup', 'touchend']) doc.addEventListener(event, save, { signal, passive: true });
  }
  document.addEventListener('astro:before-preparation', pause, { signal, capture: true });
  document.addEventListener('lssh:pdf-before-restore', save, { signal });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); }, { signal, capture: true });
  window.addEventListener('pagehide', pause, { signal, capture: true });
  window.addEventListener('pageshow', () => { paused = false; }, { signal });
  window.addEventListener('scroll', save, { signal, passive: true });
  container.addEventListener('scroll', save, { signal, passive: true });
  app.eventBus.on('documentinit', initialize);
  app.eventBus.on('updateviewarea', save);
  if (app.isInitialViewSet) initialize();
  return () => {
    save(); controller.abort();
    app.eventBus.off('documentinit', initialize);
    app.eventBus.off('updateviewarea', save);
  };
}
