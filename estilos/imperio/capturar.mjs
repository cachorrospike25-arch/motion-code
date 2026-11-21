// Captura do Império: abre motor/pagina.html no Chromium headless (WebGL por software) e grava quadro a quadro.
// Uso: node capturar.mjs episodios/<slug> saida.mp4 [--de s] [--ate s]     (vídeo mudo)
//      node capturar.mjs episodios/<slug> --still 1,5.5,20 pasta/            (quadros soltos em jpg)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const RAIZ = path.dirname(new URL(import.meta.url).pathname);
const [ep, saida, ...resto] = process.argv.slice(2);
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const tempo = JSON.parse(fs.readFileSync(path.join(ep, 'tempo.json')));
const fps = tempo.fps || 30;

const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0, '127.0.0.1');
await new Promise(ok => srv.on('listening', ok));
const porta = srv.address().port;

const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pag = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
pag.on('console', m => console.log('[pág]', m.text()));
pag.on('pageerror', e => { console.error('[erro]', e.message); process.exit(1); });
await pag.goto(`http://127.0.0.1:${porta}/motor/pagina.html`);
await pag.waitForFunction(() => window.iniciar);
await pag.evaluate(t => window.iniciar(t), tempo);
fs.writeFileSync(path.join(ep, 'eventos.json'), JSON.stringify(await pag.evaluate(() => window.eventos())));

async function quadro(t) {
  const b64 = await pag.evaluate(t => { window.quadro(t); return document.getElementById('c').toDataURL('image/jpeg', .94).slice(23); }, t);
  return Buffer.from(b64, 'base64');
}

if (saida === '--still') {
  const ts = resto[0].split(',').map(Number); const pasta = resto[1]; fs.mkdirSync(pasta, { recursive: true });
  for (const t of ts) { const t0 = Date.now(); fs.writeFileSync(path.join(pasta, `q_${t.toFixed(2)}.jpg`), await quadro(t)); console.log(`t=${t} ${Date.now() - t0}ms`); }
  console.log(await pag.evaluate(() => window.info()));
} else {
  const de = Number(arg('--de') || 0), ate = Number(arg('--ate') || tempo.total);
  const n = Math.round((ate - de) * fps);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await quadro(de + i / fps);
    if (!ff.stdin.write(buf)) await new Promise(ok => ff.stdin.once('drain', ok));
    if (i % 30 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${i}/${n}  ${(el / (i + 1)).toFixed(2)} s/quadro  faltam ${((n - i) * el / (i + 1) / 60).toFixed(1)} min`); }
  }
  ff.stdin.end(); await new Promise(ok => ff.on('close', ok));
}
await nav.close(); srv.close();
