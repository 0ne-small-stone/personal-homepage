import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {prepareFastPdfs} from './prepare-fast-pdfs.mjs';
test('generated mirrors are exact, reproducible, checked against unchanged originals',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'fast-pdf-'));
 try{
  const data=Buffer.alloc(4*1024*1024+173,37),sha256=createHash('sha256').update(data).digest('hex'),file='materials/source-fixture.pdf',asset={file,sourceId:'source-fixture',sha256,bytes:data.length};
  await fs.mkdir(path.join(root,'public/materials'),{recursive:true});await fs.writeFile(path.join(root,'public',file),data);
  const result=await prepareFastPdfs(root,[asset]);assert.equal(result.documents,1);assert.ok(result.bytes<2500000);
  assert.deepEqual(await prepareFastPdfs(root,[asset],{check:true}),result);
  const mirror=path.join(root,'public/materials/fast/source-fixture',sha256.slice(0,16),'0.bin');await fs.writeFile(mirror,'bad');
  await assert.rejects(prepareFastPdfs(root,[asset],{check:true}),/Changed fast PDF asset/);
  await prepareFastPdfs(root,[asset],{profiles:[{sourceId:asset.sourceId,sha256,chunkRanges:[[40,40]]}]});assert.equal((await fs.readFile(path.join(root,'public/materials/fast/source-fixture',sha256.slice(0,16),'40.bin'))).length,65536);
  await assert.rejects(prepareFastPdfs(root,[asset],{profiles:[{sourceId:asset.sourceId,sha256:'0'.repeat(64),chunkRanges:[]}]}),/Stale/);
  await assert.rejects(prepareFastPdfs(root,[asset],{profiles:[{sourceId:asset.sourceId,sha256,chunkRanges:[[80,81]]}]}),/Invalid first-page/);
  assert.deepEqual(await fs.readFile(path.join(root,'public',file)),data);
  await fs.writeFile(path.join(root,'public',file),'changed');await assert.rejects(prepareFastPdfs(root,[asset]),/checksum mismatch/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
