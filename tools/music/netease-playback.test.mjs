import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readPlaybackResolution,resolveNetEasePlayback} from '../../src/lib/netease-playback.ts';
const now=Date.now();
const entry={id:'4238134',status:'preview',audioUrl:'https://m802.music.126.net/song.mp3',expiresAt:new Date(now+60000).toISOString(),previewSeconds:30};
const index=track=>({version:1,updatedAt:new Date(now).toISOString(),tracks:[track]});
test('valid preview carries a truthful duration and a full source has no trial label',()=>{
  const preview=readPlaybackResolution(index(entry),entry.id,now);assert.equal(preview.previewSeconds,30);assert.match(preview.notice,/30 秒试听/);
  const full=readPlaybackResolution(index({...entry,status:'full',previewSeconds:null}),entry.id,now);assert.equal(full.previewSeconds,null);assert.equal(full.notice,'');
});
test('expired, missing, unavailable and malformed trial data cannot be used for playback',()=>{
  for(const item of [{...entry,expiresAt:new Date(now-1).toISOString()},{...entry,status:'unavailable',audioUrl:null},{...entry,previewSeconds:null},{...entry,previewSeconds:0}])assert.throws(()=>readPlaybackResolution(index(item),entry.id,now));
  assert.throws(()=>readPlaybackResolution(index(entry),'123',now));assert.throws(()=>readPlaybackResolution({},entry.id,now));
});
test('HTML origins, cross-platform URLs and credential-bearing URLs are rejected',()=>{
  for(const url of ['https://music.163.com/song?id=4238134','https://m802.music.126.net.evil.test/song.mp3','http://m802.music.126.net/song.mp3','https://user:pass@m802.music.126.net/song.mp3','https://m802.music.126.net:8080/song.mp3'])assert.throws(()=>readPlaybackResolution(index({...entry,audioUrl:url}),entry.id,now));
});

test('missing playback service never falls back to an HTML-returning official link',async()=>{
  const track={id:entry.id,audioUrl:'https://music.163.com/song/media/outer/url?id=4238134.mp3'};
  await assert.rejects(resolveNetEasePlayback(track,{indexUrl:'/index',fetcher:async()=>new Response('',{status:404})}),/播放服务尚未接通/);
});
test('network, service and invalid JSON failures remain distinct from track permissions',async()=>{
  const track={id:entry.id};
  await assert.rejects(resolveNetEasePlayback(track,{indexUrl:'/index',fetcher:async()=>{throw Error('offline');}}),/无法连接.*播放服务/);
  await assert.rejects(resolveNetEasePlayback(track,{indexUrl:'/index',fetcher:async()=>new Response('',{status:503})}),/播放服务暂时不可用/);
  await assert.rejects(resolveNetEasePlayback(track,{indexUrl:'/index',fetcher:async()=>new Response('<html>')}),/无效数据/);
  const result=await resolveNetEasePlayback(track,{indexUrl:'/index',fetcher:async()=>Response.json(index(entry))});assert.equal(result.previewSeconds,30);
});
test('account-aware playback POST sends only a song ID and preserves authenticated full permissions',async()=>{
  const calls=[];const full={...entry,status:'full',previewSeconds:null};
  const result=await resolveNetEasePlayback({id:entry.id},{apiUrl:'/account/resolve',fetcher:async(url,options)=>{calls.push({url,options});return Response.json(index(full));}});
  assert.equal(result.previewSeconds,null);assert.equal(calls.length,1);assert.equal(calls[0].options.method,'POST');assert.deepEqual(JSON.parse(calls[0].options.body),{id:entry.id});assert.equal(calls[0].options.credentials,'same-origin');assert.equal(calls[0].options.cache,'no-store');assert.ok(calls[0].options.signal instanceof AbortSignal);
  await assert.rejects(resolveNetEasePlayback({id:entry.id},{apiUrl:'/account/resolve',fetcher:async()=>new Response('',{status:401})}),/登录已失效/);
});
