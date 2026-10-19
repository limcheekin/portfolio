// Writes a .webp next to every PNG under public/images that pages render through Img.astro (project
// screenshots and the profile photo). PNGs stay as they are for og:image, JSON-LD and agents.
// Run after adding or replacing an image: npm run images
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const DIR = 'public/images';
// Not rendered on pages: the social card and the logo.
const SKIP = new Set(['portfolio.png', 'logo.png']);
// Widest rendering in CSS px × 2. The profile photo shows at most 384px wide.
const MAX_WIDTH: Record<string, number> = { 'profile.png': 768 };

for (const name of readdirSync(DIR)) {
  if (!name.endsWith('.png') || SKIP.has(name)) continue;
  const src = join(DIR, name);
  const out = src.replace(/\.png$/, '.webp');
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) continue;
  const width = MAX_WIDTH[name];
  const info = await sharp(src)
    .resize(width ? { width, withoutEnlargement: true } : undefined)
    .webp({ quality: 82 })
    .toFile(out);
  console.log(`${out}: ${(statSync(src).size / 1024).toFixed(0)} KB -> ${(info.size / 1024).toFixed(0)} KB`);
}
