const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = process.cwd();
const fixture = path.resolve('.ci-tmp/t07-02-topic-fixture');
assert(fixture.startsWith(root + path.sep + '.ci-tmp' + path.sep));
assert(!fs.existsSync(fixture), 'Use a fresh fixture directory; do not overwrite an existing preview.');
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const originals = files.filter((file) => file.startsWith('src/content/docs/knowledge/'))
  .map((file) => ({ file, sha256: hash(file) }));
for (const file of files) {
  const target = path.join(fixture, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
fs.symlinkSync(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'junction');
const samples = [
  { file: 'resources/topic-check.md', id: 'demo-topic-resource', kind: 'resource', title: '多主题资料（仅本机样稿）', topics: ['筛选验证甲', '共享验证 & "引号"'] },
  { file: 'blog/topic-check.md', id: 'demo-topic-article', kind: 'article', title: '多主题文章（仅本机样稿）', topics: ['筛选验证乙', '共享验证 & "引号"'] },
  { file: 'notes/topic-check.md', id: 'demo-topic-note', kind: 'note', title: '多主题笔记（仅本机样稿）', topics: ['筛选验证甲', '筛选验证乙', '筛选验证甲'] },
  { file: 'notes/topic-unclassified.md', id: 'demo-topic-unclassified', kind: 'note', title: '未分类笔记（仅本机样稿）', topics: [] },
  { file: 'notes/topic-draft-only.md', id: 'demo-topic-draft-only', kind: 'note', title: 'T0702DRAFTONLY', topics: ['仅草稿主题'], draft: true },
  { file: 'resources/topic-draft-shared.md', id: 'demo-topic-draft-shared', kind: 'resource', title: 'T0702DRAFTSHARED', topics: ['筛选验证甲'], draft: true },
];
for (const sample of samples) {
  const target = path.join(fixture, 'src/content/docs/knowledge', sample.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `---\ntitle: ${sample.title}\ndescription: 仅用于 T07.02 主题组合筛选验证，不是正式内容。\nentryId: ${sample.id}\nkind: ${sample.kind}\nexample: true\ndraft: ${Boolean(sample.draft)}\ndate: 2026-10-08\ntags: [功能验证]\ntopics: ${JSON.stringify(sample.topics)}\n---\n\n仅本机功能样稿，不进入正式仓库内容。\n`);
}
const configPath = path.join(fixture, 'astro.config.mjs');
const config = fs.readFileSync(configPath, 'utf8');
assert(config.includes('defineConfig({'));
fs.writeFileSync(configPath, config.replace('defineConfig({', "defineConfig({\n  cacheDir: './.astro-cache',\n  vite: { cacheDir: './.vite-cache' },"));
const output = execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { cwd: fixture, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
fs.writeFileSync('.ci-tmp/t07-02-fixture-build.log', output);
const pages = Number(output.match(/\[build\] (\d+) page\(s\) built/)?.[1]);
const html = fs.readFileSync(path.join(fixture, 'dist/knowledge/index.html'), 'utf8');
assert(html.includes('筛选验证甲') && html.includes('筛选验证乙'));
assert(!html.includes('仅草稿主题') && !html.includes('T0702DRAFT'));
for (const sample of samples) {
  assert.equal(fs.existsSync(path.join(fixture, 'dist/knowledge', sample.file.replace(/\.md$/, '/index.html'))), !sample.draft);
}
for (const original of originals) {
  assert.equal(hash(original.file), original.sha256);
  assert.equal(hash(path.join(fixture, original.file)), original.sha256);
}
const record = { scope: 'isolated local production; no canonical content changes or PDF copies', pages, samples, originals, originalKnowledgeUnchanged: true };
fs.writeFileSync('.ci-tmp/t07-02-fixture.json', JSON.stringify(record, null, 2));
console.log(JSON.stringify({ pages, samplePublished: 4, sampleDraft: 2, originalKnowledgeUnchanged: true }));
