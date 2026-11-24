/**
 * Draws the app icon (the ring mark) as PNG files for phones' home screens, with no extra packages.
 * Called by scripts/build-site.ts.
 */
import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const DEEP = [0x7c, 0x3a, 0xed];
const CHALK = [0xff, 0xff, 0xff];
const ACCENT = [0xcb, 0xb8, 0xff];

/** The color of one point of the icon, on a 0–1 square. `safe` shrinks the mark for Android's round masks. */
function colorAt(x: number, y: number, safe: number) {
  const dx = (x - 0.5) / safe;
  const dy = (y - 0.5) / safe;
  const d = Math.hypot(dx, dy);
  if (d <= 0.094) return ACCENT;
  if (Math.abs(d - 0.297) <= 0.047) return CHALK;
  return DEEP;
}

function png(size: number, safe: number) {
  const samples = 4; // 4×4 samples per pixel, for smooth edges.
  const rows = Buffer.alloc((size * 3 + 1) * size);
  for (let py = 0; py < size; py++) {
    const row = py * (size * 3 + 1);
    rows[row] = 0;
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const color = colorAt((px + (sx + 0.5) / samples) / size, (py + (sy + 0.5) / samples) / size, safe);
          for (let i = 0; i < 3; i++) sum[i]! += color[i]!;
        }
      }
      for (let i = 0; i < 3; i++) rows[row + 1 + px * 3 + i] = Math.round(sum[i]! / (samples * samples));
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const check = Buffer.alloc(4);
    check.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([length, body, check]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 bits per channel
  header[9] = 2; // RGB
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}

export function writeIcons(folder: string) {
  writeFileSync(`${folder}/icon-192.png`, png(192, 1));
  writeFileSync(`${folder}/icon-512.png`, png(512, 1));
  writeFileSync(`${folder}/icon-maskable-512.png`, png(512, 0.8));
  writeFileSync(`${folder}/apple-touch-icon.png`, png(180, 0.92));
}
