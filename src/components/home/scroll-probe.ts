import type { WebGLRenderer } from 'three';
import type { JourneyModel } from './scene-state';
import {WallStageProbe} from './wall-stage-probe';

export const scrollProbeEnabled=()=>['127.0.0.1','localhost'].includes(location.hostname)&&['scrollPerf','wallPerf'].some(key=>new URLSearchParams(location.search).get(key)==='1');
type Sample={frame:number;at:number;dt:number;cpu:number;gpu?:number;probeWork?:number;resume:boolean;loading:boolean;phase:string;y:number;target:number;progress:number;centerTarget:number;index:number;prepare:number;expand:number;wall:number;calls:number;triangles:number;renders:number;inputAge:number;snap:boolean};
type TimerExtension={TIME_ELAPSED_EXT:number;GPU_DISJOINT_EXT:number};

// Opt-in, bounded inspection on the existing R3F clock. No RAF or readPixels.
export class ScrollProbe {
  readonly enabled=scrollProbeEnabled();
  readonly phased=this.enabled&&new URLSearchParams(location.search).get('wallPerf')==='1';
  private controller?:AbortController;
  private start=0;private frame=0;private publishAt=0;private lastRunning=true;
  private lastInput=-Infinity;private autoReset=true;private renderStart=0;private frameOwned=false;
  private samples:Sample[]=[];
  private inputs:{at:number;kind:string;delta?:number;id?:string}[]=[];
  private context?:WebGL2RenderingContext;private extension:TimerExtension|null=null;
  private activeQuery?:WebGLQuery;private pending:{query:WebGLQuery;sample:Sample}[]=[];
  private wall?:WallStageProbe;private probeWorkMs=0;
  constructor(private gl:WebGLRenderer,private model:JourneyModel){
    if(!this.enabled)return;
    this.context=gl.getContext() as WebGL2RenderingContext;
    this.extension=this.context.getExtension('EXT_disjoint_timer_query_webgl2');
    if(this.phased)this.wall=new WallStageProbe(gl);
  }
  install(){
    if(!this.enabled)return()=>{};
    if(this.wall)this.model.wallProbe=this.wall;
    this.controller=new AbortController();
    const input=(event:Event)=>{
      const at=performance.now();this.lastInput=at;
      const anchor=event.target instanceof Element?event.target.closest('a'):null;
      this.inputs.push({at,kind:event.type,...(event instanceof WheelEvent?{delta:event.deltaY}:{}),...(anchor?{id:anchor.id||anchor.getAttribute('aria-label')||''}:{})});
      if(this.inputs.length>40)this.inputs.shift();
    };
    for(const type of ['wheel','click','keydown'])window.addEventListener(type,input,{passive:true,capture:true,signal:this.controller.signal});
    const cancel=()=>{this.cancelFrame();this.clearPending();};
    window.addEventListener('pagehide',cancel,{signal:this.controller.signal});
    document.addEventListener('astro:before-swap',cancel,{signal:this.controller.signal});
    this.gl.domElement.addEventListener('webglcontextlost',cancel,{signal:this.controller.signal});
    return()=>this.dispose();
  }
  begin(){
    if(!this.enabled)return;
    this.cancelFrame();
    this.start=performance.now();this.frame++;
    this.wall?.beginFrame();
    this.autoReset=this.gl.info.autoReset;this.frameOwned=true;this.gl.info.autoReset=false;this.gl.info.reset();this.renderStart=this.gl.info.render.frame;
    const context=this.context!,ext=this.extension;
    if(ext&&this.frame%8===0&&this.pending.length<4&&!context.getQuery(ext.TIME_ELAPSED_EXT,context.CURRENT_QUERY)){
      const query=context.createQuery();if(query){this.activeQuery=query;context.beginQuery(ext.TIME_ELAPSED_EXT,query);}
    }
  }
  end(dt:number,resume:boolean,running:boolean){
    if(!this.enabled||!this.frameOwned)return;
    const now=performance.now(),m=this.model.motion,s=this.model.scrollSample;
    const row:Sample={frame:this.frame,at:now,dt:dt*1000,cpu:now-this.start,resume,loading:this.model.loading.active,phase:m.phase,
      y:m.scrollY,target:s?.targetY??m.scrollY,progress:s?.progress??m.raw.works,centerTarget:s?.centerTarget??m.rendered.index,index:m.rendered.index,
      prepare:m.rendered.prepare,expand:m.rendered.expand,wall:m.rendered.wall,calls:this.gl.info.render.calls,triangles:this.gl.info.render.triangles,
      renders:this.gl.info.render.frame-this.renderStart,inputAge:now-this.lastInput,snap:m.snapActive,...(this.wall?{...this.wall.take(),cards:m.cards.map(({index,alpha,visible})=>({index,alpha,visible}))}:{})};
    this.gl.info.autoReset=this.autoReset;this.frameOwned=false;
    const context=this.context!,ext=this.extension;
    if(this.activeQuery&&ext){context.endQuery(ext.TIME_ELAPSED_EXT);this.pending.push({query:this.activeQuery,sample:row});this.activeQuery=undefined;}
    if(ext){
      const disjoint=context.getParameter(ext.GPU_DISJOINT_EXT);
      for(let i=this.pending.length-1;i>=0;i--){
        const item=this.pending[i];
        if(context.getQueryParameter(item.query,context.QUERY_RESULT_AVAILABLE)){
          if(!disjoint)item.sample.gpu=context.getQueryParameter(item.query,context.QUERY_RESULT)/1e6;
          context.deleteQuery(item.query);this.pending.splice(i,1);
        }else if(disjoint){context.deleteQuery(item.query);this.pending.splice(i,1);}
      }
    }
    this.samples.push(row);if(this.samples.length>600)this.samples.shift();
    if(now>=this.publishAt||running!==this.lastRunning){
      this.publishAt=now+250;this.lastRunning=running;
      document.body.dataset.homeScrollPerf=JSON.stringify({kind:this.wall?'bounded CPU stages + resource deltas; no opticsDebug':'bounded lightweight probe; no opticsDebug',cpuInterval:'R3F -4 to +2, excludes probe polling/publication; not end-to-end',previousProbeWorkMs:this.probeWorkMs,gpuSupported:Boolean(ext),pendingGpu:this.pending.length,frame:this.frame,running,
        size:[this.gl.domElement.width,this.gl.domElement.height],samples:this.samples,inputs:this.inputs});
    }
    this.probeWorkMs=performance.now()-now;
    row.probeWork=this.probeWorkMs;
  }
  private cancelFrame(){
    if(this.frameOwned){this.gl.info.autoReset=this.autoReset;this.frameOwned=false;}
    const context=this.context,ext=this.extension;
    if(this.activeQuery&&context&&ext){
      if(!context.isContextLost()&&context.getQuery(ext.TIME_ELAPSED_EXT,context.CURRENT_QUERY)===this.activeQuery)context.endQuery(ext.TIME_ELAPSED_EXT);
      context.deleteQuery(this.activeQuery);this.activeQuery=undefined;
    }
  }
  private dispose(){
    this.controller?.abort();this.cancelFrame();
    this.clearPending();
    if(this.model.wallProbe===this.wall)delete this.model.wallProbe;
    delete document.body.dataset.homeScrollPerf;
  }
  private clearPending(){for(const item of this.pending)this.context?.deleteQuery(item.query);this.pending=[];}
}
