import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioSession } from '../../src/lib/audio-session.ts';

class FakeAudio extends EventTarget {
  src = '';currentTime = 0;duration = 180;volume = 1;error = null;loads = 0;paused = true;ended = false;
  load() { this.loads++;this.currentTime=0;this.ended=false; }
  getAttribute(name) { return name === 'src' ? this.src : null; }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  play() { this.paused = false;this.dispatchEvent(new Event('playing'));return Promise.resolve(); }
  pause() { this.paused = true;this.dispatchEvent(new Event('pause')); }
}

test('time updates preserve control snapshots while transport and volume still update', async () => {
  const session = createAudioSession(), audio = new FakeAudio();session.bind(audio);
  const track = {id:'progress-fixture',source:'cloud',title:'Fixture',artist:'Fixture',album:'Fixture',audioUrl:'https://example.org/fixture.mp3'};
  session.select(track,[track]);await session.play();
  const controls = session.getControlSnapshot();
  for (let time=1;time<=120;time++) {audio.currentTime=time;audio.dispatchEvent(new Event('timeupdate'));assert.equal(session.getControlSnapshot(),controls);}
  assert.equal(session.getSnapshot().time,120);
  session.setVolume(.3);assert.notEqual(session.getControlSnapshot(),controls);assert.equal(audio.volume,.3);
  session.pause();assert.equal(session.getControlSnapshot().playing,false);assert.equal(audio.paused,true);
});
const song = (id, source = 'cloud') => ({ id, source, title: id, artist: 'Artist', album: 'Album', audioUrl: `https://example.org/${source}/${id}.flac` });
test('list repeat wraps only when enabled, one-song repeat restarts without a second audio owner',async()=>{
  const {session,audio}=setup();const queue=[song('a'),song('b')];session.select(queue[1],queue,true);session.setRepeat('all');audio.dispatchEvent(new Event('ended'));assert.equal(session.getSnapshot().track.id,'a');session.setRepeat('one');audio.currentTime=179;audio.dispatchEvent(new Event('ended'));await Promise.resolve();assert.equal(session.getSnapshot().track.id,'a');assert.equal(audio.currentTime,0);assert.equal(session.getSnapshot().playing,true);
});
test('shuffle advances to a different retained track without replacing the queue',()=>{
  const {session}=setup();const queue=[song('a'),song('b'),song('c')];session.select(queue[0],queue,true);session.setShuffle(true);session.next(1,true);assert.notEqual(session.getSnapshot().track.id,'a');assert.equal(session.getSnapshot().queue.length,3);
});
test('quality changes request the selected tier while preserving the real audio position',async()=>{
  const calls=[];const session=createAudioSession(async track=>{calls.push(track.quality||'standard');return{url:`https://m701.music.126.net/${track.quality||'standard'}.mp3`,previewSeconds:null,notice:'',quality:track.quality||'standard'};});const audio=new FakeAudio();session.bind(audio);session.select(song('a','netease'),[song('a','netease')]);await session.play();audio.currentTime=55;session.setQuality('lossless');await new Promise(resolve=>setImmediate(resolve));audio.dispatchEvent(new Event('loadedmetadata'));assert.equal(audio.currentTime,55);assert.deepEqual(calls,['standard','lossless']);assert.equal(session.getSnapshot().quality,'lossless');
});
function setup() { const session = createAudioSession();const audio = new FakeAudio();session.bind(audio);return { session, audio }; }

test('binding the same persistent audio and revisiting a track preserves its clock', async () => {
  const { session, audio } = setup();const track = song('a');session.select(track, [track], true);
  audio.currentTime = 45;audio.dispatchEvent(new Event('timeupdate'));
  session.bind(audio);session.select(track, [track]);
  assert.equal(audio.loads, 1);assert.equal(audio.currentTime, 45);assert.equal(session.getSnapshot().playing, true);
});
test('changing source uses one element, resets state and preserves volume', () => {
  const { session, audio } = setup();session.setVolume(.3);session.select(song('a'), [song('a')], true);
  session.select(song('b', 'netease'), [song('b', 'netease')]);
  assert.equal(audio.src, song('b', 'netease').audioUrl);assert.equal(audio.paused, true);
  assert.equal(session.getSnapshot().time, 0);assert.equal(audio.volume, .3);
});
test('seek is bounded by real duration and next/ended advance the retained queue', () => {
  const { session, audio } = setup();const queue = [song('a'),song('b')];session.select(queue[0], queue, true);
  audio.dispatchEvent(new Event('loadedmetadata'));session.seek(200);assert.equal(audio.currentTime, 180);
  session.seek(-20);assert.equal(audio.currentTime, 0);
  audio.dispatchEvent(new Event('ended'));assert.equal(session.getSnapshot().track.id, 'b');assert.equal(session.getSnapshot().playing, true);
  audio.dispatchEvent(new Event('ended'));assert.equal(session.getSnapshot().playing, false);
  session.next(-1);assert.equal(session.getSnapshot().track.id, 'a');
});
test('late play rejection for replaced track cannot overwrite new playback', async () => {
  const { session, audio } = setup();let reject;
  audio.play = () => new Promise((_, fail) => { reject = fail; });session.select(song('a'), [song('a')]);
  const pending = session.play();session.select(song('b'), [song('b')]);reject(Error('old play aborted'));await pending;
  assert.equal(session.getSnapshot().error, '');assert.equal(session.getSnapshot().track.id, 'b');
});
test('stop removes source, queue and active track; pause never unloads source', () => {
  const { session, audio } = setup();session.select(song('a'), [song('a')], true);session.pause();
  assert.equal(audio.loads, 1);assert.equal(audio.src, song('a').audioUrl);
  session.stop();assert.equal(audio.src, '');assert.equal(session.getSnapshot().track, null);assert.deepEqual(session.getSnapshot().queue, []);
});
test('engine pause during DOM persistence resumes; explicit user pause takes precedence', () => {
  const { session, audio } = setup();session.select(song('a'), [song('a')], true);
  audio.currentTime = 55;session.beginNavigation();audio.pause();session.finishNavigation();
  assert.equal(audio.paused, false);assert.equal(audio.currentTime, 55);assert.equal(audio.loads, 1);
  session.beginNavigation();session.pause();session.finishNavigation();assert.equal(audio.paused, true);
});
test('pause or a newer selection wins over an in-flight NetEase resolution', async () => {
  const resolutions=[];
  const session=createAudioSession(track=>new Promise(resolve=>resolutions.push({id:track.id,resolve})));
  const audio=new FakeAudio();session.bind(audio);const a=song('a','netease'),b=song('b','netease');
  session.select(a,[a,b]);const pending=session.play();session.pause();
  resolutions[0].resolve({url:'https://m701.music.126.net/a.mp3',previewSeconds:null,notice:''});await pending;
  assert.equal(audio.paused,true);assert.equal(audio.src,'');
  const old=session.play();session.select(b,[a,b]);const latest=session.play();
  resolutions[2].resolve({url:'https://m701.music.126.net/b.mp3',previewSeconds:null,notice:''});await latest;
  resolutions[1].resolve({url:'https://m701.music.126.net/a.mp3',previewSeconds:null,notice:''});await old;
  assert.equal(audio.src,'https://m701.music.126.net/b.mp3');assert.equal(session.getSnapshot().track.id,'b');assert.equal(audio.paused,false);
});
test('a trial is labelled and stops at the trial end instead of advancing as a full track', async () => {
  const session=createAudioSession(async()=>({url:'https://m701.music.126.net/preview.mp3',previewSeconds:30,notice:'30 秒试听'}));
  const audio=new FakeAudio();session.bind(audio);const a=song('a','netease'),b=song('b','netease');session.select(a,[a,b]);await session.play();
  assert.equal(session.getSnapshot().notice,'30 秒试听');audio.dispatchEvent(new Event('ended'));
  assert.equal(session.getSnapshot().track.id,'a');assert.equal(session.getSnapshot().playing,false);assert.match(session.getSnapshot().notice,/试听已结束/);
});
test('a renewed playback URL restores the paused position on metadata load', async () => {
  let version=0;const session=createAudioSession(async()=>({url:`https://m701.music.126.net/${++version}.mp3`,previewSeconds:null,notice:''}));
  const audio=new FakeAudio();session.bind(audio);session.select(song('a','netease'),[song('a','netease')]);await session.play();
  audio.currentTime=55;audio.dispatchEvent(new Event('timeupdate'));session.pause();await session.play();
  audio.currentTime=0;audio.dispatchEvent(new Event('loadedmetadata'));assert.equal(audio.currentTime,55);assert.equal(audio.paused,false);
});
test('normal play interruption does not become an unavailable-source error', async () => {
  const {session,audio}=setup();audio.play=()=>Promise.reject(new DOMException('interrupted','AbortError'));session.select(song('a'),[song('a')]);await session.play();assert.equal(session.getSnapshot().error,'');
});
test('a stale same-track play rejection cannot overwrite the latest playback', async () => {
  const {session,audio}=setup();session.select(song('a'),[song('a')]);let fail;
  audio.play=()=>new Promise((_,reject)=>{fail=reject;});const old=session.play();
  audio.play=()=>{audio.paused=false;audio.dispatchEvent(new Event('playing'));return Promise.resolve();};await session.play();
  fail(new DOMException('interrupted','AbortError'));await old;
  assert.equal(session.getSnapshot().playing,true);assert.equal(session.getSnapshot().error,'');
});
test('delayed media events follow the actual element state', async () => {
  const {session,audio}=setup();session.select(song('a'),[song('a')]);await session.play();
  audio.dispatchEvent(new Event('pause'));assert.equal(session.getSnapshot().playing,true);
  audio.currentTime=10;audio.dispatchEvent(new Event('timeupdate'));assert.equal(session.getSnapshot().playing,true);
  session.pause();audio.dispatchEvent(new Event('playing'));assert.equal(session.getSnapshot().playing,false);
});
test('replaying an ended trial with a renewed URL starts at zero', async () => {
  let version=0;const session=createAudioSession(async()=>({url:`https://m701.music.126.net/${++version}.mp3`,previewSeconds:30,notice:'30 秒试听'}));
  const audio=new FakeAudio();session.bind(audio);session.select(song('a','netease'),[song('a','netease')]);await session.play();
  audio.duration=30;audio.currentTime=30;audio.ended=true;audio.paused=true;audio.dispatchEvent(new Event('ended'));
  await session.play();audio.dispatchEvent(new Event('loadedmetadata'));assert.equal(audio.currentTime,0);assert.equal(session.getSnapshot().playing,true);
});

test('a resolver failure is not masked by a previous media error and retry recovers',async()=>{
  let available=false;
  const session=createAudioSession(async()=>{if(!available)throw Error('网易云播放服务暂时不可用，请稍后重试。');return{url:'https://m701.music.126.net/a.mp3',notice:'',previewSeconds:null};});
  const audio=new FakeAudio();session.bind(audio);session.select(song('a','netease'),[song('a','netease')]);
  audio.error={code:4};await session.play();assert.match(session.getSnapshot().error,/播放服务暂时不可用/);assert.equal(audio.src,'');assert.equal(audio.paused,true);
  audio.error=null;available=true;await session.play();assert.equal(audio.paused,false);assert.equal(session.getSnapshot().error,'');
});
test('a media network error does not claim that NetEase denied song permissions',()=>{
  const {session,audio}=setup();session.select(song('a','netease'),[song('a','netease')]);audio.error={code:2};audio.dispatchEvent(new Event('error'));
  assert.match(session.getSnapshot().error,/加载中断/);assert.doesNotMatch(session.getSnapshot().error,/未提供|公开音频/);
});
