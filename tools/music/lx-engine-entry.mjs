// Bundle only upstream search and sandbox APIs; never start upstream's public server.
import musicSdk from '../../.local-tools/music/lxserver/src/modules/utils/musicSdk/index.js';
import {loadUserApi,callUserApiGetMusicUrl} from '../../.local-tools/music/lxserver/src/server/userApi.ts';
export async function initialize(info) {
  const result=await loadUserApi({...info,owner:'lssh',enabled:true,allowUnsafeVM:false,sources:{}});
  if(!result.success)throw new Error('SOURCE_INIT_FAILED');
  return result.apiInstance.info.sources;
}
export async function search(source,keyword,page=1) {return musicSdk[source].musicSearch.search(keyword,page,20);}
export async function resolveUrl(source,song,quality) {return callUserApiGetMusicUrl(source,song,quality,'lssh',undefined,false);}
