// Public DTO adapter; the SDK and account cookie stay behind the local origin gate.
import {createPodcastDiscovery} from './podcast-discovery.mjs';
const text=value=>String(value??'').slice(0,500);
export function musicId(value){const id=String(value??'');if(!/^[1-9]\d{0,19}$/.test(id))throw Error('内容编号无效。');return id;}
const page=value=>Math.max(0,Math.min(200,Number.isInteger(value)?value:0));
export function cover(value){try{const url=new URL(value);if(!/^p\d+\.music\.126\.net$/.test(url.hostname)||url.username||url.password||url.port)return null;url.protocol='https:';return url.href;}catch{return null;}}
export function song(value){const row=value?.song||value?.mainSong||value?.simpleSong||value;const album=row?.al||row?.album||{};const artists=row?.ar||row?.artists||[];
  if(value?.mainSong)return{id:musicId(row.id),programId:musicId(value.id),radioId:musicId(value.radio?.id),title:text(value.name||row.name),artist:text(value.dj?.nickname)||artists.map(item=>text(item.name)).join(' / ')||'未知主播',artistId:'',album:text(value.radio?.name)||'播客节目',albumId:'',coverUrl:cover(value.coverUrl||value.radio?.picUrl||album.picUrl),duration:Number(value.duration||row.dt||row.duration||0)/1000};
  return {id:musicId(row?.id),title:text(row.name||value.songName),artist:artists.map(item=>text(item.name)).join(' / ')||text(value.artist)||'未知歌手',artistId:String(artists[0]?.id||''),album:text(album.name||value.album)||'未标注专辑',albumId:String(album.id||''),coverUrl:cover(album.picUrl||row.picUrl||value.coverUrl||value.cover||value.radio?.picUrl),duration:Number(row.dt||row.duration||value.duration||0)/1000};}
const songs=rows=>(rows||[]).map(row=>{try{return song(row);}catch{return null;}}).filter(Boolean).filter((row,index,all)=>all.findIndex(item=>item.id===row.id)===index);
export function card(row,kind='playlist'){return{id:musicId(row.id),title:text(row.name),subtitle:text(row.creator?.nickname||row.artist?.name||(row.artists||[]).map(artist=>text(artist.name)).join(' / ')||row.dj?.nickname||row.description),coverUrl:cover(row.coverImgUrl||row.picUrl||row.img1v1Url),kind,count:Number(row.trackCount||row.programCount||row.size||0),ownerId:String(row.creator?.userId||''),...(kind==='dj'?{description:text(row.rcmdtext||row.desc),category:text(row.category)}:{})};}
const cards=(rows,kind)=>(rows||[]).map(row=>{try{return card(row,kind);}catch{return null;}}).filter(Boolean);
const personalViews=new Set(['daily','heart','fm','liked','playlists','albums','artists','podcast-subscriptions','cloud','history']);
export function createNetEaseCore({account,downloads}) {
  const call=(method,args={},personal=false)=>account.request(method,args,personal);
  const discoverPodcasts=createPodcastDiscovery({request:call,identity:()=>String(account.state().account?.id||''),asCard:row=>card(row,'dj')});
  async function details(ids){if(!ids.length)return[];const data=await call('song_detail',{ids:ids.map(musicId).slice(0,500).join(',')});const byId=new Map(songs(data.songs).map(track=>[track.id,track]));return ids.map(String).map(id=>byId.get(id)).filter(Boolean);}
  async function playlistDetail(id,offset=0){const data=await call('playlist_detail',{id:musicId(id)});const info=data.playlist;if(!info)throw Error('歌单暂时不可用。');const ids=(info.trackIds||[]).map(row=>String(row.id));const tracks=await details(ids.slice(offset,offset+100));return{title:text(info.name),subtitle:text(info.creator?.nickname),description:text(info.description),coverUrl:cover(info.coverImgUrl),kind:'playlist',id:String(info.id),ownerId:String(info.creator?.userId||''),subscribed:Boolean(info.subscribed),tracks,total:ids.length,more:offset+100<ids.length};}
  async function library(view,offset,category,refresh=false){
    const uid=account.state().account?.id;
    if(personalViews.has(view)&&!account.state().authorized){const error=Error('登录后查看你的音乐库。');error.auth=true;throw error;}
    if(view==='home'){
      const authorized=account.state().authorized;
      const results=await Promise.allSettled([call(authorized?'recommend_resource':'personalized',{limit:12}),call(authorized?'recommend_songs':'personalized_newsong',{limit:6}),call('toplist',{})]);
      return{cards:results[0].status==='fulfilled'?cards(results[0].value.recommend||results[0].value.result):[],tracks:results[1].status==='fulfilled'?songs(results[1].value.data?.dailySongs||results[1].value.result).slice(0,6):[],charts:results[2].status==='fulfilled'?cards(results[2].value.list).slice(0,8):[],warnings:results.filter(row=>row.status==='rejected').map(()=> '部分推荐暂时不可用，可稍后重试。')};
    }
    if(view==='discover'){const data=await call('top_playlist',{limit:24,offset,cat:'全部',order:'hot'});return{cards:cards(data.playlists),more:Boolean(data.more)};}
    if(view==='charts'){const data=await call('toplist');return{cards:cards(data.list)};}
    if(view==='new-albums'){const data=await call('album_new',{limit:24,offset,area:'ALL'});return{cards:cards(data.albums,'album'),more:offset+24<Number(data.total||0)};}
    if(view==='radio'){const data=await call('dj_recommend');return{cards:cards(data.djRadios,'dj')};}
    if(view==='podcasts')return discoverPodcasts(category,offset,refresh);
    if(view==='daily'){const data=await call('recommend_songs',{},true);return{tracks:songs(data.data?.dailySongs),title:'每日推荐'};}
    if(view==='fm'){const data=await call('personal_fm_mode',{mode:'EXPLORE',limit:30},true);return{tracks:songs(data.data),title:'私人漫游',more:true};}
    if(view==='heart'){const playlists=await call('user_playlist',{uid,limit:100},true);const liked=playlists.playlist?.find(item=>String(item.creator?.userId)===uid);if(!liked)throw Error('先收藏几首歌曲，再开启心动模式。');const seed=await playlistDetail(String(liked.id));if(!seed.tracks.length)throw Error('先收藏几首歌曲，再开启心动模式。');const data=await call('playmode_intelligence_list',{id:seed.tracks[offset%seed.tracks.length].id,pid:liked.id,count:1},true);return{tracks:await details((data.data||[]).map(row=>String(row.id))),title:'心动模式',more:true};}
    if(view==='liked'){const data=await call('likelist',{uid},true);const ids=(data.ids||[]).map(String);return{tracks:await details(ids.slice(offset,offset+100)),total:ids.length,more:offset+100<ids.length};}
    if(view==='playlists'){const data=await call('user_playlist',{uid,limit:30,offset},true);return{cards:cards(data.playlist),more:Boolean(data.more)};}
    if(view==='albums'){const data=await call('album_sublist',{limit:30,offset},true);return{cards:cards(data.data,'album'),more:Boolean(data.hasMore)};}
    if(view==='artists'){const data=await call('artist_sublist',{limit:30,offset},true);return{cards:cards(data.data,'artist'),more:Boolean(data.hasMore)};}
    if(view==='podcast-subscriptions'){const data=await call('dj_sublist',{limit:30,offset},true);return{cards:cards(data.djRadios,'dj'),more:Boolean(data.hasMore)};}
    if(view==='cloud'){const data=await call('user_cloud',{limit:100,offset},true);return{tracks:songs(data.data),total:Number(data.count||0),more:Boolean(data.hasMore)};}
    if(view==='history'){const data=await call('record_recent_song',{limit:100},true);const tracks=songs((data.data?.list||[]).map(row=>row.data));return{tracks,total:tracks.length};}
    throw Error('页面不存在。');
  }
  async function handle(input){
    const offset=page(input.page)*(['liked','cloud'].includes(input.view)?100:['playlists','albums','artists','podcast-subscriptions'].includes(input.view)?30:24);
    if(input.action==='browse')return library(input.view,offset,input.category,input.refresh===true);
    if(input.action==='search'){
      if(typeof input.keyword!=='string'||!input.keyword.trim()||input.keyword.length>200)throw Error('请输入歌曲、歌手或专辑。');
      const types={song:1,album:10,artist:100,playlist:1000,dj:1009};if(!types[input.kind])throw Error('搜索类型无效。');
      const data=await call('cloudsearch',{keywords:input.keyword.trim(),type:types[input.kind],limit:30,offset:page(input.page)*30});const result=data.result||{};
      if(input.kind==='song')return{tracks:songs(result.songs),more:(page(input.page)+1)*30<Number(result.songCount||0)};
      const key={album:'albums',artist:'artists',playlist:'playlists',dj:'djRadios'}[input.kind];return{cards:cards(result[key],input.kind),more:(page(input.page)+1)*30<Number(result[`${input.kind}Count`]||result.djRadiosCount||0)};
    }
    if(input.action==='detail'){
      const id=musicId(input.id);
      if(input.kind==='playlist')return playlistDetail(id,page(input.page)*100);
      if(input.kind==='album'){const [data,dynamic]=await Promise.all([call('album',{id}),call('album_detail_dynamic',{id}).catch(()=>null)]);return{...card(data.album,'album'),tracks:songs(data.songs),description:text(data.album?.description),subscribed:Boolean(dynamic?.isSub??data.album?.info?.isSub)};}
      if(input.kind==='artist'){const data=await call('artists',{id});const albums=await call('artist_album',{id,limit:30,offset:page(input.page)*30}).catch(()=>({hotAlbums:[]}));return{...card(data.artist,'artist'),tracks:songs(data.hotSongs),cards:cards(albums.hotAlbums,'album'),description:text(data.artist?.briefDesc),subscribed:Boolean(data.artist?.followed),more:Boolean(albums.more)};}
      if(input.kind==='dj'){const [data,programs]=await Promise.all([call('dj_detail',{rid:id}),call('dj_program',{rid:id,limit:100,offset:page(input.page)*100})]);return{...card(data.data,'dj'),description:text(data.data?.desc),tracks:songs(programs.programs),more:Boolean(programs.more),subscribed:Boolean(data.data?.subed)};}
      throw Error('详情类型无效。');
    }
    if(input.action==='lyrics'){const data=await call('lyric',{id:musicId(input.id)});return{lyrics:typeof data.lrc?.lyric==='string'?data.lrc.lyric.slice(0,65536):null,translation:typeof data.tlyric?.lyric==='string'?data.tlyric.lyric.slice(0,65536):null};}
    if(input.action==='liked-ids'){const data=await call('likelist',{uid:account.state().account?.id},true);return{ids:(data.ids||[]).map(String).slice(0,20000)};}
    if(input.action==='jobs'){await downloads?.restoreJobs?.();return{jobs:downloads?.jobs().filter(job=>job.provider==='netease')||[]};}
    if(input.action==='download'){
      const id=musicId(input.id);const level=input.quality||'lossless';if(!['standard','exhigh','lossless','hires'].includes(level))throw Error('音质无效。');
      if(!account.state().authorized){const error=Error('登录后下载你有权限的歌曲。');error.auth=true;throw error;}
      const track=input.programId===undefined?(await details([id]))[0]:song((await call('dj_program_detail',{id:musicId(input.programId)})).program);
      if(!track?.title||track.id!==id)throw Error('下载内容不存在或节目编号不匹配。');return downloads.downloadNative(track,level,()=>account.resolveTrack(id,level));
    }
    if(input.action==='cancel-download'){if(typeof input.id!=='string'||input.id.length>80)throw Error('任务编号无效。');downloads?.cancel(input.id);return{ok:true};}
    if(input.action==='like'){const data=await call('like',{id:musicId(input.id),like:input.enabled===true?'true':'false'},true);return{ok:data.code===200};}
    if(input.action==='subscribe'){const methods={playlist:'playlist_subscribe',album:'album_sub',artist:'artist_sub',dj:'dj_sub'};if(!methods[input.kind])throw Error('收藏类型无效。');const data=await call(methods[input.kind],{id:musicId(input.id),rid:input.kind==='dj'?musicId(input.id):undefined,t:input.enabled===true?1:2},true);return{ok:data.code===200};}
    if(input.action==='create-playlist'){if(typeof input.name!=='string'||!input.name.trim()||input.name.length>80)throw Error('请输入1–80字的歌单名称。');const data=await call('playlist_create',{name:input.name.trim(),privacy:input.private===true?10:0},true);return{item:card(data.playlist)};}
    if(input.action==='edit-playlist'){if(typeof input.name!=='string'||!input.name.trim()||input.name.length>80)throw Error('歌单名称无效。');const data=await call('playlist_update',{id:musicId(input.id),name:input.name.trim(),desc:text(input.description),tags:''},true);return{ok:data.code===200};}
    if(input.action==='playlist-track'){if(!['add','del'].includes(input.operation))throw Error('操作无效。');const data=await call('playlist_tracks',{pid:musicId(input.playlistId),tracks:musicId(input.id),op:input.operation},true);return{ok:data.code===200};}
    if(input.action==='cloud-delete'){if(input.confirmed!==true)throw Error('请确认删除云盘歌曲。');await call('user_cloud_del',{id:musicId(input.id)},true);return{ok:true};}
    throw Error('功能入口不存在。');
  }
  return{handle};
}
