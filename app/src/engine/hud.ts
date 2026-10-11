// The fixed text overlay, in plate coverage (see film/ink.ts): the lyric line bottom left and
// one footnote top left. It is composited by the print pass, so it is never halftoned or blurred.
// Also the P(doom) value over time.
import { Layer2D, W, H } from './gl';
import { F, font, measure } from './type';
import { Lyrics } from './lyrics';
import { clamp, ease, noise1, prog, smoothstep } from './util';
import { ik } from '../film/ink';
import { NOTES } from '../film/notes';

/** P(doom) steps: each sung "P(doom)" raises the estimate. */
export class PDoom {
  steps: { t: number; v: number }[] = [];
  constructor(lyrics: Lyrics) {
    const hits = lyrics.findWords('P(doom)').map((w) => w.start + 0.06);
    const vals = [0.15, 0.42, 0.81, 0.99];
    this.steps = [{ t: -1, v: 0.02 }, ...hits.map((t, i) => ({ t, v: vals[i] ?? 0.99 }))];
  }
  /** Value at t: each step rolls in over ~0.9 s, with a slow creep toward the next one. */
  value(t: number): number {
    let i = 0;
    while (i + 1 < this.steps.length && this.steps[i + 1]!.t <= t) i++;
    const cur = this.steps[i]!, prev = this.steps[Math.max(0, i - 1)]!;
    const k = i === 0 ? 1 : prog(t, cur.t, cur.t + 0.9, ease.outExpo);
    const base = prev.v + (cur.v - prev.v) * k;
    const next = this.steps[i + 1];
    const creep = next ? (next.v - cur.v) * 0.12 * smoothstep(cur.t + 1, next.t, t) : 0;
    return clamp(base + creep + noise1(t * 3.1, 7) * 0.002, 0, 1);
  }
  /** The value the flip clock shows (steps, no creep). */
  shown(t: number): number { let s = this.steps[0]!; for (const x of this.steps) if (x.t <= t) s = x; return s.v; }
  lastStep(t: number) { let s = this.steps[0]!; for (const x of this.steps) if (x.t <= t) s = x; return s; }
}

interface Note { t0: number; t1: number; key: string; text: string; pos: string; fixed: boolean }

export class Hud {
  layer = new Layer2D();
  pdoom: PDoom;
  notes: Note[];
  constructor(public lyrics: Lyrics) {
    this.pdoom = new PDoom(lyrics);
    this.layer.texture.premultiplyAlpha = true;
    const ns = NOTES.map(([q, w, key, text, o]) => {
      const l = lyrics.get(q);
      const word = typeof w === 'number' ? l.words[w]! : l.words.find((x) => x.w.toLowerCase().includes(w.toLowerCase())) ?? l.words[0]!;
      return { t0: word.start, t1: word.start + (o?.dur ?? 4.2), key, text, pos: o?.pos ?? 'tl', fixed: !!o?.dur };
    });
    // one at a time: a note leaves when the next arrives
    ns.forEach((n, i) => { const nx = ns[i + 1]; if (nx && nx.t0 < n.t1 + 0.3) n.t1 = nx.t0 - 0.3; });
    void ns.every((n) => n.fixed || true);
    this.notes = ns;
  }

  draw(t: number, opacity: number) {
    const L = this.layer;
    L.clear();
    if (opacity <= 0.001) return L.upload();
    const c = L.ctx;
    c.textBaseline = 'alphabetic';
    this.note(c, t);
    return L.upload();
  }

  /** (Unused: the lyrics now live on objects in the scene, see film/lyric.ts.) */
  lyric(c: CanvasRenderingContext2D, t: number) {
    const ls = this.lyrics.lines;
    let l = null as (typeof ls)[number] | null;
    for (const x of ls) if (t >= x.start - 0.25) l = x;
    if (!l) return;
    const i = ls.indexOf(l), nx = ls[i + 1];
    const out = Math.min(l.end + 1.2, nx ? nx.start - 0.25 : l.end + 1.2);
    if (t > out) return;
    const fam = F.archivo(100, 500), size = 38, x0 = 96, y = H - 100;
    c.font = font(fam, size);
    const full = measure(l.text, fam, size);
    // paper label knocks out the picture under the line
    c.fillStyle = ik(0, 0, 0.94);
    c.fillRect(x0 - 18, y - size - 6, full + 36, size + 28);
    let x = x0;
    for (const w of l.words) {
      const sung = clamp((t - w.start) / 0.09);
      c.fillStyle = ik(sung, 0.42 + 0.58 * sung);
      c.fillText(w.w, x, y);
      x += measure(w.w + ' ', fam, size);
    }
  }

  private note(c: CanvasRenderingContext2D, t: number) {
    const n = this.notes.find((k) => t >= k.t0 && t < k.t1);
    if (!n) return;
    const a = Math.min(prog(t, n.t0, n.t0 + 0.25), 1 - prog(t, n.t1 - 0.25, n.t1));
    const kf = F.mono(700), tf = F.mono(400), size = 29;
    const kw = measure(n.key, kf, size), full = kw + 22 + measure(n.text, tf, size);
    const x = n.pos[1] === 'r' ? W - 100 - full : 100, y = n.pos[0] === 'b' ? H - 70 : 116;
    const shown = Math.ceil((n.key.length + n.text.length) * prog(t, n.t0, n.t0 + 0.45));
    c.globalAlpha = a;
    c.fillStyle = ik(0, 0, 0.94);
    c.fillRect(x - 40, y - size - 8, full + 62, size + 26);
    c.fillStyle = ik(0, 1);
    c.fillRect(x - 26, y - size * 0.72, 12, 12);
    c.font = font(kf, size);
    c.fillStyle = ik(1, 1);
    c.fillText(n.key.slice(0, shown), x, y);
    c.font = font(tf, size);
    c.fillText(n.text.slice(0, Math.max(0, shown - n.key.length)), x + kw + 22, y);
    c.globalAlpha = 1;
  }
}
