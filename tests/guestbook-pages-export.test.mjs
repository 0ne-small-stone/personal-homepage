import test from 'node:test';
import assert from 'node:assert/strict';
import {config,exportGuestbook,writeGuestbookSnapshot} from '../tools/guestbook/export-pages.mjs';
import {readFile,mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {isConfirmedEmptySnapshot} from '../src/components/wall/empty-invitation.mjs';
const categories={repositoryId:config.repoId,categories:[{id:config.categoryId,name:config.category}]};
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
const comment=id=>({id,createdAt:'2026-10-20T00:00:00Z',url:'https://github.com/'+config.repo+'/discussions/61#discussioncomment-'+String(id).replace(/\D/g,''),author:{login:'visitor',email:'exclude@example.com'},bodyHTML:'<p>Hello &amp; <b>world</b></p><script>secret()</script>',replyCount:0,replies:[]});
test('Pages export reads only fixed public routes, merges pagination and keeps publication time',async()=>{
 const urls=[];let page=0;
 const snapshot=await exportGuestbook(async(url,options)=>{urls.push(new URL(url));assert.equal(options.redirect,'error');assert.equal(options.headers.Accept,'application/json');return url.includes('/categories?')?response(categories):response({discussion:{id:'D1',url:'https://github.com/'+config.repo+'/discussions/61',totalCommentCount:2,totalReplyCount:0,comments:[comment('C'+(++page))],pageInfo:{hasNextPage:page===1,endCursor:'cursor'}}});});
 assert.equal(snapshot.complete,true);assert.equal(snapshot.discussion.comments.length,2);assert.equal(snapshot.discussion.pageInfo.hasNextPage,false);assert.ok(Number.isFinite(Date.parse(snapshot.fetchedAt)));
 for(const url of urls){assert.equal(url.origin,'https://giscus.app');assert.equal(url.searchParams.get('repo'),config.repo);}
 assert.equal(urls[2].searchParams.get('after'),'cursor');
 assert.equal(snapshot.discussion.comments[0].bodyText,'Hello & world');assert.ok(!JSON.stringify(snapshot).includes('secret()'));assert.ok(!JSON.stringify(snapshot).includes('email'));assert.ok(!JSON.stringify(snapshot).includes('bodyHTML'));
});
test('hidden comments cannot become a confirmed first-post invitation; missing replies remain partial',async()=>{
 const base={id:'D1',url:'https://github.com/'+config.repo+'/discussions/61',totalCommentCount:1,totalReplyCount:1,pageInfo:{hasNextPage:false}};
 const fetcher=comments=>async url=>url.includes('/categories?')?response(categories):response({discussion:{...base,comments}});
 const hidden=await exportGuestbook(fetcher([{...comment('C1'),isMinimized:true}]));assert.equal(hidden.discussion.comments.length,0);assert.equal(isConfirmedEmptySnapshot({...hidden,messages:[]}),false);
 const partial=await exportGuestbook(fetcher([{...comment('C1'),replyCount:2}]));assert.equal(partial.complete,false);
});
test('production reader rejects missing or corrupt snapshot and preserves generation time',async()=>{
 const code=(await readFile(new URL('../src/components/wall/guestbook-data.mjs',import.meta.url),'utf8')).replace('import.meta.env?.PROD','true');
 const {readDiscussion}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const snapshot={version:1,repo:config.repo,term:config.term,complete:true,fetchedAt:'2026-10-20T00:00:00Z',categories,discussion:null};
 const empty=await readDiscussion(config,x=>x,async url=>{assert.equal(url,'/personal-homepage/data/guestbook.json');return response(snapshot);});assert.equal(empty.fetchedAt,snapshot.fetchedAt);assert.equal(empty.complete,true);
 await assert.rejects(readDiscussion(config,x=>x,async()=>response({error:'Discussion not found'},404)));
 await assert.rejects(readDiscussion(config,x=>x,async()=>response({})));
 await assert.rejects(readDiscussion(config,x=>x,async()=>new Response('<html>404</html>',{status:404})));
});
test('only explicit missing discussion becomes confirmed empty',async()=>{
 const empty=await exportGuestbook(async url=>url.includes('/categories?')?response(categories):response({error:'Discussion not found'},404));assert.equal(empty.discussion,null);assert.equal(empty.complete,true);
 for(const status of [403,429,502])await assert.rejects(exportGuestbook(async url=>url.includes('/categories?')?response(categories):response({error:'unavailable'},status)));
});
test('incomplete or malformed pagination fails the build instead of publishing an empty wall',async()=>{
 await assert.rejects(exportGuestbook(async url=>url.includes('/categories?')?response(categories):response({discussion:{comments:[],pageInfo:{hasNextPage:true,endCursor:'same'}}})),/cursor/);
 await assert.rejects(exportGuestbook(async()=>response({repositoryId:'wrong',categories:[]})),/configuration/);
});
test('export rejects absent or non-boolean pageInfo, empty/repeated cursors and later-page 404',async()=>{
 const base={id:'D1',url:'https://github.com/'+config.repo+'/discussions/61',comments:[],totalCommentCount:0,totalReplyCount:0};
 for(const pageInfo of [undefined,{}, {hasNextPage:0},{hasNextPage:'false'},{hasNextPage:true,endCursor:''},{hasNextPage:true,endCursor:' '}]){
  await assert.rejects(exportGuestbook(async url=>url.includes('/categories?')?response(categories):response({discussion:{...base,pageInfo}})));
 }
 let page=0;
 await assert.rejects(exportGuestbook(async url=>url.includes('/categories?')?response(categories):++page===1?response({discussion:{...base,comments:[comment('C1')],totalCommentCount:1,pageInfo:{hasNextPage:true,endCursor:'cursor'}}}):response({error:'Discussion not found'},404)),/disappeared/);
});
test('production reader rejects invalid discussion targets, fields and false completeness',async()=>{
 const code=(await readFile(new URL('../src/components/wall/guestbook-data.mjs',import.meta.url),'utf8')).replace('import.meta.env?.PROD','true');
 const {readDiscussion}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const discussion={id:'D1',url:'https://github.com/'+config.repo+'/discussions/61',locked:false,totalCommentCount:0,totalReplyCount:0,comments:[],pageInfo:{hasNextPage:false,endCursor:null}};
 const snapshot={version:1,repo:config.repo,term:config.term,complete:true,fetchedAt:'2026-10-20T00:00:00Z',categories,discussion};
 const read=next=>readDiscussion(config,x=>x,async()=>response(next));
 const empty=await read(snapshot);assert.equal(isConfirmedEmptySnapshot(empty),true);
 for(const patch of [{url:'javascript:alert(1)'},{url:'https://github.com/another/repo/discussions/61'},{url:discussion.url+'?x=1'},{id:''},{locked:undefined},{totalCommentCount:undefined},{pageInfo:undefined},{pageInfo:{hasNextPage:'false',endCursor:null}},{pageInfo:{hasNextPage:true,endCursor:'cursor'}}]){
  await assert.rejects(read({...snapshot,discussion:{...discussion,...patch}}));
 }
 const unknown=await read({...snapshot,discussion:{...discussion,totalCommentCount:null}});assert.equal(isConfirmedEmptySnapshot(unknown),false);
 await assert.rejects(read({...snapshot,discussion:{...discussion,totalCommentCount:1,comments:[{...comment('C1'),bodyText:'Hello',replyCount:1}]}}));
});
test('partial snapshots cannot replace the previous published file',async t=>{
 const root=new URL('../.ci-tmp/',import.meta.url);await mkdir(root,{recursive:true});
 const directory=await mkdtemp(new URL('guestbook-pages-',root));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 const target=new URL('guestbook.json',pathToFileURL(directory+'/'));
 await writeFile(target,'previous valid snapshot');
 await assert.rejects(writeGuestbookSnapshot({complete:false,discussion:null},target),/incomplete/);
 assert.equal(await readFile(target,'utf8'),'previous valid snapshot');
 const next={version:1,repo:config.repo,term:config.term,complete:true,fetchedAt:'2026-10-20T00:00:00Z',categories,discussion:null};await writeGuestbookSnapshot(next,target);
 assert.deepEqual(JSON.parse(await readFile(target,'utf8')),next);
});
test('writer shares production schema and preserves previous snapshot on invalid exported counts or IDs',async t=>{
 const root=new URL('../.ci-tmp/',import.meta.url);await mkdir(root,{recursive:true});
 const directory=await mkdtemp(new URL('guestbook-schema-',root));t.after(()=>rm(directory,{recursive:true,force:true}));
 const target=new URL('guestbook.json',pathToFileURL(directory+'/'));
 const base={id:'D1',url:'https://github.com/'+config.repo+'/discussions/61',totalCommentCount:1,totalReplyCount:0,comments:[comment('C1')],pageInfo:{hasNextPage:false}};
 for(const patch of [{totalReplyCount:-1},{comments:[comment(123)]}]){
  await writeFile(target,'previous valid snapshot');
  const snapshot=await exportGuestbook(async url=>url.includes('/categories?')?response(categories):response({discussion:{...base,...patch}}));
  await assert.rejects(writeGuestbookSnapshot(snapshot,target),/invalid/);
  assert.equal(await readFile(target,'utf8'),'previous valid snapshot');
 }
});
