import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../../package.json', import.meta.url));
const { parse } = require('yaml');
const hash = (data) => createHash('sha256').update(data).digest('hex');
const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);

// Check the published result, including base URLs and byte-for-byte attachment copies.
export function inspectPublicPdfs(root = process.cwd(), output = join(root, 'dist')) {
  const content = join(root, 'src/content/docs');
  const results = [];
  for (const file of files(content).filter((path) => /\.mdx?$/.test(path))) {
    const text = readFileSync(file, 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    if (!frontmatter) continue;
    const entry = parse(frontmatter);
    const source = entry.source;
    if (entry.draft || source?.format !== 'pdf' || !source.file) continue;
    assert.match(source.file, /^materials\/[a-z0-9-]+\.pdf$/, `${file}: unsafe public path`);
    assert.match(source.sha256 ?? '', /^[a-f0-9]{64}$/, `${file}: missing public checksum`);
    const original = readFileSync(join(root, 'public', source.file));
    const published = readFileSync(join(output, source.file));
    assert.equal(original.byteLength, source.bytes, `${file}: size mismatch`);
    assert.equal(hash(original), source.sha256, `${file}: source checksum mismatch`);
    assert.deepEqual(published, original, `${file}: published attachment changed`);
    const route = relative(content, file).replaceAll('\\', '/').replace(/\.mdx?$/, '');
    const html = readFileSync(join(output, route, 'index.html'), 'utf8');
    const url = `/personal-homepage/${source.file}`;
    const viewer = `/personal-homepage/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`;
    assert(html.includes(`src="${viewer}"`), `${file}: missing prefixed viewer`);
    assert(html.includes(`href="${url}" download=`), `${file}: missing download`);
    const noscript = html.match(/<noscript>[\s\S]*?<\/noscript>/)?.[0] ?? '';
    assert(noscript.includes(`href="${url}"`), `${file}: missing native fallback`);
    assert(html.includes(`data-pages="${source.pages}"`), `${file}: page metadata mismatch`);
    results.push({ entryId: entry.entryId, route, file: source.file, pages: source.pages, bytes: original.byteLength, sha256: hash(published) });
  }
  assert(results.length > 0, 'No published public PDFs found.');
  return { publicPdfs: results.length, containsLocalPreviewPdfs: existsSync(join(output, 'local-materials')), result: 'passed', files: results };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(JSON.stringify(inspectPublicPdfs(resolve(process.argv[2] ?? '.'))));
}
