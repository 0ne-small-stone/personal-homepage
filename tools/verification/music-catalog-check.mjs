import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validatePublicMusicCatalog} from '../music/public-catalog.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
export async function checkPublicMusicCatalogFiles({catalogPath=resolve(project,'dist/music/catalog.json'),configPath=resolve(project,'src/config/music-cloud.json')}={}) {
  const raw=JSON.parse(await readFile(catalogPath,'utf8'));
  const config=JSON.parse(await readFile(configPath,'utf8'));
  const catalog=validatePublicMusicCatalog(raw,config.shareUrl);
  const topFields=new Set(Object.keys(catalog));
  const trackFields=new Set(Object.keys(catalog.tracks[0]));
  // A build artifact must itself be clean; normalization alone must not mask leaked fields.
  if(Object.keys(raw).some(key=>!topFields.has(key))||raw.tracks.some(track=>Object.keys(track).some(key=>!trackFields.has(key))))throw Error('静态音乐目录包含未允许发布的字段。');
  return {tracks:catalog.tracks.length,albums:new Set(catalog.tracks.map(track=>JSON.stringify([track.albumArtist,track.album]))).size};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options={};
    for(let index=2;index<process.argv.length;index++){
      const arg=process.argv[index];
      if(!['--catalog','--config'].includes(arg)||!process.argv[index+1])throw Error('仅支持 --catalog 和 --config JSON 路径。');
      options[arg==='--catalog'?'catalogPath':'configPath']=resolve(process.argv[++index]);
    }
    const result=await checkPublicMusicCatalogFiles(options);
    process.stdout.write('公开音乐目录检查通过：'+result.tracks+' 首 / '+result.albums+' 张专辑。\n');
  } catch(error) {process.stderr.write('公开音乐目录检查失败：'+error.message+'\n');process.exitCode=1;}
}