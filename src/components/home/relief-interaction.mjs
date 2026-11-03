// Input updates targets only. The existing demand-driven scene owns time.
export function createReliefInteraction() {
  return {x:0,y:0,amount:0,targetX:0,targetY:0,targetAmount:0};
}

export function stepReliefInteraction(state,dt,enabled) {
  if(!enabled)return;
  const mix=1-Math.exp(-14*Math.min(Math.max(dt,0),.05));
  for(const [value,target] of [['x','targetX'],['y','targetY'],['amount','targetAmount']]) {
    const next=state[value]+(state[target]-state[value])*mix;
    state[value]=Math.abs(state[target]-next)<.0001?state[target]:next;
  }
}

export function reliefSize(aspect) {
  const width=Math.min(8,4.5*aspect);
  return {width,height:width/aspect};
}

export function installReliefInteraction({state,hit,entry,section,allowed,wake,host=window,doc=document}) {
  const abort=new AbortController(),options={signal:abort.signal};
  const reset=()=>{state.targetX=0;state.targetY=0;state.targetAmount=0;wake();};
  const point=event=>{
    if(!allowed()||section.dataset.workActive!=='true'||event.pointerType==='touch')return;
    const rect=hit.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return;
    state.targetX=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));
    state.targetY=Math.max(-1,Math.min(1,1-(event.clientY-rect.top)/rect.height*2));
    state.targetAmount=1;wake();
  };
  for(const type of ['pointerenter','pointermove'])hit.addEventListener(type,point,{...options,passive:true});
  for(const type of ['pointerleave','pointercancel'])hit.addEventListener(type,reset,options);
  entry.addEventListener('focus',()=>{
    if(!allowed())return;
    state.targetX=-.35;state.targetY=.3;state.targetAmount=.65;wake();
  },options);
  entry.addEventListener('blur',reset,options);
  host.addEventListener('blur',reset,options);
  doc.addEventListener('visibilitychange',reset,options);
  doc.addEventListener('lssh:home-controls-state',reset,options);
  return()=>{abort.abort();state.targetX=0;state.targetY=0;state.targetAmount=0;};
}
