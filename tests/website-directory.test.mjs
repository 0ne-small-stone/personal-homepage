import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { websites, validateWebsites, websiteSearchText, matchesWebsite, readWebsiteFilter } from '../src/data/websites.ts';

// Use the real production HTML. JSDOM checks state/semantics, not CSS or real navigation.
const html = await readFile(new URL('../dist/links/index.html', import.meta.url), 'utf8');
const markup = JSDOM.fragment(html).querySelector('[data-website-directory]').outerHTML;
const source = (await readFile(new URL('../src/components/links/website-directory.ts', import.meta.url), 'utf8')).replace("from '../../lib/website-directory'", `from '${new URL('../src/lib/website-directory.ts', import.meta.url).href}'`);
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { mountWebsiteDirectory } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

function directory(t, query = '') {
  const dom = new JSDOM(markup, { url: `http://localhost/personal-homepage/links/${query}` });
  const root = dom.window.document.querySelector('[data-website-directory]');
  let cleanup = mountWebsiteDirectory(root, dom.window);
  t.after(() => { cleanup(); dom.window.close(); });
  return { root, view: dom.window, remount: () => { cleanup(); cleanup = mountWebsiteDirectory(root, dom.window); } };
}
const visible = root => [...root.querySelectorAll('[data-website-card]')].filter(card => !card.hidden);
const click = (root, selector) => root.querySelector(selector).click();
const search = (root, view, query) => { const input = root.querySelector('input'); input.value = query; input.dispatchEvent(new view.Event('input', { bubbles: true })); };

const exampleSite = { id:'example', name:'代码练习', url:'https://pintia.cn/home?locale=zh-CN', description:'代码与练习', category:'learning', tags:['B站'], icon:'terminal' };
const categoryCount = category => websites.filter(site => site.category === category).length;
const queryCount = (category, query) => websites.filter(site => site.category === category && websiteSearchText(site).includes(query)).length;

test('公开网站通过结构校验，保留深路径及查询参数并拒绝危险地址和重复项', () => {
  assert.doesNotThrow(() => validateWebsites(websites));
  assert.doesNotThrow(() => validateWebsites([exampleSite]));
  for (const url of ['javascript:alert(1)', 'https://name:secret@example.com/', 'not a URL']) assert.throws(() => validateWebsites([{ ...exampleSite, url }]));
  assert.throws(() => validateWebsites([exampleSite, exampleSite]));
});
test('名称、用途、域名、标签与全角输入均可查找，未知分类降级', () => {
  assert.ok(matchesWebsite(websiteSearchText(exampleSite), 'ＰＩＮＴＩＡ．ＣＮ'));
  assert.ok(matchesWebsite(websiteSearchText(exampleSite), '代码 练习'));
  assert.ok(matchesWebsite(websiteSearchText(exampleSite), 'B站'));
  assert.equal(readWebsiteFilter(new URL('https://local.invalid/?category=invalid')).category, 'all');
});
test('真实SSR页面保留当前完整外链，单一主标题和原生分类锚点', t => {
  const { root } = directory(t);
  assert.equal(root.querySelectorAll('h1').length, 1);
  assert.equal(visible(root).length, websites.length);
  for (const link of root.querySelectorAll('.elsewhere-card-link')) {
    assert.equal(link.target, '_blank'); assert.ok(link.rel.includes('noopener')); assert.ok(link.rel.includes('noreferrer'));
    assert.ok(websites.some(site => site.url === link.getAttribute('href')));
  }
  for (const category of root.querySelectorAll('[data-category]')) assert.ok(root.querySelector(category.getAttribute('href')));
  assert.equal(root.querySelector('[data-enhanced-only]').hidden, false);
});
test('搜索与分类组合保留关键词，零结果可清除并归焦', t => {
  const { root, view } = directory(t);
  search(root, view, 'no-match-test-0000'); assert.equal(visible(root).length, 0);
  click(root, '[data-category="media"]');
  assert.equal(visible(root).length, 0); assert.equal(root.querySelector('input').value, 'no-match-test-0000');
  assert.equal(new URL(view.location.href).searchParams.get('category'), 'media');
  assert.equal(root.querySelector('[data-empty]').hidden, false);
  click(root, '[data-empty-reset]'); assert.equal(visible(root).length, websites.length);
  assert.equal(view.location.search, ''); assert.equal(view.document.activeElement, root.querySelector('input'));
});
test('深链恢复组合；全部网站保持查询，Escape只清查询', t => {
  const { root, view } = directory(t, '?category=learning&q=课程');
  assert.equal(visible(root).length, queryCount('learning', '课程'));
  click(root, '[data-all]'); assert.equal(root.querySelector('input').value, '课程');
  click(root, '[data-category="media"]');
  root.querySelector('input').dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(visible(root).length, categoryCount('media')); assert.equal(new URL(view.location.href).searchParams.get('category'), 'media');
});
test('浏览器后退恢复分类，保留Astro历史字段', async t => {
  const { root, view } = directory(t);
  view.history.replaceState({ routerKey: 42 }, '', view.location.href);
  click(root, '[data-category="learning"]'); click(root, '[data-category="media"]');
  assert.equal(view.history.state.routerKey, 42);
  const back = new Promise(resolve => view.addEventListener('popstate', resolve, { once: true }));
  view.history.back(); await back;
  assert.equal(visible(root).length, categoryCount('learning'));
  assert.equal(root.querySelector('[data-category="learning"]').getAttribute('aria-pressed'), 'true');
});
test('空格支持分类；卸载与重进不会遗留输入或历史监听', t => {
  const { root, view, remount } = directory(t);
  root.querySelector('[data-category="work"]').dispatchEvent(new view.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
  assert.equal(visible(root).length, categoryCount('work'));
  remount(); const length = view.history.length;
  click(root, '[data-category="campus"]'); assert.equal(view.history.length, length + 1);
  assert.equal(visible(root).length, categoryCount('campus'));
});
