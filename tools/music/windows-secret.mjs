import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { privateDecrypt } from 'node:crypto';

const helper = fileURLToPath(new URL('./windows-secret.ps1', import.meta.url));
export function protectBytes(bytes, mode = 'protect', purpose = 'upload') {
  const label=purpose==='netease-playback'?'网易云登录':'上传授权';
  if (process.platform !== 'win32') throw new Error(`${label}需要 Windows 当前用户加密。`);
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', helper, '-Mode', mode, '-Purpose', purpose], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', () => {});
    child.on('error', () => reject(new Error('无法打开本机加密服务。')));
    child.on('close', code => code === 0 ? resolve(Buffer.from(output.trim(), 'base64')) : reject(new Error(`无法读取当前用户的${label}。`)));
    child.stdin.end(Buffer.from(bytes).toString('base64'));
  });
}
export async function saveUploadSecret(secret, file = '.local-tools/music/upload-secret.dpapi') {
  const encrypted = await protectBytes(Buffer.from(secret));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, encrypted);
}
export async function loadUploadSecret(file = '.local-tools/music/upload-secret.dpapi') {
  const sealedFile = '.local-tools/music/upload-secret.sealed';
  try {
    const key = await protectBytes(await readFile('.local-tools/music/upload-key.dpapi'), 'unprotect');
    try { return privateDecrypt({ key, oaepHash: 'sha256' }, await readFile(sealedFile)).toString('utf8'); }
    finally { key.fill(0); }
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('无法读取当前 Windows 用户的上传授权。');
    return (await protectBytes(await readFile(file), 'unprotect')).toString('utf8');
  }
}
