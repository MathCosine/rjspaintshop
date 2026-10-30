# Image prompts

Nine photo spots on the site still show dark **IMAGE PENDING** placeholders. Everything else (the paint-layer stack, gauges, badges, the "How it works" route) is drawn in code and needs no images.

## How to make them

1. Paste one prompt below into your image tool (ChatGPT, Midjourney, Gemini, etc.). Each prompt already includes the shared style, so you can copy it as-is.
2. Pick the shape it lists. If your tool only offers portrait, landscape or square, choose **portrait** for the portrait spots and **landscape** for the rest. The site crops to the exact shape automatically.
3. Generate 4 or more options and keep the most believable one. Check wheels, door handles, mirrors and reflections, and reject anything with text, badges or warped panels.
4. Save it with the file name shown (for example `hero.png`). Any of .jpg, .png or .webp is fine, at the largest size your tool offers.

## How to get them onto the site

- **Easiest:** on GitHub, open the repository, go to the `assets/img/src` folder, then choose **Add file → Upload files**. Drag the images in and click **Commit changes**. Then tell me and I'll build them into the site.
- **Or** attach them in our chat. If they don't come through as files, use GitHub instead.

(If you're doing it yourself: `npm run images`, then commit `assets/img/`.)

## The prompts

### 1. `hero`: landscape (main image at the top of the page)

> A silver Tesla Model Y parked inside a dark, spotless automotive paint booth, three-quarter front view from a low angle. The car sits in the center of the frame with plenty of empty dark space around it. Long horizontal ceiling light bars reflect as clean white lines across the hood and doors. The floor is faintly reflective and the rest of the booth fades to black. Photorealistic editorial automotive photograph, full-frame camera, 50mm lens, moody low-key lighting, deep blacks, cool neutral color, realistic reflections, subtle film grain. No text, no logos, no badges, no license plates, no watermark.

### 2. `hero-mobile`: portrait (optional; otherwise it's cut from `hero`)

> The same silver Tesla Model Y in the same dark paint booth, front three-quarter view, with the car filling the lower half of a vertical frame and dark empty space above it. Photorealistic editorial automotive photograph, full-frame camera, 50mm lens, moody low-key lighting, deep blacks, cool neutral color, realistic reflections, subtle film grain. No text, no logos, no badges, no license plates, no watermark.

### 3. `service-collision`: portrait (Services: Collision Repair)

> Close-up of the front corner of a dark grey luxury sedan in the middle of a collision repair in a clean, dimly lit body shop. The bumper cover has been removed, showing bare metal brackets and a grey-primed fender. A frame-measuring arm and tools sit softly out of focus behind it. Photorealistic editorial automotive photograph, full-frame camera, 50mm lens, moody low-key lighting, deep blacks, cool neutral color, realistic reflections, subtle film grain. No text, no logos, no badges, no license plates, no watermark, no people.

### 4. `service-paint`: portrait (Services: Auto Paint & Refinishing)

> Inside a professional downdraft paint booth, a spray gun rests on a stand in front of a freshly painted, mirror-glossy car door panel. A fine mist of clear coat hangs in the booth light, and the background falls off into darkness. Photorealistic editorial automotive photograph, full-frame camera, 50mm lens, moody low-key lighting, deep blacks, cool neutral color, realistic reflections, subtle film grain. No text, no logos, no badges, no watermark, no people.

### 5. `service-tesla`: portrait (Services: Tesla Specialist Repair)

> Detail of a white Tesla Model 3's front fender and headlight in a clean repair bay lit by soft overhead light panels. Part of the panel is precisely masked off with blue tape and masking paper, ready to be refinished. Photorealistic editorial automotive photograph, full-frame camera, 50mm lens, calm even lighting with deep shadows, cool neutral color, realistic reflections, subtle film grain. No text, no logos, no badges, no license plates, no watermark, no people.

### 6. `service-dent`: portrait (Services: Dent & Scratch Removal)

> Macro photograph of a glossy black car door. The striped reflection of a paintless-dent-repair light board bends around a small dent in the panel. Very shallow depth of field, dark surroundings. Photorealistic editorial automotive photograph, moody low-key lighting, deep blacks, realistic reflections, subtle film grain. No text, no logos, no badges, no watermark, no people.

### 7. `about`: portrait (Our Story)

> A fan deck of automotive paint color swatches resting on the hood of a silver car beside a small sprayed test card, under a daylight color-matching lamp. A clean body shop is softly blurred in the background. Photorealistic editorial automotive photograph, full-frame camera, 50mm lens, moody lighting, deep blacks, cool neutral color, realistic reflections, subtle film grain. No text, no logos, no brand names, no watermark, no people.

### 8. `texture`: landscape (band behind "Every car that leaves our shop…")

> Extreme macro of deep red metallic car paint: tiny metal flakes sparkle beneath a glossy clear coat as one soft highlight rolls across a curved panel. Most of the frame is dark. Photorealistic macro photograph, moody low-key lighting, deep blacks, subtle film grain. No text, no logos, no watermark.

### 9. `cta`: landscape (band behind "Ready to get your vehicle back to perfect?")

> Rear three-quarter view of a sleek dark grey sports coupe in a black studio. The taillights glow softly and a thin line of light traces the roofline. The car sits in the right half of the frame, and the left half is empty and dark. Photorealistic editorial automotive photograph, full-frame camera, 50mm lens, moody low-key lighting, deep blacks, cool neutral color, realistic reflections, subtle film grain. No text, no logos, no badges, no license plates, no watermark.

## Also useful

- **Logo, high resolution.** The current logo is only 150 × 54 px, so it looks soft on phones. The original file is ideal: SVG, AI, EPS or PDF, or a PNG at least 1500 px wide with a transparent background. Please don't AI-upscale it, because that changes the lettering.
- **Keep it honest.** These images set the mood. Don't present them as photos of the shop or of real customer repairs, and don't generate before/after shots.
