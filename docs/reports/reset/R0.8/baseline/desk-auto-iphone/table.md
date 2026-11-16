# Perceive: desk, auto, iPhone 15 Pro

Profile quiet. light scheme. Run 2026-11-16T13:25:50.252Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 29.10, 24.56, 24.39 on 4 cores.
Detected platform on the page: ios.
Median frame interval: 16.6ms (16.7ms is 60 frames a second).
The machine was loaded (load average 29.10 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 101ms | 118ms (at release) | label | 43.5px | 1 to 1 | 320ms | 0% | 0 | 0 | not shown | fail: latency, travel, duration, easing, held; audit call fine |
| Switch | 105ms | 131ms (at release) | thumb | 18.8px | 0.913 to 1.227 | 380ms | 33% | 2 | 0 | not shown | fail: latency, travel, scale, duration, easing, held; audit call fine |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 118ms after the finger lands, when the finger lifts.
- The label moves 43.5px, fades from 0.55 to 1 over 320ms (cubic-bezier(0, 0, 0.58, 1)).
- Nothing else reacts.
- The page dropped frames 4 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 634ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 118ms, at release | at most 32ms | fail |
| Headline travel equals the source | 43.5px | 0px within 1px | fail |
| Headline scale equals the source | 1 | 1 within 0.01 | pass |
| Main change takes as long as the source | 320ms | 150ms within 15ms | fail |
| Easing is the source curve | cubic-bezier(0, 0, 0.58, 1) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 634ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 43.5px over 320ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 131ms after the finger lands, when the finger lifts.
- The thumb moves 18.8px, shrinks to 0.913, changes colour (Delta E 45) over 380ms (linear(0 0%, 0.142 5%, 0.452 10%, 0.7...).
- The fill changes over 33 percent of the control.
- Also reacting: track (colour), span (fade).
- The page dropped frames 5 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 622ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 131ms, at release | at most 32ms | fail |
| Headline travel equals the source | 18.8px | 22px within 1px | fail |
| Headline scale equals the source | 1.227 | 1 within 0.01 | fail |
| Main change takes as long as the source | 380ms | 120ms within 12ms | fail |
| Easing is the source curve | linear(0 0%, 0.142 5%, 0.452 10%, 0.78 15%, 1.034 20%, 1.177 25%, 1.215 30%, 1.182 35%, 1.115 40%, 1.044 45%, 0.991 50%, 0.961 55%, 0.954 60%, 0.961 65%, 0.976 70%, 0.991 75%, 1.002 80%, 1.009 85%, 1.01 90%, 1.008 95%, 1 100%) | ease, each control point within 0.02 | fail |
| Press shows while the finger is held 622ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 18.8px over 380ms).

