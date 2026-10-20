import test from 'node:test';
import assert from 'node:assert/strict';
import {officialMessage,parentMessage,discussionURL,ConnectionAttempt,CONNECTION_TIMEOUT,ownEmbedLifecycle} from '../src/components/home/guestbook-protocol.mjs';
const repo='0ne-small-stone/personal-homepage', source={}, origin='http://127.0.0.1:4352';
const event = data => ({origin:'https://giscus.app',source,data:{giscus:data}});
const metadata = {discussion:{repository:{nameWithOwner:repo},url:`https://github.com/${repo}/discussions/123`,totalCommentCount:1},viewer:{private:'not forwarded'}};
test('only the official origin and current child window can report SDK state',()=>{
  assert.equal(officialMessage({...event(metadata),origin:'https://evil.test'},source,repo),null);
  assert.equal(officialMessage({...event(metadata),source:{}},source,repo),null);
  assert.equal(officialMessage(event(metadata),null,repo),null);
  assert.deepEqual(officialMessage(event(metadata),source,repo),{state:'ready',url:metadata.discussion.url});
});
test('a frame resize never means empty or published',()=>{
  assert.deepEqual(officialMessage(event({resizeHeight:700}),source,repo),{height:700});
  for(const height of [-1,NaN,Infinity,'500',100001]) assert.equal(officialMessage(event({resizeHeight:height}),source,repo),null);
});
test('raw errors and viewer data are not forwarded; explicit not-found alone is empty',()=>{
  assert.deepEqual(officialMessage(event({error:'Bad credentials: private'}),source,repo),{state:'error'});
  assert.deepEqual(officialMessage(event({error:'Discussion not found'}),source,repo),{state:'empty'});
  assert.deepEqual(officialMessage(event({...metadata,discussion:{...metadata.discussion,totalCommentCount:0}}),source,repo),{state:'empty',url:metadata.discussion.url});
});
test('foreign repository, malformed count, and arbitrary data cannot create ready state',()=>{
  assert.equal(officialMessage(event({discussion:{...metadata.discussion,repository:{nameWithOwner:'other/repo'}}}),source,repo),null);
  assert.equal(officialMessage(event({discussion:{...metadata.discussion,totalCommentCount:-1}}),source,repo),null);
  assert.equal(officialMessage(event({signOut:true}),source,repo),null);
});
test('discussion links must remain actual numeric GitHub discussions in the configured repository',()=>{
  for(const url of ['javascript:alert(1)',`https://github.com.evil.test/${repo}/discussions/1`,`https://github.com@evil.test/${repo}/discussions/1`,`https://github.com/other/repo/discussions/1`,`https://github.com/${repo}/issues/1`]) assert.equal(discussionURL(url,repo),null);
});
test('parent accepts only its current same-origin embed and sanitized public shape',()=>{
  const msg={origin,source,data:{lsshGuestbook:{state:'ready',url:metadata.discussion.url,viewer:{private:1}}}};
  assert.deepEqual(parentMessage(msg,source,origin,repo),{state:'ready',url:metadata.discussion.url});
  assert.equal(parentMessage({...msg,source:{}},source,origin,repo),null);
  assert.equal(parentMessage({...msg,origin:'https://evil.test'},source,origin,repo),null);
  assert.equal(parentMessage({origin,source,data:{lsshGuestbook:{state:'published'}}},source,origin,repo),null);
});
function clock(){let id=0;const jobs=new Map(),removed=[];return {jobs,removed,schedule:(fn,ms)=>{assert.equal(ms,CONNECTION_TIMEOUT);jobs.set(++id,fn);return id;},cancel:n=>removed.push(n)};}
test('late readiness and timeout from disposed attempts cannot settle a newer one',()=>{
  const c=clock();let errors=0;
  const old=new ConnectionAttempt(()=>errors++,c.schedule,c.cancel);const late=c.jobs.get(1);old.dispose();
  const next=new ConnectionAttempt(()=>errors++,c.schedule,c.cancel);late();assert.equal(errors,0);assert.equal(old.settle(),false);
  assert.equal(next.settle(),true);c.jobs.get(2)();assert.equal(errors,0);assert.deepEqual(c.removed,[1,2]);
});
test('an actual deadline fires once, ignores later metadata, and disposes safely',()=>{
  const c=clock();let errors=0;const attempt=new ConnectionAttempt(()=>errors++,c.schedule,c.cancel);
  c.jobs.get(1)();c.jobs.get(1)();assert.equal(errors,1);assert.equal(attempt.settle(),false);attempt.dispose();
});
test('browser timer cancellation is invoked without rebinding its receiver',()=>{
  let calls=0;
  const attempt=new ConnectionAttempt(()=>{},()=>1,function(){assert.equal(this,undefined);calls++;});
  attempt.settle();attempt.dispose();assert.equal(calls,2);
});
test('BFCache preserves one live controller across repeated freezes, real destruction releases it',()=>{
  const view=new EventTarget();let disposed=0,received=0;
  const controller=ownEmbedLifecycle(view,()=>disposed++);
  view.addEventListener('message',()=>received++,{signal:controller.signal});
  const hide=persisted=>view.dispatchEvent(Object.assign(new Event('pagehide'),{persisted}));
  hide(true);view.dispatchEvent(new Event('message'));hide(true);view.dispatchEvent(new Event('message'));
  assert.equal(received,2);assert.equal(disposed,0);assert.equal(controller.signal.aborted,false);
  hide(false);view.dispatchEvent(new Event('message'));hide(false);
  assert.equal(received,2);assert.equal(disposed,1);assert.equal(controller.signal.aborted,true);
});
