import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFile,stat} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {verifyCloudUpload} from './netease-upload.mjs';
import {createMusicPreview} from './preview-service.mjs';

const cloudRow=(name,size)=>({songId:777,fileName:name,fileSize:size,simpleSong:{id:777,name:'验证曲目',ar:[{name:'Artist'}],al:{name:'Album'},dt:1000},cookie:'PRIVATE_COOKIE'});
async function assertRemoved(path){
  // The HTTP response can arrive before the request handler's async finally completes.
  for(let attempt=0;attempt<50;attempt++){
    try{await stat(path);}catch(error){if(error.code==='ENOENT')return;throw error;}
    await delay(20);
  }
  assert.fail('Upload temporary file was not cleaned up within one second.');
}
test('201 upload requires an owned read-back with the same filename and complete byte size',async()=>{
  const account={request:async(method,input,personal)=>{assert.equal(method,'user_cloud_detail');assert.deepEqual(input,{id:'777'});assert.equal(personal,true);return{data:[cloudRow('验证曲目.wav',16044)]};}};
  const result=await verifyCloudUpload(account,{code:201,privateCloud:{songId:777}},{name:'验证曲目.wav',size:16044});assert.equal(result.id,'777');assert.doesNotMatch(JSON.stringify(result),/PRIVATE_COOKIE|cookie/);
  await assert.rejects(verifyCloudUpload(account,{code:201},{name:'验证曲目.wav',size:16044}));
  await assert.rejects(verifyCloudUpload(account,{code:201,privateCloud:{songId:777}},{name:'other.wav',size:16044}));
  await assert.rejects(verifyCloudUpload(account,{code:201,privateCloud:{songId:777}},{name:'验证曲目.wav',size:16043}));
});
test('HTTP upload stages complete audio, confirms 201 remotely, and cleans up on success or mismatch',async()=>{
  const wav=Buffer.alloc(16044);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);
  let temporary;let mismatch=false;let calls=0;const filename='验证曲目.wav';
  const account={ready:async()=>{},state:()=>({authorized:true}),dispose(){},request:async(method,input,personal)=>{
    assert.equal(personal,true);calls++;
    if(method==='cloud'){temporary=input.songFile.tempFilePath;assert.deepEqual(await readFile(temporary),wav);assert.equal(Buffer.from(input.songFile.name,'latin1').toString('utf8'),filename);assert.equal(input.songFile.size,wav.length);return{code:201,privateCloud:{songId:777},cookie:'PRIVATE_COOKIE'};}
    assert.equal(method,'user_cloud_detail');return{code:200,data:[cloudRow(mismatch?'wrong.wav':filename,wav.length)]};
  }};
  const server=createMusicPreview({account,playback:{start(){},stop(){}}});server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${server.address().port}`;
  const upload=()=>fetch(origin+'/personal-homepage/api/music/netease-upload',{method:'POST',headers:{Origin:origin,'Content-Type':'application/octet-stream','X-Music-Name':encodeURIComponent(filename)},body:wav});
  try{const success=await upload();assert.equal(success.status,200);const body=await success.json();assert.equal(body.ok,true);assert.equal(body.track.title,'验证曲目');assert.doesNotMatch(JSON.stringify(body),/PRIVATE_COOKIE|tempFilePath/);await assertRemoved(temporary);
    mismatch=true;const failed=await upload();assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/PRIVATE_COOKIE|tempFilePath/);await assertRemoved(temporary);assert.equal(calls,4);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
