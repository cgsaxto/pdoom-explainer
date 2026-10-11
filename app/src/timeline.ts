// One take: a single scene owns the whole song. The entries below only split it into
// sections for the preview's scrub bar; they all load the same module instance.
import type { TimelineEntry } from './engine/engine';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

export function makeTimeline(_ly: Lyrics, au: AudioData): TimelineEntry[] {
  return [{ id: 'film', load: () => import('./scenes/film'), start: 0, end: au.duration }];
}
