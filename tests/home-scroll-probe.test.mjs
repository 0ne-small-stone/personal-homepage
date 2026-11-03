import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../src/components/home/scroll-probe.ts',import.meta.url),'utf8');
const stageSource=await readFile(new URL('../src/components/home/wall-stage-probe.ts',import.meta.url),'utf8');
const stageJs=ts.transpileModule(stageSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const stageUrl='data:text/javascript;base64,'+Buffer.from(stageJs).toString('base64');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace("from './wall-stage-probe'",'from '+JSON.stringify(stageUrl));
const {ScrollProbe}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const {WallStageProbe}=await import(stageUrl);

test('staged resource deltas retain parent spans and identify unfinished work',()=>{
  const info={programs:[],memory:{textures:0,geometries:0},render:{calls:0,frame:0}};
  const probe=new WallStageProbe({info});probe.beginFrame();probe.start('outer');probe.start('inner');
  info.programs.push({});info.memory.textures++;info.render.calls=2;info.render.frame=1;
  probe.end('inner');probe.end('outer');probe.start('unfinished');
  const sample=probe.take();assert.deepEqual(sample.unfinished,['unfinished']);
  assert.deepEqual(sample.stages.map(s=>[s.name,s.programs,s.textures,s.calls,s.renders]),[['inner',1,1,2,1],['outer',1,1,2,1]]);
  probe.beginFrame();assert.deepEqual(probe.take().unfinished,[]);assert.deepEqual(probe.take().stages,[]);
});
test('unavailable program counters are missing rather than measured zero',()=>{
  const probe=new WallStageProbe({info:{memory:{textures:0,geometries:0},render:{calls:0,frame:0}}});
  probe.beginFrame();probe.start('unknown');probe.end('unknown');assert.equal(probe.take().stages[0].programs,null);assert.equal(probe.take().resources.programs,null);
});

test('probe restores renderer ownership and discards an interrupted GPU frame',()=>{
  const old={location:globalThis.location,window:globalThis.window,document:globalThis.document};
  globalThis.location={hostname:'localhost',search:'?scrollPerf=1'};
  globalThis.window=new EventTarget();globalThis.document=Object.assign(new EventTarget(),{body:{dataset:{}}});
  let active=null,deleted=0,ended=0,created=0;
  const ext={TIME_ELAPSED_EXT:1,GPU_DISJOINT_EXT:2};
  const context={CURRENT_QUERY:3,QUERY_RESULT_AVAILABLE:4,QUERY_RESULT:5,
    getExtension:()=>ext,isContextLost:()=>false,getQuery:()=>active,
    createQuery:()=>({id:++created}),beginQuery:(_,q)=>{active=q;},
    endQuery:()=>{active=null;ended++;},deleteQuery:()=>{deleted++;},
    getParameter:()=>false,getQueryParameter:(_,what)=>what===4?false:0};
  const canvas=new EventTarget();canvas.width=1280;canvas.height=720;
  const info={autoReset:true,render:{frame:0,calls:0,triangles:0},reset(){this.render.calls=0;this.render.triangles=0;}};
  const model={loading:{active:false},motion:{phase:'works',scrollY:0,raw:{works:0},rendered:{index:0,prepare:0,expand:0,wall:0},snapActive:false}};
  try {
    const probe=new ScrollProbe({getContext:()=>context,domElement:canvas,info},model),cleanup=probe.install();
    for(let i=0;i<7;i++){probe.begin();probe.end(.02,false,true);assert.equal(info.autoReset,true);}
    probe.begin();assert(active);assert.equal(info.autoReset,false); // deliberately omit end
    probe.begin();assert.equal(active,null);assert.equal(ended,1);assert.equal(deleted,1);
    info.render.calls=17;info.render.triangles=42;info.render.frame+=6;
    probe.end(.02,false,false);assert.equal(info.autoReset,true);
    let data=JSON.parse(document.body.dataset.homeScrollPerf),row=data.samples.at(-1);
    assert.equal(row.calls,17);assert.equal(row.triangles,42);assert.equal(row.renders,6);assert.equal(row.gpu,undefined);
    for(const type of ['pagehide','astro:before-swap']){
      probe.begin();(type==='pagehide'?window:document).dispatchEvent(new Event(type));assert.equal(info.autoReset,true);
      const count=JSON.parse(document.body.dataset.homeScrollPerf).samples.length;
      probe.end(.02,false,true);assert.equal(JSON.parse(document.body.dataset.homeScrollPerf).samples.length,count);
    }
    probe.begin();canvas.dispatchEvent(new Event('webglcontextlost'));assert.equal(info.autoReset,true);
    probe.begin();cleanup();assert.equal(info.autoReset,true);assert.equal(document.body.dataset.homeScrollPerf,undefined);
    // Preserve a renderer whose owner deliberately had autoReset disabled.
    info.autoReset=false;const second=new ScrollProbe({getContext:()=>context,domElement:canvas,info},model);
    const stop=second.install();second.begin();second.begin();second.end(.02,false,true);stop();assert.equal(info.autoReset,false);
  } finally {
    for(const [key,value]of Object.entries(old))if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
});
