const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { chromium } = createRequire(process.env.PLAYWRIGHT_PACKAGE)('playwright');
const { parse } = createRequire(path.resolve('package.json'))('yaml');
const base = process.argv[2] ?? 'http://127.0.0.1:4322/personal-homepage';
const sourceRoot = path.resolve(process.argv[3] ?? '.');
const output = path.resolve(process.argv[4] ?? '.ci-tmp/t07-04-browser');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const contentRoot = path.join(sourceRoot, 'src/content/docs');
const entries = walk(path.join(contentRoot, 'knowledge')).filter((file) => /\.mdx?$/.test(file)).flatMap((file) => {
  const data = parse(fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '');
  if (!data?.kind || data.draft) return [];
  const route = path.relative(contentRoot, file).replaceAll('\\', '/').replace(/\.mdx?$/, '') + '/';
  return [{ ...data, url: data.source?.format === 'link' ? data.source.url : `${base}/${route}` }];
});
const collator = new Intl.Collator('zh-CN', { numeric: true });
const defaultOrder = [...entries].sort((a, b) => a.topics.join('/').localeCompare(b.topics.join('/'), 'zh-CN') || collator.compare(a.title, b.title));
const ascOrder = [...entries].sort((a, b) => collator.compare(a.title, b.title) || a.entryId.localeCompare(b.entryId, 'en'));
const orders = { default: defaultOrder, 'title-asc': ascOrder, 'title-desc': [...ascOrder].reverse() };
const topics = ['', ...new Set(entries.flatMap((entry) => entry.topics))];
const checks = [];
const record = (name, details = {}) => checks.push({ name, result: 'passed', ...details });
const visible = (page) => page.locator('.knowledge-list > li:not([hidden]) > a').evaluateAll((links) => links.map((link) => link.href));
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/knowledge/`);
  await page.locator('.knowledge-sort-controls:not([hidden])').waitFor();
  const sort = page.locator('#knowledge-sort');
  const topic = page.locator('#knowledge-topic');
  const pdfs = entries.filter((entry) => entry.source?.format === 'pdf');
  const availablePdfs = pdfs.filter((entry) => fs.existsSync(path.join(sourceRoot, 'public', entry.source.file ?? `local-materials/${entry.source.id}.pdf`))).length;
  const summary = await page.locator('main').textContent();
  assert(summary.includes(availablePdfs === pdfs.length ? '点开资料或 PDF 笔记即可阅读' : `已接入 ${availablePdfs} 份 PDF`));
  record('overview reports public and local PDF availability truthfully', { availablePdfs, totalPdfs: pdfs.length });
  let combinations = 0;
  for (const kind of ['all', 'resource', 'article', 'note']) {
    await page.locator(`input[value="${kind}"]`).check();
    for (const selectedTopic of topics) {
      await topic.selectOption(selectedTopic);
      for (const mode of Object.keys(orders)) {
        await sort.selectOption(mode);
        const expected = orders[mode].filter((entry) => (kind === 'all' || entry.kind === kind) && (!selectedTopic || entry.topics.includes(selectedTopic)));
        assert.deepEqual(await visible(page), expected.map((entry) => entry.url), `${kind}/${selectedTopic}/${mode}`);
        assert((await page.locator('.knowledge-result-status').textContent()).includes(`${expected.length} 条内容`));
        assert.equal(await page.locator('.knowledge-empty').isVisible(), expected.length === 0);
        combinations++;
      }
    }
  }
  record('type/topic/sort combinations match independent YAML', { combinations, published: entries.length });

  await page.goto(`${base}/knowledge/?type=resource&topic=${encodeURIComponent('大学物理Ⅱ')}&sort=title-asc&keep=1#sort-check`);
  await page.locator('.knowledge-sort-controls:not([hidden])').waitFor();
  const physics = await page.locator('.knowledge-list > li:not([hidden]) > a').allTextContents();
  assert(physics.findIndex((title) => title.includes('第 9 章')) < physics.findIndex((title) => title.includes('第 10 章')));
  record('real chapter 9 precedes 10 in numeric title order');
  await sort.selectOption('title-desc');
  const descending = await visible(page);
  assert.equal(new URL(page.url()).searchParams.get('keep'), '1');
  assert.equal(new URL(page.url()).hash, '#sort-check');
  assert.equal(new URL(page.url()).searchParams.get('type'), 'resource');
  await page.reload();
  await page.locator('.knowledge-sort-controls:not([hidden])').waitFor();
  assert.equal(await sort.inputValue(), 'title-desc');
  assert.deepEqual(await visible(page), descending);
  record('copy/reload preserves sorting, filters and unrelated URL state');
  await sort.selectOption('title-asc');
  await page.goBack();
  assert.equal(await sort.inputValue(), 'title-desc');
  assert.deepEqual(await visible(page), descending);
  await page.goForward();
  assert.equal(await sort.inputValue(), 'title-asc');
  record('native back and forward restore each order');
  await page.getByRole('button', { name: '清空筛选' }).click();
  assert.equal(await sort.inputValue(), 'title-asc');
  assert.deepEqual(await visible(page), ascOrder.map((entry) => entry.url));
  assert.equal(new URL(page.url()).searchParams.get('sort'), 'title-asc');
  assert.equal(new URL(page.url()).searchParams.get('keep'), '1');
  assert.equal(new URL(page.url()).hash, '#sort-check');
  assert.equal(await page.locator('input[value="all"]').evaluate((node) => node === document.activeElement), true);
  record('clear filters keeps sort and returns focus to all');
  await sort.selectOption('default');
  assert.equal(new URL(page.url()).searchParams.has('sort'), false);
  assert.deepEqual(await visible(page), defaultOrder.map((entry) => entry.url));
  record('default restores original topic order and removes sort parameter');

  await page.goto(`${base}/knowledge/?sort=unknown&type=resource&topic=${encodeURIComponent('阅读与整理')}`);
  await page.locator('.knowledge-sort-controls:not([hidden])').waitFor();
  assert.equal(await sort.inputValue(), 'default');
  assert((await page.locator('.knowledge-result-status').textContent()).includes('未识别此排序'));
  assert.deepEqual(await visible(page), defaultOrder.filter((entry) => entry.kind === 'resource' && entry.topics.includes('阅读与整理')).map((entry) => entry.url));
  record('unknown sort falls back without discarding valid filters');

  if (entries.some((entry) => entry.entryId === 'demo-sort-chapter-2')) {
    await page.goto(`${base}/knowledge/?topic=${encodeURIComponent('排序验证')}&type=resource&sort=title-asc`);
    assert.deepEqual((await visible(page)).map((url) => new URL(url).pathname.split('/').at(-2)), ['sort-2', 'sort-10']);
    await page.goto(`${base}/knowledge/?topic=${encodeURIComponent('排序验证')}&type=note&sort=title-asc`);
    assert.deepEqual((await visible(page)).map((url) => new URL(url).pathname.split('/').at(-2)), ['sort-a', 'sort-b']);
    await sort.selectOption('title-desc');
    await page.reload();
    assert.deepEqual((await visible(page)).map((url) => new URL(url).pathname.split('/').at(-2)), ['sort-b', 'sort-a']);
    assert(!(await topic.locator('option').allTextContents()).includes('仅排序草稿主题'));
    record('isolated numeric titles and equal titles remain deterministic');
  }

  const sourceUrl = `${base}/knowledge/?type=resource&sort=title-asc&keep=return#sort-check`;
  await page.goto(sourceUrl);
  await page.locator('.knowledge-sort-controls:not([hidden])').waitFor();
  const originalLink = page.locator('.knowledge-list > li:not([hidden]) > a').filter({ hasText: 'PDF 阅读验证说明' });
  await originalLink.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  assert(before > 100, 'Use a genuinely scrolled source list for return verification.');
  await originalLink.click();
  await page.waitForURL(`${base}/knowledge/resources/reading-guide/`);
  await page.locator('pdf-reader[aria-busy="false"] iframe').waitFor({ timeout: 45000 });
  const frame = page.frames().find((frame) => frame.url().includes('/pdfjs/web/viewer.html'));
  assert(frame);
  await frame.waitForFunction(() => window.PDFViewerApplication?.pdfDocument?.numPages === 4, null, { timeout: 45000 });
  await page.locator('[data-article-return]').click();
  await page.waitForURL(sourceUrl);
  await page.waitForFunction(() => document.activeElement?.closest('.knowledge-list') !== null);
  assert.equal(await sort.inputValue(), 'title-asc');
  assert.deepEqual(await visible(page), orders['title-asc'].filter((entry) => entry.kind === 'resource').map((entry) => entry.url));
  assert((await page.evaluate(() => document.activeElement.textContent)).includes('PDF 阅读验证说明'));
  const after = await page.evaluate(() => scrollY);
  assert(Math.abs(before - after) <= 2, `${before} -> ${after}`);
  record('PDF return preserves sorted list, URL, scroll and actual link focus', { before, after });

  await page.goto(`${base}/knowledge/?type=article&topic=${encodeURIComponent('阅读与整理')}&sort=title-desc`);
  await page.locator('.knowledge-list > li:not([hidden]) > a').first().click();
  await page.locator('[data-article-return]').click();
  await page.waitForFunction(() => document.activeElement?.closest('.knowledge-list') !== null);
  assert.equal(new URL(page.url()).searchParams.get('sort'), 'title-desc');
  record('article return retains combined filter and sorting');

  const lifecycle = await context.newPage();
  await lifecycle.goto(`${base}/knowledge/?sort=title-desc`);
  await lifecycle.locator('.knowledge-sort-controls:not([hidden])').waitFor();
  await lifecycle.evaluate(() => { const el = document.querySelector('knowledge-type-filter'); const parent = el.parentNode; const next = el.nextSibling; el.remove(); parent.insertBefore(el, next); });
  const historyLength = await lifecycle.evaluate(() => history.length);
  await lifecycle.locator('#knowledge-sort').selectOption('default');
  assert.deepEqual(await visible(lifecycle), defaultOrder.map((entry) => entry.url));
  assert.equal(await lifecycle.evaluate(() => history.length), historyLength + 1);
  record('reconnect restores SSR order and adds one history entry');
  await lifecycle.close();
  await page.goto(`${base}/knowledge/`);
  await page.locator('.knowledge-sort-controls:not([hidden])').waitFor();

  await sort.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  assert.equal(await sort.inputValue(), 'title-asc');
  assert.equal(await sort.evaluate((node) => node === document.activeElement), true);
  assert.equal(await sort.evaluate((node) => getComputedStyle(node).outlineStyle), 'solid');
  assert((await sort.boundingBox()).height >= 44);
  record('native keyboard sorting retains visible 44px focus target');
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await page.screenshot({ path: path.join(output, 'desktop-dark.png'), fullPage: false });
  await page.evaluate(() => document.documentElement.dataset.theme = 'light');
  await page.screenshot({ path: path.join(output, 'desktop-light.png'), fullPage: false });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert((await sort.boundingBox()).height >= 44);
  }
  await page.screenshot({ path: path.join(output, 'mobile-320.png'), fullPage: false });
  record('320/390px controls reflow without outer overflow');
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  record('200% text reflows without outer overflow');
  assert.deepEqual(errors, []);
  record('normal interaction has no uncaught page errors');

  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const native = await noJS.newPage();
  await native.goto(`${base}/knowledge/?type=note&sort=title-desc`);
  assert.deepEqual(await visible(native), defaultOrder.map((entry) => entry.url));
  assert(!(await native.locator('#knowledge-sort').isVisible()));
  assert((await native.locator('.knowledge-filter-fallback').textContent()).includes('排序暂不可用'));
  record('no JavaScript preserves full readable SSR topic order');
  await noJS.close();
  await context.close();
  await browser.close();
  const report = { result: 'passed', base, browser: 'Edge headless', combinations, groups: checks.length, checks };
  fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
})().catch((error) => { console.error(error); process.exit(1); });
