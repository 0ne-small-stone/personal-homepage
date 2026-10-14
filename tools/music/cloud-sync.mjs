import { readCloudConfig, syncCloudLibrary } from './cloud-library.mjs';
import { createUploader } from './cloud-upload.mjs';

const watch = process.argv.includes('--watch');
let stopped = false, previous = '', timer;
process.on('SIGINT', () => { stopped = true;clearTimeout(timer); });
process.on('SIGTERM', () => { stopped = true;clearTimeout(timer); });
let uploader;
try { if (process.argv.includes('--upload')) uploader = await createUploader(await readCloudConfig()); }
catch { console.error('音乐上传授权无法读取，请重新配置本机专用上传入口。');process.exit(1); }
do {
  try {
    const result = await syncCloudLibrary({ uploader });
    const message = JSON.stringify(result);
    if (message !== previous) { console.log(message);previous = message; }
  } catch { console.error('云盘目录暂时未能更新，稍后重试；没有改动洛雪原始音频。');if (!watch) process.exitCode = 1; }
  if (!watch || stopped) break;
  await new Promise(resolve => { timer = setTimeout(resolve, 60000); });
} while (!stopped);
