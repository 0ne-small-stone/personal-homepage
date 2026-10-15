import {useEffect,useRef,useState} from 'react';
import AlbumArtwork from './AlbumArtwork';
import '../../styles/music-downloads.css';
interface Result {id:string;title:string;artist:string;album:string;duration:string;coverUrl:string|null;qualities:string[]}
interface Job {id:string;resultId:string;title:string;artist:string;quality:string;status:string;received:number;total:number;error:string;trackId:string}
const labels:Record<string,string>={'128k':'标准 · 128 kbps','320k':'高品质 · 320 kbps',flac:'无损 · FLAC',flac24bit:'无损 · 24 bit',hires:'Hi-Res',atmos:'杜比全景声',atmos_plus:'全景声增强',master:'母带'};
const stages:Record<string,string>={queued:'等待下载',resolving:'正在解析音源',downloading:'正在下载',verifying:'正在核验文件',completed:'已加入曲库',cancelled:'已取消',failed:'下载失败'};
const finished=(job:Job)=>['completed','failed','cancelled'].includes(job.status);
const best=(qualities:string[])=>['hires','flac24bit','flac','320k','128k'].find(quality=>qualities.includes(quality))||qualities[0];
export default function LxDownloadPanel({active,onComplete,onLibrary,cloudUrl,lxInstallUrl}:{active:boolean;onComplete:()=>void;onLibrary:(title:string)=>void;cloudUrl:string;lxInstallUrl:string}) {
  const [ready,setReady]=useState(false),[platforms,setPlatforms]=useState<{id:string;name:string}[]>([]);
  const [source,setSource]=useState('kw'),[keyword,setKeyword]=useState(''),[results,setResults]=useState<Result[]>([]);
  const [searched,setSearched]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[jobs,setJobs]=useState<Job[]>([]);
  const [qualities,setQualities]=useState<Record<string,string>>({}),[page,setPage]=useState(1),[more,setMore]=useState(false);
  const controller=useRef<AbortController|null>(null),completed=useRef(new Set<string>()),mounted=useRef(true);
  const callbacks=useRef({onComplete});callbacks.current={onComplete};
  const base=`${import.meta.env.BASE_URL}api/music/lx/`;
  async function api(route:string,input?:unknown,signal?:AbortSignal){
    const response=await fetch(base+route,{method:input?'POST':'GET',headers:input?{'Content-Type':'application/json'}:undefined,body:input?JSON.stringify(input):undefined,cache:'no-store',signal});
    let data;try{data=await response.json();}catch{throw new Error('网页下载仅在本机音乐服务中可用。');}
    if(!response.ok)throw new Error(data.error||'下载服务暂时不可用，请重试。');return data;
  }
  function updateJobs(next:Job[]){
    setJobs(next);for(const job of next)if(job.status==='completed'&&!completed.current.has(job.id)){completed.current.add(job.id);callbacks.current.onComplete();}
  }
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{
    if(!active)return;const abort=new AbortController();
    api('status',undefined,abort.signal).then(data=>{if(!abort.signal.aborted){setReady(data.ready);setPlatforms(data.platforms);updateJobs(data.jobs);setError('');}}).catch(error=>{if(!abort.signal.aborted){setReady(false);setError(error.message);}});
    return()=>abort.abort();
  },[active]);
  const downloading=jobs.some(job=>!finished(job));
  useEffect(()=>{
    if(!ready||(!active&&!downloading))return;const abort=new AbortController();
    const timer=window.setInterval(()=>{if(document.hidden)return;api('jobs',undefined,abort.signal).then(data=>{if(!abort.signal.aborted)updateJobs(data.jobs);}).catch(()=>{});},1500);
    return()=>{clearInterval(timer);abort.abort();};
  },[ready,active,downloading]);
  async function search(nextPage=1){
    if(!keyword.trim())return;controller.current?.abort();const abort=new AbortController();controller.current=abort;setBusy(true);setError('');
    try{const data=await api('search',{keyword:keyword.trim(),source,page:nextPage},abort.signal);if(!abort.signal.aborted){setResults(data.tracks);setPage(data.page);setMore(data.hasMore);setSearched(true);}}
    catch(error){if(!abort.signal.aborted)setError(error instanceof Error?error.message:'搜索失败，请重试。');}
    finally{if(mounted.current&&!abort.signal.aborted)setBusy(false);}
  }
  async function download(result:Result){
    setError('');try{const job=await api('download',{id:result.id,quality:qualities[result.id]||best(result.qualities)});if(mounted.current)setJobs(current=>[...current.filter(item=>item.id!==job.id),job]);}
    catch(error){if(mounted.current)setError(error instanceof Error?error.message:'下载未开始，请重试。');}
  }
  const renderJobs=(items:Job[])=><ul>{items.map(job=><li key={job.id}><div className="lx-job-heading"><strong>{job.title}</strong><span>{labels[job.quality]||job.quality}</span></div><div className="lx-job-state"><span>{stages[job.status]}{job.status==='downloading'&&job.total?` · ${Math.min(100,Math.floor(job.received/job.total*100))}%`:''}</span>{!finished(job)?<button type="button" onClick={()=>{void api('cancel',{id:job.id}).then(()=>api('jobs')).then(data=>updateJobs(data.jobs)).catch(()=>setError('取消暂时未生效，请重试。'));}}>取消</button>:job.status==='completed'?<button type="button" onClick={()=>onLibrary(job.title)}>在曲库查看</button>:null}</div>{job.status==='downloading'&&<progress aria-label={`${job.title}下载进度`} value={job.total?job.received:undefined} max={job.total||1} />}{job.error&&<p className="radio-error">{job.error}</p>}</li>)}</ul>;
  const pendingJobs=jobs.filter(job=>job.status!=='completed').slice(-5).reverse();
  const completedJobs=jobs.filter(job=>job.status==='completed').reverse();
  return <section className="lx-content" aria-labelledby="lx-page-title">
      <header className="lx-page-heading"><h2 id="lx-page-title">找音乐</h2><p>搜索歌曲，选择音质并收藏。下载完成后即可在电台播放。</p></header>
      <div className="lx-workspace">
      <div className="lx-search-area">
      <form className="lx-search" onSubmit={event=>{event.preventDefault();void search();}}>
        <label className="lx-query">歌曲或歌手<input id="lx-keywords" value={keyword} onChange={event=>setKeyword(event.target.value)} placeholder="搜索歌曲、歌手" maxLength={200} required /></label>
        <label>平台<select value={source} onChange={event=>{controller.current?.abort();setBusy(false);setSource(event.target.value);setResults([]);setSearched(false);}}>{platforms.length?platforms.map(platform=><option key={platform.id} value={platform.id}>{platform.name}</option>):<option value="kw">酷我</option>}</select></label>
        <button className="radio-primary" type="submit" disabled={!ready||busy}>{busy?'搜索中…':'搜索'}</button>
      </form>
      {error&&<p className="radio-error" role="alert">{error}</p>}
      {!ready&&error&&<button type="button" className="lx-connect-retry" onClick={()=>{setError('');void api('status').then(data=>{if(mounted.current){setReady(data.ready);setPlatforms(data.platforms);updateJobs(data.jobs);}}).catch(error=>{if(mounted.current)setError(error.message);});}}>重新连接</button>}
      </div>
      <section className="lx-jobs" aria-labelledby="lx-jobs-title"><h3 id="lx-jobs-title">下载进度</h3>{pendingJobs.length?renderJobs(pendingJobs):<p className="lx-job-empty">当前没有下载任务。<br />选一首喜欢的歌开始收藏。</p>}{completedJobs.length>0&&<details className="lx-completed"><summary>已收藏 {completedJobs.length} 首</summary>{renderJobs(completedJobs)}</details>}</section>
      <div className="lx-results-area" aria-busy={busy}>
        {!searched&&!busy&&<p className="lx-status">输入歌曲名或歌手，开始搜索。</p>}
        {busy&&<p className="lx-status" role="status">正在查找「{keyword}」…</p>}
        {!busy&&searched&&!results.length&&<p className="lx-status" role="status">没有找到这首歌。试试歌手名，或换一个平台。</p>}
        <ul className="lx-results">{results.map(result=>{
          const job=[...jobs].reverse().find(job=>job.resultId===result.id);const downloading=job&&!finished(job);
          return <li key={result.id}><AlbumArtwork src={result.coverUrl} title={result.album||result.title} artist={result.artist} className="lx-cover" /><div className="lx-song"><strong>{result.title}</strong><span title={`${result.artist} · ${result.album}`}>{result.artist}{result.album?` · ${result.album}`:''}</span><small>{result.duration}</small></div><div className="lx-result-actions"><select aria-label={`${result.title}的下载音质`} value={qualities[result.id]||best(result.qualities)||''} disabled={!result.qualities.length||Boolean(downloading)} onChange={event=>setQualities(current=>({...current,[result.id]:event.target.value}))}>{result.qualities.length?result.qualities.map(quality=><option key={quality} value={quality}>{labels[quality]||quality}</option>):<option value="">暂无可用音质</option>}</select><button type="button" className="lx-download-button" disabled={!result.qualities.length||Boolean(downloading)||job?.status==='completed'} onClick={()=>void download(result)}>{job?.status==='completed'?'已收藏':downloading?'下载中':job?.status==='failed'?'重试':'下载'}</button></div></li>;
        })}</ul>
        {searched&&<nav className="lx-pages" aria-label="搜索结果翻页"><button type="button" disabled={page===1||busy} onClick={()=>void search(page-1)}>上一页</button><span>第 {page} 页</span><button type="button" disabled={!more||busy} onClick={()=>void search(page+1)}>下一页</button></nav>}
      </div>
      </div>
      <footer className="lx-help"><a href={cloudUrl} target="_blank" rel="noopener noreferrer">考拉云盘</a><a href={lxInstallUrl} target="_blank" rel="noopener noreferrer">洛雪客户端</a><span>音质以来源支持和实际文件为准</span></footer>
  </section>;
}
