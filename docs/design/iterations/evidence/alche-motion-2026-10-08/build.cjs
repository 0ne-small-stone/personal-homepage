/* Research-only builder. Usage: node build.cjs <original clips-20261008 directory>
 * Copies selected JPEG bytes verbatim. No image transformation or network request.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = process.argv[2] && path.resolve(process.argv[2]);
if (!source || !fs.existsSync(path.join(source, 'clips.json'))) {
  throw new Error('Pass the original clips-20261008 directory containing clips.json.');
}
const destination = __dirname;
const raw = JSON.parse(fs.readFileSync(path.join(source, 'clips.json'), 'utf8'));
const sampleSeconds = 0.15;
const descriptions = {
  loading: ['加载与首屏', ['进入首页，等 DOMContentLoaded。', '等待 9.5 秒；若声音提示可见，选择不开声音。', '继续记录 1.2 秒。'], '起录包含导航等待。它不是一次固定时长的加载动画。'],
  pointer: ['指针推动与回正', ['起录前移到桌面中心 (720, 450)，等待 600ms。', '移到 (1120, 240)，分 5 步，等待 1.4 秒。', '移到 (290, 590)，分 28 步，等待 1.8 秒。'], '坐标按原桌面视口 1440 × 900，截图不含鼠标光标。'],
  buttons: ['导航与按钮悬停', ['悬停顶部 News，等待 900ms。', '移出到 (700, 800)，等待 250ms。', '悬停 Contact，等待 650ms；再次移出，等待 550ms。'], '对照文字扰码与双行上滚。动作时间只作为复现步骤。'],
  'intro-forward-reverse': ['序章滚动与反向', ['向下滚动 10 次，每次 +210，间隔 160ms。', '等待 1.6 秒。', '向上滚动 5 次，每次 −240，间隔 130ms；等待 1.4 秒。'], '查看原 scrollY 和时间戳，比较正向、停顿与反向响应。'],
  'works-to-light': ['作品进入明亮章节', ['即时滚到 scrollY = 6550，等待 1 秒。', '向下滚动 14 次，每次 +180，间隔 140ms。', '等待 1.6 秒。'], '片段开头保留了起录时的画面，随后包含程序滚动跳转。'],
  'route-works-return': ['作品路由与返回', ['起录前回到首页顶部，等待 650ms。', '点击顶部 Works，等地址进入 /works，再等待 2 秒。', '浏览器返回，等 DOMContentLoaded，再等待 3 秒。'], '记录真实路由和返回。网络等待会影响实际持续时间。'],
  'mobile-menu': ['手机菜单开关', ['手机视口 390 × 844；进入首页后等待 6.5 秒。', '若声音提示可见，选择不开声音。', '点击菜单，等待 1 秒；再次点击，等待 800ms。'], '竖屏原图按比例显示；没有裁切、重绘或补帧。'],
};
let totalBytes = 0;
const clips = raw.clips.map(clip => {
  const frames = clip.frames;
  if (!frames.length || !descriptions[clip.name]) throw new Error(`Unknown or empty clip: ${clip.name}`);
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].timestamp < frames[i - 1].timestamp) throw new Error(`Unordered timestamps: ${clip.name}`);
  }
  const selected = new Set([0, frames.length - 1]);
  let cursor = 0;
  for (let t = frames[0].timestamp; t < frames.at(-1).timestamp; t += sampleSeconds) {
    while (cursor + 1 < frames.length && Math.abs(frames[cursor + 1].timestamp - t) < Math.abs(frames[cursor].timestamp - t)) cursor++;
    selected.add(cursor);
  }
  const [title, steps, note] = descriptions[clip.name];
  const outDir = path.join(destination, 'frames', clip.name);
  fs.mkdirSync(outDir, { recursive: true });
  const kept = [...selected].sort((a, b) => a - b).map(i => {
    const frame = frames[i];
    if (path.basename(frame.file) !== frame.file) throw new Error('Frame filename must be a basename.');
    const input = path.join(source, clip.name, frame.file);
    const output = path.join(outDir, frame.file);
    const bytes = fs.readFileSync(input);
    fs.copyFileSync(input, output);
    const hash = value => crypto.createHash('sha256').update(value).digest('hex');
    const sha256 = hash(bytes);
    if (hash(fs.readFileSync(output)) !== sha256) throw new Error(`Copy changed: ${output}`);
    totalBytes += bytes.length;
    return { ...frame, sourceIndex: i, file: `frames/${clip.name}/${frame.file}`, bytes: bytes.length, sha256 };
  });
  return { name: clip.name, title, steps, note, originalCount: frames.length, start: frames[0].timestamp,
    end: frames.at(-1).timestamp, duration: frames.at(-1).timestamp - frames[0].timestamp, frames: kept };
});
const manifest = { capturedAt: raw.date, sourceUrl: raw.url, renderer: '真实 Chrome，软件 WebGL',
  sampling: { targetIntervalMs: sampleSeconds * 1000, method: '最近原始时间戳；每段强制保留首末帧', imageTransformation: 'none' },
  capture: { desktopViewport: [1440, 900], mobileViewport: [390, 844], cdpJpegQuality: 60, maxFrameSize: [960, 600], everyNthFrame: 3 },
  sourceErrors: raw.errors || [], limitations: ['原始采集为软件 WebGL，不作为 FPS 或真机性能基准。',
    '原始 JPEG 经时间抽帧，未重新编码；没有声音轨道，鼠标光标未包含在截图内。',
    '动作步骤来自采集脚本；没有逐事件时间戳，不将脚本等待时间当作精确动作节点。',
    '只用于视觉与交互研究，非本站产品资产；原站图像和品牌归原权利方。'],
  totalFrames: clips.reduce((sum, clip) => sum + clip.frames.length, 0), jpegBytes: totalBytes, clips };
if (totalBytes >= 12 * 1024 * 1024) throw new Error('Selected JPEGs exceed 12 MiB.');
fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const template = fs.readFileSync(path.join(destination, 'player-template.html'), 'utf8');
const json = JSON.stringify(manifest).replace(/</g, '\\u003c');
fs.writeFileSync(path.join(destination, 'index.html'), template.replace('<!-- EMBED_MANIFEST -->', `<script id="manifest" type="application/json">${json}</script>`));
console.log(JSON.stringify({ clips: clips.length, frames: manifest.totalFrames, jpegBytes: totalBytes,
  jpegMiB: +(totalBytes / 1048576).toFixed(3), copiedBytesVerified: true }, null, 2));
