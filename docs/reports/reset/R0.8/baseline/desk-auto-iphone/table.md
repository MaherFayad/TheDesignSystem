# Perceive: desk, auto, iPhone 15 Pro

Profile quiet. light scheme. Run 2026-11-16T12:57:30.403Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 27.20, 27.63, 26.00 on 4 cores.
Detected platform on the page: ios.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 27.20 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 125ms | 141ms (at release) | label | 44px | 1 to 1 | 320ms | 0% | 0 | 0 | not shown | fail: latency, travel, duration, easing, held; audit call fine |
| Switch | 160ms | 175ms (at release) | thumb | 18.7px | 0.949 to 1.227 | 380ms | 33% | 2 | 0 | not shown | fail: latency, travel, scale, duration, easing, held; audit call fine |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 141ms after the finger lands, when the finger lifts.
- The label moves 44px, fades from 0.55 to 1 over 320ms (cubic-bezier(0, 0, 0.58, 1)).
- Nothing else reacts.
- The page dropped frames 3 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 612ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 141ms, at release | at most 32ms | fail |
| Headline travel equals the source | 44px | 0px within 1px | fail |
| Headline scale equals the source | 1 | 1 within 0.01 | pass |
| Main change takes as long as the source | 320ms | 150ms within 15ms | fail |
| Easing is the source curve | cubic-bezier(0, 0, 0.58, 1) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 612ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 44px over 320ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 175ms after the finger lands, when the finger lifts.
- The thumb moves 18.7px, shrinks to 0.949, changes colour (Delta E 45) over 380ms (steps(1, start)).
- The fill changes over 33 percent of the control.
- Also reacting: track (colour), span (fade).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 615ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 175ms, at release | at most 32ms | fail |
| Headline travel equals the source | 18.7px | 22px within 1px | fail |
| Headline scale equals the source | 1.227 | 1 within 0.01 | fail |
| Main change takes as long as the source | 380ms | 120ms within 12ms | fail |
| Easing is the source curve | steps(1, start) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 615ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 18.7px over 380ms).

