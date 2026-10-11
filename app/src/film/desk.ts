// The set: one desk at night, and everything on, under and around it. Units are centimetres;
// x right, y up, z toward the viewer; the desk top is y = 0 and spans x ±90, z ±45.
import * as THREE from 'three';
import type { Film, V3 } from './core';
import { inkMat, newId, LIGHT, DIM, bl, ik, PAPER, BLUE, DARK, RED } from './ink';
import { disc, ring, seg, text, rrect, poly, clip2 } from './d2';
import { F } from '../engine/type';
import { PDoom } from '../engine/hud';
import { clamp, ease, fbm2, mulberry32, prog } from '../engine/util';

export const DESK = { w: 180, d: 90 };
export const BOTTLE: V3 = [-36, 0, -22];

/** Ink pool field over the desk top, rank-normalised: a texel is flooded when its value < P(doom). */
function poolField() {
  const w = 256, h = 128, f = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = (i / (w - 1) - 0.5) * DESK.w, z = (j / (h - 1) - 0.5) * DESK.d;
    const d = Math.hypot(x - BOTTLE[0], (z - BOTTLE[2]) * 1.25) / 150;
    f[j * w + i] = d * 0.62 + 0.38 * fbm2(x * 0.035, z * 0.035, 4, 11);
  }
  const order = Array.from(f.keys()).sort((a, b) => f[a]! - f[b]!);
  const rank = new Float32Array(w * h);
  order.forEach((idx, r) => { rank[idx] = r / (w * h); });
  const data = new Float32Array(w * h * 4);
  for (let i = 0; i < w * h; i++) data[i * 4] = rank[i]!;
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function buildDesk(F_: Film) {
  const f = F_, P = f.P;
  const pd = new PDoom(f.lyrics);
  P.pdoom = pd;

  // ---- room ---------------------------------------------------------------------------------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), inkMat({ lit: [0, 0.16], flat: true, crease: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -75, 60); f.add(floor);
  P.wallPivot = f.group([0, -75, -49]);
  P.wall = f.box(900, 330, 4, [0, 0, -2], { lit: [0, 0.1], shade: [0, 0.3] }, P.wallPivot);

  // ---- desk ---------------------------------------------------------------------------------
  f.box(DESK.w, 4, DESK.d, [0, -4.02, 0], { lit: [0, 0.2], shade: [0, 0.5] });
  f.box(3, 71, 86, [-88.5, -75, 0], { lit: [0, 0.25], shade: [0, 0.55] });
  f.box(3, 71, 86, [88.5, -75, 0], { lit: [0, 0.25], shade: [0, 0.55] });
  P.panel = f.box(174, 66, 2, [0, -70, -43], { lit: [0, 0.18], shade: [0, 0.18], flat: true });
  // desk top: paper-pale, flooded by the red pool; a ring (FOOM) and a spotlight are drawn here too
  P.top = new THREE.Mesh(new THREE.PlaneGeometry(DESK.w, DESK.d), new THREE.ShaderMaterial({
    uniforms: { field: { value: poolField() }, level: { value: 0.02 }, id: { value: newId() }, ring: { value: new THREE.Vector4(0, 0, -1, 1) }, spot: { value: new THREE.Vector4(0, 0, 0, 0) }, dim: DIM },
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vW = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D field; uniform float level, id, dim; uniform vec4 ring, spot; varying vec2 vUv; varying vec3 vW;
      void main() {
        float fv = texture2D(field, vec2(vUv.x, 1.0 - vUv.y)).r;
        float w = max(fwidth(fv), 1e-4);
        float red = 1.0 - smoothstep(level - w, level + w, fv);
        float d = length(vW.xz - ring.xy);
        float rw = max(fwidth(d), 1e-3);
        red = max(red, (1.0 - smoothstep(ring.w - rw, ring.w + rw, abs(d - ring.z))) * step(0.0, ring.z));
        float blue = 0.07 + dim;
        if (spot.w > 0.0) {
          float sd = length(vW.xz - spot.xy);
          float lit = 1.0 - smoothstep(spot.z - 0.4, spot.z + 0.4, sd);
          red *= 1.0 - lit * spot.w; blue = mix(blue, 0.0, lit * spot.w);
        }
        gl_FragColor = vec4(red, id, min(1.0, blue), 1.0);
      }`,
  }));
  P.top.rotation.x = -Math.PI / 2; P.top.position.y = 0.01; f.add(P.top);
  // the ink follows the clock by a moment: the flap falls, then the bottle goes
  f.anim((t) => { P.top.material.uniforms.level.value = pd.value(t - 0.25); });

  // ---- monitor, propped on von Neumann's book ------------------------------------------------
  P.book = f.box(26, 4, 26, [0, 0, -28], { lit: [0, 0.55], shade: [0, 0.85] });
  f.box(20, 1.2, 12, [0, 4, -28], { lit: [0, 0.3], shade: [0, 0.6] });
  f.box(4, 13, 3, [0, 5.2, -30], { lit: [0, 0.3], shade: [0, 0.6] });
  P.monitor = f.box(64, 37.8, 2.4, [0, 15.6, -28], { lit: [0, 0.75], shade: [0, 1] });
  P.Smon = f.surface(60, 33.75, [0, 34.5, -26.75]);
  f.box(9, 3, 3, [0, 53.4, -28], { lit: [0, 0.6], shade: [0, 0.95] });
  f.cyl(1.1, 0.4, [0, 0, 0], { lit: [0, 1] }, undefined).position.set(0, 54.9, -26.4);
  f.box(44, 1.4, 14, [0, 0, 10], { lit: [0, 0.22], shade: [0, 0.5] }); // keyboard

  // smiley sticky note on the bezel
  P.sticky = f.surface(10, 10, [-25, 10.5, -26.5], { W: 400, H: 400 });
  P.sticky.draw = (c: CanvasRenderingContext2D) => {
    c.fillStyle = bl(0.14); c.fillRect(0, 0, 400, 400);
    disc(c, 135, 150, 22, DARK); disc(c, 265, 150, 22, DARK);
    c.beginPath(); c.arc(200, 200, 110, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 20; c.lineCap = 'round'; c.strokeStyle = DARK; c.stroke();
  };

  // ---- flip clock: the P(doom) readout -------------------------------------------------------
  const clock = f.group([-40, 0, -35]); clock.rotation.x = -0.3; P.clock = clock;
  f.box(19, 11.5, 6, [0, 0, 0], { lit: [0, 0.8], shade: [0, 1] }, clock);
  P.Sclock = f.surface(17, 9.56, [0, 5.75, 3.05], { W: 680, H: 382, parent: clock });
  P.Sclock.stamp = (t: number) => pd.steps.indexOf(pd.lastStep(t));
  P.Sclock.live = (t: number) => { const st = pd.lastStep(t); return t - st.t < 1.2; };
  P.Sclock.draw = (c: CanvasRenderingContext2D, t: number) => {
    c.fillStyle = PAPER; c.fillRect(0, 0, 680, 382);
    const st = pd.lastStep(t), k = st.t < 0 ? 1 : prog(t, st.t, st.t + 0.32, ease.outCubic);
    text(c, 'P(DOOM)', 34, 62, 34, BLUE, { fam: F.mono(700), track: 6 });
    const digits = (v: number) => v.toFixed(2);
    c.save();
    // the card flips: the old value's lower half is squashed away, the new one unfolds
    const cy = 225;
    c.translate(340, cy); c.scale(1, k < 0.5 ? 1 - k * 2 * 0.98 : (k - 0.5) * 2 * 0.98 + 0.02); c.translate(-340, -cy);
    const idx = pd.steps.indexOf(st);
    text(c, digits(k < 0.5 && idx > 0 ? pd.steps[idx - 1]!.v : st.v), 340, cy, 240, DARK, { fam: F.archivo(100, 900), align: 'center', base: 'middle' });
    c.restore();
    c.fillStyle = PAPER; c.fillRect(0, cy - 4, 680, 8);
    // the red bar: the same number as area
    c.fillStyle = bl(0.2); c.fillRect(34, 350, 612, 14);
    c.fillStyle = RED; c.fillRect(34, 350, 612 * pd.value(t), 14);
  };

  // ---- ink bottle ---------------------------------------------------------------------------
  const bottle = f.group(BOTTLE); P.bottle = bottle;
  f.cyl(3.2, 6, [0, 0, 0], { lit: [0.9, 0.2], shade: [1, 0.6] }, bottle);
  f.cyl(1.4, 2, [0, 6, 0], { lit: [0, 0.5], shade: [0, 0.9] }, bottle);

  // ---- the marble ---------------------------------------------------------------------------
  P.marble = f.ball(1.5, [0, -500, 0], { lit: [0, 0.8], shade: [0, 1] });

  // ---- seesaw: ruler on an eraser, a king on one end ------------------------------------------
  f.box(3, 1.6, 5, [14, 0, -10], { lit: [0, 0.35], shade: [0, 0.7] });
  P.ruler = f.group([14, 1.6, -10]);
  f.box(30, 0.35, 3.6, [0, 0, 0], { lit: [0, 0.12], shade: [0, 0.4] }, P.ruler);
  P.king = f.group([-13.5, 0.35, 0], P.ruler);
  f.cyl(1.5, 0.8, [0, 0, 0], { lit: [0, 0.7], shade: [0, 1] }, P.king);
  f.cyl(1.1, 3.4, [0, 0.8, 0], { lit: [0, 0.7], shade: [0, 1] }, P.king, 0.7);
  f.ball(1.0, [0, 4.9, 0], { lit: [0, 0.7], shade: [0, 1] }, P.king);
  f.box(0.35, 1.5, 0.35, [0, 5.6, 0], { lit: [0, 1] }, P.king);
  f.box(1.1, 0.35, 0.35, [0, 6.2, 0], { lit: [0, 1] }, P.king);

  // ---- shredder -----------------------------------------------------------------------------
  P.shredder = f.box(28.4, 11, 16, [-24, 0, 16], { lit: [0, 0.3], shade: [0, 0.62] });
  P.Sshred = f.surface(28.4, 16, [-24, 11.02, 16]);
  P.Sshred.mesh.rotation.x = -Math.PI / 2;

  // ---- dev board ----------------------------------------------------------------------------
  f.box(14, 0.4, 10, [-20, 0, -16], { lit: [0, 0.45], shade: [0, 0.8] });
  for (const [x, z, w, d] of [[-23, -18, 3, 3], [-18, -14, 4, 2], [-16, -19, 2, 2]] as const) f.box(w, 0.7, d, [x, 0.4, z], { lit: [0, 0.9], shade: [0, 1] });

  // ---- coffee cup ---------------------------------------------------------------------------
  P.cup = f.group([-39, 0, -6]);
  const cupWall = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 3.4, 8.4, 40, 1, true), inkMat({ lit: [0, 0.1], shade: [0, 0.42], side: THREE.DoubleSide, crease: false }));
  cupWall.position.y = 4.2; P.cup.add(cupWall);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.55, 10, 24), inkMat({ lit: [0, 0.1], shade: [0, 0.42], crease: false }));
  handle.position.set(4.6, 4.3, 0); P.cup.add(handle);
  P.Scup = f.surface(6.4, 3.6, [0, 7.4, 0], { parent: P.cup });
  P.Scup.mesh.rotation.x = -Math.PI / 2;
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(4.0, 40), inkMat({ lit: [0, 0.92], flat: true, crease: false }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 7.38; P.cup.add(coffee);

  // ---- phone --------------------------------------------------------------------------------
  f.box(16.4, 0.8, 9.6, [22, 0, 27], { lit: [0, 0.85], shade: [0, 1] });
  P.Sphone = f.surface(15, 8.4375, [22, 0.82, 27]);
  P.Sphone.mesh.rotation.x = -Math.PI / 2;

  // ---- gooseneck lamp -----------------------------------------------------------------------
  P.lamp = f.group([-84, 0, -40]);
  f.cyl(5, 1.4, [0, 0, 0], { lit: [0, 0.6], shade: [0, 0.95] }, P.lamp);
  P.lampNeck = [] as THREE.Mesh[];
  for (let i = 0; i < 12; i++) P.lampNeck.push(f.ball(1.25, [0, 0, 0], { lit: [0, 0.5], shade: [0, 0.9] }, P.lamp));
  P.lampHead = f.group([0, 0, 0], P.lamp);
  const shadeM = new THREE.Mesh(new THREE.CylinderGeometry(2, 6.5, 9, 32, 1, true), inkMat({ lit: [0, 0.6], shade: [0, 0.95], side: THREE.DoubleSide, crease: false }));
  shadeM.rotation.x = Math.PI / 2; shadeM.position.z = 4.5; P.lampHead.add(shadeM);
  P.bulb = new THREE.Mesh(new THREE.CircleGeometry(6.3, 32), inkMat({ lit: [0, 0.35], flat: true, crease: false, glow: true }));
  P.bulb.position.z = 8.6; P.lampHead.add(P.bulb);

  // ---- window with the moon -----------------------------------------------------------------
  P.wallStuff = [f.box(50, 33, 1.5, [62, 68, -47.4], { lit: [0, 0.75], shade: [0, 1] })];
  P.Swin = f.surface(46, 25.875, [62, 84.5, -46.55]);
  P.wallStuff.push(P.Swin.mesh);

  // ---- calculator, its tape, Newton's cradle ------------------------------------------------
  P.calc = f.box(13, 3.4, 19, [56, 0, 18], { lit: [0, 0.4], shade: [0, 0.75] });
  P.Scalc = f.surface(8, 4.5, [56, 3.42, 12.5]);
  P.Scalc.mesh.rotation.x = -Math.PI / 2;
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) f.box(2, 0.5, 1.8, [51.6 + q * 2.9, 3.4, 17.5 + r * 2.5], { lit: [0, q === 3 ? 0.9 : 0.12], shade: [0, q === 3 ? 1 : 0.4] });
  // the cradle straddles the calculator's tape: no base, legs either side of the paper
  P.cradle = f.group([56, 0, -12]);
  for (const sx of [-7, 7]) for (const sz of [-3.5, 3.5]) f.box(0.45, 12.3, 0.45, [sx, 0, sz], { lit: [0, 0.8], shade: [0, 1] }, P.cradle);
  for (const sz of [-3.5, 3.5]) f.box(14.4, 0.45, 0.45, [0, 12.3, sz], { lit: [0, 0.8], shade: [0, 1] }, P.cradle);
  P.balls = [] as THREE.Group[];
  for (let i = 0; i < 5; i++) {
    const g = f.group([(i - 2) * 2.6, 12.5, 0], P.cradle);
    f.ball(1.3, [0, -8, 0], { lit: [0, 0.35], shade: [0, 0.9] }, g);
    f.box(0.08, 8, 0.08, [0, -8, 0], { lit: [0, 1], flat: true, crease: false }, g);
    P.balls.push(g);
  }

  // ---- index card box (the Chinese room) and the paper bag ------------------------------------
  const cb = f.group([72, 0, -22]); P.cardBox = cb;
  const cbm = { lit: [0, 0.3] as [number, number], shade: [0, 0.65] as [number, number], side: THREE.DoubleSide };
  f.box(16, 0.5, 12, [0, 0, 0], cbm, cb); f.box(16, 0.5, 12, [0, 10.5, 0], cbm, cb);
  f.box(0.5, 11, 12, [-7.75, 0, 0], cbm, cb); f.box(0.5, 11, 12, [7.75, 0, 0], cbm, cb); f.box(16, 11, 0.5, [0, 0, -5.75], cbm, cb);
  f.box(16, 6.6, 0.5, [0, 0, 5.75], cbm, cb); f.box(16, 3, 0.5, [0, 8, 5.75], cbm, cb);
  f.box(3, 1.4, 0.5, [-6.5, 6.6, 5.75], cbm, cb); f.box(3, 1.4, 0.5, [6.5, 6.6, 5.75], cbm, cb);
  P.Sroom = f.surface(8.9, 5.006, [0, 7.3, -5.4], { parent: cb });
  P.bag = f.box(7, 10, 5, [56, 0, -26], { lit: [0, 0.18], shade: [0, 0.45] });

  // ---- pen holder, postcard, glasses, like button ---------------------------------------------
  f.cyl(4, 11, [40, 0, -19.5], { lit: [0, 0.5], shade: [0, 0.85] });
  P.Spost = f.surface(14.2, 7.9875, [40, 4.2, -12.5]);
  P.Spost.mesh.rotation.x = -0.28;
  P.glasses = f.group([6, 0, 32]);
  P.lens = [] as THREE.Mesh[];
  for (const sx of [-3.3, 3.3]) {
    const fr = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.28, 8, 40), inkMat({ lit: [0, 1], crease: false }));
    fr.position.set(sx, 3, 0); fr.rotation.x = -0.2; P.glasses.add(fr);
    const ln = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), inkMat({ lit: [0, 0.12], flat: true, crease: false, glow: true }));
    ln.position.set(sx, 3, 0); ln.rotation.x = -0.2; P.glasses.add(ln); P.lens.push(ln);
    f.box(0.3, 0.3, 12, [sx * 1.85, 3.6, -6], { lit: [0, 1] }, P.glasses);
  }
  f.box(1.6, 0.3, 0.3, [0, 3.6, 0], { lit: [0, 1] }, P.glasses);
  P.like = f.cyl(3, 1.6, [38, 0, 6], { lit: [0, 0.3], shade: [0, 0.7] });

  // ---- calendar -----------------------------------------------------------------------------
  // the review checklist stands by the front of the desk, facing left: the way the engine will come
  const cal = f.group([-9, 0, 33.5]); cal.rotation.order = 'YXZ'; cal.rotation.y = -Math.PI / 2; cal.rotation.x = -0.2; P.cal = cal;
  f.box(17, 11, 0.8, [0, 0, 0], { lit: [0, 0.6], shade: [0, 0.9] }, cal);
  P.Scal = f.surface(16, 9, [0, 5.7, 0.45], { parent: cal });

  // ---- toy train on a stadium of track --------------------------------------------------------
  P.track = { cx: -67, cz: 2, half: 18, r: 9 };
  const tr = P.track, curve = new THREE.CatmullRomCurve3(Array.from({ length: 160 }, (_, i) => { const p = trackPos(tr, i / 160); return new THREE.Vector3(p.x, 0.25, p.z); }), true);
  for (const off of [-1.2, 1.2]) {
    const pts = Array.from({ length: 200 }, (_, i) => { const p = trackPos(tr, i / 200); return new THREE.Vector3(p.x + Math.cos(p.h) * off, 0.3, p.z - Math.sin(p.h) * off); });
    f.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, 0.18, 5, true), inkMat({ lit: [0, 1], flat: true, crease: false })));
  }
  for (let i = 0; i < 46; i++) { const p = trackPos(tr, i / 46); const s = f.box(3.4, 0.2, 0.7, [p.x, 0.02, p.z], { lit: [0, 0.45], flat: true, crease: false }); s.rotation.y = p.h; }
  void curve;
  P.engine = f.group([0, 0, 0]); P.car = f.group([0, 0, 0]);
  f.box(3.2, 2.4, 7, [0, 1, 0], { lit: [0, 0.75], shade: [0, 1] }, P.engine);
  f.box(3.2, 2.2, 2.6, [0, 3.4, -2], { lit: [0, 0.75], shade: [0, 1] }, P.engine);
  f.cyl(0.7, 1.6, [0, 3.4, 2.2], { lit: [0, 1] }, P.engine);
  P.headlight = f.cyl(0.8, 0.3, [0, 0, 0], { lit: [0, 0], flat: true, glow: true }, P.engine); P.headlight.rotation.x = Math.PI / 2; P.headlight.position.set(0, 2.4, 3.6);
  f.box(3.2, 1.6, 6, [0, 1, 0], { lit: [0, 0.3], shade: [0, 0.65] }, P.car);
  for (const g of [P.engine, P.car]) for (const wz of [-2, 2]) for (const wx of [-1.7, 1.7]) { const w = f.cyl(0.95, 0.4, [0, 0, 0], { lit: [0, 1], crease: false }, g, 0.95, 16); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.95, wz); }

  // The train laps until "left". There, at the end of the left straight (heading toward us), the engine swerves left,
  // across the infield and off along the front of the desk; the car comes uncoupled and coasts straight on to the desk edge.
  // (The lap time is set so that, earlier, the car is heading at the coffee cup on "now": see seq2.)
  const tLeft = f.at('Sharp left turn', 'left'), TL = 4 * tr.half + 2 * Math.PI * tr.r, sT = 2 * tr.half + Math.PI * tr.r + 35.93;
  const LAP = (tLeft - (f.at('But now', 'now') - 0.1)) / 10.765, v0 = TL / LAP;
  P.trainAt = (t: number) => {
    if (t < tLeft) {
      const u = sT / TL + (t - tLeft) / LAP;
      return { e: trackPos(tr, u), c: trackPos(tr, u - 7.6 / TL) };
    }
    const tau = t - tLeft, x0 = tr.cx - tr.r, z0 = tr.cz - tr.half + 35.93;
    const R = 11, arc = (Math.PI / 2) * R, De = arc + 38, Te = 1.75, de = De * (1 - Math.pow(1 - clamp(tau / Te), 2));
    const ph = Math.min(de, arc) / R, ex = Math.max(0, de - arc);
    const e = { x: x0 + R - R * Math.cos(ph) + ex, z: z0 + R * Math.sin(ph), h: ph };
    const Dc = 41.5 - (z0 - 7.6), Tc = (2 * Dc) / v0, dc = Dc * (1 - Math.pow(1 - clamp(tau / Tc), 2));
    return { e, c: { x: x0, z: z0 - 7.6 + dc, h: 0 } };
  };
  f.anim((t) => {
    const p = P.trainAt(t);
    P.engine.position.set(p.e.x, 0.3, p.e.z); P.engine.rotation.y = p.e.h;
    P.car.position.set(p.c.x, 0.3, p.c.z); P.car.rotation.y = p.c.h;
  });

  // ---- chair, kill switch -------------------------------------------------------------------
  const chair = f.group([120, -75, 40]); chair.rotation.y = -1.1; P.chair = chair;
  f.box(46, 6, 44, [0, 40, 0], { lit: [0, 0.5], shade: [0, 0.85] }, chair);
  f.box(46, 54, 5, [0, 50, 22], { lit: [0, 0.5], shade: [0, 0.85] }, chair);
  f.cyl(3, 40, [0, 0, 0], { lit: [0, 0.8], shade: [0, 1] }, chair);
  P.wallStuff.push(f.box(13, 13, 5, [22, 54, -47], { lit: [0, 0.25], shade: [0, 0.6] }));
  P.kill = f.cyl(4.2, 3, [0, 0, 0], { lit: [1, 0.05], shade: [1, 0.5] }); P.kill.rotation.x = Math.PI / 2; P.kill.position.set(22, 60.5, -40.5); P.wallStuff.push(P.kill);

  // ---- under the desk: the tangle, the power strip, the cable reel ---------------------------
  const rnd = mulberry32(5);
  P.tangle = f.group();
  for (let i = 0; i < 9; i++) {
    const pts: THREE.Vector3[] = [];
    let x = -56 + rnd() * 36, y = -6, z = -36 + rnd() * 26;
    const n = 6 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      pts.push(new THREE.Vector3(x, y, z));
      x = clamp(x + (rnd() - 0.5) * 34, -64, -16); y = clamp(y - 4 - rnd() * 18 + (k > n - 3 ? 22 * rnd() : 0), -72, -6); z = clamp(z + (rnd() - 0.5) * 22, -40, -4);
    }
    const tint = 0.3;
    P.tangle.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 1.7 + rnd() * 1.1, 8), inkMat({ lit: [0, tint], shade: [0, Math.min(1, tint + 0.35)], crease: false })));
  }
  P.strip = f.group([-24, -30, -41.9]);
  f.box(34, 5.5, 3.2, [0, 0, 0], { lit: [0, 0.12], shade: [0, 0.45] }, P.strip);
  P.leds = [] as THREE.Mesh[];
  for (let i = 0; i < 3; i++) { P.leds.push(f.cyl(0.75, 0.3, [0, 0, 0], { lit: [0, 0.5], flat: true, glow: true, crease: false }, P.strip)); P.leds[i].rotation.x = Math.PI / 2; P.leds[i].position.set(-13 + i * 2.6, 2.75, 3.3); }
  for (let i = 0; i < 4; i++) for (const dx of [-0.8, 0.8]) f.box(0.5, 2, 0.2, [-3 + i * 5 + dx, 1.7, 3.2], { lit: [0, 1], flat: true, crease: false }, P.strip);
  P.fuse = f.box(3, 2, 0.5, [14.5, 1.75, 3.2], { lit: [0, 0.4], flat: true, glow: true }, P.strip);
  P.reel = f.cyl(12, 5, [0, 0, 0], { lit: [0, 0.35], shade: [0, 0.7] }); P.reel.rotation.x = Math.PI / 2; P.reel.position.set(-66, -36, -39);
  P.Sreel = f.surface(24, 24, [-66, -36, -36.4], { W: 720, H: 720 });
  const cable = (pts: V3[], r = 0.6) => f.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 60, r, 6), inkMat({ lit: [0, 0.9], crease: false })));
  cable([[-66, -48, -37], [-60, -52, -38], [-48, -40, -39], [-41, -27.5, -39.5]]);
  cable([[-7, -27.5, -39.5], [-2, -30, -40], [1, -44, -40.5], [2, -57.2, -41]]);
  P.Splot = f.surface(64, 36, [34, -37, -41.9]);

  // ---- paperclip box on the floor -------------------------------------------------------------
  P.clipBox = f.group([-18, -75, 56]);
  f.box(16, 0.5, 11, [0, 0, 0], { lit: [0, 0.4], shade: [0, 0.75] }, P.clipBox);
  for (const [w, d, x, z] of [[16, 0.5, 0, -5.25], [16, 0.5, 0, 5.25], [0.5, 11, -7.75, 0], [0.5, 11, 7.75, 0]] as const) f.box(w, 4.5, d, [x, 0, z], { lit: [0, 0.4], shade: [0, 0.75], side: THREE.DoubleSide }, P.clipBox);
  void [LIGHT, ik, ring, seg, rrect, poly, clip2];
}

/** Position and heading on the stadium track at lap fraction u (0..1). Runs clockwise seen from above. */
export function trackPos(tr: { cx: number; cz: number; half: number; r: number }, u: number) {
  const L = 4 * tr.half + 2 * Math.PI * tr.r;
  let s = (((u % 1) + 1) % 1) * L;
  const st = 2 * tr.half, arc = Math.PI * tr.r;
  // right straight, heading -z
  if (s < st) return { x: tr.cx + tr.r, z: tr.cz + tr.half - s, h: Math.PI };
  s -= st;
  if (s < arc) { const a = s / tr.r; return { x: tr.cx + Math.cos(a) * tr.r, z: tr.cz - tr.half - Math.sin(a) * tr.r, h: Math.PI + a }; }
  s -= arc;
  if (s < st) return { x: tr.cx - tr.r, z: tr.cz - tr.half + s, h: 0 };
  s -= st;
  const a = s / tr.r;
  return { x: tr.cx - Math.cos(a) * tr.r, z: tr.cz + tr.half + Math.sin(a) * tr.r, h: a };
}
