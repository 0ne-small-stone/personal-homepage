import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createPlaybackAccount} from './playback-account.mjs';
import {createMusicPreview} from './preview-service.mjs';
import {fetchPlaybackIndex} from './playback-index.mjs';

const now=Date.now();
const index=status=>({version:1,updatedAt:new Date(now).toISOString(),tracks:[{id:'4238134',status,audioUrl:'https://m701.music.126.net/account.mp3',expiresAt:new Date(now+600000).toISOString(),previewSeconds:status==='preview'?30:null}]});
function setup(extra={}) {
  const sdk={login_qr_key:async()=>({body:{code:200,data:{unikey:'qr-key'}}}),login_qr_create:async()=>({body:{data:{qrimg:'data:image/png;base64,test'}}}),login_qr_check:async()=>({body:{code:803,cookie:'test-account-cookie'}}),login_status:async()=>({body:{data:{code:200,profile:{userId:123,nickname:'测试账号'}}}}),...extra};
  const cookies=[];const account=createPlaybackAccount({sdk,resolve:async cookie=>{cookies.push(cookie);return index('full');}});return{account,sdk,cookies};
}
test('QR login verifies a personal account, keeps credentials private and resolves licensed full audio',async()=>{
  const {account,cookies}=setup();assert.equal(account.state().authorized,false);
  await account.createQr();const result=await account.checkQr();assert.equal(result.code,803);assert.equal(account.state().account.nickname,'测试账号');
  assert.doesNotMatch(JSON.stringify(result),/test-account-cookie|qr-key/);
  assert.equal((await account.index()).tracks[0].status,'full');assert.deepEqual(cookies,['test-account-cookie']);
  account.logout();assert.equal(account.state().authorized,false);assert.equal(account.state().account,null);await assert.rejects(account.index(),/先登录/);
});
test('nested playlist write envelopes are unwrapped and an inner failure never becomes success',async()=>{
  let failed=false;const {account}=setup({playlist_tracks:async()=>({status:200,body:{status:200,body:{code:failed?512:200,message:'PRIVATE_DIAGNOSTIC'},cookie:'PRIVATE_COOKIE'}})});
  await account.createQr();await account.checkQr();const result=await account.request('playlist_tracks',{pid:'77',tracks:'123',op:'add'},true);assert.equal(result.code,200);assert.equal(result.cookie,undefined);
  failed=true;await assert.rejects(account.request('playlist_tracks',{pid:'77',tracks:'123',op:'add'},true),error=>!/PRIVATE/.test(error.message));assert.equal(account.state().authorized,true);account.dispose();
});
test('only cloud 201 with a valid private song ID may proceed to upload read-back',async()=>{
  let privateCloud={songId:777};const {account}=setup({cloud:async()=>({body:{code:201,privateCloud}}),like:async()=>({body:{code:201}})});await account.createQr();await account.checkQr();
  assert.equal((await account.request('cloud',{},true)).code,201);await assert.rejects(account.request('like',{id:'123'},true));privateCloud=null;await assert.rejects(account.request('cloud',{},true));account.dispose();
});
test('cancel or logout while account verification is pending prevents a late login',async()=>{
  let finish;const {account}=setup({login_status:()=>new Promise(resolve=>finish=resolve)});
  await account.createQr();const pending=account.checkQr();await new Promise(resolve=>setImmediate(resolve));account.cancel();
  finish({body:{data:{code:200,profile:{userId:123,nickname:'过期结果'}}}});assert.equal((await pending).code,800);assert.equal(account.state().authorized,false);
});
test('logout invalidates an in-flight private audio refresh instead of retaining its URL',async()=>{
  const {account,sdk}=setup();let finish;
  const local=createPlaybackAccount({sdk,resolve:()=>new Promise(resolve=>finish=resolve)});await local.createQr();await local.checkQr();
  const pending=local.index();await new Promise(resolve=>setImmediate(resolve));local.logout();finish(index('full'));await assert.rejects(pending,/无法获取/);await assert.rejects(local.index(),/先登录/);account.logout();
});
test('expired account identity clears login before another private playback resolution',async()=>{
  let time=now;let valid=true;const {sdk}=setup({login_status:async()=>({body:{data:valid?{code:200,profile:{userId:123,nickname:'测试'}}:{code:301}}})});
  const account=createPlaybackAccount({sdk,now:()=>time,resolve:async()=>index('full')});await account.createQr();await account.checkQr();
  time+=61000;valid=false;await assert.rejects(account.index(),/登录已失效/);assert.equal(account.state().authorized,false);
});
test('upstream playback authentication rejection revokes the local account without exposing credentials',async()=>{
  const {sdk}=setup();const account=createPlaybackAccount({sdk,resolve:async()=>{const error=Error('private upstream details');error.auth=true;throw error;}});
  await account.createQr();await account.checkQr();await assert.rejects(account.index(),/登录已失效/);assert.equal(account.state().authorized,false);assert.doesNotMatch(JSON.stringify(account.state()),/cookie|private/);
});
test('standard playback carries the explicit listening cookie and never requests unlocking',async()=>{
  let input;
  const result=await fetchPlaybackIndex({sdk:{song_url_v1:async value=>{input=value;return{body:{code:200,data:value.id.split(',').map(id=>({id:Number(id),code:200,url:'https://m701.music.126.net/track.mp3',expi:1200,freeTrialInfo:null}))}};}},cookie:'test-account-cookie',verify:async()=>true});
  assert.equal(input.cookie,'test-account-cookie');assert.equal(input.unblock,false);assert.equal(input.level,'standard');assert.equal(result.tracks.every(track=>track.status==='full'),true);
});
test('preview isolates private resolution from anonymous index and rejects foreign origins',async()=>{
  const {account}=setup();const playback={start(){},stop(){},get:async()=>index('preview')};
  const server=createMusicPreview({root:'.local-tools/music/nonexistent-output',playback,account});server.listen(0,'127.0.0.1');await once(server,'listening');
  const origin=`http://127.0.0.1:${server.address().port}`;const base=origin+'/personal-homepage/api/music/playback/';
  const post=(route,body={},requestOrigin=origin)=>fetch(base+route,{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    assert.equal((await post('qr',{},'https://foreign.test')).status,403);
    await post('qr');await post('qr-check');
    const privateResult=await (await post('resolve',{id:'4238134'})).json();assert.equal(privateResult.tracks[0].status,'full');
    const publicResult=await (await fetch(origin+'/personal-homepage/music/netease-playback.json')).json();assert.equal(publicResult.tracks[0].status,'preview');
    assert.equal((await post('resolve',{id:'not-in-playlist'})).status,400);assert.equal((await post('resolve',null)).status,400);
    await post('logout');const loggedOut=await (await post('resolve',{id:'4238134'})).json();assert.equal(loggedOut.tracks[0].status,'preview');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
