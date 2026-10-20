import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// Check generated pages: URL prefix and current destination are release risks.
const root = resolve(process.argv[2] ?? 'dist');
const targets = ['knowledge/', 'showcase/', 'links/', 'music/', 'about/', 'guestbook/'];
const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
const pages = files(root).filter((file) => file.endsWith('.html') &&
  !relative(root, file).replaceAll('\\', '/').startsWith('pdfjs/'));
assert(pages.length > 0, 'No website HTML pages found. Run npm run build first.');
let currentPages = 0;
let currentLocations = 0;
let immersiveGalleryPages = 0;
let compactHeaders = 0;
const sectionLandings = new Set();
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const route = relative(root, file).replaceAll('\\', '/').replace(/index\.html$/, '');
  if ([...targets, 'zh/about/'].includes(route)) sectionLandings.add(route);
  assert(!html.includes('/personal-homepage/personal-homepage/'), `Repeated base: ${relative(root, file)}`);
  // Validate actual built destinations for both the legacy directory and F08 headers.
  for (const match of html.matchAll(/<a\b[^>]*href="(\/personal-homepage\/[^"#]*)/g)) {
    const path = decodeURIComponent(new URL(match[1].replaceAll('&amp;', '&'), 'https://example.org').pathname).slice('/personal-homepage/'.length);
    assert(existsSync(join(root, path.endsWith('/') ? path + 'index.html' : path)), `Missing internal destination ${match[1]} in ${route}`);
  }
  if (route === 'about/' || route === 'zh/about/') {
    const english = route === 'about/';
    const other = english ? 'zh/about/' : 'about/';
    assert(html.includes(`lang="${english ? 'en' : 'zh-CN'}"`), `Incorrect Someone language: ${route}`);
    const switchLink = html.match(/<a\b[^>]*data-language-switch[^>]*>/)?.[0];
    assert(switchLink?.includes(`href="/personal-homepage/${other}"`), `Missing reciprocal language link: ${route}`);
    const article = html.match(/<article\b[^>]*class="someone-page"[\s\S]*?<\/article>/)?.[0];
    assert(article && !/<img\b|someone-portrait|mailto:|class="someone-copy"/.test(article), `Old portrait or email action returned: ${route}`);
    assert(article.includes('href="https://github.com/0ne-small-stone"'), `Missing GitHub contact: ${route}`);
    assert(/<button\b[^>]*data-copy-email="3400489513@qq.com"[^>]*>[\s\S]*?<svg\b/.test(article), `Missing email copy icon: ${route}`);
    assert(/<noscript>[\s\S]*?3400489513@qq.com[\s\S]*?<\/noscript>/.test(article), `Missing manual email fallback: ${route}`);
    if (english) assert(!/\p{Script=Han}/u.test(article), 'English Someone contains Chinese copy');
  }
  // The accepted P10 is a full-screen gallery, rather than a directory shell.
  // Validate its real entry points and published assets independently of headers.
  if (route === 'gallery/') {
    assert(html.includes('<title>A Moment Remains · Little Stone Still Here</title>'), 'Missing gallery identity');
    assert(/rel="canonical" href="https:\/\/0ne-small-stone\.github\.io\/personal-homepage\/gallery\/"/.test(html), 'Invalid gallery canonical/base');
    assert(/id="experience"/.test(html) && /id="dome-host"/.test(html) && /id="stage"/.test(html), 'Missing gallery interaction hosts');
    assert(/id="return"[^>]*aria-label="返回总览"/.test(html), 'Missing accessible overview return');
    assert(!/id="(?:journey|enter|selection|view-photo|zoom-in|zoom-out)"/.test(html), 'Removed gallery toolbar returned');
    assert(!html.includes('name="astro-view-transitions-enabled"'), 'Gallery must keep its native document lifecycle');
    const scripts = [...html.matchAll(/<script\b[^>]+src="([^"]+)"/g)].map(match => match[1]);
    assert(scripts.length > 0 && scripts.every(src => src.startsWith('/personal-homepage/_astro/')), 'Gallery modules need the project base');
    for (const src of scripts) assert(readFileSync(join(root, src.slice('/personal-homepage/'.length))).length > 0, `Missing gallery module: ${src}`);
    const photos = JSON.parse(readFileSync(join(root, 'gallery/manifest.json'), 'utf8'));
    assert.equal(photos.length, 101, 'Published gallery must contain the synchronized 101 photographs');
    assert.equal(new Set(photos.map(photo => photo.id)).size, photos.length, 'Gallery photo IDs must be unique');
    const noScript = html.match(/<noscript>[\s\S]*?<\/noscript>/)?.[0];
    assert(noScript, 'Gallery needs an accessible no-JS photo collection');
    for (const photo of photos) {
      assert(photo.width > 0 && photo.height > 0, `Invalid image ratio: ${photo.id}`);
      for (const key of ['image', 'full']) {
        assert(/^\.\/media\/photo-\d{2,}(?:-full)?\.webp$/.test(photo[key]), `Invalid photo URL: ${photo.id}`);
        assert(readFileSync(join(root, 'gallery', photo[key].slice(2))).length > 0, `Missing published photo: ${photo.id}/${key}`);
        assert(noScript.includes(`/personal-homepage/gallery/${photo[key].slice(2)}`), `Missing no-JS photo destination: ${photo.id}/${key}`);
      }
    }
    immersiveGalleryPages++;
    continue;
  }
  const nav = html.match(/<nav\b[^>]*aria-label="(?:全站目录|Site directory)"[\s\S]*?<\/nav>/)?.[0];
  if (!nav) {
    // F08 deliberately uses the shared three-link header plus original return
    // controls. Do not require the retired six-link footer on those pages.
    if (!route) {
      for (const chapter of ['intro', 'album', 'radio', 'projects', 'wall']) assert(html.includes(`href="#${chapter}"`), `Missing home chapter: ${chapter}`);
    } else {
      assert(/href="\/personal-homepage\/(?:#[^"]*)?"/.test(html), `Missing home return: ${route}`);
    }
    if (!/^guestbook(?:-client)?\/$/.test(route)) {
      for (const target of ['knowledge/', 'links/', 'about/']) assert(html.includes(`href="/personal-homepage/${target}"`), `Missing shared header destination ${target} in ${route}`);
    }
    compactHeaders++;
    continue;
  }
  assert(nav, `Missing public directory: ${relative(root, file)}`);
  const links = [...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map((match) => ({
    href: match[1], current: match[0].match(/aria-current="([^"]+)"/)?.[1],
  }));
  const pageTargets = targets.map(target => target === 'about/' && route === 'zh/about/' ? 'zh/about/' : target);
  assert.deepEqual(links.map((link) => link.href), pageTargets.map((target) => '/personal-homepage/' + target), file);
  for (const [i, link] of links.entries()) {
    const expected = route === pageTargets[i] ? 'page' : route.startsWith(pageTargets[i]) ? 'location' : undefined;
    assert.equal(link.current, expected, `${relative(root, file)}: ${link.href}`);
    if (link.current === 'page') currentPages++;
    if (link.current === 'location') currentLocations++;
  }
}
assert.equal(sectionLandings.size, 7, 'All six section landing pages and Chinese Someone must exist.');
assert.equal(immersiveGalleryPages, 1, 'The immersive gallery must be built exactly once.');
console.log(JSON.stringify({ websiteHtml: pages.length, destinations: targets.length, sectionLandings: sectionLandings.size, compactHeaders, currentPages, currentLocations, immersiveGalleryPages, result: 'passed' }));
