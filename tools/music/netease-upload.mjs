import {musicId,song} from './netease-core.mjs';

// A published cloud file must be read back before its upload is acknowledged.
export async function verifyCloudUpload(account,result,{name,size}) {
  if(![200,201].includes(Number(result?.code)))throw Error('上传尚未确认。');
  const id=musicId(result?.privateCloud?.songId);
  const detail=await account.request('user_cloud_detail',{id},true);
  const row=detail.data?.find(item=>String(item.songId)===id);
  if(!row||row.fileName!==name||Number(row.fileSize)!==size)throw Error('云盘文件尚未核验。');
  return song(row);
}
