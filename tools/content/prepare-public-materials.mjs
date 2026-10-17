import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, readFileSync, lstatSync } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repository = '0ne-small-stone/personal-homepage';
export function validateManifest(manifest) {
  if (manifest.schemaVersion !== 1 || manifest.repository !== repository || !/^[a-z0-9-]+$/.test(manifest.releaseTag ?? '') || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Invalid public materials manifest.');
  const ids = new Set();
  for (const asset of manifest.files) {
    if (!/^source-[a-z0-9-]+$/.test(asset.sourceId ?? '') || ids.has(asset.sourceId)
      || asset.file !== `materials/${asset.sourceId}.pdf` || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0
      || !/^[a-f0-9]{64}$/.test(asset.sha256 ?? '')
      || asset.url !== `https://github.com/${repository}/releases/download/${manifest.releaseTag}/${asset.sourceId}.pdf`) throw new Error('Unsafe, duplicate or incomplete public material.');
    ids.add(asset.sourceId);
  }
  if (manifest.files.reduce((sum, asset) => sum + asset.bytes, 0) > 900 * 1024 * 1024) throw new Error('Public materials exceed the site budget.');
  return manifest.files;
}

export async function digestFile(path) {
  const hash = createHash('sha256'); let bytes = 0;
  for await (const chunk of createReadStream(path)) { bytes += chunk.length; hash.update(chunk); }
  return { bytes, sha256: hash.digest('hex') };
}
const matches = (actual, asset) => actual.bytes === asset.bytes && actual.sha256 === asset.sha256;

export async function stageAsset(publicRoot, asset, { sourceFile, fetchImpl = fetch } = {}) {
  const target = resolve(publicRoot, asset.file);
  if (!target.startsWith(resolve(publicRoot, 'materials') + sep)) throw new Error('Material target escaped public/materials.');
  if (existsSync(target)) {
    if (lstatSync(target).isSymbolicLink()) throw new Error('Material target cannot be a symlink.');
    if (matches(await digestFile(target), asset)) return 'cached';
  }
  await mkdir(dirname(target), { recursive: true });
  // Never keep incomplete bytes below public/: Astro copies that directory verbatim.
  const staging=resolve(publicRoot,'../.ci-tmp/material-downloads');
  await mkdir(staging,{recursive:true});
  const temporary=join(staging,`${randomUUID()}.part`);
  let input;
  if (sourceFile) input = createReadStream(sourceFile);
  else {
    const response = await fetchImpl(asset.url, { signal: AbortSignal.timeout(300_000) });
    if (!response.ok || !response.body) throw new Error(`Material ${asset.sourceId}: HTTP ${response.status}`);
    input = Readable.fromWeb(response.body);
  }
  const hash = createHash('sha256'); let bytes = 0;
  const verify = new Transform({ transform(chunk, _encoding, callback) {
    bytes += chunk.length;
    if (bytes > asset.bytes) return callback(new Error(`Material size exceeded: ${asset.sourceId}`));
    hash.update(chunk); callback(null, chunk);
  } });
  try {
    await pipeline(input, verify, createWriteStream(temporary, { flags: 'wx' }));
    if (!matches({ bytes, sha256: hash.digest('hex') }, asset)) throw new Error(`Material checksum mismatch: ${asset.sourceId}`);
    await rename(temporary, target);
    return sourceFile ? 'staged' : 'downloaded';
  } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}

async function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const manifest = JSON.parse(readFileSync(join(root, 'docs/technical/content/public-learning-materials.json'), 'utf8'));
  const assets = validateManifest(manifest);
  const sourceArg = process.argv.indexOf('--source');
  if (sourceArg >= 0 && !process.argv[sourceArg + 1]) throw new Error('--source requires the original materials directory.');
  const sourceRoot = sourceArg >= 0 ? resolve(process.argv[sourceArg + 1]) : undefined;
  const local = new Map();
  if (sourceRoot) {
    const catalog = JSON.parse(readFileSync(join(root, 'docs/technical/content/learning-materials.json'), 'utf8'));
    for (const asset of assets) {
      const source = catalog.sources.find(source => source.id === asset.sourceId);
      if (!source || source.bytes !== asset.bytes || source.sha256 !== asset.sha256) throw new Error('Original catalog does not match the publishing manifest.');
      const path = resolve(sourceRoot, source.path);
      if (!path.startsWith(sourceRoot + sep) || !matches(await digestFile(path), asset)) throw new Error(`Original mismatch: ${asset.sourceId}`);
      local.set(asset.sourceId, path);
    }
  }
  let cursor = 0; const states = { cached: 0, staged: 0, downloaded: 0 };
  async function worker() {
    while (cursor < assets.length) {
      const asset = assets[cursor++]; let state;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try { state = await stageAsset(join(root, 'public'), asset, { sourceFile: local.get(asset.sourceId) }); break; }
        catch (error) { if (sourceRoot || attempt === 3) throw error; console.log(`Retry material ${asset.sourceId}: ${attempt}`); }
      }
      states[state] += 1;
      if (state !== 'cached') console.log(JSON.stringify({ sourceId: asset.sourceId, state, bytes: asset.bytes }));
    }
  }
  const workers = await Promise.allSettled(Array.from({ length: 3 }, worker));
  const failure = workers.find(result => result.status === 'rejected'); if (failure) throw failure.reason;
  console.log(JSON.stringify({ verifiedMaterials: assets.length, bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0), ...states }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
