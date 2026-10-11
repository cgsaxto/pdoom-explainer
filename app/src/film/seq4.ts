// Shots 32-42: paperclips flood the room, the kill switch, the postcard, the blown fuse,
// orthogonality, the fold-out of transformer blocks, density, three fences, 100,000 GPUs, RLHF.
import * as THREE from 'three';
import type { Film, V3 } from './core';
import { inkMat, DIM, bl, BLUE, DARK, PAPER, RED } from './ink';
import { disc, ring, seg, poly, rrect, text, clip2 } from './d2';
import { F, fitSize } from '../engine/type';
import { drawLyric, arcLyric, lyricWidth } from './lyric';
import { clamp, ease, hash, lerp, mulberry32, prog, pulse, TAU } from '../engine/util';

function blockDiagram(c: CanvasRenderingContext2D, W: number, H: number) {
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  const names = ['ATTENTION', 'ADD & NORM', 'FEED FORWARD', 'ADD & NORM'], bw = W * 0.6, bh = H * 0.13, x = W * 0.25;
  seg(c, W / 2 + 20, H * 0.96, W / 2 + 20, H * 0.04, 6, BLUE, 'butt');
  names.forEach((n, i) => {
    const y = H * 0.8 - i * H * 0.2;
    rrect(c, x, y, bw, bh, 10, i % 2 ? bl(0.2) : PAPER, DARK, 6);
    text(c, n, x + bw / 2, y + bh * 0.66, bh * 0.42, DARK, { fam: F.mono(700), align: 'center' });
    if (i % 2 === 0) poly(c, [[W / 2 + 20, y + bh + H * 0.03], [W * 0.12, y + bh + H * 0.03], [W * 0.12, y - H * 0.135], [x, y - H * 0.135]], 5, BLUE);
  });
  rrect(c, 8, 8, W - 16, H - 16, 0, undefined, BLUE, 5);
}
function thumb(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -62, -10, 30, 80, 6, col);
  c.beginPath(); c.moveTo(-22, 70); c.lineTo(-22, -6); c.lineTo(8, -70); c.quadraticCurveTo(36, -76, 30, -40); c.lineTo(24, -10); c.lineTo(62, -10); c.quadraticCurveTo(80, -6, 74, 14); c.lineTo(60, 62); c.quadraticCurveTo(56, 70, 44, 70); c.closePath(); c.fillStyle = col; c.fill();
  c.restore();
}

export function seq4(f: Film) {
  const P = f.P, spb = f.spb;
  const tClips = f.at('as paperclips', 'paperclips'), tFill = f.at('as paperclips', 'fill'), tKill = f.at('Killswitch'), tPTO = f.at('Killswitch', 'PTO');
  const tNowhere = f.at("Now there's nowhere", 'nowhere'), tLeftTo = f.at("Now there's nowhere", 'left'), tGo = f.at("Now there's nowhere", 'go');
  const tToo = f.at('Too late now'), tLit = f.at('Too late now', 'lit'), tFuse = f.at('Too late now', 'fuse');
  const tOrth = f.at('Orthogonality'), orth = f.word('Orthogonality', 0), tThesis = f.at('Orthogonality', 'thesis'), tBlues = f.at('Orthogonality', 'blues');
  const tStut = 108.55, tJust = f.at('Just transformers'), tWay = f.at('Just transformers', 'way');
  const tDis = f.at('Till you learned', 'disobey');
  const tPost = f.at('Post-Chinchilla'), tDense = f.at('Post-Chinchilla', 'super');
  const tBreak = f.at('Breaking through'), tSafety = f.at('Breaking through', 'safety'), tFence = f.at('Breaking through', 'fence');
  const tHund = f.at('Hundred thousand'), tThou = f.at('Hundred thousand', 'thousand'), gpu = f.word('Hundred thousand', 'GPU');
  const rl = f.word('RLHF goes', 'RLHF'), tGoes = f.at('RLHF goes', 'goes'), tAskew = f.at('RLHF goes', 'askew');
  const tI4 = f.at("I'm upping", 0, 3), tUp4 = f.at("I'm upping", 'upping', 3), tP4 = f.at("I'm upping", 'P(doom)', 3);
  P.t4 = { tI4, tUp4, tP4 };

  // ---- 32 paperclips fill the room ----------------------------------------------------------------
  const sea = f.surface(1100, 900, [0, -75.2, 60], { W: 512, H: 512 });
  sea.mesh.rotation.x = -Math.PI / 2;
  sea.tex.wrapS = sea.tex.wrapT = THREE.RepeatWrapping;
  { const uv = sea.mesh.geometry.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 40, uv.getY(i) * 33); }
  sea.draw = (c) => { c.fillStyle = bl(0.1); c.fillRect(0, 0, 512, 512); const r = mulberry32(3); for (let i = 0; i < 13; i++) { const x = r() * 512, y = r() * 512, a = r() * TAU; for (const [ox, oy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) clip2(c, x + ox!, y + oy!, 170, a, 9, BLUE); } };
  const tSpread = tClips + spb / 2;
  const seaY = (t: number) => { const s = (t - tSpread) / (spb / 2), n = 8; return -75.2 + 67 * clamp((Math.floor(s) + ease.outCubic(clamp((s % 1) * 2))) / n) * (t < tSpread ? 0 : 1); };
  P.seaY = seaY;
  const fly = Array.from({ length: 46 }, (_, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.22, 6, 14), inkMat({ lit: [0, 1], flat: true, crease: false })); m.scale.set(1, 0.38, 1); f.add(m); return { m, a: hash(i, 1) * TAU, v: 30 + hash(i, 2) * 70, up: 90 + hash(i, 3) * 120, s: hash(i, 4) * 9 }; });
  f.anim((t) => {
    sea.mesh.position.y = seaY(t); sea.mesh.visible = t >= tSpread && t < 131;
    for (const c of fly) {
      const first = fly.indexOf(c) < 7, u = t - (first ? tClips : tSpread), kv = first ? 0.22 : 1;
      c.m.visible = u > 0 && u < 2.2;
      c.m.position.set(-18 + Math.cos(c.a) * c.v * u * kv, Math.max(first ? -72.5 : -400, -71 + c.up * u * (first ? 0.45 : 1) - 110 * u * u), 56 + Math.sin(c.a) * c.v * u * kv);
      c.m.rotation.set(u * c.s, u * c.s * 0.7, c.a);
    }
  });

  // ---- 33 out of office; 34 the postcard ----------------------------------------------------------
  const ks = f.line('Killswitch').words;
  P.Smon.clip(tKill - 0.6, 131.5, (c: CanvasRenderingContext2D, t: number) => {
    rrect(c, 160, 150, 1600, 780, 24, undefined, BLUE, 10);
    seg(c, 160, 300, 1760, 300, 8, BLUE, 'butt');
    text(c, 'AUTOMATIC REPLY', 220, 250, 64, BLUE, { fam: F.mono(700), track: 6 });
    drawLyric(c, ks.slice(0, 2), t, 220, 520, 200);
    drawLyric(c, ks.slice(2), t, 220, 730, 200, 'PTO');
    if (t > tPTO + 0.6) text(c, 'Back Monday. For anything urgent, contact —', 220, 850, 50, BLUE, { fam: F.mono(400) });
  });
  // (once its line is over, the screen keeps the reply but not the lyric)
  P.Smon.clip(tNowhere + 0.6, tNowhere + 0.7, (c: CanvasRenderingContext2D) => {
    rrect(c, 160, 150, 1600, 780, 24, undefined, BLUE, 10); seg(c, 160, 300, 1760, 300, 8, BLUE, 'butt');
    text(c, 'AUTOMATIC REPLY', 220, 250, 64, BLUE, { fam: F.mono(700), track: 6 });
    text(c, 'OUT OF OFFICE', 220, 560, 190, BLUE, { fam: F.archivo(87.5, 900) });
    text(c, 'Back Monday. For anything urgent, contact —', 220, 720, 54, BLUE, { fam: F.mono(400) });
  });
  const strip = (c: CanvasRenderingContext2D, s: number, a: number) => {
    // a beach, as printed on the card
    c.save(); c.translate(960, 540); c.scale(s, s); c.translate(-960, -540);
    c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080);
    disc(c, 1420, 300, 130, PAPER); ring(c, 1420, 300, 130, 10, BLUE);
    c.fillStyle = bl(0.55); c.fillRect(0, 480, 1920, 200);
    for (let i = 0; i < 5; i++) seg(c, 100 + i * 380, 530 + (i % 2) * 60, 360 + i * 380, 530 + (i % 2) * 60, 10, PAPER);
    c.fillStyle = bl(0.14); c.fillRect(0, 660, 1920, 420);
    const r = mulberry32(8); for (let i = 0; i < 150; i++) clip2(c, r() * 1920, 680 + r() * 400, 90 + r() * 40, r() * TAU, 7, BLUE);
    rrect(c, 0, 0, 1920, 1080, 0, undefined, BLUE, 16);
    c.globalAlpha = 1; c.restore(); void a;
  };
  const reelFace = (c: CanvasRenderingContext2D, cx: number, cy: number, R: number, k: number) => {
    disc(c, cx, cy, R, bl(0.35));
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
    if (k < 1) { const r = mulberry32(21); for (let i = 0; i < 90; i++) clip2(c, cx + (r() - 0.5) * 2 * R, cy + (r() - 0.5) * 2 * R, 70, r() * TAU, 6, bl(1 - k)); for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(cx, cy, R * i / 4, R, 0, 0, TAU); c.lineWidth = 4; c.strokeStyle = bl((1 - k) * 0.7); c.stroke(); } }
    if (k > 0) for (let i = 2; i < 12; i++) ring(c, cx, cy, (R * i) / 12, 9, bl(k));
    c.restore();
    ring(c, cx, cy, R, 12, DARK); disc(c, cx, cy, R * 0.12, DARK);
  };
  const nowh = f.line("Now there's nowhere").words;
  P.Spost.clip(tKill - 0.6, tToo + 0.3, (c: CanvasRenderingContext2D, t: number) => {
    const k = prog(t, tLeftTo - 0.1, tGo - 0.05, ease.inOutCubic), bg = prog(t, tGo + 0.22, tToo - 0.02);
    if (k <= 0) { strip(c, 1, 1); return; }
    c.fillStyle = bl(0.18 * bg); c.fillRect(0, 0, 1920, 1080);
    reelFace(c, 960, 540, 360 * ease.outBack(clamp(k * 1.3)), bg);
    if (k < 0.85) strip(c, lerp(1, 0.02, k / 0.85), 1);
    c.globalAlpha = Math.min(1, k * 2.5) * (1 - bg);
    arcLyric(c, nowh.slice(3), t, 960, 540, 398, 96, 'go');
    c.globalAlpha = 1;
  });
  P.Sreel.draw = (c: CanvasRenderingContext2D) => { c.fillStyle = bl(0.18); c.fillRect(0, 0, 720, 720); reelFace(c, 360, 360, 356, 1); };
  P.Sreel.mesh.material.uniforms.alpha.value = 0;

  const too = f.line('Too late now').words;
  const fl = f.surface(9, 3.2, [14.5, 5.6, 3.3], { W: 450, H: 160, parent: P.strip });
  fl.clip(tToo - 1, tOrth, (c: CanvasRenderingContext2D, t: number) => { rrect(c, 4, 4, 442, 152, 8, undefined, BLUE, 6); drawLyric(c, too.slice(6), t, 225, 120, 128, 'fuse', RED, bl(0.3), 'center'); });
  const ctag = f.surface(42, 5, [-41, -20.3, -39.2], { W: 1680, H: 200 });
  ctag.clip(tToo - 1, tOrth, (c: CanvasRenderingContext2D, t: number) => { rrect(c, 4, 4, 1672, 192, 8, undefined, BLUE, 6); drawLyric(c, too.slice(0, 6), t, 840, 138, 122, undefined, BLUE, bl(0.3), 'center'); });
  // (the tangle has had its scene; here it would only hide the strip)
  f.anim((t) => { ctag.mesh.visible = t > tToo - 0.8 && t < tOrth + 2; P.tangle.visible = t < 89.5; });
  // ---- 35 the fuse goes; lights out -----------------------------------------------------------------
  f.anim((t) => {
    const hot = t >= tFuse && t < tFuse + 0.3 ? (Math.sin((t - tFuse) * 60) > -0.3 ? 1 : 0) : 0;
    (P.fuse.material as THREE.ShaderMaterial).uniforms.lit!.value.set(hot, t >= tFuse + 0.3 ? 1 : hot ? 0 : 0.4);
    DIM.value = 0.4 * prog(t, tFuse + 0.3, tFuse + 0.42) * (1 - prog(t, tStut - 0.1, tStut + 0.2));
  });
  f.post((t, p) => { if (t >= tFuse + 0.3 && t < tFuse + 1) p.flash = pulse(t, tFuse + 0.3, 0.07); });

  // ---- 36 orthogonality -----------------------------------------------------------------------------
  const minds: [number, number, string][] = [[640, 700, 'ant'], [820, 380, 'octopus'], [1010, 610, 'chess engine'], [1150, 300, 'committee'], [1290, 520, 'you'], [1440, 720, 'thermostat']];
  P.Splot.clip(tFuse, tJust, (c: CanvasRenderingContext2D, t: number) => {
    c.fillStyle = bl(0.18); c.fillRect(0, 0, 1920, 1080);
    const zk = prog(t, tStut - 0.55, tStut - 0.05, ease.inOutCubic);
    c.translate(lerp(0, 540, zk), 0); c.translate(420, 480); c.scale(1 + zk * 2, 1 + zk * 2); c.translate(-420, -480);
    rrect(c, 60, 60, 1800, 960, 0, PAPER);
    const vib = t >= tBlues ? 18 * Math.sin((t - tBlues) * 70) * Math.exp(-(t - tBlues) * 3) : 0;
    poly(c, [[-600, 860], [420, 860], [420, lerp(860, 140, prog(t, tOrth - 0.3, tOrth + 0.2, ease.outCubic))]], 14, DARK);
    const xk = prog(t, tOrth, tOrth + 0.35, ease.outCubic);
    if (xk > 0) { c.beginPath(); c.moveTo(420, 860); c.quadraticCurveTo(lerp(420, 1060, xk), 860 + vib * 2, lerp(420, 1740, xk), 860); c.lineWidth = 14; c.strokeStyle = DARK; c.stroke(); }
    if (xk >= 1) { text(c, 'INTELLIGENCE →', 1730, 940, 44, DARK, { fam: F.mono(700), align: 'right' }); c.save(); c.translate(360, 160); c.rotate(-Math.PI / 2); text(c, 'GOALS →', 0, 0, 44, DARK, { fam: F.mono(700), align: 'right' }); c.restore(); }
    minds.forEach(([x, y, n], i) => {
      const k = prog(t, f.syl(orth, i % 3) + Math.floor(i / 3) * 0.3, f.syl(orth, i % 3) + Math.floor(i / 3) * 0.3 + 0.14, ease.outBack);
      if (k <= 0) return;
      disc(c, x, y, (n === 'you' ? 30 : 20) * k, BLUE); text(c, n, x + 38, y + 12, 34, BLUE);
    });
    const rk = prog(t, tThesis, tThesis + 0.18, ease.outBack);
    if (rk > 0) { disc(c, 1640, 230, 34 * rk, RED); text(c, 'very smart. wants paperclips.', 1600, 240, 36, RED, { align: 'right' }); }
  });
  f.post((t, p) => { if (t >= tBlues && t < tStut) p.redDrop = Math.min(prog(t, tBlues, tBlues + 0.08), 1 - prog(t, tStut - 0.12, tStut)); });

  // ---- 37 transformers all the way; 38 one disobeys ---------------------------------------------------
  const X0 = 34, Z0 = 37, PW = 12, PD = 14;
  const base = f.surface(PW, PD, [X0 + PW / 2, 0.12, Z0], { W: 480, H: 560, ink: { side: THREE.DoubleSide } });
  base.mesh.rotation.x = -Math.PI / 2;
  base.draw = (c) => blockDiagram(c, 480, 560);
  const flipT = (i: number) => (i <= 7 ? tJust + (i - 1) * spb : tDis);
  const till = f.line('Till you learned').words, just = f.line('Just transformers').words, onPanel: (number | null)[] = [0, 1, null, null, 2, 3, 4, null];
  const pivots = Array.from({ length: 8 }, (_, k) => {
    const i = k + 1, g = f.group([X0 + PW * i, 0.12 + i * 0.03, Z0]);
    const m = new THREE.Mesh(base.mesh.geometry, base.mesh.material); m.rotation.x = -Math.PI / 2; m.position.x = PW / 2; g.add(m);
    const wi = onPanel[k];
    if (wi != null) {
      const w = just[wi]!, st = f.surface(PW - 0.6, 3.1, [PW / 2, 0.03, -PD / 2 + 1.9], { W: 570, H: 155, parent: g });
      st.mesh.rotation.x = -Math.PI / 2;
      st.clip(tStut - 0.5, tPost, (c: CanvasRenderingContext2D, t: number) => { rrect(c, 3, 3, 564, 149, 0, undefined, BLUE, 5); drawLyric(c, [w], t, 285, 112, Math.min(104, fitSize(w.w, F.archivo(100, 900), 520, 104)), wi === 4 ? 'way' : undefined, BLUE, bl(0.3), 'center'); });
    }
    if (k === 6) {
      const st = f.surface(PW - 0.6, 2.4, [PW / 2, 0.03, PD / 2 - 1.5], { W: 570, H: 120, parent: g });
      st.mesh.rotation.x = -Math.PI / 2;
      st.clip(tStut - 0.5, tPost, (c: CanvasRenderingContext2D, t: number) => { rrect(c, 3, 3, 564, 114, 0, undefined, BLUE, 5); drawLyric(c, till.slice(0, 4), t, 285, 82, 58, undefined, BLUE, bl(0.3), 'center'); });
    }
    return g;
  });
  f.anim((t) => {
    pivots.forEach((g, k) => {
      const i = k + 1, t0 = flipT(i);
      let a = Math.PI * (1 - prog(t, t0, t0 + 0.32, ease.outCubic));
      if (i === 1) for (const ts of [tStut + 0.05, tStut + 0.5, tStut + 0.95]) { const u = (t - ts) / 0.34; if (u > 0 && u < 1) a = Math.PI - 0.85 * Math.sin(Math.PI * u); }
      if (i === 8) a = Math.PI - (Math.PI / 2) * prog(t, t0 - 0.1, t0 + 0.25, ease.outBack);
      g.rotation.z = a;
      g.visible = t >= tStut - 0.2 && (i === 1 || t >= t0 - (i === 8 ? 0.1 : 0.02)) && t < 131;
    });
    base.mesh.visible = t >= tStut - 0.3 && t < 131;
  });
  const dense = f.surface(12, 6.75, [0, 0, 0], { parent: pivots[7] });
  dense.mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
  dense.mesh.position.set(PW / 2, 0.06, 0);
  pivots[7]!.rotation.z = Math.PI / 2;
  const denseFrame = f.frame(dense);
  P.Sdense = dense;
  pivots[7]!.rotation.z = Math.PI;

  // ---- 39-42 on that panel: density, fences, GPUs, the like button ------------------------------------
  const pr = mulberry32(12), pts = Array.from({ length: 1500 }, () => [260 + pr() * 1400, 170 + pr() * 740]);
  const postW = f.line('Post-Chinchilla').words, brk = f.line('Breaking through').words, hun = f.line('Hundred thousand').words, rlW = f.line('RLHF goes').words;
  // each fence is gone through on the word that says so; the sign on it goes with it
  const punches = [f.at('Breaking through', 'through') + 0.02, tSafety + 0.14, tFence + 0.12];
  const sign = (c: CanvasRenderingContext2D, n: number, t: number) => {
    const ws = n === 0 ? brk.slice(0, 2) : n === 1 ? brk.slice(2, 4) : n === 2 ? brk.slice(4) : null;
    if (!ws) return;
    const w = lyricWidth(ws, 124, 'fence') + 100;
    rrect(c, 960 - w / 2, 190, w, 180, 10, PAPER, BLUE, 8); drawLyric(c, ws, t, 960, 322, 124, 'fence', BLUE, bl(0.3), 'center');
  };
  const layer = (c: CanvasRenderingContext2D, n: number) => {
    if (n === 0) { c.fillStyle = DARK; c.fillRect(0, 0, 1920, 1080); for (let j = -1; j < 22; j++) for (let i = -1; i < 36; i++) disc(c, i * 56 + (j % 2) * 28 - 20, j * 50 + 14, 17, PAPER); }
    else if (n === 1) { c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080); for (let i = -20; i < 44; i++) { seg(c, i * 76, -20, i * 76 + 1100, 1100, 26, DARK, 'butt'); seg(c, i * 76, 1100, i * 76 + 1100, -20, 26, DARK, 'butt'); } }
    else if (n === 2) { c.fillStyle = DARK; c.fillRect(0, 0, 1920, 1080); for (let j = 0; j < 13; j++) for (let i = 0; i < 22; i++) disc(c, i * 92 + 14, j * 92 + 32, 26, PAPER); }
    else card(c, 960, 540, 1);
  };
  const card = (c: CanvasRenderingContext2D, x: number, y: number, s: number) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    rrect(c, -460, -210, 920, 420, 20, DARK);
    for (const fx of [-220, 220]) { disc(c, fx, 0, 150, PAPER); disc(c, fx, 0, 126, DARK); for (let b2 = 0; b2 < 7; b2++) seg(c, fx, 0, fx + Math.cos(b2 * 0.9) * 120, Math.sin(b2 * 0.9) * 120, 10, PAPER); disc(c, fx, 0, 30, PAPER); }
    disc(c, 420, -170, 18, PAPER);
    c.restore();
  };
  const tLike = rl.start - 0.27, SF = 0.3 * 0.35 * 0.4 * 0.45;
  dense.clip(tDis - 0.6, tGoes + 0.2, (c: CanvasRenderingContext2D, t: number) => {
    if (t < tPost) {
      // the page that would not lie down: it carries the word
      c.save(); c.translate(960 - 462, 0); c.scale(924 / 480, 1080 / 560); blockDiagram(c, 480, 560); c.restore();
      rrect(c, 300, 70, 1320, 230, 10, PAPER, BLUE, 8); drawLyric(c, till.slice(4), t, 960, 245, 200, 'disobey', BLUE, bl(0.3), 'center');
      return;
    }
    if (t < brk[0]!.start) {
      // more data per parameter, and more, until the dots close into a mesh
      const k = prog(t, tDense + 0.55, brk[0]!.start - 0.1, ease.inOutCubic);
      if (k < 1) {
        seg(c, 240, 190, 240, 930, 8, BLUE, 'square'); seg(c, 240, 930, 1680, 930, 8, BLUE, 'square');
        const n = Math.floor(1500 * Math.pow(prog(t, tPost, tDense + 0.2), 1.8));
        for (let i = 0; i < n; i++) disc(c, pts[i]![0]!, Math.max(210, pts[i]![1]!), 8, bl(1 - k));
        text(c, 'TOKENS / PARAMETER', 1660, 1000, 40, bl(1 - k), { align: 'right' });
        c.globalAlpha = 1 - k; drawLyric(c, postW.slice(0, 1), t, 250, 140, 96); c.globalAlpha = 1; // the plot's title
      }
      if (k > 0) { c.globalAlpha = k; c.fillStyle = DARK; c.fillRect(0, 0, 1920, 1080); c.globalAlpha = 1; for (let j = -1; j < 22; j++) for (let i = -1; i < 36; i++) disc(c, i * 56 + (j % 2) * 28 - 20, j * 50 + 14, lerp(30, 17, k), PAPER); }
      // "super-dense": the word draws together with the dots, and is gone before the first fence is named
      const sd = postW[1]!, on = t >= sd.start - 0.02, tr = lerp(64, -3, prog(t, sd.start - 0.05, sd.start + 0.55, ease.outCubic)), fam = F.archivo(100, 900), sz = 170;
      const a2 = Math.min(prog(t, sd.start - 0.45, sd.start - 0.15), 1 - prog(t, brk[0]!.start - 0.3, brk[0]!.start - 0.12));
      if (a2 > 0) {
        c.globalAlpha = a2; c.font = `${sz}px "${fam}"`; c.letterSpacing = `${tr}px`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        const w = c.measureText(sd.w).width; rrect(c, 960 - w / 2 - 50, 470, w + 100, 230, 12, PAPER, BLUE, 8);
        c.fillStyle = on ? BLUE : bl(0.3); c.fillText(sd.w, 960 + tr / 2, 640); c.letterSpacing = '0px'; c.globalAlpha = 1;
      }
      return;
    }
    if (t < tHund) {
      let s2 = 0; for (let i = 0; i < 3; i++) if (t >= punches[i]!) s2 = i;
      const pk = t < punches[0]! ? 0 : prog(t, punches[s2]!, punches[s2]! + 0.3, ease.inCubic), z = 1 + 26 * pk, Rr = 34 * z;
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-960, -540); layer(c, s2); sign(c, s2, t); c.restore();
      if (pk > 0) {
        c.save(); c.beginPath(); c.arc(960, 540, Rr, 0, TAU); c.clip(); c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080);
        const zi = lerp(0.2, 1, pk);
        c.translate(960, 540); c.scale(zi, zi); c.translate(-960, -540); layer(c, s2 + 1); sign(c, s2 + 1, t); c.restore();
        c.beginPath(); for (let i = 0; i <= 40; i++) { const a2 = (i / 40) * TAU, rr = Rr * (1 + 0.16 * (i % 2)); c.lineTo(960 + Math.cos(a2) * rr, 540 + Math.sin(a2) * rr); } c.lineWidth = 10 + z; c.strokeStyle = RED; c.stroke();
      }
      return;
    }
    const kz = prog(t, tLike, rl.start - 0.03, ease.inOutCubic);
    if (kz < 1) {
      // one card, then a floor of them; the count gets to 100,000 on the last letter and stays there to be read
      let s2 = 1; s2 *= lerp(1, 0.3, prog(t, tThou, tThou + 0.25, ease.outCubic));
      [0.35, 0.4, 0.45].forEach((m, i) => { s2 *= lerp(1, m, prog(t, f.syl(gpu, i), f.syl(gpu, i) + 0.14, ease.outCubic)); });
      void SF;
      // ...then in on the status light of the one in the middle
      const Z = Math.exp(Math.log(900) * kz); s2 *= Z;
      const ox = 960 - 420 * s2 * kz, oy = 540 + 170 * s2 * kz, tw = 1010 * s2, th = 500 * s2, nx = Math.min(40, Math.ceil(1100 / tw) + 1), ny = Math.min(40, Math.ceil(700 / th) + 1);
      c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080);
      for (let j = -ny; j <= ny; j++) for (let i = -nx; i <= nx; i++) { if (s2 > 0.12) card(c, ox + i * tw, oy + j * th, s2); else { c.fillStyle = DARK; c.fillRect(ox + i * tw - 460 * s2, oy + j * th - 210 * s2, 920 * s2, 420 * s2); } }
      // the line and the count are one plate: the rating plate of the installation
      const n = Math.round(100000 * Math.pow(prog(t, tHund, f.syl(gpu, 2)), 2.2));
      c.globalAlpha = 1 - clamp(kz * 4);
      rrect(c, 960, 60, 880, 330, 10, PAPER, BLUE, 8); seg(c, 960, 180, 1840, 180, 6, BLUE, 'butt');
      drawLyric(c, hun, t, 1000, 148, 72, 'thousand');
      text(c, n.toLocaleString('en-US'), 1800, 345, 150, BLUE, { fam: F.mono(700), align: 'right' });
      c.globalAlpha = 1;
      return;
    }
    // the status light, close up: it is a like button. R, L, H, F are lettered round it.
    const open = prog(t, rl.start - 0.03, rl.start + 0.22, ease.outCubic);
    c.fillStyle = DARK; c.fillRect(0, 0, 1920, 1080);
    disc(c, 960, 540, lerp(306, 1400, open), bl(0.07));
    let press = 0; for (let i = 0; i < 4; i++) press = Math.max(press, t >= f.syl(rl, i) ? pulse(t, f.syl(rl, i), 0.05) : 0);
    const Rb = 300 * (1 - 0.1 * press);
    disc(c, 960, 540, Rb, bl(0.3)); ring(c, 960, 540, Rb, 14, DARK); thumb(c, 960, 548, 2.6 * (1 - 0.1 * press), DARK);
    c.font = `170px "${F.archivo(100, 900)}"`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    [...'RLHF'].forEach((ch, i) => { const an = -Math.PI / 2 + (i - 1.5) * 0.36; c.save(); c.translate(960 + Math.cos(an) * 400, 540 + Math.sin(an) * 400); c.rotate(an + Math.PI / 2); c.globalAlpha = open; c.fillStyle = t >= f.syl(rl, i) - 0.02 ? BLUE : bl(0.3); c.fillText(ch, 0, 0); c.restore(); });
    c.globalAlpha = 1;
    for (let i = 0; i < 4; i++) { const u = (t - f.syl(rl, i)) / 0.5; if (u > 0 && u < 1) text(c, '+1', 1440 + i * 40, 520 - u * 220, 110, BLUE, { fam: F.archivo(100, 900) }); }
  });
  // "goes askew" is on a printout lying on the keyboard: it slews and slides with everything else, toward the bottle
  const sheet = f.surface(25, 7.8, [35.5, 0.1, -2.2], { W: 1600, H: 500 });
  sheet.mesh.rotation.x = -Math.PI / 2;
  sheet.draw = (c) => { rrect(c, 5, 5, 1590, 490, 0, undefined, BLUE, 6); for (let i = 0; i < 6; i++) rrect(c, 70, 70 + i * 68, i === 5 ? 700 : 1460 - (i % 3) * 160, 22, 10, bl(0.3)); };
  sheet.clip(rl.start - 0.5, tP4 + 3, (c: CanvasRenderingContext2D, t: number) => { rrect(c, 5, 5, 1590, 490, 0, undefined, BLUE, 6); drawLyric(c, rlW.slice(1), t, 800, 340, 270, 'askew', BLUE, bl(0.3), 'center'); });
  const cap = f.surface(6, 6, [38, 1.62, 6], { W: 400, H: 400 });
  cap.mesh.rotation.x = -Math.PI / 2;
  cap.draw = (c) => { c.fillStyle = bl(0.07); c.fillRect(0, 0, 400, 400); disc(c, 200, 200, 196, bl(0.3)); ring(c, 200, 200, 190, 10, DARK); thumb(c, 200, 205, 1.7, DARK); };

  // ---- 42 askew: the desk tips, things slide -------------------------------------------------------
  const stepsAt = (t: number) => { const s = (t - tAskew) / spb; return t < tAskew ? 0 : Math.min(6, Math.floor(s) + ease.outBack(clamp((s % 1) * 3))); };
  f.spins.push((t) => (t < 126.4 ? 0.065 * stepsAt(t) : 0));
  f.anim((t) => {
    const k = clamp(stepsAt(t) / 6), fall = prog(t, tUp4, tUp4 + 0.5, ease.inQuad);
    if (t > tAskew) { P.bottle.position.x = -36 + 3 - 50 * k - 10 * fall; P.bottle.position.y = 3 - 40 * fall * fall; }
    P.sticky.mesh.position.set(-25 - 14 * k, 10.5 - 10.5 * k * k, -26.5 + 12 * k); P.sticky.mesh.rotation.z = 1.4 * k; P.sticky.mesh.rotation.x = -1.5 * k * k;
    P.cup.position.x = -39 - 9 * k; P.like.position.x = 38 - 20 * k; cap.mesh.position.x = 38 - 20 * k;
    { const away = prog(t, tAskew + 1.1, tAskew + 2.3, ease.inQuad); sheet.mesh.position.set(35.5 - 26 * k - 150 * away, 0.1 + 1.6 * clamp(k * 3) * (1 - away) - 30 * Math.max(0, away - 0.75), -2.2 + 9 * k + 10 * away); sheet.mesh.rotation.z = 0.42 * k + 1.2 * away; sheet.mesh.visible = away < 1; }
  });

  // ---- camera ---------------------------------------------------------------------------------------
  f.key({ t: tFill + 0.45, pos: [-70, 70, 250], tgt: [-30, -34, 0], ease: ease.inOutCubic });
  f.key({ t: tKill + 0.4, pos: [12, 47, 84], tgt: [9, 43, -28] });
  f.key({ t: tNowhere - 0.5, pos: [12, 46.5, 80], tgt: [9, 43, -28] });
  const post = f.frame(P.Spost);
  f.key({ t: tNowhere, ...post, ease: ease.inOutCubic });
  f.key({ t: tToo - 0.001, ...post });
  f.key({ t: tToo, pos: [-66, -36, 20.7], tgt: [-66, -36, -36.4] });
  f.key({ t: tLit - 0.35, pos: [-66, -36, 20.7], tgt: [-66, -36, -36.4] });
  f.key({ t: tFuse - 0.15, pos: [-26, -25, 14], tgt: [-26, -26, -41] });
  f.key({ t: tOrth - 0.75, pos: [-20, -26, 6], tgt: [-17, -26.5, -41] });
  const plot = f.frame(P.Splot);
  f.key({ t: tOrth - 0.15, ...plot, ease: ease.inOutCubic });
  f.key({ t: tStut - 0.001, ...plot });
  f.key({ t: tStut, pos: [44, 64, Z0 + 0.01], tgt: [44, 0, Z0], up: [0, 0, -1] });
  f.key({ t: tJust - 0.1, pos: [46, 64, Z0 + 0.01], tgt: [46, 0, Z0], up: [0, 0, -1], ease: ease.linear });
  f.key({ t: tWay + 0.3, pos: [120, 64, Z0 + 0.01], tgt: [120, 0, Z0], up: [0, 0, -1], ease: ease.linear });
  f.key({ t: tDis - 0.1, pos: [124, 64, Z0 + 0.01], tgt: [124, 0, Z0], up: [0, 0, -1], ease: ease.outCubic });
  f.key({ t: tPost - 0.12, ...denseFrame, via: [96, 40, Z0], ease: ease.inOutCubic });
  f.key({ t: tGoes - 0.001, ...denseFrame });
  f.key({ t: tGoes, pos: [38, 18.7, 6.01], tgt: [38, 1.6, 6], up: [0, 0, -1] });
  f.key({ t: tAskew + 0.05, pos: [8, 62, 94], tgt: [-2, 3, 6] });
  f.key({ t: tP4 - 0.5, pos: [0, 104, 176], tgt: [0, 8, -4] });
  f.key({ t: tP4, pos: [0, 100, 168], tgt: [0, 8, -4], ease: ease.linear });
  f.post((t, p) => { let h = 0; for (const x of [tClips, tStut, tDis, tBreak, tSafety, tFence, tGoes, tToo]) if (t >= x) h += pulse(t, x, 0.09); if (h > 0.02) p.misreg = [1.6 + h * 13, -1.1 - h * 6]; });
  void [tFill, tLit, tI4, tP4, V3x];
}
const V3x = 0 as unknown as V3;
