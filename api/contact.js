/*
 * POST /api/contact — emails a form submission through the SMTP account set in Vercel's
 * environment variables. Used by the contact page form and the "free audit" form on every page.
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   SMTP_HOST    mail server, e.g. the cPanel server's hostname
 *   SMTP_PORT    465 (SSL, default) or 587 (STARTTLS)
 *   SMTP_USER    full mailbox address, e.g. hello@aiworxllc.com
 *   SMTP_PASS    that mailbox's password
 *   MAIL_TO      where submissions go (optional, defaults to SMTP_USER; comma-separate several)
 *   MAIL_FROM    sender address (optional, defaults to SMTP_USER; most servers require it to match)
 */
const nodemailer = require('nodemailer');

const LIMITS = { name: 120, email: 200, company: 160, website: 300, budget: 60, message: 5000, services: 300, form: 40, page: 300 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* light per-instance throttle: 5 submissions per IP per 10 minutes */
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
const oneLine = (v) => v.replace(/[\r\n]+/g, ' ');
const esc = (v) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 50000) throw new Error('too large');
  }
  return JSON.parse(raw || '{}');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  /* only accept posts from this site's own pages */
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return res.status(403).json({ ok: false, error: 'Forbidden' });
    } catch {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }

  /* honeypot: bots fill the hidden field; pretend it worked */
  if (clean(body.company_url, 300)) return res.status(200).json({ ok: true });

  const f = {};
  for (const [k, max] of Object.entries(LIMITS)) f[k] = clean(Array.isArray(body[k]) ? body[k].join(', ') : body[k], max);
  const isAudit = f.form === 'audit';

  if (!EMAIL_RE.test(f.email)) return res.status(400).json({ ok: false, field: 'email', error: 'Please enter a valid email address.' });
  if (!isAudit && !f.name) return res.status(400).json({ ok: false, field: 'name', error: 'Please enter your name.' });
  if (!isAudit && f.message.length < 3) return res.status(400).json({ ok: false, field: 'message', error: 'Please add a few more details.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (throttled(ip)) return res.status(429).json({ ok: false, error: 'Too many messages. Please try again in a few minutes.' });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('contact: SMTP_HOST, SMTP_USER and SMTP_PASS must be set');
    return res.status(500).json({ ok: false, error: 'Email is not configured yet.' });
  }
  const port = Number(SMTP_PORT) || 465;

  const rows = [
    ['Form', isAudit ? 'Free audit request' : 'Contact page'],
    ['Name', f.name],
    ['Email', f.email],
    ['Company', f.company],
    ['Website', f.website],
    ['Monthly budget', f.budget],
    ['Services', f.services],
    ['Sent from', f.page],
  ].filter(([, v]) => v);
  const who = f.name || f.email;
  const subject = oneLine(isAudit ? `Free audit request — ${who}` : `New enquiry — ${who}${f.company ? ` (${f.company})` : ''}`);
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}${f.message ? `\n\n${f.message}` : ''}\n`;
  const html = `<table cellpadding="6" style="font:14px/1.5 Arial,sans-serif;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#666;vertical-align:top">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
    .join('')}</table>${f.message ? `<p style="font:14px/1.6 Arial,sans-serif;white-space:pre-wrap">${esc(f.message)}</p>` : ''}`;

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    await transport.sendMail({
      from: { name: 'AiWorx website', address: MAIL_FROM || SMTP_USER },
      to: MAIL_TO || SMTP_USER,
      replyTo: { name: oneLine(f.name || f.email), address: f.email },
      subject,
      text,
      html,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact: send failed:', err && (err.code || err.message));
    return res.status(502).json({ ok: false, error: 'We could not send your message right now.' });
  }
};
