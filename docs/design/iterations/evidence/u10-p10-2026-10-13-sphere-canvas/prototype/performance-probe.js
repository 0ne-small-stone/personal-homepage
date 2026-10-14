// Opt-in local diagnostics; no animation loop, network reporting, or visible UI.
const enabled=new URL(location.href).searchParams.has('perf');
const groups=new Map();let phase='sphere',lastFrame=0,lastFlush=0;
let output;
if(enabled){output=document.createElement('output');output.id='performance-stats';output.hidden=true;document.body.append(output);}
function record(name,value){
  if(!enabled)return;
  const key=`${phase}:${name}`;let values=groups.get(key);
  if(!values){values=[];groups.set(key,values);}if(values.length<5000)values.push(value);
}
export const probe={
  phase(value){phase=value;},
  measure(name,work){if(!enabled)return work();const start=performance.now();try{return work();}finally{record(name,performance.now()-start);}},
  count(name,value=1){record(name,value);},
  frame(time){if(lastFrame&&time-lastFrame<250)record('frameInterval',time-lastFrame);lastFrame=time;},
  flush(force=false){
    if(!enabled||!force&&performance.now()-lastFlush<500)return;
    lastFlush=performance.now();const stats={};
    for(const [key,values] of groups){const sorted=[...values].sort((a,b)=>a-b);stats[key]={samples:values.length,total:+values.reduce((a,b)=>a+b,0).toFixed(2),mean:+(values.reduce((a,b)=>a+b,0)/values.length).toFixed(3),p95:+sorted[Math.floor((sorted.length-1)*.95)].toFixed(3),max:+sorted.at(-1).toFixed(3)};}
    output.textContent=JSON.stringify(stats);
  }
};
