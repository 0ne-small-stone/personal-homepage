import test from 'node:test';
import assert from 'node:assert/strict';
import {createNetEaseCore,song,cover,card} from './netease-core.mjs';
import {createMusicPreview} from './preview-service.mjs';
import {once} from 'node:events';
import {podcastMatches,createPodcastDiscovery} from './podcast-discovery.mjs';
import {request as httpRequest} from 'node:http';
import {createRequire} from 'node:module';
const rawSong=id=>({id,name:'Song '+id,ar:[{id:33,name:'Artist'}],al:{id:55,name:'Album',picUrl:'http://p1.music.126.net/cover.jpg'},dt:180000,cookie:'PRIVATE_COOKIE'});
function fixture(authorized=true){const calls=[];const account={state:()=>({authorized,account:authorized?{id:'9'}:null}),request:async(method,args,personal)=>{calls.push({method,args,personal});if(personal&&!authorized){const error=Error('login');error.auth=true;throw error;}if(method==='cloudsearch')return{code:200,result:{songs:[rawSong(123)],songCount:40}};if(method==='playlist_detail')return{code:200,playlist:{id:77,name:'Playlist',creator:{userId:9},trackIds:Array.from({length:210},(_,i)=>({id:i+1}))}};if(method==='song_detail')return{code:200,songs:args.ids.split(',').map(rawSong)};if(method==='user_cloud')return{code:200,data:[{simpleSong:rawSong(123)}],count:1};if(method==='likelist')return{code:200,ids:[123,456]};if(method==='like'||method==='user_cloud_del')return{code:200,cookie:'PRIVATE_COOKIE'};return{code:200};},resolveTrack:async()=>({tracks:[{id:'123',status:'full',audioUrl:'https://m1.music.126.net/song'}]})};const downloads={downloadNative:(track,quality)=>({title:track.title,quality}),jobs:()=>[]};return{core:createNetEaseCore({account,downloads}),calls};}
test('DTO strips credentials, rejects unsafe cover origins and preserves milliseconds as seconds',()=>{const track=song(rawSong(123));assert.equal(track.duration,180);assert.equal(track.coverUrl,'https://p1.music.126.net/cover.jpg');assert.doesNotMatch(JSON.stringify(track),/PRIVATE_COOKIE|cookie/);assert.equal(cover('https://evil.test/cover'),null);assert.equal(cover('https://secret@p1.music.126.net/cover'),null);});
test('search forwards only bounded parameters and emits playable public track metadata',async()=>{const {core,calls}=fixture();const data=await core.handle({action:'search',kind:'song',keyword:'Artist',page:0,cookie:'FORGED',url:'http://localhost'});assert.equal(data.tracks[0].id,'123');assert.equal(data.more,true);assert.deepEqual(calls[0].args,{keywords:'Artist',type:1,limit:30,offset:0});await assert.rejects(core.handle({action:'search',kind:'unknown',keyword:'a'}));await assert.rejects(core.handle({action:'search',kind:'song',keyword:'a'.repeat(201)}));});
test('playlist pages preserve order and expose whether all tracks are loaded',async()=>{const {core}=fixture();const first=await core.handle({action:'detail',kind:'playlist',id:'77',page:0});const second=await core.handle({action:'detail',kind:'playlist',id:'77',page:1});assert.equal(first.tracks.length,100);assert.equal(first.tracks[0].id,'1');assert.equal(second.tracks[0].id,'101');assert.equal(first.total,210);assert.equal(second.more,true);});
test('personal cloud and favorites require identity while public searches remain anonymous',async()=>{const {core}=fixture(false);await assert.rejects(core.handle({action:'browse',view:'cloud'}),error=>error.auth===true);const result=await core.handle({action:'search',kind:'song',keyword:'Song'});assert.equal(result.tracks.length,1);});

test('classified podcast discovery is public, strips private data and pages a stable filtered pool',async()=>{
  const calls=[];const radio=id=>({id,name:'Knowledge '+id,dj:{nickname:'Host'},picUrl:'http://p1.music.126.net/podcast.jpg',rcmdtext:'Platform recommendation',category:'知识',categoryId:11,programCount:12,cookie:'PRIVATE_COOKIE'});
  const account={state:()=>({authorized:false}),request:async(method,args,personal)=>{calls.push({method,args,personal});assert.equal(personal,false);if(method==='dj_recommend_type'){assert.deepEqual(args,{type:11});return{djRadios:[radio(1)]};}assert.equal(method,'dj_radio_hot');assert.deepEqual(args,{cateId:11,limit:100,offset:0});return{djRadios:[radio(1),...Array.from({length:30},(_,i)=>radio(i+2)),{...radio(99),categoryId:2001}]};}};
  const core=createNetEaseCore({account});const first=await core.handle({action:'browse',view:'podcasts',category:'knowledge'});
  assert.deepEqual(first.cards.map(card=>card.id),['1']);assert.equal(first.popular.length,24);assert.equal(first.cards[0].description,'Platform recommendation');assert.equal(first.cards[0].discoveryCategory,'知识');assert.equal(first.cards[0].coverUrl,'https://p1.music.126.net/podcast.jpg');assert.doesNotMatch(JSON.stringify(first),/PRIVATE_COOKIE|cookie/);assert.equal(first.more,true);
  const next=await core.handle({action:'browse',view:'podcasts',category:'knowledge',page:1});assert.deepEqual(next.cards,[]);assert.equal(next.popular.length,6);assert.equal(next.more,false);assert.equal(calls.length,2);assert.equal(new Set([...first.popular,...next.popular].map(card=>card.id)).size,30);
  for(const category of ['__proto__','unrestricted',['knowledge'],123])await assert.rejects(core.handle({action:'browse',view:'podcasts',category}),/分类无效/);
});

test('category and content checks reject short dramas, covers, empty and unrelated feeds even when the upstream category endpoint leaks them',()=>{
  const row={name:'自然选择',categoryId:11,programCount:5};assert.equal(podcastMatches(row,'knowledge'),true);assert.equal(podcastMatches(row,'humanities'),false);
  for(const bad of [{name:'有声短剧：复仇故事'},{name:'吉他翻唱'},{name:'全本有声小说'},{categoryId:2001,desc:'对话音乐人'},{categoryId:10001},{categoryId:3001},{programCount:0},{categoryId:undefined}])assert.equal(podcastMatches({...row,...bad}),false);
  assert.equal(podcastMatches({...row,name:'原著全本 | 沉浸式演说',categoryId:3080098},'humanities'),false);
  assert.equal(podcastMatches({...row,name:'罗永浩的十字路口',desc:'与科技和人文领域的人物展开对话'},'interviews'),true);
  assert.equal(podcastMatches({...row,name:'车间访谈',categoryId:8,desc:'邀请编剧聊聊天'},'interviews'),true);
  assert.equal(podcastMatches({...row,name:'笑话段子',categoryId:8,desc:'聊天讲段子'},'interviews'),false);
  assert.equal(podcastMatches({...row,categoryId:8,desc:'单口喜剧现场录音'}),false);
  assert.equal(podcastMatches({...row,categoryId:8,desc:'和你一起聊聊篮球那些事儿'},'interviews'),false);
});

test('classification failures keep the surviving source and a retry actually retries instead of caching failure',async()=>{
  const radio={id:1,name:'Knowledge',categoryId:11,programCount:5};
  for(const failed of ['dj_recommend_type','dj_radio_hot']){let offline=true;let calls=0;const account={state:()=>({authorized:false}),request:async method=>{calls++;if(method===failed&&offline)throw Error('offline');return{djRadios:[radio]};}};const core=createNetEaseCore({account});const result=await core.handle({action:'browse',view:'podcasts',category:'knowledge'});assert.equal(result.cards.length+result.popular.length,1);assert.equal(result.warnings.length,1);offline=false;const retry=await core.handle({action:'browse',view:'podcasts',category:'knowledge'});assert.equal(retry.warnings.length,0);assert.equal(calls,4);}
  const unavailable=createNetEaseCore({account:{state:()=>({authorized:false}),request:async()=>{throw Error('offline');}}});await assert.rejects(unavailable.handle({action:'browse',view:'podcasts'}),/推荐暂时不可用/);
  const empty=createNetEaseCore({account:{state:()=>({authorized:false}),request:async()=>({djRadios:[{...radio,categoryId:2001,name:'翻唱'}]})}});assert.deepEqual((await empty.handle({action:'browse',view:'podcasts'})).cards,[]);
});

test('podcast candidate snapshots expire and never carry over after account identity changes',async()=>{
  let time=0;let owner='one';let calls=0;const discover=createPodcastDiscovery({request:async()=>{calls++;return{djRadios:[]};},identity:()=>owner,asCard:row=>card(row,'dj'),now:()=>time});
  await discover('humanities');await discover('humanities');assert.equal(calls,2);time=300001;await discover('humanities');assert.equal(calls,4);owner='two';await discover('humanities');assert.equal(calls,6);
});

test('manual podcast refresh bypasses only the selected category snapshot and merges simultaneous refreshes',async()=>{
  let version=1;let calls=0;const request=async(_method,args)=>{calls++;return{djRadios:[{id:(args.type||args.cateId)*100+version,name:'Updated '+version,categoryId:args.type||args.cateId,programCount:5}]};};
  const discover=createPodcastDiscovery({request,identity:()=>'',asCard:row=>card(row,'dj')});
  const original=await discover('knowledge');const other=await discover('humanities');assert.equal(calls,4);version=2;
  assert.equal((await discover('knowledge')).cards[0].id,original.cards[0].id);assert.equal(calls,4);
  const [fresh,duplicate]=await Promise.all([discover('knowledge',0,true),discover('knowledge',0,true)]);assert.notEqual(fresh.cards[0].id,original.cards[0].id);assert.equal(fresh.cards[0].id,duplicate.cards[0].id);assert.equal(calls,6);
  assert.equal((await discover('humanities')).cards[0].id,other.cards[0].id);assert.equal(calls,6);await assert.rejects(discover('knowledge',24,true),/第一页/);
});

test('personal podcast subscriptions retain authentication and their independent pagination',async()=>{
  const {core}=fixture(false);await assert.rejects(core.handle({action:'browse',view:'podcast-subscriptions'}),error=>error.auth===true);
  const account={state:()=>({authorized:true,account:{id:'9'}}),request:async(method,args,personal)=>{assert.equal(method,'dj_sublist');assert.deepEqual(args,{limit:30,offset:30});assert.equal(personal,true);return{djRadios:[{id:4,name:'Subscribed'}],hasMore:true};}};
  const data=await createNetEaseCore({account}).handle({action:'browse',view:'podcast-subscriptions',page:1});assert.equal(data.cards[0].id,'4');assert.equal(data.more,true);
});

test('unchanged upstream podcasts rotate unseen recommendations, keep pages unique and isolate category and account batches',async()=>{
  let calls=0;let owner='one';const radio=(id,type)=>({id:type*1000+id,name:'Podcast '+id,categoryId:type,programCount:5});
  const discover=createPodcastDiscovery({identity:()=>owner,asCard:row=>card(row,'dj'),request:async(method,args)=>{calls++;const type=args.type||args.cateId;return{djRadios:Array.from({length:method==='dj_recommend_type'?12:90},(_,i)=>radio(i+1,type))};}});
  const initial=await discover('knowledge');const humanity=await discover('humanities');const previouslyVisible=new Set([...initial.cards,...initial.popular].map(item=>item.id));
  const [next,concurrent]=await Promise.all([discover('knowledge',0,true),discover('knowledge',0,true)]);
  assert.equal(calls,6);assert.equal(next.batchChanged,true);assert.equal(next.cards.length,12);assert.ok(next.cards.every(item=>!previouslyVisible.has(item.id)));assert.deepEqual(next.cards,concurrent.cards);
  const pageTwo=await discover('knowledge',24);const all=[...next.cards,...next.popular,...pageTwo.popular];assert.equal(new Set(all.map(item=>item.id)).size,all.length);assert.deepEqual((await discover('knowledge')).cards,next.cards);assert.equal(calls,6);
  const third=await discover('knowledge',0,true);assert.ok(third.cards.every(item=>!previouslyVisible.has(item.id)&&!next.cards.some(previous=>previous.id===item.id)));assert.deepEqual((await discover('humanities')).cards,humanity.cards);
  owner='two';assert.deepEqual((await discover('knowledge')).cards,initial.cards);
});

test('small podcast pools report no new batch instead of shuffling the same cards, and exhausted pools cycle without repeating the previous set',async()=>{
  for(const count of [0,5,12,20]){
    const discover=createPodcastDiscovery({identity:()=>'',asCard:row=>card(row,'dj'),request:async()=>({djRadios:Array.from({length:count},(_,i)=>({id:i+1,name:'Podcast '+i,categoryId:11,programCount:5}))})});
    const initial=await discover('knowledge');const next=await discover('knowledge',0,true);
    if(count<=12){assert.equal(next.batchChanged,false);assert.deepEqual(next.cards,initial.cards);}else{assert.equal(next.batchChanged,true);assert.ok(next.cards.some(item=>!initial.cards.some(previous=>previous.id===item.id)));const third=await discover('knowledge',0,true);assert.equal(third.batchChanged,true);assert.ok(third.cards.some(item=>!next.cards.some(previous=>previous.id===item.id)));}
  }
});

test('failed podcast batch changes retain selection history and recovery still chooses other podcasts',async()=>{
  let offline=false;const discover=createPodcastDiscovery({identity:()=>'',asCard:row=>card(row,'dj'),request:async()=>{if(offline)throw Error('offline');return{djRadios:Array.from({length:50},(_,i)=>({id:i+1,name:'Podcast '+i,categoryId:11,programCount:5}))};}});
  const initial=await discover('knowledge');offline=true;await assert.rejects(discover('knowledge',0,true),/推荐暂时不可用/);offline=false;const next=await discover('knowledge',0,true);assert.equal(next.batchChanged,true);assert.ok(next.cards.every(item=>!initial.cards.some(previous=>previous.id===item.id)));
});

test('podcast batch changes avoid the visible cards even after a backend restart and bound the supplied IDs',async()=>{
  const account={state:()=>({authorized:false}),request:async(_method,args)=>{assert.equal(Object.hasOwn(args,'shownIds'),false);return{djRadios:Array.from({length:30},(_,i)=>({id:i+1,name:'Podcast '+i,categoryId:11,programCount:5}))};}};
  const input={action:'browse',view:'podcasts',category:'knowledge'};const first=await createNetEaseCore({account}).handle(input);const restarted=createNetEaseCore({account});
  const next=await restarted.handle({...input,refresh:true,shownIds:first.cards.map(item=>item.id)});assert.equal(next.batchChanged,true);assert.ok(next.cards.some(item=>!first.cards.some(previous=>previous.id===item.id)));
  await assert.rejects(restarted.handle({...input,refresh:true,shownIds:'1,2'}),/批次无效/);await assert.rejects(restarted.handle({...input,refresh:true,shownIds:Array(13).fill('1')}),/批次无效/);await assert.rejects(restarted.handle({...input,refresh:true,shownIds:['invalid']}),/编号无效/);
});
test('cloud deletion requires explicit confirmation and bounded IDs, with no raw SDK response',async()=>{const {core,calls}=fixture();await assert.rejects(core.handle({action:'cloud-delete',id:'123'}),/确认/);await assert.rejects(core.handle({action:'like',id:'123;DROP',enabled:true}));assert.deepEqual(await core.handle({action:'cloud-delete',id:'123',confirmed:true}),{ok:true});assert.equal(calls[0].method,'user_cloud_del');});
test('downloads use only authorized official song resolution and reject unknown quality',async()=>{const {core}=fixture();assert.deepEqual(await core.handle({action:'download',id:'123',quality:'lossless'}),{title:'Song 123',quality:'lossless'});await assert.rejects(core.handle({action:'download',id:'123',quality:'custom'}));});

test('podcast downloads use verified program metadata and the main audio ID, not blank song details',async()=>{
  const calls=[];const program={id:77,name:'Episode',duration:181234,mainSong:{id:123,name:null,album:{name:null},artists:[{id:0,name:null}]},radio:{id:88,name:'Podcast',picUrl:'https://p1.music.126.net/podcast.jpg'},dj:{nickname:'Host'},coverUrl:'https://p2.music.126.net/episode.jpg',cookie:'PRIVATE_COOKIE'};
  const account={state:()=>({authorized:true}),request:async(method,args)=>{calls.push({method,args});assert.equal(method,'dj_program_detail');return{code:200,program};},resolveTrack:async(id,quality)=>({id,quality})};
  let received;const downloads={downloadNative:(track,quality,resolve)=>{received=track;return resolve();}};
  const core=createNetEaseCore({account,downloads});
  assert.deepEqual(await core.handle({action:'download',id:'123',programId:'77',quality:'standard'}),{id:'123',quality:'standard'});
  assert.equal(received.programId,'77');assert.equal(received.radioId,'88');assert.equal(received.title,'Episode');assert.equal(received.album,'Podcast');assert.equal(received.artist,'Host');assert.equal(received.albumId,'');assert.equal(received.artistId,'');assert.equal(received.duration,181.234);assert.doesNotMatch(JSON.stringify(received),/PRIVATE_COOKIE|cookie/);
  assert.deepEqual(calls[0],{method:'dj_program_detail',args:{id:'77'}});
  await assert.rejects(core.handle({action:'download',id:'999',programId:'77'}),/不匹配/);
  await assert.rejects(core.handle({action:'download',id:'123',programId:'bad'}),/编号/);
});
test('like and unlike retain the intended boolean through the installed SDK string coercion',async()=>{
  const sdkLike=createRequire(import.meta.url)('../../node_modules/@neteasecloudmusicapienhanced/api/module/like.js');const writes=[];
  const account={state:()=>({authorized:true}),request:async(method,args)=>{assert.equal(method,'like');return sdkLike(args,async(_url,data)=>{writes.push(data.like);return{code:200};});}};
  const core=createNetEaseCore({account});await core.handle({action:'like',id:'123',enabled:true});await core.handle({action:'like',id:'123',enabled:false});assert.deepEqual(writes,[true,false]);
});
test('album cards keep all credited artists and details use actual dynamic subscription state',async()=>{
  assert.equal(card({id:55,name:'Album',artists:[{name:'One'},{name:'Two'}]},'album').subtitle,'One / Two');
  const account={state:()=>({authorized:true,account:{id:'9'}}),request:async method=>method==='album'?{album:{id:55,name:'Album'},songs:[rawSong(123)]}:{code:200,isSub:true}};
  const data=await createNetEaseCore({account}).handle({action:'detail',kind:'album',id:'55'});assert.equal(data.subscribed,true);assert.equal(data.tracks[0].id,'123');
});
test('HTTP core gateway rejects cross-origin, forged hosts, invalid bodies and arbitrary SDK operations',async()=>{
  let calls=0;const account={ready:async()=>{},state:()=>({authorized:false,account:null}),request:async()=>{calls++;return{code:200,result:{songs:[rawSong(123)]}};},dispose(){}};
  const playback={start(){},stop(){}};const server=createMusicPreview({account,playback});server.listen(0,'127.0.0.1');await once(server,'listening');
  const origin=`http://127.0.0.1:${server.address().port}`;const url=origin+'/personal-homepage/api/music/netease';
  const post=(body,headers={})=>fetch(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
  try{
    assert.equal((await fetch(url)).status,403);
    assert.equal((await post({action:'search'},{Origin:'https://evil.test'})).status,403);
    const forgedHost=await new Promise((resolve,reject)=>{const request=httpRequest(url,{method:'POST',headers:{Host:'evil.test',Origin:origin,'Content-Type':'application/json'}},response=>{response.resume();resolve(response.statusCode);});request.on('error',reject);request.end('{}');});assert.equal(forgedHost,403);
    assert.equal((await post('[]')).status,400);
    assert.equal((await post('x'.repeat(8193))).status,413);
    assert.equal((await post({action:'login_qr_check',cookie:'FORGED'})).status,503);
    assert.equal((await post({action:'browse',view:'cloud'})).status,401);
    assert.equal(calls,0);
    const badResolution=await fetch(origin+'/personal-homepage/api/music/playback/resolve',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:'123',quality:'unlisted'})});assert.equal(badResolution.status,400);assert.equal(calls,0);
    const response=await post({action:'search',kind:'song',keyword:'Song',cookie:'FORGED'});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.doesNotMatch(await response.text(),/PRIVATE_COOKIE|FORGED|cookie/);assert.equal(calls,1);
    const upload=origin+'/personal-homepage/api/music/netease-upload';assert.equal((await fetch(upload,{method:'POST',headers:{Origin:'https://evil.test'}})).status,403);assert.equal((await fetch(upload,{method:'POST',headers:{Origin:origin}})).status,401);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
