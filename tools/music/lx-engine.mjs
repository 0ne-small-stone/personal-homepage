import {fork} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const project=fileURLToPath(new URL('../../',import.meta.url));
const approvedHash='6e7d5ee30c1d3bd4d8b3cfbfa40c16693e1edc6582159c830187e63435837795';
export async function currentLxSettings() {
  const folder=path.join(process.env.APPDATA||'','lx-music-desktop/LxDatas');
  const config=JSON.parse(await readFile(path.join(folder,'config_v2.json'),'utf8'));
  return {folder,sourceId:config.setting['common.apiSource'],directory:config.setting['download.savePath']};
}
export function createLxEngine() {
  let child, ready, sequence=0;const pending=new Map();
  function call(action,data={}) {
    return new Promise((resolve,reject)=>{
      const id=++sequence;
      const timer=setTimeout(()=>{pending.delete(id);reject(new Error('音源请求超时，请稍后重试。'));child?.kill();ready=undefined;},45000);
      pending.set(id,{resolve,reject,timer});child.send({id,action,...data});
    });
  }
  async function initialize() {
    const settings=await currentLxSettings();
    const entries=JSON.parse(await readFile(path.join(settings.folder,'user_api.json'),'utf8'));
    const selected=entries.userApis.find(item=>item.id===settings.sourceId);
    if(!selected)throw new Error('洛雪还没有选择音源。');
    const script=selected.script.startsWith('gz_')?inflateSync(Buffer.from(selected.script.slice(3),'base64'),{maxOutputLength:2*1024*1024}).toString('utf8'):selected.script;
    if(createHash('sha256').update(script).digest('hex')!==approvedHash)throw new Error('当前洛雪音源已改变，需要重新核对并授权。');
    const runtime=path.join(project,'.local-tools/music/lx-runtime');
    const worker=fileURLToPath(new URL('./lx-worker.mjs',import.meta.url));
    child=fork(worker,[],{cwd:runtime,windowsHide:true,stdio:['ignore','ignore','ignore','ipc'],execArgv:['--permission',`--allow-fs-read=${runtime}`,`--allow-fs-read=${worker}`],env:{SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR,NODE_ENV:'production',LX_RUNTIME:runtime,DATA_PATH:path.join(runtime,'data')}});
    child.on('message',message=>{const request=pending.get(message.id);if(!request)return;clearTimeout(request.timer);pending.delete(message.id);message.error?request.reject(new Error(message.error)):request.resolve(message.result);});
    child.on('exit',()=>{ready=undefined;for(const request of pending.values()){clearTimeout(request.timer);request.reject(new Error('音源进程已停止，请重试。'));}pending.clear();});
    child.on('error',()=>{});
    return call('initialize',{info:{id:selected.id,name:'当前洛雪音源',script,version:selected.version}});
  }
  const ensure=()=>ready||(ready=initialize().catch(error=>{ready=undefined;throw error;}));
  return {status:ensure,search:async(source,keyword,page=1)=>{await ensure();return call('search',{source,keyword,page});},resolve:async(source,song,quality)=>{await ensure();return call('resolve',{source,song,quality});},dispose:()=>{child?.kill();}};
}
