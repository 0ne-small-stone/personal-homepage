import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the actual component's iframe-load path with a cached non-first page.
// No pagerendered event will replay after it finished before the listener existed.
const component=readFileSync(new URL('../../src/components/PdfReader.astro',import.meta.url),'utf8');
const script=component.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*attachPdfReadingProgress.*\r?\n/m,'');
const compiled=ts.transpileModule(script,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
function fixture(states){
 const load={};const events={};const status={textContent:'正在加载 PDF…'};const failure={hidden:true};
 const frame={dataset:{pages:'23'},contentWindow:{PDFViewerApplication:{initializedPromise:Promise.resolve(),eventBus:{on(name,fn){events[name]=fn;}},pdfViewer:{currentPageNumber:3,getPageView(index){return {renderingState:states[index]??0};}}}},addEventListener(name,fn){load[name]=fn;}};
 class Element{constructor(){this.attrs={'aria-busy':'true'};}querySelector(selector){return ({iframe:frame,'[data-status]':status,'[data-error]':failure})[selector];}setAttribute(name,value){this.attrs[name]=value;}}
 let Reader;
 vm.runInNewContext(compiled,{HTMLElement:Element,AbortController,attachPdfReadingProgress:()=>()=>{},customElements:{get:()=>undefined,define(_name,ctor){Reader=ctor;}}});
 const reader=new Reader();reader.connectedCallback();
 return {reader,status,failure,load,events};
}
test('cached restored page completes the outer reader without a replayed render event',async()=>{
 const f=fixture({0:0,2:3});await f.load.load();
 assert.equal(f.reader.attrs['aria-busy'],'false');
 assert.equal(f.status.textContent,'共 23 页 · 可翻页、缩放与搜索');
 assert.equal(f.failure.hidden,true);
});
test('an unfinished restored page waits for rendering even if the first page finished',async()=>{
 const f=fixture({0:3,2:1});await f.load.load();
 assert.equal(f.reader.attrs['aria-busy'],'true');
 f.events.pagerendered({});assert.equal(f.reader.attrs['aria-busy'],'false');
 f.events.documenterror({error:new Error('decode failed')});
 assert.equal(f.status.textContent,'PDF 加载失败');assert.equal(f.failure.hidden,false);
});
