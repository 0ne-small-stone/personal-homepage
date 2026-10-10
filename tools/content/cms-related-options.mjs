import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '@astrojs/markdown-remark';

const root = fileURLToPath(new URL('../../', import.meta.url));
const contentRoot = join(root, 'src/content/docs/knowledge');
const configPath = join(root, '.pages.yml');
const labels = { resource: '资料', article: '文章', note: '笔记' };
const ids = new Set();
const options = [];
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);

for (const file of walk(contentRoot).filter((file) => /\.mdx?$/.test(file))) {
  const { frontmatter: data } = parseFrontmatter(readFileSync(file, 'utf8'));
  if (!labels[data.kind] || typeof data.entryId !== 'string' || typeof data.title !== 'string') {
    throw new Error(`关联候选字段无效：${relative(root, file)}`);
  }
  if (ids.has(data.entryId)) throw new Error(`关联候选 ID 重复：${data.entryId}`);
  ids.add(data.entryId);
  if (data.draft === true) continue;
  const topics = Array.isArray(data.topics) ? [...new Set(data.topics)].filter(Boolean).join('、') : '';
  options.push({ value: data.entryId, label: `${labels[data.kind]} · ${data.title}${topics ? ` · ${topics}` : ''}` });
}
options.sort((a, b) => a.value < b.value ? -1 : a.value > b.value ? 1 : 0);
const start = '          # BEGIN GENERATED KNOWLEDGE OPTIONS';
const end = '          # END GENERATED KNOWLEDGE OPTIONS';
const block = [start, ...options.flatMap((option) => [
  `          - value: ${JSON.stringify(option.value)}`,
  `            label: ${JSON.stringify(option.label)}`,
]), end].join('\n');
const config = readFileSync(configPath, 'utf8');
const pattern = /          # BEGIN GENERATED KNOWLEDGE OPTIONS[^]*?          # END GENERATED KNOWLEDGE OPTIONS/g;
const matches = [...config.matchAll(pattern)];
if (matches.length !== 1) throw new Error('关联候选生成区域必须唯一。');
const updated = config.replace(pattern, block);
if (process.argv.includes('--check')) {
  if (config.replace(/\r\n/g, '\n') !== updated.replace(/\r\n/g, '\n')) {
    throw new Error('CMS 关联候选已过期：运行 npm run cms:sync-related 并提交 .pages.yml 后重新检查。');
  }
} else if (updated !== config) {
  writeFileSync(configPath, updated);
}
console.log(`CMS 关联候选：${options.length} 条已发布内容，三类共用稳定 ID；${process.argv.includes('--check') ? '检查' : '同步'}通过。`);
