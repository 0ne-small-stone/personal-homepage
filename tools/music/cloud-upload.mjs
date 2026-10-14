import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { cloudBase, verifyRemoteFile } from './cloud-library.mjs';
import { loadUploadSecret } from './windows-secret.mjs';

export const uploadFolder = 'LSSH-AutoSync';
export async function fileHash(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

/** File Request is create-only. Its nickname isolates every upload below this folder. */
export async function createUploader(config, { request = fetch, secret } = {}) {
  const writeBase = cloudBase(secret ?? await loadUploadSecret());
  if (writeBase === config.base) throw new Error('上传入口不能是公开只读入口。');
  async function put(name, file, expected) {
    if (!/^(tracks|covers|catalogs)\/[a-zA-Z0-9.-]+$/.test(name)) throw new Error('上传路径超出音乐目录。');
    const before = await stat(file);
    if (!before.isFile() || before.size !== expected.size) throw new Error('待上传文件已变化。');
    const body = createReadStream(file);
    let response;
    try {
      response = await request(new URL(name, writeBase), {
        method: 'PUT', redirect: 'error', duplex: 'half', body,
        signal: AbortSignal.timeout(15 * 60 * 1000),
        headers: {
          'X-Requested-With': 'XMLHttpRequest', 'X-NC-Nickname': uploadFolder,
          'Content-Length': String(expected.size), 'If-None-Match': '*',
          'X-OC-MTime': String(expected.modified ?? Math.floor(before.mtimeMs / 1000)),
          'OC-Checksum': `SHA256:${expected.sha256 ?? await fileHash(file)}`,
        },
      });
      await response.body?.cancel();
    } catch { throw new Error('音乐目录上传暂时失败，稍后重试。'); }
    finally { body.destroy(); }
    if (response.status !== 201) throw new Error(`音乐目录上传未完成（HTTP ${response.status}）。`);
  }
  return {
    async ensureFile(file, type, expected) {
      const hash = expected.sha256 ?? await fileHash(file);
      const ext = path.extname(file).slice(1);
      const stem = path.basename(file, `.${ext}`);
      const name = `${type}/${stem}-${expected.sha256 ? '' : `${expected.modified}-`}${hash}.${ext}`;
      const reader = new URL(`${uploadFolder}/${name}`, config.base).href;
      const verify = { ...expected };
      if (!await verifyRemoteFile(reader, verify, request)) {
        await put(name, file, { ...expected, sha256: hash });
        if (!await verifyRemoteFile(reader, verify, request)) throw new Error('上传后的音乐文件尚未通过只读核验。');
      }
      return reader;
    },
    async publishCatalog(file) {
      const bytes = await readFile(file), info = await stat(file);
      const catalog = JSON.parse(bytes.toString('utf8'));
      const hash = createHash('sha256').update(bytes).digest('hex');
      const name = `catalogs/${String(Date.parse(catalog.updatedAt)).padStart(13, '0')}-${hash}.json`;
      const reader = new URL(`${uploadFolder}/${name}`, config.base).href;
      const expected = { size: info.size, sha256: hash };
      if (!await verifyRemoteFile(reader, expected, request)) {
        await put(name, file, expected);
        if (!await verifyRemoteFile(reader, expected, request)) throw new Error('云端目录快照未通过完整性核验。');
      }
      return { tracks: catalog.tracks.length, snapshot: name.split('/')[1] };
    },
  };
}
