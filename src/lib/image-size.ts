import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Intrinsic size of an image referenced from content, for explicit `<img>` width/height. Build time only.
 * Supports PNG files under `public/` (read from the header).
 */
export function imageSize(src: string): { width: number; height: number } {
  if (src.startsWith('/') && src.endsWith('.png')) {
    const png = readFileSync(join(process.cwd(), 'public', src));
    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  }
  throw new Error(`imageSize: unsupported image "${src}"`);
}
