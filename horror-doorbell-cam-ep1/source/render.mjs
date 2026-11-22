import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, s, e, outDir = '../renders/frames', port = '8137'] = process.argv;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p === root + '/') p = root + '/index.html'; fs.readFile(p, (er, d) => { if (er) { r.statusCode = 404; r.end(); } else { r.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream'); r.end(d); } }); }).listen(+port);
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', er => console.error('PAGEERR', er.message)); pg.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await pg.goto(`http://localhost:${port}/`); await pg.waitForFunction('window.ready === true', null, { timeout: 60000 });
const t0 = Date.now();
const list = s.includes(',') ? s.split(',').map(Number) : Array.from({length: +e - +s + 1}, (_, i) => +s + i);
for (const f of list) {
  const d = await pg.evaluate(f => window.renderFrame(f), f);
  fs.writeFileSync(path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
  if (f % 10 === 0 || s.includes(',')) console.log(`frame ${f} avg ${((Date.now() - t0) / (list.indexOf(f) + 1) / 1000).toFixed(2)}s/frame`);
}
console.log('done', s, e); await b.close(); srv.close();
