/**
 * Baut die neun Belege-Grafiken fuer den FB-Plan.
 *
 * Ein Raster fuer alle: Goldstrich + Eyebrow oben, Inhalt in der Mitte,
 * Trennlinie, zweisprachige Fusszeile, Wortmarke rechts unten. Vier
 * Inhaltsvarianten (stat / single / steps / list), damit neun Posts nicht
 * neunmal gleich aussehen, der Feed aber trotzdem als Reihe erkennbar ist.
 *
 * Schrift: Avenir Next (auf macOS vorhanden). Die Markenschrift Manrope ist
 * hier nicht installiert — wer sie installiert, aendert nur die Konstante F.
 */

const CARDS = [
  { slug:'numbers-november', kind:'stat', eyebrow:'THAIHELPER TODAY',
    big:'1,100+', bigSub:'helper profiles across Thailand',
    stats:[['70+','cities'],['222','open jobs'],['0','commission']],
    foot:'Free for families and for helpers', footTh:'ฟรีทั้งฝ่ายครอบครัวและฝ่ายผู้ช่วย' },

  { slug:'how-messaging-works', kind:'steps', eyebrow:'HOW CONTACT WORKS',
    steps:[['01','Browse the profiles'],['02','Write to the one that fits'],['03','Agree the terms between you']],
    foot:'No fee to see a phone number', footTh:'ไม่มีค่าธรรมเนียมในการดูเบอร์โทร' },

  { slug:'app-available', kind:'single', eyebrow:'ON YOUR PHONE',
    big:'iOS + Android', bigSize:112, bigSub:'New messages arrive as a notification,<br/>not as an unread email',
    foot:'www.thaihelper.app/app', footTh:'มีแอปทั้ง iPhone และ Android' },

  { slug:'directory', kind:'list', eyebrow:'THE DIRECTORY',
    head:'Not every family wants to hire directly.',
    items:['Agencies','Cleaning companies','Legal specialists'],
    foot:'Listed with their own prices', footTh:'พร้อมราคาและช่องทางติดต่อ' },

  { slug:'phuket', kind:'single', eyebrow:'PHUKET',
    big:'71', bigSub:'helper profiles on the island today',
    tags:['Housekeepers','Nannies','Cooks','Drivers','Gardeners'],
    foot:'www.thaihelper.app/hire/phuket', footTh:'โปรไฟล์ผู้ช่วยในภูเก็ต' },

  { slug:'holidays', kind:'single', eyebrow:'THANK YOU',
    big:'64', bigSub:'households told us they found<br/>someone here in 2026',
    foot:'To every helper and family who tried something new', footTh:'ขอบคุณทุกท่านที่ให้โอกาสแพลตฟอร์มใหม่ในปี 2026' },

  { slug:'year-review', kind:'stat', eyebrow:'2026 IN NUMBERS',
    big:'April', bigSize:150, bigSub:'the month ThaiHelper went live',
    stats:[['1,100+','helpers'],['3,900','conversations'],['222','open jobs']],
    foot:'Still free on both sides', footTh:'ยังคงใช้งานฟรีทั้งสองฝ่าย' },

  { slug:'safety', kind:'list', eyebrow:'SAFETY',
    head:'Two things nobody here will ever<br/>ask of you.',
    items:['Paying to apply for a job','Sending ID before you have met'],
    foot:'Something feels wrong? support@thaihelper.app', footTh:'ไม่ต้องจ่ายเงินเพื่อสมัครงาน' },

  { slug:'how-it-works', kind:'single', eyebrow:'WHAT DOES IT COST',
    big:'0 ฿', bigSub:'to register, browse, message and hire',
    foot:'No commission on anyone’s salary', footTh:'ไม่มีการหักค่าคอมมิชชั่นจากเงินเดือน' },
];


import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

import { fileURLToPath } from 'url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT  = path.join(REPO, 'public/fb-2026-11');
fs.mkdirSync(OUT, { recursive: true });

const W = 1080, H = 1080;
const F = 'Avenir Next, Avenir, Helvetica Neue, sans-serif';
const esc = s => String(s).replace(/&(?!amp;|#)/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Avenir laeuft bei ~0.52em je Zeichen. Reicht als Schaetzung, um Text
// innerhalb der Satzbreite (88..992) zu halten — resvg kann nicht messen.
function wrap(text, size, maxW = 904) {
  const max = Math.floor(maxW / (size * 0.52));
  const out = [];
  for (const chunk of String(text).split('<br/>')) {
    let line = '';
    for (const w of chunk.split(' ')) {
      if (line && (line + ' ' + w).length > max) { out.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) out.push(line);
  }
  return out;
}

// <br/> im bigSub als zwei tspan-Zeilen.
function multiline(text, x, y, size, fill, lh = 1.3) {
  return wrap(text, size).map((line, i) =>
    `<text x="${x}" y="${y + i * size * lh}" font-family="${F}" font-size="${size}" font-weight="400" fill="${fill}">${esc(line)}</text>`
  ).join('');
}

function body(c) {
  const WHITE = '#ffffff', SOFT = '#bfe3dd';
  if (c.kind === 'stat') {
    const bs = c.bigSize || 196;
    return `
    <text x="88" y="430" font-family="${F}" font-size="${bs}" font-weight="700" fill="${WHITE}" letter-spacing="-5">${esc(c.big)}</text>
    ${multiline(c.bigSub, 88, 492, 42, SOFT)}
    <line x1="88" y1="576" x2="992" y2="576" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
    ${c.stats.map(([n, l], i) => {
      const x = 88 + i * 332;
      return `<text x="${x}" y="684" font-family="${F}" font-size="88" font-weight="700" fill="${WHITE}" letter-spacing="-2">${esc(n)}</text>
              <text x="${x}" y="730" font-family="${F}" font-size="32" font-weight="400" fill="${SOFT}">${esc(l)}</text>`;
    }).join('')}`;
  }
  if (c.kind === 'single') {
    const bs = c.bigSize || 206;
    const tags = c.tags ? `<text x="88" y="700" font-family="${F}" font-size="32" font-weight="400" fill="${SOFT}">${esc(c.tags.join('  ·  '))}</text>` : '';
    return `
    <text x="88" y="452" font-family="${F}" font-size="${bs}" font-weight="700" fill="${WHITE}" letter-spacing="-5">${esc(c.big)}</text>
    ${multiline(c.bigSub, 88, 530, 42, SOFT)}
    ${tags}`;
  }
  if (c.kind === 'steps') {
    return c.steps.map(([n, t], i) => {
      const y = 400 + i * 136;
      return `<text x="88" y="${y}" font-family="${F}" font-size="44" font-weight="700" fill="#F4A261" letter-spacing="1">${esc(n)}</text>
              <text x="190" y="${y}" font-family="${F}" font-size="52" font-weight="500" fill="${WHITE}">${esc(t)}</text>`;
    }).join('');
  }
  // list
  const head = wrap(c.head, 52);
  let y = 372;
  const headSvg = head.map((l, i) => `<text x="88" y="${y + i * 68}" font-family="${F}" font-size="52" font-weight="500" fill="${WHITE}">${esc(l)}</text>`).join('');
  y += head.length * 68 + 46;
  const itemsSvg = c.items.map((t) => {
    const lines = wrap(t, 46, 820);
    const svg = `<circle cx="100" cy="${y - 16}" r="7" fill="#F4A261"/>` +
      lines.map((l, j) => `<text x="138" y="${y + j * 58}" font-family="${F}" font-size="46" font-weight="400" fill="${SOFT}">${esc(l)}</text>`).join('');
    y += lines.length * 58 + 46;
    return svg;
  }).join('');
  return headSvg + itemsSvg;
}

const wordmarkSrc = fs.readFileSync(path.join(REPO, 'public/press/thaihelper-wordmark-white-2400.png'));
const wm = await sharp(wordmarkSrc).resize({ width: 300 }).toBuffer();
const wmH = (await sharp(wm).metadata()).height;

for (const c of CARDS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00756c"/><stop offset="60%" stop-color="#00584f"/><stop offset="100%" stop-color="#1b3a4b"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect x="88" y="150" width="86" height="7" rx="3.5" fill="#F4A261"/>
    <text x="88" y="232" font-family="${F}" font-size="34" font-weight="500" fill="#F4A261" letter-spacing="3.5">${esc(c.eyebrow)}</text>
    ${body(c)}
    <line x1="88" y1="830" x2="992" y2="830" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
    <text x="88" y="906" font-family="${F}" font-size="30" font-weight="400" fill="#8fc4bc">${esc(c.foot)}</text>
    <text x="88" y="952" font-family="${F}" font-size="30" font-weight="400" fill="#8fc4bc">${esc(c.footTh)}</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .composite([{ input: wm, left: W - 300 - 88, top: 150 - Math.round(wmH / 2) + 4 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `${c.slug}.png`));
  console.log('✓', c.slug + '.png');
}
