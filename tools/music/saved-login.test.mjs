import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createSavedLoginStore} from './saved-login.mjs';
import {createPlaybackAccount} from './playback-account.mjs';
import {protectBytes} from './windows-secret.mjs';

const sdk={login_qr_key:async()=>({body:{code:200,data:{unikey:'test-key'}}}),login_qr_create:async()=>({body:{data:{qrimg:'data:image/png;base64,test'}}}),login_qr_check:async()=>({body:{code:803,cookie:'dummy-private-login'}}),login_status:async()=>({body:{data:{code:200,profile:{userId:123,nickname:'恢复测试'}}}})};
function memoryStore(){let value=null;return{load:async()=>value,save:async cookie=>{value=cookie;},clear:async()=>{value=null;},value:()=>value};}
test('saved login is verified by a fresh account object, disposal preserves it, explicit logout deletes it',async()=>{
  const store=memoryStore();const first=createPlaybackAccount({sdk,store});await first.createQr();await first.checkQr();assert.equal(first.state().saved,true);
  first.dispose();assert.equal(store.value(),'dummy-private-login');
  const second=createPlaybackAccount({sdk,store});await second.ready();assert.equal(second.state().authorized,true);assert.equal(second.state().saved,true);assert.doesNotMatch(JSON.stringify(second.state()),/dummy-private-login/);
  await second.logout();assert.equal(store.value(),null);const third=createPlaybackAccount({sdk,store});await third.ready();assert.equal(third.state().authorized,false);
});
test('expired saved login is removed but an offline restore preserves it for retry',async()=>{
  const store=memoryStore();await store.save('dummy-private-login');
  const expired=createPlaybackAccount({sdk:{...sdk,login_status:async()=>({body:{data:{code:301}}})},store});await expired.ready();assert.equal(store.value(),null);assert.equal(expired.state().authorized,false);
  await store.save('dummy-private-login');let offline=true;const retry=createPlaybackAccount({sdk:{...sdk,login_status:async()=>{if(offline)throw Error('offline');return sdk.login_status();}},store});await retry.ready();assert.equal(store.value(),'dummy-private-login');assert.equal(retry.state().authorized,false);assert.equal(retry.state().saved,true);
  offline=false;await retry.retryRestore();assert.equal(retry.state().authorized,true);
});
test('failed storage is not reported as saved and can be retried without another QR login',async()=>{
  const store=memoryStore();let blocked=true;const save=store.save;store.save=async cookie=>{if(blocked)throw Error('denied');await save(cookie);};
  const account=createPlaybackAccount({sdk,store});await account.createQr();const result=await account.checkQr();assert.equal(result.authorized,true);assert.equal(result.saved,false);assert.match(result.persistenceError,/尚未保存/);
  blocked=false;await account.remember();assert.equal(account.state().saved,true);assert.equal(store.value(),'dummy-private-login');
});
test('cancel during encryption removes an uncommitted new credential',async()=>{
  const store=memoryStore();let finish;const save=store.save;store.save=cookie=>new Promise(resolve=>finish=async()=>{await save(cookie);resolve();});
  const account=createPlaybackAccount({sdk,store});await account.createQr();const pending=account.checkQr();await new Promise(resolve=>setImmediate(resolve));account.cancel();await finish();assert.equal((await pending).code,800);assert.equal(store.value(),null);assert.equal(account.state().authorized,false);
});
test('failed credential deletion is reported and retry actually clears the saved login',async()=>{
  const store=memoryStore();const account=createPlaybackAccount({sdk,store});await account.createQr();await account.checkQr();
  const clear=store.clear;let blocked=true;store.clear=async()=>{if(blocked)throw Error('blocked');await clear();};
  await assert.rejects(account.logout(),/未能删除/);assert.equal(account.state().authorized,false);assert.equal(account.state().saved,true);assert.equal(store.value(),'dummy-private-login');
  blocked=false;await account.logout();assert.equal(store.value(),null);assert.equal(account.state().saved,false);
});
test('Windows DPAPI login file contains no plaintext and decrypts in a new store instance',{skip:process.platform!=='win32'},async()=>{
  const folder=await mkdtemp(join(tmpdir(),'lssh-saved-login-'));const file=join(folder,'login.dpapi');
  try{
    const store=createSavedLoginStore({file});assert.equal(await store.load(),null);await store.save('dummy-private-login');
    const bytes=await readFile(file);assert.equal(bytes.includes(Buffer.from('dummy-private-login')),false);assert.notEqual(bytes[0],123);
    const second=createSavedLoginStore({file});assert.equal(await second.load(),'dummy-private-login');await second.clear();assert.equal(await second.load(),null);
    const upload=await protectBytes(Buffer.from('test'),'protect');await assert.rejects(protectBytes(upload,'unprotect','netease-playback'));
  }finally{const target=resolve(folder);assert.ok(target.startsWith(resolve(tmpdir())+'\\')&&target.includes('lssh-saved-login-'));await rm(target,{recursive:true,force:true});}
});
