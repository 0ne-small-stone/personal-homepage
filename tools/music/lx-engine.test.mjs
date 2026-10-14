import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
test('source worker permission envelope denies outside reads, writes and subprocesses',()=>{
  const worker=fileURLToPath(new URL('./lx-permission-fixture.mjs',import.meta.url));
  const result=spawnSync(process.execPath,['--permission',`--allow-fs-read=${worker}`,worker,path.resolve('README.md'),path.resolve('.local-tools/music/permission-test-output')],{encoding:'utf8',windowsHide:true,env:{SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR}});
  assert.equal(result.status,0);assert.deepEqual(JSON.parse(result.stdout),{readOutside:'ERR_ACCESS_DENIED',write:'ERR_ACCESS_DENIED',spawn:'ERR_ACCESS_DENIED'});
});
