# Perceive: desk, auto, Pixel 7

Profile quiet. light scheme. Run 2026-11-16T13:25:28.825Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 29.06, 24.13, 24.25 on 4 cores.
Detected platform on the page: android.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 29.06 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 132ms | 168ms (at release) | label | 40px | 1 to 1 | 320ms | 0% | 0 | 0 | not shown | fail: latency, travel, duration, easing, held; audit call fine |
| Switch | 102ms | 136ms (at release) | thumb | 25px | 0.667 to 1.048 | 300ms | 26% | 2 | 0 | not shown | fail: latency, travel, scale, duration, easing, held; audit call fine |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 168ms after the finger lands, when the finger lifts.
- The label moves 40px over 320ms (cubic-bezier(0, 0, 0.58, 1)).
- Nothing else reacts.
- The page dropped frames 5 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 611ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 168ms, at release | at most 32ms | fail |
| Headline travel equals the source | 40px | 0px within 1px | fail |
| Headline scale equals the source | 1 | 1 within 0.01 | pass |
| Main change takes as long as the source | 320ms | 150ms within 15ms | fail |
| Easing is the source curve | cubic-bezier(0, 0, 0.58, 1) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 611ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 40px over 320ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 136ms after the finger lands, when the finger lifts.
- The thumb moves 25px, shrinks to 0.667, changes colour (Delta E 45) over 300ms (cubic-bezier(0.16, 1, 0.3, 1)).
- The fill changes over 26 percent of the control.
- Also reacting: track (colour), span (fade).
- Held for 633ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 136ms, at release | at most 32ms | fail |
| Headline travel equals the source | 25px | 22px within 1px | fail |
| Headline scale equals the source | 0.667 | 1 within 0.01 | fail |
| Main change takes as long as the source | 300ms | 120ms within 12ms | fail |
| Easing is the source curve | cubic-bezier(0.16, 1, 0.3, 1) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 633ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 25px over 300ms).

