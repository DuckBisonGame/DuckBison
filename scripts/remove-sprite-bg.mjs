/**
 * remove-sprite-bg.mjs
 * BFS flood-fill from all 4 corners to remove any background color
 * (white, light-blue water, gray, etc.) and make it transparent.
 */
import sharp from 'sharp';
import path  from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function removeBg(relPath, tolerance = 40) {
  const filePath = path.resolve(__dirname, relPath);
  const { data, info } = await sharp(filePath)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;   // channels = 4

  const idx  = (x, y) => (y * width + x) * channels;
  const dist = (i, r, g, b) => {
    const dr = data[i]   - r;
    const dg = data[i+1] - g;
    const db = data[i+2] - b;
    return Math.sqrt(dr*dr + dg*dg + db*db);
  };

  const flagged = new Uint8Array(width * height);

  function floodFill(sx, sy) {
    const si = idx(sx, sy);
    const sr = data[si], sg = data[si+1], sb = data[si+2];
    // Skip if this corner is already transparent
    if (data[si+3] === 0) return;

    const visited = new Uint8Array(width * height);
    const queue   = [[sx, sy]];
    visited[sy * width + sx] = 1;

    while (queue.length > 0) {
      const [x, y] = queue.pop();
      flagged[y * width + x] = 1;

      for (const [nx, ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (visited[ny * width + nx]) continue;
        visited[ny * width + nx] = 1;
        const pi = idx(nx, ny);
        if (data[pi+3] === 0 || dist(pi, sr, sg, sb) <= tolerance) {
          queue.push([nx, ny]);
        }
      }
    }
  }

  // Flood-fill from all 4 corners
  floodFill(0,         0);
  floodFill(width - 1, 0);
  floodFill(0,         height - 1);
  floodFill(width - 1, height - 1);

  // Also nuke any isolated near-white pixels the flood may have missed
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    if (data[o] >= 230 && data[o+1] >= 230 && data[o+2] >= 230) flagged[i] = 1;
  }

  // Apply transparency
  for (let i = 0; i < width * height; i++) {
    if (flagged[i]) data[i * channels + 3] = 0;
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(filePath);
  console.log(`✓ ${path.basename(filePath)}`);
}

// Flying: white background
await removeBg('../src/assets/mallory-flying.png', 38);
// Swimming: may have blue/light water texture as background
await removeBg('../src/assets/mallory-on-water-swimming.png', 45);
console.log('Done.');
