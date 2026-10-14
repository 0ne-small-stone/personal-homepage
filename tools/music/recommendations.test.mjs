import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { songId, createRecommendationStore } from './recommendations.mjs';

const input = (id = randomUUID()) => ({ song:'2016710373',nickname:'推歌测试',reason:'喜欢这首歌的氛围',submissionId:id });
async function setup() {
  const dir = await mkdtemp(path.join(os.tmpdir(),'lssh-recommend-test-'));
  const file=path.join(dir,'queue.json');let authorized=false;let ids=[];let writes=0;
  const adapter={ authorized:()=>authorized,song:async id=>({id,title:'Echoes',artist:'Pink Floyd',album:'BBC'}),playlistIds:async()=>ids,addSong:async id=>{writes++;ids=[...ids,id];} };
  const store=await createRecommendationStore(file,adapter);
  return {store,file,adapter,auth:()=>{authorized=true;},ids:value=>{ids=value;},writes:()=>writes};
}
test('parses canonical, mobile and hash links; rejects other hosts/playlist/path',()=>{
  for(const value of ['2016710373','https://music.163.com/song?id=2016710373','https://music.163.com/#/song?id=2016710373','https://music.163.com/m/song?id=2016710373'])assert.equal(songId(value),'2016710373');
  for(const value of ['https://evil.example/song?id=1','https://music.163.com/playlist?id=1','javascript:alert(1)','https://music.163.com.evil.test/song?id=1','https://a@music.163.com/song?id=1'])assert.throws(()=>songId(value));
});
test('submission is durable, idempotent across restart, and never writes before approval',async()=>{
  const t=await setup();const data=input();const first=await t.store.submit(data);await t.store.submit(data);
  const next=await createRecommendationStore(t.file,t.adapter);const repeated=await next.submit(data);
  assert.equal(next.list().length,1);assert.equal(first.id,repeated.id);assert.equal(t.writes(),0);
  assert.equal(JSON.parse(await readFile(t.file,'utf8'))[0].status,'pending');
});
test('approval without authorization waits; authorization resumes and verifies exactly once',async()=>{
  const t=await setup();const record=await t.store.submit(input());await t.store.review(record.id,'approve');
  assert.equal(t.store.list()[0].status,'awaiting_auth');assert.equal(t.writes(),0);
  t.auth();await t.store.resume();await t.store.review(record.id,'approve');assert.equal(t.writes(),1);assert.equal(t.store.list()[0].status,'synced');
});
test('existing song is verified without adding duplicate; rejected song cannot be retried',async()=>{
  const t=await setup();t.auth();t.ids(['2016710373']);const record=await t.store.submit(input());await t.store.review(record.id,'approve');assert.equal(t.writes(),0);
  const second=await t.store.submit(input());await t.store.review(second.id,'reject');await assert.rejects(t.store.review(second.id,'retry'));assert.equal(t.store.list()[0].status,'rejected');
});
test('failed verification never reports success; retry checks upstream before adding',async()=>{
  const t=await setup();t.auth();t.adapter.addSong=async()=>{};const record=await t.store.submit(input());await t.store.review(record.id,'approve');assert.equal(t.store.list()[0].status,'failed');
  t.ids(['2016710373']);await t.store.review(record.id,'retry');assert.equal(t.store.list()[0].status,'synced');assert.equal(t.writes(),0);
});
test('expired authorization and concurrent duplicate submission preserve consistent state',async()=>{
  const t=await setup();t.auth();const data=input();const [a,b]=await Promise.all([t.store.submit(data),t.store.submit(data)]);assert.equal(a.id,b.id);
  t.adapter.playlistIds=async()=>{const error=Error();error.auth=true;throw error;};await t.store.review(a.id,'approve');assert.equal(t.store.list()[0].status,'awaiting_auth');
});
