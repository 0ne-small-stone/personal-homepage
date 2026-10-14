// Diagnostic timings: JS submission is not a GPU completion time.
export class RenderTiming {
  constructor(renderer, canvas) {
    this.gl=renderer.getContext();this.ext=this.gl.getExtension('EXT_disjoint_timer_query_webgl2');this.canvas=canvas;
    const rendererInfo=this.gl.getExtension('WEBGL_debug_renderer_info');canvas.dataset.gpuRenderer=String(this.gl.getParameter(rendererInfo?rendererInfo.UNMASKED_RENDERER_WEBGL:this.gl.RENDERER));
    this.pending=[];this.gpu=[];this.gpuSamples=[];this.cpu=[];this.transport=[];this.gaps=[];this.draws=0;this.last=0;this.state='running';this.timer=0;
    this.output=document.createElement('p');this.output.setAttribute('data-performance','');
    this.output.style.cssText='position:absolute;left:16px;top:12px;margin:0;max-width:calc(100% - 32px);font-size:12px;color:#aaa;pointer-events:none';document.querySelector('main').append(this.output);
  }
  begin(time) {
    if(this.last)this.gaps.push(time-this.last);this.last=time;
    let query=null;if(this.ext&&this.pending.length<3){query=this.gl.createQuery();this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT,query);}
    this.query=query;this.start=performance.now();
  }
  end(transportMs,sourceSamples,phase='source',epoch=0) {
    this.cpu.push(performance.now()-this.start);if(transportMs!==null)this.transport.push(transportMs);this.draws++;
    if(this.query){this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);this.pending.push({query:this.query,sourceSamples,phase,epoch});this.query=null;}
    this.poll();this.publish();
  }
  poll() {
    if(!this.ext)return;
    const disjoint=this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    this.pending=this.pending.filter(({query,sourceSamples,phase,epoch})=>{if(!this.gl.getQueryParameter(query,this.gl.QUERY_RESULT_AVAILABLE))return true;
      if(!disjoint){const ms=this.gl.getQueryParameter(query,this.gl.QUERY_RESULT)/1e6;this.gpu.push(ms);this.gpuSamples.push({sourceSamples,ms,phase,epoch});}this.gl.deleteQuery(query);return false;});
    for(const array of [this.cpu,this.transport,this.gpu,this.gpuSamples,this.gaps])if(array.length>60)array.splice(0,array.length-60);
  }
  publish() {
    const mean=a=>a.length?a.reduce((s,n)=>s+n,0)/a.length:null;
    const result={draws:this.draws,state:this.state,jsRenderMs:mean(this.cpu),transportMs:mean(this.transport),gpuMs:mean(this.gpu),gpuLastMs:this.gpu.at(-1)??null,gpu128Ms:mean(this.gpuSamples.filter(s=>s.sourceSamples===128).map(s=>s.ms)),gpuMeasurements:this.gpuSamples,frameGapMs:mean(this.gaps),gpuTimerSupported:Boolean(this.ext)};
    this.canvas.dataset.draws=String(this.draws);this.canvas.dataset.renderState=this.state;this.canvas.dataset.timing=JSON.stringify(result);
    this.output.textContent=`渲染 ${this.draws} 帧 · ${this.state==='idle'?'静止停算':this.state==='hidden'?'后台停算':'计算中'} · JS提交 ${result.jsRenderMs?.toFixed(1)??'—'} ms · 光路 ${result.transportMs?.toFixed(1)??'—'} ms · 最近GPU帧 ${result.gpuLastMs?.toFixed(1)??'不可测'} ms`;
  }
  flush(retry=0){clearTimeout(this.timer);this.timer=0;this.poll();this.publish();if(this.pending.length&&retry<30)this.timer=setTimeout(()=>this.flush(retry+1),100);}
  dispose(){clearTimeout(this.timer);for(const {query} of this.pending)this.gl.deleteQuery(query);this.pending=[];}
}
