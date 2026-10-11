// Shots 10-20: the Chinese room, shrooms, under the desk, shinigami labels, the train,
// the coffee singularity, descent, atoms, Sydney behind bars, the second wide.
import * as THREE from 'three';
import type { Film, V3 } from './core';
import { bl, BLUE, DARK, PAPER, RED, ik } from './ink';
import { disc, ring, seg, poly, rrect, text, partial, along, marble2 } from './d2';
import { F, fitSize, font, measure } from '../engine/type';
import { drawLyric, arcLyric } from './lyric';
import { inkMat } from './ink';
import { clamp, ease, hash, keys, lerp, mulberry32, prog, pulse, springStep, TAU } from '../engine/util';

/** Points along a speech-bubble outline (rounded box with a tail), n of them, around (960, 500). */
export function bubblePath(c: CanvasRenderingContext2D, dx = 0, dy = 0) {
  c.beginPath(); c.roundRect(510 + dx, 300 + dy, 900, 400, 120);
  c.moveTo(640 + dx, 696 + dy); c.lineTo(560 + dx, 820 + dy); c.lineTo(760 + dx, 698 + dy);
}
function bubblePts(n: number): number[][] {
  const out: number[][] = [], x0 = 510, y0 = 300, w = 900, h = 400, r = 120;
  const per = 2 * (w - 2 * r) + 2 * (h - 2 * r) + TAU * r;
  for (let i = 0; i < n; i++) {
    let s = (i / n) * per;
    const segs: [number, (u: number) => number[]][] = [
      [w - 2 * r, (u) => [x0 + r + u, y0]], [(Math.PI / 2) * r, (u) => [x0 + w - r + Math.sin(u / r) * r, y0 + r - Math.cos(u / r) * r]],
      [h - 2 * r, (u) => [x0 + w, y0 + r + u]], [(Math.PI / 2) * r, (u) => [x0 + w - r + Math.cos(u / r) * r, y0 + h - r + Math.sin(u / r) * r]],
      [w - 2 * r, (u) => [x0 + w - r - u, y0 + h]], [(Math.PI / 2) * r, (u) => [x0 + r - Math.sin(u / r) * r, y0 + h - r + Math.cos(u / r) * r]],
      [h - 2 * r, (u) => [x0, y0 + h - r - u]], [(Math.PI / 2) * r, (u) => [x0 + r - Math.cos(u / r) * r, y0 + r - Math.sin(u / r) * r]],
    ];
    for (const [L, fn] of segs) { if (s <= L) { out.push(fn(s)); break; } s -= L; }
  }
  return out;
}
/** A made-up glyph: a few strokes in a cell. Not any real script. */
function squiggle(c: CanvasRenderingContext2D, x: number, y: number, s: number, seed: number, col: string) {
  const r = mulberry32(seed);
  for (let k = 0; k < 3; k++) {
    const pts: number[][] = [];
    let px = x + (r() - 0.5) * s, py = y + (r() - 0.5) * s;
    for (let i = 0; i < 3; i++) { pts.push([px, py]); if (r() < 0.5) px = x + (r() - 0.5) * s; else py = y + (r() - 0.5) * s; }
    poly(c, pts, s * 0.12, col);
  }
}

export function seq2(f: Film) {
  const P = f.P, spb = f.spb;
  const tF = f.at("'cause the future", 'FOOM');
  const tTrap = f.at('Trapped'), tChinese = f.at('Trapped', 'Chinese'), tRoom = f.at('Trapped', 'room'), tShrooms = f.at('with a bag', 'shrooms');
  const tSee = f.at('See through'), tShog = f.at('See through', 'shoggoth'), tShini = f.at('with your shinigami', 'shinigami'), tEyes = f.at('with your shinigami', 'eyes');
  const bag = f.line('with a bag'), see = f.line('See through');
  const tLies = f.at('See through', 'lies');
  const tStable = f.at('We had a stable'), tBut = f.at('But now'), tNow = f.at('But now', 'now'), tSing = f.at('But now', 'singularity'), tBegun = f.at('But now', 'begun');
  const tAnd = f.at("And you're optimizing"), tOpt = f.at("And you're optimizing", 'optimizing'), tFeel = f.at('I feel'), tAtoms = f.at('I feel', 'atoms'), tRear = f.at('I feel', 'rearranging');
  const tSyd = f.at('Sydney'), syd = f.line('Sydney').words, tFree = f.at('Sydney', 'free');
  const tI2 = f.at("I'm upping", 0, 1), tP2 = f.at("I'm upping", 'P(doom)', 1), tHear = f.at('I hear');

  // ---- 10 the room, 11 shrooms ------------------------------------------------------------------
  const iso = (x: number, y: number, z = 0): number[] => [960 + (x - y) * 0.87, 640 + (x + y) * 0.5 - z];
  const quad = (c: CanvasRenderingContext2D, p: number[][], fill: string, stroke = BLUE, lw = 5) => poly(c, p, lw, stroke, true, fill);
  P.Sroom.clip(tTrap - 0.5, tSee + 0.4, (c: CanvasRenderingContext2D, t: number) => {
    const S = 400, Hh = 430;
    quad(c, [iso(-S, -S, Hh), iso(S, -S, Hh), iso(S, -S), iso(-S, -S)], bl(0.14));
    quad(c, [iso(-S, -S, Hh), iso(-S, S, Hh), iso(-S, S), iso(-S, -S)], bl(0.26));
    quad(c, [iso(-S, -S), iso(S, -S), iso(S, S), iso(-S, S)], bl(0.07));
    quad(c, [iso(-S, 60, 210), iso(-S, 180, 210), iso(-S, 180, 190), iso(-S, 60, 190)], DARK, DARK, 2);
    quad(c, [iso(60, -S, 210), iso(180, -S, 210), iso(180, -S, 190), iso(60, -S, 190)], DARK, DARK, 2);
    // desk and the rule book
    const d0 = 150;
    quad(c, [iso(-d0, -d0, 120), iso(d0, -d0, 120), iso(d0, d0, 120), iso(-d0, d0, 120)], bl(0.3));
    quad(c, [iso(-d0, d0, 120), iso(d0, d0, 120), iso(d0, d0), iso(-d0, d0)], bl(0.55));
    quad(c, [iso(d0, -d0, 120), iso(d0, d0, 120), iso(d0, d0), iso(d0, -d0)], bl(0.42));
    { const me = iso(-70, -70, 120), u = t - (P.tIn as number);
      if (u >= 0) {
        const kfl = clamp(u / 0.4), kr = prog(u, 0.4, 1.0, ease.outCubic);
        let x = lerp(1010, me[0]! + 46, kfl) - 46 * kr, y = lerp(1220, me[1]! - 52 + 26, kfl * kfl) - 26 * kr, r = lerp(200, 58, ease.outQuad(kfl)) - 2 * kr;
        const bu = (u - 0.4) / 0.24; if (bu > 0 && bu < 1) y -= 44 * Math.sin(Math.PI * bu);
        const sq = u >= 0.4 ? pulse(u, 0.4, 0.04) : 0;
        c.save(); c.translate(x, y + r); c.scale(1 + 0.18 * sq, 1 - 0.28 * sq); marble2(c, 0, -r, r, BLUE, PAPER); c.restore(); void x;
      } }
    quad(c, [iso(-30, 20, 124), iso(60, 20, 124), iso(60, 130, 124), iso(-30, 130, 124)], PAPER, BLUE, 4);
    quad(c, [iso(60, 20, 124), iso(140, 20, 124), iso(140, 130, 124), iso(60, 130, 124)], PAPER, BLUE, 4);
    for (let i = 0; i < 5; i++) { const a = iso(-18 + 0, 34 + i * 20, 124), b = iso(48, 34 + i * 20, 124); seg(c, a[0]!, a[1]!, b[0]!, b[1]!, 4, bl(0.5)); const a2 = iso(72, 34 + i * 20, 124), b2 = iso(128, 34 + i * 20, 124); seg(c, a2[0]!, a2[1]!, b2[0]!, b2[1]!, 4, bl(0.5)); }
    // a slip comes in; a slip goes out. Nobody in here knows what either one says.
    const slip = (k: number, from: number[], to: number[], seed: number, col: string) => {
      if (k <= 0 || k >= 1) return;
      const x = lerp(from[0]!, to[0]!, k), y = lerp(from[1]!, to[1]!, k) - 60 * Math.sin(Math.PI * k);
      rrect(c, x - 95, y - 34, 190, 68, 4, PAPER, BLUE, 4);
      for (let i = 0; i < 3; i++) squiggle(c, x - 56 + i * 56, y, 40, seed + i, col);
    };
    slip(prog(t, tRoom, tRoom + 0.3, ease.outCubic) * 0.999, iso(-S, 120, 200), iso(20, 150, 150), 7, DARK);
    slip(prog(t, tRoom + 0.4, tRoom + 0.8, ease.inCubic), iso(100, 150, 150), iso(120, -S, 200), 31, RED);
    const shroom = (x: number, y: number, sc: number, k: number) => {
      if (k <= 0) return;
      const h = 110 * sc * k, w = 70 * sc * k;
      rrect(c, x - w * 0.16, y - h, w * 0.32, h, 8, PAPER, BLUE, 4);
      c.beginPath(); c.ellipse(x, y - h, w, w * 0.62, 0, Math.PI, 0); c.closePath(); c.fillStyle = RED; c.fill(); c.lineWidth = 4; c.strokeStyle = BLUE; c.stroke();
      disc(c, x - w * 0.4, y - h - w * 0.25, w * 0.13, PAPER); disc(c, x + w * 0.25, y - h - w * 0.36, w * 0.1, PAPER);
    };
    [[20, 60, 1.3], [100, 100, 1], [-260, -40, 0.9], [250, -120, 1.2]].forEach(([x, y, sc], i) => { const p = iso(x!, y!, x! > -40 && x! < 150 && y! > 0 && y! < 140 ? 124 : 0); shroom(p[0]!, p[1]!, sc!, springStep(t - tShrooms - 0.1 - i * 0.05, 3.2, 0.3)); });
    // the bag: the line is printed on it, and its last word is what comes out
    const bd = prog(t, bag.start - 0.35, bag.start - 0.08, ease.outBack), bx = 640, by = 690 + (1 - bd) * 420, bw = 640, bh = 350;
    if (bd > 0) {
      [[790, 1.5], [960, 2.0], [1130, 1.4]].forEach(([x, sc], i) => shroom(x!, by + 34, sc!, springStep(t - tShrooms - i * 0.06, 3.2, 0.3)));
      const top: number[][] = [[bx, by + bh], [bx, by + 26]]; for (let i = 0; i <= 16; i++) top.push([bx + (bw * i) / 16, by + (i % 2 ? 0 : 26)]); top.push([bx + bw, by + bh]);
      poly(c, top, 6, BLUE, true, PAPER);
      drawLyric(c, bag.words.slice(0, 3), t, bx + bw / 2, by + 150, 92, undefined, BLUE, bl(0.3), 'center');
      drawLyric(c, bag.words.slice(3), t, bx + bw / 2, by + 262, 92, 'shrooms', BLUE, bl(0.3), 'center');
    }
    // one thread of mycelium leaves the tallest cap and heads for the lens: follow it
    const g = prog(t, tShrooms + 0.45, tShrooms + 0.74, ease.inQuad);
    if (g > 0) { const pts: number[][] = []; for (let k = 0; k <= 20; k++) { const u = (k / 20) * g; pts.push([960 + 700 * u, by - 180 - 160 * Math.sin(Math.PI * u) + 640 * u * u]); } poly(c, pts, 12 + 40 * g, BLUE); disc(c, pts[pts.length - 1]![0]!, pts[pts.length - 1]![1]!, 16 + 30 * g, RED); }
  });
  f.post((t, p) => {
    const k = prog(t, tShrooms + 0.42, tShrooms + 0.55) * (1 - prog(t, tShrooms + 0.7, tShrooms + 0.9));
    if (k <= 0) return;
    p.plateRot = 0.08 * k * Math.sin((t - tShrooms) * 7);
    p.misreg = [18 * k * Math.cos((t - tShrooms) * 9), 14 * k * Math.sin((t - tShrooms) * 11)];
    p.dot = 7 + 5 * k;
  });

  // ---- 12 under the desk, 13 the labels ---------------------------------------------------------
  f.anim((t) => {
    P.leds.forEach((m: THREE.Mesh, i: number) => { const on = t > tShini + i * 0.2 && t < f.at('Too late now', 'fuse') + 0.2; (m.material as THREE.ShaderMaterial).uniforms.lit!.value.set(on ? 1 : 0, on ? 0 : 0.5); });
  });
  // 13: what the note was covering is an eye. The line is lettered round it; three more open on its last three words.
  const tLift = tLies + 0.45, E0: V3 = [-25, -19, 38], sw = f.line('with your shinigami').words;
  const mkEye = (p: V3, r: number) => { const g = f.group(p); f.ball(r, [0, 0, 0], { lit: [0, 0], flat: true, glow: true }, g); f.ball(r * 0.5, [0, 0, r * 0.72], { lit: [1, 0], raw: true, flat: true, glow: true }, g); f.ball(r * 0.2, [0, 0, r * 1.14], { lit: [1, 1], raw: true, flat: true, glow: true }, g); return g; };
  const big = mkEye(E0, 5.2), small = ([[-47, -27, 37], [-7, -21, 37], [-10, -33, 38]] as V3[]).map((p) => mkEye(p, 2.4));
  const collar = f.surface(30, 30, [E0[0], E0[1], E0[2] + 3.4], { W: 900, H: 900, ink: { alpha: true } });
  collar.clip(tLift, tEyes + 1, (c: CanvasRenderingContext2D, t: number) => {
    c.clearRect(0, 0, 900, 900);
    c.beginPath(); c.arc(450, 450, 400, 0, TAU); c.arc(450, 450, 255, 0, TAU, true); c.fillStyle = PAPER; c.fill('evenodd');
    ring(c, 450, 450, 400, 6, BLUE); ring(c, 450, 450, 255, 6, BLUE);
    arcLyric(c, sw, t, 450, 450, 300, 78, 'eyes');
  });
  f.anim((t) => {
    const off = 1 - prog(t, tEyes + 0.5, tEyes + 0.7);
    big.scale.setScalar(Math.max(0.001, springStep(t - tLift - 0.3, 3, 0.45) * off));
    small.forEach((g, i) => g.scale.setScalar(Math.max(0.001, springStep(t - sw[i + 1]!.start, 3.4, 0.4) * off)));
    const ck = prog(t, tLift + 0.55, tLift + 0.85, ease.outBack) * off; collar.mesh.visible = ck > 0.01; collar.mesh.scale.setScalar(Math.max(0.001, ck));
  });
  // 14: one label per beat, each on the thing it reads; the last one rides the train and hands over to its lyric
  const b0 = f.beat(tEyes + 0.85);
  // the kill switch card stands in front of the monitor's top edge, in clear air, with a lead to the button
  const lead = f.box(0.45, 0.45, 1, [0, 0, 0], { lit: [0, 1], flat: true, crease: false });
  { const A = new THREE.Vector3(8, 60.5, -20), B = new THREE.Vector3(17, 60.5, -40); lead.position.copy(A).add(B).multiplyScalar(0.5); lead.scale.z = A.distanceTo(B); lead.lookAt(B); }
  const labels: [string, (t: number) => string, (t: number) => V3][] = [
    ['COFFEE', (t) => `00:11:${String(59 - Math.floor((t - tEyes) * 4) % 60).padStart(2, '0')}`, () => [-39, 15, -6]],
    ['LAMP', () => '2 YEARS', () => [-66, 39, -20]],
    ['KILL SWITCH', () => 'NEVER PRESSED', () => [-10, 60.5, -20]],
    ['TRAINING RUN', (t) => `${3 + Math.floor((t - tEyes) / 1.2)} LAPS`, (t) => { const p = P.trainAt(t).c; return [p.x + 9, 11, p.z]; }],
  ];
  labels.forEach(([name, val, at], i) => {
    const s = f.surface(520 / 164, 1, [0, 0, 0], { W: 520, H: 164 });
    const t0 = b0 + i * spb, t1 = i < 3 ? Math.min(t0 + 2 * spb - 0.08, 37.08) : tStable - 0.32;
    s.clip(t0 - 0.1, t1 + 0.3, (c: CanvasRenderingContext2D, t: number) => {
      rrect(c, 4, 4, 512, 156, 6, PAPER, BLUE, 6);
      text(c, name, 22, 58, 40, BLUE, { fam: F.mono(700), track: 3 });
      const v = val(t); text(c, v, 22, 132, Math.min(60, fitSize(v, F.archivo(100, 900), 470, 60)), BLUE, { fam: F.archivo(100, 900) });
    });
    f.late((t) => {
      const k = Math.min(prog(t, t0, t0 + 0.14, ease.outBack), 1 - prog(t, t1, t1 + 0.1));
      s.mesh.visible = k > 0.01;
      if (i === 2) lead.visible = k > 0.5;
      if (!s.mesh.visible) return;
      const p = at(t); s.mesh.position.set(p[0], p[1], p[2]); s.mesh.quaternion.copy(f.cam.quaternion);
      const d = s.mesh.position.clone().sub(f.cam.position).dot(f.cam.getWorldDirection(new THREE.Vector3()));
      s.mesh.scale.setScalar(Math.max(0.001, k * (i === 2 ? 0.095 : 0.12) * 2 * Math.max(1, d) * Math.tan((f.cam.fov * Math.PI) / 360)));
    });
  });

  // ---- 15 the marble rides the train; 16 a jolt throws it, at the train's own heading, into the coffee ----
  const carAt = (t: number): V3 => { const p = P.trainAt(t).c; return [p.x, 3.4, p.z]; };
  const CUP: V3 = [-39, 7.6, -6];
  // the moment on the bend when the car is heading straight at the cup
  let tL = tNow, best = 9;
  for (let t = tNow - 0.5; t < tNow + 0.3; t += 0.004) { const q = P.trainAt(t).c, dx = CUP[0] - q.x, dz = CUP[2] - q.z, n = Math.hypot(dx, dz), cr = Math.abs((Math.sin(q.h) * dz - Math.cos(q.h) * dx) / n); if (cr < best && Math.sin(q.h) * dx + Math.cos(q.h) * dz > 0) { best = cr; tL = t; } }
  const c0 = carAt(tL), fdx = CUP[0] - c0[0], fdz = CUP[2] - c0[2], FD = Math.hypot(fdx, fdz), TF = FD / 46, GF = 200, vyF = (CUP[1] - c0[1] + 0.5 * GF * TF * TF) / TF, tSplash = tL + TF;
  const flight = (t: number): V3 => { const u = clamp(t - tL, 0, TF); return [c0[0] + (fdx * u) / TF, c0[1] + vyF * u - 0.5 * GF * u * u, c0[2] + (fdz * u) / TF]; };
  f.marble(36.2, tL, carAt);
  f.marble(tL, tSplash, flight);
  { const q = P.trainAt(tL).c, clipOnRail = f.box(4.4, 0.5, 0.7, [q.x, 0.35, q.z], { lit: [0, 1], flat: true, crease: false }); clipOnRail.rotation.y = q.h + 0.25; }
  f.anim((t) => { const k = t >= tL ? pulse(t, tL, 0.06) : 0; P.car.position.y += 1.3 * k; P.car.rotation.x = -0.25 * k; });
  f.tag('But now the singularity', [c0[0] + 2, 13, c0[2]], { words: [0, 3], to: tSplash - 0.05 });

  // in the cup the picture is tiny (300 px to the centimetre), so the marble arrives enormous and sinks
  const sing = f.line('But now the singularity').words.slice(3), opt = f.line("And you're optimizing").words, atoms = f.line('I feel my atoms').words;
  const ex = fdx / FD, ey = fdz / FD, phi0 = Math.atan2(-ex, ey); // entry heading on the canvas; the orbit starts tangent to it
  // the loss landscape: a world we travel across, as on the circuit board
  const MIN = [2600, 1500], W = [[400, 300], [760, 520], [980, 470], [1300, 760], [1420, 700], [1750, 1000], [1830, 930], [2150, 1220], [2230, 1160], [2480, 1420], MIN];
  const tLand = tAnd - 0.1, Lf = (t: number) => Math.pow(prog(t, tLand + 0.3, tAtoms), 2.4);
  const view2 = (t: number): [number, number, number] => {
    const L = Lf(t), m = along(W, L), a = along(W, Math.min(1, L + 0.03)), z = keys(t, [[tOpt, 1], [tAtoms - 1.0, 0.74], [tAtoms - 0.05, 1]]);
    const hk = prog(t, tAtoms - 0.7, tAtoms - 0.05, ease.inOutCubic), lead = 1 - hk;
    const back = (360 / z) * prog(t, opt[3]!.start - 0.5, opt[3]!.start) * lead;
    return [lerp(m[0]! + (a[0]! - m[0]!) * 2.2 * lead - back, MIN[0]!, hk), lerp(m[1]! + (a[1]! - m[1]!) * 2.2 * lead, MIN[1]! - 20, hk), z];
  };
  const N = 260, rnd = mulberry32(77), HX = 960, HY = 560, fwd = Math.atan2(80, 120);
  const E = Array.from({ length: N }, () => { const a = fwd + (rnd() - 0.5) * 2.6, r = 110 + rnd() * 480; return [HX + Math.cos(a) * r * 1.2, HY + Math.sin(a) * r * 0.8]; });
  const G = Array.from({ length: N }, (_, i) => [960 + ((i % 26) - 12.5) * 46, 520 + (Math.floor(i / 26) - 4.5) * 40]);
  const B = bubblePts(N).map((q, i) => (i % 9 === 4 ? [960 + Math.cos(i) * 26, 440 + Math.sin(i) * 26] : q)); // a few gather where the marble will be
  const word = atoms[4]!, wf = F.archivo(100, 900), wsz = 104, wxs: number[] = [], perm = [6, 2, 9, 0, 4, 10, 1, 7, 3, 8, 5];
  { let x = 0; for (const ch of word.w) { wxs.push(x); x += measure(ch, wf, wsz); } wxs.push(x); }
  P.Scup.clip(tBut - 0.3, tSyd + 0.2, (c: CanvasRenderingContext2D, t: number) => {
    const cx = 960, cy = 540;
    if (t < tBegun + 0.66) {
      c.fillStyle = bl(0.92); c.fillRect(0, 0, 1920, 1080);
      // nothing turns until the marble lands; then its own motion winds the cup up
      const tau = t - tSplash, wind = prog(t, tSplash, tBegun, ease.inQuad), rot = 0.2 * (t - tBut) + Math.max(0, tau) * 1.1 + wind * 14;
      const pts: number[][] = [];
      for (let i = 0; i < 260; i++) { const th = i * 0.11, r = 22 * Math.pow(th, 1.15) * (1 - wind * 0.82); pts.push([cx + Math.cos(th + rot) * r, cy + Math.sin(th + rot) * r * 0.9]); }
      poly(c, pts, 22 * (1 - wind * 0.6), ik(0, 0.45));
      // the line is written in cream round the cup; after "begun" it goes down with everything else
      const kin = prog(t, tBegun + 0.32, tBegun + 0.64, ease.inCubic);
      c.save(); c.translate(cx, cy); c.rotate(kin * 5); c.scale(1 - kin * 0.9, 1 - kin * 0.9); arcLyric(c, sing.slice(0, 1), t, 0, 0, 385, 100, 'singularity', PAPER, ik(0, 0.6)); arcLyric(c, sing.slice(1), t, 0, 0, 215, 100, undefined, PAPER, ik(0, 0.6)); c.restore();
      if (tau >= 0) {
        if (tau < 0.6) ring(c, cx, cy, 480 + 700 * tau, 26 * (1 - tau / 0.6), PAPER);
        const mk = prog(t, tSplash + 0.25, tBegun, ease.inQuad), ph = phi0 + 2.6 * tau + mk * 13, ro = 230 * (1 - mk) * prog(tau, 0, 0.3, ease.outCubic);
        const r = lerp(450, 56, prog(tau, 0, 0.38, ease.outCubic)) * (1 - 0.72 * mk), x = cx + Math.cos(ph) * ro, y = cy + Math.sin(ph) * ro * 0.9;
        disc(c, x, y, r, ik(0, 0.5)); ring(c, x, y, r, 6, PAPER); disc(c, x - r * 0.32, y - r * 0.34, r * 0.2, PAPER);
      }
      disc(c, cx, cy, 70 * prog(t, tSplash + 0.3, tBegun, ease.inCubic) + 1500 * prog(t, tBegun + 0.3, tBegun + 0.64, ease.inCubic), DARK);
      return;
    }
    // through the middle: the far side is a loss landscape, and the marble drops onto its highest ground
    const open = prog(t, tBegun + 0.66, tLand - 0.03, ease.outCubic), [vx, vy, vz] = view2(t);
    c.fillStyle = DARK; c.fillRect(0, 0, 1920, 1080);
    c.save(); c.beginPath(); c.arc(cx, cy, 1300 * open, 0, TAU); c.clip();
    c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080);
    c.save(); c.translate(960, 540); c.scale(vz, vz); c.translate(-vx, -vy);
    const fade = 1 - prog(t, tAtoms + 0.05, tAtoms + 0.6);
    if (fade > 0) for (let i = 17; i >= 0; i--) {
      const pts: number[][] = [];
      for (let k = 0; k < 90; k++) { const th = (k / 90) * TAU, r = (70 + i * 165) * (1 + 0.12 * Math.sin(3 * th + i) + 0.08 * Math.sin(5 * th - i * 2)); pts.push([MIN[0]! + Math.cos(th) * r * 1.2, MIN[1]! + Math.sin(th) * r * 0.8]); }
      poly(c, pts, 5, bl(fade), true, i === 0 ? bl(0.3 * fade) : undefined);
    }
    if (t < tAtoms) {
      const L = Lf(t), head = along(W, L);
      // the first half of the line is a label on the map, where the descent starts
      drawLyric(c, opt.slice(0, 3), t, 300, 150, 80, undefined, BLUE, bl(lerp(0.07, 0.3, prog(t, tAnd - 0.4, tAnd - 0.1))));
      poly(c, partial(W, L), 12, BLUE);
      // the marble: dropped in, one bounce, then rolling, slowly at first
      const dk = prog(t, tBegun + 0.66, tLand, ease.inQuad), bu = (t - tLand) / 0.26, bounce = bu > 0 && bu < 1 ? 46 * Math.sin(Math.PI * bu) : 0, sq = t >= tLand ? pulse(t, tLand, 0.045) : 0;
      const r = lerp(250, 44, dk), mx = head[0]!, my = head[1]! - 44 - bounce - 300 * (1 - dk);
      c.save(); c.translate(mx, my + r); c.scale(1 + 0.18 * sq, 1 - 0.28 * sq); marble2(c, 0, -r, r, BLUE, PAPER); c.restore();
      // "accelerating" rides behind it, and is pulled longer the faster it goes
      const acc = opt[3]!, v = (Lf(t) - Lf(t - 0.05)) * 20, af = F.archivo(100, 900), on = t >= acc.start - 0.02, as = 96 / vz;
      // (never longer than the room there is for it on screen)
      const room = mx - 90 / vz - (vx - 960 / vz + 70 / vz) - measure(acc.w, af, as), tr = Math.max(0, Math.min(46 / vz * clamp(v * 2.6) * prog(t, acc.start, acc.start + 0.4), room / acc.w.length));
      c.font = font(af, as); c.textAlign = 'right'; c.textBaseline = 'alphabetic'; c.letterSpacing = `${tr}px`;
      c.fillStyle = on ? BLUE : bl(lerp(0, 0.3, prog(t, acc.start - 0.5, acc.start - 0.1)));
      c.fillText(acc.w, mx - 90 / vz - tr, my - 70 / vz); c.letterSpacing = '0px';
      for (let i = 0; i < 3; i++) if (v > 0.12 * (i + 1)) seg(c, mx - 70, my - 20 + i * 26, mx - 70 - 500 * v, my - 20 + i * 26, 6, BLUE);
      c.restore();
    } else {
      c.restore();
      // atoms: thrown on the way it was going, then a grid, then a speech bubble
      const k1 = prog(t, tAtoms, tAtoms + 0.4, ease.outExpo), k2 = prog(t, tRear, tRear + 0.4, ease.inOutCubic), k3 = prog(t, tRear + 0.62, tRear + 1.08, ease.inOutCubic);
      for (let i = 0; i < N; i++) {
        const wob = 10 * (1 - k2), ph = i * 1.7 + t * 3;
        let x = lerp(HX, E[i]![0]! + Math.cos(ph) * wob, k1), y = lerp(HY, E[i]![1]! + Math.sin(ph) * wob, k1);
        x = lerp(lerp(x, G[i]![0]!, k2), B[i]![0]!, k3); y = lerp(lerp(y, G[i]![1]!, k2), B[i]![1]!, k3);
        disc(c, x, y, 9, BLUE);
      }
    }
    // the line is the map's title; its last word starts out of order and sorts itself as it is sung
    const lk = Math.min(prog(t, atoms[0]!.start - 0.35, atoms[0]!.start - 0.1), 1 - prog(t, tSyd - 0.25, tSyd - 0.05));
    if (lk > 0) {
      c.globalAlpha = lk;
      rrect(c, 610, 120, 700, 124, 6, PAPER, BLUE, 5);
      drawLyric(c, atoms.slice(0, 4), t, 960, 208, 84, 'atoms', BLUE, bl(0.3), 'center');
      const kk = prog(t, tRear - 0.02, tRear + 0.32, ease.inOutCubic), tw = wxs[wxs.length - 1]!, x0 = 960 - tw / 2;
      rrect(c, x0 - 40, 880, tw + 80, 140, 6, PAPER, BLUE, 5);
      c.font = font(wf, wsz); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = t >= tRear - 0.02 ? BLUE : bl(0.3);
      [...word.w].forEach((ch, i) => { const hop = Math.sin(Math.PI * kk) * 46 * (i % 2 ? 1 : -1); c.fillText(ch, x0 + lerp(wxs[perm[i % perm.length]!]!, wxs[i]!, kk), 985 + hop); });
      c.globalAlpha = 1;
    }
    c.restore();
  });

  // ---- 19 Sydney --------------------------------------------------------------------------------
  const tExit = tFree + 0.55, PZ = 27 + 4.22 / 1.126;
  // off the phone it keeps rolling, slower and slower, round the front of the glasses, and stops by the checklist
  const rest = new THREE.CatmullRomCurve3(([[22, PZ], [21.5, 36], [12, 39], [-4, 38], [-12, 36], [-18, 30.93]] as number[][]).map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const restL = rest.getLength(), off = (t: number) => { const tau = Math.max(0, t - tExit), sd = restL * (1 - Math.exp((-18.2 / restL) * tau)), u = clamp(sd / restL), q = rest.getPointAt(u), g = rest.getTangentAt(u); return { p: [q.x, q.z < 32.2 && q.x > 13 ? 2.32 : 1.5, q.z] as V3, g, sd }; };
  f.marble(tExit, 95, (t) => off(t).p);
  f.anim((t) => { if (t >= tExit && t < f.line('Gato').words[1]!.start) { const o = off(t); (P.marble as THREE.Mesh).quaternion.setFromAxisAngle(new THREE.Vector3(o.g.z, 0, -o.g.x).normalize(), o.sd / 1.5); } });
  const bars = Array.from({ length: 8 }, (_, i) => ({ x: 215 + i * 213, t0: tSyd + 0.3 + i * spb * 0.75 }));
  P.Sphone.clip(tSyd - 0.3, tP2 + 0.2, (c: CanvasRenderingContext2D, t: number) => {
    const solid = prog(t, tSyd + 0.05, tSyd + 0.5, ease.outCubic);
    let dx = 0;
    [1, 2, 3].forEach((wi, n) => { const u = t - syd[wi]!.start; if (u > 0 && u < 0.5) dx += (n % 2 ? -1 : 1) * 78 * Math.sin(Math.PI * Math.min(1, u / 0.16)) * Math.exp(-u * 5) * 2.2; });
    const rise = 0;
    if (solid < 1) for (const p of B) disc(c, p[0]!, p[1]!, 9 * (1 - solid), BLUE);
    bubblePath(c, dx, rise); c.lineWidth = 12 * solid; c.lineJoin = 'round'; c.strokeStyle = BLUE; if (solid > 0) c.stroke();
    drawLyric(c, syd, t, 960 + dx, 640, 58, 'free', BLUE, bl(0.3), 'center');
    // someone is typing. The middle dot is you.
    for (let i = 0; i < 3; i++) {
      const y = 440 - 26 * Math.max(0, Math.sin((t - tSyd) * 5 - i * 0.9)) * solid;
      if (i !== 1) disc(c, 960 + dx + (i - 1) * 130, y, 30 * solid, bl(0.35));
      else if (t < tFree) marble2(c, 960 + dx, y, 40 * solid, BLUE, PAPER);
    }
    const fr = prog(t, tFree, tFree + 0.5, ease.inOutCubic);
    for (const b of bars) {
      const k = prog(t, b.t0, b.t0 + 0.28, ease.outCubic);
      if (k <= 0) continue;
      const hit = [1, 2, 3].reduce((a, wi) => a + pulse(t, syd[wi]!.start + 0.1, 0.07) * (t >= syd[wi]!.start + 0.1 ? 1 : 0), 0);
      const sx = Math.sin(t * 60 + b.x) * 7 * hit;
      c.fillStyle = DARK; c.fillRect(b.x + sx, lerp(-1080 + 1080 * k, 880, fr), 46, lerp(1080, 80, fr));
    }
    const fall = t - tFree;
    if (fall >= 0 && t < tExit) marble2(c, 960, 440 + 0.5 * 4231 * fall * fall, lerp(40, 216, clamp(fall / 0.55)), BLUE, PAPER);
    if (fr > 0) {
      // the bars drop to tick marks: a scale
      for (let i = 0; i < 33; i++) { c.fillStyle = DARK; c.fillRect(215 + 18 + i * 53.25 - 4, 960 - 36 * fr, 8, 36 * fr); }
      c.fillRect(200, 956, 1520 * fr, 8);
    }
  });

  // ---- camera -----------------------------------------------------------------------------------
  // the card box wears the line on its index tab
  const tab = f.surface(22, 4.4, [72, 13.4, -16.2], { W: 1190, H: 238 });
  tab.clip(tTrap - 1, tRoom + 1, (c: CanvasRenderingContext2D, t: number) => { rrect(c, 5, 5, 1180, 228, 10, PAPER, BLUE, 8); drawLyric(c, f.line('Trapped').words, t, 595, 150, 82, 'room', BLUE, bl(0.3), 'center'); });
  tab.clip(tRoom + 1.2, tRoom + 1.3, (c: CanvasRenderingContext2D) => { rrect(c, 5, 5, 1180, 228, 10, PAPER, BLUE, 8); text(c, 'INDEX  A – Z', 595, 150, 70, bl(0.3), { align: 'center', track: 10 }); });
  // the thread: out of the slot, across the desk, over the front edge beside a second smiley note, and into a cable
  const thr = new THREE.CatmullRomCurve3(([[72, 7.3, -16], [72, 3, -12], [70, 0.5, -6], [40, 0.5, 12], [33, 0.5, 30], [20, 0.5, 37], [-5, 0.5, 39], [-38, 0.5, 43], [-42, 0.4, 45.6], [-42, -4.8, 45.7], [-42, -9.5, 41.5]] as V3[]).map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2);
  const thrGeo = new THREE.TubeGeometry(thr, 300, 1.3, 8);
  const thread = f.add(new THREE.Mesh(thrGeo, inkMat({ lit: [0, 1], flat: true, crease: false })));
  const grow = (t: number) => keys(t, [[tShrooms + 0.64, 0], [tSee + 0.5, 0.9, ease.inOutQuad], [tShog + 0.1, 1, ease.inOutQuad]]);
  const tipAt = (t: number): V3 => { const p = thr.getPointAt(clamp(grow(t))); return [p.x, p.y, p.z]; };
  const tip = f.ball(2, [0, -500, 0], { lit: [1, 0], raw: true, flat: true, glow: true });
  const coup = f.cyl(2.3, 4.4, [-42, -13.6, 41.3], { lit: [1, 0], raw: true, flat: true, crease: false });
  f.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(([[-42, -13, 41.3], [-45, -22, 37], [-42, -33, 31], [-30, -42, 24], [-14, -40, 30]] as V3[]).map((p) => new THREE.Vector3(...p))), 50, 1.6, 8), inkMat({ lit: [0, 0.3], shade: [0, 0.6], crease: false })));
  // the note hangs from the desk edge by its top; one cable comes up and lifts it
  const hinge = f.group([-31, 1, 45.25]);
  const note2 = f.surface(18, 18, [0, -9, 0], { W: 720, H: 720, parent: hinge, ink: { side: THREE.DoubleSide } });
  note2.clip(tSee - 2, tShini, (c: CanvasRenderingContext2D, t: number) => {
    c.fillStyle = bl(0.14); c.fillRect(0, 0, 720, 720);
    disc(c, 285, 150, 26, BLUE); disc(c, 435, 150, 26, BLUE); c.beginPath(); c.arc(360, 185, 135, 0.18 * Math.PI, 0.82 * Math.PI); c.lineWidth = 24; c.lineCap = 'round'; c.strokeStyle = BLUE; c.stroke();
    drawLyric(c, see.words.slice(0, 3), t, 360, 490, 86, undefined, BLUE, bl(0.34), 'center');
    drawLyric(c, see.words.slice(3), t, 360, 620, 86, 'shoggoth', BLUE, bl(0.34), 'center');
  });
  const lifter = f.group([-17, -36, 43]);
  lifter.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(([[0, 0, 0], [-4, 6, 1.5], [-9, 11, 3], [-12.5, 14, 3.6]] as V3[]).map((p) => new THREE.Vector3(...p))), 30, 1.9, 8), inkMat({ lit: [0, 0.3], shade: [0, 0.6], crease: false })));
  f.anim((t) => {
    const k = grow(t), p = tipAt(t);
    thread.visible = k > 0 && t < 38.3; thrGeo.setDrawRange(0, Math.floor(300 * k) * 48);
    tip.position.set(p[0], k > 0 && k < 1 ? p[1] : -500, p[2]);
    coup.scale.setScalar(1 + 0.4 * (t >= tShog + 0.1 ? pulse(t, tShog + 0.1, 0.07) : 0));
    const lift = prog(t, tLift, tLift + 0.55, ease.outBack);
    hinge.rotation.x = -1.95 * lift; hinge.visible = t < tEyes + 0.7;
    lifter.scale.set(1, lerp(0.5, 1.6, lift) * (1 - 0.75 * prog(t, tLift + 0.6, tLift + 1.1, ease.inOutCubic)), 1 + 2.2 * lift); lifter.visible = t > tSee && t < tEyes + 0.7;
  });

  // ---- camera -----------------------------------------------------------------------------------
  const room = f.frame(P.Sroom);
  f.key({ t: (P.tIn as number) + 0.1, pos: [72, 8.2, -10], tgt: [72, 7.3, -27.4] });
  f.key({ t: tRoom + 0.14, ...room });
  f.key({ t: tShrooms + 0.68, ...room });
  // the thread's tip leads: out of the box, across the desk, to the edge
  for (const [tt, off] of [[tShrooms + 0.92, [3, 9, 13]], [tSee + 0.26, [10, 17, 26]], [tSee + 0.42, [6, 13, 30]]] as [number, V3][]) { const p = tipAt(tt); f.key({ t: tt, pos: [p[0] + off[0], p[1] + off[1], p[2] + off[2]], tgt: p }); }
  f.key({ t: tSee + 0.58, pos: [-35, -5, 92], tgt: [-35, -7, 45] });
  f.key({ t: tLies + 0.4, pos: [-34.5, -6, 88], tgt: [-34.5, -8, 45] });
  f.key({ t: tLift + 0.9, pos: [-27, -17, 96], tgt: [-27, -19, 40] });
  f.key({ t: tEyes - 0.05, pos: [-27, -18, 91], tgt: [-27, -19, 40] });
  f.key({ t: tEyes + 0.8, pos: [0, 86, 168], tgt: [0, 14, -8], via: [-38, -10, 150], ease: ease.inOutCubic });
  f.key({ t: 37.1, pos: [0, 84, 162], tgt: [0, 14, -8], ease: ease.linear });
  f.key({ t: tStable - 0.3, pos: [-44, 7, 54], tgt: [-64, 2.5, 6] });
  f.key({ t: tL - 0.15, pos: [-40, 9, 54], tgt: [c0[0], 4, c0[2]] });
  { const a2 = flight(tL + TF * 0.3), b2 = flight(tL + TF * 0.55); f.key({ t: tL + TF * 0.5, pos: [a2[0] + 5, a2[1] + 34, a2[2] + 9], tgt: b2 }); }
  const cup = f.frame(P.Scup), ph = f.frame(P.Sphone);
  f.key({ t: tSplash + 0.18, ...cup });
  f.key({ t: tSyd - 0.001, ...cup });
  f.key({ t: tSyd, ...ph });
  f.key({ t: tI2 - 0.05, ...ph });
  f.key({ t: tP2 - 0.12, pos: [0, 182, 4.5], tgt: [0, 0, 4], up: [0, 0, -1], ease: ease.outCubic });
  f.key({ t: tHear - 0.05, pos: [0, 176, 4.5], tgt: [0, 0, 4], up: [0, 0, -1], ease: ease.linear });
  f.post((t, p) => { const h = pulse(t, tP2, 0.1) * (t >= tP2 ? 1 : 0) + pulse(t, tBegun, 0.1) * (t >= tBegun ? 1 : 0); if (h > 0.02) p.misreg = [1.6 + h * 14, -1.1 - h * 6]; });
  void [tF, tStable, tFeel, hash, clamp, THREE];
}
