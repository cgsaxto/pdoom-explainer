import { hexToLinear } from './util';

// Three-plate print palette: paper, cobalt blue, tomato red. Scenes never draw these colours
// directly: they draw ink coverage (see film/ink.ts) and the post pass prints it.
export const HEX = {
  paper: '#F2EBDD',
  blue: '#1F3FBF',
  red: '#E8402A',
} as const;

export type PaletteKey = keyof typeof HEX;

/** Linear RGB triplets for GL uniforms. */
export const LIN: Record<PaletteKey, [number, number, number]> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, hexToLinear(v)]),
) as Record<PaletteKey, [number, number, number]>;

const srgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255) as [number, number, number]; };
/** sRGB (display-referred) triplets: the post pass multiplies inks in this space. */
export const SRGB: Record<PaletteKey, [number, number, number]> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, srgb(v)]),
) as Record<PaletteKey, [number, number, number]>;
