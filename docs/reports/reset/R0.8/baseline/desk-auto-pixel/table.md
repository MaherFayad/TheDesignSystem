# Perceive: desk, auto, Pixel 7

Profile quiet. light scheme. Run 2026-11-16T12:57:07.489Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 26.82, 27.59, 25.94 on 4 cores.
Detected platform on the page: android.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 26.82 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 119ms | 147ms (at release) | label | 40px | 1 to 1 | 480ms | 0% | 0 | 0 | not shown | fail: latency, travel, duration, easing, held; audit call fine |
| Switch | 116ms | 134ms (at release) | thumb | 25px | 0.667 to 1.042 | 300ms | 26% | 2 | 0 | not shown | fail: latency, travel, scale, duration, easing, held; audit call fine |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 147ms after the finger lands, when the finger lifts.
- The label moves 40px over 480ms (steps(1)).
- Nothing else reacts.
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 643ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 147ms, at release | at most 32ms | fail |
| Headline travel equals the source | 40px | 0px within 1px | fail |
| Headline scale equals the source | 1 | 1 within 0.01 | pass |
| Main change takes as long as the source | 480ms | 150ms within 15ms | fail |
| Easing is the source curve | steps(1) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 643ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 40px over 480ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 134ms after the finger lands, when the finger lifts.
- The thumb moves 25px, shrinks to 0.667, changes colour (Delta E 45) over 300ms (steps(1, start)).
- The fill changes over 26 percent of the control.
- Also reacting: track (colour), span (fade).
- Held for 613ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 134ms, at release | at most 32ms | fail |
| Headline travel equals the source | 25px | 22px within 1px | fail |
| Headline scale equals the source | 0.667 | 1 within 0.01 | fail |
| Main change takes as long as the source | 300ms | 120ms within 12ms | fail |
| Easing is the source curve | steps(1, start) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 613ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 25px over 300ms).

