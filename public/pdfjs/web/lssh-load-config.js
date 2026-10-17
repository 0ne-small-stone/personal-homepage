// Adapt only the fixed native viewer's entry point. PDF.js keeps parsing/rendering/history.
(() => {
 const targets=new Set([document]);try{targets.add(parent.document);}catch{}
 const configure=event=>{
  if(event.detail?.source!==window)return;
  for(const target of targets)target.removeEventListener('webviewerloaded',configure);
  const app=window.PDFViewerApplication,options=window.PDFViewerApplicationOptions;
  const bytes=Number(window.frameElement?.dataset.bytes??0),onDemand=!bytes||bytes>=4*1024*1024;
  const lib=window.pdfjsLib;let worker;
  // Native PDFWorker retains its supported fake-worker fallback. Start in parallel
  // with viewer localization/preferences instead of after those have completed.
  if(lib?.PDFWorker){try{
   lib.GlobalWorkerOptions.workerSrc='../build/pdf.worker.min.mjs';worker=lib.PDFWorker.create({name:'lssh-reader'});
   const preparing=worker;preparing.promise.catch(()=>{if(!preparing.destroyed)preparing.destroy();if(worker===preparing)worker=undefined;});
  }catch{worker=undefined;}}
  const open=app.open;
  if(typeof open==='function')app.open=function(args){return open.call(this,{...args,...(worker&&!worker.destroyed?{worker}:{})});};
  window.addEventListener?.('pagehide',event=>{if(!event.persisted){worker?.destroy();worker=undefined;}});
  void app.preferences.initializedPromise.then(()=>options.setAll({
   workerSrc:'../build/pdf.worker.min.mjs',sandboxBundleSrc:'../build/pdf.sandbox.min.mjs',
   disableAutoFetch:onDemand,disableStream:onDemand,disableRange:false,
  }));
 };
 for(const target of targets)target.addEventListener('webviewerloaded',configure);
})();
