import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { build } from 'esbuild';

const source = path.dirname(fileURLToPath(import.meta.url));
const root = fileURLToPath(new URL('../../../../../../', import.meta.url));
const output = path.join(root, '.local-tools', 'sphere-canvas', 'site');
const originals = path.join(root, '图片');
await fs.mkdir(path.join(output, 'media'), { recursive: true });
const files = (await fs.readdir(originals)).filter(name => /\.(jpe?g|png|webp)$/i.test(name)).sort();
if (!files.length) throw new Error('图片目录没有可用样本。');
const manifest = [];
for (const [index, name] of files.entries()) {
  const image = sharp(path.join(originals, name)).rotate();
  const metadata = await image.metadata();
  const stem = `photo-${String(index + 1).padStart(2, '0')}`;
  await image.clone().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(output, 'media', `${stem}.webp`));
  await image.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(output, 'media', `${stem}-full.webp`));
  const rotated = [5, 6, 7, 8].includes(metadata.orientation);
  manifest.push({ id: stem, title: `影像 ${String(index + 1).padStart(2, '0')}`, width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height, image: `./media/${stem}.webp`, full: `./media/${stem}-full.webp` });
}
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest));
await fs.copyFile(path.join(source, 'index.html'), path.join(output, 'index.html'));
await fs.copyFile(path.join(source, 'style.css'), path.join(output, 'style.css'));
await fs.copyFile(path.join(source, 'responsive.html'), path.join(output, 'responsive.html'));
await fs.copyFile(path.join(source, 'INFINITE-CANVAS-LICENSE.txt'), path.join(output, 'INFINITE-CANVAS-LICENSE.txt'));
await build({ entryPoints: [path.join(source, 'scene.js')], outfile: path.join(output, 'app.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, legalComments: 'eof' });
await fs.copyFile(path.join(root, 'node_modules', 'three', 'LICENSE'), path.join(output, 'THREE-LICENSE.txt'));
const generated = await fs.readdir(path.join(output, 'media'));
const bytes = (await Promise.all(generated.map(async name => (await fs.stat(path.join(output, 'media', name))).size))).reduce((a, b) => a + b, 0);
console.log(JSON.stringify({ photos: manifest.length, derivedFiles: generated.length, derivedBytes: bytes, output, originalsModified: false }));
