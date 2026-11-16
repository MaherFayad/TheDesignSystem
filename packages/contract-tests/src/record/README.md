# Record: the recording pack

Order R0.9 of `docs/plan/reset.md` (section 3, "Recording pack"). Anything a
finger touches gets a phone clip the owner watches at real speed and signs.
Until the owner signs, the order is "built, waiting on the owner".

## Run it

```sh
npm run record -- --order R0.9                       # the whole pack of an order
npm run record -- --order R0.9 --clip switch --device pixel
npm run record -- --order R3.1 --scheme light,dark   # change the pack for one run
npm run record -- --list
```

| Option | Effect |
| --- | --- |
| `--order <id>` | the pack in `packs/<id>.json` |
| `--clip`, `--style`, `--platform`, `--device`, `--scheme` | narrow or change the pack for this run; a rerun keeps the other clips |
| `--scale <n>` | pixels per CSS px of the clip, default 2; the index shows it at 1x |
| `--crf <n>` | H.264 quality, default 30; raised by 3 until a clip fits `--max-kb` (default 1000) |
| `--out <dir>` | default `docs/reports/reset/<order>/record/` |
| `--system-url <url>` | a React gallery that is already running |
| `--preview <url>` | the preview address written into the device script |
| `--keep` | keep the frames in the scratch folder |

It starts the React gallery with the compare runner (`../compare/sources.ts`)
and stops it. Exit 0 when every clip was recorded, 1 when one was not, 2
when the pack could not run.

## What it writes

In `docs/reports/reset/<order>/record/`:

- `clips/<clip>-<style>-<platform>-<device>-<scheme>.mp4`: one clip per
  interaction, H.264 at 60 frames a second, which plays on iOS, Android and
  desktop browsers. The caption above the phone names the interaction, the
  style and scheme, the platform (detected or set) and the phone frame, and
  what the finger does. A pink point shows where the finger is down, a
  dashed ring where it lifted, and the line under the phone says "Finger
  down 300ms" or "Finger lifted 80ms ago", with a timeline of the strokes.
- `sheets/<key>.png`: the contact sheet of the clip: finger down, held or
  mid drag, finger lifted, settled, each with its time.
- `index.html`: the clips in a grid at real speed and 1x, each beside its
  source clip where the clip names a compare pair. `index.md`: the same with
  the sheets, for a reader without video.
- `pack.json`: every clip's frames, key frames, first change and sizes.
- `device-script.md`: the steps for the owner's phone, from
  `docs/reports/reset/signoff/device-script.template.md`.

And `docs/reports/reset/signoff/<order>.md`, the sign sheet: one line per
clip. The lead writes the owner's answer and the date; a rerun keeps them.

## How a clip is made

1. The page opens in Chromium's headless shell with a phone profile
   (`Pixel 7` or `iPhone 15 Pro`: viewport, user agent, touch), so `auto`
   detects Android or iOS as a phone would.
2. The setup (opening the sheet that is then dragged) runs on the wall clock.
3. Then the page's clock stops (`capture.ts`): with begin frame control and
   virtual time, each frame moves the page's time by exactly 1000/60 ms
   (timers, `performance.now`, event times and the animation timeline) and
   is then drawn. Load on the machine cannot drop or stretch a frame.
4. The strokes go through the perception gate's CDP touch helpers
   (`../perceive/gesture.ts`), one event per frame: down, held, moved once a
   frame for a drag, lifted.
5. Each frame is drawn into its phone frame with the caption and the touch
   point (`compose.ts`) and the clip is encoded with ffmpeg.

## Add a clip or a pack

- A clip: an entry in `clips.ts` (page, demo case, setup, strokes, what the
  finger does). Use whole frames for times (100ms is six frames). A clip that
  cannot be driven honestly in headless Chromium gets `cannot` with the
  reason, and the index says so instead of showing a clip.
- A source clip: `source: { pair, strokes }` names a pair in
  `../compare/pairs/` and where the finger lands on the source screen; the
  source screen is recorded with the same strokes and shown beside ours.
- A pack: `packs/<order id>.json` with the clips, styles, platforms,
  devices, schemes, a note, an optional `ask` (a question for the whole
  pack) and an optional `device` check.

## Limits

- The page's clock is exact, so jank cannot show: a long task takes no page
  time. Frame drops and slow presses under a real CPU need the device check.
- Touch is Chromium's touch emulation; the press look arrives at release
  there. A real finger on iOS Safari or Android Chrome may differ.
- The iPhone frame is Chromium with an iPhone viewport and user agent, not
  WebKit.
- Glass and blur draw on a software GPU.
- The caret is hidden while recording, so a blinking caret does not count as
  the screen answering the finger.
- The phone frames are plain shapes and show only the web page's viewport;
  the browser's own bars are not drawn.
