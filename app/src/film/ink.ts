// Ink space. Everything a scene draws is plate coverage, not colour:
//   red channel = red plate, blue channel = blue plate (0 = bare paper, 1 = solid ink).
// Tints (0.2, 0.5 ...) come out as halftone dots in the print pass.
import * as THREE from 'three';

const enc = (x: number) => Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055));
/** CSS colour for Canvas2D: `r` red-plate and `b` blue-plate coverage (linear 0..1), alpha `a`. */
export const ik = (r: number, b: number, a = 1) => `rgba(${enc(Math.min(1, Math.max(0, r)))},0,${enc(Math.min(1, Math.max(0, b)))},${a})`;
export const PAPER = ik(0, 0);
export const BLUE = ik(0, 1);
export const RED = ik(1, 0);
export const DARK = ik(1, 1);
/** Blue tint. */
export const bl = (v: number, a = 1) => ik(0, v, a);
export const rd = (v: number, a = 1) => ik(v, 0, a);

let nextId = 1;
/** A distinct key-line id (G channel): the print pass draws a line wherever ids differ. */
export const newId = () => { const i = nextId++; return 0.06 + ((i * 37) % 97) / 97 * 0.9; };

export interface InkOpts {
  /** [red, blue] coverage in light / in shade. */
  lit?: [number, number];
  shade?: [number, number];
  /** Plate-coverage texture (a canvas drawn with ik()). Replaces lit/shade. */
  map?: THREE.Texture | null;
  /** Draw key lines between faces of this mesh (boxy objects). */
  crease?: boolean;
  id?: number;
  side?: THREE.Side;
  /** Skip lighting. */
  flat?: boolean;
  /** Use lit/shade exactly as given (no snapping to the clean tones). */
  raw?: boolean;
  /** Self-lit: ignores the shared DIM. */
  glow?: boolean;
  /** Canvas has transparent parts: discard them. */
  alpha?: boolean;
}

/** Shared 'lights out' amount: added to the blue plate of every unlit-by-itself material. */
export const DIM = { value: 0 };
export const LIGHT = new THREE.Vector3(-0.45, 0.8, 0.4).normalize();

/** Flat three-tone material that writes plate coverage and a key-line id. */
export function inkMat(o: InkOpts = {}) {
  // lit faces are clean: bare paper, one of two flat pale blues, or solid. Only shade gets dots.
  const q = (b: number) => (b <= 0.12 ? 0 : b <= 0.33 ? 0.15 : b <= 0.62 ? 0.27 : 1);
  const l0 = o.lit ?? [0, 0.08], lit: [number, number] = o.map || o.raw ? l0 : [l0[0], q(l0[1])];
  const s0 = o.shade ?? [lit[0], Math.min(1, lit[1] + 0.3)];
  const shade: [number, number] = o.raw ? s0 : [s0[0], lit[1] >= 1 ? 1 : Math.max(0.44, Math.min(0.72, s0[1]))];
  return new THREE.ShaderMaterial({
    side: o.side ?? THREE.FrontSide,
    uniforms: {
      lit: { value: new THREE.Vector2(lit[0], lit[1]) },
      shade: { value: new THREE.Vector2(shade[0], shade[1]) },
      map: { value: o.map ?? null },
      useMap: { value: o.map ? 1 : 0 },
      id: { value: o.id ?? newId() },
      crease: { value: o.crease === false ? 0 : 1 },
      flat_: { value: o.flat ? 1 : 0 },
      light: { value: LIGHT },
      gain: { value: 1 },
      dim: DIM,
      dimK: { value: o.glow || o.map ? 0 : 1 },
      alpha: { value: o.alpha ? 1 : 0 },
      redMul: { value: 1 },
      keepG: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec2 vUv;
      void main() { vN = normalize(mat3(modelMatrix) * normal); vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec2 lit, shade; uniform sampler2D map; uniform float useMap, id, crease, flat_, gain, dim, dimK, alpha, redMul, keepG; uniform vec3 light;
      varying vec3 vN; varying vec2 vUv;
      void main() {
        vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
        float l = dot(n, light);
        float k = flat_ > 0.5 ? 0.0 : (l > 0.45 ? 0.0 : l > -0.05 ? 0.5 : 1.0);
        vec2 c = mix(lit, shade, k);
        if (useMap > 0.5) { vec4 m = texture2D(map, vUv); if (alpha > 0.5 && m.a < 0.5) discard; c = vec2(m.r * redMul, m.b); }
        c.y = min(1.0, c.y + dim * dimK);
        float mg = 0.0;
        if (useMap > 0.5 && keepG > 0.5) mg = texture2D(map, vUv).g;
        float g = keepG > 0.5 ? mg : id + crease * (0.011 * floor(n.x * 1.5 + 0.5) + 0.017 * floor(n.y * 1.5 + 0.5) + 0.023 * floor(n.z * 1.5 + 0.5));
        gl_FragColor = vec4(c.x * gain, g, c.y * gain, 1.0);
      }`,
  });
}
