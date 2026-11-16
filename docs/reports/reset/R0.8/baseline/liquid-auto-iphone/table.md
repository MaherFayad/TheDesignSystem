# Perceive: liquid, auto, iPhone 15 Pro

Profile rich. light scheme. Run 2026-11-16T13:23:58.715Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 24.03, 21.48, 23.52 on 4 cores.
Detected platform on the page: ios.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 24.03 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 129ms | 142ms (at release) | button button | 0px | 1 to 1 | 320ms | 0% | 0 | 0 | not shown | fail: latency, size, secondary, held; audit call invisible |
| Switch | 113ms | 135ms (at release) | thumb | 17.4px | 1 to 1.202 | 375ms | 0% | 2 | 0 | not shown | fail: latency, meaning, held; audit call fine |
| Checkbox | 111ms | 128ms (at release) | indicator | 0px | 1 to 1 | 400ms | 0% | 0 | 0 | not shown | fail: latency, size, secondary, held; audit call invisible |
| Tabs | 99ms | 175ms (at release) | indicator | 90.2px | 0.877 to 1.158 | 296ms | 0% | 1 | 2 | not shown | fail: latency, meaning, held; audit call wrong |
| Toast | 97ms | 183ms (at release) | li toast | 64px | 1 to 1 | 375ms | 0% | 4 | 0 |  | fail: latency; audit call fine |
| Dialog | 120ms | 796ms (at release) | panel | 0px | 0.996 to 1.15 | 496ms | 0% | 3 | 0 |  | fail: latency, meaning; audit call fine |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 142ms after the finger lands, when the finger lifts.
- The button fades from 0.55 to 1, changes colour (Delta E 8) over 320ms (cubic-bezier(0, 0, 0.58, 1)).
- Nothing else reacts.
- The page dropped frames 1 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 605ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 142ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 320ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |
| Press shows while the finger is held 605ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (it moves 0px and changes size by 0px).

## Switch: the finger taps a switch that is off

- The first visible change comes 135ms after the finger lands, when the finger lifts.
- The thumb moves 17.4px, grows to 1.202 over 375ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: track (colour), span (fade).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 615ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 135ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 17.4px, scales 20.2 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 375ms | 200 to 500ms | pass |
| A second element reacts | span/track, span | at least one | pass |
| Nothing that carries meaning is too fast or too small | span/track finishes in 100ms; span/thumb-lens finishes in 70ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 615ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 17.4px over 375ms).

## Checkbox: the finger taps an empty checkbox

- The first visible change comes 128ms after the finger lands, when the finger lifts.
- The indicator changes colour (Delta E 22) over 400ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Nothing else reacts.
- Held for 616ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 128ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 400ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |
| Press shows while the finger is held 616ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (it moves 0px and changes size by 0px).

## Tabs: the finger taps the second tab

- The first visible change comes 175ms after the finger lands, when the finger lifts.
- The indicator moves 90.2px, shrinks to 0.877 over 296ms (linear(0 0%, 0.054 5%, 0.178 10%, 0.3...).
- Also reacting: label (colour).
- The p vanishes in one frame.
- The p appears in one frame.
- The page dropped frames 3 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 610ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 175ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 90.2px, scales 15.8 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 296ms | 200 to 500ms | pass |
| A second element reacts | span/label | at least one | pass |
| Nothing that carries meaning is too fast or too small | span/label changes in one frame; button/trigger[tab] changes in one frame; p changes in one frame; p changes in one frame | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 610ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: wrong (p vanishes in one frame).

## Toast: the finger taps a button that shows a toast

- The first visible change comes 183ms after the finger lands, when the finger lifts, after the click.
- The toast moves 64px, fades from 0.3 to 1 over 375ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: svg icon (64px), title (64px), close (64px), svg icon (64px).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 183ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 64px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 375ms | 200 to 500ms | pass |
| A second element reacts | svg icon, div/title, button close-button/close | at least one | pass |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |

Audit call: fine (the headline moves 64px over 375ms).

## Dialog: the finger taps a button that opens a dialog

- The first visible change comes 796ms after the finger lands, when the finger lifts.
- The panel shrinks to 0.996 over 496ms (linear(0 0%, 0.086 5%, 0.281 10%, 0.5...).
- Also reacting: backdrop (fade), title (18px), description (10.2px).
- The page dropped frames 3 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 796ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 15 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 496ms | 200 to 500ms | pass |
| A second element reacts | div/backdrop, h2/title, p/description | at least one | pass |
| Nothing that carries meaning is too fast or too small | button close-button/close finishes in 17ms; svg icon finishes in 17ms; p finishes in 17ms; div/footer finishes in 17ms | no change under 150ms or under 3px | fail |

Audit call: fine (the headline changes size by 42.5px over 496ms).

