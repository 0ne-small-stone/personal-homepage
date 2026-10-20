import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const output=fileURLToPath(new URL('../../../../../../.local-tools/wall-prototype/'+(process.argv.includes('--return-candidate')?'return-site/':'site/'),import.meta.url));
await fs.mkdir(output,{recursive:true});
const result=await build({entryPoints:[path.join(source,'app.js')],outdir:output,entryNames:'app-[hash]',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof',metafile:true,loader:{'.css':'text','.svg':'text'},define:{LSSH_TEST_GISCUS_ORIGIN:JSON.stringify('')}});
const script=Object.keys(result.metafile.outputs).find(name=>name.endsWith('.js'));
await fs.writeFile(path.join(output,'index.html'),(await fs.readFile(path.join(source,'index.html'),'utf8')).replace('__APP__',path.basename(script)));
await fs.copyFile(path.join(source,'style.css'),path.join(output,'style.css'));
await fs.copyFile(path.resolve(source,'../../../../../../src/styles/division-bell-return.css'),path.join(output,'division-bell-return.css'));
await fs.copyFile(path.join(source,'giscus-theme.css'),path.join(output,'giscus-theme.css'));
await fs.copyFile(path.join(source,'composer.css'),path.join(output,'composer.css'));
await fs.copyFile(path.join(source,'PROVENANCE.md'),path.join(output,'PROVENANCE.md'));
const hashes={};
for(const name of ['app.js','style.css','index.html','wall-fluid.mjs','wall-world.mjs','wall-stars.mjs','wall-message-space.mjs','wall-gesture.mjs','wall-breach.mjs','wall-preview.mjs','guestbook-data.mjs','giscus-client.js','giscus-theme.css','composer.css','build.mjs','server.mjs','PROVENANCE.md'])
  hashes[name]=crypto.createHash('sha256').update(await fs.readFile(path.join(source,name))).digest('hex');
const sharedSourceHashes={};
for(const name of ['src/config/giscus.ts','node_modules/three/package.json','node_modules/three/build/three.module.js','node_modules/three/build/three.core.js','node_modules/three/LICENSE','src/components/navigation/division-bell-dom.ts','src/components/navigation/division-bell-glyph.ts','src/components/navigation/division-bell-markup.ts','src/components/navigation/division-bell-return.ts','src/components/navigation/division-bell-incised.svg','src/styles/division-bell-return.css'])
  sharedSourceHashes[name]=crypto.createHash('sha256').update(await fs.readFile(path.resolve(source,'../../../../../../',name))).digest('hex');
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify({version:3,script:path.basename(script),sourceHashes:hashes,sharedSourceHashes},null,2));
console.log('Wall prototype built: '+path.basename(script));
