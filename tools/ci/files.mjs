import { execFileSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root,
  encoding: 'utf8',
}).split('\0').filter(Boolean);
const failures = [];

for (const path of new Set(paths)) {
  if (path.startsWith('大二上学习资源/')) {
    failures.push(`${path}: 原始学习资料应保留在本地，请移出 Git 索引。`);
  }
  if (/(^|\/)\.env(?:\.|$)/u.test(path) && !path.endsWith('.example')) {
    failures.push(`${path}: 环境配置文件不可纳入仓库。`);
  }
  const stats = lstatSync(resolve(root, path));
  if (stats.isSymbolicLink()) {
    failures.push(`${path}: 请用明确的资源文件或地址替代符号链接。`);
  }
  if (stats.isFile() && stats.size > 50 * 1024 * 1024) {
    failures.push(`${path}: 超过本项目 50 MiB 的仓库文件上限，请配置外部存储。`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`仓库文件检查通过：${new Set(paths).size} 个文件。原始资料、环境配置与生成目录按 .gitignore 排除。`);
}
