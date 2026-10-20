import {useCallback,useEffect,useMemo,useRef,useState,type Dispatch,type SetStateAction} from 'react';
import {hashKey,useInfiniteQuery,useQuery,useQueryClient,type InfiniteData} from '@tanstack/react-query';
import {audioSession,type AudioTrack} from '../../lib/audio-session';
import type {MusicTrack} from '../../lib/music';
import {neteaseRequest,readNetEaseRoute,type NetEaseView,type NetEaseKind,type NetEasePodcastCategory,type NetEaseData,type NetEaseTrack,type NetEaseCard,type NetEaseJob} from '../../lib/netease-core';
import {useMusicAccount} from './useMusicAccount';
import {markMusicRender} from './render-profile';
import {useAudioSession} from './useAudioSession';
import type {PlaybackPresentation} from './RadioNowPlaying';
import {catalogQueryOptions,mergeMusicPages,musicKeys,musicReadOptions,musicScope,updateMusicData} from '../../lib/music-query';
import sharedPlaylist from '../../data/music/netease-playlist.json';
import {sharedPlaylistData,neteaseServiceMessage,type NetEaseServiceState} from '../../lib/netease-snapshot';
export const asNetEaseAudio=(track:NetEaseTrack):AudioTrack=>({...track,audioUrl:`https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,source:'netease'});
export default function useNetEaseCore(service:NetEaseServiceState='ready'){
  const audio=useAudioSession(false);
  markMusicRender('neteaseCatalog');
  const client=useQueryClient();
  const [route,setRoute]=useState<{view:NetEaseView;kind:NetEaseKind;id:string;query:string;category:NetEasePodcastCategory}>({view:'home',kind:'playlist',id:'',query:'',category:'all'});
  const [ready,setReady]=useState(false);const [refreshing,setRefreshing]=useState(false);
  const [notice,setNotice]=useState('');
  const {account}=useMusicAccount(false,service==='ready');const [mutationBusy,setMutationBusy]=useState(false);
  const metadata=useRef(new Map<string,NetEaseTrack>());const controller=useRef<AbortController|null>(null);const scroll=useRef<HTMLElement>(null);const previous=useRef(route);const mounted=useRef(false);const identity=useRef('');const queueOrigin=useRef<{view:NetEaseView;kind:NetEaseKind;id:string;page:number;more:boolean}|null>(null);const refilling=useRef(false);
  const scope=musicScope(account.authorized?account.account?.id??'':'');
  const online=service==='ready';
  const enabled=ready&&online&&route.view!=='downloads'&&(route.view!=='search'||Boolean(route.query));
  const options=catalogQueryOptions(scope,route,neteaseRequest);
  const catalog=useInfiniteQuery({...options,enabled});
  const data=useMemo<NetEaseData>(()=>!online?(service==='checking'?{}:sharedPlaylistData(sharedPlaylist,route)):enabled?mergeMusicPages(catalog.data?.pages):{},[online,service,route,enabled,catalog.data]);
  const busy=!ready||service==='checking'||(enabled&&catalog.isFetching)||refreshing;
  const error=enabled&&catalog.error?catalog.error.message:'';
  const pageParam=catalog.data?.pageParams.at(-1);const page=typeof pageParam==='number'?pageParam:0;
  const currentKey=useRef('');currentKey.current=hashKey(options.queryKey);
  const setData:Dispatch<SetStateAction<NetEaseData>>=update=>{if(online)client.setQueryData<InfiniteData<NetEaseData,number>>(options.queryKey,current=>updateMusicData(current,update));};
  useEffect(()=>{
    mounted.current=true;const restore=()=>{controller.current?.abort();controller.current=null;setRefreshing(false);setNotice('');setRoute(readNetEaseRoute());setReady(true);};restore();window.addEventListener('popstate',restore);
    if(!online){client.removeQueries({queryKey:['netease-read']});identity.current='';return()=>{mounted.current=false;controller.current?.abort();window.removeEventListener('popstate',restore);};}
    return()=>{mounted.current=false;controller.current?.abort();window.removeEventListener('popstate',restore);};
  },[client,online]);
  useEffect(()=>{const next=account.authorized?String(account.account?.id??''):'';if(next===identity.current)return;
    client.removeQueries({queryKey:musicKeys.scope(musicScope(identity.current))});identity.current=next;
    controller.current?.abort();controller.current=null;setRefreshing(false);
  },[client,account]);
  useEffect(()=>{for(const track of data.tracks??[])metadata.current.set(track.id,track);},[data]);
  const load=useCallback(()=>online?catalog.refetch():Promise.resolve(),[online,catalog.refetch]);
  const likedOptions=musicReadOptions<{ids:string[]}>(scope,{action:'liked-ids'},neteaseRequest);
  const likedQuery=useQuery({...likedOptions,enabled:ready&&online&&account.authorized});
  const liked=useMemo(()=>new Set(online?likedQuery.data?.ids??[]:[]),[online,likedQuery.data]);
  const jobsQuery=useQuery({...musicReadOptions<{jobs:NetEaseJob[]}>(scope,{action:'jobs'},neteaseRequest),enabled:ready&&online,refetchInterval:query=>online&&(route.view==='downloads'||query.state.data?.jobs.some(job=>!['completed','failed','cancelled'].includes(job.status)))?2500:false,refetchIntervalInBackground:false});
  const jobs=online?jobsQuery.data?.jobs??[]:[];
  async function refreshPodcasts(){
    if(!online||route.view!=='podcasts'||busy||controller.current)return;
    const abort=new AbortController();controller.current=abort;const key=options.queryKey;const expectedKey=hashKey(key);setRefreshing(true);setNotice('');
    try{await client.cancelQueries({queryKey:key,exact:true});const result=await neteaseRequest({action:'browse',view:'podcasts',category:route.category,page:0,refresh:true,shownIds:(data.cards??[]).map(card=>card.id)},abort.signal);if(abort.signal.aborted||!mounted.current||currentKey.current!==expectedKey)return;if(result.batchChanged!==false)client.setQueryData<InfiniteData<NetEaseData,number>>(key,{pages:[result],pageParams:[0]});setNotice(result.batchChanged===false?'当前分类暂时没有更多播客，已保留这批推荐。':result.warnings?.length?'已换一批推荐，部分来源暂时不可用。':'已换一批推荐。');}
    catch(cause){if(!abort.signal.aborted&&mounted.current&&currentKey.current===expectedKey)setNotice((cause instanceof Error?cause.message:'内容暂时不可用，请重试。')+' 当前推荐已保留。');}
    finally{if(controller.current===abort){controller.current=null;if(mounted.current)setRefreshing(false);}}
  }
  function go(view:NetEaseView,extras:{kind?:NetEaseKind;id?:string;query?:string;category?:NetEasePodcastCategory}={}){previous.current=route;const next={view,kind:extras.kind||(view==='search'?'song':'playlist'),id:extras.id||'',query:extras.query||'',category:extras.category||'all'};controller.current?.abort();controller.current=null;setRefreshing(false);setRoute(next);setNotice('');const url=new URL(location.href);url.searchParams.set('mode','netease');url.searchParams.set('view',view);for(const [key,value]of Object.entries({kind:view==='search'||view==='detail'?next.kind:'',id:next.id,q:next.query,category:['podcasts','podcast-subscriptions'].includes(view)&&next.category!=='all'?next.category:''})){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}url.hash='';history.pushState(history.state,'',url);scroll.current?.scrollTo({top:0});}
  function play(track:NetEaseTrack,tracks=data.tracks||[track]){if(!online){setNotice(neteaseServiceMessage);return;}metadata.current.set(track.id,track);queueOrigin.current=data.more&&(['liked','cloud','fm','heart'].includes(route.view)||route.view==='detail'&&['playlist','dj'].includes(route.kind))?{...route,page,more:true}:null;const queue=tracks.map(item=>({...asNetEaseAudio(item),quality:audio.quality}));audioSession.select({...asNetEaseAudio(track),quality:audio.quality},queue,true);}
  const active=audio.track?.source==='netease';const selected:NetEaseTrack|undefined=active?metadata.current.get(audio.track!.id)||{...audio.track!,artistId:'',albumId:'',coverUrl:audio.track!.coverUrl||null,duration:audio.duration}:data.tracks?.[0];
  const lyricsQuery=useQuery({...musicReadOptions<{lyrics:string|null}>(scope,{action:'lyrics',id:selected?.id??''},neteaseRequest),enabled:ready&&online&&active&&Boolean(selected),staleTime:5*60_000});
  const vinylTrack:MusicTrack|undefined=selected?{...selected,albumArtist:selected.artist,trackNumber:0,discNumber:0,format:'网易云',sampleRate:0,bitsPerSample:0,audioUrl:asNetEaseAudio(selected).audioUrl,lyrics:online?lyricsQuery.data?.lyrics||null:null}:undefined;
  const index=audio.queue.findIndex(track=>track.id===audio.track?.id);
  useEffect(()=>{
    const origin=queueOrigin.current;if(!online||!origin?.more||!active||!audio.playing||refilling.current||index<audio.queue.length-3)return;
    refilling.current=true;const identityAtStart=identity.current;const currentOrigin=origin;
    void neteaseRequest(origin.view==='detail'?{action:'detail',id:origin.id,kind:origin.kind,page:origin.page+1}:{action:'browse',view:origin.view,page:origin.page+1}).then(result=>{
      if(!mounted.current||queueOrigin.current!==currentOrigin||identity.current!==identityAtStart)return;const current=audioSession.getSnapshot();if(current.track?.source!=='netease')return;
      const added=(result.tracks||[]).filter(track=>!current.queue.some(item=>item.id===track.id));for(const track of added)metadata.current.set(track.id,track);
      origin.page++;origin.more=Boolean(result.more);audioSession.select(current.track,[...current.queue,...added.map(track=>({...asNetEaseAudio(track),quality:current.quality}))],false);
    }).catch(()=>{if(mounted.current)setNotice('后续曲目暂时无法加载，请稍后重试。');}).finally(()=>{refilling.current=false;});
  },[audio.track?.id,audio.playing,active,index,online]);
  const presentation:PlaybackPresentation={track:vinylTrack,playing:active&&audio.playing,waiting:active&&audio.waiting,time:active?audio.time:0,duration:active?audio.duration:0,volume:audio.volume,source:account.authorized?'网易云账号音源':'网易云音乐',notice:active?audio.notice:'',canPrevious:index>0||audio.repeat==='all'&&audio.queue.length>1,canNext:index>=0&&(index<audio.queue.length-1||audio.repeat==='all'||audio.shuffle&&audio.queue.length>1),onToggle:()=>active?audioSession.toggle():selected&&play(selected),onPrevious:()=>audioSession.next(-1,true),onNext:()=>audioSession.next(1,true),onSeek:audioSession.seek,onVolume:audioSession.setVolume};
  async function mutate(input:Record<string,unknown>,message:string){if(!online){setNotice(neteaseServiceMessage);return false;}const expectedIdentity=identity.current;setMutationBusy(true);setNotice('');try{await neteaseRequest(input);if(!mounted.current||identity.current!==expectedIdentity)return false;void client.invalidateQueries({queryKey:musicKeys.scope(scope),predicate:query=>query.queryKey[2]==='catalog',refetchType:'none'});if(['download','cancel-download'].includes(String(input.action)))void client.invalidateQueries({queryKey:musicKeys.read(scope,{action:'jobs'})});setNotice(message);return true;}catch(cause){if(mounted.current&&identity.current===expectedIdentity)setNotice(cause instanceof Error?cause.message:'操作未完成，请重试。');return false;}finally{if(mounted.current)setMutationBusy(false);}}
  async function toggleLike(track:NetEaseTrack){const enabled=!liked.has(track.id);if(await mutate({action:'like',id:track.id,enabled},enabled?'已加入收藏歌曲。':'已取消收藏。'))client.setQueryData(likedOptions.queryKey,current=>({ids:enabled?[...(current?.ids??[]),track.id]:(current?.ids??[]).filter(id=>id!==track.id)}));}
  const queueTracks=audio.queue.map(track=>metadata.current.get(track.id)||{...track,artistId:'',albumId:'',coverUrl:track.coverUrl||null,duration:0});
  return{audio,route,data,setData,busy,refreshing,refreshPodcasts,error,notice,setNotice,account,liked,jobs,mutationBusy,scroll,previous,go,play,presentation,selected,active,load,mutate,toggleLike,queueTracks,more:()=>{if(online&&catalog.hasNextPage&&!catalog.isFetching)void catalog.fetchNextPage({cancelRefetch:false});},openCard:(card:NetEaseCard)=>go('detail',{kind:card.kind,id:card.id})};
}
