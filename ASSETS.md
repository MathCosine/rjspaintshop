# Image brief

The 3D car section, gauges, badges and "How it works" route are all drawn in code, so they need no images.

The rest of the site currently shows dark placeholders marked **IMAGE PENDING**. Each one maps to a file below. Generate the images, then drop them into `assets/img/src/` with the exact file name (or send them over), and run `npm run images`.

## The goal: real photo shoot, not CGI

Every image should look like it came from one professional shoot in a dark, clean body shop. The things that give AI images away are perfect plastic reflections, garbled badges and text, extra or melted details (wheels, mirrors, door handles, fingers), and oversaturated HDR color. A few rules:

- **Generate 4–8 variations per slot** and pick the one with believable reflections, panel gaps, wheels and mirrors.
- **No text, logos, badges or license plates** anywhere. Generators garble them, and it keeps us clear of trademarks.
- **Avoid faces.** Only include hands or people if they look flawless.
- **Keep the grading consistent:** deep blacks, cool-neutral light, and a touch of film grain across the whole set.
- **Don't generate "before/after" shots or pictures presented as "our shop" or "our work".** These images set the mood. Using them as proof of real repairs would mislead customers.

### Style line (add to the end of every prompt)

> Editorial automotive photograph, full-frame camera, 50mm lens, natural color, low-key lighting from long overhead LED light bars, deep blacks, soft light falloff, realistic reflections, subtle film grain, slight real-world imperfections. Moody, restrained, premium. No text, no logos, no badges, no license plates, no watermark.

### Negative prompt (if your tool supports one)

> CGI, 3D render, illustration, cartoon, HDR, oversaturated, neon, lens flare, plastic, text, logo, badge, watermark, license plate, extra wheels, warped body panels, deformed hands

## Slots

| # | File name | Min. size | Shape | Where it appears |
|---|-----------|-----------|-------|------------------|
| 1 | `hero.jpg` | 3000 × 2000 | 3:2 landscape | Big hero image (desktop/tablet) |
| 2 | `hero-mobile.jpg` | 1600 × 2000 | 4:5 portrait | Hero image on phones |
| 3 | `service-collision.jpg` | 1600 × 2000 | 4:5 portrait | Services: Collision Repair |
| 4 | `service-paint.jpg` | 1600 × 2000 | 4:5 portrait | Services: Auto Paint & Refinishing |
| 5 | `service-tesla.jpg` | 1600 × 2000 | 4:5 portrait | Services: Tesla Specialist Repair |
| 6 | `service-dent.jpg` | 1600 × 2000 | 4:5 portrait | Services: Dent & Scratch Removal |
| 7 | `about.jpg` | 1600 × 2000 | 4:5 portrait | Our Story |
| 8 | `texture.jpg` | 2560 × 1440 | 16:9 landscape | Full-width band behind "Every car… no exceptions." |
| 9 | `cta.jpg` | 2560 × 1440 | 16:9 landscape | Full-width band behind "Ready to get your vehicle back to perfect?" |

### 1. `hero.jpg`: the signature shot
> A Tesla Model Y in Stealth Grey (or Pearl White) parked in a dark, spotless automotive paint booth. Three-quarter front view from a low angle. The car is centered with generous empty space on all sides. Long horizontal ceiling light bars reflect as clean white lines along the bodywork, the floor is faintly reflective, and the rest of the booth falls off into black.

The site crops this to roughly 16:9 on desktop and opens it to full-screen width as you scroll, so **keep the car in the middle 60% of the frame**.

### 2. `hero-mobile.jpg`
> The same car and booth, front three-quarter view, filling the lower-middle of a portrait frame with dark empty space above.

Use the same seed or reference image as #1 so the two match.

### 3. `service-collision.jpg`
> Close-up of the front corner of a dark grey luxury sedan on a collision-repair frame bench in a dim, clean workshop. The bumper cover is removed, bare metal and grey primer patches show on the fender, a measuring arm is attached, and tools sit softly out of focus behind.

### 4. `service-paint.jpg`
> Inside a paint booth, a spray gun on a stand in front of a freshly sprayed, mirror-glossy car door panel. Fine clear-coat mist hangs in the booth light against a dark background.

If you want a person instead: *a painter in a white paint suit, hood and full respirator (face fully covered) spraying clear coat, slight motion blur on the mist.* Check the hands carefully.

### 5. `service-tesla.jpg`
> Detail of a Tesla Model 3 front fender and headlight in a clean, bright repair bay. Part of the aluminum panel is masked with blue masking tape and paper for refinishing. Calm, clinical light, and no badges visible.

### 6. `service-dent.jpg`
> Macro of a glossy black car door. A striped reflection from a paintless-dent-repair light board reveals a small dent as a ripple in the reflected lines. Shallow depth of field, dark surroundings.

### 7. `about.jpg`
> A fan deck of automotive paint color swatches resting on a silver car hood beside a small sprayed test card, under a daylight color-matching lamp, with the workshop softly blurred behind.

### 8. `texture.jpg`
> Extreme macro of deep red metallic automotive paint. Metal flake sparkles under the clear coat, and a single soft highlight rolls across a curved panel. Most of the frame is dark.

Text sits on top of this image, so keep it dark and calm.

### 9. `cta.jpg`
> Rear three-quarter view of a sleek dark sports coupe (no badges) in a black studio. Taillights glow softly and a thin line of light traces the roofline. The car sits in the right half of the frame, and the left half is empty and dark.

The headline and call button go on the left.

## Optional extras

- **`hero.mp4`**: a 6–8 second seamless loop of a light bar slowly sweeping across the car in the booth, generated in an AI video tool (1920 × 1080, H.264, no audio, under 8 MB). It would play in the hero, with `hero.jpg` as the fallback.
- **Logo, high resolution.** The current logo is only 150 × 54 px, so it looks soft on phones and retina screens. Please send the original: SVG, AI, EPS or PDF, or a PNG at least 1500 px wide with a transparent background. **Don't AI-upscale the logo.** It changes the lettering.

## After you add images

```bash
npm install        # once
npm run images     # builds AVIF + WebP sizes into assets/img/
```

Then commit `assets/img/`. If the hero changes, the link-preview image `og-image.jpg` should be regenerated from `og.html`.
