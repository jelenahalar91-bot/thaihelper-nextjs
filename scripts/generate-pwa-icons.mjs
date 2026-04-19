import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#ffffff"/>
  <text x="256" y="370" text-anchor="middle" font-family="Manrope,Arial Black,sans-serif" font-weight="800" font-size="320" letter-spacing="-10">
    <tspan fill="#1a1a1a">T</tspan><tspan fill="#006a62">H</tspan>
  </text>
</svg>`;

// Maskable: content must stay in center 80% (safe zone). Scale text down + teal background.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#006a62"/>
  <text x="256" y="320" text-anchor="middle" font-family="Manrope,Arial Black,sans-serif" font-weight="800" font-size="220" letter-spacing="-6">
    <tspan fill="#ffffff">TH</tspan>
  </text>
</svg>`;

async function build() {
  await sharp(Buffer.from(baseSvg))
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'));

  await sharp(Buffer.from(baseSvg))
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'));

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-maskable-512.png'));

  console.log('Generated: icon-192.png, icon-512.png, icon-maskable-512.png');
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
