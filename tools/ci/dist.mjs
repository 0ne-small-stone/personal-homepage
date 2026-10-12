import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export function inspectDist(root, { localPreview = false } = {}) {
  if (!existsSync(join(root, 'index.html'))) {
    throw new Error('静态产物缺少 dist/index.html，拒绝发布空站点或服务端产物。');
  }
  let files = 0;
  let bytes = 0;
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const stats = lstatSync(path);
      if (stats.isSymbolicLink()) throw new Error(`静态产物含符号链接：${path}`);
      if (entry.name === '大二上学习资源' || entry.name === '.git' || entry.name === 'node_modules') {
        throw new Error(`静态产物含不应发布的目录：${entry.name}`);
      }
      if (entry.name === 'local-materials' && !localPreview) {
        throw new Error('静态产物含本地预览附件 local-materials，拒绝发布；本地验收可显式使用 --local-preview。');
      }
      if (/^\.env(?:\.|$)/u.test(entry.name) || entry.name.endsWith('.pem') || entry.name.endsWith('.key')) {
        throw new Error(`静态产物含配置或密钥文件：${entry.name}`);
      }
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) { files += 1; bytes += stats.size; }
    }
  }
  walk(root);
  if (bytes > 900 * 1024 * 1024) {
    throw new Error('静态产物超过本项目 900 MiB 的发布预算，请把大文件迁移到外部存储。');
  }
  return { files, bytes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const root = fileURLToPath(new URL('../../dist/', import.meta.url));
    const result = inspectDist(root, { localPreview: process.argv.includes('--local-preview') });
    console.log(`静态产物检查通过：${result.files} 个文件，${result.bytes} 字节。`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
