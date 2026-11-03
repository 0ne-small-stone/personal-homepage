import {createSoundscapeGraph,glide,soundscapeConfig} from './soundscape-graph.mjs';

// A late resume never grants permission after an off, interruption or teardown.
export class SoundscapeRuntime {
  /** @param {{createContext?:()=>AudioContext,publish?:(value:any)=>void,schedule?:typeof setTimeout,cancel?:typeof clearTimeout,canStart?:()=>boolean}} options */
  constructor({createContext=()=>new AudioContext(),publish=()=>{},schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),canStart=()=>true}={}) {
    this.createContext=createContext;this.publish=publish;this.schedule=schedule;this.cancel=cancel;
    this.canStart=canStart;this.context=null;this.graph=null;this.timer=null;this.revision=0;this.disposed=false;
    this.enabled=false;this.phase='off';this.chapter=null;this.volume=.75;this.reason='';
  }
  snapshot(){return {phase:this.phase,enabled:this.enabled,chapter:this.chapter,reason:this.reason,
    context:this.context?.state||'absent',sources:this.graph?1:0,revision:this.revision,
    gain:this.graph?.gain.gain.value||0,
    target:this.enabled&&this.chapter?soundscapeConfig.gain*soundscapeConfig.chapters[this.chapter][2]*this.volume:0};}
  notify(){this.publish(this.snapshot());}
  clear(){if(this.timer!==null)this.cancel(this.timer);this.timer=null;}
  setChapter(chapter){
    if(this.disposed||this.chapter===chapter)return;
    this.chapter=Object.hasOwn(soundscapeConfig.chapters,chapter)?chapter:null;
    if(this.graph&&this.context){const c=this.chapter&&soundscapeConfig.chapters[this.chapter],now=this.context.currentTime;
      if(c){glide(this.graph.high.frequency,c[0],now,1.2);glide(this.graph.low.frequency,c[1],now,1.2);}
      glide(this.graph.gain.gain,c&&this.enabled?soundscapeConfig.gain*c[2]*this.volume:0,now,1.2);}
    this.notify();
  }
  setVolume(volume){this.volume=Number.isFinite(volume)?Math.min(1,Math.max(0,volume)):0;
    if(this.enabled&&this.graph&&this.context&&this.chapter)glide(this.graph.gain.gain,soundscapeConfig.gain*soundscapeConfig.chapters[this.chapter][2]*this.volume,this.context.currentTime,.1);}
  async start() {
    if(this.disposed||!this.chapter||this.phase==='starting')return;
    const revision=++this.revision;this.clear();this.enabled=false;this.phase='starting';this.reason='';this.notify();
    try {
      if(!this.context){this.context=this.createContext();this.graph=createSoundscapeGraph(this.context);}
      const context=this.context;
      // Creation/resume happen synchronously in the button gesture, before await.
      const resumed=context.resume();
      this.timer=this.schedule(()=>{if(revision===this.revision){this.stop('error',0);this.reason='浏览器未能开启声音，请点按重试。';this.notify();}},2000);
      await resumed;
      if(revision!==this.revision||this.disposed){if(!['starting','on'].includes(this.phase)&&this.context===context)void context.suspend().catch(()=>{});return;}
      this.clear();
      if(!this.canStart()){this.stop('paused',0);return;}
      if(context.state!=='running')throw new Error('Audio context is not running');
      this.enabled=true;this.phase='on';
      const c=soundscapeConfig.chapters[this.chapter];
      glide(this.graph.high.frequency,c[0],context.currentTime,.5);glide(this.graph.low.frequency,c[1],context.currentTime,.5);
      glide(this.graph.gain.gain,soundscapeConfig.gain*c[2]*this.volume,context.currentTime,.5);this.notify();
    } catch {
      if(revision!==this.revision||this.disposed)return;
      this.stop('error',0);this.reason='浏览器未能开启声音，请点按重试。';this.notify();
    }
  }
  stop(phase='off',seconds=.1,reason='') {
    if(this.disposed)return;
    ++this.revision;this.clear();this.enabled=false;this.phase=phase;this.reason=reason;
    const context=this.context,graph=this.graph,revision=this.revision;
    if(context&&graph){glide(graph.gain.gain,0,context.currentTime,seconds);
      const suspend=()=>{this.timer=null;if(revision!==this.revision||this.disposed)return;
        void context.suspend().then(()=>{if(revision===this.revision&&!this.disposed)this.notify();}).catch(()=>{});};
      if(seconds)this.timer=this.schedule(suspend,seconds*1000+15);else suspend();}
    this.notify();
  }
  release(){
    if(this.disposed)return;
    this.stop('off',0);++this.revision;this.clear();
    const context=this.context;this.graph?.dispose();this.graph=null;this.context=null;
    if(context)void context.close().catch(()=>{});
    this.notify();
  }
  dispose(){if(this.disposed)return;this.release();this.disposed=true;}
}
