// Builds responsive AVIF + WebP variants for every image slot on the site.
//
// Drop an original into assets/img/src/ named after its slot (any of .jpg, .jpeg,
// .png, .webp), then run `npm run images`. Output lands in assets/img/ as
// <slot>-<width>.avif / .webp, which is what index.html references.
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = 'assets/img/src';
const OUT = 'assets/img';

// Keep these widths in sync with the srcset attributes in index.html.
export const SLOTS = {
  'hero': [960, 1440, 1920, 2560],
  'hero-mobile': [640, 960, 1280],
  'service-collision': [640, 960, 1280],
  'service-paint': [640, 960, 1280],
  'service-tesla': [640, 960, 1280],
  'service-dent': [640, 960, 1280],
  'about': [640, 960, 1280],
  'texture': [1280, 1920, 2560],
  'cta': [1280, 1920, 2560],
};

const EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

mkdirSync(OUT, { recursive: true });

for (const [slot, widths] of Object.entries(SLOTS)) {
  const ext = EXTS.find((e) => existsSync(join(SRC, slot + e)));
  if (!ext) {
    console.warn(`skip  ${slot} (no source in ${SRC})`);
    continue;
  }
  const input = join(SRC, slot + ext);
  for (const w of widths) {
    const base = sharp(input).rotate().resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 55, effort: 6 }).toFile(join(OUT, `${slot}-${w}.avif`));
    await base.clone().webp({ quality: 78, effort: 6 }).toFile(join(OUT, `${slot}-${w}.webp`));
  }
  console.log(`done  ${slot} (${widths.join(', ')})`);
}
