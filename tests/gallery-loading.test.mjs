import test from'node:test';import assert from'node:assert/strict';import{getEventListeners}from'node:events';import{loadSpaceImages,waitForOverview}from'../src/components/gallery/loading.js';
import {distributeDomePhotos} from '../src/components/gallery/photo-distribution.js';
test('space image loading is bounded, ordered and isolates a failed image',async()=>{
 let active=0,peak=0;
 class Image{set src(value){if(!value)return;active++;peak=Math.max(peak,active);setTimeout(()=>{active--;value==='bad'?this.onerror?.():this.onload?.();},2);this.value=value;}}
 const photos=['one','two','bad','four','five','six'].map(image=>({image})),seen=[];
 const result=await loadSpaceImages(photos,{ImageClass:Image,concurrency:2,onProgress:n=>seen.push(n)});
 assert.equal(peak,2);assert.deepEqual(result.map(image=>image?.value??null),['one','two',null,'four','five','six']);assert.deepEqual(seen,[1,2,3,4,5,6]);
});
test('unloading aborts in-flight images, starts no later work and detaches listeners',async()=>{
 const controller=new AbortController(),started=[];
 class Image{set src(value){if(value)started.push(value);}}
 const result=loadSpaceImages([1,2,3,4].map(image=>({image})),{signal:controller.signal,ImageClass:Image,concurrency:2});
 controller.abort();await assert.rejects(result,{name:'AbortError'});assert.deepEqual(started,[1,2]);assert.equal(getEventListeners(controller.signal,'abort').length,0);
});
test('a stalled image times out without blocking the rest of the set',async()=>{
 class Image{set src(value){if(value==='ok')queueMicrotask(()=>this.onload?.());}}
 const images=await loadSpaceImages([{image:'stalled'},{image:'ok'}],{ImageClass:Image,timeoutMs:5});assert.equal(images[0],null);assert(images[1]);
});
test('overview waits on existing DOM images once per source, without issuing another request',async()=>{
 const a=new EventTarget(),b=new EventTarget();Object.assign(a,{complete:true,naturalWidth:320});Object.assign(b,{complete:false,naturalWidth:0});
 const node=(src,image)=>({dataset:{src},querySelector:()=>image}),host={querySelectorAll:()=>[node('a',a),node('a',a),node('b',b)]};
 const result=waitForOverview(host,{timeoutMs:100});b.dispatchEvent(new Event('error'));assert.deepEqual(await result,{total:2,loaded:1,missing:1});assert.equal(getEventListeners(b,'load').length,0);
});
test('overview cancellation releases listeners and cannot hang the page',async()=>{
 const controller=new AbortController(),image=new EventTarget(),host={querySelectorAll:()=>[{dataset:{src:'pending'},querySelector:()=>image}]};
 const pending=waitForOverview(host,{signal:controller.signal});controller.abort();assert.equal((await pending).missing,1);assert.equal(getEventListeners(image,'load').length,0);assert.equal(getEventListeners(controller.signal,'abort').length,0);
});

test('Dome card placement retains the preview source and canonical identity',async()=>{
 const fs=await import('node:fs'),ts=await import('typescript'),vm=await import('node:vm');
 const source=fs.readFileSync(new URL('../src/components/gallery/vendor/DomeGallery.jsx',import.meta.url),'utf8');
 const file=ts.createSourceFile('DomeGallery.jsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
 const node=file.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='buildItems');assert(node);
 const build=vm.runInNewContext('('+node.getText(file)+')',{distributeDomePhotos});
 for(const count of [36,101]){
  const photos=Array.from({length:count},(_,i)=>({src:'photo-'+i+'.webp',full:'photo-'+i+'-full.webp',preview:'photo-'+i+'-preview.webp',alt:'Photo '+i}));
  const cards=build(photos,34,true);assert.equal(cards.length,build(photos.slice(0,36),34,true).length);assert.equal(new Set(cards.map(card=>card.src)).size,count);
  for(const card of cards){const photo=photos.find(photo=>photo.src===card.src);assert.equal(card.preview,photo.preview);assert.equal(card.full,photo.full);assert.equal(card.alt,photo.alt);}
 }
});
