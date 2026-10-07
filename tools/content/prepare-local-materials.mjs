import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const catalog = JSON.parse(readFileSync(join(root, 'docs/technical/content/learning-materials.json'), 'utf8'));
const arg = process.argv.indexOf('--source');
if (arg >= 0 && !process.argv[arg + 1]) throw new Error('--source 需要原始资料目录。');
const sourceRoot = resolve(arg >= 0 ? process.argv[arg + 1] : join(root, catalog.sourceDirectory));
const target = join(root, 'public/local-materials');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const pdfs = catalog.sources.filter(source => source.path.toLowerCase().endsWith('.pdf'));
// Validate every original before creating any preview copy.
for (const source of pdfs) {
  if (!/^[a-z0-9-]+$/.test(source.id)) throw new Error('无效来源 ID。');
  const path = resolve(sourceRoot, source.path);
  if (!path.startsWith(sourceRoot + sep)) throw new Error('来源路径越界。');
  const bytes = readFileSync(path);
  if (bytes.length !== source.bytes || hash(bytes) !== source.sha256) throw new Error(`原件变化：${source.path}`);
}
mkdirSync(target, { recursive: true });
for (const source of pdfs) {
  const destination = join(target, source.id + '.pdf');
  if (!existsSync(destination) || hash(readFileSync(destination)) !== source.sha256) {
    copyFileSync(resolve(sourceRoot, source.path), destination);
  }
  if (hash(readFileSync(destination)) !== source.sha256) throw new Error(`附件校验失败：${source.id}`);
}
console.log(JSON.stringify({ prepared: pdfs.length, bytes: pdfs.reduce((sum, source) => sum + source.bytes, 0), originalHashesUnchanged: true, directory: 'public/local-materials', scope: 'local-preview-only' }));
