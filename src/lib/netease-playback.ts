import type { AudioTrack } from './audio-session';

export interface PlaybackResolution { url: string; expiresAt?: number; previewSeconds: number | null; notice: string; quality?:string; }
export interface PlaybackIndex { version: 1; updatedAt: string; tracks: Array<{ id: string; status: 'full' | 'preview' | 'unavailable'; audioUrl: string | null; expiresAt: string; previewSeconds: number | null;quality?:string }> }
export function readPlaybackResolution(data: unknown, id: string, now = Date.now()): PlaybackResolution {
  if (!data || typeof data !== 'object' || (data as PlaybackIndex).version !== 1 || !Array.isArray((data as PlaybackIndex).tracks)) throw Error('播放服务返回了无效数据，请稍后重试。');
  const track = (data as PlaybackIndex).tracks.find(item => item && item.id === id);
  if (!track) throw Error('这首歌的播放地址尚未更新，请稍后重试或在网易云打开。');
  if (track.status === 'unavailable' || !track.audioUrl) throw Error('网易云未提供这首歌的可用音频，请在网易云打开。');
  const expiresAt = Date.parse(track.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) throw Error('这首歌的播放地址已过期，请稍后重试。');
  let url: URL;
  try { url = new URL(track.audioUrl); } catch { throw Error('播放地址无效，请在网易云打开。'); }
  if (url.protocol !== 'https:' || !/^m\d{1,4}\.music\.126\.net$/.test(url.hostname) || url.username || url.password || url.port) throw Error('播放地址无效，请在网易云打开。');
  if (!['full','preview'].includes(track.status)) throw Error('播放权限无效，请在网易云打开。');
  const previewSeconds = track.status === 'preview' ? track.previewSeconds : null;
  if (track.status === 'preview' && (previewSeconds === null || !Number.isFinite(previewSeconds) || previewSeconds <= 0 || previewSeconds > 120)) throw Error('试听信息无效，请在网易云打开。');
  return { url: url.href, expiresAt, previewSeconds, notice: previewSeconds ? `网易云提供 ${Math.round(previewSeconds)} 秒试听，完整收听请在网易云打开。` : '',...(track.quality?{quality:track.quality}:{}) };
}
export async function resolveNetEasePlayback(track: AudioTrack, options: { indexUrl?: string; apiUrl?: string; fetcher?: typeof fetch } = {}): Promise<PlaybackResolution> {
  const env=import.meta.env||{BASE_URL:'/'};const fetcher=options.fetcher||fetch;
  const request=async(url: string, init: RequestInit={})=>{
    try{return await fetcher(url,{...init,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});}
    catch{throw Error('暂时无法连接网易云播放服务，请重新播放。');}
  };
  const read=async(response: Response)=>{
    let data: unknown;try{data=await response.json();}catch{throw Error('播放服务返回了无效数据，请稍后重试。');}
    return readPlaybackResolution(data,track.id);
  };
  // Account service receives only the selected track ID. Credentials never
  // enter this document, the static index, or browser storage.
  if(!options.indexUrl&&!env.PUBLIC_NETEASE_PLAYBACK_INDEX){
    const response=await request(options.apiUrl||`${env.BASE_URL}api/music/playback/resolve`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:track.id,...(track.quality?{quality:track.quality}:{})})});
    if(response.status!==404&&response.status!==405){
      if(response.status===401)throw Error('网易云登录已失效，请重新扫码。');
      if(!response.ok)throw Error('网易云播放服务暂时不可用，请稍后重试。');
      return read(response);
    }
  }
  const response=await request(options.indexUrl||env.PUBLIC_NETEASE_PLAYBACK_INDEX||`${env.BASE_URL}music/netease-playback.json`);
  // The official outer link can return an HTML page. Missing service is not
  // proof that the track has no licensed audio, and must not load that page.
  if (response.status === 404) throw Error('网易云播放服务尚未接通，请稍后重试或在网易云打开。');
  if (!response.ok) throw Error('网易云播放服务暂时不可用，请稍后重试。');
  return read(response);
}
