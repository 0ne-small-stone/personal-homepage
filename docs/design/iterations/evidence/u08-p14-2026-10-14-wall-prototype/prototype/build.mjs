import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const output=fileURLToPath(new URL('../../../../../../.local-tools/wall-prototype/site/',import.meta.url));
await fs.mkdir(output,{recursive:true});
const result=await build({entryPoints:[path.join(source,'app.js')],outdir:output,entryNames:'app-[hash]',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof',metafile:true});
const script=Object.keys(result.metafile.outputs).find(name=>name.endsWith('.js'));
await fs.writeFile(path.join(output,'index.html'),(await fs.readFile(path.join(source,'index.html'),'utf8')).replace('__APP__',path.basename(script)));
await fs.copyFile(path.join(source,'style.css'),path.join(output,'style.css'));
await fs.copyFile(path.join(source,'PROVENANCE.md'),path.join(output,'PROVENANCE.md'));
const hashes={};
for(const name of ['app.js','style.css','index.html','messages.js','build.mjs','server.mjs','PROVENANCE.md'])
  hashes[name]=crypto.createHash('sha256').update(await fs.readFile(path.join(source,name))).digest('hex');
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify({version:1,script:path.basename(script),sourceHashes:hashes},null,2));
console.log('Wall prototype built: '+path.basename(script));
