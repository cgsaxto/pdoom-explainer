// Where each line after the first chorus is printed. In a drawn shot it is a tag on that
// surface; in a shot of the desk it is a paper tag standing by the thing the line is about.
import type { Film, V3 } from './core';

export function lyrics2(f: Film) {
  const P = f.P, at = (q: string, w: string | number = 0, n = 0) => f.at(q, w, n);
  const car = (t: number): V3 => { const p = P.trainAt(t).c; return [p.x, 11, p.z]; };
  const marble = (dy: number) => (): V3 => [P.marble.position.x - 5, P.marble.position.y + dy, P.marble.position.z];
  const clock: V3 = [-22, 17, -22];

  f.tag('We had a stable', car, { key: 'stable' });
  f.tag("I'm upping", clock, { nth: 1, key: 'P(doom)', h: 0.07 });
  f.tag("I'm upping", clock, { nth: 2, key: 'P(doom)', h: 0.07 });
  // beside the box, clear of the marble's way down; as the flood rises it floats up and drifts in front of the desk,
  // where nothing stands between it and the lens for the pull-back
  { const t0 = at('as paperclips'), t1 = at('as paperclips', 'fill'); f.tag('as paperclips', (t): V3 => { const k = Math.min(1, Math.max(0, (t - t0 - 0.35) / (t1 - t0))); return [-46 + 6 * k * k * (3 - 2 * k), Math.max(-66, (P.seaY as (t: number) => number)(t) + 10), 66 + 10 * k]; }, { key: 'paperclips', from: t0 - 0.12, to: at('as paperclips', 'room') + 0.75, pop: false }); }
  f.tagOn(P.Spost, "Now there's nowhere", 110, 240, { key: 'nowhere', size: 92, plate: false, to: at("Now there's nowhere", 'left') + 0.15 });
  f.tagOn(P.Splot, 'Orthogonality', 480, 170, { key: 'blues', size: 82, plate: false, to: 108.0 });
  f.tag("I'm upping", clock, { nth: 3, key: 'P(doom)', h: 0.07, to: at("I'm upping", 'P(doom)', 3) + 0.25 });
}
