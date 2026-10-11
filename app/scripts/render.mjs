#!/usr/bin/env node
// Offline renderer (Node port of the upstream bun script, simplified).
//   stills: node scripts/render.mjs stills --t 1.5,23,40.2 [--out dir] [--samples 1]
//   sheet:  node scripts/render.mjs sheet --from 20 --to 35 [--n 12] [--cols 4] [--out file.png]  (or --times a,b,c)
//   video:  node scripts/render.mjs video [--from 0] [--to 156.65] [--fps 60] [--crf 16] [--samples 4] [--shutter 0.5] [--out ../out/pdoom.mp4] [--png]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(`--${k}`);
const APP = path.resolve(import.meta.dirname, '..');
const ROOT = path.resolve(APP, '..');
const SAMPLES = +opt('samples', '1');
const SHUTTER = +opt('shutter', '0.5');

const reachable = async (url) => { try { return (await fetch(url, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; } };

async function ensureServer() {
  const url = opt('url', 'http://localhost:5173');
  if (await reachable(url)) return { url, stop: () => {} };
  const port = 5300 + Math.floor(Math.random() * 500);
  const proc = spawn(path.join(APP, 'node_modules/.bin/vite'), ['--port', String(port), '--strictPort'], { cwd: APP, stdio: 'ignore', env: { ...process.env, PDOOM_NO_HMR: '1' } });
  const u = `http://localhost:${port}`;
  for (let i = 0; i < 150 && !(await reachable(u)); i++) await new Promise((r) => setTimeout(r, 100));
  return { url: u, stop: () => proc.kill() };
}

async function openPage(url) {
  const browser = await chromium.launch({
    channel: 'chrome', headless: !flag('headed'),
    args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(`${url}/?export=1`);
  await page.waitForFunction(() => window.__pdoom?.ready || window.__pdoom?.error, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__pdoom.error);
  if (err) throw new Error(`app failed to boot:\n${err}\n${logs.join('\n')}`);
  const sceneErrors = await page.evaluate(() => window.__pdoom.errors);
  if (sceneErrors.length) console.error('SCENE ERRORS:\n' + sceneErrors.join('\n'));
  return { browser, page, logs };
}

async function stills(page, times, outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const t of times) {
    await page.evaluate(([t, s, sh]) => window.__pdoom.still(t, s, sh), [t, SAMPLES, SHUTTER]);
    const f = path.join(outDir, `f_${t.toFixed(2).padStart(7, '0')}.png`);
    await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    console.log(f);
  }
}

async function sheet(page, times, cols, out) {
  const dataUrl = await page.evaluate(async ({ times, cols, S, SH }) => {
    const P = window.__pdoom;
    const cw = 640, ch = 360, pad = 4, lab = 18;
    const rows = Math.ceil(times.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * (cw + pad) + pad; cv.height = rows * (ch + lab + pad) + pad;
    const c = cv.getContext('2d');
    c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
    const src = document.getElementById('c');
    times.forEach((t, i) => {
      P.still(t, S, SH);
      const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
      c.drawImage(src, x, y + lab, cw, ch);
      c.fillStyle = '#ddd'; c.font = '13px monospace'; c.fillText(`${t.toFixed(2)}s`, x + 2, y + 13);
    });
    return cv.toDataURL('image/jpeg', 0.9);
  }, { times, cols, S: SAMPLES, SH: SHUTTER });
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(out);
}

async function video(page) {
  const from = +opt('from', '0'), fps = +opt('fps', '60');
  const dur = await page.evaluate(() => window.__pdoom.duration);
  const to = Math.min(+opt('to', String(dur)), dur);
  const out = path.resolve(opt('out', path.join(ROOT, 'out/pdoom.mp4')));
  mkdirSync(path.dirname(out), { recursive: true });
  const png = flag('png');
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', png ? 'png' : 'mjpeg', '-i', 'pipe:0'];
  if (!flag('noaudio')) args.push('-ss', String(from), '-t', String(to - from), '-i', path.join(ROOT, 'audio/pdoom.mp3'));
  args.push('-c:v', 'libx264', '-preset', opt('preset', 'medium'), '-crf', opt('crf', '16'), '-pix_fmt', 'yuv420p');
  if (!flag('noaudio')) args.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  args.push('-movflags', '+faststart', out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps), CH = 8, t0 = Date.now();
  for (let n = n0; n < n1; n += CH) {
    const frames = await page.evaluate(async ([a, b, fps, s, sh, png]) => window.__pdoom.frames(a, b, fps, s, sh, png), [n, Math.min(n + CH, n1), fps, SAMPLES, SHUTTER, png]);
    for (const f of frames) if (!ff.stdin.write(Buffer.from(f, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if ((n - n0) % 240 === 0) {
      const done = n - n0 + CH, el = (Date.now() - t0) / 1000;
      console.log(`${(n / fps).toFixed(1)}s  ${done}/${n1 - n0} frames  ${(el / done * 1000).toFixed(0)} ms/frame  eta ${((n1 - n0 - done) * el / done / 60).toFixed(1)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(out);
}

const srv = await ensureServer();
const { browser, page, logs } = await openPage(srv.url);
try {
  if (mode === 'stills') await stills(page, opt('t', '0').split(',').map(Number), path.resolve(opt('out', path.join(ROOT, 'out/stills'))));
  else if (mode === 'sheet') {
    const n = +opt('n', '12'), a = +opt('from', '0'), b = +opt('to', '10');
    const times = opt('times') ? opt('times').split(',').map(Number) : Array.from({ length: n }, (_, i) => a + ((b - a) * i) / Math.max(1, n - 1));
    await sheet(page, times, +opt('cols', '4'), path.resolve(opt('out', path.join(ROOT, 'out/sheet.jpg'))));
  } else if (mode === 'video') await video(page);
  const errs = await page.evaluate(() => window.__pdoom.errors);
  if (errs.length) console.error('SCENE ERRORS:\n' + errs.join('\n'));
  if (logs.length) console.error([...new Set(logs)].slice(0, 30).join('\n'));
} finally { await browser.close(); srv.stop(); }
