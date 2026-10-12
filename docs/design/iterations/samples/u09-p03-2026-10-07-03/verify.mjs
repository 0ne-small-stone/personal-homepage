import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || undefined, headless: true });
const preview = process.env.PREVIEW || 'http://127.0.0.1:4324';
const upstream = process.env.UPSTREAM || 'http://127.0.0.1:4322';
const path = '/personal-homepage/knowledge/';
const evidence = new URL('../../evidence/', import.meta.url);
await mkdir(evidence, { recursive: true });
const prefix = 'u09-p03-2026-10-07-03-';
const report = { date: new Date().toISOString(), browser: browser.version(), preview, upstream, checks: [], errors: [] };
const check = (name, result = true) => { assert.ok(result, name); report.checks.push({ name, passed: true }); };
const source = await browser.newPage();
await source.goto(upstream + path);
const original = await source.locator('.knowledge-list > li').evaluateAll(items => items.map(item => ({
  kind: item.dataset.knowledgeKind, href: item.querySelector('a').getAttribute('href'),
  title: item.querySelector('a').textContent.trim(), description: item.querySelector('p').textContent.trim()
})));
report.content = { total: original.length, counts: Object.fromEntries(['resource','article','note'].map(kind => [kind, original.filter(item => item.kind === kind).length])) };
await source.close();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', e => report.errors.push(e.message));
const snap = async name => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(name === 'keyboard' ? 1000 : 250); // Let Chrome settle text paint after the history sequence.
  return page.screenshot({ path: fileURLToPath(new URL(prefix + name + '.png', evidence)) });
};
const select = async value => { await page.locator(`label:has(input[value="${value}"])`).click(); };
const count = () => page.locator('.knowledge-list > li[data-knowledge-kind]:visible').count();
await page.goto(preview + path);
await page.waitForSelector('.lssh-shell');
const preserved = await page.locator('.knowledge-list > li').evaluateAll(items => items.map(item => ({
  kind: item.dataset.knowledgeKind, href: item.querySelector('a').getAttribute('href'),
  title: item.querySelector('a').getAttribute('aria-label'), description: item.querySelector('p').textContent.trim()
})));
assert.deepEqual(preserved, original); check('全部条目、标题可访问名称、简介与链接保持原始数据');
check('全部结果与源站一致', await count() === original.length);
check('页面仅有一个主标题和 main', await page.locator('h1').count() === 1 && await page.locator('main').count() === 1);
report.groups = await page.locator('.lssh-subject-heading').allTextContents();
await snap('desktop');
for (const kind of ['resource', 'article', 'note']) {
  await select(kind);
  check(`${kind} 原生筛选数量与 URL`, await count() === report.content.counts[kind] && new URL(page.url()).searchParams.get('type') === kind);
  const groupCount = await page.locator('.lssh-subject-heading:visible .lssh-subject-count').allTextContents();
  check(`${kind} 科目计数随原生筛选同步`, groupCount.reduce((sum, value) => sum + parseInt(value), 0) === report.content.counts[kind]);
}
await page.reload(); await page.waitForSelector('.lssh-shell');
check('刷新保留笔记类型', await page.locator('input[value=note]').isChecked() && await count() === report.content.counts.note);
await select('resource'); await page.goBack();
check('历史后退更新原生结果与分组', await page.locator('input[value=note]').isChecked() && await count() === report.content.counts.note);
await page.goForward();
check('历史前进恢复资料', await page.locator('input[value=resource]').isChecked() && await count() === report.content.counts.resource);
await select('all');
await page.locator('input[value=all]').focus(); await page.keyboard.press('ArrowRight');
check('原生方向键切换并保留焦点', await page.locator('input[value=resource]').isChecked() && await page.locator('input[value=resource]').evaluate(e => e === document.activeElement));
check('焦点外框可见', await page.locator('label:has(input[value=resource])').evaluate(e => getComputedStyle(e).outlineStyle !== 'none'));
await snap('keyboard');
await page.getByRole('button', { name: '搜索知识内容', exact: true }).click();
await page.getByPlaceholder('搜索知识内容').fill('大学物理');
await page.locator('.pagefind-ui__result-link').first().waitFor({ timeout: 15000 });
report.searchResults = await page.locator('.pagefind-ui__result-link').allTextContents();
check('复用 Pagefind 返回真实搜索结果', report.searchResults.length > 0);
await snap('search'); await page.keyboard.press('Escape');
check('搜索 Esc 关闭恢复触发按钮，类型不变', !(await page.locator('dialog').isVisible()) && await page.locator('site-search > button').evaluate(e => e === document.activeElement) && await page.locator('input[value=resource]').isChecked());
await select('all');
const firstSubject = await page.locator('.lssh-subject-nav a').nth(1).getAttribute('href');
await page.locator('.lssh-subject-nav a').nth(1).click();
check('科目索引跳到当前分组', new URL(page.url()).hash === firstSubject && await page.locator(firstSubject).evaluate(e => Math.abs(e.getBoundingClientRect().top) < 60));
const detail = await page.locator('.lssh-entry a').first().getAttribute('href');
await page.locator('.lssh-entry a').first().click(); await page.waitForURL(url => url.pathname === detail);
check('原始详情页面可访问', await page.locator('h1').count() === 1);
await page.goBack(); await page.waitForSelector('.lssh-shell');
check('详情返回保留列表', await count() === original.length);
for (const width of [1440, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 844 });
  check(`${width} 宽无页面横向溢出`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check(`${width} 类型标签至少 44×44`, await page.locator('.knowledge-type-option').evaluateAll(items => items.every(e => e.getBoundingClientRect().height >= 44 && e.getBoundingClientRect().width >= 44)));
}
await page.setViewportSize({ width: 390, height: 844 }); await page.goto(preview + path);
await page.waitForSelector('.lssh-shell');
check('手机科目默认折叠', !(await page.locator('.lssh-subjects').getAttribute('open')) && !(await page.locator('.lssh-subject-nav').isVisible()));
await snap('mobile');
await page.locator('.lssh-subjects summary').click();
check('手机科目索引及文章时间入口可展开', await page.locator('.lssh-subject-nav').isVisible() && await page.getByRole('link', { name: '按时间浏览文章' }).isVisible());
await page.locator('.lssh-subjects summary').click(); await select('article');
check('真实文章空结果有恢复说明', await page.locator('.knowledge-empty').isVisible() && (await page.locator('.knowledge-empty').innerText()).includes('全部'));
await snap('empty'); await select('all');
check('空结果恢复全部', await count() === original.length);
await page.emulateMedia({ reducedMotion: 'reduce' });
check('减少动画关闭行与筛选过渡', await page.locator('.lssh-entry').first().evaluate(e => getComputedStyle(e).transitionDuration === '0s'));
await page.emulateMedia({ forcedColors: 'active' });
check('强制颜色下选中项保留边界', await page.locator('label:has(input:checked)').evaluate(e => getComputedStyle(e).borderStyle === 'solid'));
await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' });
await page.setViewportSize({ width: 320, height: 844 });
await page.addStyleTag({ content: 'html{font-size:200%!important}' });
report.textScaleOverflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
check('320 宽根字号 200% 无横向溢出', report.textScaleOverflow.scroll <= report.textScaleOverflow.width);
await snap('text-200');
const cdp = await page.context().newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
const { root } = await cdp.send('DOM.getDocument');
const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.lssh-entry p' });
report.fonts = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
const nojs = await browser.newContext({ javaScriptEnabled: false }); const fallback = await nojs.newPage();
await fallback.goto(preview + path);
check('禁用脚本时原生完整列表可读，控件不误导', await fallback.locator('.knowledge-list > li:visible').count() === original.length && !(await fallback.locator('.knowledge-type-controls').isVisible()));
await nojs.close();
const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const mobile = await touch.newPage(); await mobile.goto(preview + path); await mobile.waitForSelector('.lssh-shell');
await mobile.locator('label:has(input[value=note])').tap();
check('模拟触控选择笔记', await mobile.locator('input[value=note]').isChecked() && await mobile.locator('.knowledge-list > li:visible').count() === report.content.counts.note);
await touch.close();
check('无页面脚本错误', report.errors.length === 0);
await writeFile(new URL(prefix + 'browser.json', evidence), JSON.stringify(report, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify(report, null, 2));
