# Perceive: the perception gate

Order R0.8 of `docs/plan/reset.md`. It asks what a person at arm's length,
with a finger, at normal speed, would see, instead of whether an animation
exists or matches a token (the motion audit, suspect l).

## Run it

```sh
npm run perceive -- --component button --style neutral --platform android
npm run perceive -- --component button,switch --style studio,desk --platform auto --device pixel,iphone
npm run perceive -- --sample --style neutral,liquid --platform auto --device pixel,iphone
npm run perceive -- --all --style liquid --platform ios
npm run perceive -- --calibrate          # the audit's twenty, Neutral, platform web, Pixel
npm run perceive -- --list
```

| Option | Effect |
| --- | --- |
| `--component <ids>` | interactions from `catalog.ts`, by id or gallery slug |
| `--all`, `--sample` | the twenty of the audit; the six of the R0.8 baseline |
| `--style <ids>` | default `neutral` |
| `--platform <ids>` | `auto` (the page detects the phone), `web`, `ios`, `android`, `macos`; default `auto` |
| `--device pixel,iphone` | the Playwright Pixel 7 and iPhone 15 Pro profiles, touch on; default the iPhone for `ios`, else the Pixel |
| `--profile rich or quiet` | default quiet for `studio` and `desk`, rich for the rest (ruling 3) |
| `--hold <ms>` | how long a tap keeps the finger down, default 90 |
| `--press-hold <ms>` | the held press read on pressables, default 600; 0 skips it |
| `--scheme light or dark` | default light |
| `--out <dir>` | default `docs/reports/reset/perceive/<style>-<platform>-<device>/` |
| `--system-url <url>` | use a gallery that is already running |
| `--frames` | also write every frame (`frames.json`, large) |

Exit 0 when every interaction passes its profile, 1 when one fails (or the
calibration misses the audit), 2 when the gate could not run. It starts the
React gallery with the compare runner (`../compare/sources.ts`) and stops it.

## What it does

1. Opens `/c/<slug>?style=&scheme=&platform=&dir=ltr&lang=en&case=&chrome=0`
   in Chromium with a phone profile (viewport, user agent, touch), waits for
   fonts and for running animations to end, and marks the element the finger
   will land on.
2. Starts the sampler (`sampler.ts`) in the page. On every animation frame it
   reads, for the component root and everything inside it, and for any
   surface the gesture opens: the drawn box, own and effective opacity, the
   area on screen, transform, fill, text and border colour, shadow,
   clip-path, filter and backdrop filter, and whether the element paints
   anything itself. It logs `pointerdown`, `pointerup`, `click` and the touch
   and mouse events with their times, and every animation that starts.
3. Drives the gesture through CDP touch events (`gesture.ts`): a tap is down,
   90ms, up; a long press holds 900ms; a drag is fifteen moves 16ms apart.
   Real time, no slow motion, no CSS zoom.
4. For pressables, opens the page again and holds the finger down 600ms
   (`holdPointer`), to read whether the press shows while the finger is down.
   This is the press step the compare runner lacks; `holdPointer` is exported
   for it.
5. `analyze.ts` turns the frames into numbers: latency from `pointerdown` to
   the first frame that differs; for the headline part its largest move, its
   scale range, its main change (of the animations that start first on it
   and its inner parts, the longest; else the frames); the share of the
   control whose fill changes; which other elements react; which changes
   happen in a single frame (a cut).

## Profiles

Rich (Neutral and Liquid), from DECISIONS.md, R0.1 decision 7:

| Check | Pass |
| --- | --- |
| Latency | at most 32ms from `pointerdown` (182ms on `android` when the first change is a ripple) |
| Size | the headline moves 8px or more, or scales 6 percent or more, or the fill changes over 30 percent of the control |
| Duration | the main change lasts 200 to 500ms (not judged on a drag, which follows the finger) |
| Secondary | at least one other element reacts: it moves or resizes 3px, fades by 0.3 or changes colour by Delta E 10, over 50ms or more |
| Meaning | nothing that changes visibly finishes under 150ms or moves under 3px |
| Held | for pressables: the press shows within 32ms of a held finger and for 95 percent of the hold |

Quiet (Studio and Desk), R0.1 decision 8: latency at most 32ms, and the
headline's travel (1px), scale (0.01), main change (10ms or 10 percent) and
easing (each control point within 0.02) equal the source's. The source
numbers are in `sources.ts`, read from the source CSS with file and line;
they are not yet measured in a browser.

## The audit call

To calibrate the gate on the motion audit, each interaction also gets the
audit's word for it (`profiles.ts`, `auditCall`):

- **wrong** when something that paints jumps 8px or more, appears or
  vanishes in a single frame with no animation, or when the control itself
  changes only after the click, through emulated hover;
- **fine** when the headline moves or resizes 4px or more (a surface that
  opens: also 5 percent of its own size, since a short rise on a big panel
  reads as a fade), or changes fill over 30 percent of the control, for
  150ms or more;
- **invisible** otherwise.

`npm run perceive -- --calibrate` compares a run with the audit's table
(`calibration.ts`) and passes when every number is within 10 percent and the
calls give 9 invisible and 4 wrong.

## Limits

- Headless Chromium draws on a software GPU at a frame rate it picks; under
  load frames come late and latency grows. Every run writes the load average
  and the median frame interval, and a number taken under load says so.
- Touch is Chromium's touch emulation: `:active` arrives at release, as the
  audit found (suspect i). A real phone may differ; the device check of plan
  section 3 covers that.
- WebKit is not used, so iOS Safari behaviour is not measured; the iPhone
  profile is a viewport and a user agent in Chromium.
- Pseudo-elements are not sampled (only their animations are listed), so a
  halo drawn by `::before` counts only through the animation list.
- A clip-path reveal counts the element's whole box as changed fill.
- Sound and haptics are not measured.
