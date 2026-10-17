import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateManifest, digestFile } from './prepare-public-materials.mjs';
export const FAST_CHUNK_SIZE = 65536;
export async function prepareFastPdfs(root, assets, { check = false, profiles = [] } = {}) {
    let files = 0, bytes = 0, documents = 0;
    const staging = path.join(root, '.ci-tmp/pdf-fast-staging');
    if (!check)
        await fs.mkdir(staging, { recursive: true });
    async function put(file, data) {
        if (check) {
            if (!(await fs.readFile(file)).equals(data))
                throw Error('Changed fast PDF asset: ' + file);
            return;
        }
        try {
            if ((await fs.readFile(file)).equals(data))
                return;
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
        }
        const temp = path.join(staging, randomUUID() + '.part');
        try {
            await fs.writeFile(temp, data, { flag: 'wx' });
            await fs.rename(temp, file);
        }
        finally {
            await fs.unlink(temp).catch(error => { if (error.code !== 'ENOENT')
                throw error; });
        }
    }
    for (const asset of assets) {
        if (asset.bytes < 4 * 1024 * 1024)
            continue;
        if (!/^source-[a-z0-9-]+$/.test(asset.sourceId) || asset.file !== 'materials/' + asset.sourceId + '.pdf')
            throw Error('Unexpected fast PDF source');
        const original = path.join(root, 'public', asset.file), identity = await digestFile(original);
        if (identity.bytes !== asset.bytes || identity.sha256 !== asset.sha256)
            throw Error('Fast PDF original checksum mismatch');
        const out = path.join(root, 'public/materials/fast', asset.sourceId, asset.sha256.slice(0, 16));
        if (!check)
            await fs.mkdir(out, { recursive: true });
        const chunk = FAST_CHUNK_SIZE, total = Math.ceil(asset.bytes / chunk), indices = new Set();
        for (let index = 0; index < Math.min(total, 32); index++)
            indices.add(index);
        for (let index = Math.max(0, Math.floor((asset.bytes - 4 * chunk) / chunk)); index < total; index++)
            indices.add(index);
        const profile = profiles.find(item => item.sourceId === asset.sourceId);
        if (profile) {
            if (profile.sha256 !== asset.sha256 || !Array.isArray(profile.chunkRanges))
                throw Error('Stale first-page PDF profile');
            for (const range of profile.chunkRanges) {
                if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isSafeInteger) || range[0] < 0 || range[1] < range[0] || range[1] >= total)
                    throw Error('Invalid first-page PDF range');
                for (let index = range[0]; index <= range[1]; index++)
                    indices.add(index);
            }
        }
        if (indices.size > 512)
            throw Error('First-page PDF mirror budget exceeded');
        const source = await fs.open(original, 'r'), parts = [];
        try {
            for (const index of [...indices].sort((a, b) => a - b)) {
                const length = Math.min(chunk, asset.bytes - index * chunk), data = Buffer.alloc(length), read = await source.read(data, 0, length, index * chunk);
                if (read.bytesRead !== length)
                    throw Error('Truncated fast PDF source');
                const sha256 = createHash('sha256').update(data).digest('hex');
                await put(path.join(out, index + '.bin'), data);
                parts.push({ index, bytes: length, sha256 });
                files++;
                bytes += length;
            }
        }
        finally {
            await source.close();
        }
        const metadata = Buffer.from(JSON.stringify({ schemaVersion: 1, source: asset.file, sha256: asset.sha256, bytes: asset.bytes, chunkSize: chunk, parts }) + '\n');
        await put(path.join(out, 'index.json'), metadata);
        files++;
        bytes += metadata.length;
        documents++;
    }
    return { documents, files, bytes, chunkSize: FAST_CHUNK_SIZE, originals: 'Unchanged; bounded first-render mirrors, full files retained' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const root = fileURLToPath(new URL('../../', import.meta.url)), manifest = JSON.parse(await fs.readFile(path.join(root, 'docs/technical/content/public-learning-materials.json'), 'utf8'));
    const profile = JSON.parse(await fs.readFile(path.join(root, 'docs/technical/content/pdf-first-page-ranges.json'), 'utf8'));
    if (profile.schemaVersion !== 1 || profile.chunkSize !== FAST_CHUNK_SIZE || !Array.isArray(profile.profiles) || new Set(profile.profiles.map(item => item.sourceId)).size !== profile.profiles.length)
        throw Error('Invalid first-page PDF profiles');
    console.log(JSON.stringify(await prepareFastPdfs(root, validateManifest(manifest), { check: process.argv.includes('--check'), profiles: profile.profiles })));
}
