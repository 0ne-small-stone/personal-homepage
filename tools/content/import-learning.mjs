import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, posix, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const catalog = JSON.parse(readFileSync(join(root, 'docs/technical/content/learning-materials.json'), 'utf8'));
const sources = new Map(catalog.sources.map((source) => [source.id, source]));
const ids = new Set();
const routes = new Set();
const route = (entry) => `knowledge/${entry.kind === 'resource' ? 'resources' : 'notes'}/${entry.category}/${entry.slug}`;
const quote = (value) => JSON.stringify(value);
const sourceRootArg = process.argv.indexOf('--source');
const sourceRoot = sourceRootArg >= 0 ? resolve(process.argv[sourceRootArg + 1] ?? '') : undefined;
if (sourceRootArg >= 0 && !process.argv[sourceRootArg + 1]) throw new Error('--source 需要原始资料目录。');
if (sources.size !== catalog.sources.length) throw new Error('重复来源 ID。');

for (const source of catalog.sources) {
  if (posix.isAbsolute(source.path) || source.path.split('/').includes('..') || source.path.includes('\\')) throw new Error('来源路径必须相对原始资料目录。');
  if (sourceRoot) {
    const path = resolve(sourceRoot, source.path);
    if (!path.startsWith(sourceRoot + sep)) throw new Error('来源路径越界。');
    const bytes = readFileSync(path);
    if (bytes.length !== source.bytes || createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw new Error(`原始文件变化：${source.path}`);
  }
}
for (const entry of catalog.entries) {
  if (!['resource', 'note'].includes(entry.kind) || !/^[a-z0-9-]+$/.test(entry.entryId) || !/^[a-z0-9-]+$/.test(entry.category) || !/^[a-z0-9-]+$/.test(entry.slug)) throw new Error('无效类型、ID 或路由。');
  if (ids.has(entry.entryId) || routes.has(route(entry))) throw new Error('重复条目 ID 或路由。');
  ids.add(entry.entryId); routes.add(route(entry));
  if (!sources.has(entry.sourceId)) throw new Error(`缺少来源：${entry.sourceId}`);
  if (entry.url && new URL(entry.url).protocol !== 'https:') throw new Error('原站入口必须使用 HTTPS。');
}
if (catalog.sources.some((source) => !catalog.entries.some((entry) => entry.sourceId === source.id))) throw new Error('存在未分类来源。');

for (const entry of catalog.entries) {
  const source = sources.get(entry.sourceId);
  const related = catalog.entries.filter((other) => other.topic === entry.topic && other.entryId !== entry.entryId);
  const numbered = entry.slug.match(/(?:chapter|lecture)-(\d+)$/);
  const lines = [
    '---', `title: ${quote(entry.title)}`, `description: ${quote(entry.description)}`,
    `entryId: ${entry.entryId}`, `kind: ${entry.kind}`, `topics: [${quote(entry.topic)}]`,
    `related: ${quote(related.map((other) => other.entryId))}`,
    'tableOfContents: false',
    'sidebar:', `  order: ${numbered ? Number(numbered[1]) : 100}`, 'source:', `  id: ${entry.sourceId}`,
    `  format: ${entry.url ? 'link' : 'pdf'}`,
  ];
  if (entry.author) lines.push(`  author: ${quote(entry.author)}`);
  if (entry.url) lines.push(`  url: ${quote(entry.url)}`);
  else lines.push(`  bytes: ${source.bytes}`, `  pages: ${source.pages}`);
  lines.push('---', '', `## ${entry.url ? '笔记入口' : '内容说明'}`, '', entry.description, '');
  if (entry.url) {
    lines.push(`这是一条外部笔记收藏，作者为 **${entry.author}**；正文在原站阅读。`, '', `[访问原站笔记](${entry.url})`, '');
  } else if (entry.kind === 'note') {
    lines.push(`这是一份 PDF 笔记收藏，${entry.author ? `原文件标注作者为 **${entry.author}**` : '原文件未明确标注作者'}。可在上方阅读器直接阅读。`, '');
  }
  lines.push('## 来源与文件信息', '', '| 项目 | 内容 |', '| --- | --- |', `| 科目 | ${entry.topic} |`, `| 类型 | ${entry.kind === 'resource' ? '学习资料' : '笔记收藏'} |`);
  if (entry.url) lines.push(`| 来源记录 | ${source.path} |`, `| 作者 / 笔记本 | ${entry.author} |`, '| 阅读方式 | 访问原站 |');
  else lines.push(`| 原文件 | ${source.path} |`, '| 格式 | PDF |', `| 大小 | ${(source.bytes / 1024 / 1024).toFixed(2)} MiB（${source.bytes.toLocaleString('en-US')} 字节） |`, `| 页数 | ${source.pages} |`, `| 作者 | ${entry.author ?? '未明确标注'} |`, '| 阅读方式 | 页面内 PDF 阅读器；附件缺失时显示实际待配置状态 |');
  lines.push('');
  if (!entry.url) lines.push('原文件保持完整；阅读器支持翻页、缩放和下载。扫描 PDF 能否搜索文字取决于原件是否含文字层。', '');
  lines.push('## 同科目内容', '');
  for (const other of related) lines.push(`- [${other.title}](${posix.relative(route(entry), route(other))}/)`);
  if (!related.length) lines.push('当前只有这一条收藏。');
  lines.push('', '[返回学习总览](' + '../'.repeat(route(entry).split('/').length - 1) + ')', '');
  const path = join(root, 'src/content/docs', route(entry) + '.md');
  if (existsSync(path)) {
    const existing = readFileSync(path, 'utf8');
    if (!existing.split(/\r?\n/).includes(`entryId: ${entry.entryId}`)) throw new Error(`不能覆盖非本条目文件：${path}`);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, lines.join('\n'));
}

const report = ['# 现有学习资料分类清单', '', 'T06.02 / T08.01 · 2026-10-07。此清单由 `tools/content/import-learning.mjs` 从结构化目录生成。原件保持原目录和名称；本地 PDF 直接阅读，外部笔记直接进入原站。', '', `来源：${catalog.sources.length} 个文件，${catalog.sources.reduce((sum, source) => sum + source.bytes, 0).toLocaleString('en-US')} 字节；条目：${catalog.entries.length} 个。两个 TXT 保存三个外部笔记链接，因此文件数与条目数不同。`, '', '## 分类统计', '', '| 科目 | 资料 | 笔记 |', '| --- | --- | --- |'];
for (const topic of [...new Set(catalog.entries.map((entry) => entry.topic))]) {
  report.push(`| ${topic} | ${catalog.entries.filter((entry) => entry.topic === topic && entry.kind === 'resource').length} | ${catalog.entries.filter((entry) => entry.topic === topic && entry.kind === 'note').length} |`);
}
report.push('', '## 逐项对应', '', '| 类型 | 科目 | 网站条目 | 原始来源 | 大小 / 页数 |', '| --- | --- | --- | --- | --- |');
for (const entry of catalog.entries) {
  const source = sources.get(entry.sourceId);
  report.push(`| ${entry.kind === 'resource' ? '资料' : '笔记'} | ${entry.topic} | [${entry.title}](../../../src/content/docs/${route(entry)}.md) | ${source.path} | ${entry.url ? '外部链接' : `${(source.bytes / 1024 / 1024).toFixed(2)} MiB / ${source.pages} 页`} |`);
}
report.push('', '## 原件与公开边界', '', '- 36 PDF 原件未进入 Git；完整副本放在被忽略的 public/local-materials，构建后用于本地阅读。默认发布检查拒绝该目录，本地检查需显式使用 --local-preview。PDF.js 搜索仅支持原文件已有文字层。', '- ADSNotes_Algorithms.pdf 为 50.18 MiB，工程物理学为 177.67 MiB，计算机组成与设计为 206.36 MiB，超过仓库 50 MiB 约定。其余文件亦需核对公开授权后决定附件位置。', '- 第 9 章两个版本、概统合并讲义及分讲文件内容不同，保留独立条目，不按近似标题删除。', '- 外部笔记保留原作者与 HTTPS 原站入口；仅去除无关的 `_refluxos` 查询参数，不转载正文。', '- 每个来源的字节数、页数、SHA-256 与稳定 ID 保存在 [结构化清单](learning-materials.json)。', '', '## 重新导入', '', '在项目根目录运行 `npm run content:import`。核对原件时追加 `-- --source <原始资料目录>`，只读取和校验，不移动、改名或复制附件。', '');
writeFileSync(join(root, 'docs/technical/content/LEARNING_MATERIALS.md'), report.join('\n'));
console.log(`资料分类导入完成：${catalog.sources.length} 个来源，${catalog.entries.filter((entry) => entry.kind === 'resource').length} 条资料、${catalog.entries.filter((entry) => entry.kind === 'note').length} 条笔记。${sourceRoot ? '原件大小与 SHA-256 全部一致。' : ''}`);
