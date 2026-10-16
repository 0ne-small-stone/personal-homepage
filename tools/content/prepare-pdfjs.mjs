import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

// Keep the fixed upstream sources and license; generate smaller runtime copies.
const files = ['build/pdf.mjs', 'build/pdf.worker.mjs', 'build/pdf.sandbox.mjs', 'web/viewer.mjs'];
let original = 0, runtime = 0;
for (const file of files) {
  const path = resolve('public/pdfjs', file);
  const source = await readFile(path, 'utf8');
  const notice = source.match(/^\/\*\*[\s\S]*?\*\//)?.[0];
  if (!notice?.includes('Mozilla Foundation') || !notice.includes('Apache License')) throw new Error('Missing PDF.js license: ' + file);
  const result = await transform(source, { loader: 'js', format: 'esm', target: 'es2022', minify: true, legalComments: 'inline', banner: notice });
  const output = path.replace(/\.mjs$/, '.min.mjs');
  await writeFile(output, result.code);
  original += Buffer.byteLength(source); runtime += Buffer.byteLength(result.code);
}
console.log(JSON.stringify({pdfjs: '6.4.299', files: files.length, original, runtime, saved: original - runtime}));
