// Fixed native viewer entry adapter; native PDF.js owns UI, rendering and document state.
(() => {
    const targets = new Set([document]);
    try {
        targets.add(parent.document);
    }
    catch { }
    const configure = event => {
        if (event.detail?.source !== window)
            return;
        for (const target of targets)
            target.removeEventListener('webviewerloaded', configure);
        const app = window.PDFViewerApplication, options = window.PDFViewerApplicationOptions;
        const params = new URLSearchParams(window.location?.search || ''), bytes = Number(window.frameElement?.dataset.bytes ?? params.get('bytes') ?? 0);
        const sha256 = window.frameElement?.dataset.sha256 ?? params.get('integrity'), onDemand = !bytes || bytes >= 4 * 1024 * 1024;
        const lib = window.pdfjsLib;
        let worker, activeRange, sequence = 0;
        const supportsFast = bytes >= 4 * 1024 * 1024 && /^[a-f0-9]{64}$/.test(sha256 || '') && !!lib?.PDFDataRangeTransport && !!window.crypto?.subtle;
        const lifetime = supportsFast ? new AbortController() : null;
        const rangeModule = supportsFast ? import('./lssh-range.mjs?v=1').catch(() => null) : Promise.resolve(null);
        const file = params.get('file');
        let initialOffer;
        function reportFailure(error) {
            const closing = app.close?.();
            Promise.resolve(closing).catch(() => { }).then(() => app.eventBus?.dispatch('documenterror', { source: app, error, message: 'PDF 分段未能载入，请重试。' }));
        }
        async function prepare(url) {
            const module = await rangeModule;
            if (!module || lifetime?.signal.aborted)
                return null;
            let absolute;
            try {
                absolute = new URL(url, window.location.href).href;
            }
            catch {
                return null;
            }
            return module.prepareFastRange({ url: absolute, bytes, sha256, viewerOrigin: window.location.origin, lib, signal: lifetime.signal, onError: reportFailure });
        }
        if (supportsFast && file)
            initialOffer = prepare(file);
        if (lib?.PDFWorker) {
            try {
                lib.GlobalWorkerOptions.workerSrc = '../build/pdf.worker.min.mjs';
                worker = lib.PDFWorker.create({ name: 'lssh-reader' });
                const preparing = worker;
                preparing.promise.catch(() => { if (!preparing.destroyed)
                    preparing.destroy(); if (worker === preparing)
                    worker = undefined; });
            }
            catch {
                worker = undefined;
            }
        }
        const open = app.open;
        if (typeof open === 'function')
            app.open = async function (args) {
                const current = ++sequence;
                activeRange?.abort();
                activeRange = null;
                const offered = initialOffer;
                initialOffer = null;
                const range = supportsFast && args.url ? (args.url === file && offered ? await offered : await prepare(args.url)) : null;
                if (current !== sequence || lifetime?.signal.aborted) {
                    range?.abort();
                    return;
                }
                activeRange = range;
                if (document.documentElement)
                    document.documentElement.dataset.pdfFast = range ? 'active' : 'native';
                try {
                    return await open.call(this, { ...args, ...(worker && !worker.destroyed ? { worker } : {}), ...(range ? { range } : {}) });
                }
                catch (error) {
                    // Native startup calls open without awaiting it; surface its failure through the existing retry UI.
                    if (current === sequence && !lifetime?.signal.aborted)
                        app.eventBus?.dispatch('documenterror', { source: app, error, message: 'PDF 未能载入，请重试。' });
                }
            };
        window.addEventListener?.('pagehide', event => {
            if (event.persisted)
                return;
            sequence++;
            // Mark document tasks closed before terminating the externally owned native worker.
            let closing;
            try {
                closing = app.close?.();
            }
            catch { }
            lifetime?.abort();
            activeRange?.abort();
            activeRange = null;
            const destroy = () => { if (worker && !worker.destroyed)
                worker.destroy(); worker = undefined; };
            if (closing?.then)
                closing.catch(() => { }).then(destroy);
            else
                destroy();
        });
        void app.preferences.initializedPromise.then(() => options.setAll({
            workerSrc: '../build/pdf.worker.min.mjs', sandboxBundleSrc: '../build/pdf.sandbox.min.mjs',
            disableAutoFetch: onDemand, disableStream: onDemand, disableRange: false,
        }));
    };
    for (const target of targets)
        target.addEventListener('webviewerloaded', configure);
})();
