const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = process.cwd();
const fixture = path.resolve('.ci-tmp/t07-04-sort-fixture');
assert(fixture.startsWith(root + path.sep + '.ci-tmp' + path.sep));
assert(!fs.existsSync(fixture), 'Use a fresh fixture; do not replace an existing preview.');
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
const originals = files.filter((file) => file.startsWith('src/content/docs/knowledge/')).map((file) => ({
  file, sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
}));
for (const file of files) {
  assert(!file.startsWith('public/local-materials/') && !file.startsWith('大二上学习资源/'));
  const target = path.join(fixture, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
fs.symlinkSync(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'junction');
const samples = [
  { file: 'resources/sort-10.md', entryId: 'demo-sort-chapter-10', title: '第 10 章 排序验证', kind: 'resource', topics: ['排序验证'] },
  { file: 'resources/sort-2.md', entryId: 'demo-sort-chapter-2', title: '第 2 章 排序验证', kind: 'resource', topics: ['排序验证'] },
  { file: 'notes/sort-b.md', entryId: 'demo-sort-note-b', title: '同名排序验证', kind: 'note', topics: ['排序验证', '阅读与整理'] },
  { file: 'notes/sort-a.md', entryId: 'demo-sort-note-a', title: '同名排序验证', kind: 'note', topics: ['排序验证'] },
  { file: 'notes/sort-unclassified.md', entryId: 'demo-sort-unclassified', title: '无主题排序验证', kind: 'note', topics: [] },
  { file: 'notes/sort-draft.md', entryId: 'demo-sort-draft', title: 'T0704DRAFTONLY', kind: 'note', topics: ['仅排序草稿主题'], draft: true },
];
for (const sample of samples) {
  const target = path.join(fixture, 'src/content/docs/knowledge', sample.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `---\ntitle: ${sample.title}\ndescription: 仅本机排序功能样稿，不是正式内容。\nentryId: ${sample.entryId}\nkind: ${sample.kind}\ntopics: ${JSON.stringify(sample.topics)}\nexample: true\ndraft: ${Boolean(sample.draft)}\nrelated: []\n---\n\n仅本机排序样稿。\n`);
}
const config = path.join(fixture, 'astro.config.mjs');
fs.writeFileSync(config, fs.readFileSync(config, 'utf8').replace('defineConfig({', "defineConfig({\n  cacheDir: './.astro-cache',\n  vite: { cacheDir: './.vite-cache' },"));
const output = execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { cwd: fixture, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
fs.writeFileSync('.ci-tmp/t07-04-fixture-build.log', output);
const pages = Number(output.match(/\[build\] (\d+) page\(s\) built/)?.[1]);
assert(!fs.existsSync(path.join(fixture, 'dist/local-materials')));
for (const original of originals) assert.equal(createHash('sha256').update(fs.readFileSync(original.file)).digest('hex'), original.sha256);
const report = { result: 'passed', pages, publishedSamples: 5, draftSamples: 1, localPdfs: 0, originals, originalKnowledgeUnchanged: true };
fs.writeFileSync('.ci-tmp/t07-04-fixture.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pages, publishedSamples: 5, draftSamples: 1, originalKnowledgeUnchanged: true }));
