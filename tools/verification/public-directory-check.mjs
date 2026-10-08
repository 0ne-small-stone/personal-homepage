import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const nav = html.match(/<nav\b[^>]*aria-label="全站目录"[\s\S]*?<\/nav>/)?.[0];
  assert(nav, `Missing public directory: ${relative(root, file)}`);
  const links = [...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map((match) => ({
    href: match[1], current: match[0].match(/aria-current="([^"]+)"/)?.[1],
  }));
  assert.deepEqual(links.map((link) => link.href), targets.map((target) => '/personal-homepage/' + target), file);
  const route = relative(root, file).replaceAll('\\', '/').replace(/index\.html$/, '');
  for (const [i, link] of links.entries()) {
    const expected = route === targets[i] ? 'page' : route.startsWith(targets[i]) ? 'location' : undefined;
    assert.equal(link.current, expected, `${relative(root, file)}: ${link.href}`);
    if (link.current === 'page') currentPages++;
    if (link.current === 'location') currentLocations++;
  }
  assert(!html.includes('/personal-homepage/personal-homepage/'), `Repeated base: ${relative(root, file)}`);
}
assert.equal(currentPages, 6, 'All six section landing pages must exist.');
console.log(JSON.stringify({ websiteHtml: pages.length, destinations: targets.length, currentPages, currentLocations, result: 'passed' }));
