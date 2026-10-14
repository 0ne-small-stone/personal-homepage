import {spawnSync} from 'node:child_process';
import {mkdir,copyFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const project=fileURLToPath(new URL('../../',import.meta.url));
const vendor=path.join(project,'.local-tools/music/lxserver'),runtime=path.join(project,'.local-tools/music/lx-runtime');
const commit='5e2c8cc4c823eb41ea84a1d93fe6af220157d12b';
function run(command,args,cwd){const result=spawnSync(command,args,{cwd,windowsHide:true,stdio:'inherit'});if(result.status!==0)throw new Error('兼容模块安装未完成。');}
await mkdir(runtime,{recursive:true});
if(!await stat(vendor).catch(()=>null)) {run('git',['clone','--no-checkout','https://github.com/XCQ0607/lxserver.git',vendor],project);run('git',['checkout','--detach',commit],vendor);}
const revision=spawnSync('git',['rev-parse','HEAD'],{cwd:vendor,encoding:'utf8',windowsHide:true}).stdout?.trim();
if(revision!==commit)throw new Error(`请将私有兼容仓库检出到已核对提交 ${commit}，再运行安装。`);
await copyFile(new URL('./lx-runtime-package.json',import.meta.url),path.join(runtime,'package.json'));
const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
run(process.execPath,[npm,'install','--ignore-scripts','--no-audit','--no-fund'],runtime);
await build({entryPoints:[fileURLToPath(new URL('./lx-engine-entry.mjs',import.meta.url))],outfile:path.join(runtime,'engine.cjs'),platform:'node',target:'node24',format:'cjs',bundle:true,packages:'external',nodePaths:[path.join(runtime,'node_modules')],alias:{'@renderer':path.join(vendor,'src/modules'),'@':path.join(vendor,'src')},tsconfigRaw:{compilerOptions:{target:'ES2022'}}});
console.log('本机洛雪兼容核心已准备好；上游许可证与源码保留在私有运行目录。');
