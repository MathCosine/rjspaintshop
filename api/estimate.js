// Vercel serverless function: POST /api/estimate
//
// Emails an estimate request (with the customer's photos attached) to the shop
// using Resend (https://resend.com). Configure in Vercel → Project → Settings →
// Environment Variables:
//
//   RESEND_API_KEY       required  API key from resend.com
//   ESTIMATE_TO_EMAIL    optional  where requests go (default: info@rjspaintshop.com)
//   ESTIMATE_FROM_EMAIL  optional  verified sender, e.g. "RJ's Paint Shop <estimates@rjspaintshop.com>"
//                                  (default: Resend's shared test sender, which can only
//                                  deliver to the email address on your Resend account)

const MAX_PHOTOS = 5;
const MAX_PHOTO_BASE64 = 2_000_000; // ~1.5 MB per photo after client-side compression
const LIMITS = { name: 100, phone: 40, email: 200, vehicle: 120, insurance: 20, message: 3000 };

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : null;
  if (!body) return res.status(400).json({ error: 'invalid_body' });

  // Honeypot: real visitors never fill this in.
  if (body.company) return res.status(200).json({ ok: true });

  const data = {};
  for (const [key, max] of Object.entries(LIMITS)) data[key] = clean(body[key], max);

  if (!data.name || !data.phone || !data.vehicle) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const rawPhotos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  const attachments = [];
  for (const [i, p] of rawPhotos.entries()) {
    if (!p || typeof p.data !== 'string' || p.data.length > MAX_PHOTO_BASE64) continue;
    if (!/^[A-Za-z0-9+/]+=*$/.test(p.data)) continue;
    attachments.push({ filename: `photo-${i + 1}.jpg`, content: p.data });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('estimate: RESEND_API_KEY is not set');
    return res.status(503).json({ error: 'not_configured' });
  }

  const to = process.env.ESTIMATE_TO_EMAIL || 'info@rjspaintshop.com';
  const from = process.env.ESTIMATE_FROM_EMAIL || "RJ's Paint Shop Website <onboarding@resend.dev>";

  const rows = [
    ['Name', data.name],
    ['Phone', data.phone],
    ['Email', data.email || '—'],
    ['Vehicle', data.vehicle],
    ['Insurance claim', data.insurance || '—'],
    ['Photos', String(attachments.length)],
  ];

  const text = [
    'New estimate request from rjspaintshop.com',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'What happened:',
    data.message || '—',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#111">
      <h2 style="margin:0 0 16px">New estimate request</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        ${rows
          .map(([k, v]) => `<tr><td style="color:#666;padding-right:16px">${k}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
          .join('')}
      </table>
      <h3 style="margin:24px 0 8px">What happened</h3>
      <p style="white-space:pre-wrap;margin:0">${escapeHtml(data.message || '—')}</p>
      <p style="margin-top:24px;color:#666">Tap to call back: <a href="tel:${escapeHtml(data.phone.replace(/[^\d+]/g, ''))}">${escapeHtml(data.phone)}</a></p>
    </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Estimate request: ${data.name}, ${data.vehicle}`,
        text,
        html,
        ...(data.email ? { reply_to: data.email } : {}),
        ...(attachments.length ? { attachments } : {}),
      }),
    });
    if (!r.ok) {
      console.error('estimate: resend error', r.status, await r.text());
      return res.status(502).json({ error: 'send_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('estimate: request failed', err);
    return res.status(502).json({ error: 'send_failed' });
  }
}
