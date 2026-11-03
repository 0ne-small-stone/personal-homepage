import test from 'node:test';import assert from 'node:assert/strict';
import {SoundscapeRuntime} from '../src/components/home/soundscape-runtime.mjs';
import {noiseSamples,soundscapeConfig} from '../src/components/home/soundscape-graph.mjs';
function setup(){
  let queue=[],resolveResume,closed=0,stopped=0;
  const param=()=>({value:0,cancelAndHoldAtTime(){},linearRampToValueAtTime(v){this.value=v;}});
  const node=()=>({connect(){},disconnect(){},frequency:param(),gain:param(),Q:param(),start(){},stop(){stopped++;}});
  const ctx={state:'suspended',currentTime:0,destination:{},createBufferSource:node,createBiquadFilter:node,createGain:node,createBuffer:()=>({copyToChannel(){}}),resume(){return new Promise(r=>{resolveResume=()=>{this.state='running';r();};});},suspend(){this.state='suspended';return Promise.resolve();},close(){closed++;this.state='closed';return Promise.resolve();}};
  const runtime=new SoundscapeRuntime({createContext:()=>ctx,schedule(fn){queue.push(fn);return fn;},cancel(fn){queue=queue.filter(x=>x!==fn);}});runtime.setChapter('intro');
  return {runtime,ctx,get resume(){return resolveResume;},flush:()=>{const pending=queue;queue=[];pending.forEach(fn=>fn());},get closed(){return closed;},get stopped(){return stopped;}};
}
test('default creates no context, scrolling does not start it',()=>{const x=setup();x.runtime.setChapter('wall');assert.equal(x.runtime.context,null);assert.equal(x.runtime.enabled,false);});
test('late start after off stays silent and suspended',async()=>{const x=setup();const start=x.runtime.start();x.runtime.stop();x.resume();await start;assert.equal(x.runtime.enabled,false);assert.equal(x.ctx.state,'suspended');});
test('a previous resume cannot suspend a newer accepted start',async()=>{const x=setup();const old=x.runtime.start();const first=x.resume;x.runtime.stop();const next=x.runtime.start();x.resume();await next;first();await old;assert.equal(x.runtime.enabled,true);assert.equal(x.ctx.state,'running');});
test('stop cancels pending release when reenabled',async()=>{const x=setup();let p=x.runtime.start();x.resume();await p;x.runtime.stop();p=x.runtime.start();x.resume();await p;x.flush();assert.equal(x.ctx.state,'running');assert.equal(x.runtime.enabled,true);});
test('leaving while starting closes one graph, late resolution cannot resurrect it',async()=>{const x=setup();const p=x.runtime.start();x.runtime.dispose();x.resume();await p;assert.equal(x.runtime.context,null);assert.equal(x.runtime.enabled,false);assert.equal(x.closed,1);assert.equal(x.stopped,1);});
test('priority interruption latches; volume and chapter changes do not auto resume',async()=>{const x=setup();const p=x.runtime.start();x.resume();await p;x.runtime.stop('yielded',.065);x.flush();x.runtime.setVolume(.8);x.runtime.setChapter('album');assert.equal(x.runtime.phase,'yielded');assert.equal(x.runtime.enabled,false);assert.equal(x.runtime.graph.gain.gain.value,0);});
test('failed gesture remains recoverable without automatic retry',async()=>{const x=setup();x.ctx.resume=()=>Promise.reject(new Error('NotAllowed'));await x.runtime.start();assert.equal(x.runtime.phase,'error');assert.equal(x.runtime.enabled,false);assert.equal(x.ctx.state,'suspended');});
test('late media occupancy is rechecked before output',async()=>{const x=setup();x.runtime.canStart=()=>false;const p=x.runtime.start();x.resume();await p;assert.equal(x.runtime.enabled,false);assert.equal(x.ctx.state,'suspended');});
test('noise is reproducible, centered and bounded with a joined seam',()=>{const a=noiseSamples(),b=noiseSamples();assert.equal(a.length,soundscapeConfig.seconds*soundscapeConfig.sampleRate);assert.deepEqual(a,b);assert(Math.abs(a[0]-a.at(-1))<1e-7);assert(Math.abs(a.reduce((s,v)=>s+v,0)/a.length)<.001);});
