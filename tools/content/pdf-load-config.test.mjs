import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../public/pdfjs/web/lssh-load-config.js',import.meta.url),'utf8');
test('on-demand settings apply after preferences and before viewer initialize continues',async()=>{
 for(const bytes of [0,2098617,216380449]){
  const document=new EventTarget(),parentDocument=new EventTarget(),order=[];
  let finish,settings;
  const promise=new Promise(resolve=>{finish=resolve;});
  const window={frameElement:{dataset:{bytes:String(bytes)}},PDFViewerApplication:{preferences:{initializedPromise:promise}},PDFViewerApplicationOptions:{setAll:options=>{settings=options;order.push('configured');}}};
  vm.runInNewContext(source,{document,parent:{document:parentDocument},window,URLSearchParams});
  const unrelated=new Event('webviewerloaded');unrelated.detail={source:{}};parentDocument.dispatchEvent(unrelated);assert.equal(settings,undefined);
  const event=new Event('webviewerloaded');event.detail={source:window};parentDocument.dispatchEvent(event);
  promise.then(()=>order.push('viewer initializes'));finish();await promise;await Promise.resolve();
  assert.deepEqual(order,['configured','viewer initializes']);
  assert.equal(settings.disableAutoFetch,bytes===0||bytes>=4194304);
  assert.equal(settings.disableStream,settings.disableAutoFetch);assert.equal(settings.disableRange,false);
  assert.equal(settings.workerSrc,'../build/pdf.worker.min.mjs');
  assert.equal(settings.disablePreferences,undefined);
 }
});

test('native worker starts before preferences, is reused, and respects BFCache/unload',async()=>{
 for(const bytes of[65959,186298673]){
  const document=new EventTarget(),parentDocument=new EventTarget(),window=new EventTarget(),calls=[];let finish,settings,destroyed=0;
  const ready=new Promise(resolve=>finish=resolve),worker={promise:Promise.resolve(),destroy(){destroyed++;this.destroyed=true;}};
  const app={preferences:{initializedPromise:ready},open(args){assert.equal(this,app);calls.push(args);return 'native-return';}};
  Object.assign(window,{frameElement:{dataset:{bytes:String(bytes)}},PDFViewerApplication:app,PDFViewerApplicationOptions:{setAll:value=>settings=value},pdfjsLib:{GlobalWorkerOptions:{},PDFWorker:{create(){calls.push('worker-start');return worker;}}}});
  vm.runInNewContext(source,{document,parent:{document:parentDocument},window,URLSearchParams});const event=new Event('webviewerloaded');event.detail={source:window};parentDocument.dispatchEvent(event);
  assert.deepEqual(calls,['worker-start']);assert.equal(settings,undefined);finish();await ready;await Promise.resolve();
  assert.equal(await app.open({url:'approved.pdf',filename:'kept.pdf'}),'native-return');assert.equal(calls[1].worker,worker);assert.equal(calls[1].filename,'kept.pdf');assert.equal(calls[1].rangeChunkSize,undefined);
  const cached=new Event('pagehide');cached.persisted=true;window.dispatchEvent(cached);assert.equal(destroyed,0);
  window.dispatchEvent(new Event('pagehide'));assert.equal(destroyed,1);await app.open({url:'next.pdf'});assert.equal(calls[2].worker,undefined);
 }
});

test('native loading failures reach retry UI without an unhandled startup rejection',async()=>{
 const document=new EventTarget(),parentDocument=new EventTarget(),window=new EventTarget(),events=[];
 const error=new Error('network failure'),app={preferences:{initializedPromise:Promise.resolve()},open(){return Promise.reject(error);},eventBus:{dispatch(name,event){events.push({name,event});}}};
 Object.assign(window,{PDFViewerApplication:app,PDFViewerApplicationOptions:{setAll(){}},frameElement:{dataset:{bytes:'65959'}}});
 vm.runInNewContext(source,{document,parent:{document:parentDocument},window,URLSearchParams});const event=new Event('webviewerloaded');event.detail={source:window};parentDocument.dispatchEvent(event);
 await app.open({url:'sample.pdf'});assert.equal(events.length,1);assert.equal(events[0].name,'documenterror');assert.equal(events[0].event.error,error);
});
