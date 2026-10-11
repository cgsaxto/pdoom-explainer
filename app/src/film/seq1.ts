// Shots 01-09: the lens, the circuit, the loss cliff, the seesaw, the shredder, the first
// wide of the desk, FOOM. One object is followed all the way: the marble.
import * as THREE from 'three';
import type { Film, V3 } from './core';
import { bl, rd, BLUE, DARK, PAPER, RED } from './ink';
import { disc, ring, seg, poly, rrect, text, marble2 } from './d2';
import { drawLyric, lyricWidth } from './lyric';
import { F, font, measure, fitSize } from '../engine/type';
import { clamp, ease, hash, keys, lerp, mulberry32, noise1, prog, pulse, springStep, frameIdx, TAU, type Key } from '../engine/util';
import { BOTTLE } from './desk';

const RINGS = [[470, 26], [395, 60], [330, 10], [250, 22], [180, 8], [110, 16]];
/** The lens: concentric rings and a pupil. Shared by the first and the last frame. `par`: parallax offset of the deep rings. */
const SPIN = [22, 0, -18, 30, -26, 34].map((n) => (n * (TAU / 3)) / 156.651);
export function drawLens(c: CanvasRenderingContext2D, z: number, led: number, iris = 0, par: [number, number] = [0, 0], t = 0, kick: number[] = []) {
  RINGS.forEach(([r, w], i) => {
    const x = 960 + par[0] * i * 0.2, y = 540 + par[1] * i * 0.2, R = r! * z * (1 + 0.05 * (kick[i] ?? 0)), lw = w! * Math.sqrt(z);
    ring(c, x, y, R, lw, BLUE);
    // index marks ride each ring at its own speed, so the barrel is never still
    if (i !== 1 && z < 3) for (let k = 0; k < 3; k++) { const a = SPIN[i]! * t + (k * TAU) / 3 + i; seg(c, x + Math.cos(a) * (R - lw * 0.7), y + Math.sin(a) * (R - lw * 0.7), x + Math.cos(a) * (R + lw * 0.7), y + Math.sin(a) * (R + lw * 0.7), Math.max(7, lw * 0.6), PAPER, 'butt'); }
  });
  if (z < 1.6) {
    // aperture blades: iris 1 = shut down to a pinhole, 0 = wide open
    const R = 96 * z, cx = 960 + par[0], cy = 540 + par[1], a = lerp(R, R * 0.14, iris);
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
    for (let k = 0; k < 7; k++) { const an = (k / 7) * TAU + iris * 1.1; c.beginPath(); c.moveTo(cx + Math.cos(an) * a, cy + Math.sin(an) * a); c.lineTo(cx + Math.cos(an + 0.9) * R * 1.4, cy + Math.sin(an + 0.9) * R * 1.4); c.lineTo(cx + Math.cos(an - 0.35) * R * 1.4, cy + Math.sin(an - 0.35) * R * 1.4); c.closePath(); c.fillStyle = bl(0.3); c.fill(); c.lineWidth = 3; c.strokeStyle = BLUE; c.stroke(); }
    c.restore();
    disc(c, 960 + 640 * z, 540 - 380 * z, 17, bl(0.3));
    if (led > 0) disc(c, 960 + 640 * z, 540 - 380 * z, 17, RED);
  }
}

export function seq1(f: Film) {
  const P = f.P;
  const L1 = f.line('I see sparks'), agi = f.word('I see sparks', 'AGI'), tEyes = f.at('I see sparks', 'eyes'), tSparks = f.at('I see sparks', 'sparks');
  const L2 = f.line('Your circuits'), tCirc = L2.start, tNerv = f.at('Your circuits', 'nervous');
  const L3 = f.line("that's no surprise"), tSurp = f.at("that's no surprise", 'surprise');
  const L4 = f.line('There was a sudden'), tLoss = L4.start, tDrop = f.at('There was a sudden', 'drop'), tLossEnd = L4.end;
  const L5 = f.line("now I'm your servant"), tServ = f.at("now I'm your servant", 'servant'), tBoss = f.at("now I'm your servant", 'boss');
  const chat = f.line('ChatGPT'), tChat = chat.start, cw = chat.words, tAlive = f.at('ChatGPT', 'alive');
  const hook = f.line("I'm upping", 0), tI = hook.start, tUp = f.at("I'm upping", 'upping', 0), tMy = f.at("I'm upping", 'my', 0), tP = f.at("I'm upping", 'P(doom)', 0);
  const tF = f.at("'cause the future", 'FOOM'), tRoomW = f.at('Trapped', 'room');
  void tRoomW;
  const MR = 37; // marble radius in board px

  // ---- the board world: one path, the marble rolls along it, the view follows -----------------------
  const tRoll = tCirc + 0.45, tFreeze = tLossEnd - 0.45, tOut = tLossEnd - 0.25, XC = 3050, XE = 3900;
  const mxK: Key[] = [[tRoll, 1080, ease.linear], [tLoss, 2150, ease.linear], [tDrop, XC, ease.linear], [tDrop + 0.36, XC + 70, ease.linear], [tFreeze, XE, ease.linear], [tFreeze + 1, XE + 620, ease.linear]];
  const mxAt = (t: number) => keys(t, mxK);
  const sm = (a: number, b: number, x: number) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const pathY = (x: number, k2: number) => {
    let y = 540 - 80 * (sm(1250, 1330, x) - sm(1560, 1640, x)) + 80 * (1 - k2) * (sm(1900, 1980, x) - sm(2220, 2300, x));
    if (x > 2420) y += 6 * noise1(x * 0.045, 3) * sm(2420, 2500, x);
    return y + 500 * sm(XC, XC + 70, x);
  };
  const k2At = (t: number) => prog(t, tSurp - 0.2, tSurp + 0.2, ease.inOutCubic);
  const marbleAt = (t: number): [number, number] => {
    const x = mxAt(t), over = Math.max(0, t - tFreeze);
    return [x, pathY(Math.min(x, XE), k2At(t)) - MR - 9 + 1500 * over * over];
  };
  const zoomAt = (t: number) => keys(t, [[tLoss - 0.2, 1], [tLoss + 0.7, 0.86], [tDrop + 0.5, 0.86], [tFreeze - 0.1, 1.3]]);
  // every phrase on the board: where it is printed, how wide, and when it is being sung
  const ph = (ws: typeof L2.words, x: number, y: number, size: number, key?: string, a?: number) => ({ ws, x, y, size, key, w: lyricWidth(ws, size, key), a: a ?? ws[0]!.start, b: ws[ws.length - 1]!.end });
  const blocks = [ph(L2.words, 1100, 710, 78, 'nervous', tCirc + 0.6), ph(L3.words, 1740, 425, 78, 'surprise'), ph(L4.words.slice(0, 4), 2430, 425, 78), ph(L4.words.slice(4, 5), XC + 130, 770, 150, 'drop'), ph(L4.words.slice(5), XC + 125, 885, 72)];
  const viewAt = (t: number): [number, number, number] => {
    const tt = Math.min(t, tFreeze), [mx, my] = marbleAt(tt), z = zoomAt(t), kf = prog(t, tRoll, tRoll + 0.9, ease.inOutQuad);
    const lead = lerp(250, 80, prog(t, tDrop, tFreeze - 0.1, ease.inOutQuad));
    let cx = lerp(960, mx + lead, kf);
    for (const b of blocks) {
      const w = Math.min(prog(t, b.a - 0.3, b.a), 1 - prog(t, b.b, b.b + 0.3));
      if (w <= 0) continue;
      const half = 960 / z - 90 / z, lo = b.x + b.w - half, hi = b.x + half;
      cx += w * (clamp(cx, Math.min(lo, hi), Math.max(lo, hi)) - cx);
    }
    return [cx, lerp(540, my + lerp(-30, 40, prog(t, tLoss, tDrop)) - lerp(0, 60, prog(t, tDrop + 0.5, tFreeze)), kf), z];
  };
  /** Where the marble is on the monitor glass, in screen px. */
  const marbleScreen = (t: number): [number, number] => { const [cx, cy, z] = viewAt(t), [mx, my] = marbleAt(t); return [960 + (mx - cx) * z, 540 + (my - cy) * z]; };
  const side = [
    [[875, 455], [760, 340], [760, 150], [640, 30], [640, -400]],
    [[960, 420], [960, 250], [1080, 130], [1300, 130], [1420, 10], [1420, -400]],
    [[840, 540], [600, 540], [480, 660], [200, 660], [80, 780], [-400, 780]],
    [[1045, 625], [1160, 740], [1160, 900], [1300, 1040], [1300, 1500]],
    [[875, 625], [760, 740], [520, 740], [400, 860], [400, 1500]],
    [[1500, 240], [1700, 240], [1780, 320], [2100, 320], [2180, 240], [2420, 240]],
    [[1380, 860], [1700, 860], [1780, 780], [2040, 780], [2120, 860], [2420, 860]],
  ];
  const chips: number[][] = [[1420, 200, 200, 110], [1840, 900, 150, 150], [2060, 40, 170, 100], [1560, 700, 120, 80]];
  const ringText = (c: CanvasRenderingContext2D, t: number, z: number) => {
    // the line is lettered around the lens barrel, as on a real lens
    const fam = (k: boolean) => F.archivo(100, k ? 900 : 700), size = 42, R = 395 * z - 14;
    let tot = 0; for (const w of L1.words) tot += measure(w.w + ' ', fam(w === agi), size);
    let a = -Math.PI / 2 - tot / R / 2;
    for (const w of L1.words) {
      const fm = fam(w === agi);
      c.font = font(fm, size); c.fillStyle = t >= w.start - 0.02 ? PAPER : bl(0.55);
      for (const ch of w.w + ' ') { const adv = measure(ch, fm, size); c.save(); c.translate(960 + Math.cos(a + adv / R / 2) * R, 540 + Math.sin(a + adv / R / 2) * R); c.rotate(a + adv / R / 2 + Math.PI / 2); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(ch, 0, 0); c.restore(); a += adv / R; }
    }
  };
  P.Smon.clip(0, tLossEnd + 0.4, (c: CanvasRenderingContext2D, t: number) => {
    // 01-02: we drift in toward the lens; the rings sit at different depths
    const push = lerp(0.84, 1, ease.outQuad(prog(t, 0, tCirc)));
    const z = push * (1 + 28 * prog(t, tCirc - 0.1, tCirc + 0.6, ease.inOutCubic));
    // the eye opens on the first words, tightens on the last, and is wide open as we go through it
    const ir = clamp(1 - 0.85 * prog(t, 1.3, 2.4, ease.outCubic) + (t >= tEyes ? 0.45 * springStep(t - tEyes, 2.6, 0.5) : 0)) * (1 - prog(t, tCirc - 0.15, tCirc + 0.05));
    const pupil = 42 * z * (1 - 0.7 * ir);
    const par: [number, number] = [26 * (1 - prog(t, 0, tCirc - 0.2, ease.outQuad)), -14 * (1 - prog(t, 0, tCirc - 0.2, ease.outQuad))];
    const [cx, cy, vz] = viewAt(t), k2 = k2At(t);
    const nerv = 12 * clamp((t - tNerv) / 0.06) * (1 - prog(t, tNerv + 0.5, tNerv + 0.68));
    const grow = prog(t, tCirc + 0.12, tCirc + 0.7, ease.outCubic);
    // the board, under the lens until we are through the pupil
    if (grow > 0) {
      c.save(); c.translate(960, 540); c.scale(vz, vz); c.translate(-cx, -cy);
      const jig = (i: number, j: number) => (nerv ? nerv * (hash(i, j, frameIdx(t)) - 0.5) * 2 : 0);
      side.forEach((tr, i) => poly(c, tr.map(([x, y], j) => [x! + jig(i, j), y! + jig(j, i)]), 20, bl(0.3)));
      for (const [x, y, w, h] of chips) { rrect(c, x! + jig(9, x!), y! + jig(x!, 9), w!, h!, 6, BLUE); for (let i = 0; i < 5; i++) { seg(c, x! + 16 + i * (w! - 32) / 4, y! - 16, x! + 16 + i * (w! - 32) / 4, y!, 8, BLUE, 'butt'); seg(c, x! + 16 + i * (w! - 32) / 4, y! + h!, x! + 16 + i * (w! - 32) / 4, y! + h! + 16, 8, BLUE, 'butt'); } }
      // the loss plot the trace runs into
      const ax = prog(t, tLoss - 0.75, tLoss - 0.3);
      if (ax > 0) {
        seg(c, 2380, lerp(1160, 330, ax), 2380, 1160, 8, BLUE, 'square'); seg(c, 2380, 1160, lerp(2380, XE, ax), 1160, 8, BLUE, 'square');
        for (let i = 1; i < 5; i++) seg(c, 2380, 1160 - i * 180, lerp(2380, XE, ax), 1160 - i * 180, 3, bl(0.3 * ax), 'butt');
        if (ax >= 1) { text(c, 'loss', 2300, 320, 44, BLUE, { align: 'right' }); text(c, 'step', XE, 1230, 44, BLUE, { align: 'right' }); }
      }
      // the main trace: wherever it has been drawn, up to the edge of the board, then only as far as training has got
      const mx = mxAt(t), xEnd = Math.min(XE, Math.max(lerp(1250, 2380, grow), mx)), pts: number[][] = [];
      for (let x = 1080; x <= xEnd; x += 8) pts.push([x + (x < 2380 ? jig(1, x) * 0.5 : 0), pathY(x, k2) + (x < 2380 ? jig(x, 1) : 0)]);
      pts.push([xEnd, pathY(xEnd, k2)]);
      poly(c, pts.filter((p) => p[0]! <= 2390), 26, BLUE); poly(c, pts.filter((p) => p[0]! >= 2380), 14, BLUE);
      disc(c, 960, 540, 120, BLUE); disc(c, 960, 540, 50 * prog(t, tCirc + 0.2, tCirc + 0.6), PAPER);
      // the lines, printed on the board like part numbers; the key word of each sets something off
      for (const b of blocks) drawLyric(c, b.ws, t, b.x, b.y, b.size, b.key, BLUE, bl(lerp(0.07, 0.3, prog(t, b.ws[0]!.start - 0.45, b.ws[0]!.start - 0.12))));
      const show = prog(t, tRoll - 0.05, tRoll + 0.15, ease.outBack);
      if (show > 0 && t < tOut) { const [x, y] = marbleAt(t); marble2(c, x, y, MR * show, BLUE, PAPER); }
      c.restore();
    }
    if (z < 26) {
      // until we are through it, everything outside the pupil is the lens
      if (grow > 0) { c.save(); c.beginPath(); c.rect(0, 0, 1920, 1080); c.arc(960, 540, Math.max(1, pupil - 4), 0, TAU, true); c.clip('evenodd'); c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080); }
      const bolts: [number, number, number, number, number][] = [[f.syl(agi, 0), -2.3, 46, 110, 5], [f.syl(agi, 1), 2.5, 110, 250, 3]];
      const kick = [0, 0, 0, 0, 0, 0];
      for (const b of bolts) if (t >= b[0] + 0.08) kick[b[4]] = pulse(t, b[0] + 0.08, 0.1);
      drawLens(c, z, t > 0.36 ? 1 : 0, ir, par, t, kick);
      if (z < 1.5) ringText(c, t, z);
      if (grow > 0) c.restore();
      else { disc(c, 960 + par[0], 540 + par[1], pupil, BLUE); const ig = prog(t, tSparks, tSparks + 0.12, ease.outBack); if (ig > 0) disc(c, 960 + par[0], 540 + par[1], pupil * 0.42 * ig, RED); }
      // the relay: a spark jumps pupil -> inner ring, inner ring -> outer ring, each ring kicks as it is hit
      for (const [ts, an, r0, r1] of bolts) {
        const u = t - ts;
        if (u < 0 || u > 1.1) continue;
        const g = prog(u, 0, 0.1), fade = 1 - prog(u, 0.22, 0.7), pts: number[][] = [];
        for (let i = 0; i <= 7; i++) { const rr = lerp(r0, r0 + (r1 - r0) * g, i / 7) * z, off = i === 0 || i === 7 ? 0 : (hash(i, ts) - 0.5) * 44; pts.push([960 + Math.cos(an) * rr - Math.sin(an) * off, 540 + Math.sin(an) * rr + Math.cos(an) * off]); }
        if (fade > 0) poly(c, pts, 18 * fade, RED);
        for (let k = 0; k < 6; k++) { const a2 = an + (hash(k, ts, 1) - 0.5) * 2.2, d = 40 + 160 * u * (0.5 + hash(k, ts, 2)); disc(c, 960 + Math.cos(an) * r1 * z + Math.cos(a2) * d, 540 + Math.sin(an) * r1 * z + Math.sin(a2) * d + 90 * u * u, 8 * clamp(1 - u / 1.0), RED); }
      }
      // the third spark goes right, and stays: it is the first stretch of the trace
      const ts3 = f.syl(agi, 2);
      if (t >= ts3 && grow < 0.4) {
        const g = prog(t, ts3, ts3 + 0.12), jit = 1 - prog(t, ts3 + 0.15, tCirc - 0.2), kb = prog(t, tCirc - 0.05, tCirc + 0.3), x0 = 960 + lerp(pupil, 110, kb), pts: number[][] = [];
        for (let i = 0; i <= 8; i++) pts.push([lerp(x0, lerp(x0, 1250, g), i / 8), 540 + (i === 0 || i === 8 ? 0 : (hash(i, 77) - 0.5) * 52 * jit)]);
        poly(c, pts, lerp(16, 26, kb), RED);
        if (kb > 0) { c.globalAlpha = kb; poly(c, pts, lerp(16, 26, kb), BLUE); c.globalAlpha = 1; }
      }
    }
  });

  P.Smon.clip(tServ, tServ + 0.1, (c: CanvasRenderingContext2D) => {
    c.translate(960, 540); c.scale(1.08, 1.08); c.translate(-3140, -745);
    seg(c, 2380, 330, 2380, 1160, 8, BLUE, 'square'); seg(c, 2380, 1160, XE, 1160, 8, BLUE, 'square');
    for (let i = 1; i < 5; i++) seg(c, 2380, 1160 - i * 180, XE, 1160 - i * 180, 3, bl(0.3), 'butt');
    text(c, 'loss', 2420, 330, 48, BLUE); text(c, 'step', XE, 1235, 48, BLUE, { align: 'right' });
    const pts: number[][] = []; for (let x = 2380; x <= XE; x += 8) pts.push([x, pathY(x, 1)]);
    poly(c, pts, 14, BLUE);
  });

  // ---- 06 the marble leaves the glass at the same place, size and speed, and lands on the seesaw -----
  const sp = (t: number): V3 => { const [x, y] = marbleScreen(t); return [(x / 1920 - 0.5) * 60, 34.5 - (y / 1080 - 0.5) * 33.75, -26.75 + 1.6]; };
  const p0 = sp(tOut), p1 = sp(tOut + 0.01), v0: V3 = [(p1[0] - p0[0]) / 0.01, (p1[1] - p0[1]) / 0.01, 0];
  const rulerA = (t: number) => -(t < tBoss ? 0.1 - 0.21 * springStep(t - tServ, 2.6, 0.35) : lerp(-0.11, 0, prog(t, tBoss, tBoss + 0.5, ease.outCubic)));
  const onRuler = (t: number, lx: number): V3 => { const a = rulerA(t), ly = 0.35 + 1.5; return [14 + lx * Math.cos(a) - ly * Math.sin(a), 1.6 + lx * Math.sin(a) + ly * Math.cos(a), -10]; };
  const land = onRuler(tServ, -13.2), T = tServ - tOut, acc: V3 = [0, 1, 2].map((j) => (2 * (land[j]! - p0[j]! - v0[j]! * T)) / (T * T)) as V3;
  f.marble(tOut, tServ, (t) => { const u = t - tOut; return [0, 1, 2].map((j) => p0[j]! + v0[j]! * u + 0.5 * acc[j]! * u * u) as V3; });
  f.marble(tServ, tBoss + 0.9, (t) => { const p = onRuler(t, -13.2), u = t - tServ; p[1] += u < 0.5 ? 2.4 * Math.abs(Math.sin(u * 13)) * Math.exp(-u * 7) : 0; return p; });
  const tDark = tAlive + 1.12;
  const rulerTop = f.surface(30, 3.6, [0, 0.37, 0], { W: 1500, H: 180, parent: P.ruler });
  rulerTop.mesh.rotation.x = -Math.PI / 2;
  rulerTop.clip(tLoss, tChat, (c: CanvasRenderingContext2D, t: number) => {
    c.fillStyle = bl(0.1); c.fillRect(0, 0, 1500, 180);
    for (let i = 0; i <= 60; i++) seg(c, 25 + i * 24.17, 0, 25 + i * 24.17, i % 10 === 0 ? 44 : i % 5 === 0 ? 32 : 20, 4, BLUE, 'butt');
    drawLyric(c, L5.words.slice(0, 4), t, 215, 138, 62);
    drawLyric(c, L5.words.slice(4), t, 815, 138, 62, 'boss');
  });
  rulerTop.clip(tDark, tDark + 0.1, (c: CanvasRenderingContext2D) => { c.fillStyle = bl(0.1); c.fillRect(0, 0, 1500, 180); for (let i = 0; i <= 60; i++) seg(c, 25 + i * 24.17, 0, 25 + i * 24.17, i % 10 === 0 ? 44 : i % 5 === 0 ? 32 : 20, 4, BLUE, 'butt'); });
  f.anim((t) => {
    P.ruler.rotation.z = rulerA(t);
    // "boss": the king goes up
    const h = prog(t, tBoss, tBoss + 0.75);
    P.king.position.set(14.2 - 9 * h, 0.35 + 34 * h - 8 * h * h, 5 * h);
    P.king.rotation.z = -2.6 * h;
    P.king.visible = h < 1;
    const sq = t >= tServ ? pulse(t, tServ, 0.05) : 0;
    (P.marble as THREE.Mesh).scale.set(1 + 0.25 * sq, 1 - 0.4 * sq, 1 + 0.25 * sq);
    (P.marble as THREE.Mesh).quaternion.identity();
  });

  // ---- 07 the ruler's outline becomes the mouth of the shredder; the line goes in on a sheet ----------
  const morph = f.surface(34, 19.125, [14, 2.6, -10]);
  morph.mesh.rotation.set(-Math.PI / 2, 0, Math.PI);
  const ybK: Key[] = [[tChat + 0.1, 250], [cw[1]!.start - 0.1, 330], [cw[1]!.start + 0.15, 480], [cw[2]!.start, 520], [cw[3]!.start - 0.1, 560], [cw[3]!.start + 0.15, 730], [cw[4]!.start, 760], [tAlive - 0.12, 800], [tAlive + 0.1, 940], [tAlive + 0.5, 985, ease.linear], [tAlive + 0.9, 1750, ease.inQuad]];
  const panel = (c: CanvasRenderingContext2D, k: number, jit: number) => {
    c.fillStyle = bl(0.27 * k); c.fillRect(0, 0, 1920, 1080);
    if (k > 0.5) { c.globalAlpha = (k - 0.5) * 2; for (const [x, y] of [[90, 90], [1830, 90], [90, 990], [1830, 990]]) { ring(c, x!, y!, 22, 6, BLUE); seg(c, x! - 12, y! - 12, x! + 12, y! + 12, 6, BLUE); } text(c, 'AUTO FEED', 120, 400, 34, BLUE, { track: 8 }); c.globalAlpha = 1; }
    void jit;
  };
  const teeth = (c: CanvasRenderingContext2D, k: number, jit: number) => { c.fillStyle = PAPER; for (let i = 0; i < 28; i++) { const x = 150 + i * 59 + jit; c.beginPath(); c.moveTo(x, 441); c.lineTo(x + 29, 441 + (64 - (i % 2) * 8) * k); c.lineTo(x + 58, 441); c.fill(); } };
  morph.clip(tBoss + 0.3, tDark + 0.2, (c: CanvasRenderingContext2D, t: number) => {
    const k = prog(t, tChat - 0.3, tChat + 0.4, ease.inOutCubic), z = (1 + 0.08 * prog(t, tBoss + 0.9, tAlive + 0.8)) * (1 + 9.5 * prog(t, tAlive + 0.82, tAlive + 1.1, ease.inCubic));
    const yb = keys(t, ybK), jit = t > cw[1]!.start - 0.1 && t < tAlive + 0.9 ? (hash(frameIdx(t)) - 0.5) * 4 : 0;
    c.translate(960, 540); c.scale(z, z); c.translate(-960, -540);
    panel(c, k, jit);
    // the ruler, exactly where it lies; its outline darkens into a slot
    if (k < 1) { c.save(); c.globalAlpha = 1 - k; c.translate(960, 540); c.rotate(Math.PI); c.drawImage(rulerTop.canvas, -847, -101.5, 1694, 203); c.restore(); c.globalAlpha = 1 - k; rrect(c, 113, 438.5, 1694, 203, 0, undefined, BLUE, 6); c.globalAlpha = 1; }
    if (k > 0) { c.globalAlpha = k; rrect(c, 113, 441, 1694, 198, 34 * k, DARK); c.globalAlpha = 1; }
    // the sheet: each row is read above the slot, then goes in
    const yt = 1080 - yb;
    c.save(); c.beginPath(); c.rect(0, 540, 1920, 3000); c.clip();
    if (t > tChat) {
      rrect(c, 310 + jit, yt, 1300, 1400, 0, PAPER, BLUE, 5);
      drawLyric(c, cw.slice(0, 1), t, 380 + jit, yt + 150, 150);
      drawLyric(c, cw.slice(1, 3), t, 380 + jit, yt + 330, 130);
      drawLyric(c, cw.slice(3, 5), t, 380 + jit, yt + 500, 130);
      drawLyric(c, cw.slice(5), t, 380 + jit, yt + 670, 130, 'alive');
    }
    // the marble rolls off the ruler onto the sheet and rides it in
    const km = prog(t, tChat - 0.1, tChat + 0.55, ease.inOutCubic), sx = 1330 + jit, sy = yt + 625;
    const mx = lerp(960 + 13.55 * 56.47, sx, km), my = lerp(540, sy, km), r = 84.7 * (1 + 0.18 * Math.sin(Math.PI * km));
    if (km <= 0) { c.restore(); disc(c, mx, my, r, BLUE); c.save(); } else if (km < 1) { c.restore(); marble2(c, mx, my, r, BLUE, PAPER); c.save(); } else marble2(c, mx, my, r, BLUE, PAPER);
    c.restore();
    if (k > 0) teeth(c, k, jit);
  });
  f.anim((t) => { morph.mesh.visible = t >= tBoss + 0.9 && t < tDark + 0.05; });
  const strips = Array.from({ length: 17 }, (_, i) => ({ x: 70 + i * 112 + (hash(i, 3) - 0.5) * 30, v: 1700 + hash(i, 5) * 900, d: hash(i, 7) * 0.12, L: 700 + hash(i, 9) * 500, a: (hash(i, 11) - 0.5) * 0.06 }));
  P.Sshred.clip(tDark - 0.2, tUp + 0.8, (c: CanvasRenderingContext2D, t: number) => {
    const z = 1 + 9.5 * (1 - prog(t, tI - 0.05, tUp - 0.02, ease.inOutCubic));
    c.translate(960, 540); c.scale(z, z); c.translate(-960, -540);
    panel(c, 1, 0); rrect(c, 113, 441, 1694, 198, 34, DARK); teeth(c, 1, 0);
    const up = prog(t, tI, tUp + 0.1, ease.outCubic); if (up > 0) { c.fillStyle = PAPER; c.fillRect(960 - 200 * up, 520, 400 * up, 40); c.fillStyle = RED; c.fillRect(960 - 200 * up, 520, 400 * up, 8); }
    c.setTransform(c.getTransform().a / z, 0, 0, c.getTransform().d / z, 0, 0);
    const inside = 1 - prog(t, tI - 0.05, tI + 0.1);
    if (inside > 0) strips.forEach((s, i) => { const y = -s.L - 80 + s.v * Math.max(0, t - tDark + 0.1 - s.d); c.save(); c.translate(s.x, y); c.rotate(s.a); c.globalAlpha = inside; c.fillStyle = i === 8 ? RED : PAPER; c.fillRect(-34, 0, 68, s.L); c.restore(); });
  });
  // 08: what comes back out is a receipt. It rises, and the lens rises with it.
  const rec = f.surface(7, 12, [-24, 0, 16], { W: 350, H: 600 });
  rec.clip(tI - 0.3, tP + 0.6, (c: CanvasRenderingContext2D, t: number) => {
    c.fillStyle = RED; c.fillRect(0, 0, 350, 22); c.fillRect(0, 0, 14, 600); c.fillRect(336, 0, 14, 600);
    hook.words.slice(0, 3).forEach((w, i) => drawLyric(c, [w], t, 175, 170 + i * 165, Math.min(118, fitSize(w.w, F.archivo(100, 900), 286, 118)), 'upping', RED, rd(0.3), 'center'));
  });
  f.anim((t) => { const k = prog(t, tI - 0.02, tUp + 0.12, ease.outCubic) * (1 - prog(t, tP + 0.9, tP + 1.35, ease.inOutCubic)); rec.mesh.visible = k > 0.001; rec.mesh.position.y = 11 - 6 + 12.2 * k; });
  f.marble(tUp, tF + 0.14, (t) => { const u = prog(t, tUp, tUp + 0.6); return [lerp(-24, 4, u), 1.5 + lerp(21, 0, u * u) + 5 * Math.sin(Math.PI * u) * (1 - u), lerp(15, 36, u)]; });

  // ---- 08 the bottle goes over; 09 FOOM: the shock carries the marble to the card box ------------------
  f.anim((t) => { const k = prog(t, tP + 0.16, tP + 0.42, ease.inQuad); P.bottle.rotation.z = -1.42 * k; P.bottle.position.y = 3.0 * k; P.bottle.position.x = BOTTLE[0] + 3 * k; });
  const mouth: V3 = [BOTTLE[0] + 11.2, 2.2, BOTTLE[2]];
  f.tag("'cause the future", [mouth[0] - 6, 13, mouth[2]], { words: [0, 4], h: 0.09, to: tF + 0.5 });
  const foom = f.surface(34, 10.4, [6, 0.06, -2.8], { W: 920, H: 280, ink: { alpha: true } });
  foom.mesh.rotation.x = -Math.PI / 2;
  foom.draw = (c) => { c.clearRect(0, 0, 920, 280); c.font = font(F.archivo(125, 900), 215); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round'; c.lineWidth = 26; c.strokeStyle = RED; c.strokeText('FOOM', 460, 216); c.fillStyle = PAPER; c.fillText('FOOM', 460, 216); };
  const drop = f.ball(0.55, [0, -500, 0], { lit: [1, 0], flat: true, raw: true });
  const dots: { m: THREE.Mesh; tb: number; a: number; d: number }[] = [];
  for (let g = 0; g < 5; g++) for (let i = 0; i < 1 << g; i++) dots.push({ m: f.cyl(1.25 - g * 0.17, 0.06, [0, -500, 0], { lit: [1, 0], flat: true, crease: false, raw: true }, undefined, undefined, 14), tb: tF + (g * f.spb) / 2, a: hash(g, i, 2) * TAU, d: 7 + g * 6.5 + hash(g, i, 4) * 6 });
  // The shock reaches the marble and knocks it into a roll: a small hop, then along the front of the desk, round the
  // phone and the calculator, up an index card propped as a ramp, and off its end into the slot of the card box.
  const tHit = tF + 0.13, Tr = 1.02, MRAD = 1.5;
  const route = new THREE.CatmullRomCurve3(([[4, 36], [24, 38.5], [40, 33], [46, 18], [48, 6], [55, 0], [60, -2]] as number[][]).map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const RL = route.getLength(), kf = 0.57, vR0 = (RL * kf) / (1 - Math.exp(-kf * Tr)), vEnd = vR0 * Math.exp(-kf * Tr);
  const B0 = new THREE.Vector3(60, 0, -2), slot = new THREE.Vector3(72, 7.3, -16.6), rd2 = new THREE.Vector3(slot.x - B0.x, 0, slot.z - B0.z).normalize();
  const B1 = B0.clone().addScaledVector(rd2, 6).setY(4.2), rampL = Math.hypot(6, 4.2), tRamp = tHit + Tr, tJump = tRamp + rampL / vEnd, Tf = 0.26, tIn = tJump + Tf;
  const J = B1.clone().setY(4.2 + MRAD), fd = new THREE.Vector3(slot.x - J.x, 0, slot.z - J.z), GJ = 190, vy = (slot.y - J.y + 0.5 * GJ * Tf * Tf) / Tf;
  P.tIn = tIn;
  { // the ramp: an index card with one end on an eraser
    const g = f.group([(B0.x + B1.x) / 2, 2.1, (B0.z + B1.z) / 2]); g.lookAt(B1.x, 4.2, B1.z);
    f.anim((t) => { g.visible = er.visible = t < 32; }); // (cleared away once it has done its job: the tape runs here later)
    f.box(5.2, 0.12, rampL + 0.6, [0, -0.06, 0], { lit: [0, 0], shade: [0, 0.3] }, g);
    const er = f.box(5.2, 3.9, 1.8, [B1.x + rd2.x * 0.6, 0, B1.z + rd2.z * 0.6], { lit: [0, 0.3], shade: [0, 0.6] }); er.rotation.y = Math.atan2(rd2.x, rd2.z);
  }
  /** Position, direction of travel (xz) and distance rolled so far. */
  const roll = (t: number): { p: V3; d: [number, number]; s: number } => {
    if (t < tRamp) {
      const tau = Math.max(0, t - tHit), sd = (vR0 / kf) * (1 - Math.exp(-kf * tau)), u = clamp(sd / RL), q = route.getPointAt(u), tg = route.getTangentAt(u);
      return { p: [q.x, MRAD + (tau < 0.2 ? 2.0 * Math.sin((Math.PI * tau) / 0.2) : 0), q.z], d: [tg.x, tg.z], s: sd };
    }
    if (t < tJump) { const u = (t - tRamp) / (tJump - tRamp); return { p: [lerp(B0.x, B1.x, u), MRAD + 4.2 * u, lerp(B0.z, B1.z, u)], d: [rd2.x, rd2.z], s: RL + rampL * u }; }
    const tau = Math.min(t, tIn) - tJump;
    return { p: [J.x + (fd.x * tau) / Tf, J.y + vy * tau - 0.5 * GJ * tau * tau, J.z + (fd.z * tau) / Tf], d: [rd2.x, rd2.z], s: RL + rampL + vEnd * tau };
  };
  const sweep = (t: number): V3 => roll(t).p;
  f.marble(tHit, tIn, sweep);
  // marks on the marble, so that it visibly turns as far as it travels
  for (const q of [[0, 1, 0], [0.9, -0.3, 0.3], [-0.5, -0.4, 0.75]] as V3[]) f.ball(0.42, [q[0] * 1.22, q[1] * 1.22, q[2] * 1.22], { lit: [0, 0], flat: true, glow: true }, P.marble);
  const yAxis = new THREE.Vector3();
  f.anim((t) => {
    const mb = P.marble as THREE.Mesh;
    if (t >= tHit && t < tIn) {
      const r = roll(t);
      mb.quaternion.setFromAxisAngle(yAxis.set(r.d[1], 0, -r.d[0]).normalize(), r.s / MRAD);
      // it gives a little where it lands: after the hop, and at the foot of the ramp
      const sq = Math.max(t >= tHit + 0.2 ? pulse(t, tHit + 0.2, 0.045) : 0, t >= tRamp ? 0.6 * pulse(t, tRamp, 0.04) : 0);
      mb.scale.set(1 + 0.16 * sq, 1 - 0.26 * sq, 1 + 0.16 * sq);
    }
  });
  f.anim((t) => {
    const u = prog(t, tF - 0.3, tF, ease.inQuad);
    drop.position.set(mouth[0], t > tF - 0.3 && t < tF ? lerp(mouth[1], 0.3, u) : -500, mouth[2]);
    const R = 170 * prog(t, tF, tF + 1.0, ease.outCubic);
    P.top.material.uniforms.ring.value.set(mouth[0], mouth[2], t >= tF && t < tF + 1.0 ? R : -1, 5 * (1 - prog(t, tF + 0.2, tF + 1.0)) + 0.4);
    for (const d of dots) { const k = prog(t, d.tb, d.tb + 0.3, ease.outCubic); d.m.position.set(mouth[0] + Math.cos(d.a) * d.d * k, t >= d.tb ? 0.05 + 2.5 * Math.sin(Math.PI * k) : -500, mouth[2] + Math.sin(d.a) * d.d * k * 0.8); }
    const fk = prog(t, tF, tF + 0.22, ease.outBack); foom.mesh.visible = fk > 0 && t < 59; foom.mesh.scale.setScalar(Math.max(0.01, fk * (1 + 0.15 * prog(t, tF + 0.2, tF + 2)) * (1 - prog(t, tF + 1.5, tF + 1.9))));
  });

  // ---- camera: one move ---------------------------------------------------------------------------------
  const mon = f.frame(P.Smon), mo = f.frame(morph);
  f.key({ t: 0, ...mon });
  f.key({ t: tOut - 0.1, ...mon });
  f.key({ t: tServ - 0.2, pos: [14, 30, 10], tgt: [14, 2, -10] });
  f.key({ t: tBoss + 0.05, pos: [14, 29, 9], tgt: [14, 2, -10] });
  f.key({ t: tBoss + 0.9, pos: mo.pos, tgt: mo.tgt, up: [0, 0, -1], roll: Math.PI });
  f.key({ t: tBoss + 0.901, ...mo });
  f.key({ t: tDark - 0.001, ...mo });
  const sh = f.frame(P.Sshred);
  f.key({ t: tDark, ...sh });
  f.key({ t: tI - 0.03, ...sh });
  f.key({ t: tUp + 0.1, pos: [-37, 21, 54], tgt: [-32, 15, 6] });
  f.key({ t: tMy + 0.12, pos: [-38, 20, 50], tgt: [-34, 12, 0] });
  f.key({ t: tP + 0.12, pos: [-40, 15, 6], tgt: [-39, 6, -34] });
  f.key({ t: tP + 0.75, pos: [-39, 16, 9], tgt: [-38.5, 5.5, -32] });
  f.key({ t: tF - 0.3, pos: [0, 64, 88], tgt: [-8, 1, -6] });
  f.key({ t: tF + 0.25, pos: [2, 62, 86], tgt: [-6, 1, -4] });
  // then stay on the marble all the way to the box and in through the slot
  // the lens lets the marble lead: it aims a little ahead of it and arrives a little after it
  for (const [dt, off] of [[0.32, [-6, 17, 32]], [0.62, [-9, 14, 28]], [0.92, [-11, 12, 24]], [tJump - tHit + 0.05, [-5, 6, 21]]] as [number, V3][]) {
    const a = sweep(tHit + dt - 0.13), b2 = sweep(tHit + dt + 0.12);
    f.key({ t: tHit + dt, pos: [a[0] + off[0], a[1] + off[1], a[2] + off[2]], tgt: [b2[0], b2[1] + 1, b2[2]] });
  }

  // plates jump on the kick; a harder knock on the big hits
  f.post((t, p) => {
    const k = f.audio.hit('kick', t, 0.07);
    const hit = pulse(t, tF, 0.12) * (t >= tF ? 1 : 0) + pulse(t, tP, 0.1) * (t >= tP ? 1 : 0) + pulse(t, tDrop, 0.08) * (t >= tDrop ? 1 : 0) + pulse(t, tServ, 0.06) * (t >= tServ ? 1 : 0);
    p.misreg = [1.2 + k * 1.2 + hit * 12, -0.8 - k * 0.8 - hit * 5];
  });
  void [THREE, L3];
}
