// Lyrics are objects in the scene: every line is printed on something (a lens ring, a ruler,
// a sheet of paper, a tag). These helpers set a line in the one lyric style: blue only, so the
// plate shift never doubles it; pale until sung, solid once sung; one key word slightly heavier.
import type { Word } from '../engine/lyrics';
import { F, font, measure } from '../engine/type';
import { clamp } from '../engine/util';
import { bl, BLUE, PAPER } from './ink';

const fam = (key: boolean) => F.archivo(100, key ? 900 : 500);
const isKey = (w: Word, key?: string) => !!key && w.w.toLowerCase().replace(/[^a-z0-9()]/g, '').startsWith(key.toLowerCase().replace(/[^a-z0-9()]/g, ''));

export function lyricWidth(ws: Word[], size: number, key?: string) {
  let x = 0;
  ws.forEach((w, i) => { x += measure(w.w + (i < ws.length - 1 ? ' ' : ''), fam(isKey(w, key)), size); });
  return x;
}
/** Draw words left to right from (x, y = baseline). `on`/`off`: colours of sung and unsung words. Returns each word's x. */
export function drawLyric(c: CanvasRenderingContext2D, ws: Word[], t: number, x: number, y: number, size: number, key?: string, on: string = BLUE, off: string = bl(0.3), align: 'left' | 'center' = 'left') {
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  if (align === 'center') x -= lyricWidth(ws, size, key) / 2;
  const xs: number[] = [];
  for (const w of ws) {
    const k = isKey(w, key), f = fam(k);
    c.font = font(f, size);
    c.fillStyle = t >= w.start - 0.02 ? on : off;
    // the key word leans in as it is sung; everything else just reads
    const pop = k ? 1 + 0.1 * clamp(1 - Math.abs((t - w.start - 0.06) / 0.12)) : 1;
    xs.push(x);
    if (pop !== 1) { const wd = measure(w.w, f, size); c.save(); c.translate(x + wd / 2, y - size * 0.3); c.scale(pop, pop); c.fillText(w.w, -wd / 2, size * 0.3); c.restore(); } else c.fillText(w.w, x, y);
    x += measure(w.w + ' ', f, size);
  }
  return xs;
}
/** The paper tag a line sits on when nothing in the shot can carry it. */
export function tagPlate(c: CanvasRenderingContext2D, w: number, h: number) {
  c.clearRect(0, 0, w, h);
  c.beginPath(); c.moveTo(22, 5); c.lineTo(w - 5, 5); c.lineTo(w - 5, h - 5); c.lineTo(22, h - 5); c.lineTo(5, h / 2); c.closePath();
  c.fillStyle = PAPER; c.fill(); c.lineWidth = 5; c.lineJoin = 'round'; c.strokeStyle = BLUE; c.stroke();
}
/** Words lettered along an arc centred on its top, radius R (baseline). Lit as sung, like drawLyric. */
export function arcLyric(c: CanvasRenderingContext2D, ws: Word[], t: number, cx: number, cy: number, R: number, size: number, key?: string, on: string = BLUE, off: string = bl(0.3)) {
  let tot = 0; for (const w of ws) tot += measure(w.w + ' ', fam(isKey(w, key)), size);
  let a = -Math.PI / 2 - tot / R / 2;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  for (const w of ws) {
    const f = fam(isKey(w, key));
    c.font = font(f, size); c.fillStyle = t >= w.start - 0.02 ? on : off;
    for (const ch of w.w + ' ') { const adv = measure(ch, f, size), m = a + adv / R / 2; c.save(); c.translate(cx + Math.cos(m) * R, cy + Math.sin(m) * R); c.rotate(m + Math.PI / 2); c.fillText(ch, 0, 0); c.restore(); a += adv / R; }
  }
}
