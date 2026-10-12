// Build only repository files in a fresh directory, never local PDF copies.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = process.cwd();
const fixture = path.resolve('.ci-tmp/t06-01-public-fixture');
assert(fixture.startsWith(root + path.sep + '.ci-tmp' + path.sep));
assert(!fs.existsSync(fixture), 'Use a fresh fixture; do not replace an existing preview.');
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const originals = execFileSync('git', ['ls-tree', '-r', '--name-only', '58c758b', '--', 'src/content/docs/knowledge'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  .map((file) => ({ file, sha256: hash(file) }));
for (const file of files) {
  assert(!file.startsWith('public/local-materials/') && !file.startsWith('大二上学习资源/'));
  const target = path.join(fixture, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
fs.symlinkSync(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'junction');
fs.symlinkSync(path.join(root, 'tools/ci/node_modules'), path.join(fixture, 'tools/ci/node_modules'), 'junction');
const configPath = path.join(fixture, 'astro.config.mjs');
fs.writeFileSync(configPath, fs.readFileSync(configPath, 'utf8').replace('defineConfig({', "defineConfig({\n  cacheDir: './.astro-cache',\n  vite: { cacheDir: './.vite-cache' },"));
const output = execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { cwd: fixture, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
fs.writeFileSync('.ci-tmp/t06-01-fixture-build.log', output);
const pages = Number(output.match(/\[build\] (\d+) page\(s\) built/)?.[1]);
assert(!fs.existsSync(path.join(fixture, 'public/local-materials')));
assert(!fs.existsSync(path.join(fixture, 'dist/local-materials')));
for (const original of originals) {
  assert.equal(hash(original.file), original.sha256);
  assert.equal(hash(path.join(fixture, original.file)), original.sha256);
}
const record = { scope: 'clean static build; repository sources only; no local PDF copies', pages, copiedRepositoryFiles: files.length, localMaterialCopies: 0, originals, originalKnowledgeUnchanged: true };
fs.writeFileSync('.ci-tmp/t06-01-fixture.json', JSON.stringify(record, null, 2));
console.log(JSON.stringify({ pages, copiedRepositoryFiles: files.length, localMaterialCopies: 0, originalKnowledgeUnchanged: true }));
