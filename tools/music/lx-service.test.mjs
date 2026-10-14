import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createMusicPreview} from './preview-service.mjs';
test('LX endpoints enforce origin, JSON limits and expose only opaque IDs',async t=>{
  const calls=[];
  const server=createMusicPreview({playback:{start(){},stop(){}},account:{dispose(){}},downloads:{status:async()=>({ready:true,platforms:[{id:'kw',name:'酷我'}],jobs:[]}),jobs:()=>[],search:async(source,keyword)=>{calls.push([source,keyword]);return {tracks:[{id:'opaque',title:'Song',qualities:['flac']}],page:1,hasMore:false};},download:(id,quality)=>{calls.push([id,quality]);return {id:'job',status:'queued'};},cancel(){},dispose(){}}});
  server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>{server.closeAllConnections();server.close();});
  const origin=`http://127.0.0.1:${server.address().port}`,base=origin+'/personal-homepage/api/music/lx/';
  assert.equal((await fetch(base+'status')).status,200);
  assert.equal((await fetch(base+'status',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(base+'download',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal((await fetch(base+'download',{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain'},body:'{}'})).status,400);
  assert.equal((await fetch(base+'download',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'x'.repeat(3000)})).status,413);
  assert.equal((await fetch(base+'download',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'[]'})).status,400);
  const response=await fetch(base+'search',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({source:'kw',keyword:'Song',url:'http://127.0.0.1/private'})});
  assert.equal(response.status,200);assert.equal((await response.json()).tracks[0].id,'opaque');assert.deepEqual(calls,[['kw','Song']]);
  await fetch(base+'download',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:'opaque',quality:'flac',path:'C:/private'})});assert.deepEqual(calls[1],['opaque','flac']);
});
