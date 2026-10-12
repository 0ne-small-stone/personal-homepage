// Narrow P01 / T03.02 browser evidence. No application test dependency.
const { chromium } = require(process.env.LSSH_QA_PLAYWRIGHT || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const phase = process.env.LSSH_QA_PHASE || 'after';
const base = process.env.LSSH_QA_URL || 'http://127.0.0.1:4321/personal-homepage/';
const out = path.resolve(`docs/design/iterations/evidence/u03-p01-2026-10-08-22/${phase}`);
fs.mkdirSync(out, { recursive: true });

async function instrument(page, errors) {
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.dataset.motionDiagnostics = 'true';
    }, { once: true });
    document.addEventListener('lssh:motion', event => { window.__motion = event.detail; });
    window.__visibilityRead = () => {
      const focus = document.activeElement;
      const describe = element => element?.id || element?.className || element?.tagName || null;
      const inspect = element => {
        if (!element) return null;
        const own = getComputedStyle(element);
        let ancestorOpacity = 1, hidden = false, inheritedInert = false;
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          ancestorOpacity *= Number(style.opacity);
          hidden ||= style.visibility === 'hidden' || style.display === 'none';
          inheritedInert ||= parent.inert;
        }
        const rect = element.getBoundingClientRect();
        const point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        const hit = document.elementFromPoint(point.x, point.y);
        return { opacity: Number(own.opacity), ancestorOpacity,
          effectiveOpacity: Number(own.opacity) * ancestorOpacity,
          visibility: own.visibility, inert: element.inert, inheritedInert,
          ariaHidden: element.getAttribute('aria-hidden'), hidden,
          hit: !!hit && (hit === element || element.contains(hit)), hitElement: describe(hit),
          focused: focus === element || element.contains(focus),
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
      };
      return { time: performance.now(), y: scrollY, height: innerHeight,
        focus: describe(focus), motion: window.__motion,
        enhanced: document.body.classList.contains('home-enhanced'),
        quiet: document.body.classList.contains('home-quiet'),
        status: document.body.dataset.homeStatus,
        hero: inspect(document.querySelector('#intro .home-chapter-viewport')),
        explore: inspect(document.querySelector('.home-scroll')),
        cta: inspect(document.querySelector('#entry-projects')),
        sectionInert: document.querySelector('#projects')?.inert,
        active: document.querySelector('#projects')?.dataset.workActive,
        loader: document.querySelectorAll('.home-loader').length,
        overflow: document.documentElement.scrollWidth > innerWidth };
    };
  });
}
async function ready(page) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.dataset.homeMotion === 'ready' && window.__motion, { timeout: 25000 });
}
async function at(page, y) {
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y);
  await page.waitForFunction(y => Math.abs(scrollY - y) < 1 && Math.abs(window.__motion?.scrollY - y) < 1, y);
  await page.waitForTimeout(250);
  return page.evaluate(() => window.__visibilityRead());
}
async function entryTrace(page) {
  await at(page, 1000);
  return page.evaluate(() => new Promise(resolve => {
    const rows = []; let started, triedFocus = false;
    const cta = document.querySelector('#entry-projects');
    const section = document.querySelector('#projects');
    document.querySelector('.home-brand').focus({ preventScroll: true });
    const observer = new MutationObserver(() => {
      if (started === undefined && section.dataset.workActive === 'true') {
        started = performance.now(); rows.push({ elapsed: 0, ...window.__visibilityRead() });
      }
    });
    observer.observe(section, { attributes: true, attributeFilter: ['data-work-active'] });
    const deadline = performance.now() + 3500;
    function frame(now) {
      if (started !== undefined) {
        // RAF's timestamp can precede the mutation microtask in the same frame.
        // Sample elapsed wall time here instead of subtracting those two clocks.
        const elapsed = performance.now() - started;
        if (elapsed >= 75 && !triedFocus) { cta.focus({ preventScroll: true }); triedFocus = true; }
        rows.push({ elapsed, triedFocus, ...window.__visibilityRead() });
        if (elapsed >= 500) { observer.disconnect(); resolve(rows); return; }
      }
      if (now > deadline) { observer.disconnect(); resolve(rows); return; }
      requestAnimationFrame(frame);
    }
    scrollTo({ top: 1451, behavior: 'instant' }); requestAnimationFrame(frame);
  }));
}

async function interruptTrace(page) {
  await at(page, 1000);
  return page.evaluate(() => new Promise(resolve => {
    const rows = []; let enteredAt, leftAt;
    const section = document.querySelector('#projects');
    const end = performance.now() + 3000;
    scrollTo({ top: 1451, behavior: 'instant' });
    function frame() {
      const now = performance.now();
      if (enteredAt === undefined && section.dataset.workActive === 'true') enteredAt = now;
      if (enteredAt !== undefined) {
        const row = { elapsed: now - enteredAt, ...window.__visibilityRead() }; rows.push(row);
        if (leftAt === undefined && now - enteredAt >= 100) {
          leftAt = now; scrollTo({ top: 1400, behavior: 'instant' });
        }
        if (leftAt !== undefined && now - leftAt >= 800) { resolve({ rows, leaveElapsed: leftAt - enteredAt }); return; }
      }
      if (now > end) { resolve({ rows, timeout: true }); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
}

(async () => {
  const result = { phase, date: new Date().toISOString(), url: base,
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    errors: [], desktop: [], mobile: [], checks: [] };
  const check = (name, pass, detail) => result.checks.push({ name, pass, detail });
  const browser = await chromium.launch({ executablePath: process.env.LSSH_QA_BROWSER,
    headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await instrument(page, result.errors); await ready(page);
    if (phase === 'confirm') {
      result.interruption = await interruptTrace(page);
      const before = result.interruption.rows.filter(x => x.elapsed <= result.interruption.leaveElapsed);
      const after = result.interruption.rows.filter(x => x.y === 1400 && x.active === 'false');
      check('leave during actual CTA delay', before.length > 0 && before.every(x => x.cta.opacity === 0 && x.cta.inert && !x.cta.hit), { leaveElapsed: result.interruption.leaveElapsed });
      check('no stale gate after interrupted delay', after.length > 0 && after.every(x => x.cta.inert && !x.cta.hit));
      result.reentryFrames = await entryTrace(page);
      check('interrupted timeline reenters correctly', result.reentryFrames.some(x => x.cta.effectiveOpacity > 0 && !x.cta.inert && x.cta.hit) &&
        result.reentryFrames.filter(x => x.cta.opacity === 0).every(x => x.cta.inert && !x.cta.hit));
      for (const y of [50, 100]) {
        await at(page, y);
        await page.evaluate(() => document.querySelector('.home-scene-controls button:last-child').focus({ preventScroll: true }));
        await page.keyboard.press('Tab');
        const state = await page.evaluate(() => window.__visibilityRead());
        result[`tabAt${y}`] = state;
        check(`actual Tab at identity ${y}`, y === 50 ? state.explore.focused : !state.explore.focused);
      }
      await at(page, 1000);
      await page.evaluate(() => {
        document.querySelector('.home-scene-controls button:last-child').focus({ preventScroll: true });
        scrollTo({ top: 1451, behavior: 'instant' });
      });
      await page.waitForFunction(() => document.querySelector('#projects').dataset.workActive === 'true');
      result.tabCtaBefore = await page.evaluate(() => window.__visibilityRead());
      await page.keyboard.press('Tab'); result.tabCtaAfter = await page.evaluate(() => window.__visibilityRead());
      check('actual Tab skips delayed CTA', result.tabCtaBefore.cta.opacity === 0 && result.tabCtaBefore.cta.inert && result.tabCtaAfter.focus !== 'entry-projects');
      check('no unexpected page errors', result.errors.length === 0, result.errors);
      return;
    }
    for (const y of [0, 50, 100, 325, 550]) {
      result.desktop.push({ target: y, ...await at(page, y) });
      await page.screenshot({ path: path.join(out, `desktop-${y}.png`) });
    }
    console.log(`${phase}: desktop points captured`);
    result.entryFrames = await entryTrace(page);
    await page.screenshot({ path: path.join(out, 'first-card-entered.png') });
    if (phase === 'after') {
      check('desktop identity mapping', result.desktop.every(x => {
        const q = Math.max(0, Math.min(1, x.y / 100));
        return Math.abs(x.hero.opacity - (1 - q * q * (3 - 2 * q))) < 0.001 &&
          x.hero.inert === (x.y >= 100) && x.hero.visibility === (x.y >= 100 ? 'hidden' : 'visible') &&
          x.hero.ariaHidden === (x.y >= 100 ? 'true' : null);
      }));
      const delay = result.entryFrames.filter(x => x.cta.opacity === 0);
      check('CTA delay blocks hit and focus', delay.length > 0 && delay.every(x => x.cta.inert && !x.cta.hit && !x.cta.focused), { frames: delay.length });
      check('CTA opens after own and ancestor opacity', result.entryFrames.some(x => x.cta.effectiveOpacity > 0 && !x.cta.inert && x.cta.hit));
      await at(page, 50); await page.locator('.home-scroll').click();
      await page.waitForFunction(() => scrollY > 1800); await page.waitForTimeout(1400);
      result.exploreClick = await page.evaluate(() => window.__visibilityRead());
      check('half-exited exploration click', page.url().endsWith('#projects') && result.exploreClick.active === 'true');
      await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => document.body.dataset.homeMotion === 'ready');
      await at(page, 50); await page.locator('.home-scroll').focus();
      result.focusBefore = await page.evaluate(() => window.__visibilityRead());
      result.focusAfter = await at(page, 100);
      check('identity focus threshold without scroll jump', result.focusBefore.explore.focused && result.focusAfter.focus === 'home-brand' && result.focusAfter.y === 100);
      await at(page, 50); await page.locator('#nav-knowledge').focus(); result.otherFocus = await at(page, 100);
      check('outside focus remains', result.otherFocus.focus === 'nav-knowledge');
      await at(page, 0);
      await page.evaluate(() => { window.__reverseRows = []; window.__receivedWheel = [];
        const end = performance.now() + 1800;
        const wheel = e => window.__receivedWheel.push({ time: performance.now(), deltaY: e.deltaY, trusted: e.isTrusted });
        document.addEventListener('wheel', wheel, { passive: true });
        function frame(now) { window.__reverseRows.push(window.__visibilityRead());
          if (now < end) requestAnimationFrame(frame); else document.removeEventListener('wheel', wheel); }
        requestAnimationFrame(frame); });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: 300 });
      await page.waitForTimeout(220);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: -300 });
      await page.waitForTimeout(1800); await cdp.detach();
      result.reverse = await page.evaluate(() => ({ frames: window.__reverseRows, received: window.__receivedWheel, final: window.__visibilityRead() }));
      check('trusted wheel reversal restores identity', result.reverse.received.length === 2 && result.reverse.received.every(x => x.trusted) &&
        result.reverse.frames.some(x => x.y >= 100 && x.hero.inert) && result.reverse.final.y < 1 && !result.reverse.final.hero.inert && result.reverse.final.hero.opacity > .99);
      await page.screenshot({ path: path.join(out, 'reverse-restored.png') });
      await at(page, 1451); await page.waitForTimeout(110); result.interruptBefore = await page.evaluate(() => window.__visibilityRead());
      await at(page, 1400); await page.waitForTimeout(700); result.interruptAfter = await page.evaluate(() => window.__visibilityRead());
      check('interrupted CTA remains gated', result.interruptAfter.cta.inert && !result.interruptAfter.cta.hit && !result.interruptAfter.cta.focused);
      result.reentryFrames = await entryTrace(page);
      check('reentry delay remains gated', result.reentryFrames.filter(x => x.cta.opacity === 0).every(x => x.cta.inert && !x.cta.hit));
      await at(page, 1900); await page.waitForTimeout(1000); result.rest = await page.evaluate(() => window.__visibilityRead());
      await page.screenshot({ path: path.join(out, 'first-card-rest.png') });
      await page.locator('#entry-projects').focus(); await page.locator('#entry-projects').click(); result.targetUrl = page.url();
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.body.dataset.homeMotion === 'ready' && document.activeElement?.id === 'entry-projects');
      result.returned = await page.evaluate(() => window.__visibilityRead());
      check('CTA route and return fully visible before focus', result.targetUrl.endsWith('/showcase/') && Math.abs(result.returned.y - 1900) < 1 &&
        result.returned.cta.focused && result.returned.cta.opacity === 1 && result.returned.cta.ancestorOpacity === 1 && !result.returned.cta.inert && result.returned.loader === 0);
      await page.screenshot({ path: path.join(out, 'first-card-return.png') });
      await at(page, 325); await page.getByRole('button', { name: '暂停动态', exact: true }).click();
      await page.waitForFunction(() => document.body.classList.contains('home-quiet') && !document.body.dataset.homeMotion);
      result.paused = await page.evaluate(() => window.__visibilityRead());
      check('pause clears identity and CTA hidden states', !result.paused.hero.inert && result.paused.hero.opacity === 1 && result.paused.hero.ariaHidden === null && !result.paused.cta.inert && result.paused.cta.ariaHidden === null);
      await page.getByRole('button', { name: '继续动态', exact: true }).click(); await page.waitForFunction(() => document.body.dataset.homeMotion === 'ready');
      await at(page, 325);
      await page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
      await page.waitForFunction(() => document.body.dataset.homeStatus === 'error' && !document.body.dataset.homeMotion);
      result.fallback = await page.evaluate(() => window.__visibilityRead());
      check('context failure clears hidden states', !result.fallback.enhanced && !result.fallback.hero.inert && result.fallback.hero.opacity === 1 && !result.fallback.cta.inert && result.fallback.cta.ariaHidden === null);
    }
    console.log(`${phase}: interaction checks captured`);
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await instrument(mobile, result.errors); await ready(mobile);
    for (const y of [0, 100, 550]) { result.mobile.push({ target: y, ...await at(mobile, y) }); await mobile.screenshot({ path: path.join(out, `mobile-${y}.png`) }); }
    if (phase === 'after') {
      check('mobile identity hidden in middle', result.mobile.every(x => !x.overflow && x.hero.inert === (x.y >= 100) && x.hero.opacity === (x.y >= 100 ? 0 : 1)));
      const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await instrument(reduced, result.errors); await reduced.goto(base); await reduced.waitForFunction(() => document.body.classList.contains('home-quiet'));
      result.reduced = await reduced.evaluate(() => window.__visibilityRead());
      check('reduced motion keeps native content', result.reduced.hero.opacity === 1 && !result.reduced.hero.inert && !result.reduced.cta.inert);
      const native = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
      await native.goto(base); result.noJs = await native.locator('.home-scroll').isVisible();
      check('no JS exploration remains visible', result.noJs);
      check('no unexpected page errors', result.errors.length === 0, result.errors);
    }
  } catch (error) { result.fatal = error.stack; console.error(error.stack); }
  finally {
    await browser.close(); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ phase, checks: result.checks, entryFrames: result.entryFrames?.length, fatal: result.fatal, errors: result.errors }));
    if (result.fatal || result.checks.some(x => !x.pass)) process.exitCode = 1;
  }
})();
