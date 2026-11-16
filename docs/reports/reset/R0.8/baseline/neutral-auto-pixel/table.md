# Perceive: neutral, auto, Pixel 7

Profile rich. light scheme. Run 2026-11-16T12:39:47.550Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 23.59, 23.17, 21.51 on 4 cores.
Detected platform on the page: android.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 23.59 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 43ms | 64ms (at release) | button button | 0px | 1 to 1 | 200ms | 100% | 0 | 0 | not shown | fail: latency, secondary, meaning, held; audit call fine |
| Switch | 99ms | 166ms (at release) | thumb | 25px | 0.667 to 1.167 | 158ms | 69% | 2 | 0 | not shown | fail: latency, duration, held; audit call fine |
| Checkbox | 101ms | 117ms (at release) | indicator | 0px | 1 to 1 | 225ms | 0% | 0 | 0 | not shown | fail: latency, size, secondary, meaning, held; audit call invisible |
| Tabs | 102ms | 288ms (at release) | indicator | 97px | 0.888 to 1.079 | 158ms | 0% | 1 | 2 | not shown | fail: latency, duration, meaning, held; audit call wrong |
| Toast | 99ms | 190ms (at release) | li toast | 68.1px | 1 to 1 | 180ms | 0% | 5 | 0 |  | fail: latency, duration, meaning; audit call fine |
| Dialog | 87ms | 380ms (at release) | panel | 0px | 0.97 to 1 | 180ms | 0% | 4 | 0 |  | fail: latency, size, duration, meaning; audit call invisible |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 64ms after the finger lands, when the finger lifts.
- The button button changes colour (Delta E 12) over 200ms (steps(1)).
- The fill changes over 100 percent of the control.
- Nothing else reacts.
- The page dropped frames 1 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 597ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 64ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 100 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | span/label finishes in 70ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 597ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline changes fill over 200ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 166ms after the finger lands, when the finger lifts.
- The thumb moves 25px, shrinks to 0.667 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- The fill changes over 69 percent of the control.
- Also reacting: track (colour), span (fade).
- The page dropped frames 4 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 598ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 166ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 25px, scales 33.3 percent, fill over 69 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | span/track, span | at least one | pass |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |
| Press shows while the finger is held 598ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 25px over 158ms).

## Checkbox: the finger taps an empty checkbox

- The first visible change comes 117ms after the finger lands, when the finger lifts.
- The indicator changes colour (Delta E 35) over 225ms (cubic-bezier(0, 0, 0.58, 1)).
- Nothing else reacts.
- Held for 597ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 117ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 225ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | span/indicator finishes in 90ms; span finishes in 90ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 597ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (it moves 0px and changes size by 0px).

## Tabs: the finger taps the second tab

- The first visible change comes 288ms after the finger lands, when the finger lifts.
- The indicator moves 97px, shrinks to 0.888 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: label (colour).
- The p vanishes in one frame.
- The p appears in one frame.
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 585ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 288ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 97px, scales 11.2 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | span/label | at least one | pass |
| Nothing that carries meaning is too fast or too small | span/label changes in one frame; button/trigger[tab] changes in one frame; p changes in one frame; p changes in one frame | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 585ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: wrong (p vanishes in one frame).

## Toast: the finger taps a button that shows a toast

- The first visible change comes 190ms after the finger lands, when the finger lifts, after the click.
- The li toast moves 68.1px, fades from 0.89 to 1 over 180ms (cubic-bezier(0.16, 1, 0.3, 1)).
- Also reacting: icon (68.1px), svg icon (68.1px), title (68.1px), close (68.1px).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 190ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 68.1px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 180ms | 200 to 500ms | fail |
| A second element reacts | span/icon, svg icon, div/title | at least one | pass |
| Nothing that carries meaning is too fast or too small | svg icon finishes in 108ms; div/title finishes in 67ms; button close-button/close finishes in 67ms; svg icon finishes in 67ms | no change under 150ms or under 3px | fail |

Audit call: fine (the headline moves 68.1px over 180ms).

## Dialog: the finger taps a button that opens a dialog

- The first visible change comes 380ms after the finger lands, when the finger lifts.
- The panel shrinks to 0.97 over 180ms (cubic-bezier(0.16, 1, 0.3, 1)).
- Also reacting: backdrop (fade), title (7.1px), description (5.7px), p (4px).
- The page dropped frames 4 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 380ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 3 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 180ms | 200 to 500ms | fail |
| A second element reacts | div/backdrop, h2/title, p/description | at least one | pass |
| Nothing that carries meaning is too fast or too small | button close-button/close finishes in 17ms; svg icon finishes in 17ms; p finishes in 92ms; div/footer finishes in 17ms | no change under 150ms or under 3px | fail |

Audit call: invisible (it moves 0px and changes size by 10.7px).

