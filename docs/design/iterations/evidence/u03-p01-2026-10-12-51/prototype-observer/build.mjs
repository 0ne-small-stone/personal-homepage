import fs from 'node:fs/promises';
import { build, transform } from '../../node_modules/esbuild/lib/main.js';
const source = await fs.readFile('src/components/home/GlassTriangle.tsx', 'utf8');
const geometry = "import { ExtrudeGeometry, Shape, Vector2, Vector3 } from './node_modules/three/build/three.module.js';\n" + source.slice(source.indexOf('function roundedTriangle'), source.indexOf('export default function'));
await fs.writeFile('.ci-tmp/optics-engine/geometry.js', (await transform(geometry, { loader: 'ts' })).code);
const ray = (await fs.readFile('src/components/home/prism-ray.ts', 'utf8')).replace("from 'three';", "from './node_modules/three/build/three.module.js';");
await fs.writeFile('.ci-tmp/optics-engine/ray.js', (await transform(ray, { loader: 'ts' })).code);
await build({ entryPoints: ['.ci-tmp/optics-engine/entry.js'], outfile: '.ci-tmp/optics-engine/bundle.js', bundle: true, format: 'esm', logLevel: 'warning' });
await build({ entryPoints: ['.ci-tmp/optics-engine/white-entry.js'], outfile: '.ci-tmp/optics-engine/white-bundle.js', bundle: true, format: 'esm', logLevel: 'warning' });
