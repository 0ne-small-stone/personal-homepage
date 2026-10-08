const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = process.cwd();
const fixture = path.resolve('.ci-tmp/t09-02-fixture-isolated');
assert(fixture.startsWith(root + path.sep + '.ci-tmp' + path.sep));
assert(!fs.existsSync(fixture), 'Use a fresh fixture directory; do not overwrite a snapshot.');
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const hash = name => createHash('sha256').update(fs.readFileSync(name)).digest('hex');
const originals = files.filter(name => name.startsWith('src/content/docs/knowledge/')).map(name => ({ name, sha256: hash(name) }));
for (const name of files) {
  const destination = path.join(fixture, name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(name, destination);
}
fs.symlinkSync(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'junction');
const localPdfs = [];
const catalog = JSON.parse(fs.readFileSync('docs/technical/content/learning-materials.json', 'utf8'));
for (const id of ['source-probability-lecture-0', 'source-ads-algorithms-notes']) {
  const source = path.join(root, 'public/local-materials', id + '.pdf');
  if (!fs.existsSync(source)) continue;
  assert.equal(hash(source), catalog.sources.find(source => source.id === id).sha256);
  const destination = path.join(fixture, 'public/local-materials', id + '.pdf');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  localPdfs.push({ id, bytes: fs.statSync(source).size, sha256: hash(source) });
}
const target = 'demo-article-reading-check';
const samples = [
  { file: 'resources/backlinks-check.md', id: 'demo-backlinks-resource', kind: 'resource', title: '资料关联验证（仅本机样稿）', extra: [] },
  { file: 'blog/backlinks-check.md', id: 'demo-backlinks-article', kind: 'article', title: '文章关联验证（仅本机样稿）', extra: [] },
  { file: 'notes/backlinks-check.md', id: 'demo-backlinks-note', kind: 'note', title: '笔记关联验证（仅本机样稿）', extra: ['resource-probability-lecture-0', 'note-ads-algorithms-notes', 'demo-backlinks-hidden-target', 'demo-backlinks-note'] },
];
function write(file, content) {
  const destination = path.join(fixture, 'src/content/docs/knowledge', file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}
write('notes/backlinks-hidden-source.md', `---\ntitle: T0902HIDDENSOURCE\nentryId: demo-backlinks-hidden-source\nkind: note\ndraft: true\nrelated: [${target}, unfinished-draft-reference]\n---\n\nT0902HIDDENBODY\n`);
write('notes/backlinks-hidden-target.md', `---\ntitle: T0902HIDDENTARGET\nentryId: demo-backlinks-hidden-target\nkind: note\ndraft: true\n---\n\nT0902HIDDENTARGETBODY\n`);
const configPath = path.join(fixture, 'astro.config.mjs');
// node_modules is a junction: Astro's default cache would be shared with other previews.
const config = fs.readFileSync(configPath, 'utf8').replace('defineConfig({', "defineConfig({\n  cacheDir: './.astro-cache',\n  vite: { cacheDir: './.vite-cache' },");
assert(config.includes('defineConfig({'));
const builds = [];
for (const state of ['added', 'removed']) {
  for (const sample of samples) {
    const related = state === 'added' ? [target, ...sample.extra, target] : sample.extra;
    write(sample.file, `---\ntitle: ${sample.title}\ndescription: 仅用于 T09.02 反向关联验收，不是正式内容。\nentryId: ${sample.id}\nkind: ${sample.kind}\nexample: true\ndate: 2026-10-08\ntags: [功能验证]\ntopics: [功能验证]\nrelated: [${related.join(', ')}]\n---\n\n这是仅本机的功能验证样稿，不是正式内容。\n\n此快照${state === 'added' ? '已声明' : '已移除'}与“博客阅读验证”的关联。请对照正文后的关联列表与目标页的“哪些内容关联了它”。\n`);
  }
  // Separate immutable output directories; no canonical content or prior snapshot is moved.
  fs.writeFileSync(configPath, config.replace('defineConfig({', `defineConfig({\n  outDir: './dist-${state}',`));
  const output = execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { cwd: fixture, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  fs.writeFileSync(path.join(root, `.ci-tmp/t09-02-${state}-build.log`), output);
  builds.push({ state, outDir: `dist-${state}`, pages: Number(output.match(/\[build\] (\d+) page\(s\) built/)?.[1]), success: true });
  for (const sample of samples) {
    const html = fs.readFileSync(path.join(fixture, `dist-${state}/knowledge`, sample.file.replace(/\.md$/, '/index.html')), 'utf8');
    assert(html.includes(sample.title), `Missing ${state} source: ${sample.file}`);
  }
  const targetHtml = fs.readFileSync(path.join(fixture, `dist-${state}/knowledge/blog/article-reading-check/index.html`), 'utf8');
  assert.equal(targetHtml.includes('id="backlinks-knowledge-title"'), state === 'added');
}
fs.writeFileSync(configPath, config.replace('defineConfig({', "defineConfig({\n  outDir: process.env.T09_SNAPSHOT === 'removed' ? './dist-removed' : './dist-added',"));
for (const original of originals) {
  assert.equal(hash(original.name), original.sha256);
  assert.equal(hash(path.join(fixture, original.name)), original.sha256);
}
const record = { scope: 'isolated local production snapshots; no canonical content added or edited', originals, originalKnowledgeUnchanged: true, localPdfs, builds, samplePublished: 3, sampleDraft: 2 };
fs.writeFileSync('.ci-tmp/t09-02-fixtures.json', JSON.stringify(record, null, 2));
console.log(JSON.stringify({ builds, originalKnowledgeUnchanged: true, samplePublished: 3, sampleDraft: 2 }));
