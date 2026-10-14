import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { HomeLoadingGate, loadingDuration, wantsIntroReveal, type LoadingPhase } from './loading-state';
import type { JourneyModel } from './scene-state';

export function loadingPreviewMode() {
  if(typeof location==='undefined'||!['127.0.0.1','localhost'].includes(location.hostname))return '';
  const mode=new URLSearchParams(location.search).get('loadingPreview')??'';
  return ['1','slow','timeout','failure','reduced'].includes(mode)?mode:'';
}
export function initialHomeQuiet() {
  let paused=false;try{paused=sessionStorage.getItem('lssh.home.paused')==='true';}catch{}
  return {paused,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches||loadingPreviewMode()==='reduced'};
}

export function useHomeLoading(model:JourneyModel,wordmarkUrl:string,attempt:number,quiet:boolean) {
  const preview=loadingPreviewMode();
  const ownerBody=useRef(document.body);
  const gate=useMemo(()=>{
    let seen=false;try{seen=sessionStorage.getItem('lssh.home.seen')==='true';}catch{}
    const type=(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
    const eligible=wantsIntroReveal({seen:preview?false:seen,returning:preview?false:type==='back_forward'||Boolean(history.state?.lsshHome),hash:location.hash,scrollY,quiet});
    return new HomeLoadingGate(eligible);
  },[attempt]);
  const [phase,setPhase]=useState<LoadingPhase>('waiting');
  const [wordmarkDecoded,setDecoded]=useState(false);
  const [previewHeld,setHeld]=useState(preview==='1');
  const tween=useRef<gsap.core.Tween|null>(null);
  const message=phase==='error'?'场景未能呈现，已切换为普通浏览。':phase==='fallback'?'普通浏览':'';
  model.loading.active=gate.active;model.loading.progress=gate.progress;

  useLayoutEffect(()=>{
    const body=ownerBody.current;
    let alive=true,decoded=false,slowTimer:number|undefined,lastPhase='';
    let timeout:number|undefined,remaining=8000,started=0;
    const stopResourceWait=()=>{
      if(timeout!==undefined){clearTimeout(timeout);remaining=Math.max(0,remaining-(performance.now()-started));timeout=undefined;}
    };
    const armResourceWait=()=>{
      stopResourceWait();
      if(!alive||document.body!==body||document.hidden||gate.phase!=='waiting'||preview==='1')return;
      started=performance.now();
      timeout=window.setTimeout(()=>{
        timeout=undefined;remaining=0;
        if(alive&&document.body===body&&gate.phase==='waiting')gate.fallback(true,'resource-timeout');
      },remaining);
    };
    const events:{phase:string;time:number}[]=[];
    model.loading.compiled=false;model.loading.frameReady=false;
    const publish=()=>{
      if(!alive||document.body!==body)return;
      model.loading.active=gate.active;model.loading.progress=gate.progress;
      body.dataset.homeLoading=JSON.stringify({...gate.snapshot(),events,preview:preview||null,wordmarkDecoded:decoded,preference:quiet?'quiet':'motion'});
      body.style.setProperty('--home-loading-nav',String(Math.max(0,Math.min(1,(gate.progress-.4)/.5))));
      body.classList.toggle('home-loading-nav-ready',gate.progress>=.4);
      model.invalidate();
    };
    const sync=()=>{
      if(!alive||document.body!==body)return;
      armResourceWait();
      const active=gate.active,normal=gate.phase!=='error'&&gate.phase!=='fallback';
      if(lastPhase!==gate.phase){lastPhase=gate.phase;events.push({phase:gate.phase,time:performance.now()});}
      const focused=document.activeElement?.closest('.home-loader');
      body.classList.toggle('home-loading-active',active);
      body.classList.toggle('home-enhanced',normal);
      body.classList.toggle('home-static',!normal);
      body.dataset.homeStatus=gate.phase;
      setPhase(gate.phase);publish();
      if(gate.phase==='revealing'&&!tween.current) {
        const clock={value:0};
        tween.current=gsap.to(clock,{value:1,duration:loadingDuration,ease:'none',paused:document.hidden,
          onUpdate:()=>{if(!alive||document.body!==body)return;gate.advance(clock.value);publish();},
          onComplete:()=>{if(alive)gate.finish();}});
      }
      if(['ready','fallback','error'].includes(gate.phase)) {
        tween.current?.kill();tween.current=null;
        if((gate.phase==='ready'||gate.phase==='fallback')&&!preview)try{sessionStorage.setItem('lssh.home.seen','true');}catch{}
        if(focused)requestAnimationFrame(()=>{if(alive&&document.body===body)(body.querySelector<HTMLElement>(gate.phase==='ready'?'.home-scroll':'#main-content'))?.focus({preventScroll:true});});
      }
    };
    const unsubscribe=gate.subscribe(sync);
    model.loading.onCompiled=()=>gate.mark('compiled');
    model.loading.onFrame=()=>gate.mark('frame');
    model.loading.onSampleError=()=>{gate.bypass('sample-unavailable');gate.mark('frame');};
    const image=body.querySelector<HTMLImageElement>('.home-wordmark')??new Image();
    if(!image.src)image.src=wordmarkUrl;
    void image.decode().then(()=>{
      if(!alive||document.body!==body)return;decoded=true;body.classList.remove('home-wordmark-failed');setDecoded(true);publish();
      if(preview==='failure'){gate.fallback(true,'preview-resource-failure');return;}
      if(preview==='1'||preview==='timeout')return;
      if(preview==='slow')slowTimer=window.setTimeout(()=>gate.mark('wordmark'),2200);
      else gate.mark('wordmark');
    }).catch(()=>{
      if(!alive||document.body!==body)return;body.classList.add('home-wordmark-failed');gate.fallback(true,'wordmark-decode');
    });
    const blockInput=(event:Event)=>{
      if(!gate.active)return;
      if(event instanceof KeyboardEvent) {
        if(event.key==='Escape'){gate.fallback();return;}
        if(!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))return;
        if(event.key===' '&&(event.target instanceof HTMLButtonElement||event.target instanceof HTMLAnchorElement))return;
      }
      event.preventDefault();event.stopImmediatePropagation();
    };
    const navigate=(event:MouseEvent)=>{if(gate.active&&event.target instanceof Element&&event.target.closest('.home-header a,.home-skip'))gate.bypass('navigation');};
    const visibility=()=>{tween.current?.paused(document.hidden);armResourceWait();if(!document.hidden&&document.body===body)model.invalidate();};
    const controller=new AbortController();
    window.addEventListener('wheel',blockInput,{capture:true,passive:false,signal:controller.signal});
    window.addEventListener('touchmove',blockInput,{capture:true,passive:false,signal:controller.signal});
    window.addEventListener('keydown',blockInput,{capture:true,signal:controller.signal});
    document.addEventListener('click',navigate,{capture:true,signal:controller.signal});
    document.addEventListener('visibilitychange',visibility,{signal:controller.signal});
    return ()=>{
      alive=false;controller.abort();stopResourceWait();if(slowTimer!==undefined)clearTimeout(slowTimer);
      unsubscribe();gate.dispose();tween.current?.kill();tween.current=null;
      model.loading.active=false;model.loading.progress=1;model.loading.onFrame=undefined;model.loading.onCompiled=undefined;model.loading.onSampleError=undefined;
      body.classList.remove('home-loading-active','home-loading-nav-ready');body.style.removeProperty('--home-loading-nav');
      body.classList.remove('home-wordmark-failed');
      delete body.dataset.homeLoading;delete body.dataset.homeLoadingPass;
    };
  },[gate,model,wordmarkUrl]);
  useEffect(()=>{if(quiet)gate.bypass('preference');},[quiet,gate]);
  const seek=(progress:number)=>{
    if(!preview||!wordmarkDecoded)return;
    setHeld(true);gate.mark('wordmark');tween.current?.pause().progress(progress);
  };
  return {phase,message,active:gate.active,preview,previewHeld,wordmarkDecoded,
    layoutReady:()=>gate.mark('layout'),fallback:(error=false)=>gate.fallback(error),
    start:()=>{setHeld(false);gate.mark('wordmark');tween.current?.play();},seek};
}
