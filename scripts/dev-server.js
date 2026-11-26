/*
 * Local preview that behaves like the Vercel deployment:
 *   - clean URLs: /about serves about.html, /about.html redirects (308) to /about, /index → /
 *   - unknown paths get 404.html with a 404 status
 *   - POST /api/contact runs api/contact.js (set SMTP_* env vars to send real mail)
 * Usage: npm run dev   (or: node scripts/dev-server.js [port])
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
};
const contact = require(path.join(ROOT, 'api/contact.js'));

const send = (res, status, file) => {
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
};

http
  .createServer((req, res) => {
    res.status = (c) => ((res.statusCode = c), res);
    res.json = (o) => (res.setHeader('Content-Type', 'application/json'), res.end(JSON.stringify(o)));
    const url = new URL(req.url, 'http://localhost');
    let p = decodeURIComponent(url.pathname);
    if (p === '/api/contact') return contact(req, res);

    const redirect = (to) => (res.writeHead(308, { Location: to + url.search }), res.end());
    if (p.endsWith('.html')) return redirect(p === '/index.html' ? '/' : p.slice(0, -5));
    if (p === '/index') return redirect('/');
    if (p.length > 1 && p.endsWith('/')) return redirect(p.slice(0, -1));

    const file = path.join(ROOT, p === '/' ? 'index.html' : p);
    if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return send(res, 404, path.join(ROOT, '404.html'));
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return send(res, 200, file);
    if (fs.existsSync(file + '.html')) return send(res, 200, file + '.html');
    return send(res, 404, path.join(ROOT, '404.html'));
  })
  .listen(PORT, () => console.log(`AiWorx preview on http://localhost:${PORT}`));
