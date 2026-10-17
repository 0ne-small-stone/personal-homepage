// Optional same-origin accelerant around native PDFDataRangeTransport.
// Parsing, rendering, history, search and controls remain entirely in PDF.js.
const CHUNK = 65536;
export async function prepareFastRange({ url, bytes, sha256, viewerOrigin, lib, signal, onError, fetchImpl = globalThis.fetch, cryptoImpl = globalThis.crypto }) {
    if (!Number.isSafeInteger(bytes) || bytes < 4 * 1024 * 1024 || !/^[a-f0-9]{64}$/.test(sha256 || '') || !lib?.PDFDataRangeTransport || !cryptoImpl?.subtle)
        return null;
    let file;
    try {
        file = new URL(url);
    }
    catch {
        return null;
    }
    const match = file.pathname.match(/\/materials\/(source-[a-z0-9-]+)\.pdf$/);
    if (!match || file.origin !== viewerOrigin || file.search || file.username || file.password)
        return null;
    const controller = new AbortController(), externalAbort = () => abort(signal?.reason);
    if (signal?.aborted)
        return null;
    signal?.addEventListener('abort', externalAbort, { once: true });
    const cache = new Map(), pending = new Map(), queue = [];
    let running = 0;
    const abort = reason => { if (!controller.signal.aborted)
        controller.abort(reason); signal?.removeEventListener('abort', externalAbort); cache.clear(); for (const item of queue.splice(0))
        item.reject(controller.signal.reason); };
    const base = new URL('fast/' + match[1] + '/' + sha256.slice(0, 16) + '/', new URL('./', file));
    async function readLimited(response, limit) {
        const reader = response.body.getReader(), chunks = [];
        let total = 0;
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                total += value.byteLength;
                if (total > limit)
                    throw Error('Unexpected PDF response size');
                chunks.push(value);
            }
        }
        catch (error) {
            await reader.cancel().catch(() => { });
            throw error;
        }
        const result = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }
    async function request(target, { headers, limit, timeout = 3000, validate }) {
        const requestController = new AbortController(), cancel = () => requestController.abort(controller.signal.reason);
        if (controller.signal.aborted)
            throw controller.signal.reason;
        controller.signal.addEventListener('abort', cancel, { once: true });
        const timer = timeout ? setTimeout(() => requestController.abort(), timeout) : null;
        try {
            const response = await fetchImpl(String(target), { headers, signal: requestController.signal, credentials: 'same-origin' });
            if (!validate(response)) {
                await response.body?.cancel();
                throw Error('Unexpected PDF transport response');
            }
            return await readLimited(response, limit);
        }
        finally {
            if (timer)
                clearTimeout(timer);
            controller.signal.removeEventListener('abort', cancel);
        }
    }
    function pump() { while (running < 4 && queue.length && !controller.signal.aborted) {
        const item = queue.shift();
        running++;
        Promise.resolve().then(item.work).then(item.resolve, item.reject).finally(() => { running--; pump(); });
    } }
    const schedule = work => new Promise((resolve, reject) => { if (controller.signal.aborted)
        return reject(controller.signal.reason); queue.push({ work, resolve, reject }); pump(); });
    const checksum = async (data) => [...new Uint8Array(await cryptoImpl.subtle.digest('SHA-256', data))].map(x => x.toString(16).padStart(2, '0')).join('');
    let metadata, parts, initial;
    async function original(begin, end) {
        const data = await request(file, { headers: { Range: 'bytes=' + begin + '-' + (end - 1) }, limit: end - begin, timeout: 0, validate: response => {
                const range = response.headers.get('content-range')?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
                return response.status === 206 && range && Number(range[1]) === begin && Number(range[2]) === end - 1 && Number(range[3]) === bytes;
            } });
        if (data.length !== end - begin)
            throw Error('Truncated original PDF range');
        return data;
    }
    async function mirror(index) {
        const part = parts.get(index);
        if (!part)
            throw Error('Not a mirrored PDF range');
        const data = await request(new URL(index + '.bin', base), { limit: CHUNK, validate: response => response.status === 200 });
        if (data.length !== part.bytes || await checksum(data) !== part.sha256)
            throw Error('Fast PDF checksum mismatch');
        return data;
    }
    try {
        const encoded = await request(new URL('index.json', base), { limit: 65536, timeout: 2000, validate: response => response.status === 200 });
        metadata = JSON.parse(new TextDecoder().decode(encoded));
        if (metadata.schemaVersion !== 1 || metadata.sha256 !== sha256 || metadata.bytes !== bytes || metadata.chunkSize !== CHUNK || metadata.source !== 'materials/' + match[1] + '.pdf' || !Array.isArray(metadata.parts) || metadata.parts.length > 512)
            throw Error('Invalid fast PDF descriptor');
        parts = new Map();
        for (const part of metadata.parts) {
            if (!Number.isSafeInteger(part.index) || part.index < 0 || part.index * CHUNK >= bytes || part.bytes !== Math.min(CHUNK, bytes - part.index * CHUNK) || !/^[a-f0-9]{64}$/.test(part.sha256) || parts.has(part.index))
                throw Error('Invalid fast PDF part');
            parts.set(part.index, part);
        }
        initial = await mirror(0);
        cache.set(0, initial);
    }
    catch {
        abort();
        return null;
    }
    function chunk(index) {
        if (cache.has(index)) {
            const value = cache.get(index);
            cache.delete(index);
            cache.set(index, value);
            return Promise.resolve(value);
        }
        if (pending.has(index))
            return pending.get(index);
        const work = schedule(async () => {
            let data;
            if (parts.has(index)) {
                try {
                    data = await mirror(index);
                }
                catch (error) {
                    if (controller.signal.aborted)
                        throw error;
                    data = await original(index * CHUNK, Math.min(bytes, (index + 1) * CHUNK));
                }
            }
            else
                data = await original(index * CHUNK, Math.min(bytes, (index + 1) * CHUNK));
            if (controller.signal.aborted)
                throw controller.signal.reason;
            cache.set(index, data);
            while (cache.size > 64)
                cache.delete(cache.keys().next().value);
            return data;
        }).finally(() => pending.delete(index));
        pending.set(index, work);
        return work;
    }
    async function read(begin, end) {
        if (!Number.isSafeInteger(begin) || !Number.isSafeInteger(end) || begin < 0 || end <= begin || end > bytes)
            throw Error('Invalid requested PDF range');
        if (end - begin > 1024 * 1024) {
            // A full download remains one original request; profiled first-render spans use mirrors.
            for (let index = Math.floor(begin / CHUNK); index < Math.ceil(end / CHUNK); index++)
                if (!parts.has(index))
                    return original(begin, end);
        }
        const first = Math.floor(begin / CHUNK), last = Math.ceil(end / CHUNK), values = await Promise.all(Array.from({ length: last - first }, (_, i) => chunk(first + i)));
        const data = new Uint8Array(end - begin);
        for (let index = first; index < last; index++) {
            const part = values[index - first], start = Math.max(begin, index * CHUNK), stop = Math.min(end, index * CHUNK + part.length);
            data.set(part.subarray(start - index * CHUNK, stop - index * CHUNK), start - begin);
        }
        return data;
    }
    class FastRange extends lib.PDFDataRangeTransport {
        constructor() { super(bytes, initial.slice(), true, match[1] + '.pdf'); }
        requestDataRange(begin, end) { return read(begin, end).then(data => { if (!controller.signal.aborted)
            this.onDataRange(begin, data); }).catch(error => { if (!controller.signal.aborted) {
            abort();
            onError?.(error);
        } }); }
        abort() { abort(); }
    }
    return new FastRange();
}
