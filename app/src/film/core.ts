// The film is one take in one world. This is the rig: a 3D world of flat-inked props,
// drawing surfaces (canvases that live on real faces of those props), one keyed camera path,
// and a list of animators that pose the world as a pure function of song time.
import * as THREE from 'three';
import type { Lyrics, Line, Word } from '../engine/lyrics';
import type { AudioData } from '../engine/audio';
import type { PostOverrides } from '../engine/scene';
import { SCALE } from '../engine/gl';
import { clamp, ease, lerp, prog } from '../engine/util';
import { drawLyric, lyricWidth, tagPlate } from './lyric';
import { inkMat, newId, PAPER, BLUE, type InkOpts } from './ink';

export type V3 = [number, number, number];
export const v3 = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
export type Ease = (t: number) => number;

export interface CamKey {
  t: number;
  pos: V3;
  tgt: V3;
  up?: V3;
  fov?: number;
  /** Roll about the view axis, radians. */
  roll?: number;
  /** Ease of the move that arrives at this key. */
  ease?: Ease;
  /** Come to rest here even if the path goes on. */
  stop?: boolean;
  /** Bezier control point for the camera position on the way to this key. */
  via?: V3;
}

/** A canvas that lives on a face in the world. Drawn in a logical 1920x1080 (or w x h) space. */
export class Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  mesh: THREE.Mesh;
  /** Fallback draw when no clip covers t. */
  draw: (c: CanvasRenderingContext2D, t: number) => void = () => {};
  live: (t: number) => boolean = () => false;
  /** Timed drawings: clip i owns the canvas from its `a` until the next clip's `a`; after its `b` it holds its last frame. */
  clips: { a: number; b: number; fn: (c: CanvasRenderingContext2D, t: number) => void }[] = [];
  alpha = false;
  /** Anything else the picture depends on besides the clip (so a seek redraws it). */
  stamp: (t: number) => string | number = () => '';
  /** Drawn over whatever clip is showing while t is in [a, b] (lyric tags on a surface). */
  overs: { a: number; b: number; fn: (c: CanvasRenderingContext2D, t: number) => void }[] = [];
  over(a: number, b: number, fn: (c: CanvasRenderingContext2D, t: number) => void) { this.overs.push({ a, b, fn }); }
  private key = '';
  constructor(public W: number, public H: number, public w: number, public h: number, res = 1, o: InkOpts = {}) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.round(W * res * SCALE);
    this.canvas.height = Math.round(H * res * SCALE);
    this.ctx = this.canvas.getContext('2d')!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.alpha = !!o.alpha;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), inkMat({ map: this.tex, crease: false, flat: true, ...o }));
  }
  clip(a: number, b: number, fn: (c: CanvasRenderingContext2D, t: number) => void) { this.clips.push({ a, b, fn }); this.clips.sort((x, y) => x.a - y.a); }
  update(t: number, force = false) {
    let ci = -1;
    for (let i = 0; i < this.clips.length; i++) if (this.clips[i]!.a <= t) ci = i;
    const cl = ci >= 0 ? this.clips[ci]! : null;
    const ov = this.overs.filter((o) => t >= o.a && t <= o.b);
    const moving = (cl ? t <= cl.b : this.live(t)) || ov.length > 0;
    const key = `${ci}:${moving ? 'm' : 's'}:${this.stamp(t)}`;
    if (!force && !moving && key === this.key) return;
    this.key = key;
    const c = this.ctx, k = this.canvas.width / this.W;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (this.alpha) c.clearRect(0, 0, this.W, this.H);
    else { c.fillStyle = PAPER; c.fillRect(0, 0, this.W, this.H); }
    c.save();
    if (cl) cl.fn(c, Math.min(t, cl.b)); else this.draw(c, t);
    c.restore();
    for (const o of ov) { c.save(); o.fn(c, t); c.restore(); }
    this.tex.needsUpdate = true;
  }
}

export class Film {
  world = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 4000);
  keys: CamKey[] = [];
  surfaces: Surface[] = [];
  anims: ((t: number) => void)[] = [];
  posts: ((t: number, p: PostOverrides) => void)[] = [];
  /** Where the marble is: the last segment whose window holds t wins; outside all of them it is hidden. */
  marbleSegs: { a: number; b: number; fn: (t: number) => V3 }[] = [];
  marble(a: number, b: number, fn: (t: number) => V3) { this.marbleSegs.push({ a, b, fn }); }
  /** A second view of the world rendered into a texture first (the outro's printed sheet). */
  prepass: { from: number; key: Omit<CamKey, 't'>; rt: THREE.WebGLRenderTarget; hide: THREE.Object3D[] } | null = null;
  setPose(k: Omit<CamKey, 't'>) { const c = this.cam; c.position.set(...k.pos); c.up.set(...(k.up ?? [0, 1, 0])); c.lookAt(new THREE.Vector3(...k.tgt)); c.fov = k.fov ?? 35; c.near = 1; c.far = 6000; c.updateProjectionMatrix(); c.updateMatrixWorld(); }
  /** Named props, so later shots can reuse what earlier ones built. */
  P: Record<string, any> = {};
  constructor(public lyrics: Lyrics, public audio: AudioData) {}

  // ---- time anchors -------------------------------------------------------------------------
  line(q: string, nth = 0): Line { return this.lyrics.get(q, nth); }
  /** Start time of word `w` (index or text) in the line matching `q`. */
  at(q: string, w: number | string = 0, nth = 0): number { return this.word(q, w, nth).start; }
  word(q: string, w: number | string = 0, nth = 0): Word {
    const l = this.line(q, nth);
    if (typeof w === 'number') return l.words[w < 0 ? l.words.length + w : w]!;
    const n = w.toLowerCase();
    const f = l.words.find((x) => x.w.toLowerCase().replace(/[^a-z0-9()]/g, '').startsWith(n.replace(/[^a-z0-9()]/g, '')));
    if (!f) throw new Error(`word "${w}" not in line "${l.text}"`);
    return f;
  }
  /** Time of the beat at/after t (+ n beats). */
  beat(t: number, n = 0) { return this.audio.timeOfBeat(Math.ceil(this.audio.beatAt(t) - 1e-3) + n); }
  get spb() { return 60 / this.audio.bpm; }
  /** Start of syllable i of a word (even split when the alignment has none). */
  syl(w: Word, i: number) { return w.syl?.[i]?.[0] ?? w.start + ((w.end - w.start) * i) / 3; }
  /** Extra camera roll over time (full turns that end where they began). */
  spins: ((t: number) => number)[] = [];

  // ---- building -----------------------------------------------------------------------------
  add<T extends THREE.Object3D>(o: T, parent: THREE.Object3D = this.world): T { parent.add(o); return o; }
  box(w: number, h: number, d: number, at: V3, o: InkOpts = {}, parent?: THREE.Object3D) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), inkMat(o));
    m.position.set(at[0], at[1] + h / 2, at[2]);
    return this.add(m, parent);
  }
  cyl(r: number, h: number, at: V3, o: InkOpts = {}, parent?: THREE.Object3D, r2 = r, seg = 40) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, seg), inkMat({ crease: true, ...o }));
    m.position.set(at[0], at[1] + h / 2, at[2]);
    return this.add(m, parent);
  }
  ball(r: number, at: V3, o: InkOpts = {}, parent?: THREE.Object3D) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), inkMat({ crease: false, ...o }));
    m.position.set(at[0], at[1], at[2]);
    return this.add(m, parent);
  }
  group(at: V3 = [0, 0, 0], parent?: THREE.Object3D) { const g = new THREE.Group(); g.position.set(at[0], at[1], at[2]); return this.add(g, parent); }
  /** A drawing surface, w x h world units, canvas W x H logical px. Faces +z until you rotate its mesh. */
  surface(w: number, h: number, at: V3, o: { W?: number; H?: number; res?: number; parent?: THREE.Object3D; ink?: InkOpts } = {}) {
    const s = new Surface(o.W ?? 1920, o.H ?? Math.round((o.W ?? 1920) * h / w), w, h, o.res ?? 1, o.ink);
    s.mesh.position.set(at[0], at[1], at[2]);
    this.add(s.mesh, o.parent);
    this.surfaces.push(s);
    return s;
  }
  anim(f: (t: number) => void) { this.anims.push(f); }
  /** A lyric line as a paper tag printed on a surface, at (x, y) = left end of the baseline, in that canvas's px. */
  tagOn(s: Surface, q: string, x: number, y: number, o: { nth?: number; size?: number; key?: string; from?: number; to?: number; plate?: boolean } = {}) {
    const l = this.line(q, o.nth ?? 0), size = o.size ?? 62, pad = size * 0.42, w = lyricWidth(l.words, size, o.key) + pad * 2, h = size + pad * 1.5;
    const t0 = o.from ?? l.start - 0.3, t1 = o.to ?? Math.min(l.end + 0.9, (this.lyrics.lines[this.lyrics.lines.indexOf(l) + 1]?.start ?? 1e9) - 0.36);
    s.over(t0, t1, (c, t) => {
      const k = Math.min(prog(t, t0, t0 + 0.14, ease.outCubic), 1 - prog(t, t1 - 0.12, t1));
      c.translate(x - pad, y - size * 0.34 - h / 2 + (1 - k) * 30); c.globalAlpha = k;
      if (o.plate !== false) { c.beginPath(); c.moveTo(22, 5); c.lineTo(w - 5, 5); c.lineTo(w - 5, h - 5); c.lineTo(22, h - 5); c.lineTo(5, h / 2); c.closePath(); c.fillStyle = PAPER; c.fill(); c.lineWidth = 5; c.lineJoin = 'round'; c.strokeStyle = BLUE; c.stroke(); }
      drawLyric(c, l.words, t, pad, h / 2 + size * 0.34, size, o.key);
    });
  }
  /**
   * A lyric line as a paper tag in the world: it stands at `at`, faces the lens and keeps a readable size.
   * `h` is its height as a fraction of the frame; `key` is the one word that gets the emphasis.
   */
  tag(q: string, at: V3 | ((t: number) => V3), o: { nth?: number; h?: number; key?: string; from?: number; to?: number; words?: [number, number]; pop?: boolean } = {}) {
    const l = this.line(q, o.nth ?? 0), ws = l.words.slice(o.words?.[0] ?? 0, o.words?.[1] ?? l.words.length);
    // (measured with the key word in its heavier weight, or the plate comes up short)
    const size = 78, pad = 34, wpx = lyricWidth(ws, size, o.key) + pad * 2, hpx = size + pad * 1.5;
    const s = this.surface(wpx / hpx, 1, [0, 0, 0], { W: Math.ceil(wpx), H: Math.ceil(hpx), ink: { alpha: true } });
    const t0 = o.from ?? ws[0]!.start - 0.3, t1 = o.to ?? Math.min(l.end + 0.9, (this.lyrics.lines[this.lyrics.lines.indexOf(l) + 1]?.start ?? 1e9) - 0.36);
    s.clip(t0 - 0.2, t1 + 0.3, (c, t) => { tagPlate(c, wpx, hpx); drawLyric(c, ws, t, pad, hpx / 2 + size * 0.34, size, o.key); });
    const v = new THREE.Vector3();
    this.late((t) => {
      // (pop: springs up from nothing. Otherwise it arrives almost at size, which does not smear when the lens is moving fast)
      const k = o.pop === false ? (t >= t0 && t < t1 + 0.1 ? lerp(0.88, 1, prog(t, t0, t0 + 0.1)) * (1 - 0.5 * prog(t, t1, t1 + 0.1)) : 0) : Math.min(prog(t, t0, t0 + 0.16, ease.outBack), 1 - prog(t, t1, t1 + 0.14));
      s.mesh.visible = k > 0.01;
      if (!s.mesh.visible) return;
      const p = typeof at === 'function' ? at(t) : at;
      s.mesh.position.set(p[0], p[1], p[2]);
      s.mesh.quaternion.copy(this.cam.quaternion);
      const d = v.copy(s.mesh.position).sub(this.cam.position).dot(this.cam.getWorldDirection(new THREE.Vector3()));
      s.mesh.scale.setScalar(Math.max(0.001, k * (o.h ?? 0.085) * 2 * Math.max(1, d) * Math.tan((this.cam.fov * Math.PI) / 360)));
    });
    return s;
  }
  /** Runs after the camera is set (billboards, things attached to the lens). */
  lates: ((t: number) => void)[] = [];
  late(f: (t: number) => void) { this.lates.push(f); }
  post(f: (t: number, p: PostOverrides) => void) { this.posts.push(f); }

  // ---- camera -------------------------------------------------------------------------------
  key(k: CamKey) { this.keys.push(k); }
  /** Hold the previous key's framing until t. */
  hold(t: number) { const p = this.keys[this.keys.length - 1]!; this.keys.push({ ...p, t, via: undefined, ease: ease.linear }); }
  /** Camera pose that frames a surface exactly (fill 1) or looser/tighter, optionally off-centre (in surface units). */
  frame(s: Surface | THREE.Mesh, fill = 1, off: [number, number] = [0, 0], fov = 35): Omit<CamKey, 't'> {
    const mesh = s instanceof Surface ? s.mesh : s;
    mesh.updateWorldMatrix(true, false);
    const h = (mesh.geometry as THREE.PlaneGeometry).parameters.height * mesh.getWorldScale(new THREE.Vector3()).y;
    const q = mesh.getWorldQuaternion(new THREE.Quaternion());
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(q), u = new THREE.Vector3(0, 1, 0).applyQuaternion(q), r = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const c = mesh.getWorldPosition(new THREE.Vector3()).addScaledVector(r, off[0]).addScaledVector(u, off[1]);
    const d = (h / fill / 2) / Math.tan((fov * Math.PI) / 360);
    const p = c.clone().addScaledVector(n, d);
    return { pos: [p.x, p.y, p.z], tgt: [c.x, c.y, c.z], up: [u.x, u.y, u.z], fov };
  }
  /** Velocity (per second) of pos and tgt at each key: the path is one curve, not a chain of eased hops. */
  private tan: { p: V3; g: V3 }[] = [];
  finish() {
    this.keys.sort((a, b) => a.t - b.t);
    const K = this.keys, same = (a: CamKey, b: CamKey) => Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]) + Math.hypot(a.tgt[0] - b.tgt[0], a.tgt[1] - b.tgt[1], a.tgt[2] - b.tgt[2]) < 1e-3;
    this.tan = K.map((k, i) => {
      const p = K[i - 1], n = K[i + 1], zero = { p: [0, 0, 0] as V3, g: [0, 0, 0] as V3 };
      // rest at the ends, at invisible jumps, and going into or out of a hold; otherwise carry the speed through
      if (k.stop || !p || !n || k.t - p.t < 0.01 || n.t - k.t < 0.01 || same(p, k) || same(k, n) || n.via || k.via) return zero;
      const dt = n.t - p.t, f = (a: number, b0: number, c: number) => {
        const m = (c - a) / dt, lim = 2.5 * Math.min(Math.abs(b0 - a) / (k.t - p.t), Math.abs(c - b0) / (n.t - k.t));
        return (b0 - a) * (c - b0) <= 0 ? 0 : Math.sign(m) * Math.min(Math.abs(m), lim);
      };
      return { p: [0, 1, 2].map((j) => f(p.pos[j]!, k.pos[j]!, n.pos[j]!)) as V3, g: [0, 1, 2].map((j) => f(p.tgt[j]!, k.tgt[j]!, n.tgt[j]!)) as V3 };
    });
  }

  private _a = new THREE.Vector3(); private _b = new THREE.Vector3(); private _c = new THREE.Vector3();
  setCamera(t: number) {
    const K = this.keys;
    let i = 0;
    while (i + 1 < K.length && K[i + 1]!.t <= t) i++;
    const j = Math.min(i + 1, K.length - 1), a = K[i]!, b = K[j]!;
    const dt = b.t - a.t, x = dt > 0 ? clamp((t - a.t) / dt) : 0;
    let u = x * x * (3 - 2 * x);
    const pos = this._a, tgt = this._b, up = this._c;
    if (b.via) {
      u = (b.ease ?? ease.inOutCubic)(x);
      const v = b.via, w = 1 - u;
      pos.set(w * w * a.pos[0] + 2 * w * u * v[0] + u * u * b.pos[0], w * w * a.pos[1] + 2 * w * u * v[1] + u * u * b.pos[1], w * w * a.pos[2] + 2 * w * u * v[2] + u * u * b.pos[2]);
      tgt.set(lerp(a.tgt[0], b.tgt[0], u), lerp(a.tgt[1], b.tgt[1], u), lerp(a.tgt[2], b.tgt[2], u));
    } else {
      const x2 = x * x, x3 = x2 * x, h00 = 2 * x3 - 3 * x2 + 1, h10 = (x3 - 2 * x2 + x) * dt, h01 = -2 * x3 + 3 * x2, h11 = (x3 - x2) * dt;
      const ta = this.tan[i]!, tb = this.tan[j]!;
      pos.set(h00 * a.pos[0] + h10 * ta.p[0] + h01 * b.pos[0] + h11 * tb.p[0], h00 * a.pos[1] + h10 * ta.p[1] + h01 * b.pos[1] + h11 * tb.p[1], h00 * a.pos[2] + h10 * ta.p[2] + h01 * b.pos[2] + h11 * tb.p[2]);
      tgt.set(h00 * a.tgt[0] + h10 * ta.g[0] + h01 * b.tgt[0] + h11 * tb.g[0], h00 * a.tgt[1] + h10 * ta.g[1] + h01 * b.tgt[1] + h11 * tb.g[1], h00 * a.tgt[2] + h10 * ta.g[2] + h01 * b.tgt[2] + h11 * tb.g[2]);
    }
    const ua = a.up ?? [0, 1, 0], ub = b.up ?? [0, 1, 0];
    up.set(lerp(ua[0], ub[0], u), lerp(ua[1], ub[1], u), lerp(ua[2], ub[2], u)).normalize();
    const cam = this.cam;
    cam.position.copy(pos);
    cam.up.copy(up);
    cam.lookAt(tgt);
    let roll = lerp(a.roll ?? 0, b.roll ?? 0, u);
    for (const sp of this.spins) roll += sp(t);
    if (roll) cam.rotateZ(roll);
    cam.fov = lerp(a.fov ?? 35, b.fov ?? 35, u);
    const d = pos.distanceTo(tgt);
    cam.near = Math.max(0.02, d * 0.04);
    cam.far = 6000;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  pose(t: number, post: PostOverrides, pre?: () => void) {
    for (const f of this.anims) f(t);
    const mb = this.P.marble as THREE.Mesh | undefined;
    if (mb) {
      let p: V3 = [0, -900, 0];
      for (const s of this.marbleSegs) if (t >= s.a && t < s.b) p = s.fn(t);
      mb.position.set(p[0], p[1], p[2]);
    }
    const pp = this.prepass;
    if (pp && pre && t >= pp.from) {
      this.setPose(pp.key);
      for (const f of this.lates) f(t);
      for (const s of this.surfaces) s.update(t);
      for (const h of pp.hide) h.visible = false;
      pre();
      for (const h of pp.hide) h.visible = true;
    }
    this.setCamera(t);
    for (const f of this.lates) f(t);
    for (const s of this.surfaces) s.update(t);
    for (const f of this.posts) f(t, post);
  }
}

export { inkMat, newId };
