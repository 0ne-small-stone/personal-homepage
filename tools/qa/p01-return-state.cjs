// P01 / T26.02: real navigation, earliest visible state, bounded regression.
const { chromium } = require(process.env.LSSH_QA_PLAYWRIGHT || 'playwright');
const fs = require('node:fs'), path = require('node:path');
const out = path.resolve('docs/design/iterations/evidence/u03-p01-2026-10-08-27');
const base = process.env.LSSH_QA_URL || 'http://127.0.0.1:4321/personal-homepage/';
const ids = ['projects', 'radio', 'album', 'links'];
fs.mkdirSync(out, { recursive: true });
async function instrument(page, errors) {
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__frames = []; window.__paints = []; window.__restores = [];
    window.__read = motion => {
      const main = document.querySelector('main'), scene = document.querySelector('.home-scene');
      const items = [...document.querySelectorAll('[data-work-item]')].map(section => {
        const cta = section.querySelector('.home-cta'), container = section.querySelector('.home-chapter-viewport');
        const rect = cta.getBoundingClientRect(), hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return { id: section.id, active: section.dataset.workActive === 'true', inert: section.inert,
          ctaInert: cta.inert, opacity: Number(getComputedStyle(cta).opacity),
          effectiveOpacity: Number(getComputedStyle(cta).opacity) * Number(getComputedStyle(container).opacity),
          hit: !!hit && (cta === hit || cta.contains(hit)) };
      });
      return { time: performance.now(), y: scrollY, h: innerHeight, hash: location.hash,
        navigation: performance.getEntriesByType('navigation')[0]?.type, motion,
        enhanced: document.body.classList.contains('home-enhanced'), restoring: !!document.body.dataset.homeRestoring,
        mainVisibility: main ? getComputedStyle(main).visibility : null,
        sceneVisibility: scene ? getComputedStyle(scene).visibility : null,
        chapter: document.body.dataset.chapter, current: document.querySelector('.home-chapter-index [aria-current]')?.textContent,
        focus: document.activeElement?.id, loader: document.querySelectorAll('.home-loader').length, items,
        overflow: document.documentElement.scrollWidth > innerWidth };
    };
    document.addEventListener('lssh:motion', event => {
      window.__motion = event.detail; window.__frames.push(window.__read(event.detail));
    });
    document.addEventListener('lssh:home-restore', event => window.__restores.push({ type: 'before', detail: event.detail, state: window.__read(window.__motion) }));
    document.addEventListener('lssh:home-restored', event => window.__restores.push({ type: 'complete', detail: event.detail, time: performance.now() }));
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.dataset.motionDiagnostics = 'true';
      const paint = () => { if (window.__paints.length < 500) window.__paints.push(window.__read(window.__motion)); requestAnimationFrame(paint); };
      requestAnimationFrame(paint);
    }, { once: true });
  });
}
async function loaded(page, url = base) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.dataset.homeMotion === 'ready' && document.body.classList.contains('home-enhanced') && !document.body.dataset.homeRestoring && window.__motion?.cards.length === 4);
  await page.waitForFunction(() => !document.querySelector('.home-loader'));
}
async function wheel(cdp, delta) { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: delta }); }
async function goChapter(page, index) {
  await page.locator(`.home-chapter-index a[href="#${ids[index]}"]`).click();
  await page.waitForFunction(index => Math.abs(scrollY - ((index + 2) * innerHeight + 100)) < 1 && window.__motion?.activeItem === index && !window.__motion.snapActive, index);
  await page.waitForTimeout(400);
}
const visible = row => row.enhanced && !row.restoring && row.mainVisibility === 'visible' && row.sceneVisibility === 'visible';
function firstCheck(value, expected, index, focus) {
  if (!value?.motion) return false;
  const m = value.motion, p = (expected - value.h - 100) / (5 * value.h), o = 5 * p;
  const rounded = Math.round(o + Number.EPSILON * 8), u = rounded + .4 * (o - rounded);
  return Math.abs(value.y - expected) < 1.5 && m.raw.intro === 1 && m.rendered.intro === 1 &&
    Math.abs(m.rendered.progress - p) < .0004 && Math.abs(m.rendered.index - u) < .002 &&
    Math.abs(m.camera?.position[2] - 6) < 1e-8 && Math.abs(m.camera?.fov - (35 + 18 / (value.width / value.h))) < 1e-8 &&
    m.activeItem === index && m.cards[index]?.alpha > .99 && value.chapter === ids[index] && value.current === `0${index + 1}` &&
    Object.values(m.lerpers).every(lerper => Math.abs(lerper.current - lerper.target) < 1e-6) &&
    (!focus || value.focus === `entry-${ids[index]}`) && value.items[index].effectiveOpacity === 1 && !value.items[index].ctaInert && !value.loader;
}
(async () => {
  const result = { date: new Date().toISOString(), url: base, errors: [], checks: [], cases: [] };
  const check = (name, pass, detail) => result.checks.push({ name, pass, detail });
  const browser = await chromium.launch({ executablePath: process.env.LSSH_QA_BROWSER, headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
  result.browser = browser.version(); result.renderer = 'SwiftShader';
  async function collect(page, name, expected, index, focus = true) {
    await page.waitForFunction(({ index, focus }) => window.__frames.some(row => row.enhanced && !row.restoring && row.mainVisibility === 'visible' &&
      row.motion?.activeItem === index && (!focus || row.focus === `entry-${['projects','radio','album','links'][index]}`)), { index, focus });
    const screenshotTime = await page.evaluate(() => performance.now());
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    await page.waitForTimeout(450);
    const value = await page.evaluate(() => ({ frames: window.__frames, paints: window.__paints, restores: window.__restores, final: window.__read(window.__motion) }));
    value.name = name; value.expected = expected; value.index = index; value.screenshotTime = screenshotTime;
    value.first = value.frames.find(visible); value.first.width = page.viewportSize().width;
    result.cases.push(value);
    check(`${name}: first visible frame aligned`, firstCheck(value.first, expected, index, focus));
    check(`${name}: pre-layout content stays gated`, value.paints.filter(row => !row.enhanced).every(row => row.mainVisibility === 'hidden'));
    check(`${name}: no camera replay or title tail`, value.frames.filter(visible).every(row => row.motion.rendered.intro === 1 && Math.abs(row.motion.camera.position[2] - 6) < 1e-8));
    check(`${name}: no overflow`, !value.final.overflow);
    console.log(`return-state: ${name} captured`);
  }
  async function roundTrip(page, name, index, nextViewport) {
    const before = await page.evaluate(() => window.__read(window.__motion));
    await page.locator(`#entry-${ids[index]}`).click();
    const route = page.url();
    if (nextViewport) await page.setViewportSize(nextViewport);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    const expected = ((index + 2) + (before.y - ((index + 2) * before.h + 100)) / before.h) * page.viewportSize().height + 100;
    await collect(page, name, expected, index);
    result.cases.at(-1).leave = before; result.cases.at(-1).route = route;
    check(`${name}: actual target route`, route.endsWith(index === 2 ? '/gallery/' : '/links/'));
  }
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } }); await instrument(desktop, result.errors); await loaded(desktop);
    const cdp = await desktop.context().newCDPSession(desktop);
    for (let i = 0; i < 3; i++) { await wheel(cdp, 1200); await desktop.waitForTimeout(180); }
    await desktop.waitForFunction(() => Math.abs(scrollY - 3700) < 1 && window.__motion?.activeItem === 2 && !window.__motion.snapActive, { timeout: 15000 });
    await desktop.waitForTimeout(400);
    check('album reached by actual wheel without hash', !new URL(desktop.url()).hash);
    await roundTrip(desktop, 'desktop-album-nohash-1', 2);
    await roundTrip(desktop, 'desktop-album-nohash-2', 2);
    await desktop.reload({ waitUntil: 'domcontentloaded' }); await collect(desktop, 'desktop-album-reload', 3700, 2);
    await cdp.detach(); await desktop.close();
    const hashed = await browser.newPage({ viewport: { width: 1440, height: 900 } }); await instrument(hashed, result.errors); await loaded(hashed);
    await goChapter(hashed, 2); check('album chapter control writes hash', new URL(hashed.url()).hash === '#album');
    await roundTrip(hashed, 'desktop-album-hash', 2);
    await goChapter(hashed, 3); await roundTrip(hashed, 'desktop-links-hash', 3);
    await hashed.close();
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await instrument(mobile, result.errors); await loaded(mobile);
    await goChapter(mobile, 2); await roundTrip(mobile, 'mobile-album-hash', 2); await mobile.close();
    const resized = await browser.newPage({ viewport: { width: 1440, height: 900 } }); await instrument(resized, result.errors); await loaded(resized);
    await goChapter(resized, 2); await roundTrip(resized, 'album-new-viewport', 2, { width: 390, height: 844 }); await resized.close();
    const direct = await browser.newPage({ viewport: { width: 1440, height: 900 } }); await instrument(direct, result.errors);
    await direct.goto(`${base}#album`, { waitUntil: 'domcontentloaded' }); await collect(direct, 'desktop-direct-hash', 3700, 2, false); await direct.close();
    const ordinary = await browser.newPage({ viewport: { width: 1440, height: 900 } }); await instrument(ordinary, result.errors); await loaded(ordinary);
    result.top = await ordinary.evaluate(() => window.__read(window.__motion));
    check('fresh top preserves near camera', result.top.y === 0 && result.top.motion.camera.position[2] === 5.7 && result.top.motion.rendered.intro === 0);
    const cd = await ordinary.context().newCDPSession(ordinary); await wheel(cd, 2000); await ordinary.waitForTimeout(2300); await wheel(cd, -2000); await ordinary.waitForTimeout(2300);
    result.ordinary = await ordinary.evaluate(() => ({ frames: window.__frames, final: window.__read(window.__motion) }));
    check('ordinary wheel remains reversible with camera transition', result.ordinary.frames.some(row => row.motion.camera?.position[2] > 5.71 && row.motion.camera.position[2] < 5.99) && result.ordinary.frames.some(row => row.motion.activeItem === 0) && result.ordinary.final.y === 0);
    check('ordinary scroll does not reseed', new Set(result.ordinary.frames.map(row => row.motion.initialization.revision)).size === 1);
    const delayed = result.ordinary.frames.filter(row => row.motion.activeItem === 0 && row.items[0].opacity === 0);
    check('delayed CTA remains inert and not hittable', delayed.length > 0 && delayed.every(row => row.items[0].ctaInert && !row.items[0].hit), { frames: delayed.length });
    await ordinary.evaluate(() => scrollTo({ top: 2800, behavior: 'instant' })); await ordinary.waitForTimeout(2200); await wheel(cd, 160);
    await ordinary.waitForFunction(() => window.__motion.snapActive); await ordinary.waitForFunction(() => !window.__motion.snapActive && Math.abs(scrollY - 2800) < 1);
    check('radio snap still returns to center', true); await wheel(cd, 200); await ordinary.waitForFunction(() => window.__motion.snapActive);
    await wheel(cd, -240); await ordinary.waitForFunction(() => !window.__motion.snapActive); await ordinary.waitForTimeout(200);
    result.snapInterrupt = await ordinary.evaluate(() => window.__read(window.__motion)); check('new input still interrupts snap', !result.snapInterrupt.motion.snapActive);
    await cd.detach(); await ordinary.close();
    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); await instrument(reduced, result.errors); await reduced.goto(base);
    await reduced.waitForFunction(() => document.body.classList.contains('home-quiet'));
    await reduced.locator('#entry-album').scrollIntoViewIfNeeded(); await reduced.locator('#entry-album').click(); await reduced.goBack();
    await reduced.waitForFunction(() => document.activeElement?.id === 'entry-album' && !document.body.dataset.homeRestoring);
    result.reduced = await reduced.evaluate(() => window.__read(window.__motion));
    check('reduced motion return uses visible native content', result.reduced.mainVisibility === 'visible' && !result.reduced.items[2].inert); await reduced.close();
    const native = await browser.newPage({ javaScriptEnabled: false }); await native.goto(`${base}#album`);
    check('no JS remains readable', await native.locator('main').evaluate(el => getComputedStyle(el).visibility === 'visible')); await native.close();
    const failedErrors = [], failed = await browser.newPage({ viewport: { width: 390, height: 844 } }); await instrument(failed, failedErrors); await loaded(failed); await goChapter(failed, 2);
    await failed.locator('#entry-album').click(); await failed.route('**/*echoes-placeholder*.webp', route => route.abort()); await failed.goBack();
    await failed.waitForFunction(() => document.body.dataset.homeStatus === 'error' && !document.body.dataset.homeRestoring && document.activeElement?.id === 'entry-album');
    result.failed = { state: await failed.evaluate(() => window.__read(window.__motion)), expectedErrors: failedErrors };
    check('failed scene clears restore gate and restores native focus', result.failed.state.mainVisibility === 'visible' && !result.failed.state.items[2].inert); await failed.close();
    check('no unexpected page errors', result.errors.length === 0, result.errors);
  } catch (error) { result.fatal = error.stack; console.error(error.stack); }
  finally { await browser.close(); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ checks: result.checks, fatal: result.fatal, errors: [...new Set(result.errors)] }));
    if (result.fatal || result.checks.some(x => !x.pass)) process.exitCode = 1; }
})();
