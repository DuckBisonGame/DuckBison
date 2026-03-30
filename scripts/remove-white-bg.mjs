/**
 * remove-white-bg.mjs
 * Removes white (and near-white) backgrounds from PNG sprites,
 * replacing them with full transparency.
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FILES = [
  '../src/assets/mallory-walk.png',
  '../src/assets/mallory-flying.png',
  '../src/assets/mallory-on-water-swimming.png',
  '../src/assets/mallory-underwater-swimming.png',
];

// Threshold: pixels with R, G, B all above this value are treated as white
const WHITE_THRESHOLD = 240;

async function removeWhiteBg(relPath) {
  const filePath = path.resolve(__dirname, relPath);
  const { data, info } = await sharp(filePath)
    .ensureAlpha()           // make sure we have an alpha channel
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = data;
  const { width, height, channels } = info; // channels = 4 (RGBA)

  for (let i = 0; i < width * height; i++) {
    const offset = i * channels;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      pixels[offset + 3] = 0; // set alpha to transparent
    }
  }

  await sharp(pixels, { raw: { width, height, channels } })
    .png()
    .toFile(filePath);

  console.log(`✓ ${path.basename(filePath)}`);
}

for (const f of FILES) {
  await removeWhiteBg(f);
}
console.log('Done — white backgrounds removed.');
