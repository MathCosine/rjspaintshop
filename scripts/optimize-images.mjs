// Builds responsive AVIF + WebP variants for every image slot on the site.
//
// Drop an original into assets/img/src/ named after its slot (hero.png,
// service-paint.jpg, ...; any of jpg/jpeg/png/webp, any capitalisation), then
// run `npm run images`. Each image is cropped to its slot's shape and written
// to assets/img/ as <slot>-<width>.avif / .webp, which index.html references.
// Slots without a source keep whatever is already in assets/img/.
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const SRC = 'assets/img/src';
const OUT = 'assets/img';

// [aspect ratio (w/h), output widths]. Keep widths in sync with index.html.
export const SLOTS = {
  'hero': [3 / 2, [960, 1440, 1920, 2560]],
  'hero-mobile': [4 / 5, [640, 960, 1280]],
  'service-collision': [4 / 5, [640, 960, 1280]],
  'service-paint': [4 / 5, [640, 960, 1280]],
  'service-tesla': [4 / 5, [640, 960, 1280]],
  'service-dent': [4 / 5, [640, 960, 1280]],
  'about': [4 / 5, [640, 960, 1280]],
  'texture': [16 / 9, [1280, 1920, 2560]],
  'cta': [16 / 9, [1280, 1920, 2560]],
};

// If there's no phone-shaped hero, cut one from the main hero.
const FALLBACKS = { 'hero-mobile': 'hero' };

const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

mkdirSync(OUT, { recursive: true });
const files = existsSync(SRC) ? readdirSync(SRC) : [];
const sourceFor = (slot) => {
  const f = files.find((name) => EXTS.has(extname(name).toLowerCase()) && name.slice(0, -extname(name).length).toLowerCase() === slot);
  return f ? join(SRC, f) : null;
};

for (const [slot, [ratio, widths]] of Object.entries(SLOTS)) {
  let input = sourceFor(slot);
  let note = '';
  if (!input && FALLBACKS[slot] && sourceFor(FALLBACKS[slot])) {
    input = sourceFor(FALLBACKS[slot]);
    note = ` (cropped from ${FALLBACKS[slot]})`;
  }
  if (!input) {
    console.log(`keep  ${slot} (no source in ${SRC})`);
    continue;
  }
  const meta = await sharp(input).rotate().metadata();
  const srcW = meta.autoOrient?.width ?? meta.width;
  const srcH = meta.autoOrient?.height ?? meta.height;
  // largest crop of the right shape, centred on the most interesting area
  const cropW = Math.min(srcW, Math.round(srcH * ratio));
  for (const w of widths) {
    const width = Math.min(w, cropW);
    const height = Math.round(width / ratio);
    const base = sharp(input)
      .rotate()
      .resize({ width, height, fit: 'cover', position: note ? 'attention' : 'centre' });
    await base.clone().avif({ quality: 55, effort: 6 }).toFile(join(OUT, `${slot}-${w}.avif`));
    await base.clone().webp({ quality: 78, effort: 6 }).toFile(join(OUT, `${slot}-${w}.webp`));
  }
  console.log(`done  ${slot}${note} from ${srcW}x${srcH}`);
}
