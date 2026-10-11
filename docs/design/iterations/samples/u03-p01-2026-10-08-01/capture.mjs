import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || undefined, headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 850 }, deviceScaleFactor: 1 });
const origin = process.env.PREVIEW || 'http://127.0.0.1:4325';
const evidence = new URL('../../evidence/', import.meta.url);
const prefix = 'u03-p01-2026-10-08-01-';
await mkdir(evidence, { recursive: true });
const output = name => fileURLToPath(new URL(prefix + name + '.png', evidence));
const errors = []; page.on('pageerror', error => errors.push(error.message));
const checks = [];
try {
  await page.goto(origin + '/?export=board'); await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('.candidate').count(), 5);
  assert.ok(await page.locator('img.mark').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
  checks.push('五个候选、各尺寸图形与字体加载完成');
  await page.screenshot({ path: output('overview'), fullPage: true });
  await page.goto(origin + '/'); await page.evaluate(() => document.fonts.ready);
  for (const id of ['a','b','c','d','e']) {
    const trigger = page.locator(`[data-open=${id}]`).first();
    await trigger.click();
    const dialog = page.locator(`#detail-${id}`);
    assert.ok(await dialog.isVisible());
    await dialog.screenshot({ path: output(id + '-detail') });
    await page.keyboard.press('Escape');
    assert.ok(await trigger.evaluate(button => button === document.activeElement));
  }
  checks.push('五个候选的放大、Esc 关闭与焦点恢复');
  await page.locator('#theme').click();
  assert.equal(await page.locator('#theme').getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: output('light'), fullPage: true });
  checks.push('浅底切换与反白实例');
  await page.locator('#theme').click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('[data-open=b]').first().click();
    assert.ok(await page.locator('#detail-b').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth));
    if (width === 390) await page.screenshot({ path: output('mobile') });
    await page.keyboard.press('Escape');
  }
  checks.push('390/320 宽目录与详情无横向溢出');
  assert.deepEqual(errors, []); checks.push('无页面脚本错误');
  await writeFile(new URL(prefix + 'browser.json', evidence), JSON.stringify({ date:'2026-10-08', browser:browser.version(), origin, checks, errors, note:'实际图形辨识由截图目视判断；不以自动化结果代替审美选择。'}, null, 2) + '\n');
  console.log(JSON.stringify({ screenshots:8, checks, errors }, null, 2));
} finally { await browser.close(); }
