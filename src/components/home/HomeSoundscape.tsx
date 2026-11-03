import {useLayoutEffect,useRef,useState} from 'react';
import {audioSession} from '../../lib/audio-session';
import {SoundscapeRuntime} from './soundscape-runtime.mjs';
type State={phase:string;enabled:boolean;chapter:string|null;reason:string;context:string;sources:number;revision:number;target:number};
const initial:State={phase:'off',enabled:false,chapter:null,reason:'',context:'absent',sources:0,revision:0,target:0};
export default function HomeSoundscape(){
  const [state,setState]=useState<State>(initial),[blocked,setBlocked]=useState('');
  const runtime=useRef<SoundscapeRuntime|null>(null),button=useRef<HTMLButtonElement>(null);
  const enable=useRef(()=>{});
  useLayoutEffect(()=>{
    const body=document.body,abort=new AbortController(),options={signal:abort.signal};
    let dead=false,leaving=false,chapterTimer:ReturnType<typeof setTimeout>|undefined,pending='';
    let carrier:HTMLAudioElement|null=null,detach=()=>{};
    const diagnostics=new URLSearchParams(location.search).has('opticsDebug');
    let meterTimer:ReturnType<typeof setTimeout>|undefined,meter:AnalyserNode|null=null;
    const clearMeter=()=>{clearTimeout(meterTimer);meterTimer=undefined;if(meter){try{sound.graph?.gain.disconnect(meter);}catch{}meter.disconnect();meter=null;}};
    const sections=['intro','album','radio','projects','wall'];
    function obstruction(){
      const snapshot=audioSession.getSnapshot(),audio=document.getElementById('lssh-global-audio');
      const current=audio instanceof HTMLAudioElement?audio:null;
      if(leaving||document.hidden)return '页面已暂停，请再次开启声景。';
      if(document.querySelector('[data-home-guestbook] dialog[open]'))return '留言收起后可手动开启声景。';
      if(snapshot.playing||snapshot.waiting||current&& !current.paused&&!current.ended)return '音乐暂停后可手动开启声景。';
      if(snapshot.volume===0||current&&(current.muted||current.volume===0))return '恢复音乐音量后可手动开启声景。';
      return '';
    }
    const sound=new SoundscapeRuntime({publish:(value:State)=>{
      if(dead)return;setState(value);
      if(diagnostics){body.dataset.homeSound=JSON.stringify(value);clearMeter();
        if(value.enabled)meterTimer=setTimeout(()=>{
          if(dead||!sound.enabled||!sound.context||!sound.graph)return;
          const node=sound.context.createAnalyser();node.fftSize=2048;meter=node;sound.graph.gain.connect(node);
          meterTimer=setTimeout(()=>{const samples=new Float32Array(2048);node.getFloatTimeDomainData(samples);
            let sum=0,peak=0;for(const sample of samples){sum+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
            if(!dead&&sound.enabled)body.dataset.homeSoundSample=JSON.stringify({chapter:sound.chapter,context:sound.context?.state,rms:Math.sqrt(sum/samples.length),peak,contextTime:sound.context?.currentTime,sources:1});
            clearMeter();
          },100);
        },1800);
      }
    },canStart:()=>!obstruction()});
    runtime.current=sound;
    function sync(){
      if(dead)return;
      const audio=document.getElementById('lssh-global-audio');
      if(audio!==carrier){detach();carrier=audio instanceof HTMLAudioElement?audio:null;
        const bound=carrier;
        if(bound){['play','playing','waiting','pause','ended','error','volumechange'].forEach(event=>bound.addEventListener(event,sync));
          detach=()=>['play','playing','waiting','pause','ended','error','volumechange'].forEach(event=>bound.removeEventListener(event,sync));}
        else detach=()=>{};
      }
      const snapshot=audioSession.getSnapshot();sound.setVolume(Math.min(snapshot.volume,carrier?.volume??snapshot.volume));
      const reason=obstruction();setBlocked(reason);
      if(reason&&(sound.enabled||sound.phase==='starting'))sound.stop(reason.includes('音乐暂停')?'yielded':reason.includes('音量')?'muted':'paused',document.hidden||leaving?0:.065,reason);
    }
    function accept(chapter:string){
      if(chapter===pending)return;pending=chapter;clearTimeout(chapterTimer);
      chapterTimer=setTimeout(()=>{chapterTimer=undefined;if(!dead)sound.setChapter(chapter);},180);
    }
    function currentChapter(){
      const dynamic=body.dataset.homeMotion==='ready'&&body.dataset.homePaused!=='true'&&!body.classList.contains('home-quiet')&&!body.classList.contains('home-static');
      const producedChapter=body.dataset.chapter||'';
      if(dynamic&&sections.includes(producedChapter))return producedChapter;
      const anchor=innerHeight*.45;
      const rects=sections.map(id=>({id,rect:document.getElementById(id)?.getBoundingClientRect()}));
      const visible=rects.filter(item=>item.rect&&item.rect.bottom>0&&item.rect.top<innerHeight);
      const active=visible.find(item=>item.rect!.top<=anchor&&item.rect!.bottom>anchor)||visible.sort((a,b)=>Math.abs(a.rect!.top-anchor)-Math.abs(b.rect!.top-anchor))[0];
      return active?.id||'';
    }
    function chapter(){
      if(!dead)accept(currentChapter());
    }
    const observer=new MutationObserver(()=>{chapter();sync();});
    observer.observe(body,{attributes:true,attributeFilter:['class','data-home-motion','data-chapter','data-home-paused']});
    const dialog=document.querySelector('[data-home-guestbook] dialog');
    const dialogObserver=new MutationObserver(sync);if(dialog)dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
    const intersection=new IntersectionObserver(chapter,{threshold:[0,.25,.5,.75,1]});
    sections.forEach(id=>{const section=document.getElementById(id);if(section)intersection.observe(section);});
    window.addEventListener('scroll',chapter,{...options,passive:true});window.addEventListener('resize',chapter,options);
    const unsubscribe=audioSession.subscribe(sync);
    const halt=()=>{leaving=true;sync();sound.release();};
    const destroy=()=>{if(dead)return;halt();sound.dispose();dead=true;clearTimeout(chapterTimer);clearMeter();observer.disconnect();dialogObserver.disconnect();intersection.disconnect();detach();unsubscribe();abort.abort();runtime.current=null;delete body.dataset.homeSound;delete body.dataset.homeSoundSample;};
    document.addEventListener('visibilitychange',sync,options);
    window.addEventListener('pagehide',halt,options);window.addEventListener('pageshow',()=>{leaving=false;sync();chapter();},options);
    document.addEventListener('astro:before-swap',destroy,options);
    enable.current=()=>{sync();if(sound.enabled||sound.phase==='starting'){sound.stop();return;}
      if(obstruction())return;
      // Consume this gesture now; the normal chapter debounce must not drop it.
      clearTimeout(chapterTimer);chapterTimer=undefined;pending=currentChapter();sound.setChapter(pending);
      void sound.start().then(sync);};
    sync();chapter();
    if(typeof AudioContext==='undefined'){sound.phase='unsupported';sound.reason='当前浏览器不支持声景。';sound.notify();}
    return destroy;
  },[]);
  const unavailable=state.phase==='unsupported';
  const label=({on:'开',starting:'开启中',off:'关',yielded:'让位',muted:'静音',paused:'暂停',error:'重试',unsupported:'不可用'} as Record<string,string>)[state.phase]||'关';
  const reason=blocked||state.reason;
  return <span className="home-sound-control"><button ref={button} type="button" className="home-sound" aria-pressed={state.enabled&&state.phase==='on'} aria-disabled={Boolean(blocked)||unavailable} aria-describedby={reason?'home-sound-reason':undefined} aria-label={state.enabled?'关闭声景':`开启声景${reason?`，${reason}`:''}`} onClick={()=>{if(!unavailable)enable.current();}}>声景：{label}</button><span id="home-sound-reason" className="home-sound-reason" role="status">{reason}</span></span>;
}
