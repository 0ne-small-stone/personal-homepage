// Third-party source code runs only here, with Node filesystem permissions and no child-process permission.
import { createRequire } from 'node:module';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
for (const name of ['log','error','warn','info','debug']) console[name]=()=>{};
let sourceRequest=false;
for (const transport of [http,https]) {
  const request=transport.request;
  transport.request=function(input,...args) {
    const host=typeof input==='string'?new URL(input).hostname:input instanceof URL?input.hostname:String(input.hostname||input.host||'').split(':')[0];
    if(sourceRequest&&host!=='source.shiqianjiang.cn') throw new Error('SOURCE_HOST_DENIED');
    return request.call(this,input,...args);
  };
}
globalThis.window=globalThis;
globalThis.lx={config:{'debug.enabled':false,'system.allowUnsafeVM':false,'proxy.all.enabled':false},dataPath:process.env.DATA_PATH};
const engine=createRequire(import.meta.url)(path.join(process.env.LX_RUNTIME,'engine.cjs'));
let queue=Promise.resolve();
process.on('message',message=>{
  queue=queue.then(async()=>{
    sourceRequest=message.action!=='search';
    try {
      let result;
      if(message.action==='initialize')result=await engine.initialize(message.info);
      else if(message.action==='search')result=await engine.search(message.source,message.keyword,message.page);
      else if(message.action==='resolve')result=await engine.resolveUrl(message.source,message.song,message.quality);
      else throw new Error('INVALID_ACTION');
      process.send?.({id:message.id,result});
    }catch{process.send?.({id:message.id,error:'音源暂时无法完成请求，请重试或选择其他音质。'});}
  });
});
process.on('unhandledRejection',()=>{});
process.on('uncaughtException',()=>process.exit(1));
process.on('disconnect',()=>process.exit(0));
