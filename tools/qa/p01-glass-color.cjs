// P01 / T03.05: capture two builds; common fixed-pose and read-only runtime probe.
const { chromium } = require(process.env.LSSH_QA_PLAYWRIGHT || 'playwright');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const phase = process.env.LSSH_QA_PHASE || 'after';
const base = process.env.LSSH_QA_URL || 'http://127.0.0.1:4321/personal-homepage/';
const out = path.resolve(`docs/design/iterations/evidence/u03-p01-2026-10-08-28/${phase}`);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
fs.mkdirSync(out, { recursive: true });
const specs = [{ name: 'desktop-hero-front', y: 0, yaw: 0 }, { name: 'desktop-550-yaw35', y: 550, yaw: 35 }];
function init(fixed) {
  if (fixed) { window.__clock = 0; Object.defineProperty(performance, 'now', { configurable: true, value: () => window.__clock }); }
  document.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.motionDiagnostics = 'true'; }, { once: true });
  document.addEventListener('lssh:motion', event => { window.__motion = event.detail; });
  sessionStorage.removeItem('lssh.home.paused'); sessionStorage.setItem('lssh.home.seen', 'true');
}
function read() {
  const q = window.__optics, gl = q.gl.getContext(), program = q.gl.properties.get(q.material).currentProgram;
  const fragment = program?.fragmentShader ? gl.getShaderSource(program.fragmentShader) : null;
  const env = q.material.uniforms.uEnvironment.value;
  return { clock: window.__clock ?? null, y: scrollY, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
    canvas: [document.querySelector('canvas').width, document.querySelector('canvas').height], motion: window.__motion,
    material: { toneMapped: q.material.toneMapped, colorspaceChunk: q.material.fragmentShader.includes('#include <colorspace_fragment>'),
      toneChunk: q.material.fragmentShader.includes('#include <tonemapping_fragment>'),
      compiledToneDefine: fragment === null ? null : /^#define TONE_MAPPING\b/m.test(fragment),
      mixUnchanged: q.material.fragmentShader.includes('mix(transmitted, light, 0.015 + edge * 0.82)'),
      environmentMatches: env === q.reflectionScene.environment, cube: !!env.isCubeTexture,
      cubeDimensions: env.image?.map(image => [image.width, image.height]) },
    renderer: { toneMapping: q.gl.toneMapping, exposure: q.gl.toneMappingExposure, output: q.gl.outputColorSpace, error: gl.getError() },
    overflow: document.documentElement.scrollWidth > innerWidth };
}
(async () => {
  const report = { date: new Date().toISOString(), phase, url: base, method: 'Actual before/after builds. Common fixed quaternion and clock; read-only runtime probe; CSS hint animation paused equally.', cases: [] };
  const browser = await chromium.launch({ executablePath: process.env.LSSH_QA_BROWSER, headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
  report.browser = browser.version(); report.renderer = 'SwiftShader';
  async function capture(spec, fixed = true) {
    const context = await browser.newContext({ viewport: fixed ? { width: 1440, height: 900 } : { width: 390, height: 844 },
      deviceScaleFactor: 1, isMobile: !fixed, hasTouch: !fixed });
    const page = await context.newPage(), item = { name: spec.name, fixed, spec, errors: [], warnings: [], failed: [], resources: [] }, pending = [];
    report.cases.push(item);
    page.on('pageerror', error => item.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') item.errors.push(message.text()); if (message.type() === 'warning') item.warnings.push(message.text()); });
    page.on('requestfailed', request => item.failed.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (response.url().startsWith(new URL(base).origin) && response.request().resourceType() !== 'document' && !/\/HomeJourney\.[^/]+\.js/.test(response.url())) {
      pending.push(response.body().then(value => item.resources.push({ url: response.url(), sha256: hash(value), bytes: value.length, status: response.status() })));
    } });
    await page.addInitScript(init, fixed);
    await page.route('**/HomeJourney.*.js', async route => {
      const response = await route.fetch(), body = await response.body(); let code = body.toString('utf8');
      item.bundle = { url: response.url(), sha256: hash(body), bytes: body.length };
      if (fixed) {
        const neutral = code.match(/[\w$]+\.current\.quaternion\.slerp\([^;]+?\),/g);
        if (neutral?.length !== 1) throw new Error(`Quaternion anchor count: ${neutral?.length}`);
        const anchor = neutral[0], prefix = anchor.slice(0, anchor.indexOf('.quaternion')), yaw = spec.yaw * Math.PI / 180;
        code = code.replace(anchor, `${prefix}.quaternion.set(0,${Math.sin(yaw / 2)},0,${Math.cos(yaw / 2)}),`);
      }
      const probe = /([\w$]+)\.uniforms\.uScene\.value=([\w$]+)\.texture;let ([\w$]+)=([\w$]+)\.environment\?\?([\w$]+)\.environment;\3 instanceof ([\w$]+)&&\(\1\.uniforms\.uEnvironment\.value=\3\),([\w$]+)\.getDrawingBufferSize\(\1\.uniforms\.uResolution\.value\)/g;
      const matches = [...code.matchAll(probe)]; if (matches.length !== 1) throw new Error(`Runtime probe anchor count: ${matches.length}`);
      code = code.replace(probe, (all, material, target, environment, reflectionScene, scene, cube, renderer) =>
        `${all},globalThis.__optics={gl:${renderer},material:${material},target:${target},environment:${environment},reflectionScene:${reflectionScene},scene:${scene}}`);
      item.overrideSha256 = hash(code); await route.fulfill({ response, body: code });
    });
    try {
      item.http = (await page.goto(base, { waitUntil: 'domcontentloaded' })).status();
      await page.waitForFunction(() => document.body.dataset.homeMotion === 'ready' && document.body.classList.contains('home-enhanced') && window.__optics);
      await page.evaluate(() => document.fonts.ready);
      if (fixed) {
        await page.mouse.move(720, 450); await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), spec.y);
        for (let i = 0; i < 80; i++) await page.evaluate(() => new Promise(resolve => { window.__clock += 50; requestAnimationFrame(() => requestAnimationFrame(resolve)); }));
        await page.evaluate(() => { for (const animation of document.querySelector('.home-scroll svg')?.getAnimations() || []) { animation.pause(); animation.currentTime = 0; } });
      } else await page.waitForTimeout(1000);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      item.state = await page.evaluate(read); item.file = `${spec.name}.png`; await page.screenshot({ path: path.join(out, item.file) });
      await Promise.all(pending); item.resources.sort((a, b) => a.url.localeCompare(b.url));
      console.log(JSON.stringify({ phase, name: item.name, toneMapped: item.state.material.toneMapped, compiledToneDefine: item.state.material.compiledToneDefine,
        renderer: item.state.renderer, errors: item.errors, failed: item.failed.length }));
    } finally { await context.close(); }
  }
  try { for (const spec of specs) await capture(spec); if (phase === 'after') await capture({ name: 'mobile-live-hero' }, false); }
  catch (error) { report.fatal = error.stack; console.error(error.stack); }
  finally { await browser.close(); fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify(report, null, 2));
    if (report.fatal || report.cases.some(item => item.errors.length || item.failed.length || item.state.material.toneMapped !== (phase === 'before'))) process.exitCode = 1; }
})();
