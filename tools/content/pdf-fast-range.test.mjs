import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
import {prepareFastRange} from '../../public/pdfjs/web/lssh-range.mjs';
const chunk=65536,bytes=4*1024*1024+173,source=Buffer.alloc(bytes);
for(let i=0;i<bytes;i++)source[i]=(i*17+(i>>>16))%251;
const hash=data=>createHash('sha256').update(data).digest('hex'),sha256=hash(source),url='https://example.test/home/materials/source-test.pdf';
const indices=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,64];
const metadata={schemaVersion:1,source:'materials/source-test.pdf',sha256,bytes,chunkSize:chunk,parts:indices.map(index=>({index,bytes:Math.min(chunk,bytes-index*chunk),sha256:hash(source.subarray(index*chunk,Math.min(bytes,(index+1)*chunk)))}))};
function fixture({badIndex,badFirst=false,badMetadata=false,failOriginal=false,delay=0,bundle=false,badBundle=false,bundleDelay=0}={}){
 const requests=[],deliveries=[],errors=[];let active=0,peak=0;
 class NativeRange{constructor(length,initialData,done,filename){Object.assign(this,{length,initialData,done,filename});}onDataRange(begin,data){deliveries.push({begin,data});}}
 const fetchImpl=async(target,options)=>{
  requests.push({target,range:options.headers?.Range});active++;peak=Math.max(peak,active);
  try{
   const waiting=target.endsWith('/first-render-v1.bin')?bundleDelay:delay;
   if(waiting)await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,waiting);options.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(options.signal.reason);},{once:true});});
   if(options.signal.aborted)throw options.signal.reason;
   if(target.includes('index.json')){const pack=Buffer.concat(metadata.parts.map(p=>source.subarray(p.index*chunk,p.index*chunk+p.bytes)));return Response.json({...metadata,...(badMetadata?{sha256:'0'.repeat(64)}:{}),...(bundle?{bundle:{file:'first-render-v1.bin',bytes:pack.length,sha256:hash(pack)}}:{})});}
   if(target.endsWith('/first-render-v1.bin')){const pack=Buffer.concat(metadata.parts.map(p=>source.subarray(p.index*chunk,p.index*chunk+p.bytes)));return new Response(badBundle?Buffer.alloc(pack.length):pack);}
   const index=target.match(/\/(\d+)\.bin$/)?.[1];
   if(index!==undefined){const i=Number(index),data=source.subarray(i*chunk,Math.min(bytes,(i+1)*chunk));return new Response((badFirst&&i===0)||i===badIndex?Buffer.alloc(data.length):data);}
   const match=options.headers.Range.match(/bytes=(\d+)-(\d+)/),begin=Number(match[1]),end=Number(match[2])+1;
   return new Response(source.subarray(begin,end),{status:failOriginal?200:206,headers:{'Content-Range':'bytes '+begin+'-'+(end-1)+'/'+bytes}});
  }finally{active--;}
 };
 const controller=new AbortController();
 return {requests,deliveries,errors,controller,get peak(){return peak;},async prepare(){return prepareFastRange({url,bytes,sha256,viewerOrigin:'https://example.test',lib:{PDFDataRangeTransport:NativeRange},signal:controller.signal,onError:error=>errors.push(error),fetchImpl,cryptoImpl:webcrypto});}};
}
test('fast ranges preserve exact head, tail, unmirrored and partial bytes',async()=>{
 const f=fixture(),r=await f.prepare();assert.equal(r.length,bytes);assert.equal(r.done,true);assert.deepEqual(Buffer.from(r.initialData),source.subarray(0,chunk));
 for(const[begin,end]of[[43,chunk+91],[bytes-171,bytes],[40*chunk+7,41*chunk+15]]){await r.requestDataRange(begin,end);assert.deepEqual(Buffer.from(f.deliveries.at(-1).data),source.subarray(begin,end));}
 assert.equal(f.errors.length,0);assert.ok(f.requests.some(r=>r.range));r.abort();
});
test('cache survives native ownership transfer and coalesces concurrent requests',async()=>{
 const f=fixture({delay:4}),r=await f.prepare();structuredClone(r.initialData,{transfer:[r.initialData.buffer]});
 await Promise.all([r.requestDataRange(chunk,3*chunk),r.requestDataRange(chunk,2*chunk)]);
 assert.equal(f.requests.filter(r=>r.target.endsWith('/1.bin')).length,1);
 const sent=f.deliveries[0].data;structuredClone(sent,{transfer:[sent.buffer]});await r.requestDataRange(0,2*chunk);
 assert.deepEqual(Buffer.from(f.deliveries.at(-1).data),source.subarray(0,2*chunk));r.abort();
});
test('range work is bounded to four network requests and cancellation suppresses late deliveries',async()=>{
 const f=fixture({delay:15}),r=await f.prepare();const work=r.requestDataRange(chunk,15*chunk);setTimeout(()=>f.controller.abort(),20);await work;
 assert.ok(f.peak<=4);assert.equal(f.deliveries.length,0);assert.equal(f.errors.length,0);
});
test('corrupt later mirror falls back to verified original range',async()=>{
 const f=fixture({badIndex:1}),r=await f.prepare();await r.requestDataRange(chunk,2*chunk);
 assert.deepEqual(Buffer.from(f.deliveries[0].data),source.subarray(chunk,2*chunk));assert.equal(f.requests.filter(r=>r.range).length,1);assert.equal(f.errors.length,0);r.abort();
});
test('invalid identity and corrupt first chunk fall back to native transport',async()=>{
 for(const options of[{badMetadata:true},{badFirst:true}])assert.equal(await fixture(options).prepare(),null);
 const f=fixture();assert.equal(await prepareFastRange({url:'https://other.test/materials/source-test.pdf',bytes,sha256,viewerOrigin:'https://example.test',lib:{PDFDataRangeTransport:class{}},fetchImpl:()=>{throw Error('must not fetch');},cryptoImpl:webcrypto}),null);
});
test('full reads keep a single original range and malformed responses fail once',async()=>{
 const f=fixture(),r=await f.prepare();await r.requestDataRange(0,2*1024*1024);
 assert.equal(f.requests.filter(r=>r.range).length,1);assert.deepEqual(Buffer.from(f.deliveries[0].data),source.subarray(0,2*1024*1024));r.abort();
 const bad=fixture({failOriginal:true}),broken=await bad.prepare();await broken.requestDataRange(40*chunk,41*chunk);await broken.requestDataRange(42*chunk,43*chunk);
 assert.equal(bad.errors.length,1);assert.equal(bad.deliveries.length,0);
});

test('a larger profiled first-render span uses mirrors while full downloads retain original transport',async()=>{
 const f=fixture(),r=await f.prepare();await r.requestDataRange(0,18*chunk);
 assert.equal(f.requests.filter(r=>r.range).length,0);assert.deepEqual(Buffer.from(f.deliveries[0].data),source.subarray(0,18*chunk));r.abort();
});

test('scattered first-render bytes share one checked bundle; damage falls back to individual mirrors',async()=>{
 for(const badBundle of[false,true]){
  const f=fixture({bundle:true,badBundle}),r=await f.prepare();assert(r);await r.requestDataRange(chunk,18*chunk);
  assert.deepEqual(Buffer.from(f.deliveries[0].data),source.subarray(chunk,18*chunk));
  assert.equal(f.requests.filter(r=>r.target.endsWith('/first-render-v1.bin')).length,1);
  assert.equal(f.requests.filter(r=>/\/\d+\.bin$/.test(r.target)).length,badBundle?18:1);
  assert.equal(f.requests.filter(r=>r.range).length,0);assert.equal(f.errors.length,0);r.abort();
 }
});

test('closing during a bundle transfer cancels without late bytes or fallback work',async()=>{
 const f=fixture({bundle:true,bundleDelay:1000}),r=await f.prepare(),work=r.requestDataRange(chunk,2*chunk);
 f.controller.abort();await work;assert.equal(f.deliveries.length,0);assert.equal(f.errors.length,0);assert.equal(f.requests.filter(r=>/\/1\.bin$/.test(r.target)||r.range).length,0);
});

test('healthy slow bundle data resets inactivity timeout rather than restarting through mirrors',async()=>{
 const sourceModule=readFileSync(new URL('../../public/pdfjs/web/lssh-range.mjs',import.meta.url),'utf8').replace('timeout: 45000','timeout: 100');
 const {prepareFastRange:prepare}=await import('data:text/javascript;base64,'+Buffer.from(sourceModule).toString('base64'));
 const data=source.subarray(0,chunk*2),packedHash=hash(data),parts=[0,1].map(index=>({index,bytes:chunk,sha256:hash(source.subarray(index*chunk,(index+1)*chunk))}));let pieces=0,delivered;
 class Native{constructor(){}onDataRange(_begin,bytes){delivered=bytes;}}
 const transport=await prepare({url,bytes,sha256,viewerOrigin:'https://example.test',lib:{PDFDataRangeTransport:Native},cryptoImpl:webcrypto,fetchImpl:async(target,{signal})=>{
  if(target.includes('index.json'))return Response.json({...metadata,parts,bundle:{file:'first-render-v1.bin',bytes:data.length,sha256:packedHash}});
  if(target.endsWith('/0.bin')){pieces++;return new Response(source.subarray(0,chunk));}
  if(!target.endsWith('/first-render-v1.bin'))throw Error('Unexpected fallback');
  let offset=0,timer;return new Response(new ReadableStream({start(controller){signal.addEventListener('abort',()=>{clearTimeout(timer);controller.error(Error('aborted'));},{once:true});const next=()=>{timer=setTimeout(()=>{const end=Math.min(offset+16384,data.length);controller.enqueue(data.subarray(offset,end));offset=end;if(offset===data.length)controller.close();else next();},35);};next();}}));
 }});
 await transport.requestDataRange(chunk,2*chunk);assert.deepEqual(Buffer.from(delivered),source.subarray(chunk,2*chunk));assert.equal(pieces,1);transport.abort();
});
