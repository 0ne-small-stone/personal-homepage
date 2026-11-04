import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createAudioSession} from '../../src/lib/audio-session.ts';
class Audio extends EventTarget {
 src='';currentTime=0;duration=30;volume=.75;paused=true;ended=false;error=null;plays=0;
 load(){this.currentTime=0;this.ended=false;}
 getAttribute(name){return name==='src'?this.src:null;}
 removeAttribute(name){if(name==='src')this.src='';}
 play(){this.plays++;this.paused=false;this.dispatchEvent(new Event('playing'));return Promise.resolve();}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
}
const song=(id='29600129',source='netease')=>({id,source,title:id,artist:'Pink Floyd',album:'The Dark Side of the Moon',audioUrl:source==='cloud'?`https://example.org/${id}.mp3`:''});
const resolved={url:'https://m802.music.126.net/breathe.mp3',previewSeconds:30,notice:'30 秒试听'};
const setup=(resolve=async()=>resolved)=>{const session=createAudioSession(resolve),audio=new Audio();session.bind(audio);return{session,audio};};
test('owned single track uses the carrier and stops naturally despite inherited repeat/shuffle',async()=>{
 const {session,audio}=setup();session.setRepeat('one');session.setShuffle(true);
 const lease=session.createOwnedPlayback(song());await lease.start();assert.equal(audio.plays,1);assert.equal(lease.owns(),true);
 audio.paused=true;audio.ended=true;audio.dispatchEvent(new Event('ended'));await Promise.resolve();
 assert.equal(lease.owns(),false);assert.equal(audio.plays,1);assert.equal(session.getSnapshot().playing,false);assert.equal(session.getSnapshot().repeat,'one');
});
test('off cancels a pending resolution and a later click owns a new attempt',async()=>{
 const pending=[];const {session,audio}=setup(()=>new Promise(r=>pending.push(r)));
 const first=session.createOwnedPlayback(song());const old=first.start();first.stop();
 const second=session.createOwnedPlayback(song());const latest=second.start();pending[1](resolved);await latest;
 pending[0]({...resolved,url:'https://m802.music.126.net/stale.mp3'});await old;
 assert.equal(audio.src,resolved.url);assert.equal(audio.plays,1);assert.equal(second.owns(),true);first.stop();assert.equal(audio.paused,false);
});
test('explicit same-track selection transfers ownership without resetting its clock',async()=>{
 const {session,audio}=setup();const track=song(),lease=session.createOwnedPlayback(track);await lease.start();audio.currentTime=12;
 session.select(track,[track]);assert.equal(lease.owns(),false);lease.stop();assert.equal(audio.paused,false);assert.equal(audio.currentTime,12);
});
test('same-track selection while resolving invalidates the old pending play',async()=>{
 let resolve;const {session,audio}=setup(()=>new Promise(r=>resolve=r));const track=song(),lease=session.createOwnedPlayback(track);const pending=lease.start();
 session.select(track,[track]);assert.equal(session.getSnapshot().waiting,false);
 resolve(resolved);await pending;lease.stop();assert.equal(audio.plays,0);assert.equal(audio.paused,true);assert.equal(session.getSnapshot().waiting,false);
 const retry=session.createOwnedPlayback(track);const replay=retry.start();resolve(resolved);await replay;assert.equal(audio.plays,1);assert.equal(audio.paused,false);
});
test('user music replacement is never stopped by stale home cleanup',async()=>{
 const {session,audio}=setup();const lease=session.createOwnedPlayback(song());await lease.start();
 const music=song('music','cloud');session.select(music,[music],true);lease.stop();
 assert.equal(session.getSnapshot().track.id,'music');assert.equal(audio.paused,false);assert.equal(lease.owns(),false);
});
test('user selection after home teardown clears its pending single-track completion policy',async()=>{
 const {session,audio}=setup();session.setRepeat('one');const lease=session.createOwnedPlayback(song());await lease.start();lease.stop();
 const music=song('music','cloud');session.select(music,[music],true);audio.paused=true;audio.ended=true;audio.dispatchEvent(new Event('ended'));await Promise.resolve();
 assert.equal(audio.plays,3);assert.equal(audio.paused,false);assert.equal(session.getSnapshot().track.id,'music');
});
for(const order of ['home-first','navigation-first'])test(`navigation cannot resume home-owned playback (${order})`,async()=>{
 const {session,audio}=setup();const lease=session.createOwnedPlayback(song());await lease.start();
 if(order==='home-first'){lease.stop();session.beginNavigation();}else{session.beginNavigation();lease.stop();}
 session.finishNavigation();assert.equal(audio.paused,true);assert.equal(audio.plays,1);
});
test('navigation cancels a pending home request even before native play',async()=>{
 let resolve;const {session,audio}=setup(()=>new Promise(r=>resolve=r));const lease=session.createOwnedPlayback(song());const pending=lease.start();
 session.beginNavigation();session.finishNavigation();resolve(resolved);await pending;assert.equal(audio.plays,0);
});
test('normal music still resumes across persistence after ownership was revoked',async()=>{
 const {session,audio}=setup();const track=song(),lease=session.createOwnedPlayback(track);await lease.start();session.select(track,[track]);
 session.beginNavigation();audio.pause();session.finishNavigation();await new Promise(r=>setImmediate(r));assert.equal(audio.paused,false);lease.stop();assert.equal(audio.paused,false);
});
test('new manual home attempt restarts at zero without raising the master volume',async()=>{
 const {session,audio}=setup();session.setVolume(.2);const first=session.createOwnedPlayback(song());await first.start();audio.currentTime=20;first.stop();
 const second=session.createOwnedPlayback(song());await second.start();assert.equal(audio.currentTime,0);assert.equal(audio.volume,.2);assert.equal(audio.plays,2);
});
test('a cancelled lease cannot start later',async()=>{
 const {session,audio}=setup();const lease=session.createOwnedPlayback(song());lease.stop();await lease.start();assert.equal(audio.plays,0);assert.equal(lease.owns(),false);
});
test('resolver failure stays visible and cannot schedule a late restart',async()=>{
 const {session,audio}=setup(async()=>{throw Error('音源不可用');});const lease=session.createOwnedPlayback(song());await lease.start();
 assert.match(session.getSnapshot().error,/音源不可用/);lease.stop();assert.equal(audio.plays,0);assert.equal(session.getSnapshot().waiting,false);
});
for(const action of ['seek','repeat','shuffle','volume'])test(`user ${action} adopts playback before leaving home`,async()=>{
 const {session,audio}=setup();const lease=session.createOwnedPlayback(song());await lease.start();
 audio.dispatchEvent(new Event('loadedmetadata'));
 if(action==='seek')session.seek(16);
 if(action==='repeat')session.setRepeat('one');
 if(action==='shuffle')session.setShuffle(true);
 if(action==='volume')session.setVolume(.4);
 assert.equal(lease.owns(),false);lease.stop();session.beginNavigation();session.finishNavigation();
 assert.equal(audio.paused,false);assert.equal(audio.plays,1);
 if(action==='seek')assert.equal(audio.currentTime,16);
});
test('positive volume adopts a pending resolution without abandoning it',async()=>{
 let resolve;const {session,audio}=setup(()=>new Promise(r=>resolve=r));const lease=session.createOwnedPlayback(song());const pending=lease.start();
 session.setVolume(.4);lease.stop();resolve(resolved);await pending;
 assert.equal(audio.plays,1);assert.equal(audio.paused,false);assert.equal(lease.owns(),false);
});
test('zero volume preserves home ownership so the home mute guard can stop it',async()=>{
 const {session,audio}=setup();const lease=session.createOwnedPlayback(song());await lease.start();session.setVolume(0);
 assert.equal(lease.owns(),true);lease.stop();assert.equal(audio.paused,true);assert.equal(audio.volume,0);
});
// Exercise the real HomeSoundscape subscription, not just the session API:
// native pause/timeupdate can precede ended and must not expose user repeat.
for(const repeat of ['one','all'])for(const earlyFlag of [true,false])for(const teardown of ['none','pagehide','before-swap'])test(`full home song consumes pause→${teardown}→ended before repeat=${repeat}, ended flag=${earlyFlag}`,async()=>{
 const {session,audio}=setup(async()=>({...resolved,previewSeconds:null,notice:''}));audio.duration=169;
 const old=Object.fromEntries(['document','window','location','HTMLAudioElement','MutationObserver'].map(k=>[k,globalThis[k]]));
 const doc=new EventTarget();Object.assign(doc,{hidden:false,body:{dataset:{}},getElementById:()=>audio,querySelector:()=>null});
 Object.assign(globalThis,{document:doc,window:new EventTarget(),location:{search:'?opticsDebug'},HTMLAudioElement:Audio,MutationObserver:class{observe(){}disconnect(){}}});
 let cleanup;
 const fakeReact={useState:(initial)=>{let value=initial;return[value,(next)=>{value=typeof next==='function'?next(value):next;}];},useRef:v=>({current:v}),useLayoutEffect:effect=>{cleanup=effect();}};
 const code=ts.transpileModule(readFileSync(new URL('../../src/components/home/HomeSoundscape.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const exports={};const jsx=(type,props)=>({type,props});
 const require=id=>id==='react'?fakeReact:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id.includes('audio-session')?{audioSession:session}:{default:{tracks:[]},tracks:[]};
 try{
   session.select(song('old','cloud'),[song('old','cloud'),song('next','cloud')]);session.setRepeat(repeat);session.setShuffle(true);
   new Function('require','exports',code)(require,exports);const view=exports.default();view.props.children[0].props.onClick();await new Promise(r=>setImmediate(r));
   assert.equal(audio.plays,1);audio.currentTime=audio.duration;audio.paused=true;audio.ended=earlyFlag;audio.dispatchEvent(new Event('pause'));
   if(teardown==='pagehide')window.dispatchEvent(new Event('pagehide'));
   if(teardown==='before-swap')doc.dispatchEvent(new Event('astro:before-swap'));
   audio.ended=true;audio.dispatchEvent(new Event('ended'));await new Promise(r=>setImmediate(r));
   assert.equal(audio.plays,1);assert.equal(audio.paused,true);assert.equal(session.getSnapshot().playing,false);
   if(teardown==='none'){assert.equal(JSON.parse(doc.body.dataset.homeSound).phase,'ended');assert.equal(JSON.parse(doc.body.dataset.homeSound).owned,false);}
 }finally{cleanup?.();for(const[k,v]of Object.entries(old))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
