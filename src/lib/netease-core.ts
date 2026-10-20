import {musicApiFetch} from './music-api.ts';
export type NetEaseView='home'|'search'|'discover'|'charts'|'new-albums'|'radio'|'daily'|'heart'|'fm'|'liked'|'playlists'|'albums'|'artists'|'podcasts'|'podcast-subscriptions'|'cloud'|'downloads'|'history'|'detail';
export type NetEasePodcastCategory='all'|'knowledge'|'humanities'|'interviews';
export const neteasePodcastCategories:Record<NetEasePodcastCategory,string>={all:'全部',knowledge:'知识',humanities:'人文',interviews:'访谈'};
export type NetEaseKind='song'|'playlist'|'album'|'artist'|'dj';
export interface NetEaseTrack {id:string;title:string;artist:string;artistId:string;album:string;albumId:string;coverUrl:string|null;duration:number;programId?:string;radioId?:string;}
export interface NetEaseCard {id:string;title:string;subtitle:string;coverUrl:string|null;kind:NetEaseKind;count:number;ownerId?:string;description?:string;category?:string;discoveryCategory?:string;}
export interface NetEaseData {title?:string;subtitle?:string;description?:string;coverUrl?:string|null;id?:string;kind?:NetEaseKind;ownerId?:string;subscribed?:boolean;tracks?:NetEaseTrack[];cards?:NetEaseCard[];popular?:NetEaseCard[];charts?:NetEaseCard[];more?:boolean;total?:number;warnings?:string[];batchChanged?:boolean;}
export interface NetEaseJob {id:string;title:string;artist:string;quality:string;status:string;received:number;total:number;error:string;trackId:string;}
export interface NetEaseAccountState {authorized:boolean;restoring?:boolean;account:{id:string;nickname:string;avatarUrl:string|null}|null;}
export const neteaseViewTitles:Record<NetEaseView,string>={home:'主页',search:'搜索',discover:'新发现',charts:'排行榜','new-albums':'新碟上架',radio:'广播',daily:'每日推荐',heart:'心动模式',fm:'私人漫游',liked:'收藏歌曲',playlists:'收藏歌单',albums:'收藏专辑',artists:'收藏歌手',podcasts:'订阅播客','podcast-subscriptions':'订阅播客',cloud:'音乐云盘',downloads:'下载',history:'最近播放',detail:'音乐详情'};
export async function neteaseRequest<T=NetEaseData>(input:Record<string,unknown>,signal?:AbortSignal):Promise<T>{
  let response:Response;
  try{response=await musicApiFetch(`${import.meta.env.BASE_URL}api/music/netease`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000)});}
  catch(cause){if(signal?.aborted)throw cause;if(cause instanceof Error&&cause.name==='TimeoutError')throw Error('网易云请求超时，请稍后重试。');if(cause instanceof TypeError)throw Error('本机音乐服务未连接，请启动音乐服务后重试。');throw cause;}
  if(response.status===404)throw Error('网易云曲库服务尚未连接，请稍后重试。');
  const data=await response.json();if(!response.ok)throw Error(data.error||'网易云暂时不可用，请重试。');return data;
}
export function readNetEaseRoute(){const url=new URL(location.href);const value=url.searchParams.get('view')||'home';const view=(Object.hasOwn(neteaseViewTitles,value)?value:'home') as NetEaseView;const kind=url.searchParams.get('kind')||(view==='search'?'song':'playlist');return{view,kind:(['song','playlist','album','artist','dj'].includes(kind)?kind:'playlist') as NetEaseKind,id:url.searchParams.get('id')||'',query:url.searchParams.get('q')||'',category:(Object.hasOwn(neteasePodcastCategories,url.searchParams.get('category')||'')?url.searchParams.get('category'):'all') as NetEasePodcastCategory};}
