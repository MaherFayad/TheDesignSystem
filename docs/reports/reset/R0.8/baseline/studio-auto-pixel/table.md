# Perceive: studio, auto, Pixel 7

Profile quiet. light scheme. Run 2026-11-16T13:24:39.136Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 27.01, 22.96, 23.90 on 4 cores.
Detected platform on the page: android.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 27.01 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 122ms | 150ms (at release) | button button | 0px | 1 to 1 | 120ms | 100% | 0 | 0 | not shown | fail: latency, duration, easing, held; audit call invisible |
| Switch | 122ms | 144ms (at release) | thumb | 25px | 0.667 to 1.167 | 120ms | 96% | 2 | 0 | not shown | fail: latency, travel, scale, duration, easing, held; audit call invisible |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 150ms after the finger lands, when the finger lifts.
- The button changes colour (Delta E 97) over 120ms (cubic-bezier(0.4, 0, 0.2, 1)).
- The fill changes over 100 percent of the control.
- Nothing else reacts.
- The page dropped frames 5 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 627ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 150ms, at release | at most 32ms | fail |
| Headline travel equals the source | 0px | 0px within 1px | pass |
| Headline scale equals the source | 1 | 1 within 0.01 | pass |
| Main change takes as long as the source | 120ms | 150ms within 15ms | fail |
| Easing is the source curve | cubic-bezier(0.4, 0, 0.2, 1) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 627ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (its main change takes 120ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 144ms after the finger lands, when the finger lifts.
- The thumb moves 25px, shrinks to 0.667, changes colour (Delta E 56) over 120ms (cubic-bezier(0.16, 1, 0.3, 1)).
- The fill changes over 96 percent of the control.
- Also reacting: track (colour), span (fade).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 621ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 144ms, at release | at most 32ms | fail |
| Headline travel equals the source | 25px | 15px within 1px | fail |
| Headline scale equals the source | 0.667 | 1 within 0.01 | fail |
| Main change takes as long as the source | 120ms | 150ms within 15ms | fail |
| Easing is the source curve | cubic-bezier(0.16, 1, 0.3, 1) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 621ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (its main change takes 120ms).

