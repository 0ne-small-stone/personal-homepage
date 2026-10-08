const fs = require('node:fs'), path = require('node:path');
const { PNG } = require(process.env.LSSH_QA_PNGJS || 'pngjs');
const out = path.resolve('docs/design/iterations/evidence/u03-p01-2026-10-08-28');
const before = JSON.parse(fs.readFileSync(path.join(out, 'before/capture.json'))), after = JSON.parse(fs.readFileSync(path.join(out, 'after/capture.json')));
function fixed(item) { const s = item.state, m = s.motion; return { y: s.y, viewport: s.viewport, dpr: s.dpr, canvas: s.canvas, raw: m.raw, rendered: m.rendered, camera: m.camera, glass: m.glass }; }
function stats(image, rect) { let sum = 0, min = 255, max = 0; for (let y = rect[1]; y < rect[3]; y++) for (let x = rect[0]; x < rect[2]; x++) {
  const i = (y * image.width + x) * 4, value = (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3;
  sum += value; min = Math.min(min, value); max = Math.max(max, value);
} return { meanRGB: sum / ((rect[2] - rect[0]) * (rect[3] - rect[1])), minRGB: min, maxRGB: max }; }
const result = { method: 'Original PNG RGB; glass bounds expanded 2px. No image edits/resampling.', cases: [], pass: true };
const runtimeValid = (item, tone) => !item.errors.length && !item.failed.length && item.state.material.toneMapped === tone &&
  item.state.material.compiledToneDefine === tone && item.state.material.colorspaceChunk && item.state.material.mixUnchanged &&
  item.state.material.environmentMatches && item.state.renderer.toneMapping === 4 && item.state.renderer.exposure === 1 && item.state.renderer.error === 0;
for (const old of before.cases) {
  const current = after.cases.find(item => item.name === old.name);
  const a = PNG.sync.read(fs.readFileSync(path.join(out, 'before', old.file))), b = PNG.sync.read(fs.readFileSync(path.join(out, 'after', current.file)));
  const bounds = old.state.motion.glass.bounds, box = [Math.floor(bounds[0]) - 2, Math.floor(bounds[1]) - 2, Math.ceil(bounds[2]) + 2, Math.ceil(bounds[3]) + 2];
  let changed = 0, max = 0, count = 0;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) { if (x >= box[0] && x < box[2] && y >= box[1] && y < box[3]) continue;
    count++; const i = (y * a.width + x) * 4, delta = [0, 1, 2].map(channel => Math.abs(a.data[i + channel] - b.data[i + channel]));
    if (delta.some(value => value > 0)) changed++; max = Math.max(max, ...delta);
  }
  const rects = old.spec.y === 0 ? { top: [700, 250, 740, 290], lower: [680, 655, 760, 680] } : { top: [720, 270, 740, 295], lower: [640, 630, 700, 650] };
  const item = { name: old.name, beforeBundle: old.bundle, afterBundle: current.bundle,
    sameState: JSON.stringify(fixed(old)) === JSON.stringify(fixed(current)), sameResources: JSON.stringify(old.resources) === JSON.stringify(current.resources),
    excludedGlassBounds: box, outside: { pixels: count, changedPixels: changed, maxChannelDifference: max },
    samples: Object.fromEntries(Object.entries(rects).map(([name, rect]) => [name, { rect, before: stats(a, rect), after: stats(b, rect) }])) };
  item.runtimeValid = runtimeValid(old, true) && runtimeValid(current, false);
  item.pass = item.runtimeValid && item.sameState && item.sameResources && !changed && Object.values(item.samples).every(sample => sample.after.meanRGB > sample.before.meanRGB);
  result.cases.push(item); result.pass &&= item.pass;
}
result.live = after.cases.find(item => !item.fixed);
result.pass &&= !!result.live && runtimeValid(result.live, false) && !result.live.state.overflow;
fs.writeFileSync(path.join(out, 'comparison.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ pass: result.pass, cases: result.cases }, null, 2)); if (!result.pass) process.exitCode = 1;
