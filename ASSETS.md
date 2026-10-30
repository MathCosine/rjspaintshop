# Image prompts

The site uses just **5 images**, and all of them are in. Everything else (the paint-layer stack, gauges, badges, the red metallic band, the "How it works" route) is drawn in code.

| File | Status | Used for |
|------|--------|----------|
| `hero` | ✅ done (your Model Y) | Top of the page, the Tesla service tile, and the closing banner |
| `service-collision` | ✅ done | Services: Collision Repair |
| `service-paint` | ✅ done | Services: Auto Paint & Refinishing |
| `service-dent` | ✅ done | Services: Dent & Scratch Removal |
| `about` | ✅ done | Our Story |

The four product shots are **single objects on a plain black background**, which AI tools do very reliably. Because there's no shop scenery in them, nobody will mistake them for photos of the real shop. The site places each one on its own dark "studio" panel.

## How to make (or replace) them

1. Paste a prompt into your image tool (ChatGPT, Gemini, Midjourney, etc.) and choose **square**.
2. If your tool has a **transparent background** option, turn it on. Otherwise the black background in the prompt works just as well.
3. Generate a few and keep the cleanest one, with no text, no logos, and nothing warped.
4. Save it with the file name shown, as .png, .jpg or .webp.

## How to get them onto the site

On GitHub, open the repository, go to **`assets/img/src`**, then choose **Add file → Upload files**. Drag the images in with the names above and click **Commit changes**, then tell me. (If you upload with other names, just tell me which is which.)

## The prompts

### `service-collision`: square

> A single white Tesla Model Y front bumper cover, removed from the car and standing upright at a three-quarter angle, with a crack and scuffed paint on one corner. Isolated product photograph on a pure black seamless background, soft studio light from above, crisp realistic detail, gentle reflections, soft shadow underneath. No text, no logos, no watermark, no people.

### `service-paint`: square

> A professional silver HVLP automotive spray paint gun with a clear paint cup on top, seen from the side at a slight three-quarter angle, with a faint mist of clear coat drifting from the nozzle. Isolated product photograph on a pure black seamless background, soft studio light from above, crisp realistic detail, gentle reflections. No text, no logos, no brand names, no watermark, no hands, no people.

### `service-dent`: square

> A professional dual-action car polisher with a red foam polishing pad, lying at a three-quarter angle. Isolated product photograph on a pure black seamless background, soft studio light from above, crisp realistic detail, gentle reflections, soft shadow underneath. No text, no logos, no brand names, no watermark, no hands, no people.

### `about`: square

> A fan deck of automotive paint color swatch cards spread open in a half circle, showing silver, white, black, deep blue and red metallic paint chips. Isolated product photograph on a pure black seamless background, soft studio light from above, crisp realistic detail, subtle metallic sparkle on the chips. No text, no numbers, no logos, no watermark, no hands, no people.

## Optional

- **A sharper hero.** Yours is 1024 px wide, which is fine but a little soft on big screens. If your tool can upscale it (to about 2000 px wide), upload the bigger version as `hero.png`. If you'd rather drop the studio background entirely, use this prompt:

  > A silver Tesla Model Y, three-quarter front view from a low angle, isolated on a pure black seamless background. Long overhead studio light bars reflect as clean white lines across the hood and doors, with a soft reflection on a glossy black floor. Photorealistic product photograph, crisp detail. No text, no logos, no badges, no license plate, no watermark. Wide landscape.

- **Logo, high resolution.** The current logo is only 150 × 54 px. The original file is ideal (SVG, AI, EPS or PDF, or a PNG at least 1500 px wide with a transparent background). Please don't AI-upscale it, because that changes the lettering.
