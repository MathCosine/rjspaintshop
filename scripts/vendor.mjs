// Copies the runtime libraries and fonts from node_modules into /assets so the
// site has no third-party CDN dependencies. Run after `npm install`:
//   node scripts/vendor.mjs
import { copyFileSync, mkdirSync } from 'node:fs';

const copies = [
  ['node_modules/gsap/dist/gsap.min.js', 'assets/vendor/gsap.min.js'],
  ['node_modules/gsap/dist/ScrollTrigger.min.js', 'assets/vendor/ScrollTrigger.min.js'],
  ['node_modules/gsap/dist/SplitText.min.js', 'assets/vendor/SplitText.min.js'],
  ['node_modules/lenis/dist/lenis.min.js', 'assets/vendor/lenis.min.js'],
  ['node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2', 'assets/fonts/archivo-latin-wdth.woff2'],
  ['node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2', 'assets/fonts/ibm-plex-mono-400.woff2'],
  ['node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', 'assets/fonts/ibm-plex-mono-500.woff2'],
];

mkdirSync('assets/vendor', { recursive: true });
mkdirSync('assets/fonts', { recursive: true });
for (const [from, to] of copies) {
  copyFileSync(from, to);
  console.log(`${from} -> ${to}`);
}
