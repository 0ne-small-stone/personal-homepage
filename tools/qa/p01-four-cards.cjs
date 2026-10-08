const { chromium } = require(process.env.LSSH_QA_PLAYWRIGHT || 'playwright');
const fs = require('node:fs'), path = require('node:path');
const out = path.resolve('docs/design/iterations/evidence/u03-p01-2026-10-08-24');
const base = process.env.LSSH_QA_URL || 'http://127.0.0.1:4321/personal-homepage/';
fs.mkdirSync(out, { recursive: true });
const ids = ['projects', 'radio', 'album', 'links'];
const titles = ['Afterimage', 'Echoes', 'A moment remains', 'Elsewhere'];
async function instrument(page, errors) {
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.motionDiagnostics = 'true'; }, { once: true });
    document.addEventListener('lssh:motion', event => { window.__motion = event.detail; });
    window.__fourRead = () => {
      const m = window.__motion;
      const items = [...document.querySelectorAll('[data-work-item]')].map(section => {
        const cta = section.querySelector('.home-cta'), art = section.querySelector('.home-art');
        const own = getComputedStyle(cta), parent = getComputedStyle(section.querySelector('.home-chapter-viewport'));
        const rect = cta.getBoundingClientRect(), hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return { id: section.id, title: section.querySelector('h2').textContent, active: section.dataset.workActive === 'true',
          sectionInert: section.inert, ctaInert: cta.inert, opacity: Number(own.opacity), effectiveOpacity: Number(own.opacity) * Number(parent.opacity),
          hit: !!hit && (hit === cta || cta.contains(hit)), focus: document.activeElement === cta,
          href: cta.href, artVisibility: getComputedStyle(art).visibility };
      });
      return { time: performance.now(), y: scrollY, h: innerHeight, phase: m?.phase,
        active: m?.activeItem, index: m?.rendered.index, progress: m?.raw.works, snap: m?.snapActive,
        cards: m?.cards, items, focus: document.activeElement?.id,
        status: document.body.dataset.homeStatus, enhanced: document.body.classList.contains('home-enhanced'),
        loader: document.querySelectorAll('.home-loader').length, overflow: document.documentElement.scrollWidth > innerWidth };
    };
    window.__fourTrace = duration => {
      window.__trace = { rows: [], inputs: [], done: false };
      const wheel = event => window.__trace.inputs.push({ time: performance.now(), deltaY: event.deltaY, trusted: event.isTrusted });
      document.addEventListener('wheel', wheel, { passive: true });
      const end = performance.now() + duration;
      function frame(now) {
        const value = window.__fourRead();
        window.__trace.rows.push({ time: value.time, y: value.y, active: value.active, index: value.index, snap: value.snap,
          cards: value.cards?.map(x => [x.index, x.alpha, x.visible]),
          ctas: value.items.map(x => [x.active, x.opacity, x.effectiveOpacity, x.ctaInert, x.hit]) });
        if (now < end) requestAnimationFrame(frame);
        else { window.__trace.done = true; document.removeEventListener('wheel', wheel); }
      }
      requestAnimationFrame(frame);
    };
  });
}
async function ready(page) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.dataset.homeMotion === 'ready' && window.__motion?.cards.length === 4, { timeout: 25000 });
}
async function setY(page, y, wait = 2200) {
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y);
  await page.waitForTimeout(wait); return page.evaluate(() => window.__fourRead());
}
async function wheel(cdp, amount) { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: amount }); }
async function trace(page, cdp, commands, duration) {
  await page.evaluate(duration => window.__fourTrace(duration), duration);
  for (const command of commands) { await wheel(cdp, command.delta); await page.waitForTimeout(command.wait); }
  await page.waitForFunction(() => window.__trace.done, { timeout: duration + 4000 });
  return page.evaluate(() => window.__trace);
}
(async () => {
  const result = { date: new Date().toISOString(), url: base, errors: [], checks: [], desktop: [], mobile: [], returns: [], snaps: [] };
  const check = (name, pass, detail) => result.checks.push({ name, pass, detail });
  const browser = await chromium.launch({ executablePath: process.env.LSSH_QA_BROWSER, headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
  result.browser = browser.version(); result.renderer = 'SwiftShader'; result.pass = 'confirmation';
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await instrument(p, result.errors); await ready(p);
    for (let index = 0; index < 4; index++) {
      const value = await setY(p, (index + 2) * 900 + 100);
      result.desktop.push(value); await p.screenshot({ path: path.join(out, `desktop-${ids[index]}.png`) });
      check(`desktop rest ${ids[index]}`, value.active === index && Math.abs(value.index - index - 1) < .002 &&
        value.items[index].title === titles[index] && value.items[index].effectiveOpacity === 1 && !value.items[index].ctaInert && value.items[index].hit &&
        value.cards.length === 4 && value.cards[index].visible && value.cards[index].alpha > .99 && value.items.every(x => x.artVisibility === 'hidden') && !value.overflow);
    }
    console.log('four cards: desktop rests captured');
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await instrument(mobile, result.errors); await ready(mobile);
    for (let index = 0; index < 4; index++) {
      const value = await setY(mobile, (index + 2) * 844 + 100); result.mobile.push(value);
      await mobile.screenshot({ path: path.join(out, `mobile-${ids[index]}.png`) });
      check(`mobile rest ${ids[index]}`, value.active === index && Math.abs(value.index - index - 1) < .002 &&
        value.items[index].effectiveOpacity === 1 && !value.items[index].ctaInert && value.items[index].hit && value.cards[index].alpha > .99 && !value.overflow);
    }
    await mobile.close(); console.log('four cards: mobile rests captured');
    const cdp = await p.context().newCDPSession(p);
    await setY(p, 1300);
    result.forward = await trace(p, cdp, Array.from({ length: 5 }, () => ({ delta: 720, wait: 250 })), 4200);
    result.backward = await trace(p, cdp, Array.from({ length: 5 }, () => ({ delta: -720, wait: 250 })), 4200);
    for (const direction of ['forward', 'backward']) {
      const value = result[direction];
      check(`${direction} visits all four`, [0, 1, 2, 3].every(index => value.rows.some(row => row.active === index)) && value.inputs.length === 5 && value.inputs.every(x => x.trusted));
      check(`${direction} CTA exclusivity`, value.rows.every(row => row.ctas.every((cta, index) => !cta[4] || (row.active === index && cta[0] && cta[2] > 0 && !cta[3]))));
    }
    console.log('four cards: forward and reverse captured');
    for (const [index, delta] of [[1, 160], [2, -160]]) {
      const center = (index + 2) * 900 + 100; await setY(p, center);
      const value = await trace(p, cdp, [{ delta, wait: 50 }], 4500);
      const end = await p.evaluate(() => window.__fourRead()); result.snaps.push({ index, center, delta, trace: value, end });
      check(`snap near ${ids[index]}`, value.rows.some(row => row.snap) && Math.abs(end.y - center) < 2 && end.active === index, { endY: end.y, snapFrames: value.rows.filter(x => x.snap).length });
    }
    await setY(p, 2800); await p.evaluate(() => window.__fourTrace(5500)); await wheel(cdp, 200);
    await p.waitForFunction(() => window.__motion?.snapActive, { timeout: 5000 });
    result.interruptBefore = await p.evaluate(() => window.__fourRead()); await wheel(cdp, -240);
    await p.waitForFunction(() => !window.__motion?.snapActive);
    result.interruptImmediate = await p.evaluate(() => window.__fourRead());
    await p.waitForFunction(() => window.__trace.done); result.interruption = await p.evaluate(() => window.__trace);
    const secondInput = result.interruption.inputs[1];
    check('new input interrupts active snap', result.interruptBefore.snap && !result.interruptImmediate.snap &&
      result.interruption.rows.some(row => row.time > secondInput.time && !row.snap && Math.abs(row.y - result.interruptBefore.y) > 30));
    await cdp.detach(); console.log('four cards: snap and interruption captured');
    for (let index = 1; index < 4; index++) {
      const y = (index + 2) * 900 + 100; await setY(p, y);
      await p.locator(`#entry-${ids[index]}`).focus(); await p.locator(`#entry-${ids[index]}`).click();
      const url = p.url(), expected = ['showcase', 'music', 'gallery', 'links'][index];
      await p.goBack({ waitUntil: 'domcontentloaded' });
      await p.waitForFunction(index => document.body.dataset.homeMotion === 'ready' &&
        document.activeElement?.id === `entry-${['projects', 'radio', 'album', 'links'][index]}` && Math.abs(window.__motion?.rendered.index - index - 1) < .002, index);
      const value = await p.evaluate(() => window.__fourRead()); result.returns.push({ index, target: url, value });
      check(`route and return ${ids[index]}`, url.endsWith(`/${expected}/`) && Math.abs(value.y - y) < 1 && value.active === index &&
        value.items[index].focus && value.items[index].effectiveOpacity === 1 && !value.items[index].ctaInert && value.loader === 0);
      await p.screenshot({ path: path.join(out, `return-${ids[index]}.png`) });
    }
    console.log('four cards: three real routes returned');
    const native = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    await native.goto(base);
    result.noJs = await native.locator('[data-work-item]').evaluateAll(sections => sections.map(section => ({ id: section.id, inert: section.inert, cta: section.querySelector('.home-cta').href, art: getComputedStyle(section.querySelector('.home-art')).visibility })));
    check('no JS preserves four native entries', result.noJs.length === 4 && result.noJs.every(x => !x.inert && x.art === 'visible'));
    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await instrument(reduced, result.errors); await reduced.goto(base); await reduced.waitForFunction(() => document.body.classList.contains('home-quiet'));
    result.reduced = await reduced.evaluate(() => window.__fourRead());
    check('reduced motion preserves native art and CTAs', result.reduced.items.every(x => x.artVisibility === 'visible' && !x.sectionInert && !x.ctaInert));
    const failedErrors = [];
    const failed = await browser.newPage({ viewport: { width: 390, height: 844 } }); await instrument(failed, failedErrors);
    await failed.route('**/*echoes-placeholder*.webp', route => route.abort()); await failed.goto(base);
    await failed.waitForFunction(() => document.body.dataset.homeStatus === 'error', { timeout: 15000 });
    result.failedAsset = { state: await failed.evaluate(() => window.__fourRead()), expectedErrors: failedErrors };
    check('asset failure keeps native album title and route', !result.failedAsset.state.enhanced && result.failedAsset.state.items[2].title === titles[2] &&
      !result.failedAsset.state.items[2].sectionInert && result.failedAsset.state.items[2].href.endsWith('/gallery/'));
    check('no unexpected script errors', result.errors.length === 0, result.errors);
  } catch (error) { result.fatal = error.stack; console.error(error.stack); }
  finally { await browser.close(); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ checks: result.checks.map(({ name, pass, detail }) => ({ name, pass,
      detail: name === 'no unexpected script errors' ? undefined : detail })), fatal: result.fatal,
      errorCount: result.errors.length, uniqueErrors: [...new Set(result.errors)] }));
    if (result.fatal || result.checks.some(x => !x.pass)) process.exitCode = 1; }
})();
