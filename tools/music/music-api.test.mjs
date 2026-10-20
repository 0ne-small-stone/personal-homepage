import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {musicApiFetch,createMusicApiTransport} from '../../src/lib/music-api.ts';
import {canonicalProof} from '../../services/music-edge/device-sessions.mjs';

test('music transport preserves payload, headers and cancellation while enforcing same-origin, uncached requests', async () => {
  const controller = new AbortController();
  const headers = new Headers({'Content-Type': 'application/octet-stream', 'X-Music-Name': 'fixture.flac'});
  const body = new Uint8Array([1, 2, 3]);
  const init = {method: 'POST', headers, body, signal: controller.signal, credentials: 'include', cache: 'force-cache'};
  const response = new Response('ok');
  let received;
  const result = await musicApiFetch('/personal-homepage/api/music/netease-upload', init, async (url, options) => {
    received = {url, options};return response;
  });
  assert.equal(result, response);
  assert.equal(received.url, '/personal-homepage/api/music/netease-upload');
  assert.equal(received.options.credentials, 'same-origin');
  assert.equal(received.options.cache, 'no-store');
  assert.equal(received.options.body, body);
  assert.equal(received.options.headers, headers);
  assert.equal(received.options.signal, controller.signal);
  assert.equal(received.options.method, 'POST');
  assert.equal(init.credentials, 'include');assert.equal(init.cache, 'force-cache');
});

test('music transport leaves caller abort reasons intact', async () => {
  const controller = new AbortController();
  const reason = new DOMException('Navigation cancelled', 'AbortError');
  const pending = musicApiFetch('/personal-homepage/api/music/playback/account', {signal: controller.signal}, (_url, options) =>
    new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), {once: true})));
  controller.abort(reason);
  await assert.rejects(pending, error => error === reason);
});

const compiled = await build({entryPoints: [fileURLToPath(new URL('../../src/lib/netease-core.ts', import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node', define: {'import.meta.env.BASE_URL': '"/personal-homepage/"'}});
const {neteaseRequest} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

test('real NetEase requests carry the site session, keep the JSON contract and honor route cancellation', async t => {
  const original = globalThis.fetch;
  t.after(() => {globalThis.fetch = original;});
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({url, options});return Response.json({tracks: [], more: false});
  };
  const input = {action: 'browse', view: 'liked', page: 0};
  const controller = new AbortController();
  assert.deepEqual(await neteaseRequest(input, controller.signal), {tracks: [], more: false});
  assert.equal(requests[0].url, '/personal-homepage/api/music/netease');
  assert.equal(requests[0].options.credentials, 'same-origin');
  assert.equal(requests[0].options.cache, 'no-store');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(requests[0].options.body), input);
  assert.ok(requests[0].options.signal instanceof AbortSignal);
  const reason = new DOMException('Route changed', 'AbortError');
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), {once: true}));
  const pending = neteaseRequest(input, controller.signal);
  controller.abort(reason);
  await assert.rejects(pending, error => error === reason);
});

const pageOrigin = 'https://0ne-small-stone.github.io', apiOrigin = 'https://music.example.net';
const accountPath = '/personal-homepage/api/music/playback/account';
const ttl = 30 * 86400000;
function memoryStorage() {
  const rows = new Map(); let reads = 0, writes = 0;
  return {rows, get reads() { return reads; }, get writes() { return writes; },
    async load(scope) { reads++; return structuredClone(rows.get(scope)); },
    async save(scope, value) { writes++; rows.set(scope, structuredClone(value)); },
  };
}
const gate = () => {let resolve;const promise = new Promise(done => {resolve = done;});return {promise,resolve};};
function service({now = () => Date.now(), respond = () => Response.json({ok: true}), enrollWait} = {}) {
  const identities = new Map(), requests = [], enrollments = [];
  let count = 0;
  return {identities,requests,enrollments,fetcher: async (input, options) => {
    const url = new URL(String(input));
    assert.equal(url.origin, apiOrigin);
    assert.equal(options.credentials, 'omit');assert.equal(options.cache, 'no-store');
    assert.equal(options.mode,'cors');assert.equal(options.redirect,'error');
    if (url.pathname === '/personal-homepage/api/music/session') {
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);assert.deepEqual(Object.keys(body), ['publicJwk']);
      assert.equal('d' in body.publicJwk, false);
      const publicKey = await crypto.subtle.importKey('jwk', body.publicJwk, {name: 'ECDSA',namedCurve: 'P-256'}, false, ['verify']);
      const id = Buffer.alloc(32, ++count).toString('base64url');
      identities.set(id, publicKey);enrollments.push(body);
      if (enrollWait) await enrollWait;
      return Response.json({id,expiresAt: now() + ttl, cookie: 'must-never-be-saved'});
    }
    const headers = new Headers(options.headers), id = headers.get('X-Music-Session');
    const nonce = headers.get('X-Music-Nonce'), time = headers.get('X-Music-Time');
    const signature = Buffer.from(headers.get('X-Music-Proof') || '', 'base64url');
    assert.match(time, /^(0|[1-9]\d*)$/);assert.ok(Math.abs(Number(time)-now()) < 60000);
    assert.equal(Buffer.from(nonce, 'base64url').length, 16);assert.equal(signature.length, 64);
    const canonical = await canonicalProof({id,time,nonce,method:options.method,path:url.pathname+url.search,origin:pageOrigin,bodyText:options.body || ''});
    assert.equal(await crypto.subtle.verify({name: 'ECDSA',hash: 'SHA-256'}, identities.get(id), signature, new TextEncoder().encode(canonical)), true, 'the independent server canonical must verify the actual wire request');
    requests.push({url,options,headers,id,nonce});
    return respond(requests.at(-1),requests.length);
  }};
}
function remoteTransport(storage, extra = {}) {return createMusicApiTransport({apiOrigin,pageOrigin,storage,...extra});}

test('remote API configuration fails closed for noncanonical, insecure or credentialed origins', () => {
  for (const value of ['http://music.example.net','https://music.example.net/','https://music.example.net/api','https://music.example.net?q=1','https://music.example.net#x','https://u:p@music.example.net',' https://music.example.net','https://MUSIC.example.net','file:///tmp/api']) {
    assert.throws(() => createMusicApiTransport({apiOrigin:value}), /HTTPS Origin/);
  }
});

test('only own-origin playback subroutes and exact netease move to the API; other inputs remain untouched', async () => {
  const storage = memoryStorage(), transport = remoteTransport(storage), server = service();
  const own = new URL(accountPath + '?check=%E4%B8%AD', pageOrigin);
  await transport(own, {}, server.fetcher);
  assert.equal(server.requests[0].url.href, apiOrigin + own.pathname + own.search);
  for (const input of ['/personal-homepage/api/music/lx/search','/personal-homepage/api/music/netease-upload','/personal-homepage/api/music/netease/extra','/personal-homepage/api/music/playback','/personal-homepage/music/','https://thirdparty.example'+accountPath,'//thirdparty.example'+accountPath,new Request('https://thirdparty.example'+accountPath)]) {
    const headers = {'X-Fixture':'stay-here'}, body = new Uint8Array([1,2]);
    let called = false;
    await transport(input, {method:'POST',headers,body,credentials:'include'}, async (received,options) => {
      called = true;assert.equal(received,input);assert.equal(options.headers,headers);assert.equal(options.body,body);assert.equal(options.credentials,'same-origin');
      assert.equal(new Headers(options.headers).has('X-Music-Session'),false);return new Response('ok');
    });
    assert.equal(called,true);
  }
  assert.equal(server.enrollments.length,1);assert.equal(storage.reads,1);
});

test('signed JSON requests preserve the caller headers, payload and signal, with authentic WebCrypto proofs', async () => {
  const storage = memoryStorage(), transport = remoteTransport(storage), server = service();
  const controller = new AbortController(), headers = new Headers({'Content-Type':'application/json','X-Caller':'intact'});
  const body = JSON.stringify({action:'browse',view:'liked',query:'光 & echo\nnew line'});
  await transport('/personal-homepage/api/music/netease?fixture=1', {method:'post',body,headers,signal:controller.signal,credentials:'include'}, server.fetcher);
  const request = server.requests[0];
  assert.equal(request.options.method,'POST');assert.equal(request.options.body,body);assert.equal(request.options.signal,controller.signal);
  assert.equal(request.headers.get('Content-Type'),'application/json');assert.equal(request.headers.get('X-Caller'),'intact');assert.equal(headers.has('X-Music-Proof'),false);
  const saved = [...storage.rows.values()][0];
  assert.equal(saved.privateKey.extractable,false);assert.equal(saved.privateKey.type,'private');
  await assert.rejects(crypto.subtle.exportKey('jwk',saved.privateKey), error => error.name === 'InvalidAccessException');
  assert.deepEqual(Object.keys(saved).sort(),['privateKey','publicJwk','session']);assert.equal('cookie' in saved.session,false);
});

test('concurrent calls share key creation and one registration, but carry distinct replay nonces', async () => {
  const storage = memoryStorage(), enrollment = gate(), server = service({enrollWait:enrollment.promise}), transport = remoteTransport(storage);
  const pending = Array.from({length:6},(_,i) => transport(accountPath+'?i='+i,{},server.fetcher));
  enrollment.resolve();await Promise.all(pending);
  assert.equal(server.enrollments.length,1);assert.equal(storage.reads,1);assert.equal(storage.writes,2);
  assert.equal(new Set(server.requests.map(value => value.id)).size,1);assert.equal(new Set(server.requests.map(value => value.nonce)).size,6);
});

test('recreating the transport restores the saved CryptoKey/session; 30-day expiry re-registers the same device key', async () => {
  const storage = memoryStorage();let at = 1900000000000;
  const now = () => at, server = service({now});
  await remoteTransport(storage,{now})(accountPath,{},server.fetcher);
  await remoteTransport(storage,{now})(accountPath,{},server.fetcher);
  assert.equal(server.enrollments.length,1);assert.equal(server.requests[0].id,server.requests[1].id);
  at += ttl+1;
  await remoteTransport(storage,{now})(accountPath,{},server.fetcher);
  assert.equal(server.enrollments.length,2);assert.notEqual(server.requests[1].id,server.requests[2].id);
  assert.equal(server.enrollments[0].publicJwk.x,server.enrollments[1].publicJwk.x);assert.equal(server.enrollments[0].publicJwk.y,server.enrollments[1].publicJwk.y);
});

test('a device_session_invalid 401 clears only the opaque session and retries once with a fresh proof', async () => {
  const storage = memoryStorage(), transport = remoteTransport(storage);
  const server = service({respond:(_request,index) => index === 1 ? Response.json({code:'device_session_invalid'},{status:401}) : Response.json({ok:true})});
  assert.deepEqual(await (await transport(accountPath,{},server.fetcher)).json(),{ok:true});
  assert.equal(server.requests.length,2);assert.equal(server.enrollments.length,2);
  assert.notEqual(server.requests[0].id,server.requests[1].id);assert.notEqual(server.requests[0].nonce,server.requests[1].nonce);
  assert.equal(server.enrollments[0].publicJwk.x,server.enrollments[1].publicJwk.x);
  const rejecting = service({respond:() => Response.json({code:'device_session_invalid'},{status:401})});
  const failedStorage = memoryStorage();
  const response = await remoteTransport(failedStorage)(accountPath,{},rejecting.fetcher);
  assert.equal(response.status,401);assert.equal(rejecting.requests.length,2);assert.equal(rejecting.enrollments.length,2);
  assert.equal([...failedStorage.rows.values()][0].session,undefined);
});

test('account authorization failures, other 401 bodies and errors never recreate the device', async () => {
  for (const response of [Response.json({authRequired:true},{status:401}),Response.json({code:'authRequired'},{status:401}),new Response('unreadable',{status:401}),Response.json({code:'device_session_invalid'},{status:403})]) {
    const storage = memoryStorage(), transport = remoteTransport(storage), server = service({respond:() => response.clone()});
    const result = await transport(accountPath,{},server.fetcher);
    assert.equal(await result.text(),await response.clone().text());
    assert.equal(server.enrollments.length,1);assert.equal(server.requests.length,1);
    await transport(accountPath,{},server.fetcher);assert.equal(server.enrollments.length,1);
  }
});

test('Request inputs retain their inherited JSON, headers and cancellation without consuming the original body', async () => {
  const transport = remoteTransport(memoryStorage()), server = service();
  const original = new Request(pageOrigin+'/personal-homepage/api/music/netease?from=request',{method:'POST',headers:{'Content-Type':'application/json','X-Inherited':'yes'},body:'{"action":"browse"}'});
  await transport(original,{},server.fetcher);
  assert.equal(original.bodyUsed,false);assert.equal(server.requests[0].options.body,'{"action":"browse"}');
  assert.equal(server.requests[0].headers.get('X-Inherited'),'yes');assert.equal(server.requests[0].options.signal,original.signal);
  assert.equal(server.requests[0].url.search,'?from=request');
});

test('unsupported remote binary payloads fail before device enrollment', async () => {
  const storage = memoryStorage(), server = service();
  await assert.rejects(remoteTransport(storage)(accountPath,{method:'POST',body:new Uint8Array([1])},server.fetcher),TypeError);
  assert.equal(storage.reads,0);assert.equal(server.enrollments.length,0);
});

test('an already aborted request does no key, registration or network work', async () => {
  const storage = memoryStorage(), server = service(), controller = new AbortController(), reason = {cancel:'before start'};
  controller.abort(reason);
  await assert.rejects(remoteTransport(storage)(accountPath,{signal:controller.signal},server.fetcher),error => error === reason);
  assert.equal(storage.reads,0);assert.equal(server.enrollments.length,0);assert.equal(server.requests.length,0);
});

test('one cancelled waiter keeps its reason while another caller finishes shared registration', async () => {
  const storage = memoryStorage(), started = gate(), release = gate(), server = service({enrollWait:release.promise});
  const transport = remoteTransport(storage), controller = new AbortController(), reason = new DOMException('Route left','AbortError');
  const fetcher = async (...args) => {if(String(args[0]).endsWith('/session'))started.resolve();return server.fetcher(...args);};
  const cancelled = transport(accountPath,{signal:controller.signal},fetcher), surviving = transport(accountPath,{},fetcher);
  await started.promise;controller.abort(reason);
  await assert.rejects(cancelled,error => error === reason);release.resolve();await surviving;
  assert.equal(server.enrollments.length,1);assert.equal(server.requests.length,1);
});

test('aborting an in-flight API request returns the original reason even if fetch rejects differently', async () => {
  const transport = remoteTransport(memoryStorage()), controller = new AbortController(), entered = gate(), reason = {cancel:'caller-navigation'};
  const server = service({respond:() => {entered.resolve();return new Promise((_resolve,reject) => controller.signal.addEventListener('abort',() => reject(new TypeError('generic network failure')),{once:true}));}});
  const pending = transport(accountPath,{signal:controller.signal},server.fetcher);
  await entered.promise;controller.abort(reason);
  await assert.rejects(pending,error => error === reason);
  assert.equal(server.requests[0].options.signal,controller.signal);
});

test('simultaneous invalid-session responses share one recovery enrollment instead of replacing the fresh id again', async () => {
  const storage = memoryStorage(), transport = remoteTransport(storage), both = gate();let failures = 0;
  const server = service({respond: async request => {
    if(request.id !== Buffer.alloc(32,1).toString('base64url'))return Response.json({ok:true});
    if(++failures === 2)both.resolve();await both.promise;
    return Response.json({code:'device_session_invalid'},{status:401});
  }});
  const responses = await Promise.all([transport(accountPath,{},server.fetcher),transport(accountPath,{},server.fetcher)]);
  assert.deepEqual(await Promise.all(responses.map(response => response.json())),[{ok:true},{ok:true}]);
  assert.equal(server.enrollments.length,2);assert.equal(server.requests.length,4);
  assert.equal(new Set(server.requests.slice(2).map(request => request.id)).size,1);
});

test('storage failures fail closed, then a subsequent call can retry initialization', async () => {
  const storage = memoryStorage(), server = service(), failure = new Error('storage unavailable');let first = true;
  const transport = remoteTransport({save:storage.save,async load(scope) {if(first){first=false;throw failure;}return storage.load(scope);}});
  await assert.rejects(transport(accountPath,{},server.fetcher),error => error === failure);
  assert.equal(server.enrollments.length,0);
  await transport(accountPath,{},server.fetcher);assert.equal(server.enrollments.length,1);
});

test('an invalid enrollment response is not saved as an authorized device session', async () => {
  for(const session of [{id:'not-an-id',expiresAt:Date.now()+ttl},{id:Buffer.alloc(32).toString('base64url'),expiresAt:Date.now()-1000},{id:Buffer.alloc(32).toString('base64url'),expiresAt:Date.now()+2*ttl}]) {
    const storage=memoryStorage(),transport=remoteTransport(storage);let apiRequests=0;
    await assert.rejects(transport(accountPath,{},async(url) => {
      if(String(url).endsWith('/session'))return Response.json(session);
      apiRequests++;return Response.json({ok:true});
    }),/响应无效/);
    assert.equal(apiRequests,0);assert.equal([...storage.rows.values()][0].session,undefined);
  }
});

test('cancellation settles immediately even when the injected network implementation ignores the signal', async () => {
  const transport=remoteTransport(memoryStorage()),controller=new AbortController(),entered=gate(),release=gate(),reason=new DOMException('Leaving','AbortError');
  const server=service({respond:async()=>{entered.resolve();await release.promise;return Response.json({ok:true});}});
  const pending=transport(accountPath,{signal:controller.signal},server.fetcher);
  await entered.promise;controller.abort(reason);await assert.rejects(pending,error=>error===reason);release.resolve();
});
