# RJ's Paint Shop: rjspaintshop.com

A one-page marketing site for RJ's Paint Shop in Pleasanton, CA. It's plain static HTML, CSS and JavaScript with no framework and no build step on deploy. It runs on **GitHub Pages** for now and can move to **Vercel** later, where one serverless function emails estimate requests with photos.

## What's in here

```
index.html                  the landing page (all copy lives here)
privacy-policy.html         → /privacy-policy
accessibility-statement.html→ /accessibility-statement
assets/css/main.css         all styles (colors and type at the top in :root)
assets/js/main.js           scroll animations, menu, estimate form, gauges, FAQ
assets/js/car3d.js          the interactive 3D car (built from src/car3d.js)
src/car3d.js                3D car source: lofted body, panels, materials, camera
assets/vendor/              GSAP (+ ScrollTrigger, SplitText, DrawSVG, MotionPath), Lenis
assets/fonts/               Archivo (variable width) + IBM Plex Mono (self-hosted)
assets/img/src/             original images, one per slot (see ASSETS.md)
assets/img/                 generated AVIF/WebP sizes, referenced by index.html
api/estimate.js             POST /api/estimate → emails the shop via Resend
og.html → og-image.jpg      link-preview image (1200×630)
vercel.json                 clean URLs, caching and security headers
```

Motion runs on [GSAP](https://gsap.com) (free for commercial use) and [Lenis](https://lenis.darkroom.engineering) smooth scrolling. The 3D car is drawn with [three.js](https://threejs.org) and only loads when you scroll near it. Everything respects the visitor's **reduced-motion** setting, and the page stays fully readable if JavaScript fails.

All links and asset paths are relative, so the same files work at `https://mathcosine.github.io/rjspaintshop/` and at `https://rjspaintshop.com/`.

## Preview locally

```bash
npm install
npm run dev          # http://localhost:4173
```

The estimate form needs the Vercel function, so locally it will show the "please call us" fallback message when submitted.

To change the 3D car, edit `src/car3d.js` and run `npm run build:car`.

## Common edits

- **Text, reviews, hours:** edit `index.html`. Each section is marked with a `<!-- ==== NAME ==== -->` comment. If the hours change, also update the `openingHoursSpecification` block near the top of the file (Google reads it) and `initOpenStatus()` in `assets/js/main.js` (the "Open now" badge).
- **Images:** see [ASSETS.md](ASSETS.md). Drop a file into `assets/img/src/` using the slot name, run `npm run images`, and commit.
- **Colors and fonts:** the `:root` block at the top of `assets/css/main.css`.
- **After updating GSAP or Lenis:** run `node scripts/vendor.mjs` to copy the new files into `assets/`.

## Publishing on GitHub Pages (free, for now)

1. On GitHub, open the repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose the branch the site is on (currently `claude/amazing-planck-7m4ao3`, the repository's default) and the **/ (root)** folder, then **Save**.
3. After a minute the site is live at **https://mathcosine.github.io/rjspaintshop/**. Every push to that branch republishes it.

GitHub Pages can't run server code, so there the estimate form opens the visitor's email app with their details filled in, addressed to **rj@rjspaintshop.com** (photos are attached in the email app). The page also nudges people to call, since that's fastest. To change the address, edit `data-email="rj@rjspaintshop.com"` on the `<form>` in `index.html`.

You can point `rjspaintshop.com` at GitHub Pages too (Settings → Pages → Custom domain), but the photo-upload form only works on Vercel.

## Going live on Vercel

1. **Import the repo.** Sign in at [vercel.com](https://vercel.com) with GitHub, choose **Add New → Project**, and import `MathCosine/rjspaintshop`. Set Framework Preset to **Other**, leave the build command empty, and deploy. You get a preview URL immediately. Every branch push gets its own preview URL, and the default branch is production.
2. **Connect the domain.** In the project, open **Settings → Domains** and add `rjspaintshop.com` and `www.rjspaintshop.com`. Vercel shows the exact DNS records to create.
3. **Update DNS at GoDaddy.** The current site runs on GoDaddy's Airo builder. In GoDaddy, open **My Products → rjspaintshop.com → DNS** and replace the website records (`@` A record, `www` CNAME) with the values Vercel shows. Remove any GoDaddy website forwarding. **Leave the MX and email-related TXT records alone**, or `info@rjspaintshop.com` will stop receiving mail.
4. After the new site is live, you can cancel the GoDaddy **website/Airo** plan. **Keep the domain registration.**

## Estimate form email (Resend, free tier)

The form sends name, phone, email, vehicle, insurance answer, description and up to 5 photos (compressed in the browser) to `/api/estimate`, which emails them to the shop with the photos attached.

1. Create a free account at [resend.com](https://resend.com).
2. **Domains → Add Domain → `rjspaintshop.com`.** Add the DNS records it lists in GoDaddy. They go on a `send.` subdomain, so they don't interfere with existing email.
3. **API Keys → Create** a key with sending access.
4. In Vercel under **Settings → Environment Variables**, add:
   - `RESEND_API_KEY` = the key
   - `ESTIMATE_FROM_EMAIL` = `RJ's Paint Shop <estimates@rjspaintshop.com>`
   - `ESTIMATE_TO_EMAIL` = where requests go (defaults to `rj@rjspaintshop.com`)
5. Redeploy, then send a test request from the live site.

Before the domain is verified, Resend only delivers to your own Resend account address. To test during that window, set `ESTIMATE_TO_EMAIL` to that address. If the key is missing or sending fails, the form tells the visitor to call (925) 730-4911 instead.

## Optional: analytics

Vercel Web Analytics is cookie-free, so the site still needs no cookie banner. Turn it on under **Project → Analytics**, then add this line before `</body>` in `index.html`:

```html
<script defer src="/_vercel/insights/script.js"></script>
```
