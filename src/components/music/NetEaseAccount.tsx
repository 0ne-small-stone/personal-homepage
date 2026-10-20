import {useEffect,useRef,useState} from 'react';
import { cancelNativeDialog, useNativeDialog } from './useNativeDialog';
import {useMusicAccount} from './useMusicAccount';
import {musicAccountKey,type MusicAccountState} from '../../lib/music-account';
import {audioSession} from '../../lib/audio-session';
import {musicConfig} from '../../config/music';
import '../../styles/music-account.css';

type AccountState=MusicAccountState;
type LoginQr={image:string;expiresAt:number};
const base=`${import.meta.env.BASE_URL}api/music/playback`;
async function request(path:string,body?:object,signal?:AbortSignal) {
  const response=await fetch(`${base}/${path}`,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});
  if(response.status===404)throw Error('账号登录服务尚未连接，请稍后重试。');
  const data=await response.json();if(!response.ok)throw Error(data.error||'网易云服务暂时不可用，请重试。');return data;
}
export default function NetEaseAccount() {
  const {account,service,client,refetch}=useMusicAccount();
  const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [qr,setQr]=useState<LoginQr|null>(null);
  const [message,setMessage]=useState('使用网易云 App 扫码，并在手机上确认登录。');const [error,setError]=useState('');
  const dialog=useRef<HTMLDialogElement>(null);const mounted=useRef(false);const wasAuthorized=useRef(false);
  function apply(data:AccountState) {
    if(wasAuthorized.current&&!data.authorized&&audioSession.getSnapshot().track?.source==='netease')audioSession.stop();
    const changed=wasAuthorized.current!==data.authorized;wasAuthorized.current=data.authorized;client.setQueryData(musicAccountKey,data);if(changed)window.dispatchEvent(new Event('netease-account-change'));
  }
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{if(wasAuthorized.current&&!account.authorized&&audioSession.getSnapshot().track?.source==='netease')audioSession.stop();wasAuthorized.current=account.authorized;},[account.authorized]);
  useNativeDialog(dialog,open);
  useEffect(()=>{
    if(!open)return;
    return()=>{if(account.available)void request('cancel',{}).catch(()=>{});};
  },[open]);
  useEffect(()=>{
    if(!open||!qr||service!=='ready')return;
    let active=true;let checking=false;const controller=new AbortController();
    const check=async()=>{
      if(checking||document.hidden)return;checking=true;
      try{
        const next=await request('qr-check',{},controller.signal);if(!active)return;
        setMessage(next.message);setError('');
        if(next.code===803){apply(next);setQr(null);if(audioSession.getSnapshot().track?.source==='netease')audioSession.pause();}
        if(next.code===800)setQr(null);
      }catch(cause){if(active)setError(cause instanceof Error?cause.message:'扫码状态暂时无法读取，请重试。');}
      finally{checking=false;}
    };
    void check();const timer=setInterval(()=>void check(),3000);
    return()=>{active=false;controller.abort();clearInterval(timer);};
  },[open,qr,service]);
  async function createQr() {
    if(service!=='ready')return;
    setBusy(true);setError('');setQr(null);setMessage('正在生成登录二维码…');
    try{
      const next=await request('qr',{});if(!mounted.current)return;
      if(!next.image?.startsWith('data:image/png;base64,')||!Number.isFinite(next.expiresAt))throw Error('二维码格式无效，请重新获取。');
      setQr(next);setMessage('请用网易云 App 扫码。');
    }catch(cause){if(mounted.current){setError(cause instanceof Error?cause.message:'登录二维码暂时无法获取，请重试。');setMessage('可以重新生成二维码。');}}
    finally{if(mounted.current)setBusy(false);}
  }
  async function logout() {
    setBusy(true);setError('');
    try{const next=await request('logout',{});if(mounted.current){apply(next);setQr(null);setMessage('已退出当前电台账号。');}}
    catch(cause){if(mounted.current)setError(cause instanceof Error?cause.message:'退出未完成，请重试。');}
    finally{if(mounted.current)setBusy(false);}
  }
  async function saveOrRestore(path:'remember'|'restore') {
    setBusy(true);setError('');
    try{const next=await request(path,{});if(mounted.current){apply(next);setMessage(next.authorized?'登录已安全保存，下次启动自动恢复。':'请重新生成二维码登录。');}}
    catch(cause){if(mounted.current)setError(cause instanceof Error?cause.message:'操作未完成，请重试。');}
    finally{if(mounted.current)setBusy(false);}
  }
  function show(){setError('');setQr(null);setMessage('使用网易云 App 扫码，并在手机上确认登录。');setOpen(true);}
  return <div className="music-account">
    <button type="button" className="music-account-entry" aria-label={service!=='ready'?'网易云账号服务状态':account.authorized?`网易云账号：${account.account?.nickname}`:'登录网易云账号'} aria-haspopup="dialog" onClick={show}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></svg><span>{service==='checking'?'连接账号服务':service==='unavailable'?'账号服务未接通':account.restoring?'恢复登录中':account.authorized?account.account?.nickname:'登录网易云'}</span>
    </button>
    {open&&<dialog ref={dialog} className="music-account-dialog" aria-labelledby="music-account-title" onCancel={event=>cancelNativeDialog(event,()=>setOpen(false))}>
      <header><h2 id="music-account-title">{service!=='ready'?'网易云账号服务':account.authorized?'网易云账号':'登录网易云'}</h2><button type="button" className="music-account-close" aria-label="关闭账号窗口" onClick={()=>setOpen(false)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
      {service!=='ready'?<div className="music-account-unavailable"><p className="music-account-intro" role="status">{service==='checking'?'正在检查账号服务…':'账号服务尚未接通，当前无法扫码登录。你可以在网易云继续收听共享歌单。'}</p><div className="music-account-actions"><button type="button" className="music-account-primary" disabled={service==='checking'} onClick={()=>void refetch()}>{service==='checking'?'正在检查…':'重新检查服务'}</button><a className="radio-link" href={musicConfig.playlistUrl} target="_blank" rel="noopener noreferrer">打开共享歌单（新窗口）</a></div></div>:account.authorized?<div className="music-account-signed"><p className="music-account-nickname">{account.account?.nickname}</p><p>播放时使用你的账号权限。歌曲是否完整可听，以网易云实际返回为准。</p><div className="music-account-status" role="status">{account.saved?'登录已安全保存，下次启动自动恢复。':message.includes('登录成功')?message:'你已登录当前电台。'}</div><div className="music-account-actions"><button type="button" className="music-account-primary" onClick={()=>setOpen(false)}>完成</button>{account.saved===false&&<button type="button" disabled={busy} onClick={()=>void saveOrRestore('remember')}>重试保存登录</button>}<button type="button" disabled={busy} onClick={()=>void logout()}>{busy?'正在处理…':'退出当前账号'}</button></div></div>:<>
        <p className="music-account-intro">登录后，有权限的歌曲会使用账号音源播放。</p>
        <div className="music-account-qr">{qr?<img src={qr.image} width="224" height="224" alt="网易云登录二维码"/>:<span>{busy?'正在生成二维码…':'使用网易云 App 扫码登录'}</span>}</div>
        <p className="music-account-status" role="status">{message}</p>
        <div className="music-account-actions">{account.saved&&<><button type="button" disabled={busy||account.restoring} onClick={()=>void saveOrRestore('restore')}>恢复已保存登录</button><button type="button" disabled={busy} onClick={()=>void logout()}>清除已保存登录</button></>}<button type="button" className="music-account-primary" disabled={busy||account.restoring} onClick={()=>void createQr()}>{account.restoring?'正在恢复登录…':busy?'正在生成…':qr?'刷新二维码':'生成登录二维码'}</button></div>
      </>}
      {service==='ready'&&(error||account.persistenceError)&&<p className="music-account-error" role="alert">{error||account.persistenceError}</p>}
      {service==='ready'&&<p className="music-account-footnote">{account.local?(account.saved?'登录已在本机加密保存，退出账号会同时清除。':'登录将用本机当前用户加密保存，重启后自动恢复。'):'登录由当前播放服务管理，收听范围以账号实际权限为准。'}</p>}
    </dialog>}
  </div>;
}
