// Shots 43-52: the last flood, Loom, masks, the updater updating itself, the glasses,
// the spotlight, and the long pull-back to the lens.
import * as THREE from 'three';
import type { Film, V3, CamKey } from './core';
import { inkMat, DIM, bl, BLUE, DARK, PAPER, RED } from './ink';
import { disc, ring, seg, poly, rrect, text, marble2, clip2 } from './d2';
import { drawLyric } from './lyric';
import { ik } from './ink';
import { font, measure } from '../engine/type';
import { F } from '../engine/type';
import { makeRT, W, H } from '../engine/gl';
import { clamp, ease, hash, lerp, noise1, prog, pulse, TAU } from '../engine/util';
import { drawLens } from './seq1';

export function seq5(f: Film) {
  const P = f.P, spb = f.spb;
  const { tUp4, tP4 } = P.t4 as { tUp4: number; tP4: number };
  const tJustAs = f.at('Just as foretold'), tLoom = f.at('Just as foretold', 'Loom');
  const tFrom = f.at('From masked'), mk = f.line('From masked').words;
  const tTo = f.at('To recursive'), tRec = f.at('To recursive', 'recursive'), tSelf = f.at('To recursive', 'self');
  const loomW = f.line('Just as foretold').words, recW = f.line('To recursive').words, ilya = f.line('What did Ilya').words, showW = f.line('Was it all').words;
  const tWhat = f.at('What did Ilya'), tSee = f.at('What did Ilya', 'see'), tNever = f.at('What did Ilya', 'never'), tKnow = f.at('What did Ilya', 'know');
  const tWas = f.at('Was it all'), tAll = f.at('Was it all', 'all'), tShow = f.at('Was it all', 'show');
  const END = f.audio.duration;

  // ---- 43-46 on a sheet fixed to the lens ----------------------------------------------------------
  f.world.add(f.cam);
  const red = f.surface(11.21, 6.306, [0, 0, -10], { parent: f.cam, ink: { alpha: true } });
  const tCut = tWhat - 0.1;
  P.Sred = red;
  f.late((t) => { red.mesh.visible = t >= tP4 + 0.05 && t < tCut; });
  const gaps = [150, 330, 520, 700, 905];
  // the tree of continuations: 4 splits, 16 endings; ours is leaf 5
  const OURS = 5, node = (L: number, i: number): number[] => [150 + L * 350, 540 + ((i + 0.5) / (1 << L) - 0.5) * 860 * (L ? 1 : 0)];
  red.clip(tP4, tCut + 0.2, (c: CanvasRenderingContext2D, t: number) => {
    if (t < tJustAs) {
      // the flood crosses the lens; a few dry streaks stay
      const k = prog(t, tP4 + 0.08, tJustAs - 0.12, ease.inOutQuad);
      c.fillStyle = RED; c.beginPath(); c.moveTo(-10, 1100);
      for (let x = -10; x <= 1930; x += 30) c.lineTo(x, 1180 - 1500 * k + x * 0.18 + 70 * noise1(x * 0.006 + t * 2, 4));
      c.lineTo(1930, 1100); c.fill();
      gaps.forEach((y, i) => { c.clearRect(lerp(1920, 150, prog(k, 0.3, 1)) - i * 30, y - 5, 1920, 10); });
      return;
    }
    c.fillStyle = RED; c.fillRect(0, 0, 1920, 1080);
    const zk = prog(t, tFrom - 0.12, tFrom + 0.25, ease.inOutCubic);
    if (t < tTo + 0.05) {
      // 44: the dry streaks are threads; they branch
      const merge = prog(t, tJustAs - 0.05, tJustAs + 0.2, ease.outCubic);
      if (zk <= 0) gaps.forEach((y) => { c.fillStyle = PAPER; c.fillRect(0, lerp(y, 540, merge) - 5, 160, 10); });
      c.save();
      c.translate(960, 540); c.scale(1 + zk * 1.6, 1 + zk * 1.6); c.translate(-lerp(960, 1030, zk), -lerp(540, node(3, OURS >> 1)[1]!, zk));
      for (let L = 0; L < 4; L++) {
        const g = prog(t, tJustAs + L * spb, tJustAs + L * spb + 0.3, ease.outCubic);
        if (g <= 0) continue;
        for (let i = 0; i < 1 << L; i++) for (const ch of [0, 1]) {
          const a = node(L, i), b = node(L + 1, i * 2 + ch), ours = OURS >> (3 - L) === i * 2 + ch && t >= tLoom;
          c.beginPath(); c.moveTo(a[0]!, a[1]!); c.bezierCurveTo(a[0]! + 170, a[1]!, b[0]! - 170, b[1]!, lerp(a[0]!, b[0]!, g), lerp(a[1]!, b[1]!, g));
          c.lineWidth = ours ? 26 : 9; c.lineCap = 'round'; c.strokeStyle = PAPER; c.stroke();
          if (ours) { c.lineWidth = 8; c.strokeStyle = DARK; c.stroke(); }
        }
        const a = node(L, OURS >> (4 - L)), b = node(L + 1, OURS >> (3 - L)), ws = [loomW.slice(0, 2), loomW.slice(2, 3), loomW.slice(3, 4), loomW.slice(4)][L]!;
        c.globalAlpha = g * (1 - zk); drawLyric(c, ws, t, (a[0]! + b[0]!) / 2, Math.min(a[1]!, b[1]!) - 34 - (L === 3 ? 10 : 0), L === 3 ? 104 : 62, 'Loom', PAPER, ik(0.62, 0), 'center'); c.globalAlpha = 1;
      }
      if (t > tJustAs + 3 * spb + 0.25) for (let i = 0; i < 16; i++) {
        const p = node(4, i), x = p[0]! + 46, y = p[1]!;
        if (i === OURS) { marble2(c, x + 6, y, 24, BLUE, PAPER); ring(c, x + 6, y, 24, 5, PAPER); }
        else if (i % 4 === 0) ring(c, x, y, 15, 6, PAPER); else if (i % 4 === 1) rrect(c, x - 14, y - 14, 28, 28, 0, undefined, PAPER, 6);
        else if (i % 4 === 2) clip2(c, x + 4, y, 44, 0.4, 5, PAPER); else { seg(c, x - 13, y - 13, x + 13, y + 13, 6, PAPER); seg(c, x - 13, y + 13, x + 13, y - 13, 6, PAPER); }
      }
      c.restore();
      // 45: tape over the words of the line; each comes off as its word is sung. One more tape is left over.
      if (zk > 0) {
        const fam = F.archivo(100, 900), sz = 90, xs = [230, 565, 1065, 1520], peel = [-1, mk[1]!.start, mk[2]!.start, mk[3]!.start];
        c.font = font(fam, sz);
        mk.forEach((w, i) => {
          const on = prog(t, tFrom - 0.05 + i * 0.03, tFrom + 0.12 + i * 0.03, ease.outBack), wd = measure(w.w, fam, sz), y = 400;
          if (on <= 0) return;
          c.globalAlpha = Math.min(1, on); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = font(fam, sz);
          c.fillStyle = t >= w.start - 0.02 ? PAPER : ik(0.62, 0); c.fillText(w.w, xs[i]!, y); c.globalAlpha = 1;
          const k = peel[i]! < 0 ? 1 : prog(t, peel[i]! - 0.06, peel[i]! + 0.26, ease.inCubic);
          if (k < 1) { c.save(); c.translate(xs[i]! + 420 * k, y - 36 - 620 * k * k); c.rotate((i % 2 ? 0.04 : -0.03) + k * 1.4); c.scale(on, on); rrect(c, -wd / 2 - 34, -70, wd + 68, 140, 4, bl(0.12), BLUE, 6); text(c, '[MASK]', 0, 26, 70, BLUE, { fam: F.mono(700), align: 'center' }); c.restore(); }
        });
        const k4 = prog(t, tTo - 0.08, tTo + 0.2, ease.inCubic), on4 = prog(t, tFrom + 0.1, tFrom + 0.28, ease.outBack);
        if (on4 > 0 && k4 < 1) { c.save(); c.translate(1620 + 420 * k4, 690 - 620 * k4 * k4); c.rotate(0.04 + k4 * 1.4); c.scale(on4, on4); rrect(c, -200, -70, 400, 140, 4, bl(0.12), BLUE, 6); text(c, '[MASK]', 0, 26, 70, BLUE, { fam: F.mono(700), align: 'center' }); c.restore(); }
      }
      return;
    }
    // 46: under the last tape, an updater. It updates the updater.
    // five windows grow inside the frame while the line is read; only then do the last two burst out of it
    const times = [tTo + 0.08, tRec, tRec + 0.28, tSelf, tSelf + 0.2, tSelf + 0.64, tSelf + 0.82], sizes = [520, 690, 920, 1220, 1620, 2800, 5400];
    times.forEach((tw, i) => {
      const k = prog(t, tw, tw + 0.2, ease.outBack);
      if (k <= 0) return;
      const w = sizes[i]! * k, h = w * 0.56, x = 1620 - (1620 - 960) * Math.min(1, i / 4), y = 690 - 150 * Math.min(1, i / 4);
      rrect(c, x - w / 2, y - h / 2, w, h, w * 0.02, DARK, PAPER, Math.max(4, w * 0.008));
      seg(c, x - w / 2, y - h * 0.3, x + w / 2, y - h * 0.3, Math.max(3, w * 0.006), PAPER, 'butt');
      text(c, `UPDATER v${i + 1}`, x - w * 0.44, y - h * 0.35, w * 0.065, PAPER, { fam: F.mono(700) });
      drawLyric(c, recW, t, x - w * 0.44, y + h * 0.06, w * 0.062, 'self', PAPER, ik(0.6, 0.6));
      rrect(c, x - w * 0.44, y + h * 0.14, w * 0.88, h * 0.1, 4, undefined, PAPER, Math.max(3, w * 0.005));
      c.fillStyle = RED; c.fillRect(x - w * 0.44, y + h * 0.14, w * 0.88 * prog(t, tw, tw + 0.3), h * 0.1);
    });
    const full = prog(t, tSelf + 0.9, tSelf + 1.05); if (full > 0) { c.globalAlpha = full; c.fillStyle = DARK; c.fillRect(0, 0, 1920, 1080); c.globalAlpha = 1; }
  });

  // ---- 47 the glasses ---------------------------------------------------------------------------------
  const bars: THREE.Mesh[] = [];
  P.lens.forEach((ln: THREE.Mesh) => { for (let i = 0; i < 4; i++) { const b = f.box(2.6 - (i % 2) * 0.9, 0.22, 0.02, [-0.2 * (i % 2), -1.0 + i * 0.55, 0.03], { lit: [0, 0.8], flat: true, crease: false, glow: true }, ln); bars.push(b); } });
  f.anim((t) => {
    if (t < 120) return;
    const lit = false;
    P.lens.forEach((ln: THREE.Mesh, i: number) => {
      const dark = t >= (i ? tKnow + 0.45 : tSee + 0.4);
      (ln.material as THREE.ShaderMaterial).uniforms.lit!.value.set(dark ? 1 : 0, dark ? 1 : t >= tCut ? 0 : 0.12);
    });
    for (const b of bars) b.visible = lit;
    if (t >= tCut) DIM.value = 0.62 * (1 - prog(t, tShow + 0.9, tShow + 1.2));
    // 48: the lamp is a spotlight on the one thing left
    const on = t >= tWas ? 1 : 0;
    P.lampAim = on ? ([22, 0, 40] as V3) : null;
    P.top.material.uniforms.spot.value.set(22, 40, 13, on);
    P.wallPivot.rotation.x = -(Math.PI / 2) * ease.inQuad(prog(t, tShow, tShow + 0.8));
  });
  P.lens.forEach((ln: THREE.Mesh, i: number) => {
    const sf = f.surface(5.2, 5.2, [0, 0, 0.05], { W: 416, H: 416, parent: ln, ink: { alpha: true } }), off = i ? tKnow + 0.45 : tSee + 0.4;
    sf.clip(tCut - 0.3, off + 0.2, (c: CanvasRenderingContext2D, t: number) => {
      c.clearRect(0, 0, 416, 416);
      if (t >= off) return;
      // (each row is sized to the width the round lens has at that height)
      const rows = i ? [ilya.slice(4, 5), ilya.slice(5, 6), ilya.slice(6)] : [ilya.slice(0, 2), ilya.slice(2, 4)];
      rows.forEach((ws, r) => drawLyric(c, ws, t, 208, (i ? 152 : 190) + r * (i ? 84 : 88), i ? 78 : 76, i ? 'know' : 'see', BLUE, bl(0.3), 'center'));
    });
  });
  // "Was it all for show?" is lettered on the back wall; when the wall goes over, so does the question
  const wallText = f.surface(104, 15, [-48, 141, 0.2], { W: 2080, H: 300, parent: P.wallPivot, ink: { alpha: true } });
  wallText.clip(tWas - 0.5, tShow + 2, (c: CanvasRenderingContext2D, t: number) => { c.clearRect(0, 0, 2080, 300); drawLyric(c, showW, t, 1040, 225, 236, 'show', PAPER, bl(0.42), 'center'); });
  f.anim((t) => { wallText.mesh.visible = t >= tWas - 0.05; });
  f.marble(tCut, END, () => [22, 1.5, 40]);
  for (const m of P.wallStuff as THREE.Object3D[]) P.wallPivot.attach(m);
  f.post((t, p) => {
    if (t >= tCut - 0.05 && t < tWhat + 0.5) p.fade = 1 - prog(t, tCut, tWhat + 0.4);
    if (t >= tWas && t < tWas + 0.6) p.flash = 0.5 * pulse(t, tWas, 0.06);
  });

  // ---- 49-52 the pull-back: a sheet, a stack, the lens ---------------------------------------------------
  const K48: Omit<CamKey, 't'> = { pos: [0, 86, 190], tgt: [0, 26, -10] };
  const O: V3 = [0, 4000, 0], tOut = tShow + 1.0;
  const stage = f.group(O);
  const rt = makeRT(W, H, { samples: 4 });
  f.prepass = { from: tOut - 0.2, key: K48, rt, hide: [stage, red.mesh] };
  const mkSheet = (redMul: number, z: number, rot: number) => {
    const g = f.group([0, 0, z], stage); g.rotation.z = rot;
    const board = f.surface(78, 49, [0, 0, -0.05], { W: 1560, H: 980, parent: g });
    board.draw = (c) => {
      rrect(c, 4, 4, 1552, 972, 0, PAPER, BLUE, 4);
      for (const [x, y] of [[60, 60], [1500, 60], [60, 920], [1500, 920]]) { ring(c, x!, y!, 22, 4, DARK); seg(c, x! - 36, y!, x! + 36, y!, 4, DARK); seg(c, x!, y! - 36, x!, y! + 36, 4, DARK); }
      for (let i = 0; i < 5; i++) { c.fillStyle = bl(1 - i * 0.2); c.fillRect(520 + i * 44, 44, 40, 34); c.fillStyle = `rgba(${255 - i * 40},0,0,1)`; c.fillRect(800 + i * 44, 44, 40, 34); }
      text(c, 'P(DOOM) · 2 PLATES · BLUE / RED', 520, 950, 26, BLUE, { track: 3 });
    };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(64, 36), inkMat({ map: rt.texture, flat: true, crease: false }));
    (m.material as THREE.ShaderMaterial).uniforms.redMul!.value = redMul; (m.material as THREE.ShaderMaterial).uniforms.keepG!.value = 1;
    g.add(m);
    return { g, m };
  };
  const reds = [1, 0.55, 0.8, 0.25, 0.6, 0];
  const sheets = reds.map((r, i) => mkSheet(r, -i * 0.4, i ? (hash(i, 9) - 0.5) * 0.12 : 0));
  const slide0 = f.beat(143.6);
  const rings = [[470, 26], [395, 60], [330, 10], [250, 22], [180, 8], [110, 16]].map(([r, w]) => {
    const k = 378.4 / 1080, m = new THREE.Mesh(new THREE.RingGeometry((r! - w! / 2) * k, (r! + w! / 2) * k, 96), inkMat({ lit: [0, 1], flat: true, crease: false }));
    m.position.set(O[0], O[1], O[2] - 3); f.add(m); return m;
  });
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(42 * 378.4 / 1080, 64), inkMat({ lit: [0, 1], flat: true, crease: false }));
  pupil.position.set(O[0], O[1], O[2] + 1); f.add(pupil);
  const tRing = 147.5, tLens = 152.96;
  f.anim((t) => {
    stage.visible = t >= tOut - 0.3;
    sheets.forEach((s, i) => {
      const ts = slide0 + i * spb * 1.5, k = i < 5 ? prog(t, ts, ts + 0.4, ease.inCubic) : 0;
      s.g.position.x = -150 * k; s.g.position.y = 30 * k * k; s.g.rotation.z = (i ? (hash(i, 9) - 0.5) * 0.12 : 0) + 0.5 * k; s.g.visible = k < 1;
    });
    stage.scale.setScalar(lerp(1, 0.16, prog(t, tRing, tLens - 0.6, ease.inOutCubic)));
    rings.forEach((m, i) => { const ti = tRing + 0.4 + (5 - i) * spb * 1.6; m.scale.setScalar(Math.max(0.001, prog(t, ti, ti + 0.35, ease.outBack))); m.visible = t >= ti; });
    const pk = prog(t, tLens - 1.6, tLens - 0.7, ease.outBack); pupil.scale.setScalar(Math.max(0.001, pk)); pupil.visible = pk > 0;
  });
  P.Smon.clip(tLens - 0.5, END, (c: CanvasRenderingContext2D, t: number) => drawLens(c, lerp(1, 0.84, prog(t, END - 1.6, END - 0.1, ease.inOutCubic)), t < END - 0.9 ? 1 : 0, lerp(0.15, 1, prog(t, END - 1.6, END - 0.2, ease.inOutCubic)), [26 * prog(t, END - 1.6, END - 0.1), -14 * prog(t, END - 1.6, END - 0.1)], t));

  // ---- camera ---------------------------------------------------------------------------------------------
  f.key({ t: tP4 + 0.02, pos: [0, 100, 168], tgt: [0, 8, -4] });
  f.key({ t: tCut - 0.001, pos: [0, 100, 168], tgt: [0, 8, -4] });
  f.key({ t: tCut, pos: [6, 8, 49], tgt: [6, 3, 32] });
  f.key({ t: tSee, pos: [6, 5.6, 43], tgt: [6, 3, 32], ease: ease.outCubic });
  f.key({ t: tKnow + 0.9, pos: [6, 5.1, 42.2], tgt: [6, 3, 32] });
  // the pull-back is done on the long last note, so the wall and its question are in frame from the first word
  f.key({ t: tWas - 0.12, pos: [1, 66, 156], tgt: [0, 27, -10] });
  f.key({ t: tShow - 0.1, ...K48 });
  f.key({ t: tOut - 0.001, ...K48 });
  const D0 = 18 / Math.tan((35 * Math.PI) / 360);
  f.key({ t: tOut, pos: [O[0], O[1], O[2] + D0], tgt: O });
  f.key({ t: 143.6, pos: [O[0], O[1], O[2] + 96], tgt: O, ease: ease.inOutCubic });
  f.key({ t: tRing, pos: [O[0], O[1], O[2] + 104], tgt: O, ease: ease.linear });
  f.key({ t: tLens - 0.3, pos: [O[0], O[1], O[2] + 600], tgt: O, ease: ease.inOutCubic });
  f.key({ t: tLens - 0.001, pos: [O[0], O[1], O[2] + 600], tgt: O });
  f.key({ t: tLens, ...f.frame(P.Smon) });
  f.key({ t: END, ...f.frame(P.Smon) });
  f.post((t, p) => { let h = 0; for (const x of [tP4, tLoom, tTo, tSee, tShow, tLens]) if (t >= x) h += pulse(t, x, 0.09); if (h > 0.02) p.misreg = [1.6 + h * 13, -1.1 - h * 6]; if (t > tLens) p.hud = 1; });
  void [tUp4, tAll, disc, poly, clamp, TAU];
}
