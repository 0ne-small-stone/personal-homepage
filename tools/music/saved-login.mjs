import {readFile,mkdir,writeFile,rename,unlink} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {protectBytes} from './windows-secret.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
export function createSavedLoginStore({file=resolve(project,'.local-tools/music/netease-login.dpapi'),crypt=protectBytes}={}) {
  async function load() {
    let sealed;
    try{sealed=await readFile(file);}catch(error){if(error.code==='ENOENT')return null;throw Error('无法读取本机保存的网易云登录。');}
    let plain;
    try{
      plain=await crypt(sealed,'unprotect','netease-playback');const data=JSON.parse(plain.toString('utf8'));
      if(data.version!==1||typeof data.cookie!=='string'||!data.cookie||data.cookie.length>65536)throw Error();
      return data.cookie;
    }catch{throw Error('本机保存的网易云登录无法读取，请重新登录。');}
    finally{plain?.fill(0);}
  }
  async function save(cookie) {
    if(typeof cookie!=='string'||!cookie||cookie.length>65536)throw Error('网易云登录凭证无效。');
    const plain=Buffer.from(JSON.stringify({version:1,cookie}));let sealed;
    try{sealed=await crypt(plain,'protect','netease-playback');}catch{throw Error('登录尚未保存，请重试保存。');}finally{plain.fill(0);}
    const temporary=file+'.tmp-'+randomUUID();
    try{await mkdir(dirname(file),{recursive:true});await writeFile(temporary,sealed,{mode:0o600});await rename(temporary,file);}
    catch{throw Error('登录尚未保存，请重试保存。');}
    finally{await unlink(temporary).catch(()=>{});}
  }
  async function clear() {
    try{await unlink(file);}catch(error){if(error.code!=='ENOENT')throw Error('保存的登录未能删除，请重试退出。');}
  }
  return {load,save,clear};
}
