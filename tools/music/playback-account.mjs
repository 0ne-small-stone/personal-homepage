import api from '@neteasecloudmusicapienhanced/api';
import {createPlaybackIndexService,fetchPlaybackIndex} from './playback-index.mjs';

const bodyOf=result=>{let body=result?.body||result;for(let depth=0;depth<3&&body?.code===undefined&&body?.body;depth++)body=body.body;return body;};
export function createPlaybackAccount({sdk=api,now=Date.now,resolve=cookie=>fetchPlaybackIndex({cookie}),store=null}={}) {
  let cookie='';let profile=null;let key='';let expiresAt=0;let revision=0;let qrRevision=0;let lastVerified=0;
  let saved=false;let restoring=Boolean(store);let persistenceError='';let mutations=Promise.resolve();
  const privateIndex=createPlaybackIndexService('',{load:async()=>null,update:()=>resolve(cookie),now});
  const state=()=>({available:true,local:true,authorized:Boolean(cookie&&profile),account:profile?{...profile}:null,saved,restoring,persistenceError});
  const mutate=operation=>{const job=mutations.then(operation,operation);mutations=job.catch(()=>{});return job;};
  function cancel(){qrRevision++;key='';expiresAt=0;}
  function reset(){revision++;cancel();cookie='';profile=null;lastVerified=0;privateIndex.invalidate();}
  async function logout(){
    reset();
    try{await mutate(()=>store?.clear());saved=false;persistenceError='';}
    catch{persistenceError='保存的登录未能删除，请重试退出。';const error=Error(persistenceError);error.persistence=true;throw error;}
  }
  async function verify(candidate) {
    let result;
    try{result=bodyOf(await sdk.login_status({cookie:candidate,timeout:12000,crypto:'weapi',e_r:false}));}
    catch(cause){const error=Error('暂时无法核对网易云登录，请稍后重试。');error.auth=[301,302,401,403].includes(Number(cause?.body?.code||cause?.code));throw error;}
    const data=result?.data||result;const next=data?.profile;
    if(Number(data?.code)!==200||!/^[1-9]\d{0,19}$/.test(String(next?.userId||''))){const error=Error('网易云登录已失效，请重新扫码。');error.auth=true;throw error;}
    let avatarUrl=null;try{const url=new URL(next.avatarUrl);if(url.protocol==='https:'&&/^p\d+\.music\.126\.net$/.test(url.hostname))avatarUrl=url.href;}catch{}
    return {id:String(next.userId),nickname:String(next.nickname||'网易云账号').slice(0,100),avatarUrl};
  }
  async function createQr() {
    await ready;
    cancel();const expected=qrRevision;
    try{
      const result=bodyOf(await sdk.login_qr_key({cookie:{},timeout:12000,crypto:'weapi',e_r:false}));
      const nextKey=result?.data?.unikey;
      if(Number(result?.code)!==200||!nextKey)throw Error();
      const qr=bodyOf(await sdk.login_qr_create({key:nextKey,qrimg:true}));
      if(expected!==qrRevision)throw Error();
      if(typeof qr?.data?.qrimg!=='string'||!qr.data.qrimg.startsWith('data:image/png;base64,'))throw Error();
      key=nextKey;expiresAt=now()+180000;return{image:qr.data.qrimg,expiresAt};
    }catch{throw Error('登录二维码暂时无法获取，请重试。');}
  }
  async function checkQr() {
    if(!key||now()>expiresAt){cancel();return{code:800,message:'二维码已过期，请重新获取。'};}
    const expected=qrRevision;const expectedAccount=revision;let result;
    try{result=bodyOf(await sdk.login_qr_check({key,cookie:{},timeout:12000,crypto:'weapi',e_r:false}));}
    catch{throw Error('暂时无法读取扫码状态，请重试。');}
    if(expected!==qrRevision||expectedAccount!==revision)return{code:800,message:'本次扫码已取消。'};
    const code=Number(result?.code);
    if(code===803&&typeof result.cookie==='string'&&result.cookie){
      const candidate=result.cookie;const next=await verify(candidate);
      if(expected!==qrRevision||expectedAccount!==revision)return{code:800,message:'本次扫码已取消。'};
      if(store){try{await mutate(()=>store.save(candidate));saved=true;persistenceError='';}catch{saved=false;persistenceError='登录尚未保存，请重试保存。';}}
      if(expected!==qrRevision||expectedAccount!==revision){
        if(store&&expectedAccount===revision){await mutate(()=>cookie?store.save(cookie):store.clear());saved=Boolean(cookie);}
        return{code:800,message:'本次扫码已取消。'};
      }
      cookie=candidate;profile=next;lastVerified=now();revision++;cancel();privateIndex.invalidate();
      return{code:803,message:saved?'登录成功，已安全保存，重启后自动恢复。':'登录成功，重新播放将使用你的账号权限。',...state()};
    }
    if(code===800)cancel();
    return{code:[800,801,802].includes(code)?code:800,message:code===802?'已扫码，请在网易云 App 中确认。':code===801?'请用网易云 App 扫码。':'二维码已过期，请重新获取。'};
  }
  async function index() {
    await ready;
    if(!cookie||!profile)throw Error('请先登录网易云。');
    const expected=revision;
    try{
      if(now()-lastVerified>60000){const next=await verify(cookie);if(expected!==revision)throw Error();profile=next;lastVerified=now();}
      const result=await privateIndex.get();if(expected!==revision)throw Error();return result;
    }catch(error){
      if(error?.auth&&expected===revision){await logout();const failure=Error('网易云登录已失效，请重新扫码。');failure.auth=true;throw failure;}
      throw Error('账号音源暂时无法获取，请重试。');
    }
  }
  async function remember() {
    await ready;if(!cookie||!profile||!store)throw Error('请先登录网易云。');
    const expected=revision;const candidate=cookie;
    try{await mutate(()=>store.save(candidate));if(expected!==revision)return;saved=true;persistenceError='';}
    catch{persistenceError='登录尚未保存，请重试保存。';const error=Error(persistenceError);error.persistence=true;throw error;}
  }
  async function restore() {
    if(!store){restoring=false;return;}
    restoring=true;
    const expected=revision;
    try{
      const candidate=await store.load();if(!candidate||expected!==revision)return;saved=true;
      const next=await verify(candidate);if(expected!==revision)return;
      cookie=candidate;profile=next;lastVerified=now();privateIndex.invalidate();persistenceError='';
    }catch(error){
      if(expected!==revision)return;
      if(error.auth){await mutate(()=>store.clear());saved=false;persistenceError='保存的登录已失效，请重新扫码。';}
      else persistenceError=error.message||'暂时无法恢复登录，请重试。';
    }finally{restoring=false;}
  }
  const ready=restore().catch(()=>{restoring=false;persistenceError='暂时无法恢复保存的登录，请重试。';});
  async function retryRestore(){await ready;if(!cookie&&store)await restore();}
  async function prepare(){await ready;if(saved&&!cookie)await retryRestore();if(saved&&!cookie){const error=Error('暂时无法恢复已保存的登录，请重试。');error.persistence=true;throw error;}}
  async function request(method,args={},personal=false){
    await prepare();if(personal&&!state().authorized){const error=Error('请先登录网易云。');error.auth=true;throw error;}
    if(typeof sdk[method]!=='function')throw Error('当前服务不支持此功能。');
    const expected=revision;let body;
    try{body=bodyOf(await sdk[method]({...args,cookie:cookie||{},timeout:15000,e_r:false,unblock:false}));}
    catch(cause){const error=Error('网易云服务暂时不可用，请重试。');error.auth=[301,302,401].includes(Number(cause?.body?.code));throw error;}
    if(expected!==revision)throw Error('账号已变化，请重新加载。');
    const publishedCloud=method==='cloud'&&Number(body?.code)===201&&/^[1-9]\d{0,19}$/.test(String(body?.privateCloud?.songId||''));
    if(!body||Number(body.code)!==200&&!publishedCloud){const error=Error(Number(body?.code)===301?'请先登录网易云。':'网易云暂未返回内容，请稍后重试。');error.auth=[301,302,401].includes(Number(body?.code));throw error;}
    return body;
  }
  async function resolveTrack(id,level='standard'){
    await prepare();const expected=revision;const result=await fetchPlaybackIndex({cookie:cookie||{},sdk,ids:[id],level});
    if(expected!==revision)throw Error('账号已变化，请重新播放。');return result;
  }
  return{state,createQr,checkQr,cancel,logout,index,remember,request,resolveTrack,ready:()=>ready,retryRestore,prepare,dispose:reset};
}
