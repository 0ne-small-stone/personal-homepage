import type {NetEaseData, NetEaseKind, NetEaseTrack, NetEaseView} from './netease-core';

export type NetEaseServiceState = 'checking' | 'ready' | 'unavailable';
export const neteaseServiceMessage = '在线音乐服务尚未接通。每日推荐、账号和站内播放需要音乐服务，你可以在网易云继续收听 Echoes 共享歌单。';
type Snapshot = {id:string;name:string;coverUrl:string;fetchedAt:string;tracks:Array<{id:string;title:string;artist:string;album:string;coverUrl:string;duration:number}>};
type SnapshotRoute = {view:NetEaseView;kind:NetEaseKind;id:string;query:string};
const normalize = (value:string) => value.normalize('NFKC').toLocaleLowerCase().trim();

/** Shared metadata is a snapshot, never personal recommendations or playback authority. */
export function sharedPlaylistData(snapshot:Snapshot, route:SnapshotRoute):NetEaseData {
  const card = {id:snapshot.id,title:snapshot.name,subtitle:`共享歌单 · ${snapshot.tracks.length} 首`,coverUrl:snapshot.coverUrl,kind:'playlist' as const,count:snapshot.tracks.length};
  const tracks:NetEaseTrack[] = snapshot.tracks.map(track => ({...track,artistId:'',albumId:''}));
  if (route.view === 'home' || route.view === 'playlists') return {title:'共享歌单',cards:[card],more:false};
  if (route.view === 'detail' && route.kind === 'playlist' && route.id === snapshot.id) return {id:snapshot.id,kind:'playlist',title:snapshot.name,subtitle:'共享歌单快照',description:`歌单信息保存于 ${snapshot.fetchedAt.slice(0,10)}`,coverUrl:snapshot.coverUrl,tracks,total:tracks.length,more:false};
  if (route.view === 'search') {
    const query = normalize(route.query);
    if (!query) return {};
    if (route.kind === 'song') {
      const matches = tracks.filter(track => normalize(`${track.title} ${track.artist} ${track.album}`).includes(query));
      return {title:'搜索共享歌单',tracks:matches,total:matches.length,more:false};
    }
    if (route.kind === 'playlist') return {cards:normalize(snapshot.name).includes(query)?[card]:[],more:false};
  }
  return {warnings:[neteaseServiceMessage],more:false};
}
