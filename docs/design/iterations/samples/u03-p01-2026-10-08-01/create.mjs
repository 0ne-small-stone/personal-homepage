import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = new URL('./', import.meta.url);
await mkdir(new URL('marks/', root), { recursive: true });
await mkdir(new URL('fonts/', root), { recursive: true });
const fontDirectory = process.argv[2];
if (!fontDirectory) throw new Error('Provide the existing canvas-fonts directory as the first argument.');
await copyFile(resolve(fontDirectory, 'InstrumentSans-Regular.ttf'), new URL('fonts/instrument-sans.ttf', root));
await copyFile(resolve(fontDirectory, 'InstrumentSans-OFL.txt'), new URL('fonts/OFL.txt', root));
const candidates = [
  {
    id: 'a', name: 'Still', file: 'a-still',
    short: '水流经过，小石仍在原处。',
    meaning: '一块被时间磨圆的石头，低处留着一道水流经过的痕迹。周围的流动改变了它的轮廓，却没有带走它：学习、创作与生活持续发生，小石依旧在这。',
    extension: '适合成为长期使用的个人标识。往后可让一束光沿着内侧刻痕走过，石头本身保持不动。',
    note: '偏实体、温柔；以轮廓记住“小石”，含义最贴近昵称。',
    svg: `<defs><mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160"><rect width="160" height="160" fill="white"/><path d="M13 99 C43 109 81 101 111 83" fill="none" stroke="black" stroke-width="12" stroke-linecap="round"/></mask></defs><path d="M33 51 C52 29 98 23 121 44 C141 61 146 92 129 113 C111 137 61 139 37 120 C15 104 14 73 33 51Z" fill="currentColor" mask="url(#cut)"/>`
  },
  {
    id: 'b', name: 'Echo', file: 'b-echo',
    short: '声音远去，回应仍在继续。',
    meaning: '一个小石核和两道错开的回声。线条并不封闭，给后来的人留下接续的位置；作者暂时不在，留下的声音仍能抵达别人。',
    extension: '适合音乐、文字与交流共同构成的个人网站。后续可以让外圈缓慢展开，中心保持稳定。',
    note: '偏流动、辽阔；五款里最有音乐感。',
    svg: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M131 104 C109 132 50 139 29 108 C9 78 35 34 73 25 C109 16 143 39 140 68" stroke-width="11"/><path d="M112 86 C109 105 78 119 58 107 C38 94 49 65 70 54 C91 43 112 51 115 66" stroke-width="10"/></g><path d="M76 74 C83 68 94 73 96 80 C98 88 90 96 81 94 C72 92 70 81 76 74Z" fill="currentColor"/>`
  },
  {
    id: 'c', name: 'Through', file: 'c-through',
    short: '光改变方向，仍然向前。',
    meaning: '一道路径经过柔角三角体，改变方向后继续延伸。折射不靠彩虹装饰表现，而是让光真正切开轮廓，成为图形结构的一部分。',
    extension: '适合与首页棱镜和导航光路相连。可先显出光的路径，再让剩余形体被照见。',
    note: '偏概念、方向感；与现有首页叙事联系最直接。',
    svg: `<defs><mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160"><rect width="160" height="160" fill="white"/><path d="M9 97 L77 87 Q82 86 87 82 L151 48" fill="none" stroke="black" stroke-width="15" stroke-linejoin="round"/></mask></defs><path d="M71 31 Q80 17 89 32 L137 117 Q145 132 127 132 H32 Q16 132 24 117Z" fill="currentColor" mask="url(#cut)"/><path d="M9 97 L28 94 M130 59 L150 48" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>`
  },
  {
    id: 'd', name: 'Threshold', file: 'd-threshold',
    short: '墙有了开口，因为有人在。',
    meaning: '一块厚实的墙体让出一个开口，小石静静留在里面。边界开始允许靠近，空出来的部分反而成为存在的证明。',
    extension: '适合强调个人空间和访客留痕。后续可把负形开口延伸为页面入口或留言展开的遮罩。',
    note: '偏空间、陪伴；更像一个可以走近的地方。',
    svg: `<path d="M29 53 Q29 27 55 27 H105 Q131 27 131 53 V120 Q131 134 117 134 H103 V80 Q103 57 80 57 Q57 57 57 80 V134 H43 Q29 134 29 120Z" fill="currentColor"/><path d="M71 109 C76 104 86 104 91 110 C97 116 92 125 84 126 C74 129 65 117 71 109Z" fill="currentColor"/>`
  },
  {
    id: 'e', name: 'LSSH', file: 'e-lssh',
    short: '把名字，写成一个安静的签名。',
    meaning: 'L、S、S、H 四个字母压缩为紧凑的双行字母标。圆润转折保持共同节奏，两枚 S 像连续的呼吸，让身份直接来自名字本身。',
    extension: '适合导航、页脚、文档落款与个人头像。后续可从双行字母标展开为完整网站名称。',
    note: '偏作者、签名；优先用于 32px 及以上，小尺寸需进一步光学校正。',
    svg: `<g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path d="M28 27 V63 Q28 71 36 71 H65"/><path d="M130 32 C122 23 92 23 91 38 C90 50 128 45 129 58 C131 74 101 78 91 68"/><path d="M66 94 C56 86 28 87 28 100 C28 115 65 107 66 121 C68 136 36 140 27 130"/><path d="M94 94 V136 M132 94 V136 M94 114 H132"/></g>`
  }
];
for (const item of candidates) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-labelledby="title" style="color:#ededed"><title id="title">LSSH ${item.name} logo candidate ${item.id.toUpperCase()}</title>${item.svg}</svg>\n`;
  await writeFile(new URL(`marks/${item.file}.svg`, root), svg);
}
await writeFile(new URL('candidates.json', root), JSON.stringify(candidates.map(({ svg, ...item }) => item), null, 2) + '\n');
const mark = (item, cls = '', size = '') => `<img class="mark ${cls}" src="marks/${item.file}.svg" alt="${item.id.toUpperCase()} ${item.name} 标志" ${size ? `width="${size}" height="${size}"` : ''}>`;
const cards = candidates.map(item => `<article class="candidate" id="${item.id}">
  <div class="candidate-heading"><span class="letter">${item.id.toUpperCase()}</span><h2>${item.name}</h2></div>
  <button class="mark-stage" data-open="${item.id}" aria-label="放大查看 ${item.id.toUpperCase()} ${item.name}">${mark(item)}</button>
  <p class="short">${item.short}</p>
  <div class="proof"><div>${mark(item,'',48)}<span>48</span></div><div>${mark(item,'',24)}<span>24</span></div><div>${mark(item,'',16)}<span>16 px</span></div><div class="reverse-proof">${mark(item,'',32)}<span>反白</span></div></div>
  <div class="mini-lockup">${mark(item,'',28)}<span>LSSH</span></div>
  <button class="view" data-open="${item.id}">查看 ${item.id.toUpperCase()} 的应用</button>
</article>`).join('');
const dialogs = candidates.map(item => `<dialog id="detail-${item.id}" aria-labelledby="detail-title-${item.id}">
  <div class="dialog-top"><p>${item.id.toUpperCase()} / ${item.name}</p><button class="close" aria-label="关闭详情">×</button></div>
  <div class="detail-grid"><div class="detail-art">${mark(item)}<div class="wordmark">Little Stone<br>Still Here</div></div>
  <div class="detail-copy"><h2 id="detail-title-${item.id}">${item.short}</h2><p>${item.meaning}</p><p>${item.extension}</p><p class="note">${item.note}</p><a href="marks/${item.file}.svg" download>下载 ${item.id.toUpperCase()} · SVG</a></div></div>
  <div class="application"><div class="nav-proof">${mark(item,'',32)}<b>LSSH</b><span>学习</span><span>展示</span><span>电台</span></div><div class="avatar-proof">${mark(item,'',56)}</div><div class="paper-proof">${mark(item,'',48)}<div>Little Stone<br>Still Here</div></div></div>
</dialog>`).join('');
await writeFile(new URL('index.html', root), `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LSSH · Five logo directions</title><link rel="stylesheet" href="review.css"></head><body>
<main><header class="masthead"><div><p class="eyebrow">Little Stone Still Here</p><h1>A small sign of presence.</h1></div><div class="header-tools"><p>Logo studies<br>08 October 2026</p><button id="theme" aria-pressed="false">切换浅底</button></div></header>
<section class="grid" aria-label="五个 Logo 候选">${cards}</section>
<footer><p>五种方向，同一个名字。点击图形查看大图与应用。</p><p>候选 A—E · 尚未定稿</p></footer></main>${dialogs}<script src="review.js"></script></body></html>`);
console.log('Created five SVG candidates and their review board.');
