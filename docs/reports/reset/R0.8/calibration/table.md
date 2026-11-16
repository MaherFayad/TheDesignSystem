# Perceive: neutral, web, Pixel 7

Profile rich. light scheme. Run 2026-11-16T12:38:47.991Z in headless Chromium 153.0.8010.12, real time (no slow motion), touch through CDP.
Load average at the start: 23.77, 21.84, 20.75 on 4 cores.
Detected platform on the page: web.
Median frame interval: 16.7ms (16.7ms is 60 frames a second).
The machine was loaded (load average 23.77 on 4 cores): latencies and frame times may read longer than on an idle machine.

| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 98ms | 115ms (at release) | button button | 0px | 0.98 to 1 | 70ms | 100% | 0 | 0 | not shown | fail: latency, duration, secondary, meaning, held; audit call invisible |
| IconButton | 114ms | 131ms (at release) | button icon-button | 0px | 0.98 to 1 | 70ms | 100% | 0 | 0 | not shown | fail: latency, duration, secondary, meaning, held; audit call invisible |
| Switch | 95ms | 110ms (at release) | thumb | 12px | 1 to 1.02 | 158ms | 55% | 2 | 0 | not shown | fail: latency, duration, held; audit call fine |
| Checkbox | 81ms | 118ms (at release) | indicator | 0px | 1 to 1 | 225ms | 0% | 0 | 0 | not shown | fail: latency, size, secondary, meaning, held; audit call invisible |
| Radio | 80ms | 121ms (at release) | indicator | 0px | 0.501 to 1 | 200ms | 0% | 3 | 0 | not shown | fail: latency, meaning, held; audit call invisible |
| Tabs | 76ms | 135ms (at release) | indicator | 60.4px | 0.871 to 1.071 | 158ms | 0% | 1 | 2 | not shown | fail: latency, duration, meaning, held; audit call wrong |
| SegmentedControl | 248ms | 319ms (at release) | indicator | 49.4px | 0.906 to 1.051 | 158ms | 0% | 3 | 0 | not shown | fail: latency, duration, meaning, held; audit call fine |
| Select | 114ms | 301ms (at release) | content | 5.9px | 0.98 to 1 | 158ms | 0% | 18 | 0 |  | fail: latency, size, duration, meaning; audit call invisible |
| DropdownMenu | 795ms | 798ms (at release) | div dropdown-menu[menu] | 8.5px | 0.98 to 1 | 158ms | 0% | 28 | 0 |  | fail: latency, duration, meaning; audit call invisible |
| Dialog | 115ms | 612ms (at release) | panel | 4px | 0.98 to 1 | 200ms | 0% | 8 | 0 |  | fail: latency, size, meaning; audit call invisible |
| AlertDialog | 38ms | 414ms (at release) | panel | 4px | 0.98 to 1 | 200ms | 0% | 7 | 0 |  | fail: latency, size, meaning; audit call invisible |
| Sheet | 213ms | 847ms (at release) | panel | 236.8px | 1 to 1 | 200ms | 0% | 15 | 0 |  | fail: latency, meaning; audit call fine |
| Toast | 98ms | 533ms (at release) | li toast | 39.7px | 0.98 to 1 | 200ms | 0% | 6 | 0 |  | fail: latency, meaning; audit call fine |
| Tooltip | 894ms | 564ms | div tooltip[tooltip] | 0px | 1 to 1 | 100ms | 0% | 1 | 2 |  | fail: latency, size, duration, meaning; audit call wrong |
| Accordion | 53ms | 93ms (at release) | div | 4px | 1 to 1 | 220ms | 0% | 2 | 2 | not shown | fail: latency, size, meaning, held; audit call wrong |
| Input | 91ms | 108ms (at release) | div input | 0px | 1 to 1 | 200ms | 0% | 0 | 0 |  | fail: latency, size, secondary; audit call invisible |
| CopyButton | 81ms | 142ms (at release) | label | 0px | 1 to 1 | 182ms | 100% | 2 | 0 | not shown | fail: latency, duration, meaning, held; audit call fine |
| Slider | 1018ms | 268ms | thumb | 49.8px | 1 to 1.15 | 200ms | 0% | 0 | 0 |  | fail: latency, secondary; audit call fine |
| Chip | 116ms | 137ms (at release) | label | 20.1px | 1 to 1 | 158ms | 100% | 1 | 0 | not shown | fail: latency, duration, meaning, held; audit call fine |
| Card | 83ms | 256ms (at release) | div card | 0px | 1 to 1 | 200ms | 0% | 0 | 0 | not shown | fail: latency, size, secondary, held; audit call wrong |

Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.

## Button: the finger taps an accent solid button

- The first visible change comes 115ms after the finger lands, when the finger lifts.
- The button button shrinks to 0.98, changes colour (Delta E 12) over 70ms (cubic-bezier(0, 0, 0.58, 1)).
- The fill changes over 100 percent of the control.
- Nothing else reacts.
- Held for 573ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 115ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 2 percent, fill over 100 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 70ms | 200 to 500ms | fail |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | button button finishes in 70ms; span/label finishes in 70ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 573ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (its main change takes 70ms).

## IconButton: the finger taps an icon button

- The first visible change comes 131ms after the finger lands, when the finger lifts.
- The button icon-button shrinks to 0.98, changes colour (Delta E 23) over 70ms (cubic-bezier(0, 0, 0.58, 1)).
- The fill changes over 100 percent of the control.
- Nothing else reacts.
- The page dropped frames 1 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 545ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 131ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 2 percent, fill over 100 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 70ms | 200 to 500ms | fail |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | button icon-button finishes in 70ms; svg icon finishes in 50ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 545ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (its main change takes 70ms).

## Switch: the finger taps a switch that is off

- The first visible change comes 110ms after the finger lands, when the finger lifts.
- The thumb moves 12px, grows to 1.02 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- The fill changes over 55 percent of the control.
- Also reacting: track (colour), span (fade).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 645ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 110ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 12px, scales 2 percent, fill over 55 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | span/track, span | at least one | pass |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |
| Press shows while the finger is held 645ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 12px over 158ms).

## Checkbox: the finger taps an empty checkbox

- The first visible change comes 118ms after the finger lands, when the finger lifts.
- The indicator changes colour (Delta E 35) over 225ms (cubic-bezier(0, 0, 0.58, 1)).
- Nothing else reacts.
- Held for 613ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 118ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 225ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | span/indicator finishes in 90ms; span finishes in 90ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 613ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (it moves 0px and changes size by 0px).

## Radio: the finger taps the radio that is not chosen

- The first visible change comes 121ms after the finger lands, when the finger lifts.
- The indicator shrinks to 0.501, fades from 0.26 to 1 over 200ms (cubic-bezier(0, 0, 0.58, 1)).
- Also reacting: control (colour), indicator (fade), control (colour).
- The page dropped frames 3 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 598ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 121ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 49.9 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | button/control[radio], span/indicator, button/control[radio] | at least one | pass |
| Nothing that carries meaning is too fast or too small | button/control[radio] finishes in 100ms; span/indicator finishes in 100ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 598ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: invisible (it moves 0px and changes size by 2.8px).

## Tabs: the finger taps the second tab

- The first visible change comes 135ms after the finger lands, when the finger lifts.
- The indicator moves 60.4px, shrinks to 0.871 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: label (colour).
- The p vanishes in one frame.
- The p appears in one frame.
- The page dropped frames 3 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 620ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 135ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 60.4px, scales 12.9 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | span/label | at least one | pass |
| Nothing that carries meaning is too fast or too small | span/label changes in one frame; button/trigger[tab] changes in one frame; p changes in one frame; p changes in one frame | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 620ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: wrong (p vanishes in one frame).

## SegmentedControl: the finger taps the last segment

- The first visible change comes 319ms after the finger lands, when the finger lifts.
- The indicator moves 49.4px, shrinks to 0.906 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: item (colour), item (colour), label (colour).
- The page dropped frames 5 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 583ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 319ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 49.4px, scales 9.4 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | button toggle-button/item[radio], button toggle-button/item[radio], span/label | at least one | pass |
| Nothing that carries meaning is too fast or too small | button toggle-button/item[radio] finishes in 100ms; span/label finishes in 37ms; button toggle-button/item[radio] finishes in 100ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 583ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 49.4px over 158ms).

## Select: the finger taps a select to open it

- The first visible change comes 301ms after the finger lands, when the finger lifts.
- The content moves 5.9px, shrinks to 0.98, fades from 0.59 to 1 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: button select[combobox] (colour), item (4.9px), svg icon (4.5px), item-label (5.1px).
- The page dropped frames 1 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 301ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 5.9px, scales 2 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | button select[combobox], div/item[option], svg icon | at least one | pass |
| Nothing that carries meaning is too fast or too small | svg icon finishes in 86ms; span/item-label finishes in 86ms; span/item-description finishes in 86ms; svg icon finishes in 86ms | no change under 150ms or under 3px | fail |

Audit call: invisible (it moves 5.9px and changes size by 4.5px).

## DropdownMenu: the finger taps a menu button to open its menu

- The first visible change comes 798ms after the finger lands, when the finger lifts.
- The div dropdown-menu[menu] moves 8.5px, shrinks to 0.98, fades from 0.58 to 1 over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- Also reacting: label (4px), svg icon (4px), text (4px), shortcut (4px).
- The page dropped frames 4 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 798ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 8.5px, scales 2 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | div/label, svg icon, span/text | at least one | pass |
| Nothing that carries meaning is too fast or too small | button button finishes in 70ms; span/label finishes in 70ms; svg icon finishes in 17ms | no change under 150ms or under 3px | fail |

Audit call: invisible (it moves 8.5px and changes size by 8.4px).

## Dialog: the finger taps a button that opens a dialog

- The first visible change comes 612ms after the finger lands, when the finger lifts.
- The panel moves 4px, shrinks to 0.98, fades from 0.57 to 1 over 200ms (linear(0 0%, 0.056 5%, 0.176 10%, 0.3...).
- Also reacting: backdrop (fade), title (9.7px), close (6.4px), svg icon (6.4px).
- The page dropped frames 10 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 612ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 4px, scales 2 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | div/backdrop, h2/title, button close-button/close | at least one | pass |
| Nothing that carries meaning is too fast or too small | button close-button/close finishes in 131ms; svg icon finishes in 131ms; p finishes in 138ms; div/footer finishes in 131ms | no change under 150ms or under 3px | fail |

Audit call: invisible (it moves 4px and changes size by 7.2px).

## AlertDialog: the finger taps a button that opens an alert dialog

- The first visible change comes 414ms after the finger lands, when the finger lifts.
- The panel moves 4px, shrinks to 0.98, fades from 0.57 to 1 over 200ms (linear(0 0%, 0.056 5%, 0.176 10%, 0.3...).
- Also reacting: backdrop (fade), icon (6.1px), svg icon (6.1px), title (8.5px).
- The page dropped frames 5 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 414ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 4px, scales 2 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | div/backdrop, span/icon, svg icon | at least one | pass |
| Nothing that carries meaning is too fast or too small | button button/cancel moves only 2.4px; span/label moves only 2.4px | no change under 150ms or under 3px | fail |

Audit call: invisible (it moves 4px and changes size by 7.2px).

## Sheet: the finger taps a button that opens a sheet

- The first visible change comes 847ms after the finger lands, when the finger lifts.
- The panel moves 236.8px over 200ms (linear(0 0%, 0.056 5%, 0.176 10%, 0.3...).
- Also reacting: backdrop (fade), handle-bar (236.8px), header (240.8px), title (240.8px).
- The page dropped frames 3 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 847ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 236.8px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | div/backdrop, span/handle-bar, div/header | at least one | pass |
| Nothing that carries meaning is too fast or too small | span/handle-bar finishes in 116ms; h2/title finishes in 104ms; p/description finishes in 104ms; button close-button/close finishes in 104ms | no change under 150ms or under 3px | fail |

Audit call: fine (the headline moves 236.8px over 200ms).

## Toast: the finger taps a button that shows a toast

- The first visible change comes 533ms after the finger lands, when the finger lifts, after the click.
- The li toast moves 39.7px, shrinks to 0.98 over 200ms (linear(0 0%, 0.054 5%, 0.172 10%, 0.3...).
- Also reacting: icon (39.8px), svg icon (39.8px), title (39.7px), close (39.8px).
- The page dropped frames 5 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 533ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 39.7px, scales 2 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | span/icon, svg icon, div/title | at least one | pass |
| Nothing that carries meaning is too fast or too small | svg icon finishes in 63ms; div/title finishes in 63ms; button close-button/close finishes in 63ms; svg icon finishes in 63ms | no change under 150ms or under 3px | fail |

Audit call: fine (the headline moves 39.7px over 200ms).

## Tooltip: the finger presses and holds an icon button for 900ms

- The first visible change comes 564ms after the finger lands, while the finger is still down.
- The div tooltip[tooltip] fades from 0 to 1 over 100ms (cubic-bezier(0.4, 0, 1, 1)).
- Also reacting: button icon-button (colour).
- The div tooltip[tooltip] appears in one frame.
- The bdi appears in one frame.
- The page dropped frames 4 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 564ms | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 100ms | 200 to 500ms | fail |
| A second element reacts | button icon-button | at least one | pass |
| Nothing that carries meaning is too fast or too small | button icon-button finishes in 70ms; svg icon changes in one frame | no change under 150ms or under 3px | fail |

Audit call: wrong (div tooltip[tooltip] appears in one frame, with no entrance).

## Accordion: the finger taps a closed item

- The first visible change comes 93ms after the finger lands, when the finger lifts.
- The div moves 4px over 220ms (cubic-bezier(0.22, 1, 0.36, 1)).
- Also reacting: svg icon (fade), svg icon (fade).
- The div vanishes in one frame.
- The trigger jumps 49px in one frame.
- The page dropped frames 1 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 581ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 93ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 4px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 220ms | 200 to 500ms | pass |
| A second element reacts | svg icon, svg icon | at least one | pass |
| Nothing that carries meaning is too fast or too small | div changes in one frame; button button/trigger changes in one frame | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 581ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: wrong (div vanishes in one frame).

## Input: the finger taps a text field to focus it

- The first visible change comes 108ms after the finger lands, when the finger lifts.
- The div input changes colour (Delta E 21) over 200ms (linear(0 0%, 0.056 5%, 0.176 10%, 0.3...).
- Nothing else reacts.
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 108ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |

Audit call: invisible (it moves 0px and changes size by 0px).

## CopyButton: the finger taps a copy button

- The first visible change comes 142ms after the finger lands, when the finger lifts.
- The label does not change.
- The fill changes over 100 percent of the control.
- Also reacting: button copy-button (colour), svg icon (fade).
- The page dropped frames 2 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 601ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 142ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 100 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 182ms | 200 to 500ms | fail |
| A second element reacts | button copy-button, svg icon | at least one | pass |
| Nothing that carries meaning is too fast or too small | button copy-button finishes in 70ms; span finishes in 100ms; span finishes in 17ms | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 601ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline changes fill over 182ms).

## Slider: the finger drags a slider thumb 54px

- The first visible change comes 268ms after the finger lands, while the finger is still down.
- The thumb moves 49.8px, grows to 1.15 over 200ms (linear(0 0%, 0.054 5%, 0.172 10%, 0.3...).
- Nothing else reacts.
- The page dropped frames 5 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 268ms | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 49.8px, scales 15 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |

Audit call: fine (the headline moves 49.8px over 983ms).

## Chip: the finger taps a filter chip that is off

- The first visible change comes 137ms after the finger lands, when the finger lifts.
- The label moves 20.1px, changes colour (Delta E 78) over 158ms (linear(0 0%, 0.055 5%, 0.173 10%, 0.3...).
- The fill changes over 100 percent of the control.
- Also reacting: svg icon (fade).
- The page dropped frames 1 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 612ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 137ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 20.1px, scales 0 percent, fill over 100 percent | 8px, or 6 percent scale, or fill over 30 percent | pass |
| Main change lasts long enough to read | 158ms | 200 to 500ms | fail |
| A second element reacts | svg icon | at least one | pass |
| Nothing that carries meaning is too fast or too small | button chip changes in one frame | no change under 150ms or under 3px | fail |
| Press shows while the finger is held 612ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: fine (the headline moves 20.1px over 158ms).

## Card: the finger taps an interactive card

- The first visible change comes 256ms after the finger lands, when the finger lifts, after the click.
- The div card changes a little over 200ms (linear(0 0%, 0.056 5%, 0.176 10%, 0.3...).
- Nothing else reacts.
- The page dropped frames 4 times (gaps of 50ms or more) after the finger landed, so times may read longer than on an idle machine.
- Held for 580ms, the press shows nothing while the finger is down.

| Check | Measured | Limit | Result |
| --- | --- | --- | --- |
| First visible change after the finger lands | 256ms, at release | at most 32ms | fail |
| Headline part moves, scales or changes fill enough to see | moves 0px, scales 0 percent, fill over 0 percent | 8px, or 6 percent scale, or fill over 30 percent | fail |
| Main change lasts long enough to read | 200ms | 200 to 500ms | pass |
| A second element reacts | none | at least one | fail |
| Nothing that carries meaning is too fast or too small | none | no change under 150ms or under 3px | pass |
| Press shows while the finger is held 580ms | nothing while held | from 32ms or sooner, for the whole hold | fail |

Audit call: wrong (the first change comes 256ms after the finger lands, after the click, through emulated hover).

