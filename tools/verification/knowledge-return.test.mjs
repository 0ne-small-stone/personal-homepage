import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';

const root=resolve(import.meta.dirname,'../..');
const config={bundle:true,write:false,format:'iife',platform:'browser',define:{'import.meta.env.BASE_URL':JSON.stringify('/personal-homepage/')},loader:{'.svg':'text','.css':'empty'},logLevel:'silent'};
const bundle=async file=>(await build({...config,entryPoints:[resolve(root,file)]})).outputFiles[0].text;
const article=await bundle('src/lib/article-navigation.ts');
const glyph=(await build({...config,stdin:{contents:"import {divisionBellGlyph} from './division-bell-glyph'; window.fixtureGlyph=divisionBellGlyph('knowledge-fixture');",loader:'ts',resolveDir:resolve(root,'src/components/navigation')}})).outputFiles[0].text;
const base='https://example.test/personal-homepage/';
const path='knowledge/blog/article-reading-check/';
const to=base+path;
const sources=[
 ['knowledge/?type=article&topic=reading&sort=title-asc','← 返回学习总览'],
 ['knowledge/blog/2/','← 返回文章列表'],
 ['knowledge/blog/tags/功能验证/','← 返回标签结果'],
 ['knowledge/?search=reading','← 返回搜索结果'],
];
function fixture(url=to,body=''){
 const dom=new JSDOM(`<meta name="lssh-reading-paths" content='["/personal-homepage/${path}"]'>${body}`,{url,pretendToBeVisual:true,runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 dom.window.matchMedia=()=>Object.assign(new dom.window.EventTarget(),{matches:false});
 return dom;
}
function returnAnchor(window){
 window.eval(glyph);
 const anchor=window.document.createElement('a');
 anchor.href=base+'knowledge/blog/'; anchor.dataset.articleReturn='';anchor.className='db-return';
 anchor.innerHTML=`<span class="db-return-glyph-slot">${window.fixtureGlyph}</span><span class="db-return-label" data-db="word">返回文章列表</span>`;
 window.document.body.append(anchor);return anchor;
}
for(const [source,label] of sources)test(`dynamic return keeps SVG and exact ${label} URL`,()=>{
 const dom=fixture(base+source);const w=dom.window;w.history.pushState({lsshArticleReturn:'visit',untouched:'state'},'',to);
 const anchor=returnAnchor(w),svg=anchor.querySelector('svg'),ids=Array.from(svg.querySelectorAll('[id]'),node=>node.id);
 w.sessionStorage.setItem('lssh:article-visits:v1',JSON.stringify([{id:'visit',from:base+source,to,scrollY:672,search:null,label}]));
 let calls=0;w.history.back=()=>calls++;
 w.eval(article);for(let i=0;i<4;i++)w.document.dispatchEvent(new w.Event('astro:page-load'));
 assert.equal(anchor.href,new URL(base+source).href);assert.equal(anchor.querySelector('.db-return-label').textContent,label.replace(/^←\s*/,''));
 assert.equal(anchor.getAttribute('aria-label'),label.replace(/^←\s*/,''));assert.equal(anchor.querySelector('svg'),svg);
 assert.deepEqual(Array.from(svg.querySelectorAll('[id]'),node=>node.id),ids);assert.equal(w.history.state.untouched,'state');
 const modifier=new w.MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true});anchor.dispatchEvent(modifier);assert.equal(calls,0);assert.equal(modifier.defaultPrevented,false);
 const plain=new w.MouseEvent('click',{bubbles:true,cancelable:true});anchor.dispatchEvent(plain);assert.equal(calls,1);assert.equal(plain.defaultPrevented,true);
 w.dispatchEvent(new w.Event('pagehide'));anchor.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));assert.equal(calls,1);
 dom.window.close();
});
test('direct deep link keeps real fallback despite unrelated stored visit',()=>{
 const dom=fixture(),w=dom.window,anchor=returnAnchor(w);const svg=anchor.querySelector('svg');
 w.sessionStorage.setItem('lssh:article-visits:v1',JSON.stringify([{id:'stale',from:base+'knowledge/',to,scrollY:0,search:null,label:'← 返回上一页'}]));
 w.eval(article);assert.equal(anchor.href,base+'knowledge/blog/');assert.equal(anchor.querySelector('svg'),svg);assert.equal(anchor.querySelector('.db-return-label').textContent,'返回文章列表');dom.window.close();
});
test('chapter deep link uses source href instead of an extra history.back',()=>{
 const dom=fixture(base+'knowledge/'),w=dom.window;w.history.pushState({lsshArticleReturn:'visit'},'',to+'#section');
 const anchor=returnAnchor(w);w.sessionStorage.setItem('lssh:article-visits:v1',JSON.stringify([{id:'visit',from:base+'knowledge/?type=article',to,scrollY:0,search:null,label:'← 返回学习总览'}]));
 let calls=0;w.history.back=()=>calls++;w.eval(article);const event=new w.MouseEvent('click',{bubbles:true,cancelable:true});anchor.dispatchEvent(event);
 assert.equal(calls,0);assert.equal(event.defaultPrevented,false);assert.equal(anchor.href,base+'knowledge/?type=article');assert.equal(w.sessionStorage.getItem('lssh:article-pending:v1'),'visit');w.close();
});
test('returning to filtered list restores its original focus and scroll',async()=>{
 const from=base+'knowledge/?type=article&sort=title-asc';const dom=fixture(from,`<ul class="knowledge-list"><li><a href="${to}">article</a></li></ul>`),w=dom.window;
 w.history.replaceState({lsshArticleSource:'visit'},'',from);w.sessionStorage.setItem('lssh:article-visits:v1',JSON.stringify([{id:'visit',from,to,scrollY:672,search:null,label:'← 返回学习总览',focusScope:'list'}]));
 const anchor=w.document.querySelector('.knowledge-list a');anchor.getClientRects=()=>[{width:60,height:44}];let scrolled;
 w.scrollTo=value=>{scrolled=value.top;};w.eval(article);await new Promise(resolve=>setTimeout(resolve,70));
 assert.equal(w.document.activeElement,anchor);assert.equal(scrolled,672);assert.equal(w.location.href,from);w.close();
});
for(const tag of ['lssh-site-search','site-search'])test(`${tag} restores search query, dialog and exact chapter-result focus`,()=>{
 const from=base+'knowledge/',chapter=to+'#section';
 const dom=fixture(from,`<${tag}><button data-open-modal>search</button><dialog><div id="starlight__search"><input class="pagefind-ui__search-input"><a href="${chapter}">result</a></div></dialog></${tag}>`),w=dom.window;
 w.history.replaceState({lsshArticleSource:'search-visit'},'',from);
 w.sessionStorage.setItem('lssh:article-visits:v1',JSON.stringify([{id:'search-visit',from,to:chapter,scrollY:0,search:'博客阅读验证',searchFilters:[],label:'← 返回搜索结果'}]));
 const dialog=w.document.querySelector('dialog');w.document.querySelector('[data-open-modal]').addEventListener('click',()=>dialog.setAttribute('open',''));
 w.eval(article);assert.equal(dialog.open,true);assert.equal(w.document.querySelector('input').value,'博客阅读验证');assert.equal(w.document.activeElement.getAttribute('href'),chapter);w.close();
});
