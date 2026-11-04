import {useLayoutEffect,useRef,useState} from 'react';
import {audioSession,type AudioTrack} from '../../lib/audio-session';
import playlist from '../../data/music/netease-playlist.json';

const track:AudioTrack={id:'29600129',title:'Breathe (In the Air)',artist:'Pink Floyd',album:'The Dark Side of the Moon',source:'netease',audioUrl:'',quality:'standard',coverUrl:playlist.tracks.find(item=>item.album==='The Dark Side of the Moon')?.coverUrl};
type State={phase:string;reason:string};
const initial:State={phase:'off',reason:''};
export default function HomeSoundscape(){
  const [state,setState]=useState(initial),[blocked,setBlocked]=useState('');
  const enable=useRef(()=>{});
  useLayoutEffect(()=>{
    const body=document.body,abort=new AbortController(),options={signal:abort.signal};
    const diagnostics=new URLSearchParams(location.search).has('opticsDebug');
    let dead=false,leaving=false,requested=false,claiming=false,heard=false,stoppedAtPause=false;
    let owned:ReturnType<typeof audioSession.createOwnedPlayback>|null=null;
    let carrier:HTMLAudioElement|null=null,detach=()=>{};
    const publish=(phase:string,reason='')=>{
      if(dead)return;setState(previous=>previous.phase===phase&&previous.reason===reason?previous:{phase,reason});
      if(diagnostics)body.dataset.homeSound=JSON.stringify({phase,enabled:requested,track:track.id,owned:Boolean(owned?.owns()),previewSeconds:audioSession.getSnapshot().previewSeconds,context:'absent',sources:0});
    };
    function obstruction(){
      const snapshot=audioSession.getSnapshot();
      if(leaving||document.hidden)return '页面已暂停，请再次开启声景。';
      if(document.querySelector('[data-home-guestbook] dialog[open]'))return '留言收起后可手动开启声景。';
      if(!owned?.owns()&&(snapshot.playing||snapshot.waiting||carrier&&!carrier.paused&&!carrier.ended))return '音乐暂停后可手动开启声景。';
      if(snapshot.volume===0||carrier&&(carrier.muted||carrier.volume===0))return '恢复音乐音量后可手动开启声景。';
      return '';
    }
    function stop(phase='off',reason=''){
      requested=false;stoppedAtPause=false;const previous=owned;owned=null;
      // The lease checks identity; cleanup can never stop a newer music session.
      previous?.stop();publish(phase,reason);
    }
    function sync(){
      if(dead)return;
      const audio=document.getElementById('lssh-global-audio');
      if(audio!==carrier){detach();carrier=audio instanceof HTMLAudioElement?audio:null;
        const bound=carrier,events=['play','playing','waiting','pause','ended','error','volumechange'];
        if(bound){events.forEach(event=>bound.addEventListener(event,sync));detach=()=>events.forEach(event=>bound.removeEventListener(event,sync));}else detach=()=>{};
      }
      if(claiming)return;
      const snapshot=audioSession.getSnapshot(),reason=obstruction();setBlocked(previous=>previous===reason?previous:reason);
      if(!requested){
        // Chromium can dispatch pause/timeupdate immediately before ended.
        if((owned||stoppedAtPause)&&carrier?.ended&&snapshot.track?.id===track.id){stoppedAtPause=false;publish('ended','播放结束，点击可重新聆听。');}
        return;
      }
      if(!owned?.owns()){
        const ended=Boolean(carrier?.ended);
        stop(ended?'ended':'yielded',ended?'播放结束，点击可重新聆听。':'已让位给音乐，需手动重新开启。');return;
      }
      if(reason){stop(reason.includes('音量')?'muted':'paused',reason);return;}
      if(snapshot.error){stop('error',snapshot.error);return;}
      if(snapshot.playing)heard=true;
      if(heard&&!snapshot.playing&&!snapshot.waiting&&carrier?.paused){
        if(carrier.ended||carrier.duration>0&&carrier.currentTime>=carrier.duration){
          // Keep the lease until audio-session consumes native ended. Releasing
          // it on the preceding pause would expose the user's repeat/queue.
          requested=false;publish('ended','播放结束，点击可重新聆听。');return;
        }
        stop('paused','播放已暂停，点击可重新聆听。');stoppedAtPause=true;return;
      }
      const notice=snapshot.previewSeconds?`${Math.round(snapshot.previewSeconds)} 秒试听 · Breathe (In the Air)`:'Breathe (In the Air) · Pink Floyd';
      publish(snapshot.playing?'on':'starting',notice);
    }
    const unsubscribe=audioSession.subscribe(sync);
    const dialog=document.querySelector('[data-home-guestbook] dialog');
    const observer=new MutationObserver(sync);if(dialog)observer.observe(dialog,{attributes:true,attributeFilter:['open']});
    const halt=()=>{leaving=true;stop('paused','页面已暂停，请再次开启声景。');};
    const destroy=()=>{if(dead)return;halt();dead=true;detach();unsubscribe();observer.disconnect();abort.abort();delete body.dataset.homeSound;};
    document.addEventListener('visibilitychange',sync,options);
    window.addEventListener('pagehide',halt,options);
    window.addEventListener('pageshow',()=>{leaving=false;sync();},options);
    document.addEventListener('astro:before-swap',destroy,options);
    enable.current=()=>{
      if(requested){stop();return;}
      sync();if(obstruction())return;
      requested=true;heard=false;owned=audioSession.createOwnedPlayback(track);claiming=true;publish('starting','正在连接 Breathe (In the Air)…');
      const pending=owned.start();claiming=false;sync();void pending.then(sync);
    };
    sync();publish('off');return destroy;
  },[]);
  const active=state.phase==='on'||state.phase==='starting';
  const label=({on:'开',starting:'连接中',off:'关',yielded:'让位',muted:'静音',paused:'暂停',ended:'结束',error:'重试'} as Record<string,string>)[state.phase]||'关';
  const reason=blocked||state.reason;
  return <span className="home-sound-control"><button type="button" className="home-sound" aria-pressed={active} aria-disabled={!active&&Boolean(blocked)} aria-describedby={reason?'home-sound-reason':undefined} aria-label={active?'关闭声景':`开启 Breathe 声景${reason?`，${reason}`:''}`} onClick={()=>enable.current()}>声景：{label}</button><span id="home-sound-reason" className="home-sound-reason" role="status">{reason}</span></span>;
}
