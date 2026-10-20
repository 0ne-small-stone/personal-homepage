import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
import { musicAccountOptions, musicAccountKey } from '../../src/lib/music-account.ts';
import { musicSummary, lyricAssetId } from '../../src/lib/music-payload.ts';
import { parseMusicCatalog } from '../../src/lib/music.ts';
import { glowRenderBudget } from '../../src/components/home/render-budget.mjs';

test('long lyrics leave summaries intact and resolve to content-addressed same-origin assets',()=>{
  const song={id:'a',title:'Fixture',artist:'Fixture',album:'Fixture',albumArtist:'Fixture',trackNumber:1,discNumber:1,duration:100,format:'flac',sampleRate:44100,bitsPerSample:16,audioUrl:'https://example.org/a.flac',lyrics:'[00:01]A line\n'.repeat(2000)};
  const original={version:1,updatedAt:null,tracks:[song]},summary=musicSummary(original);
  assert.equal(summary.tracks.length,1);assert.equal(summary.tracks[0].lyrics,null);assert.equal(original.tracks[0].lyrics,song.lyrics);
  assert.match(summary.tracks[0].lyricsUrl,/^\/personal-homepage\/music\/lyrics\/[a-f0-9]{24}\.json$/);
  assert.equal(parseMusicCatalog(summary).tracks[0].lyricsUrl,summary.tracks[0].lyricsUrl);
  assert.notEqual(lyricAssetId(song),lyricAssetId({...song,lyrics:'changed'}));
  assert.ok(JSON.stringify(summary).length<JSON.stringify(original).length/10);
  assert.equal(parseMusicCatalog({...summary,tracks:[{...summary.tracks[0],lyricsUrl:'https://foreign.example/secret'}]}).tracks[0].lyricsUrl,undefined);
});

test('account consumers share one in-flight read and the same mutation cache',async()=>{
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}});let calls=0,release;
  const pending=new Promise(resolve=>{release=resolve;});
  const options=musicAccountOptions(async()=>{calls++;await pending;return Response.json({available:true,authorized:true,account:{id:'1',nickname:'Fixture',avatarUrl:null}});});
  const reads=[client.fetchQuery(options),client.fetchQuery(options),client.fetchQuery(options)];release();
  const results=await Promise.all(reads);assert.equal(calls,1);assert.equal(results[0],results[1]);
  await client.fetchQuery(options);assert.equal(calls,1);
  client.setQueryData(musicAccountKey,{...results[0],authorized:false,account:null});
  assert.equal((await client.fetchQuery(options)).authorized,false);assert.equal(calls,1);client.clear();
});

test('unavailable account responses never become a usable account',async()=>{
  const client=new QueryClient();
  for(const value of [{available:false,authorized:true},{available:true,authorized:'yes'}])await assert.rejects(client.fetchQuery(musicAccountOptions(async()=>Response.json(value))),/未接通/);
  client.clear();
});

test('offscreen glow storage is bounded while calibrated UV blur offsets remain stable',()=>{
  const mobile=glowRenderBudget(390,844,true,1),desktop=glowRenderBudget(1280,720,false,1.5);
  assert.ok(mobile.near[0]*mobile.near[1]<=131072);assert.ok(mobile.near[0]*mobile.near[1]<390*844*.41);
  assert.equal(mobile.nearStep[0],1/390);assert.equal(mobile.nearStep[1],1/844);
  assert.deepEqual(desktop.near,[320,180]);
  const lower=glowRenderBudget(390,844,true,.75);assert.ok(lower.near[0]*lower.near[1]<mobile.near[0]*mobile.near[1]);
  assert.deepEqual(lower.nearStep,mobile.nearStep);
});
