import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createNetEaseAdapter} from './netease-adapter.mjs';
import {createRecommendationStore} from './recommendations.mjs';
import {createMusicPreview} from './preview-service.mjs';

const playlistId='18476425375',ownerId='13615478042';
function accountFixture(){
  const calls=[],ids=['1'];let user=ownerId,playlistOwner=ownerId,target=playlistId;
  const account={state:()=>({available:true,authorized:Boolean(user),account:user?{id:user,nickname:'模拟账号'}:null}),ready:async()=>{},prepare:async()=>{},dispose(){},
    createQr:async()=>({image:'fixture'}),checkQr:async()=>({code:803}),logout:async()=>{user='';},
    request:async(method,input,personal)=>{calls.push({method,input,personal});
      if(method==='song_detail')return{code:200,songs:[{id:Number(input.ids),name:'模拟歌曲',ar:[{name:'模拟歌手'}],al:{name:'模拟专辑'},dt:120000}]};
      if(method==='playlist_detail')return{code:200,playlist:{id:target,creator:{userId:playlistOwner},trackIds:ids.map(id=>({id}))}};
      if(method==='playlist_tracks'){ids.push(input.tracks);return{code:200};}
      throw Error('unexpected fixture method');
    }};
  return{account,calls,ids,user:value=>{user=value;},playlistOwner:value=>{playlistOwner=value;},target:value=>{target=value;}};
}

test('recommendation adapter reuses one playback identity and only writes the fixed owned playlist',async()=>{
  const f=accountFixture(),adapter=createNetEaseAdapter({account:f.account});
  assert.equal(adapter.authorized(),true);assert.equal(adapter.account().userId,ownerId);
  assert.equal((await adapter.song('2')).title,'模拟歌曲');assert.deepEqual(await adapter.playlistIds(),['1']);
  await adapter.addSong('2');assert.deepEqual(f.calls.at(-1),{method:'playlist_tracks',input:{op:'add',pid:playlistId,tracks:'2'},personal:true});
  f.user('987');assert.equal(adapter.authorized(),false);assert.equal(adapter.account(),null);
  const before=f.calls.length;await assert.rejects(adapter.addSong('3'),/拥有 Echoes/);assert.equal(f.calls.length,before);
  await assert.rejects(adapter.checkQr(),/拥有 Echoes/);assert.equal(f.account.state().account.id,'987');
  f.user(ownerId);await adapter.logout();assert.equal(adapter.authorized(),false);
});

test('upstream playlist identity and input IDs are verified before reporting synchronization',async()=>{
  const f=accountFixture(),adapter=createNetEaseAdapter({account:f.account});
  f.playlistOwner('987');await assert.rejects(adapter.playlistIds(),/身份核对/);
  f.playlistOwner(ownerId);f.target('987');await assert.rejects(adapter.playlistIds(),/身份核对/);
  const before=f.calls.length;await assert.rejects(adapter.song('../2'),/编号/);await assert.rejects(adapter.addSong('2&x=3'),/编号/);assert.equal(f.calls.length,before);
});

test('one real HTTP origin serves playback, recommendations and review without bypassing approval',async t=>{
  const root=resolve('.local-tools/recommendation-account-test',randomUUID());await mkdir(root,{recursive:true});await writeFile(resolve(root,'index.html'),'<h1>Fixture</h1>');
  const f=accountFixture(),adapter=createNetEaseAdapter({account:f.account});const file=resolve(root,'queue.json');const store=await createRecommendationStore(file,adapter);
  const server=createMusicPreview({root,account:f.account,playback:{start(){},stop(){}},recommendations:{adapter,store}});
  server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(done=>{server.closeAllConnections();server.close(done);}));
  const origin=`http://127.0.0.1:${server.address().port}`,api=origin+'/personal-homepage/api/music';
  const post=(route,input,headers={})=>fetch(api+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(input)});
  assert.equal((await(await fetch(api+'/playback/account')).json()).authorized,true);
  assert.equal((await(await fetch(api+'/status')).json()).authorized,true);
  assert.equal((await fetch(origin+'/personal-homepage/music/manage/')).status,200);
  const input={submissionId:randomUUID(),nickname:'模拟访客',song:'2',reason:'仅夹具，不写真实歌单'};
  const submitted=await(await post('/recommendations',input)).json();assert.equal(submitted.status,'pending');assert.deepEqual(f.ids,['1']);
  assert.equal((await(await post('/admin/review',{id:submitted.id,decision:'approve'})).json()).status,'synced');assert.deepEqual(f.ids,['1','2']);
  await post('/admin/review',{id:submitted.id,decision:'approve'});await post('/recommendations',input);
  assert.equal(f.calls.filter(x=>x.method==='playlist_tracks').length,1);assert.equal(store.list().length,1);
  const reloaded=await createRecommendationStore(file,adapter);assert.equal(reloaded.status(input.submissionId).status,'synced');
  for(const route of ['/recommendations','/admin/review','/netease'])assert.equal((await post(route,input,{Origin:'https://foreign.example'})).status,403);
  assert.equal((await post('/recommendations',input,{Origin:''})).status,403);
  const before=f.ids.length;f.user('987');
  assert.equal((await(await fetch(api+'/playback/account')).json()).authorized,true);
  assert.equal((await(await fetch(api+'/status')).json()).authorized,false);
  const pending=await(await post('/recommendations',{...input,submissionId:randomUUID(),song:'3'})).json();
  assert.equal((await(await post('/admin/review',{id:pending.id,decision:'approve'})).json()).status,'awaiting_auth');assert.equal(f.ids.length,before);
  f.user(ownerId);await post('/playback/qr-check',{});
  for(let n=0;n<100&&store.list().some(record=>['awaiting_auth','syncing'].includes(record.status));n++)await new Promise(done=>setTimeout(done,5));
  assert.equal(store.list().find(record=>record.id===pending.id).status,'synced');assert.deepEqual(f.ids,['1','2','3']);
});
