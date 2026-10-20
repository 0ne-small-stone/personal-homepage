import {readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validatePublicMusicCatalog} from '../music/public-catalog.mjs';

const project=fileURLToPath(new URL('../../',import.meta.url));
export async function checkPublicMusicCatalogFiles({catalogPath=resolve(project,'dist/music/catalog.json'),configPath=resolve(project,'src/config/music-cloud.json')}={}) {
  const raw=JSON.parse(await readFile(catalogPath,'utf8'));
  const config=JSON.parse(await readFile(configPath,'utf8'));
  const catalog=validatePublicMusicCatalog(raw,config.shareUrl);
  const topFields=new Set(Object.keys(catalog));
  const trackFields=new Set(catalog.tracks.flatMap(track=>Object.keys(track)));
  // A build artifact must itself be clean; normalization alone must not mask leaked fields.
  if(Object.keys(raw).some(key=>!topFields.has(key))||raw.tracks.some(track=>Object.keys(track).some(key=>!trackFields.has(key))))throw Error('静态音乐目录包含未允许发布的字段。');
  for (const track of raw.tracks) if (track.lyricsUrl != null) {
    if (!/^\/personal-homepage\/music\/lyrics\/[a-f0-9]{24}\.json$/.test(track.lyricsUrl)) throw Error('歌词资源地址无效。');
    const asset=JSON.parse(await readFile(resolve(dirname(catalogPath),'lyrics',track.lyricsUrl.split('/').pop()),'utf8'));
    if(typeof asset.text!=='string'||!asset.text||asset.text.length>65536)throw Error('歌词资源缺失或无效。');
  }
  const htmlPath=resolve(dirname(catalogPath),'index.html');
  if(await access(htmlPath).then(()=>true,()=>false)) {
    const {JSDOM,VirtualConsole}=await import('jsdom');
    const dom=new JSDOM(await readFile(htmlPath,'utf8'),{virtualConsole:new VirtualConsole()});
    try {
      const props=[...dom.window.document.querySelectorAll('astro-island[props]')].map(e=>JSON.parse(e.getAttribute('props'))).find(p=>p.initialCatalog);
      const ids=props?.initialCatalog?.[1]?.tracks?.[1]?.map(row=>row[1].id[1]);
      if(JSON.stringify(ids)!==JSON.stringify(catalog.tracks.map(t=>t.id)))throw Error('音乐首屏和静态目录并非同一份曲目快照。');
    } finally {dom.window.close();}
  }
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
