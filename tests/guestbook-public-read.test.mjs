import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicGuestbookRead} from '../tools/guestbook/public-read.mjs';
const config={repo:'0ne-small-stone/personal-homepage',term:'LSSH · The Wall',category:'Announcements'};
const request=(url,method='GET',headers={host:'127.0.0.1:4356'})=>({url,method,headers});
const response=()=>({writeHead(status,headers){this.status=status;this.headers=headers;},end(body){this.body=body;}});
test('only fixed public repo/term/category forwarded, incoming credentials omitted',async()=>{
 let seen;const handle=createPublicGuestbookRead(config,{fetcher:async(url,options)=>{seen={url:new URL(url),options};return new Response('{"discussion":{"comments":[]}}');}});const res=response();
 await handle(request('/personal-homepage/api/discussions?repo=evil&term=other&category=private&after=abc','GET',{host:'127.0.0.1:4356',cookie:'not-forwarded',authorization:'not-forwarded'}),res);
 assert.equal(seen.url.origin,'https://giscus.app');for(const key of ['repo','term','category'])assert.equal(seen.url.searchParams.get(key),config[key]);assert.equal(seen.url.searchParams.get('after'),'abc');assert.deepEqual(seen.options.headers,{Accept:'application/json'});assert.equal(seen.options.redirect,'error');assert.equal(res.status,200);
});
test('write/cross-origin/foreign-host/oversized cursor never call upstream',async()=>{
 let calls=0;const handle=createPublicGuestbookRead(config,{fetcher:async()=>{calls++;}});
 for(const [req,expected] of [[request('/personal-homepage/api/discussions','POST'),405],[request('/personal-homepage/api/discussions','GET',{host:'evil.example'}),403],[request('/personal-homepage/api/discussions','GET',{host:'127.0.0.1:4356',origin:'https://evil.example'}),403],[request('/personal-homepage/api/discussions?after='+'x'.repeat(513)),400]]){const res=response();await handle(req,res);assert.equal(res.status,expected);}assert.equal(calls,0);
});
test('404 empty-discussion and 429 remain distinct, HEAD has no body',async()=>{
 for(const status of [404,429]){const handle=createPublicGuestbookRead(config,{fetcher:async()=>new Response(JSON.stringify({error:status===404?'Discussion not found':'rate-limit'}),{status})});const res=response();await handle(request('/personal-homepage/api/discussions'),res);assert.equal(res.status,status);}
 const handle=createPublicGuestbookRead(config,{fetcher:async()=>new Response('{}')});const res=response();await handle(request('/personal-homepage/api/discussions/categories','HEAD'),res);assert.equal(res.status,200);assert.equal(res.body,undefined);assert.equal(res.headers['Cache-Control'],'no-store');
});
test('failed/invalid/oversized public response is 502, other app routes untouched',async()=>{
 for(const fetcher of [async()=>{throw Error('private failure');},async()=>new Response('not json'),async()=>new Response(JSON.stringify({data:'x'.repeat(100)}))]){const handle=createPublicGuestbookRead(config,{fetcher,maxBytes:50});const res=response();await handle(request('/personal-homepage/api/discussions'),res);assert.equal(res.status,502);assert(!res.body.includes('private failure'));}
 const res=response();assert.equal(await createPublicGuestbookRead(config)(request('/personal-homepage/api/music/account'),res),false);assert.equal(res.status,undefined);
});
