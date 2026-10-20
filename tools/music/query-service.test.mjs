import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {createMusicQueryClient} from '../../src/lib/music-query.ts';

const directory = new URL('../../.local-tools/query-service-test/', import.meta.url);
await mkdir(directory, {recursive:true});
const output = new URL('hook.mjs',directory);
// Run the actual hook and request implementation; only media is inert.
await build({entryPoints:[fileURLToPath(new URL('../../src/components/music/useNetEaseCore.ts',import.meta.url))],outfile:fileURLToPath(output),bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env.BASE_URL':'"/personal-homepage/"'},plugins:[{
  name:'inert-media',setup(builder){
    builder.onResolve({filter:/audio-session$|useAudioSession$/},()=>({path:'media',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`const state={track:null,queue:[],playing:false,volume:.5,quality:'lossless',duration:0,time:0,repeat:'off'};export const audioSession={getSnapshot:()=>state,select(){throw Error('offline playback escaped guard');}};export const useAudioSession=()=>state;`,loader:'js'}));
  }
}]});
const useCore=(await import(output.href)).default;

test('actual Query hook preserves static snapshots and blocks offline reads, polling and writes',async t=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/personal-homepage/radio/?mode=netease'});
  const originals=new Map();
  for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,location:dom.window.location,history:dom.window.history,IS_REACT_ACT_ENVIRONMENT:true})){
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  }
  const realFetch=globalThis.fetch;const calls=[];let cancelSlow=false;
  globalThis.fetch=async(url,options={})=>{
    const input=options.body?JSON.parse(options.body):{};calls.push(input.action??'account');
    if(input.action==='search'&&input.keyword==='slow')return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{cancelSlow=true;reject(options.signal.reason);},{once:true}));
    return Response.json(input.action==='jobs'?{jobs:[]}:input.action?{tracks:[],cards:[],more:false}:{available:true,authorized:false,account:null});
  };
  const client=createMusicQueryClient();
  // Removed queries may remain referenced by an observer until the next render.
  // Keep their normal GC delay out of this finite test process.
  client.setDefaultOptions({queries:{...client.getDefaultOptions().queries,gcTime:0}});
  const root=createRoot(document.getElementById('root'));let current;
  function Probe({service}){current=useCore(service);return null;}
  const render=service=>act(async()=>{root.render(React.createElement(QueryClientProvider,{client},React.createElement(Probe,{service})));await new Promise(resolve=>setTimeout(resolve,25));});
  const settle=()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,25));});
  t.after(async()=>{await act(async()=>root.unmount());client.clear();globalThis.fetch=realFetch;dom.window.close();for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});

  await render('checking');await settle();assert.equal(current.busy,true);assert.equal(calls.length,0);
  await render('unavailable');await settle();assert.equal(current.busy,false);assert.ok(current.data.cards[0].id);assert.equal(calls.length,0);
  const playlistId=current.data.cards[0].id;
  await act(async()=>current.go('detail',{kind:'playlist',id:playlistId}));assert.ok(current.data.tracks.length);
  const track=current.data.tracks[0];
  await act(async()=>{current.play(track);assert.equal(await current.mutate({action:'like',id:track.id},'saved'),false);await current.load();current.more();});
  assert.equal(calls.length,0);assert.deepEqual(current.jobs,[]);assert.equal(current.liked.size,0);

  await render('ready');await settle();assert.ok(calls.includes('detail'));assert.ok(calls.includes('jobs'));assert.ok(calls.includes('account'));
  await act(async()=>current.go('search',{kind:'song',query:'slow'}));await settle();assert.ok(calls.includes('search'));
  await render('unavailable');await settle();assert.equal(cancelSlow,true);assert.equal(client.getQueryCache().getAll().some(query=>query.queryKey[0]==='netease-read'&&query.state.data),false);
  const before=calls.length;
  await act(async()=>current.go('downloads'));await act(async()=>{await new Promise(resolve=>setTimeout(resolve,2600));});
  assert.equal(calls.length,before);assert.deepEqual(current.jobs,[]);assert.equal(current.busy,false);
  await act(async()=>current.go('home'));assert.equal(current.data.cards[0].id,playlistId);
});
