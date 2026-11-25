import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { pagesBase, pagesSite } from '../ci/pages-site.mjs';

const root = resolve(process.argv[2] ?? 'dist');
const { DOMParser } = new JSDOM().window;
const htmlParser = new DOMParser();
const cards = [
  { path: 'about/', image: 'someone-en.png', title: 'Zhang Xuanshi', author: 'Zhang Xuanshi', summary: /AI hardware.*music/, locale: 'en_US', type: 'profile' },
  { path: 'zh/about/', image: 'someone-zh.png', title: '张轩石', author: '张轩石', summary: /AI 硬件.*音乐/, locale: 'zh_CN', type: 'profile' },
  { path: 'projects/suikong-desk/', image: 'suikong-desk.png', title: '随控 Desk', author: '张轩石', summary: /小石.*产品定义与品牌设计.*回放/, locale: 'zh_CN', type: 'article' },
];

function headOf(page) {
  const html = readFileSync(join(root, page, 'index.html'), 'utf8');
  return htmlParser.parseFromString(html, 'text/html').head;
}

for (const card of cards) {
  const head = headOf(card.path);
  function value(selector, attribute = 'content') {
    const tags = head.querySelectorAll(selector);
    assert.equal(tags.length, 1, `${card.path} requires exactly one ${selector}`);
    const result = tags[0].getAttribute(attribute);
    assert.ok(result?.trim(), `${card.path} has an empty ${selector}`);
    return result;
  }
  const canonical = new URL(`${pagesBase}${card.path}`, pagesSite).href;
  const image = new URL(`${pagesBase}share/${card.image}`, pagesSite).href;
  assert.equal(value('link[rel="canonical"]', 'href'), canonical);
  assert.equal(value('[property="og:url"]'), canonical);
  assert.equal(value('[property="og:type"]'), card.type);
  assert.equal(value('[property="og:locale"]'), card.locale);
  assert.equal(value('[property="og:site_name"]'), 'Little Stone Still Here');
  assert.ok(value('[property="og:title"]').includes(card.title));
  assert.equal(value('[name="author"]'), card.author);
  assert.match(value('[property="og:description"]'), card.summary);
  assert.equal(value('[property="og:image"]'), image);
  assert.equal(value('[property="og:image:type"]'), 'image/png');
  assert.equal(value('[name="twitter:card"]'), 'summary_large_image');
  for (const field of ['title', 'description', 'image', 'image:alt']) {
    assert.equal(value(`[name="twitter:${field}"]`), value(`[property="og:${field}"]`));
  }

  const png = readFileSync(join(root, 'share', card.image));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(value('[property="og:image:width"]'), String(png.readUInt32BE(16)));
  assert.equal(value('[property="og:image:height"]'), String(png.readUInt32BE(20)));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
}

for (const path of ['', 'showcase/', 'projects/little-stone-still-here/']) {
  assert.equal(headOf(path).querySelector('[property="og:image"], [name="twitter:card"]'), null, path);
}
console.log('分享卡片检查通过，覆盖双语 Someone、随控 Desk、三张 PNG 和三个相邻页面。');
