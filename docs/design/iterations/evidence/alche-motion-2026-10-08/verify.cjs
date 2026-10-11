/* Research player verification. Requires Playwright and an installed Chrome.
 * PLAYWRIGHT_PACKAGE and CHROME_PATH can override the local tool locations.
 */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const result = { date: new Date().toISOString(), method: 'Playwright with Chrome; file URL; real UI controls',
  errors: [], externalRequests: [], checks: [] };
(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) result.externalRequests.push(request.url()); });
    await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('#clips button').length === 7);
    const imageReady = () => page.waitForFunction(() => { const image = document.getElementById('frame'); return image.complete && image.naturalWidth > 0; });
    const time = () => page.locator('#timeline').inputValue().then(Number);
    for (const clip of manifest.clips) {
      await page.locator(`[data-clip="${clip.name}"]`).click(); await imageReady();
      assert.equal(await page.locator('#clip-title').textContent(), clip.title);
      assert.equal(await page.locator(`[data-clip="${clip.name}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#frame').getAttribute('src'), clip.frames[0].file);
      const dimensions = await page.locator('#frame').evaluate(image => [image.naturalWidth, image.naturalHeight]);
      await page.locator('#timeline').focus(); await page.keyboard.press('End'); await imageReady();
      if (await page.locator('#frame').getAttribute('src') !== clip.frames.at(-1).file) result.rangeEdge = await page.locator('#timeline').evaluate(range => ({ value: range.value, max: range.max, min: range.min, step: range.step }));
      assert.equal(await page.locator('#frame').getAttribute('src'), clip.frames.at(-1).file);
      await page.keyboard.press('Home'); await imageReady();
      assert.equal(await page.locator('#frame').getAttribute('src'), clip.frames[0].file);
      result.checks.push({ clip: clip.name, selectAndFirstLastFrames: 'pass', dimensions });
    }
    await page.locator('[data-clip="pointer"]').click();
    const initial = await time(); await page.locator('#play').click(); await wait(500);
    await page.locator('#play').click(); const after = await time(); assert(after > initial + 0.25);
    await wait(200); assert.equal(await time(), after);
    result.checks.push({ playbackAndPause: 'pass', secondsAdvanced: after - initial });
    await page.locator('#timeline').focus(); await page.keyboard.press('Home');
    await page.selectOption('#speed', '0.5'); const slowStart = await time();
    await page.locator('#play').click(); await wait(600); await page.locator('#play').click();
    const slowAdvanced = await time() - slowStart; assert(slowAdvanced > 0.2 && slowAdvanced < 0.55);
    result.checks.push({ halfSpeed: 'pass', secondsAdvancedInAbout600ms: slowAdvanced });
    await page.selectOption('#speed', '1');
    const range = await page.locator('#timeline').boundingBox();
    await page.mouse.move(range.x + 2, range.y + range.height / 2); await page.mouse.down();
    await page.mouse.move(range.x + range.width * 0.6, range.y + range.height / 2, { steps: 10 }); await page.mouse.up();
    await imageReady(); const seekTime = await time(); const pointer = manifest.clips.find(clip => clip.name === 'pointer');
    const ratio = seekTime / pointer.duration; assert(ratio > 0.5 && ratio < 0.7);
    assert.equal(await page.locator('#play').textContent(), '播放');
    result.checks.push({ realPointerDrag: 'pass', positionRatio: ratio });
    const previousSrc = await page.locator('#frame').getAttribute('src');
    await page.locator('#next').click(); await imageReady();
    assert.notEqual(await page.locator('#frame').getAttribute('src'), previousSrc);
    await page.locator('#previous').click(); await imageReady();
    assert.equal(await page.locator('#frame').getAttribute('src'), previousSrc);
    result.checks.push({ frameStep: 'pass' });
    await page.screenshot({ path: path.join(__dirname, 'verified-desktop.png'), fullPage: true });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 }); await page.locator('[data-clip="mobile-menu"]').click();
      await page.locator('#timeline').focus(); await page.keyboard.press('End'); await imageReady();
      const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      assert(noOverflow); result.checks.push({ viewportWidth: width, horizontalOverflow: false });
      if (width === 390) await page.screenshot({ path: path.join(__dirname, 'verified-mobile.png'), fullPage: true });
    }
    assert.equal(result.errors.length, 0); assert.equal(result.externalRequests.length, 0);
    result.success = true;
  } catch (error) { result.success = false; result.failure = error.stack; process.exitCode = 1; }
  finally { await browser.close(); fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result, null, 2)); }
})();
