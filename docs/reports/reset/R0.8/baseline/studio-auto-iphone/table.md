# Perceive: studio, auto, iPhone 15 Pro

Profile quiet. light scheme. Run 2026-11-16T12:56:44.196Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 27.91, 27.82, 25.99 on 4 cores.
Detected platform on the page: ios.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 27.91 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 98ms | 114ms (at release) | button button | 0px | 1 to 1 | 70ms | 100% | 0 | 0 | not shown | fail: latency, duration, easing, held; audit call invisible |
| Switch | 117ms | 130ms (at release) | thumb | 17.4px | 1 to 1.2 | 120ms | 92% | 2 | 0 | not shown | fail: latency, travel, scale, duration, easing, held; audit call invisible |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 114ms after the finger lands, when the finger lifts.
- The button button fades from 0.55 to 1, changes colour (Delta E 97) over 70ms (cubic-bezier(0, 0, 0.58, 1)).
- The fill changes over 100 percent of the control.
- Nothing else reacts.
- The page dropped frames 4 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 613ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 114ms, at release | at most 32ms | fail |
| Headline travel equals the source | 0px | 0px within 1px | pass |
| Headline scale equals the source | 1 | 1 within 0.01 | pass |
| Main change takes as long as the source | 70ms | 150ms within 15ms | fail |
| Easing is the source curve | cubic-bezier(0, 0, 0.58, 1) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 613ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (its main change takes 70ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 130ms after the finger lands, when the finger lifts.
- The thumb moves 17.4px, grows to 1.2, changes colour (Delta E 56) over 120ms (steps(1, start)).
- The fill changes over 92 percent of the control.
- Also reacting: track (colour), span (fade).
- Held for 656ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 130ms, at release | at most 32ms | fail |
| Headline travel equals the source | 17.4px | 15px within 1px | fail |
| Headline scale equals the source | 1.2 | 1 within 0.01 | fail |
| Main change takes as long as the source | 120ms | 150ms within 15ms | fail |
| Easing is the source curve | steps(1, start) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 656ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (its main change takes 120ms).

