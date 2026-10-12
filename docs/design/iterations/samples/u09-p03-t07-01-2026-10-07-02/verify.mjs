// Design QA only. Supply an existing Playwright module and browser executable.
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || 'playwright');
const browser = await chromium.launch({ executablePath: process.argv[3], headless: true });
const url = process.env.SAMPLE_URL || 'http://127.0.0.1:4323/';
const prefix = 'u09-p03-t07-01-2026-10-07-02';
const evidence = name => fileURLToPath(new URL(`../../evidence/${prefix}-${name}`, import.meta.url));
const report = { browser: browser.version(), url, execution: 'Local headless browser; viewport simulation, not a physical phone.', checks: [], errors: [], screenshots: [], limitations: ['No user aesthetic approval.', 'No real screen-reader speech.', 'No physical phone.', '200% text scaling is a CSS root-size check, not browser-toolbar zoom.', 'Development branch integration not performed.'] };
const record = (name, detail = true) => report.checks.push({ name, passed: true, detail });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('pageerror', e => report.errors.push(e.message));
const radio = name => page.getByRole('radio', { name, exact: true });
const count = () => page.locator('.knowledge-list > li:not([hidden])').count();
const status = () => page.locator('[role="status"]').textContent();
async function shot(name, target = page, options = {}) {
  const filename = `${name}.png`;
  await target.screenshot({ path: evidence(filename), animations: 'disabled', ...options });
  report.screenshots.push(`${prefix}-${filename}`);
}
async function geometry(target) {
  return target.evaluate(() => ({
    viewport: innerWidth,
    overflow: document.documentElement.scrollWidth > innerWidth,
    labels: [...document.querySelectorAll('.knowledge-type-option')].map(el => {
      const r = el.getBoundingClientRect();
      const text = el.querySelector('span').getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, textContained: text.right <= r.right && text.left >= r.left };
    })
  }));
}
try {
  await page.goto(url);
  assert.equal(await count(), 3);
  assert.equal(await status(), '全部：3 条内容。');
  assert.ok(await radio('全部').isChecked());
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(0, 0, 0)');
  record('Initial all / three demo entries / pure black');
  await shot('desktop-all', page, { fullPage: true });
  const originalGeometry = await geometry(page);
  for (const [label, value] of [['资料', 'resource'], ['文章', 'article'], ['笔记', 'note']]) {
    await page.locator('.knowledge-type-option').filter({ hasText: new RegExp(`^${label}$`) }).click();
    assert.ok(await radio(label).isChecked());
    assert.equal(await count(), 1);
    assert.equal(await status(), `${label}：1 条内容。`);
    assert.equal(new URL(page.url()).searchParams.get('type'), value);
    assert.deepEqual((await geometry(page)).labels, originalGeometry.labels);
  }
  record('Label clicks select exact type; result, URL and fixed control geometry agree');
  await page.reload();
  assert.ok(await radio('笔记').isChecked());
  await page.goBack();
  assert.ok(await radio('文章').isChecked());
  await page.goForward();
  assert.ok(await radio('笔记').isChecked());
  record('Refresh and history keep selected type and result');
  await radio('全部').click();
  assert.equal(new URL(page.url()).searchParams.get('type'), null);
  assert.equal(await count(), 3);
  record('All clears type and restores demo contents');

  await page.goto(url);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('class'), 'knowledge-blog-link');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').inputValue(), 'all');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator(':focus').inputValue(), 'resource');
  assert.equal(await status(), '资料：1 条内容。');
  const focus = await radio('资料').evaluate(el => ({ visible: el.matches(':focus-visible'), outline: getComputedStyle(el.parentElement).outlineStyle, width: getComputedStyle(el.parentElement).outlineWidth }));
  assert.ok(focus.visible && focus.outline === 'solid' && focus.width === '2px');
  report.accessibility = await page.locator('fieldset').ariaSnapshot();
  record('Native Tab/arrow navigation, selected marker and separate label focus ring', focus);
  await shot('desktop-focus');

  await page.locator('.knowledge-type-option').filter({ hasText: /^文章$/ }).hover();
  await page.waitForTimeout(220);
  assert.equal(await radio('文章').evaluate(el => getComputedStyle(el.parentElement).backgroundColor), 'rgb(42, 42, 42)');
  assert.ok(await radio('资料').isChecked());
  record('Hover changes only the hovered surface, keeps selected result');
  await shot('control-hover', page.locator('fieldset'));

  const client = await context.newCDPSession(page);
  await client.send('DOM.enable'); await client.send('CSS.enable');
  const { root } = await client.send('DOM.getDocument');
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.knowledge-type-option span' });
  report.renderedFonts = (await client.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
  record('Actual rendered font queried, rather than inferred from CSS', report.renderedFonts);

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${url}?type=note`);
    const result = await geometry(page);
    assert.ok(!result.overflow);
    assert.ok(result.labels.every(r => r.width >= 44 && r.height >= 44 && r.textContained));
    const rows = new Set(result.labels.map(r => r.y)).size;
    assert.equal(rows, width <= 480 ? 2 : 1);
    record(`Layout and targets at ${width}px`, result);
  }
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  const largeText = await geometry(page);
  assert.ok(!largeText.overflow && largeText.labels.every(r => r.textContained));
  assert.equal(new Set(largeText.labels.map(r => r.y)).size, 4);
  record('320px / 200% root text size reflows to one column', largeText);
  await shot('mobile-text-200', page, { fullPage: true });

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const mobile = await mobileContext.newPage();
  await mobile.goto(url);
  await mobile.getByRole('radio', { name: '文章', exact: true }).tap();
  assert.equal(await mobile.locator('[role="status"]').textContent(), '文章：1 条内容。');
  assert.equal(await mobile.locator('.knowledge-list > li:not([hidden])').count(), 1);
  assert.equal(await mobile.getByRole('radio', { name: '文章', exact: true }).evaluate(el => getComputedStyle(el.parentElement).webkitTapHighlightColor), 'rgba(0, 0, 0, 0)');
  record('390px touch selection / article result');
  await mobile.waitForTimeout(220);
  await shot('mobile-selected', mobile, { fullPage: true });
  await mobile.goto(`${url}?type=note&fixture=empty-notes`);
  assert.equal(await mobile.locator('[role="status"]').textContent(), '笔记：0 条内容。');
  assert.ok(await mobile.locator('.knowledge-empty').isVisible());
  assert.ok(await mobile.locator('.fixture-note').isVisible());
  record('Labeled empty fixture: zero count and recovery instruction');
  await shot('mobile-empty', mobile, { fullPage: true });
  await mobile.getByRole('radio', { name: '全部', exact: true }).tap();
  assert.equal(await mobile.locator('.knowledge-list > li:not([hidden])').count(), 2);
  assert.ok(await mobile.locator('.knowledge-empty').isHidden());
  record('All recovers remaining two fixture contents');
  await mobile.getByText('验证工具（仅用于样本）', { exact: true }).tap();
  await mobile.locator('#empty-fixture').uncheck();
  assert.equal(await mobile.locator('.knowledge-list > li:not([hidden])').count(), 3);
  record('Fixture switch restores original three demos');

  await page.goto(`${url}?type=unknown`);
  assert.ok((await status()).startsWith('未识别此类型'));
  assert.equal(await count(), 3);
  record('Unknown type remains readable and reports all');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await radio('全部').evaluate(el => getComputedStyle(el.parentElement).transitionDuration), '0s');
  record('Reduced motion removes surface transitions');
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await radio('全部').evaluate(el => getComputedStyle(el).appearance), 'auto');
  record('Forced colors restores native radio appearance');
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
  const noJsContext = await browser.newContext({ javaScriptEnabled: false });
  const noJs = await noJsContext.newPage(); await noJs.goto(url);
  assert.ok(await noJs.locator('fieldset').isHidden());
  assert.equal(await noJs.locator('.knowledge-list > li:not([hidden])').count(), 3);
  assert.ok(await noJs.locator('.knowledge-filter-fallback').isVisible());
  record('Without JavaScript: hidden controls, readable demos and explicit fallback');
  assert.equal(report.errors.length, 0);
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.stack; process.exitCode = 1;
} finally {
  await writeFile(evidence('browser.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, screenshots: report.screenshots, failure: report.failure || null }, null, 2));
}
