import QRCode from 'qrcode/lib/core/qrcode.js';
import {PNG} from 'pngjs';

/** PNG stays in memory; no canvas, filesystem output, external QR service or URL leak. */
export function qrImage(key) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{8,512}$/.test(key)) throw Error('Invalid QR key');
  const code = QRCode.create(`https://music.163.com/login?codekey=${encodeURIComponent(key)}`, {errorCorrectionLevel: 'M'});
  const scale = 4, margin = 4, size = (code.modules.size + margin * 2) * scale;
  const data = Buffer.alloc(size * size * 4, 255);
  for (let y = 0; y < code.modules.size; y++) for (let x = 0; x < code.modules.size; x++) {
    if (!code.modules.get(y, x)) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const index = (((y + margin) * scale + dy) * size + (x + margin) * scale + dx) * 4;
      data[index] = data[index + 1] = data[index + 2] = 16;
    }
  }
  return 'data:image/png;base64,' + PNG.sync.write({width: size, height: size, data}, {deflateLevel: 1, filterType: 0}).toString('base64');
}
