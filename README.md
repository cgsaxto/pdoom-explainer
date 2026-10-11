# I'm Upping My P(doom) — remake

A new, code-rendered video for the same song: one unbroken take across an AI safety researcher's desk at night, printed in two inks (cobalt blue, tomato red) on paper. A blue marble crosses the desk while a spilled bottle of red ink floods it; the flooded share of the desk is the current P(doom).

- Script and shot list: [`docs/SCRIPT.md`](docs/SCRIPT.md) (Traditional Chinese; all on-screen text is English)
- Early concept notes: [`docs/pdoom.md`](docs/pdoom.md)

## Run

Needs Node, Google Chrome and ffmpeg.

```sh
cd app
npm install
npx vite                      # preview at http://localhost:5173 (space = play, ←/→ = seek, ?t=23 to start at a time)
```

Render:

```sh
cd app
node scripts/render.mjs video --samples 4 --out ../out/pdoom-remake.mp4      # 1920×1080, 60 fps, with audio
node scripts/render.mjs stills --t 23.8,59.9 --out ../out/stills
node scripts/render.mjs sheet --from 20 --to 40 --n 20 --cols 5 --out ../out/sheet.jpg
```

`--samples N` averages N sub-frames per frame for motion blur. `--png` sends lossless frames to the encoder (slower).

## How it is built

| Path | What it is |
|---|---|
| `app/src/engine/` | Timeline playback, word-level lyric and beat data, GL helpers, typography. Taken from the original project (see Credits); `post.ts`, `hud.ts` and `palette.ts` are rewritten. |
| `app/src/engine/post.ts` | The print pass. Scenes output ink coverage per plate, not colour (red channel = red plate, blue channel = blue plate, green = object id). This pass turns tints into halftone dots, shifts the red plate against the blue, draws key lines where ids differ, and multiplies the inks onto paper. |
| `app/src/engine/hud.ts` | The fixed lyric line (bottom left), the footnotes (top left), and the P(doom) value over time. |
| `app/src/film/core.ts` | The rig: one 3D world, drawing surfaces (canvases on real faces of props), one keyed camera path, animators that are pure functions of song time. |
| `app/src/film/desk.ts` | The set: the desk and every prop on, under and around it. |
| `app/src/film/seq1.ts` … `seq5.ts` | The 52 shots, in order. Every cue is looked up from the lyric timings, never hard-coded. |
| `app/src/film/notes.ts` | The footnote texts. |
| `app/scripts/render.mjs` | Offline renderer: headless Chrome → frames → ffmpeg. |

The camera never cuts. Where the script jumps between two places, both show the same full-frame picture at that instant, so the jump is invisible.

## Credits

- **Song:** "I'm Upping My P(doom)". Lyrics by [osmarks](https://docs.osmarks.net/hypha/p%28doom%29_song_objectively_correct_interpretation), built on an opening verse and chorus by MusicPerson, with lines suggested on the EleutherAI Discord. This video uses the "Claude-Pop" version posted by deckard (@slimer48484). The song and lyrics (`audio/`, `data/lyrics.json`) belong to their authors.
- **Engine and timing data:** from [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) (MIT, see `LICENSE.upstream`). The scenes, look, script and print pipeline here are new.
- **Fonts:** Archivo, IBM Plex Mono, Cormorant Garamond (SIL Open Font License).
