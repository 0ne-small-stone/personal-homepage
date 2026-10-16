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
  vm.runInNewContext(source,{document,parent:{document:parentDocument},window});
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
