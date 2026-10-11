# I'm Upping My P(doom) — Remake

Source code for a Claude-made music video about AI safety, using the original song and timing data with a new visual design.

The film follows a blue marble across an AI safety researcher's desk. Cobalt blue and tomato red inks turn the room into a moving print, while spilled red ink and a flip clock track the rising P(doom). Lyrics appear on objects throughout the scene: rulers, receipts, coffee rings, book spines, computer windows, and spectacle lenses.

**Video:** 1920 × 1080 · 60 fps · 156.65 seconds · includes music.

The rendered MP4 is kept locally at `out/pdoom-remake.mp4`. Video exports and review images are excluded from Git; this repository contains the source and assets needed to render the film.

## Credits

- **Song:** "I'm Upping My P(doom)". Lyrics by [osmarks](https://docs.osmarks.net/hypha/p%28doom%29_song_objectively_correct_interpretation), built on an opening verse and chorus by MusicPerson, with lines suggested on the EleutherAI Discord. This remake uses the "Claude-Pop" version posted by deckard (@slimer48484). The song and lyrics belong to their authors.
- **Original engine and timing data:** [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video), under the MIT license. See [`LICENSE.upstream`](LICENSE.upstream).
- **Fonts:** Archivo, IBM Plex Mono, and Cormorant Garamond, under the SIL Open Font License. See [`app/public/fonts/src/OFL.txt`](app/public/fonts/src/OFL.txt).

## How it was made

The remake was developed with Claude through a directed, iterative process:

1. Keep the existing song, word-level lyric timings, beat data, and AI safety theme.
2. Design a new visual world with a two-ink print aesthetic and a marble connecting the scenes.
3. Carry each transition through an object, movement, or shared composition from the preceding scene.
4. Place lyrics inside the scene and animate their emphasis with the vocals.
5. Review successive renders and refine motion, camera framing, transitions, and text readability.

Human feedback guided the script and revisions. The scene design and print pipeline are new; the shared engine and timing data come from the credited upstream project.

The film is rendered from code using Three.js, WebGL, and Canvas 2D. A continuous camera journey links the desk's props with graphic sequences; matching compositions bridge transitions between spaces.

## What's here

| Path | What it is |
|---|---|
| [`docs/SCRIPT.md`](docs/SCRIPT.md) | Script and shot plan in Traditional Chinese; on-screen text is English |
| [`docs/pdoom.md`](docs/pdoom.md) | Early concept notes |
| [`app/src/film/`](app/src/film/) | Desk, props, camera choreography, scene lyrics, and the five film sequences |
| [`app/src/engine/`](app/src/engine/) | Playback, timing, typography, rendering helpers, and the print effect |
| [`app/src/main.ts`](app/src/main.ts) | Browser preview player and frame export API |
| [`app/scripts/render.mjs`](app/scripts/render.mjs) | Headless Chrome rendering and ffmpeg encoding |
| [`audio/pdoom.mp3`](audio/pdoom.mp3) | Song used in the film |
| [`data/`](data/) | Word-level lyrics and audio analysis |
| [`app/public/fonts/`](app/public/fonts/) | Bundled fonts |
| [`docs/ENGINE.upstream.md`](docs/ENGINE.upstream.md) | Upstream engine notes; some options refer to the original project's renderer |

## Preview

You need Node.js 22.12 or newer and Google Chrome. Rendering also requires ffmpeg on your `PATH`. The renderer currently selects Chrome's Metal graphics backend and was used on macOS; other platforms may need a graphics-backend adjustment in `app/scripts/render.mjs`.

```bash
git clone https://github.com/cgsaxto/pdoom-explainer.git
cd pdoom-explainer/app
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

- **Space** or click the video: play / pause.
- **← / →:** seek one second; hold **Shift** to seek five seconds.
- **, / .:** step backward / forward one frame.
- **H:** toggle the player controls.
- Add `?t=23` to the URL to start at a specific time.

## Rendering

Run these commands from `app/`. The renderer starts a local Vite server when needed.

```bash
# Full film: 1080p60, H.264 video, AAC audio
node scripts/render.mjs video --samples 4 --out ../out/pdoom-remake.mp4

# Render a short section for review
node scripts/render.mjs video --from 96 --to 100 --samples 4 --out ../out/review.mp4

# Export individual frames
node scripts/render.mjs stills --t 23.8,59.9 --out ../out/stills

# Export a contact sheet
node scripts/render.mjs sheet --from 20 --to 40 --n 20 --cols 5 --out ../out/sheet.jpg
```

`--samples 4` averages four sub-frames per frame for motion blur. `--png` uses lossless intermediate frames, at the cost of slower rendering. Video encoding defaults to 60 fps and CRF 16; use `--fps` and `--crf` to override them.
