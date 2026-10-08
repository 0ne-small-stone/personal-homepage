import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { inspectPublicPdfs } from './public-pdf-check.mjs';

// Negative artifact checks use a new, minimal fixture; never mutate a preview.
const root = resolve(process.argv[2] ?? '.ci-tmp/t06-01-guard-fixture');
assert(root.startsWith(resolve('.ci-tmp') + '/') || root.startsWith(resolve('.ci-tmp') + '\\'));
assert(!existsSync(root), 'Use a fresh guard fixture.');
const paths = ['src/content/docs/knowledge/resources/reading-guide.md', 'public/materials/lssh-pdf-reading-check.pdf',
  'dist/materials/lssh-pdf-reading-check.pdf', 'dist/knowledge/resources/reading-guide/index.html'];
const backups = new Map(paths.map((file) => [file, readFileSync(file)]));
const put = (file, data) => { mkdirSync(join(root, file, '..'), { recursive: true }); writeFileSync(join(root, file), data); };
for (const [file, data] of backups) put(file, data);
assert.equal(inspectPublicPdfs(root).publicPdfs, 1);
const checks = [];
function rejected(name, file, change, expected) {
  put(file, change(backups.get(file)));
  assert.throws(() => inspectPublicPdfs(root), expected);
  put(file, backups.get(file));
  checks.push({ name, result: 'rejected as expected' });
}
rejected('changed source bytes', paths[1], (data) => { const copy = Buffer.from(data); copy[20] ^= 1; return copy; }, /source checksum mismatch/);
rejected('changed published attachment', paths[2], (data) => Buffer.concat([data, Buffer.from('x')]), /published attachment changed/);
rejected('wrong deployment prefix', paths[3], (data) => data.toString().replace('src="/personal-homepage/pdfjs/', 'src="/pdfjs/'), /missing prefixed viewer/);
rejected('unsafe file path', paths[0], (data) => data.toString().replace('materials/lssh-pdf-reading-check.pdf', '../lssh-pdf-reading-check.pdf'), /unsafe public path/);
rejected('stale byte metadata', paths[0], (data) => data.toString().replace('bytes: 65959', 'bytes: 65958'), /size mismatch/);
rejected('missing public checksum', paths[0], (data) => data.toString().replace(/^  sha256:.*\r?\n/m, ''), /missing public checksum/);
rejected('missing public attachment', paths[0], (data) => data.toString().replace('materials/lssh-pdf-reading-check.pdf', 'materials/missing-file.pdf'), /ENOENT/);
console.log(JSON.stringify({ result: 'passed', groups: checks.length, checks }));
