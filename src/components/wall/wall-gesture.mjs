import {CircleGesture} from './wall-world.mjs';

export function mountCircleGesture({stage,progress,blocked,onUnlock,clock=()=>performance.now(),idleMs=1800}){
  const circles=new CircleGesture(),events=new AbortController(),options={signal:events.signal};
  let timer=0,lastCount=0,samples=0,unlocked=false;
  function display(count){
    stage.dataset.circleLoops=String(count);
    if(count===lastCount)return;lastCount=count;
    progress.hidden=count===0;
    progress.textContent=count?'回声 '+count+' / 5':'';
  }
  function reset(){clearTimeout(timer);timer=0;circles.reset();unlocked=false;display(0);}
  function move(event){
    if(event.pointerType!=='mouse'||event.isPrimary===false)return;
    if(blocked()){reset();return;}
    let points=[];try{points=event.getCoalescedEvents?.()||[];}catch{}
    if(!points.length)points=[event];
    let count=0;
    for(const point of points){
      count=circles.add(point.clientX,point.clientY,Number.isFinite(point.timeStamp)&&point.timeStamp>0?point.timeStamp:clock());samples++;
      if(count>=5)break;
    }
    stage.dataset.circleSamples=String(samples);display(count);clearTimeout(timer);timer=0;
    if(count>=5&&!unlocked){unlocked=true;onUnlock(count,circles.center?{...circles.center}:null);return;}
    if(count>0)timer=setTimeout(reset,idleMs);
  }
  stage.addEventListener('pointermove',move,{...options,capture:true,passive:true});
  for(const name of ['pointerleave','pointercancel'])stage.addEventListener(name,reset,options);
  const page=stage.ownerDocument,host=page?.defaultView;
  page?.addEventListener('visibilitychange',()=>{if(page.hidden)reset();},options);
  host?.addEventListener('blur',reset,options);
  display(0);
  return {reset,dispose(){reset();events.abort();}};
}
