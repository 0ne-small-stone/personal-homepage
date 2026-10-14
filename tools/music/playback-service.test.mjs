import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createPlaybackIndexService} from './playback-index.mjs';
import {createMusicPreview} from './preview-service.mjs';

const sample=time=>({version:1,updatedAt:new Date(time).toISOString(),tracks:[{id:'4238134',status:'preview',audioUrl:'https://m701.music.126.net/a.mp3',expiresAt:new Date(time+600000).toISOString(),previewSeconds:30}]});
test('missing or expired runtime data refreshes and simultaneous playback requests share one refresh',async()=>{
  let time=1000000;let updates=0;let finish;
  const service=createPlaybackIndexService('unused',{now:()=>time,load:async()=>{throw Error('missing');},update:()=>{updates++;return new Promise(resolve=>finish=resolve);}});
  const first=service.get();const second=service.get();await new Promise(resolve=>setImmediate(resolve));assert.equal(updates,1);
  finish(sample(time));assert.deepEqual(await first,await second);await service.get();assert.equal(updates,1);
  time+=600000;const refresh=service.get();await new Promise(resolve=>setImmediate(resolve));assert.equal(updates,2);finish(sample(time));await refresh;
});
test('upstream failure uses only still-valid cache, backs off and later recovers',async()=>{
  let time=1000000;let updates=0;let fail=true;
  const service=createPlaybackIndexService('unused',{now:()=>time,load:async()=>sample(time),update:async()=>{updates++;if(fail)throw Error('offline');return sample(time);}});
  await service.get();await service.get(true);assert.equal(updates,1);
  await service.get(true);assert.equal(updates,1);
  time+=600000;await assert.rejects(service.get(),/unavailable/);await assert.rejects(service.get(),/unavailable/);assert.equal(updates,2);
  time+=15001;fail=false;await service.get();assert.equal(updates,3);
});
test('preview supplies runtime JSON despite absent build output, and reports upstream failure as 503',async()=>{
  let fail=false;let starts=0;let stops=0;
  const playback={start(){starts++;},stop(){stops++;},async get(){if(fail)throw Error('offline');return sample(Date.now());}};
  const server=createMusicPreview({root:'.local-tools/music/nonexistent-fixture-output',playback});server.listen(0,'127.0.0.1');await once(server,'listening');
  try{
    const url=`http://127.0.0.1:${server.address().port}/personal-homepage/music/netease-playback.json`;
    const ready=await fetch(url);assert.equal(ready.status,200);assert.equal(ready.headers.get('cache-control'),'no-store');assert.equal((await ready.json()).tracks[0].status,'preview');
    fail=true;const offline=await fetch(url);assert.equal(offline.status,503);assert.match((await offline.json()).error,/播放服务暂时不可用/);
    const rejected=await fetch(url,{method:'POST'});assert.equal(rejected.status,405);
  }finally{await new Promise(resolve=>server.close(resolve));}
  assert.equal(starts,1);assert.equal(stops,1);
});
