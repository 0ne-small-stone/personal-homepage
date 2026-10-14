import {probe} from './performance-probe.js';

const controls='.pswp__top-bar,.viewer-rail,.pswp__button--arrow';
const idleDelay=2500;

// Activity only moves a deadline. There is no idle animation/polling loop.
export function immersiveControls(pswp,{keyboardStart=false}={}){
  const root=pswp.element,abort=new AbortController(),pointers=new Set();
  let timer=0,lastActivity=performance.now(),keyboard=keyboardStart,hovering=false,stopped=false,hidden=false,position;
  function visible(show){
    if(stopped||hidden===!show)return;
    hidden=!show;root.classList.toggle('is-ui-idle',hidden);
    root.dataset.controls=hidden?'hidden':'visible';
  }
  function expire(){
    timer=0;if(stopped||document.hidden||keyboard||hovering||pointers.size)return;
    const remaining=idleDelay-(performance.now()-lastActivity);
    if(remaining>0)timer=setTimeout(expire,remaining);else visible(false);
  }
  function arm(){if(!stopped&&!timer&&!keyboard&&!document.hidden)timer=setTimeout(expire,idleDelay);}
  function activity(reveal=true){lastActivity=performance.now();if(reveal)visible(true);arm();}
  const listen=(element,name,handler)=>element.addEventListener(name,handler,{passive:true,signal:abort.signal});
  listen(root,'pointermove',event=>{
    if(event.pointerType==='mouse'){
      if(position&&position.x===event.clientX&&position.y===event.clientY)return;
      position={x:event.clientX,y:event.clientY};keyboard=false;
      hovering=!!event.target.closest?.(controls);activity();
    }else if(pointers.size)activity();
  });
  listen(root,'pointerleave',()=>{hovering=false;activity(false);});
  // Revealing controls changes hit-testing even if the mouse then stays still.
  listen(root,'pointerover',event=>{
    if(event.pointerType==='mouse'&&event.target.closest?.(controls)){hovering=true;activity();}
  });
  listen(root,'pointerout',event=>{
    if(event.pointerType==='mouse'&&!event.relatedTarget?.closest?.(controls)){hovering=false;activity(false);}
  });
  listen(root,'pointerdown',event=>{
    keyboard=false;pointers.add(event.pointerId);
    hovering=event.pointerType==='mouse'&&!!event.target.closest?.(controls);
    activity(event.pointerType!=='touch');
  });
  const release=event=>{if(pointers.delete(event.pointerId))activity(event.pointerType!=='touch');};
  listen(window,'pointerup',release);listen(window,'pointercancel',release);
  listen(root,'wheel',()=>{keyboard=false;activity();});
  listen(window,'keydown',event=>{
    if(event.key==='Escape'||event.ctrlKey||event.metaKey||event.altKey)return;
    keyboard=true;hovering=false;clearTimeout(timer);timer=0;activity();
  });
  listen(root,'focusin',()=>{if(keyboard)activity();});
  listen(document,'visibilitychange',()=>{
    clearTimeout(timer);timer=0;pointers.clear();hovering=false;
    if(!document.hidden)activity();
  });
  root.dataset.controls='visible';arm();
  return {
    activity,
    toggleTouch(){keyboard=false;hovering=false;lastActivity=performance.now();visible(hidden);arm();},
    stop(){if(stopped)return;stopped=true;clearTimeout(timer);timer=0;abort.abort();pointers.clear();}
  };
}

// Reuse the pinned core's three holders and critically damped swipe spring.
// Extra input stores one destination, rather than starting overlapping springs.
export function naturalNavigation(pswp,reduceMotion){
  let active=true,running=false,pending=null,started=0,fade;
  const root=pswp.element;
  const original={goTo:pswp.goTo,next:pswp.next,prev:pswp.prev};
  function distance(target){
    let diff=target-pswp.potentialIndex;const count=pswp.getNumItems();
    if(pswp.canLoop()){if(diff>count/2)diff-=count;else if(diff<-count/2)diff+=count;}
    return diff;
  }
  function request(index){
    if(!active)return;
    const target=pswp.getLoopedIndex(index);
    if(running){pending=target;root.dataset.requestedIndex=String(target);return;}
    const diff=distance(target);if(!diff)return;
    fade?.cancel();fade=null;pending=null;
    const slide= Math.abs(diff)===1&&!reduceMotion();
    running=slide;started=performance.now();root.dataset.requestedIndex=String(target);
    root.dataset.navigation=slide?(diff>0?'next':'prev'):'idle';
    probe.measure('viewer-navigation-start',()=>pswp.mainScroll.moveIndexBy(diff,slide));
    if(!slide&&!reduceMotion()){
      fade=pswp.currSlide.container.animate([{opacity:.55},{opacity:1}],{duration:180,easing:'cubic-bezier(.22,1,.36,1)'});
      fade.onfinish=()=>{fade=null;};
    }
  }
  pswp.goTo=request;
  pswp.next=()=>request((pending??pswp.potentialIndex)+1);
  pswp.prev=()=>request((pending??pswp.potentialIndex)-1);
  pswp.on('moveMainScroll',()=>{if(active&&running)probe.count('viewer-slide-frame');});
  pswp.on('change',()=>{
    if(!active||!running)return;
    running=false;root.dataset.navigation='idle';
    probe.count('viewer-navigation-ms',performance.now()-started);probe.flush(true);
    if(pending!==null){const target=pending;pending=null;queueMicrotask(()=>{if(active)request(target);});}
  });
  function settle(){
    pending=null;fade?.cancel();fade=null;
    if(!running)return;
    running=false;root.dataset.navigation='idle';pswp.animations.stopMainScroll();
    pswp.mainScroll.moveTo(pswp.mainScroll.getCurrSlideX());
    pswp.mainScroll.updateCurrItem();pswp.appendHeavy();
  }
  pswp.on('beforeResize',settle);
  root.dataset.navigation='idle';
  return {stop(){if(!active)return;settle();active=false;Object.assign(pswp,original);}};
}
