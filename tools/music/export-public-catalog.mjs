import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,extname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validatePublicMusicCatalog} from './public-catalog.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
export async function exportPublicMusicCatalog({sourcePath=resolve(project,'dist/music/catalog.json'),destinationPath=resolve(project,'src/data/music/cloud-catalog.json')}={}) {
  const source=resolve(sourcePath);
  if(extname(source)!=='.json'||source.split(/[\\/]/).includes('.local-tools')||/^(?:audio-map|netease-playback|queue)\.json$/i.test(source.split(/[\\/]/).pop()))throw Error('只能导出已验证的公开 JSON 元数据，不能读取私有运行目录。');
  if(extname(destinationPath)!=='.json')throw Error('快照输出必须为 JSON 文件。');
  const config=JSON.parse(await readFile(resolve(project,'src/config/music-cloud.json'),'utf8'));
  const catalog=validatePublicMusicCatalog(JSON.parse(await readFile(source,'utf8')),config.shareUrl);
  const text=JSON.stringify(catalog,null,2)+'\n';
  await mkdir(dirname(resolve(destinationPath)),{recursive:true});
  await writeFile(destinationPath,text,'utf8');
  return {tracks:catalog.tracks.length,albums:new Set(catalog.tracks.map(track=>JSON.stringify([track.albumArtist,track.album]))).size,sha256:createHash('sha256').update(text).digest('hex')};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options={};
    for(let index=2;index<process.argv.length;index++){
      const arg=process.argv[index];
      if(!['--source','--output'].includes(arg)||!process.argv[index+1])throw Error('仅支持 --source 和 --output JSON 路径。');
      options[arg==='--source'?'sourcePath':'destinationPath']=resolve(process.argv[++index]);
    }
    process.stdout.write(JSON.stringify(await exportPublicMusicCatalog(options))+'\n');
  } catch(error) {process.stderr.write('公开音乐快照导出失败：'+error.message+'\n');process.exitCode=1;}
}