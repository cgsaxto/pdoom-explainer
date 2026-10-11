import type { Film } from './core';
import { buildDesk } from './desk';
import { seq1 } from './seq1';
import { seq2 } from './seq2';
import { seq3 } from './seq3';
import { seq4 } from './seq4';
import { seq5 } from './seq5';
import { lyrics2 } from './lyrics2';

export function build(f: Film) {
  buildDesk(f);
  seq1(f);
  seq2(f);
  seq3(f);
  seq4(f);
  seq5(f);
  lyrics2(f);
}
