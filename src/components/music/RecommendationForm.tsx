import { useEffect, useRef, useState } from 'react';

interface Receipt { song: { title: string; artist: string }; status: string; message: string; }
const receiptKey = 'lssh.music.recommendation.v1';
export default function RecommendationForm({ apiUrl }: { apiUrl: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [local, setLocal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [song, setSong] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [open, setOpen] = useState(false);
  const submissionId = useRef('');
  const dialog = useRef<HTMLDialogElement>(null);
  const first = useRef<HTMLInputElement>(null);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;const controller = new AbortController();
    try { submissionId.current = localStorage.getItem(receiptKey) || ''; } catch {}
    async function status() {
      try {
        const response = await fetch(apiUrl + '/status',{cache:'no-store',credentials:'omit',signal:controller.signal});
        if(!response.ok)throw Error();const data=await response.json();
        if(alive.current){setAvailable(data.available===true);setLocal(data.local===true);}
        const receiptId = submissionId.current;
        if(receiptId) {
          const result = await fetch(apiUrl + '/recommendations/status?submissionId=' + encodeURIComponent(receiptId),{cache:'no-store',credentials:'omit',signal:controller.signal});
          if(result.ok && alive.current && receiptId === submissionId.current)setReceipt(await result.json());
        }
      } catch { if(alive.current && !controller.signal.aborted)setAvailable(false); }
    }
    void status();const interval=setInterval(()=>{if(!document.hidden)void status();},15000);
    return()=>{alive.current=false;controller.abort();clearInterval(interval);};
  }, [apiUrl]);
  useEffect(() => {
    if(!open || !dialog.current)return;
    const element=dialog.current;const origin=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    element.showModal();first.current?.focus();
    return()=>{element.close();document.body.style.overflow=overflow;origin?.focus({preventScroll:true});};
  }, [open]);
  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();if(!available || busy || receipt)return;
    setBusy(true);setError('');
    submissionId.current ||= crypto.randomUUID();
    try { localStorage.setItem(receiptKey,submissionId.current); } catch {}
    try {
      const response = await fetch(apiUrl + '/recommendations',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname,song,reason,submissionId:submissionId.current})});
      const data = await response.json();if(!response.ok)throw Error(data.error || '推荐暂时未能提交，请稍后重试。');
      if(alive.current)setReceipt(data);
    } catch(error) { if(alive.current)setError(error instanceof Error?error.message:'推荐暂时未能提交，请稍后重试。'); }
    finally { if(alive.current)setBusy(false); }
  }
  function another() { setReceipt(null);setSong('');setReason('');submissionId.current='';try{localStorage.removeItem(receiptKey);}catch{} }
  return <div className="music-recommend-entry">
    <button type="button" className="radio-refresh" onClick={()=>setOpen(true)}>推荐一首歌</button>
    {receipt && <span role="status">{receipt.message}</span>}
    {open && <dialog ref={dialog} className="music-recommend-dialog" aria-labelledby="recommend-title" onCancel={event=>{event.preventDefault();setOpen(false);}}>
      <header><h2 id="recommend-title">推荐一首歌</h2><button type="button" className="radio-refresh" aria-label="关闭推歌窗口" onClick={()=>setOpen(false)}>关闭</button></header>
      <p>把喜欢的歌分享给 Echoes。通过审核后，会加入网易云共享歌单。</p>
      {available===null?<p role="status">正在连接推荐服务…</p>:available===false?<p role="status">推荐服务尚未接通，暂时无法提交。你可以先打开共享歌单收听。</p>:receipt?<div className="music-recommend-receipt" role="status"><h3>{receipt.song.title}</h3><p>{receipt.song.artist}</p><p>{receipt.message}</p><button type="button" className="radio-primary" onClick={another}>再推荐一首</button></div>:<form onSubmit={submit}>
        <label>你的昵称<input ref={first} name="nickname" autoComplete="nickname" required maxLength={40} value={nickname} onChange={e=>setNickname(e.target.value)} /></label>
        <label>网易云单曲链接或歌曲 ID<input name="song" type="text" required maxLength={500} placeholder="https://music.163.com/song?id=… 或数字 ID" value={song} onChange={e=>setSong(e.target.value)} /></label>
        <label>推荐理由<textarea name="reason" required maxLength={500} rows={3} placeholder="这首歌打动你的地方" value={reason} onChange={e=>setReason(e.target.value)} /></label>
        <p className="radio-hint">昵称和理由会交给管理员审核，歌曲通过后加入共享歌单。提交后可以在这里查看处理状态。</p>
        {error&&<p role="alert" className="radio-error">{error}</p>}
        <button type="submit" className="radio-primary" disabled={busy}>{busy?'正在提交…':'提交推荐'}</button>
      </form>}
      {local&&<p className="radio-hint">当前连接本机推荐服务。<a href={`${import.meta.env.BASE_URL}music/manage/`} target="_blank" rel="noopener noreferrer">管理推荐（新窗口）</a></p>}
    </dialog>}
  </div>;
}
