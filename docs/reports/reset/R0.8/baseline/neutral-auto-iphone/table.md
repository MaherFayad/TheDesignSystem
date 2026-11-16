# Perceive: neutral, auto, iPhone 15 Pro

Profile rich. light scheme. Run 2026-11-16T13:22:02.628Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 17.33, 20.58, 23.55 on 4 cores.
Detected platform on the page: ios.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 17.33 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 116ms | 131ms (at release) | button button | 0px | 1 to 1 | 70ms | 100% | 0 | 0 | not shown | fail: latency, duration, secondary, meaning, held; audit call invisible |
| Switch | 102ms | 118ms (at release) | thumb | 17.4px | 1 to 1.3 | 158ms | 57% | 2 | 0 | not shown | fail: latency, duration, held; audit call fine |
| Checkbox | 98ms | 114ms (at release) | indicator | 0px | 1 to 1 | 225ms | 0% | 0 | 0 | not shown | fail: latency, size, secondary, meaning, held; audit call invisible |
| Tabs | 99ms | 123ms (at release) | indicator | 88.8px | 0.878 to 1.074 | 158ms | 0% | 1 | 2 | not shown | fail: latency, duration, meaning, held; audit call wrong |
| Toast | 102ms | 184ms (at release) | li toast | 64px | 1 to 1 | 180ms | 0% | 5 | 0 |  | fail: latency, duration, meaning; audit call fine |
| Dialog | 94ms | 868ms (at release) | panel | 0px | 1 to 1.15 | 200ms | 0% | 10 | 0 |  | fail: latency, meaning; audit call fine |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 131ms after the finger lands, when the finger lifts.
- The button fades from 0.55 to 1, changes colour (Delta E 12) over 70ms (cubic-bezier(0, 0, 0.58, 1)).
- The fill changes over 100 percent of the control.
- Nothing else reacts.
- The page dropped frames 3 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 618ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 131ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 100 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 70ms | 200 to 500ms | fail |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | button button finishes in 70ms; span/label finishes in 70ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 618ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (its main change takes 70ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 118ms after the finger lands, when the finger lifts.
- The thumb moves 17.4px, grows to 1.3 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- The fill changes over 57 percent of the control.
- Also reacting: track (colour), span (fade).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 633ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 118ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 17.4px, scales 30 percent, fill over 57 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | span/track, span | at least one | pass |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |
| Press shows while the finger is held 633ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 17.4px over 158ms).

## Checkbox: the finger taps an empty checkbox

- The first visible change comes 114ms after the finger lands, when the finger lifts.
- The indicator changes colour (Delta E 35) over 225ms (cubic-bezier(0, 0, 0.58, 1)).
- Nothing else reacts.
- Held for 619ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 114ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 225ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | span/indicator finishes in 90ms; span finishes in 90ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 619ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (it moves 0px and changes size by 0px).

## Tabs: the finger taps the second tab

- The first visible change comes 123ms after the finger lands, when the finger lifts.
- The indicator moves 88.8px, shrinks to 0.878 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: label (colour).
- The p vanishes in one frame.
- The p appears in one frame.
- Held for 614ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 123ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 88.8px, scales 12.2 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | span/label | at least one | pass |
| Nothing that carries meaning is too fast or too small | span/label changes in one frame; button/trigger[tab] changes in one frame; p changes in one frame; p changes in one frame | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 614ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: wrong (p vanishes in one frame).

## Toast: the finger taps a button that shows a toast

- The first visible change comes 184ms after the finger lands, when the finger lifts, after the click.
- The toast moves 64px, fades from 0.67 to 1 over 180ms (linear(0 0%, 0.054 5%, 0.172 10%, 0.3...).
- Also reacting: icon (64px), svg icon (64px), title (64px), close (64px).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 184ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 64px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 180ms | 200 to 500ms | fail |
| A second element reacts | span/icon, svg icon, div/title | at least one | pass |
| Nothing that carries meaning is too fast or too small | svg icon finishes in 118ms; div/title finishes in 85ms; button close-button/close finishes in 98ms; svg icon finishes in 98ms | no change under 150ms or under 3px | fail |

Audit call: fine (the headline moves 64px over 180ms).

## Dialog: the finger taps a button that opens a dialog

- The first visible change comes 868ms after the finger lands, when the finger lifts.
- The panel grows to 1.15 over 200ms (linear(0 0%, 0.054 5%, 0.172 10%, 0.3...).
- Also reacting: backdrop (fade), title (14.1px), close (20.2px), svg icon (20.2px).
- The page dropped frames 5 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 868ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 15 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | div/backdrop, h2/title, button close-button/close | at least one | pass |
| Nothing that carries meaning is too fast or too small | button close-button/close finishes in 101ms; svg icon finishes in 101ms; p finishes in 31ms; div/footer finishes in 101ms | no change under 150ms or under 3px | fail |

Audit call: fine (the headline changes size by 40.5px over 200ms).

