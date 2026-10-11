// Canvas2D helpers for drawing surfaces (all in plate coverage, see ink.ts).
import { F, font } from '../engine/type';
export type C2 = CanvasRenderingContext2D;

export function disc(c: C2, x: number, y: number, r: number, fill: string) { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
export function ring(c: C2, x: number, y: number, r: number, w: number, stroke: string) { if (r <= 0) return; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.lineWidth = w; c.strokeStyle = stroke; c.stroke(); }
export function seg(c: C2, x0: number, y0: number, x1: number, y1: number, w: number, stroke: string, cap: CanvasLineCap = 'round') { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = w; c.lineCap = cap; c.strokeStyle = stroke; c.stroke(); }
export function poly(c: C2, pts: number[][], w: number, stroke: string, close = false, fill?: string) {
  if (pts.length < 2) return;
  c.beginPath(); c.moveTo(pts[0]![0]!, pts[0]![1]!);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i]![0]!, pts[i]![1]!);
  if (close) c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (w > 0) { c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = stroke; c.stroke(); }
}
export function rrect(c: C2, x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string, lw = 4) {
  c.beginPath(); c.roundRect(x, y, w, h, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}
export function text(c: C2, s: string, x: number, y: number, size: number, fill: string, o: { fam?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; track?: number } = {}) {
  c.font = font(o.fam ?? F.mono(500), size);
  c.textAlign = o.align ?? 'left'; c.textBaseline = o.base ?? 'alphabetic';
  c.letterSpacing = `${o.track ?? 0}px`;
  c.fillStyle = fill; c.fillText(s, x, y);
  c.letterSpacing = '0px';
}
/** Part of a polyline up to fraction k of its length. */
export function partial(pts: number[][], k: number): number[][] {
  if (k >= 1) return pts;
  if (k <= 0) return [pts[0]!];
  let tot = 0; const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i]![0]! - pts[i - 1]![0]!, pts[i]![1]! - pts[i - 1]![1]!); L.push(tot); }
  const s = tot * k, out = [pts[0]!];
  for (let i = 1; i < pts.length; i++) {
    if (L[i]! <= s) out.push(pts[i]!);
    else { const u = (s - L[i - 1]!) / (L[i]! - L[i - 1]! || 1); out.push([pts[i - 1]![0]! + (pts[i]![0]! - pts[i - 1]![0]!) * u, pts[i - 1]![1]! + (pts[i]![1]! - pts[i - 1]![1]!) * u]); break; }
  }
  return out;
}
/** Point at fraction k along a polyline. */
export function along(pts: number[][], k: number): number[] { const p = partial(pts, k); return p[p.length - 1]!; }
/** The marble, as seen flat: a solid blue disc with a paper glint. */
export function marble2(c: C2, x: number, y: number, r: number, blue: string, paper: string) {
  disc(c, x, y, r, blue);
  disc(c, x - r * 0.32, y - r * 0.34, r * 0.2, paper);
}
/** A paperclip outline centred at (x, y), length L, rotated a. */
export function clip2(c: C2, x: number, y: number, L: number, a: number, w: number, stroke: string) {
  c.save(); c.translate(x, y); c.rotate(a);
  const W = L * 0.3, r = W / 2;
  c.beginPath();
  c.moveTo(L * 0.28, -r * 0.45);
  c.lineTo(-L / 2 + r, -r * 0.45);
  c.arc(-L / 2 + r, 0.05 * r, r * 0.5, -Math.PI / 2, Math.PI / 2, true);
  c.lineTo(L / 2 - r, r * 0.55);
  c.arc(L / 2 - r, -r * 0.2, r * 0.78, Math.PI / 2, -Math.PI / 2, true);
  c.lineTo(-L / 2 + r, -r);
  c.arc(-L / 2 + r, 0, r, -Math.PI / 2, Math.PI / 2, true);
  c.lineTo(L * 0.36, r);
  c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = stroke; c.stroke();
  c.restore();
}
