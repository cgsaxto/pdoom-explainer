// Print pass. Scenes do not output colour: they output ink coverage per plate
// (R = red plate, B = blue plate, G = object id for key lines). This pass screens each plate
// into halftone dots, shifts the plates against each other, overprints them on paper
// (multiply), and adds the fixed text overlay.
import * as THREE from 'three';
import { FSPass, W, H } from './gl';
import { SRGB } from './palette';

/** Identity: plate coverage is already 0..1 (kept for the engine's sampling error estimate). */
export const SHOULDER_GLSL = /* glsl */ `vec3 shoulder(vec3 x) { return clamp(x, 0.0, 1.0); }`;

export interface PostParams {
  /** Opacity of the text overlay (lyric line, notes). */
  hud: number;
  /** Red plate offset against blue, logical px. */
  misreg: [number, number];
  /** Red plate rotation against blue, radians. */
  plateRot: number;
  /** Halftone cell size, logical px. */
  dot: number;
  /** 0..1: lift the red plate off the print (the "blues" bar). */
  redDrop: number;
  /** 0..1 fade to bare paper. */
  flash: number;
  /** 0..1 flood with both inks (near black). */
  fade: number;
  shake: [number, number];
  zoom: number;
}

export const DEFAULT_POST: PostParams = {
  hud: 1,
  misreg: [1.6, -1.1],
  plateRot: 0,
  dot: 7,
  redDrop: 0,
  flash: 0,
  fade: 0,
  shake: [0, 0],
  zoom: 1,
};

const v3 = (c: readonly number[]) => `vec3(${c.map((x) => x.toFixed(5)).join(',')})`;

export class Post {
  private final: FSPass;
  constructor() {
    this.final = new FSPass(/* glsl */ `
      uniform sampler2D src; uniform sampler2D hudTex;
      uniform float hud, plateRot, dotSize, redDrop, flash, fade, time, zoom;
      uniform vec2 shake, res, misreg;
      const vec3 PAPER = ${v3(SRGB.paper)};
      const vec3 T_BLUE = ${v3(SRGB.blue)};
      const vec3 T_RED = ${v3(SRGB.red)};

      // one plate's halftone screen: coverage c -> ink 0/1 on a grid rotated by ang
      float screen(float c, vec2 p, float ang) {
        if (c < 0.015) return 0.0;
        if (c > 0.985) return 1.0;
        // pale tints print as a clean flat tone; dots are for shade
        if (c < 0.34) return c * 0.92;
        vec2 q = rot2(ang) * p / dotSize;
        float d = length(fract(q) - 0.5);
        float r = sqrt(c / PI) * (1.0 + 0.2533 * c * c);
        float aa = 0.75 / (dotSize * PX_SCALE);
        return 1.0 - smoothstep(r - aa, r + aa, d);
      }
      float keyLine(vec2 uv) {
        vec2 e = 1.0 / res;
        float a = texture(src, uv + vec2(e.x, 0.0)).g, b = texture(src, uv - vec2(e.x, 0.0)).g;
        float c = texture(src, uv + vec2(0.0, e.y)).g, d = texture(src, uv - vec2(0.0, e.y)).g;
        return smoothstep(0.004, 0.009, max(abs(a - b), abs(c - d)));
      }
      void main() {
        vec2 uv = (vUv - 0.5) / zoom + 0.5 - shake / res;
        vec2 px = uv * res;
        // red plate sits slightly off (and can rotate) against blue
        vec2 pr = rot2(plateRot) * (px - res * 0.5) + res * 0.5 + misreg;
        vec2 uvr = pr / res;
        float cb = texture(src, uv).b;
        float cr = texture(src, uvr).r * step(0.0, uvr.x) * step(uvr.x, 1.0) * step(0.0, uvr.y) * step(uvr.y, 1.0);
        float ib = screen(cb, px, 0.2618);
        float ir = screen(cr, pr, 1.309);
        ib = max(ib, keyLine(uv) * 0.92);
        // fixed overlay (premultiplied): knocks out what is under it, prints solid
        vec4 hb = texture(hudTex, vUv) * hud;
        vec4 hr = hb; // the overlay text stays in register
        ib = ib * (1.0 - hb.a) + hb.b;
        ir = ir * (1.0 - hr.a) + hr.r;
        ir *= 1.0 - redDrop;
        ib = max(ib, fade); ir = max(ir, fade);
        ib *= 1.0 - flash; ir *= 1.0 - flash;
        // ink lays down unevenly; paper has tooth
        float mott = 0.96 + 0.04 * snoise(px * 0.035) + 0.02 * (hash12(floor(px * PX_SCALE)) - 0.5);
        float mott2 = 0.96 + 0.04 * snoise(px * 0.031 + 40.0) + 0.02 * (hash12(floor(px * PX_SCALE) + 7.0) - 0.5);
        ib *= mott; ir *= mott2;
        vec3 paper = PAPER * (1.0 + 0.008 * snoise(px * vec2(0.012, 0.11)) + 0.012 * (hash12(floor(px * PX_SCALE) + 3.0) - 0.5));
        vec3 col = paper * mix(vec3(1.0), T_BLUE, ib) * mix(vec3(1.0), T_RED, ir);
        col += (hash12(gl_FragCoord.xy * 1.37 + time) - 0.5) / 255.0;
        fragColor = vec4(sat(col), 1.0);
      }`, {
      src: { value: null }, hudTex: { value: null },
      hud: { value: 1 }, plateRot: { value: 0 }, dotSize: { value: 7 }, redDrop: { value: 0 }, flash: { value: 0 }, fade: { value: 0 },
      time: { value: 0 }, zoom: { value: 1 }, shake: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(W, H) }, misreg: { value: new THREE.Vector2() },
    });
  }

  /** src (plate coverage, linear) -> out (sRGB 8-bit target or screen). */
  render(renderer: THREE.WebGLRenderer, src: THREE.Texture, hud: THREE.Texture, out: THREE.WebGLRenderTarget | null, p: PostParams, time: number) {
    const f = this.final.u;
    f.src!.value = src;
    f.hudTex!.value = hud;
    f.hud!.value = p.hud;
    f.plateRot!.value = p.plateRot;
    f.dotSize!.value = p.dot;
    f.redDrop!.value = p.redDrop;
    f.flash!.value = p.flash;
    f.fade!.value = p.fade;
    f.time!.value = time;
    f.zoom!.value = p.zoom;
    (f.shake!.value as THREE.Vector2).set(p.shake[0], p.shake[1]);
    (f.misreg!.value as THREE.Vector2).set(p.misreg[0], p.misreg[1]);
    this.final.render(renderer, out);
  }
}
