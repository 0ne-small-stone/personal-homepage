import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const compiled=await build({entryPoints:[fileURLToPath(new URL('../../src/lib/netease-core.ts',import.meta.url))],bundle:true,write:false,format:'esm',platform:'node'});
const {readNetEaseRoute}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
test('untrusted route parameters never select prototype properties and preserve valid podcast filters',()=>{
  const original=globalThis.location;
  try{
    for(const value of ['toString','constructor','__proto__','unknown']){globalThis.location={href:'https://example.test/music/?view='+value};assert.equal(readNetEaseRoute().view,'home');}
    globalThis.location={href:'https://example.test/music/?view=podcasts&category=interviews'};assert.equal(readNetEaseRoute().category,'interviews');
    globalThis.location={href:'https://example.test/music/?view=search&kind=constructor&category=toString'};assert.equal(readNetEaseRoute().kind,'playlist');assert.equal(readNetEaseRoute().category,'all');
  }finally{if(original===undefined)delete globalThis.location;else globalThis.location=original;}
});
