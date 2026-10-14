// Opt-in local diagnostics; no animation loop, network reporting, or visible UI.
const enabled=new URL(location.href).searchParams.has('perf');
const groups=new Map();let phase='sphere',lastFrame=0,lastFlush=0;
let output,gpuContext,gpuTimer;const pendingGPU=[];
if(enabled){output=document.createElement('output');output.id='performance-stats';output.hidden=true;document.body.append(output);}
function record(name,value,recordPhase=phase){
  if(!enabled)return;
  const key=`${recordPhase}:${name}`;let values=groups.get(key);
  if(!values){values=[];groups.set(key,values);}if(values.length<5000)values.push(value);
}
export const probe={
  inspectRenderer(renderer){
    if(!enabled)return;
    gpuContext=renderer.getContext();gpuTimer=gpuContext.getExtension('EXT_disjoint_timer_query_webgl2');
    output.dataset.gpuTimer=gpuTimer?'available':'unavailable';
    output.dataset.context=JSON.stringify({antialias:renderer.getContextAttributes().antialias,samples:gpuContext.getParameter(gpuContext.SAMPLES)});
  },
  render(renderer,scene,camera){
    if(!enabled)return renderer.render(scene,camera);
    const start=performance.now(),gl=gpuContext;let query;
    if(gpuTimer){
      const disjoint=gl.getParameter(gpuTimer.GPU_DISJOINT_EXT);
      for(let i=pendingGPU.length-1;i>=0;i--){const item=pendingGPU[i];if(disjoint||gl.getQueryParameter(item.query,gl.QUERY_RESULT_AVAILABLE)){
        if(!disjoint)record('gpuRender',gl.getQueryParameter(item.query,gl.QUERY_RESULT)/1e6,item.phase);
        gl.deleteQuery(item.query);pendingGPU.splice(i,1);
      }}
      if(!disjoint&&pendingGPU.length<4){query=gl.createQuery();gl.beginQuery(gpuTimer.TIME_ELAPSED_EXT,query);}
    }
    try{renderer.render(scene,camera);}finally{
      if(query){gl.endQuery(gpuTimer.TIME_ELAPSED_EXT);pendingGPU.push({query,phase});}
      record('render',performance.now()-start);record('renders',1);record('drawCalls',renderer.info.render.calls);
      output.dataset.renderer=JSON.stringify({width:renderer.domElement.width,height:renderer.domElement.height,dpr:renderer.getPixelRatio(),textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,programs:renderer.info.programs.length});
    }
  },
  ready(){if(enabled){record('readyMs',performance.now(),'loading');this.flush(true);}},
  dispose(){if(!enabled)return;for(const item of pendingGPU)gpuContext?.deleteQuery(item.query);pendingGPU.length=0;},
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
