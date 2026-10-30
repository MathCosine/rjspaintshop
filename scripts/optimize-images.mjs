// Builds responsive AVIF + WebP variants for every image slot on the site.
//
// Drop an original into assets/img/src/ named after its slot (hero.png,
// service-paint.jpg, ...; any of jpg/jpeg/png/webp, any capitalisation), then
// run `npm run images`. Images are written to assets/img/ as
// <slot>-<width>.avif / .webp, which index.html references. Slots with a fixed
// shape are cropped to it; product shots keep their shape (and transparency).
// Slots without a source keep whatever is already in assets/img/.
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const SRC = 'assets/img/src';
const OUT = 'assets/img';

// [aspect ratio (w/h) or null to keep the original shape, output widths].
// Keep widths in sync with index.html.
export const SLOTS = {
  'hero': [null, [960, 1440, 1920, 2560]],
  'service-collision': [null, [640, 960, 1280]],
  'service-paint': [null, [640, 960, 1280]],
  'service-dent': [null, [640, 960, 1280]],
  'about': [null, [640, 960, 1280]],
};

const FALLBACKS = {};

// Product shots: trim the empty black (or transparent) border so the object
// fills its frame.
const TRIM = new Set(['service-collision', 'service-paint', 'service-dent', 'about']);

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
  if (TRIM.has(slot)) {
    const hasAlpha = (await sharp(input).metadata()).hasAlpha;
    let img = sharp(input).rotate().trim({ threshold: 28 });
    // push a near-black studio backdrop to true black so it blends away
    if (!hasAlpha) img = img.linear(1.1, -22);
    input = (await img.png().toBuffer({ resolveWithObject: true })).data;
  }
  const meta = await sharp(input).rotate().metadata();
  const srcW = meta.autoOrient?.width ?? meta.width;
  const srcH = meta.autoOrient?.height ?? meta.height;
  // largest crop of the right shape, centred on the most interesting area
  const cropW = ratio ? Math.min(srcW, Math.round(srcH * ratio)) : srcW;
  for (const w of widths) {
    const width = Math.min(w, cropW);
    const base = ratio
      ? sharp(input).rotate().resize({ width, height: Math.round(width / ratio), fit: 'cover', position: note ? 'attention' : 'centre' })
      : sharp(input).rotate().resize({ width, withoutEnlargement: true });
    await base.clone().avif({ quality: 55, effort: 6 }).toFile(join(OUT, `${slot}-${w}.avif`));
    await base.clone().webp({ quality: 78, effort: 6 }).toFile(join(OUT, `${slot}-${w}.webp`));
  }
  console.log(`done  ${slot}${note} from ${srcW}x${srcH}`);
}
