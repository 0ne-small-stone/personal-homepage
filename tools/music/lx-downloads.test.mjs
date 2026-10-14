import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,mkdir,readFile,readdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {createLxDownloads,completedWebFiles,publicDestination,safeFileStem,verifiedFormat} from './lx-downloads.mjs';
const testRoot=path.resolve('.local-tools/music');
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
async function waitFor(service){for(let i=0;i<200;i++){const job=service.jobs()[0];if(job&&['completed','failed','cancelled'].includes(job.status))return job;await tick();}throw new Error('job timeout');}
async function fixture(t,options={}){
  await mkdir(testRoot,{recursive:true});const folder=await mkdtemp(path.join(testRoot,'lx-test-'));const directory=path.join(folder,'downloads');await mkdir(directory);
  const manifest=path.join(folder,'web-downloads.json');
  const song={name:'Test song',singer:'Artist',albumName:'Album',songmid:'123',interval:'01:00',types:[{type:'flac'},{type:'320k'}]};
  const response=()=>{const body=Readable.from([Buffer.from('test audio')]);body.headers={'content-length':'10'};return body;};
  class MusicTagger{loadPath(){}save(){}dispose(){}}
  const service=createLxDownloads({engine:{status:async()=>({kw:{qualitys:['flac','320k']}}),search:async()=>({list:[song],allPage:1}),resolve:async()=>({url:'https://public.example/audio?secret=PRIVATE'}),dispose(){}},settings:async()=>({directory}),manifest,request:async()=>response(),parseAudio:async()=>({format:{codec:'FLAC',duration:60,sampleRate:44100,bitsPerSample:16}}),tagger:{MusicTagger},...options});
  t.after(async()=>{service.dispose();const relative=path.relative(testRoot,folder);assert.ok(relative.startsWith('lx-test-')&&!relative.includes(path.sep));await rm(folder,{recursive:true,force:true});});
  return {service,manifest,directory,song};
}
test('download destination denies credentials, internal DNS and mixed public/private answers',async()=>{
  for(const url of ['file:///x','https://user:pass@example.com','http://127.0.0.1/a','http://[::1]/a','http://[::ffff:127.0.0.1]/a','http://10.1.2.3/a','http://192.168.2.1/a','https://example.com:9000/a'])await assert.rejects(publicDestination(url));
  await assert.rejects(publicDestination('https://example.com',async()=>[{address:'1.1.1.1',family:4},{address:'127.0.0.1',family:4}]));
  assert.equal((await publicDestination('https://example.com',async()=>[{address:'1.1.1.1',family:4}])).address.address,'1.1.1.1');
});
test('filename normalization removes path separators and reserved characters',()=>{const stem=safeFileStem({singer:'../Artist',name:'../../song:<>|'});assert.ok(!/[<>:"/\\|?*]/.test(stem));assert.ok(stem.length<190);});
test('short previews and lossy or insufficient bit depth cannot satisfy lossless requests',()=>{
  assert.throws(()=>verifiedFormat({codec:'FLAC',duration:30},'flac',240));
  assert.throws(()=>verifiedFormat({codec:'MPEG 1 Layer 3',duration:240},'flac',240));
  assert.throws(()=>verifiedFormat({codec:'FLAC',duration:240,bitsPerSample:16},'flac24bit',240));
  assert.equal(verifiedFormat({codec:'FLAC',duration:240,bitsPerSample:24},'flac24bit',240),'flac');
});
test('a finished download is atomically published, fingerprinted and contains no resolver secrets',async t=>{
  const {service,manifest,directory}=await fixture(t);const results=await service.search('kw','song');assert.ok(!JSON.stringify(results).includes('PRIVATE'));
  const id=results.tracks[0].id;const first=service.download(id,'flac');assert.equal(service.download(id,'flac').id,first.id);
  assert.equal((await completedWebFiles(manifest)).length,0);
  assert.equal((await waitFor(service)).status,'completed');const files=await completedWebFiles(manifest);assert.equal(files.length,1);
  assert.equal((await readdir(directory)).filter(name=>name.endsWith('.part')).length,0);
  assert.ok(!JSON.stringify(service.jobs()).includes('PRIVATE'));assert.ok(!(await readFile(manifest,'utf8')).includes('PRIVATE'));
  await writeFile(files[0].file,'changed');assert.equal((await completedWebFiles(manifest)).length,0);
});
test('partial response never gains a completion record or audio extension',async t=>{
  const {service,manifest,directory}=await fixture(t,{request:async()=>{const response=Readable.from([Buffer.from('short')]);response.headers={'content-length':'100'};return response;}});
  const result=await service.search('kw','song');service.download(result.tracks[0].id,'flac');assert.equal((await waitFor(service)).status,'failed');
  assert.equal((await completedWebFiles(manifest)).length,0);assert.deepEqual(await readdir(directory),[]);
});
test('cancel while resolving prevents any file publication',async t=>{
  let release;const resolve=new Promise(resolve=>release=resolve);
  const {service,manifest,directory}=await fixture(t,{engine:{status:async()=>({kw:{qualitys:['flac']}}),search:async()=>({list:[{name:'Song',singer:'Artist',songmid:1,interval:'01:00',types:[{type:'flac'}]}]}),resolve:async()=>resolve,dispose(){}}});
  const result=await service.search('kw','song');const job=service.download(result.tracks[0].id,'flac');await tick();service.cancel(job.id);release({url:'https://example.com/a'});
  assert.equal((await waitFor(service)).status,'cancelled');assert.equal((await completedWebFiles(manifest)).length,0);assert.deepEqual(await readdir(directory),[]);
});
test('unsupported quality or expired opaque result cannot resolve arbitrary URL',async t=>{
  const {service}=await fixture(t);assert.throws(()=>service.download('https://example.com','flac'));
  const results=await service.search('kw','song');assert.throws(()=>service.download(results.tracks[0].id,'hires'));await assert.rejects(service.search('unknown','song'));
});
test('existing destination is preserved and a failed duplicate leaves no temporary file',async t=>{
  const {service,manifest,directory}=await fixture(t);const name='Artist - Test song [kw-123-flac].flac';await writeFile(path.join(directory,name),'original');
  const result=await service.search('kw','song');service.download(result.tracks[0].id,'flac');assert.equal((await waitFor(service)).status,'failed');assert.equal(await readFile(path.join(directory,name),'utf8'),'original');
  assert.equal((await completedWebFiles(manifest)).length,0);assert.deepEqual(await readdir(directory),[name]);
});
