/**
 * Shows the Mixtape site on this computer, with the same security headers as site/.htaccess.
 *   npm.cmd run site   then open http://localhost:8080
 * Only for trying it out. On the real host, upload the site/ folder instead.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('site');
const PORT = Number(process.env.PORT || 8080);
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const HEADERS = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const wanted = path.resolve(ROOT, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`);
  // Never serve anything outside site/, and never the readme or the server settings file.
  if (!wanted.startsWith(ROOT + path.sep) || /(^|[\/])\.|README/i.test(path.relative(ROOT, wanted)) || request.method !== 'GET') {
    response.writeHead(404, HEADERS).end('Not found');
    return;
  }
  try {
    const body = await readFile(wanted);
    response.writeHead(200, { ...HEADERS, 'Content-Type': TYPES[path.extname(wanted)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(body);
  } catch {
    response.writeHead(404, HEADERS).end('Not found');
  }
}).listen(PORT, 'localhost', () => console.log(`Mixtape: http://localhost:${PORT}`));
