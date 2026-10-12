import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { test } from 'node:test';
import { inspectProject } from './project.mjs';
import { inspectDist } from './dist.mjs';
import { checkDocs } from './docs.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'personal-homepage-ci-'));
  t.after(() => {
    const resolvedRoot = realpathSync(root);
    if (dirname(resolvedRoot) !== realpathSync(tmpdir()) || !basename(resolvedRoot).startsWith('personal-homepage-ci-')) {
      throw new Error('Refusing cleanup outside the test fixture directory.');
    }
    rmSync(resolvedRoot, { recursive: true, force: true });
  });
  return root;
}

test('文档阶段明确跳过网站，但不把半成品工程当作文档阶段', (t) => {
  const root = fixture(t);
  assert.equal(inspectProject(root).ready, false);
  writeFileSync(join(root, 'package.json'), '{}');
  assert.throws(() => inspectProject(root), /工程不完整/u);
});

test('完整工程必须具有 Astro 和实际检查、构建命令', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'astro.config.mjs'), '');
  writeFileSync(join(root, 'package-lock.json'), '{}');
  const manifest = { dependencies: { astro: 'test-fixture' }, scripts: { dev: 'astro dev', check: 'astro check', build: 'astro build', preview: 'astro preview' } };
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest));
  assert.equal(inspectProject(root).ready, true);
  delete manifest.scripts.check;
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest));
  assert.throws(() => inspectProject(root), /缺少 check/u);
});

test('发布拒绝空产物，允许实际静态页面', (t) => {
  const root = fixture(t);
  assert.throws(() => inspectDist(root), /缺少 dist\/index.html/u);
  writeFileSync(join(root, 'index.html'), '<!doctype html><p>CI fixture</p>');
  assert.equal(inspectDist(root).files, 1);
});

test('产物中混入原始资料或环境配置时阻止上传', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'index.html'), '<!doctype html>');
  mkdirSync(join(root, '大二上学习资源'));
  assert.throws(() => inspectDist(root), /不应发布/u);
  const otherRoot = fixture(t);
  writeFileSync(join(otherRoot, 'index.html'), '<!doctype html>');
  writeFileSync(join(otherRoot, '.env.production'), 'fixture=true');
  assert.throws(() => inspectDist(otherRoot), /配置或密钥/u);
});

test('文档校验能够拒绝其他文件中的失效中文章节锚点', async (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'one.md'), '# 入口\n\n[目标](two.md#中文标题)\n');
  writeFileSync(join(root, 'two.md'), '# 中文标题\n');
  assert.equal((await checkDocs(root, ['one.md', 'two.md'])).code, 0);
  writeFileSync(join(root, 'one.md'), '# 入口\n\n[目标](two.md#不存在)\n');
  assert.equal((await checkDocs(root, ['one.md', 'two.md'])).code, 1);
});

test('本地阅读附件仅在显式预览检查时允许通过', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'index.html'), '<!doctype html>');
  mkdirSync(join(root, 'local-materials'));
  writeFileSync(join(root, 'local-materials/source.pdf'), '%PDF fixture');
  assert.throws(() => inspectDist(root), /本地预览附件/u);
  assert.equal(inspectDist(root, { localPreview: true }).files, 2);
});
