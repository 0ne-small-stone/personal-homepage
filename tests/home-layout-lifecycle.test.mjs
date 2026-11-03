import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile}from 'node:fs/promises';
import ts from 'typescript';
const data=js=>'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
const root=new URL('../src/components/home/',import.meta.url);
let code=ts.transpileModule(await readFile(new URL('home-return.ts',root),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
for(const name of ['home-return-policy.mjs','home-layout-position.mjs'])code=code.replace("from './"+name+"'",'from '+JSON.stringify(data(await readFile(new URL(name,root),'utf8'))));
const {installHomeReturn}=await import(data(code));

test('dynamic resize waits for the controller, then mode changes preserve actual chapter/progress',async()=>{
  const keys=['window','document','location','history','sessionStorage','MutationObserver','innerWidth','innerHeight','scrollY','scrollTo'],previous=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
  let geometryHeight=720,observeMutation;const classes=new Set(['home-enhanced']),dataset={homeMotion:'ready'};
  const body={dataset,classList:{contains:n=>classes.has(n)},hasAttribute:n=>n==='data-home-restoring'&&dataset.homeRestoring!==undefined};
  const ids=['intro','album','radio','projects','wall'];
  const sections=ids.map((id,index)=>({id,get offsetTop(){return classes.has('home-quiet')?index*600:[0,2*geometryHeight+100,3*geometryHeight+100,4*geometryHeight+100,11.5*geometryHeight+100][index];},get offsetHeight(){return classes.has('home-quiet')?600:(index===4?1.6*globalThis.innerHeight:geometryHeight);}}));
  const win=new EventTarget(),doc=Object.assign(new EventTarget(),{body,querySelectorAll:()=>sections,getElementById:id=>sections.find(s=>s.id===id)}),store=new Map();
  Object.assign(globalThis,{window:win,document:doc,location:{hostname:'localhost',search:'',href:'http://localhost/personal-homepage/#wall',hash:'#wall'},history:{state:{},replaceState(state){this.state=state;}},sessionStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},MutationObserver:class{constructor(callback){observeMutation=callback;}observe(){}disconnect(){}},innerWidth:1280,innerHeight:720,scrollY:0,scrollTo:(_,y)=>{globalThis.scrollY=y;}});
  doc.addEventListener('lssh:home-restore',e=>{globalThis.scrollY=e.detail.y;delete dataset.homeRestoring;});
  let stop;
  try {
    stop=installHomeReturn();assert.equal(scrollY,8380);
    globalThis.innerWidth=390;globalThis.innerHeight=844;win.dispatchEvent(new Event('resize'));
    observeMutation([]); // unrelated class mutation cannot consume the pending resize
    await Promise.resolve();assert.equal(scrollY,8380,'must not project against old --journey-height between resize listeners');
    geometryHeight=844;doc.dispatchEvent(new Event('lssh:home-layout-ready'));assert.equal(scrollY,9806);
    win.dispatchEvent(new Event('pagehide'));assert.equal(JSON.parse(store.get('lssh.home.return')).localProgress,0);
    doc.dispatchEvent(new CustomEvent('lssh:home-layout-before',{detail:{mode:'native'}}));classes.add('home-quiet');delete dataset.homeMotion;
    doc.dispatchEvent(new Event('lssh:home-layout-ready'));assert.equal(scrollY,2400);
    globalThis.scrollY=1320;win.dispatchEvent(new Event('scroll')); // actual radio; hash is still wall
    doc.dispatchEvent(new CustomEvent('lssh:home-layout-before',{detail:{mode:'dynamic'}}));classes.delete('home-quiet');dataset.homeMotion='ready';
    doc.dispatchEvent(new Event('lssh:home-layout-ready'));assert(Math.abs(scrollY-(2632+844*.2))<1e-8);
    win.dispatchEvent(new Event('pagehide'));const saved=JSON.parse(store.get('lssh.home.return'));assert.equal(saved.chapterId,'radio');assert(Math.abs(saved.localProgress-.2)<1e-10);
  }finally{stop?.();for(const [key,value]of Object.entries(previous))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});

test('a frozen demand frame flushes restore completion without advancing the driver or lerpers',async()=>{
  const previous=globalThis.__testFrameHook,frames=[];
  globalThis.__testFrameHook=(fn,priority)=>frames.push({fn,priority});
  let code=ts.transpileModule(await readFile(new URL('WorksMotionDriver.tsx',root),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  code=code.replace("from '@react-three/fiber'",'from '+JSON.stringify(data('export const useFrame=globalThis.__testFrameHook;')));
  try {
    const {default:Driver}=await import(data(code));let driven=0,advanced=0,flushed=0;
    Driver({model:{frameDelta:1/60,drive(){driven++;},afterFrame(){advanced++;},flushRestore(){flushed++;}},stopped:true});
    for(const frame of frames)frame.fn();assert.equal(driven,0);assert.equal(advanced,0);assert.equal(flushed,1);
  }finally{if(previous===undefined)delete globalThis.__testFrameHook;else globalThis.__testFrameHook=previous;}
});
