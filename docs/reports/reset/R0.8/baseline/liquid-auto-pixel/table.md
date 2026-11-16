# Perceive: liquid, auto, Pixel 7

Profile rich. light scheme. Run 2026-11-16T13:23:01.445Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 16.77, 19.95, 23.20 on 4 cores.
Detected platform on the page: android.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 16.77 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 105ms | 122ms (at release) | button button | 0px | 1 to 1 | 320ms | 0% | 0 | 0 | not shown | fail: latency, size, secondary, held; audit call invisible |
| Switch | 99ms | 152ms (at release) | thumb | 22px | 0.667 to 1.089 | 375ms | 0% | 2 | 0 | not shown | fail: latency, meaning, held; audit call fine |
| Checkbox | 164ms | 181ms (at release) | indicator | 0px | 1 to 1 | 400ms | 0% | 0 | 0 | not shown | fail: latency, size, secondary, held; audit call invisible |
| Tabs | 99ms | 124ms (at release) | indicator | 98.5px | 0.887 to 1.113 | 296ms | 0% | 1 | 2 | not shown | fail: latency, meaning, held; audit call wrong |
| Toast | 107ms | 476ms (at release) | li toast | 68.1px | 1 to 1 | 375ms | 0% | 4 | 0 |  | fail: latency; audit call fine |
| Dialog | 122ms | 433ms (at release) | panel | 0px | 0.92 to 1 | 300ms | 0% | 4 | 0 |  | fail: latency, meaning; audit call fine |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 122ms after the finger lands, when the finger lifts.
- The button changes colour (Delta E 8) over 320ms (cubic-bezier(0, 0, 0.58, 1)).
- Nothing else reacts.
- The page dropped frames 1 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 627ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 122ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 320ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |
| Press shows while the finger is held 627ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (it moves 0px and changes size by 0px).

## Switch: the finger taps a switch that is off

- The first visible change comes 152ms after the finger lands, when the finger lifts.
- The thumb moves 22px, shrinks to 0.667 over 375ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: track (colour), span (fade).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 623ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 152ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 22px, scales 33.3 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 375ms | 200 to 500ms | pass |
| A second element reacts | span/track, span | at least one | pass |
| Nothing that carries meaning is too fast or too small | span/thumb-lens finishes in 70ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 623ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 22px over 375ms).

## Checkbox: the finger taps an empty checkbox

- The first visible change comes 181ms after the finger lands, when the finger lifts.
- The indicator changes colour (Delta E 22) over 400ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Nothing else reacts.
- The page dropped frames 3 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 642ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 181ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 400ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |
| Press shows while the finger is held 642ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (it moves 0px and changes size by 0px).

## Tabs: the finger taps the second tab

- The first visible change comes 124ms after the finger lands, when the finger lifts.
- The indicator moves 98.5px, shrinks to 0.887 over 296ms (linear(0 0%, 0.054 5%, 0.178 10%, 0.3...).
- Also reacting: label (colour).
- The p vanishes in one frame.
- The p appears in one frame.
- The page dropped frames 4 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 613ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 124ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 98.5px, scales 11.3 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 296ms | 200 to 500ms | pass |
| A second element reacts | span/label | at least one | pass |
| Nothing that carries meaning is too fast or too small | span/label changes in one frame; button/trigger[tab] changes in one frame; p changes in one frame; p changes in one frame | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 613ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: wrong (p vanishes in one frame).

## Toast: the finger taps a button that shows a toast

- The first visible change comes 476ms after the finger lands, when the finger lifts, after the click.
- The toast moves 68.1px, fades from 0.31 to 1 over 375ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: svg icon (68.1px), title (68.1px), close (68.1px), svg icon (68.1px).
- The page dropped frames 9 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 476ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 68.1px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 375ms | 200 to 500ms | pass |
| A second element reacts | svg icon, div/title, button close-button/close | at least one | pass |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |

Audit call: fine (the headline moves 68.1px over 375ms).

## Dialog: the finger taps a button that opens a dialog

- The first visible change comes 433ms after the finger lands, when the finger lifts.
- The panel shrinks to 0.92 over 300ms (cubic-bezier(0.16, 1, 0.3, 1)).
- Also reacting: backdrop (fade), title (16.6px), description (10.9px), p (6px).
- The page dropped frames 7 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 433ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 8 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 300ms | 200 to 500ms | pass |
| A second element reacts | div/backdrop, h2/title, p/description | at least one | pass |
| Nothing that carries meaning is too fast or too small | button close-button/close finishes in 17ms; svg icon finishes in 17ms; p finishes in 62ms; button button finishes in 17ms | no change under 150ms or under 3px | fail |

Audit call: fine (the headline changes size by 28.5px over 300ms).

