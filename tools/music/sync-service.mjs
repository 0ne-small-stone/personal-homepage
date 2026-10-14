import { spawn } from 'node:child_process';
import { appendFile, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const folder = path.join(root, '.local-tools/music');
const lockFile = path.join(folder, 'sync-service.pid');
await mkdir(folder, { recursive: true });
try { await writeFile(lockFile, String(process.pid), { flag: 'wx' }); }
catch (error) {
  if (error.code !== 'EEXIST') throw error;
  let alive = false;
  try { const pid = Number(await readFile(lockFile, 'utf8'));if (Number.isSafeInteger(pid) && pid > 0) { process.kill(pid, 0);alive = true; } } catch {}
  if (alive) process.exit(0);
  await unlink(lockFile);
  await writeFile(lockFile, String(process.pid), { flag: 'wx' });
}

let stopped = false;
const children = new Set();
const timers = new Set();
const log = message => appendFile(path.join(folder, 'sync-service.log'), `${new Date().toISOString()} ${message}\n`).catch(() => {});
function worker(script, args) {
  if (stopped) return;
  const child = spawn(process.execPath, [path.join(root, 'tools/music', script), ...args], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  children.add(child);
  // Child messages are intentionally replaced with bounded status, never raw exceptions/URLs.
  child.stdout.on('data', data => {
    let summary = '状态已更新';
    try {
      const state = JSON.parse(data.toString().trim());
      if (['indexed', 'verified', 'pending'].every(key => Number.isSafeInteger(state[key]) && state[key] >= 0)) summary = `索引${state.indexed}，云端已核验${state.verified}，待上传${state.pending}`;
    } catch {}
    log(`${script}: ${summary}`);
  });
  child.stderr.on('data', () => { log(`${script}: 暂时不可用，将重试`); });
  child.on('error', () => { log(`${script}: 启动失败`); });
  child.on('exit', () => {
    children.delete(child);
    if (!stopped) {
      const timer = setTimeout(() => { timers.delete(timer);worker(script, args); }, 60000);
      timers.add(timer);
    }
  });
}
async function stop() {
  stopped = true;
  for (const timer of timers) clearTimeout(timer);
  for (const child of children) child.kill();
  await unlink(lockFile).catch(() => {});
}
process.on('SIGINT', () => { stop(); });
process.on('SIGTERM', () => { stop(); });
worker('index-library.mjs', ['--auto-lx', '--watch']);
worker('cloud-sync.mjs', ['--upload', '--watch']);
await log('音乐自动同步服务已启动');
