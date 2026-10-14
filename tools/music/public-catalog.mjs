import {parseMusicCatalog} from '../../src/lib/music.ts';

function publicShareBase(shareUrl) {
  let share;
  try { share=new URL(shareUrl); } catch { throw Error('公开音乐分享配置无效。'); }
  if(share.origin!=='https://pan.koala-studio.org.cn'||share.username||share.password||share.search||share.hash||!/^\/s\/[A-Za-z0-9]+\/?$/.test(share.pathname))throw Error('需要配置考拉公开音乐文件夹分享链接。');
  return share.origin+'/public.php/dav/files/'+share.pathname.split('/')[2]+'/';
}

function validatePublicUrl(value,folder,base,index) {
  let url;
  try { if(typeof value!=='string'||!value)throw Error();url=new URL(value); } catch { throw Error('第 '+(index+1)+' 首曲目的公开 '+folder+' 地址无效。'); }
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port)throw Error('公开音乐地址不能含认证、查询参数或非 HTTPS 地址。');
  const prefixes=[base+folder+'/',base+'LSSH-AutoSync/'+folder+'/'];
  if(!prefixes.some(prefix=>url.href.startsWith(prefix)&&/^[A-Za-z0-9._-]+$/.test(url.href.slice(prefix.length))))throw Error('音乐地址必须来自配置分享中的 '+folder+' 目录。');
}

/** Nonempty public metadata only. Unknown/private fields are removed by the existing parser. */
export function validatePublicMusicCatalog(value,shareUrl) {
  const base=publicShareBase(shareUrl);
  const catalog=parseMusicCatalog(value);
  if(!catalog.tracks.length)throw Error('公开音乐目录不能为空。');
  // Check raw URLs as well: the parser intentionally turns invalid covers into null.
  value.tracks.forEach((track,index)=>{
    validatePublicUrl(track.audioUrl,'tracks',base,index);
    if(track.coverUrl!==null&&track.coverUrl!==undefined)validatePublicUrl(track.coverUrl,'covers',base,index);
  });
  return catalog;
}

/** Prefer a real remote catalog; a missing or valid empty response uses the committed snapshot. */
export function choosePublicMusicCatalog({remote,snapshot,shareUrl}) {
  if(remote!==null&&remote!==undefined&&parseMusicCatalog(remote).tracks.length) {
    return {catalog:validatePublicMusicCatalog(remote,shareUrl),source:'remote'};
  }
  return {catalog:validatePublicMusicCatalog(snapshot,shareUrl),source:'snapshot'};
}