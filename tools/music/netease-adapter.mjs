import {createPlaybackAccount} from './playback-account.mjs';
import {musicId,song as songDto} from './netease-core.mjs';
const playlistId = '18476425375';
const ownerId = '13615478042';
export function createNetEaseAdapter({account=createPlaybackAccount()}={}) {
  const authorized=()=>account.state().authorized&&String(account.state().account?.id)===ownerId;
  async function ownerRequest(method,input) {
    await account.ready();await account.prepare?.();
    if(!authorized()){const error=Error('请使用拥有 Echoes 歌单的账号授权。');error.auth=true;throw error;}
    return account.request(method,input,true);
  }
  return {
    authorized,
    account: () => authorized()?{nickname:account.state().account.nickname,userId:ownerId}:null,
    song: async id => {
      id=musicId(id);const body=await account.request('song_detail',{ids:id});const track=body.songs?.find(track=>String(track.id)===id);
      if (!track) throw Error('没有找到这首网易云歌曲。');
      const item=songDto(track);return{id:item.id,title:item.title,artist:item.artist,album:item.album,coverUrl:item.coverUrl||'',duration:item.duration};
    },
    playlistIds: async () => {
      const body=await ownerRequest('playlist_detail',{id:playlistId});
      if(String(body.playlist?.id)!==playlistId||String(body.playlist?.creator?.userId)!==ownerId)throw Error('目标歌单身份核对失败');
      return(body.playlist.trackIds||[]).map(track=>musicId(track.id));
    },
    addSong: async id => {await ownerRequest('playlist_tracks',{op:'add',pid:playlistId,tracks:musicId(id)});},
    createQr: () => account.createQr(),
    checkQr: async () => {
      const result=await account.checkQr();
      if(result.code===803&&!authorized())throw Error('请使用拥有 Echoes 歌单的账号授权。');
      return result;
    },
    logout: () => account.logout(),
  };
}
