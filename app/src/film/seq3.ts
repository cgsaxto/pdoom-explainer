// Shots 21-31: the basilisk lamp, NVDA to the moon, the Omega Point, 1e30 on a calculator,
// "safe enough", Newton's cradle, von Neumann's book, the sharp left turn, the missing CDR,
// the cat, the fall.
import * as THREE from 'three';
import type { Film, V3 } from './core';
import { inkMat } from './ink';
import { bl, BLUE, DARK, PAPER, RED } from './ink';
import { disc, ring, seg, poly, rrect, text } from './d2';
import { drawLyric, arcLyric } from './lyric';
import { F } from '../engine/type';
import { clamp, ease, hash, keys, lerp, mulberry32, prog, pulse, springStep, TAU } from '../engine/util';

export function seq3(f: Film) {
  const P = f.P, spb = f.spb;
  const tHear = f.at('I hear'), tBas = f.at('I hear', 'basilisk'), tBoom = f.at('I hear', 'boom');
  const nv = f.word('NVDA to the moon', 'NVDA'), tNV = nv.start, tTo = f.at('NVDA to the moon', 'to'), tMoon = f.at('NVDA to the moon', 'moon');
  const tOmega = f.at('The Omega', 'Omega'), tPoint = f.at('The Omega', 'Point'), tSoon = f.at('The Omega', 'soon');
  const tOne = f.at('One E thirty'), tE = f.at('One E thirty', 'E'), tThirty = f.at('One E thirty', 'thirty'), tFlops = f.at('One E thirty', 'FLOPs');
  const tReck = f.at('That was safe', 'reckoned');
  const tFwd = f.at('Forward MLP'), tBack = f.at('Forward MLP', 'backward'), tRep = f.at('Forward MLP', 'repeat');
  const tNowV = f.at('Now von'), tObs = f.at('Now von', 'obsolete');
  const tSharp = f.at('Sharp left turn'), tThere = f.at('Sharp left turn', 'there');
  const tWithout = f.at('Without a single'), cdr = f.word('Without a single', 'CDR');
  const gato = f.line('Gato').words, tGato = gato[0]!.start, tGo = gato[5]!.start;
  const tI3 = f.at("I'm upping", 0, 2), tP3 = f.at("I'm upping", 'P(doom)', 2), tLand = f.at('as paperclips', 'paperclips');

  // ---- 21 the lamp: it looks at us, lights on "boom", then swings its light onto the monitor --------
  const LB: V3 = [-84, 0, -40], CAM1: V3 = [-40, 24, 34], MON: V3 = [0, 36, -26.7], hear = f.line('I hear').words;
  const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const swingAt = (t: number) => prog(t, tBoom + 0.22, tNV + 0.12, ease.inOutCubic);
  const lampPose = (t: number) => {
    // one vertebra at a time toward the lens; after "boom" a smooth swing to the screen; later back to the desk
    const steps = 4, raw = prog(t, tHear + 0.05, tBas + 0.35), k = raw >= 1 ? 1 : clamp((Math.floor(raw * steps) + ease.outBack(clamp(((raw * steps) % 1) / 0.45))) / steps);
    const sw = swingAt(t), back = prog(t, tOmega + 0.3, tOmega + 1.4, ease.inOutCubic), A0: V3 = [LB[0] + 34, 0, LB[2] + 34];
    return { head: mix3(mix3(mix3([12, 36, 10], [20, 30, 22], k), [22, 34, 14], sw), [12, 36, 10], back), aim: mix3(mix3(mix3(A0, CAM1, k), MON, sw), A0, back) };
  };
  P.lampPose = lampPose;
  P.lampAim = null as V3 | null;
  const filament = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), inkMat({ lit: [1, 0], flat: true, crease: false, glow: true, raw: true }));
  filament.position.z = 8.7; P.lampHead.add(filament);
  // the line is lettered on a paper collar round the shade, so it turns with the head and faces us when the lamp does
  const collar = f.surface(22, 22, [0, 0, 8.9], { W: 880, H: 880, parent: P.lampHead, ink: { alpha: true } });
  collar.clip(tHear - 1, tOmega + 0.4, (c: CanvasRenderingContext2D, t: number) => {
    c.clearRect(0, 0, 880, 880);
    c.beginPath(); c.arc(440, 440, 410, 0, TAU); c.arc(440, 440, 264, 0, TAU, true); c.fillStyle = PAPER; c.fill('evenodd');
    ring(c, 440, 440, 410, 6, BLUE); ring(c, 440, 440, 264, 6, BLUE);
    arcLyric(c, hear, t, 440, 440, 305, 80, 'boom');
    const u = (t - tBoom) / 0.5; if (u > 0 && u < 1) ring(c, 440, 440, lerp(264, 430, ease.outCubic(u)), 16 * (1 - u), BLUE);
  });
  f.anim((t) => {
    const { head, aim } = lampPose(t);
    const A = P.lampAim as V3 | null;
    P.lampNeck.forEach((m: THREE.Mesh, i: number) => {
      const u = (i + 0.5) / 12, w = 1 - u, c: V3 = [0, 44, -2];
      m.position.set(2 * w * u * c[0] + u * u * head[0], 1.4 * w * w + 2 * w * u * c[1] + u * u * head[1], 2 * w * u * c[2] + u * u * head[2]);
    });
    P.lampHead.position.set(head[0], head[1], head[2]);
    P.lampHead.lookAt(new THREE.Vector3(...(A ?? aim)));
    const on = (t >= tBoom && t < tOmega + 1.2) || !!A;
    (P.bulb.material as THREE.ShaderMaterial).uniforms.lit!.value.set(0, on ? 0 : 0.35);
    filament.visible = on;
    collar.mesh.visible = t >= tHear - 0.6 && t < tOmega + 0.3;
  });

  // ---- 22 the light finds the monitor; the price goes off the top of the chart, up the window frame, to the moon ----
  const MOONC = [790, 420]; // the moon on the window's canvas: also where the calculator's decimal point will be
  const c2w = (x: number, y: number): V3 => [39 + (x / 1920) * 46, 97.4375 - (y / 1080) * 25.875, -46.5];
  const tubeC = new THREE.CatmullRomCurve3(([[16.9, 51.4, -26.5], [25, 57, -36], [36, 65, -46.3], [38, 70, -46.35], [38, 77, -46.35], [39, 80, -46.4]] as V3[]).map((q) => new THREE.Vector3(...q)), false, 'catmullrom', 0.3);
  const lineGeo = new THREE.TubeGeometry(tubeC, 90, 0.42, 6);
  const line3 = f.add(new THREE.Mesh(lineGeo, inkMat({ lit: [1, 0], flat: true, crease: false, glow: true, raw: true })));
  const tA = tTo + 0.3, tubeK = (t: number) => prog(t, tTo - 0.03, tA, ease.inOutQuad), glassK = (t: number) => prog(t, tA, tMoon + 0.02, ease.outQuad);
  const ENTER = [0, 728], headAt = (t: number): V3 => {
    if (t < tA) { const q = tubeC.getPointAt(tubeK(t)); return [q.x, q.y, q.z]; }
    const g = glassK(t); return c2w(lerp(ENTER[0]!, MOONC[0]! - 150, g), lerp(ENTER[1]!, MOONC[1]! + 40, g));
  };
  f.anim((t) => { const k = tubeK(t); line3.visible = k > 0 && t < tOne; lineGeo.setDrawRange(0, Math.floor(90 * k) * 36); });
  f.tag('NVDA to the moon', (t) => { const h = headAt(t); return [h[0] + 1, h[1] + 4.5, h[2] + 3]; }, { words: [1, 4], key: 'moon', from: tTo - 0.3, to: tOmega - 0.02, h: 0.075 });
  P.Smon.clip(tHear, tOmega + 0.6, (c: CanvasRenderingContext2D, t: number) => {
    // asleep, until the lamp's spot crosses it
    c.fillStyle = bl(0.8); c.fillRect(0, 0, 1920, 1080);
    const sw = swingAt(t), R = 500 + 1100 * prog(t, tNV + 0.1, tNV + 0.5, ease.inOutCubic);
    if (sw <= 0) return;
    c.save(); c.beginPath(); c.arc(lerp(-560, 960, sw), 540, R, 0, TAU); c.clip();
    c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080);
    seg(c, 200, 120, 200, 960, 8, BLUE, 'square'); seg(c, 200, 960, 1760, 960, 8, BLUE, 'square');
    for (let i = 1; i < 5; i++) seg(c, 200, 960 - i * 190, 1760, 960 - i * 190, 3, bl(0.3), 'butt');
    for (let i = 0; i < 7; i++) { const x = 1150 + i * 84, y = 800 - 40 * Math.sin(i * 1.3) - i * 8; seg(c, x, y - 34, x, y + 60, 5, bl(0.3), 'butt'); rrect(c, x - 20, y, 40, 30 + 14 * Math.cos(i * 2.1), 0, bl(0.3)); }
    drawLyric(c, [nv], t, 250, 250, 150, 'NVDA');
    const top = (i: number) => 820 - 150 * Math.pow(1.62, i);
    for (let i = 0; i < 4; i++) {
      const k = prog(t, f.syl(nv, i), f.syl(nv, i) + 0.14, ease.outBack);
      if (k <= 0) continue;
      const x = 420 + i * 270, y0 = i ? top(i - 1) : 860, y1 = lerp(y0, top(i), k);
      seg(c, x, y1 - 50, x, y0 + 40, 6, DARK, 'butt'); rrect(c, x - 55, y1, 110, y0 - y1, 0, DARK);
    }
    const g = prog(t, tNV, tTo, ease.inQuad), pts: number[][] = [];
    for (let i = 0; i <= 60; i++) { const u = (i / 60) * g; pts.push([220 + u * 1280, 930 - 930 * Math.pow(u, 2.6)]); }
    poly(c, pts, 16, RED);
    c.restore();
    ring(c, lerp(-560, 960, sw), 540, R, 10, BLUE);
  });

  // ---- 23 the same moon: everything leans toward it, the line is read, then all of it goes in ----------------
  const sky = mulberry32(9), stars = Array.from({ length: 70 }, () => [sky() * 1920, sky() * 700, 2 + sky() * 4]);
  const blds = Array.from({ length: 16 }, (_, i) => ({ x: i * 122 - 10, w: 80 + sky() * 60, h: 70 + sky() * 110 }));
  const omega = f.line('The Omega').words;
  P.Swin.clip(tNV - 0.5, tOne + 0.2, (c: CanvasRenderingContext2D, t: number) => {
    const k1 = prog(t, tOmega, tSoon + 0.1, ease.inOutQuad), k2 = prog(t, tSoon + 0.38, tOne - 0.05, ease.inCubic), mx = MOONC[0]!, my = MOONC[1]!;
    c.fillStyle = bl(0.1); c.fillRect(0, 0, 1920, 1080);
    disc(c, mx, my, lerp(2500, 1000, k1) * (1 - k2), bl(0.82));
    const into = (fn: () => void, extra = 0) => { c.save(); c.translate(mx, my); c.rotate(0.3 * k1 + 2.4 * k2 + extra); c.scale((1 - 0.2 * k1) * (1 - k2), (1 - 0.2 * k1) * (1 - k2)); c.translate(-mx, -my); fn(); c.restore(); };
    into(() => {
      for (const s of stars) disc(c, s[0]!, s[1]!, s[2]!, PAPER);
      for (const b of blds) { rrect(c, b.x, 1080 - b.h, b.w, b.h + 20, 0, DARK); for (let j = 0; j < 2; j++) if (hash(b.x, j) > 0.4) rrect(c, b.x + 14 + j * 34, 1100 - b.h + 24, 18, 26, 0, PAPER); }
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-50, 860 + i * 26); c.quadraticCurveTo(900, 930 + i * 30, 1980, 840 + i * 26); c.lineWidth = 4; c.strokeStyle = PAPER; c.stroke(); }
      // every line there is turns to point at it
      for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + 0.2, r1 = 1500, r0 = lerp(1500, 190, k1); seg(c, mx + Math.cos(a) * r1, my + Math.sin(a) * r1 * 0.9, mx + Math.cos(a) * r0, my + Math.sin(a) * r0 * 0.9, 4, PAPER, 'butt'); }
      const g = glassK(t);
      if (g > 0) seg(c, ENTER[0]!, ENTER[1]!, lerp(ENTER[0]!, mx - 150, g), lerp(ENTER[1]!, my + 40, g), 16, RED);
    });
    // the line stays level and legible until it has been sung; then it goes in with the rest
    if (k2 > 0) into(() => drawLyric(c, omega, t, mx, 780, 84, 'Point', PAPER, bl(0.45), 'center'));
    else drawLyric(c, omega, t, mx, 780, 84, 'Point', PAPER, bl(lerp(0.82, 0.45, prog(t, omega[0]!.start - 0.4, omega[0]!.start - 0.1))), 'center');
    const hit = (t - tMoon) / 0.45; if (hit > 0 && hit < 1) ring(c, mx, my, 150 + 130 * hit, 14 * (1 - hit), PAPER);
    disc(c, mx, my, lerp(150, 32, k2), k2 > 0.97 ? DARK : PAPER);
  });

  // ---- 24 the point is the decimal point; 25 the tape -----------------------------------------------------
  const one = f.line('One E thirty').words, safe = f.line('That was safe').words, tThat = safe[0]!.start;
  P.Scalc.clip(tOne - 0.3, tOne + 2, (c: CanvasRenderingContext2D, t: number) => {
    c.fillStyle = bl(0.1); c.fillRect(0, 0, 1920, 1080);
    const o = { fam: F.mono(700), base: 'alphabetic' as const };
    if (t >= tOne) text(c, '1', 740, 440, 480, DARK, { ...o, align: 'right' });
    if (t >= tE) text(c, 'E', 850, 440, 480, DARK, o);
    if (t >= tThirty) text(c, '30', 1150, 440, 480, DARK, o);
    disc(c, MOONC[0]!, MOONC[1]!, 32, DARK);
    drawLyric(c, one.slice(3), t, 452, 800, 170, 'FLOPs', BLUE, bl(lerp(0.1, 0.3, prog(t, tThirty, tFlops - 0.1))));
  });
  // the tape comes out of the back of the machine, one row a beat, and runs away from us under the cradle
  const ROW = 2.0, PX = 50, TW = 600, TH = 2200, r0t = tThat - 0.1 - 6 * spb, rowT = (i: number) => r0t + i * spb, NROW = 17, LIFT = 2;
  const adv = (t: number) => { let n = 0; for (let i = 0; i < NROW; i++) n += prog(t, rowT(i) - 0.13, rowT(i), ease.outCubic); return n * ROW; };
  const tLa = rowT(11), tLb = tLa + 0.62, CRZ = -12;
  const tape = f.surface(12, 44, [56, 0.16, 8.5 - 22], { W: TW, H: TH, ink: { alpha: true } });
  tape.mesh.rotation.x = -Math.PI / 2;
  tape.clip(tFlops - 0.4, tNowV + 1, (c: CanvasRenderingContext2D, t: number) => {
    c.clearRect(0, 0, TW, TH);
    const a = adv(t), y0 = TH - a * PX;
    c.fillStyle = PAPER; c.fillRect(0, y0, TW, TH - y0); c.fillStyle = BLUE; c.fillRect(0, y0, 5, TH - y0); c.fillRect(TW - 5, y0, 5, TH - y0); c.fillRect(0, y0, TW, 5);
    for (let i = 0; i < NROW; i++) {
      const d = a - i * ROW; if (d <= 0.15) continue;
      const y = TH - d * PX + 78;
      if (i === 6) drawLyric(c, safe.slice(0, 2), t, TW / 2, y, 80, undefined, BLUE, bl(0.3), 'center');
      else if (i === 7) drawLyric(c, safe.slice(2, 4), t, TW / 2, y, 80, undefined, BLUE, bl(0.3), 'center');
      else if (i === 8) drawLyric(c, safe.slice(4), t, TW / 2, y, 80, 'reckoned', BLUE, bl(0.3), 'center');
      else if (!(i === LIFT && t >= tLa)) for (let j = 0; j < 5; j++) text(c, '0', TW / 2 + (j - 2) * 130, y, 92, BLUE, { fam: F.mono(700), align: 'center' });
    }
    // "reckoned": stamped. The tape does not stop.
    const sk = prog(t, tReck, tReck + 0.1);
    if (sk > 0) { const d = a - 6.6 * ROW, y = TH - d * PX + 40, z = lerp(1.7, 1, ease.outCubic(sk)); c.save(); c.translate(TW / 2 + 40, y); c.rotate(-0.2); c.scale(z, z); rrect(c, -205, -62, 410, 124, 12, undefined, RED, 12); text(c, '≈ SAFE', 0, 30, 88, RED, { fam: F.archivo(87.5, 900), align: 'center' }); c.restore(); }
  });
  // one row of five noughts stops being ink as it passes under the cradle
  f.anim((t) => {
    const k = prog(t, tLa, tLb, ease.inOutCubic), zrow = 8.5 - (adv(Math.min(t, tLa + 0.2)) - LIFT * ROW);
    P.balls.forEach((g: THREE.Group, i: number) => {
      g.visible = t < tOne || t >= tLa;
      const ball = g.children[0] as THREE.Mesh, str = g.children[1] as THREE.Mesh, kk = t >= tLb ? 1 : clamp(k * 1.25 - i * 0.06);
      ball.position.set(0, lerp(-12.15, -8, kk), (zrow - CRZ) * (1 - kk)); ball.scale.set(1, lerp(0.08, 1, kk), 1);
      str.scale.y = Math.max(0.001, kk); str.position.y = -8 + 4 * kk;
    });
  });

  // ---- 26 Newton's cradle: forward, backward, repeat. Only the end balls swing; the middle ones pass it on. ----
  const fw = f.line('Forward MLP').words;
  const swings: [number, number, number, number][] = [[tFwd, 0.72, 1, 0.62], [tBack, 0.66, -1, 0.62], [tRep, 0.36, 1, 0.55], [tRep + 0.38, 0.5, -1, 0.9]];
  const mlp = f.surface(26, 14.625, [56, 24.6, -19]);
  const layers = [3, 4, 4, 2];
  const node = (l: number, i: number): number[] => [480 + l * 320, 420 + (i - (layers[l]! - 1) / 2) * 150];
  mlp.clip(tFwd - 3, tNowV + 0.7, (c: CanvasRenderingContext2D, t: number) => {
    rrect(c, 6, 6, 1908, 1068, 10, undefined, BLUE, 8);
    let ph = -1, dir = 0;
    for (const [t0, d, sg] of swings) if (t >= t0 && t < t0 + d) { ph = (t - t0) / d; dir = sg; }
    const front = dir > 0 ? ph * 3.6 - 0.3 : 3.3 - ph * 3.6;
    for (let l = 0; l < 3; l++) for (let i = 0; i < layers[l]!; i++) for (let j = 0; j < layers[l + 1]!; j++) {
      const a2 = node(l, i), b2 = node(l + 1, j), hot = dir !== 0 && Math.abs(front - (l + 0.5)) < 0.5;
      seg(c, a2[0]!, a2[1]!, b2[0]!, b2[1]!, hot ? 9 : 4, hot ? (dir > 0 ? BLUE : RED) : bl(0.3));
    }
    for (let l = 0; l < 4; l++) for (let i = 0; i < layers[l]!; i++) { const q = node(l, i), hot = dir !== 0 && Math.abs(front - l) < 0.5; disc(c, q[0]!, q[1]!, 42, hot ? (dir > 0 ? BLUE : RED) : PAPER); ring(c, q[0]!, q[1]!, 42, 8, DARK); }
    // the line is the diagram's caption
    c.globalAlpha = 1 - prog(t, tNowV + 0.25, tNowV + 0.55); drawLyric(c, fw, t, 960, 985, 118, 'repeat', BLUE, bl(0.3), 'center'); c.globalAlpha = 1;
  });
  f.anim((t) => {
    let aL = 0, aR = 0;
    const pre = prog(t, tFwd - 0.7, tFwd - 0.35, ease.outCubic) * (1 - prog(t, tFwd - 0.28, tFwd, ease.inQuad));
    aL = -0.62 * pre;
    for (const [t0, d, sg, amp] of swings) { if (t < t0 || t >= t0 + d) continue; const a2 = amp * Math.sin((Math.PI * (t - t0)) / d); if (sg > 0) aR = a2; else aL = -a2; }
    P.balls[0].rotation.z = aL; P.balls[4].rotation.z = aR;
    P.balls.forEach((g: THREE.Group, i: number) => {
      let col: [number, number] = [0, 0.35];
      for (const [t0, , sg] of swings) { const u = (t - t0) / 0.16; if (u >= 0 && u < 1 && Math.abs(u * 5 - (sg > 0 ? i : 4 - i) - 0.5) < 0.7) col = sg > 0 ? [0, 1] : [1, 0.1]; }
      ((g.children[0] as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.lit!.value.set(col[0], col[1]);
    });
  });

  // ---- 27 the book under the monitor: the line is on its spine ----------------------------------------
  const von = f.line('Now von').words;
  const spine = f.surface(26, 4, [0, 2, -14.97], { W: 1300, H: 200 });
  const spineBase = (c: CanvasRenderingContext2D) => { c.fillStyle = bl(0.62); c.fillRect(0, 0, 1300, 200); seg(c, 30, 16, 1270, 16, 5, PAPER); seg(c, 30, 184, 1270, 184, 5, PAPER); text(c, 'THE COMPUTER AND THE BRAIN', 650, 58, 30, PAPER, { fam: F.mono(700), align: 'center', track: 6 }); };
  spine.draw = (c) => { spineBase(c); drawLyric(c, von, -1, 650, 150, 82, 'obsolete', PAPER, bl(0.4), 'center'); };
  spine.clip(tRep, tSharp + 1, (c: CanvasRenderingContext2D, t: number) => { spineBase(c); drawLyric(c, von, t, 650, 150, 82, 'obsolete', PAPER, bl(0.4), 'center'); });
  const stain = new THREE.Mesh(new THREE.RingGeometry(2.5, 3.1, 40), inkMat({ lit: [0, 1], flat: true, crease: false }));
  stain.rotation.x = -Math.PI / 2; stain.position.set(-7, 4.03, -18.4); f.add(stain);
  f.anim((t) => { stain.scale.setScalar(Math.max(0.001, prog(t, tObs, tObs + 0.2, ease.outBack))); });

  // ---- 28 the sharp left turn: the line is painted along the way the engine goes -----------------------
  const sharp = f.line('Sharp left turn').words;
  for (const [name, who, t0, t1] of [['CAPABILITIES', 'e', tSharp - 0.25, tThere + 1.2], ['ALIGNMENT', 'c', tSharp - 0.1, tWithout - 0.1]] as const) {
    const sf = f.surface(30, 6.4, [0, 0, 0], { W: 600, H: 128 });
    sf.draw = (c) => { rrect(c, 4, 4, 592, 120, 6, PAPER, BLUE, 6); text(c, name, 300, 86, 62, who === 'e' ? RED : BLUE, { fam: F.archivo(87.5, 900), align: 'center' }); };
    f.late((t) => {
      const k = Math.min(prog(t, t0, t0 + 0.16, ease.outBack), 1 - prog(t, t1, t1 + 0.12)), q = P.trainAt(t)[who];
      sf.mesh.visible = k > 0.01; sf.mesh.position.set(q.x, 11, q.z); sf.mesh.quaternion.copy(f.cam.quaternion); sf.mesh.scale.setScalar(Math.max(0.01, k * 0.62));
    });
  }
  const road = f.surface(50, 5.5, [-47, 0.05, 36.3], { W: 2000, H: 220 });
  road.mesh.rotation.x = -Math.PI / 2;
  road.clip(tSharp - 1, tWithout + 0.6, (c: CanvasRenderingContext2D, t: number) => { c.fillStyle = BLUE; c.fillRect(0, 0, 2000, 8); c.fillRect(0, 212, 2000, 8); drawLyric(c, sharp, t, 1000, 152, 112, 'left', BLUE, bl(0.3), 'center'); });
  f.anim((t) => { road.mesh.visible = t >= tSharp - 0.8 && t < tWithout + 0.5; });

  // ---- 29 the headlight crosses the checklist: two ticks, then an empty box -----------------------------
  const wo = f.line('Without a single').words;
  const page = (c: CanvasRenderingContext2D, t: number, dim: boolean) => {
    const ink = dim ? bl(0.48) : BLUE;
    drawLyric(c, wo, dim ? -1 : t, 110, 170, 112, 'CDR', BLUE, dim ? bl(0.42) : bl(0.3));
    seg(c, 100, 230, 1820, 230, 8, ink, 'butt');
    ['SRR', 'PDR', 'CDR'].forEach((n, i) => {
      const x = 130 + i * 590;
      text(c, n, x + 220, 420, 130, ink, { fam: F.archivo(100, 900), align: 'center' });
      rrect(c, x, 480, 440, 440, 16, undefined, ink, 14);
      if (i < 2) poly(c, [[x + 90, 700], [x + 190, 810], [x + 370, 560]], 44, ink);
    });
  };
  P.Scal.clip(tSharp - 0.5, tGato + 2, (c: CanvasRenderingContext2D, t: number) => {
    const z = 1 + 0.07 * prog(t, cdr.start, cdr.start + 0.55, ease.inOutCubic);
    c.translate(1300, 620); c.scale(z, z); c.translate(-1300, -620);
    c.fillStyle = bl(0.3); c.fillRect(-400, -400, 2800, 1900);
    page(c, t, true);
    const lit = keys(t, [[tWithout - 0.2, -40, ease.linear], [tWithout + 0.3, 640, ease.inOutQuad], [wo[2]!.start + 0.25, 1240, ease.inOutQuad], [cdr.start + 0.08, 2400, ease.inOutQuad]]);
    if (lit > -40) { c.save(); c.beginPath(); c.rect(-400, -400, lit + 400, 1900); c.clip(); c.fillStyle = PAPER; c.fillRect(-400, -400, 2800, 1900); page(c, t, false); c.restore(); if (lit < 2300) seg(c, lit, -400, lit, 1500, 6, BLUE, 'butt'); }
  });
  f.anim((t) => { (P.headlight.material as THREE.ShaderMaterial).uniforms.lit!.value.set(0, t >= tWithout - 0.25 ? 0 : 0.5); });

  // ---- 30 Gato: a paw comes down off the shredder and nudges the marble toward the edge, a little further each time ----
  const zs = [30.93, 32.6, 35.4, 39.5, 44.7], MX = -18;
  const pushT = [gato[1]!.start, gato[2]!.start, gato[3]!.start, gato[4]!.start];
  const mz = (t: number) => { let z = zs[0]!; pushT.forEach((pt, i) => { z += (zs[i + 1]! - zs[i]!) * prog(t, pt, pt + 0.36 + i * 0.05, ease.outCubic); }); return z; };
  f.marble(pushT[0]!, tGo, (t) => [MX, 1.5, mz(t)]);
  f.marble(tGo, tI3, (t) => { const u = prog(t, tGo, tI3, ease.inOutQuad); return [MX, 1.5 - 0.9 * u * u, lerp(zs[4]!, 46.7, u)]; });
  f.marble(tI3, tLand + 0.02, (t) => { const u = prog(t, tI3, tLand); return [MX, 0.6 - 71.8 * Math.pow(u, 3.0), 46.7 + 9.3 * ease.outQuad(u)]; });
  const xAxis = new THREE.Vector3(1, 0, 0);
  f.anim((t) => { if (t >= pushT[0]! && t < tLand) (P.marble as THREE.Mesh).quaternion.setFromAxisAngle(xAxis, (mz(Math.min(t, tGo)) - zs[0]! + 14 * prog(t, tGo, tLand)) / 1.5); });
  // The paw. One material for all of the fur, so the print pass draws no seams where its parts overlap: wrist, palm
  // and toes read as one surface. The forearm narrows to the wrist; the palm widens again; four toes sit on an arc,
  // the middle two forward. Pads are underneath, and only show when the paw lifts.
  const FUR = inkMat({ lit: [0, 0.15], shade: [0, 0.5], crease: false }), PADM = inkMat({ lit: [0, 1], crease: false }), HAIR = inkMat({ lit: [0, 1], flat: true, crease: false });
  const ell = (parent: THREE.Object3D, mat: THREE.Material, r: V3, at: V3) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), mat); m.scale.set(...r); m.position.set(...at); parent.add(m); return m; };
  const limb = (parent: THREE.Object3D, a: V3, b: V3, ra: number, rb: number, hairs: number) => {
    const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), g = new THREE.Group(); g.position.copy(A); parent.add(g); parent.updateWorldMatrix(true, false); g.lookAt(parent.localToWorld(Bv.clone()));
    const L = A.distanceTo(Bv), m = new THREE.Mesh(new THREE.CylinderGeometry(rb, ra, L, 22, 1, true), FUR); m.rotation.x = Math.PI / 2; m.position.z = L / 2; g.add(m);
    for (let i = 0; i < hairs; i++) { const u = (i + 0.5) / hairs, th = 0.5 + hash(i, ra) * 2.6, rr = lerp(ra, rb, u) + 0.03, h = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 1.6 + hash(i, 5) * 1.4), HAIR); h.position.set(-Math.cos(th) * rr, Math.sin(th) * rr, u * L); g.add(h); }
  };
  const paw = f.group([0, -500, 0]);
  limb(paw, [0, 0, 0], [1, 7, -12], 2.6, 3.4, 5); limb(paw, [1, 7, -12], [2, 16, -27], 3.4, 4.2, 6); limb(paw, [2, 16, -27], [3, 22, -48], 4.2, 4.8, 4);
  ell(paw, FUR, [2.65, 2.65, 2.65], [0, 0, 0]); ell(paw, FUR, [3.4, 3.4, 3.4], [1, 7, -12]); ell(paw, FUR, [4.2, 4.2, 4.2], [2, 16, -27]);
  const hand = f.group([0, 0, 0], paw);
  ell(hand, FUR, [3.6, 2.1, 4.0], [0, -0.9, 3.2]);
  const TOE: [number, number, number][] = [[-2.9, 5.5, 0.92], [-1.0, 6.9, 1], [1.0, 6.9, 1], [2.9, 5.5, 0.92]];
  for (const [x, z, k] of TOE) { ell(hand, FUR, [1.15 * k, 1.2 * k, 1.75 * k], [x, -1.6, z]); ell(hand, PADM, [0.75, 0.4, 0.95], [x, -2.62, z + 0.2]); }
  ell(hand, FUR, [0.85, 0.85, 1.25], [-3.1, -0.4, 0.7]); // dewclaw
  ell(hand, PADM, [2.0, 0.5, 1.5], [0, -2.78, 3.0]);
  for (const x of [-1.95, 0, 1.95]) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 2.5), HAIR); g.position.set(x, -0.62, 6.3); g.rotation.x = 0.55; hand.add(g); }
  for (let i = 0; i < 7; i++) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), HAIR); g.position.set(-2.6 + i * 0.85, 1.05 - Math.abs(i - 3) * 0.16, 2.2 + (i % 2) * 0.9); g.rotation.x = 0.15; hand.add(g); }
  // How it pushes: the wrist lifts, the toes come down on the back of the marble, a short shove, and the wrist takes the paw away.
  const all = [...pushT, tGo], tIn = tGato + 0.25, tSet = tGato + 0.85;
  f.anim((t) => {
    if (t < tIn || t > tGo + 1.3) { paw.position.set(0, -500, 0); return; }
    let lift = 0, reach = 0, shove = 0, curl = 0;
    for (const pt of all) {
      const u = t - pt;
      lift = Math.max(lift, prog(u, -0.4, -0.16, ease.outCubic) * (1 - prog(u, -0.14, -0.02, ease.inQuad)));
      reach = Math.max(reach, prog(u, -0.14, 0, ease.inQuad) * (1 - prog(u, 0.14, 0.42, ease.inOutCubic)));
      shove = Math.max(shove, prog(u, 0, 0.14, ease.outCubic) * (1 - prog(u, 0.14, 0.42, ease.inOutCubic)));
      curl = Math.max(curl, prog(u, 0.1, 0.3, ease.outCubic) * (1 - prog(u, 0.34, 0.62, ease.inOutCubic)));
    }
    const enter = prog(t, tIn, tSet, ease.outCubic), leave = prog(t, tGo + 0.45, tGo + 1.2, ease.inCubic), knead = Math.sin(clamp((t - tSet) / 0.5) * Math.PI);
    const zb = mz(Math.min(t, tGo + 0.1)) - shove * 0.2; // where the back of the marble is
    paw.position.set(MX + 0.4, lerp(7.6, 4.3, reach) + 0.9 * lift + 15 * (1 - enter) + 16 * leave, zb - lerp(12, 8.7, reach) + 1.4 * shove - 16 * (1 - enter) - 14 * leave);
    hand.rotation.x = -0.28 - 0.5 * lift + 0.55 * reach + 0.5 * curl + 0.3 * knead * (t < pushT[0]! - 0.4 ? 1 : 0);
  });
  // the plea is on a sheet lying beside the marble's way to the edge: a word a row, the last one at the brink
  const plea = f.surface(15, 12.4, [-28.8, 0.05, 38.8], { W: 750, H: 620 });
  plea.mesh.rotation.x = -Math.PI / 2;
  plea.clip(tGato - 0.5, tI3 + 1, (c: CanvasRenderingContext2D, t: number) => {
    rrect(c, 4, 4, 742, 612, 0, undefined, BLUE, 6);
    drawLyric(c, gato.slice(0, 1), t, 44, 112, 96); drawLyric(c, gato.slice(1, 2), t, 44, 218, 96); drawLyric(c, gato.slice(2, 4), t, 44, 324, 96); drawLyric(c, gato.slice(4, 5), t, 44, 430, 96);
    drawLyric(c, gato.slice(5), t, 44, 580, 156, 'go');
  });
  f.anim((t) => { const k = prog(t, tGato - 0.3, tGato - 0.05, ease.outBack) * (1 - prog(t, tI3 + 0.4, tI3 + 0.7)); plea.mesh.visible = k > 0.01; plea.mesh.scale.setScalar(Math.max(0.01, k)); });
  // the ink reaches the edge and runs down the side
  const drips = [-34, -27, -20, -12, -4, 6].map((x, i) => ({ m: f.box(1.6 + hash(i) * 2.4, 1, 0.12, [x, 0, 45.08], { lit: [1, 0], flat: true, crease: false, raw: true }), L: 14 + hash(i, 2) * 40, d: hash(i, 3) * 0.5 }));
  f.anim((t) => { for (const d of drips) { const L = d.L * prog(t, tP3 + d.d, tP3 + d.d + 1.6, ease.outCubic); d.m.visible = L > 0.05; d.m.scale.y = Math.max(0.01, L); d.m.position.y = -L / 2; } });

  // ---- camera -------------------------------------------------------------------------------------
  f.key({ t: tBas + 0.2, pos: CAM1, tgt: [-64, 30, -18] });
  f.key({ t: tBoom + 0.2, pos: [-39, 24.5, 32], tgt: [-63.5, 30.5, -18] });
  f.key({ t: tNV + 0.22, pos: [2, 42, 62], tgt: [4, 38, -27] });
  f.key({ t: tTo - 0.05, pos: [6, 44, 58], tgt: [10, 44, -27] });
  // with the head of the line: off the screen, up the frame, across the glass
  { const h1 = headAt(tTo + 0.16), h2 = headAt(tA - 0.02); f.key({ t: tTo + 0.16, pos: [h1[0] + 4, h1[1] + 4, 46], tgt: h1 }); f.key({ t: tA, pos: [h2[0] + 8, h2[1] + 2, 34], tgt: [h2[0] + 4, h2[1] + 2, h2[2]] }); }
  { const m = c2w(MOONC[0]!, MOONC[1]!); f.key({ t: tMoon + 0.05, pos: [m[0] - 1, m[1] - 1, 24], tgt: m }); }
  const win = f.frame(P.Swin), calc = f.frame(P.Scalc);
  f.key({ t: tOmega + 0.4, ...win });
  f.key({ t: tOne - 0.001, ...win });
  f.key({ t: tOne, ...calc });
  f.key({ t: tFlops - 0.05, ...calc });
  f.key({ t: tFlops + 0.65, pos: [56, 30, 44], tgt: [56, 0, 1] });
  f.key({ t: tThat - 0.25, pos: [56, 27, 27], tgt: [56, 0, 1] });
  f.key({ t: tReck + 0.5, pos: [56, 25, 25], tgt: [56, 0.5, -1] });
  f.key({ t: tLa + 0.35, pos: [56, 16, 32], tgt: [56, 4, CRZ] });
  f.key({ t: tFwd - 0.4, pos: [56, 16.5, 41], tgt: [56, 16, CRZ] });
  f.key({ t: tNowV - 0.05, pos: [56, 16.5, 39.5], tgt: [56, 16, CRZ] });
  f.key({ t: tNowV + 0.45, pos: [0, 17, 15], tgt: [0, 3, -17] });
  f.key({ t: tSharp - 0.1, pos: [0, 16, 14], tgt: [0, 3, -17] });
  // the train comes toward us, coupled; on "left" the engine goes right across the frame and we go with it
  f.key({ t: tSharp + 0.42, pos: [-70, 50, 66], tgt: [-72, 0, 14] });
  f.key({ t: tThere - 0.75, pos: [-66, 47, 67], tgt: [-66, 0, 19] });
  f.key({ t: tThere, pos: [-46, 34, 68], tgt: [-44, 2, 31] });
  // (wide enough that the second half of the line, on the desk in front of the engine, stays in frame until it is over)
  f.key({ t: f.at('Sharp left turn', 'you') + 0.3, pos: [-29, 19, 68], tgt: [-25, 1, 34] });
  f.key({ t: f.line('Sharp left turn').end + 0.25, pos: [-29, 18, 66], tgt: [-24, 1.5, 34] });
  f.key({ t: tWithout - 0.25, pos: [-30, 12, 46], tgt: [-12, 5.5, 33] });
  const cal = f.frame(P.Scal);
  f.key({ t: tWithout + 0.7, ...cal });
  f.key({ t: tGato + 0.05, ...cal });
  f.key({ t: tGato + 0.75, pos: [-45, 27, 63], tgt: [-23, 1, 36.5] });
  f.key({ t: tGo, pos: [-44, 24, 66], tgt: [-22, 1, 39.5] });
  // from the front left, far enough back that the clock (beyond) and the falling marble (near) share the frame
  // until the card has flipped; only then down after the marble
  f.key({ t: tI3, pos: [-90, 22, 112], tgt: [-46, 0, 20] });
  f.key({ t: tP3 + 0.28, pos: [-87, 15, 112], tgt: [-41, -9, 27] });
  f.key({ t: tLand - 0.05, pos: [-58, -46, 104], tgt: [-14, -68, 57] });
  f.post((t, p) => { const h = pulse(t, tP3, 0.1) * (t >= tP3 ? 1 : 0) + pulse(t, tReck, 0.08) * (t >= tReck ? 1 : 0) + pulse(t, tBoom, 0.08) * (t >= tBoom ? 1 : 0) + 0.6 * pulse(t, tMoon, 0.08) * (t >= tMoon ? 1 : 0); if (h > 0.02) p.misreg = [1.6 + h * 12, -1.1 - h * 5]; });
  void [tPoint, tHear, springStep, TAU, tI3];
}
