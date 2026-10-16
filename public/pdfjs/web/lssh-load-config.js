// Configure this viewer before initialize() resumes from saved preferences.
// Keep PDF.js itself and its history/prefs intact; do not enable debug URL flags.
(() => {
  const targets = new Set([document]);
  try { targets.add(parent.document); } catch { /* Cross-origin standalone host. */ }
  const configure = (event) => {
    if (event.detail?.source !== window) return;
    for (const target of targets) target.removeEventListener('webviewerloaded', configure);
    const app = window.PDFViewerApplication;
    const options = window.PDFViewerApplicationOptions;
    void app.preferences.initializedPromise.then(() => {
      const bytes = Number(window.frameElement?.dataset.bytes ?? 0);
      options.setAll({
        workerSrc: '../build/pdf.worker.min.mjs',
        sandboxBundleSrc: '../build/pdf.sandbox.min.mjs',
        // Small PDFs benefit from a single stream. Large PDFs load on demand.
        disableAutoFetch: !bytes || bytes >= 4 * 1024 * 1024,
        disableStream: !bytes || bytes >= 4 * 1024 * 1024,
        disableRange: false,
      });
    });
  };
  for (const target of targets) target.addEventListener('webviewerloaded', configure);
})();
