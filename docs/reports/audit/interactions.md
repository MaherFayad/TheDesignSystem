# Audit: motion and micro interactions

Analysis only. No source file was changed. Measured on 2026-11-14 on the live
site (`the-system-docs.vercel.app/gallery/`) and on a local dev gallery,
headless Chromium 1243 with the Playwright iPhone 15 Pro and Pixel 7
descriptors (touch on) and a 1440 by 900 desktop. Evidence:
`docs/reports/audit/shots/interactions/` (contact sheets in `sheets/`,
measurements in `data/`).

## Verdict

The owner feels nothing because, on a phone, almost nothing happens long
enough or far enough to be seen. The motion is real: it runs in production,
on the normal component pages, the same as on the `/interactions` stages, in
dev and in prod. But in Neutral, the style a phone gets by default, a press is
a 2 percent shrink (a 117px button loses 1.2px a side) over 70ms, a dialog
rises 4px, a menu rises 8px and grows from 0.98, a checkbox fills and draws in
about 120ms, a radio dot pops in 100ms, colour changes on the switch and the
radio ring are hard cuts, and all three Neutral springs have no overshoot at
all. Worse, on touch the press does not start when the finger lands: Chromium
applies `:active` only when the finger lifts, so every press look arrives 100
to 600ms late and lasts about 100ms, and a card tap moves 0.3px. Nothing else
reacts around the control (no secondary element, no blur, no shape change, no
sound, no haptics), so each change reads as a cut. The references the owner
named do the opposite: 250 to 600ms, two or three beats, the control changes
shape or fill, the thing that opens grows out of the thing that was touched,
and a second element answers. The internal reviews passed this because they
checked that animations exist, match a token and keep contrast, on stage pages
recorded with a mouse at 1x to 4x CSS zoom and read as still frames 40ms
apart, where a 70ms 2 percent change looks like a clear step. They never asked
whether a person at arm's length, at normal speed, with a finger, would notice.

## How it was measured

- Twenty components on their normal pages (`/gallery/c/<slug>`), default
  style (Neutral), light, platform as the gallery picks it (web).
- Real gestures through CDP touch events: a tap is touch start, 90ms hold,
  touch end; a drag is 15 moves 16ms apart; the tooltip is a 900ms long
  press. Desktop runs use a hover then a 90ms mouse press.
- On every animation frame for 0.9 to 1.6s: `document.getAnimations()` (type,
  property, duration, delay, easing) and, for the component and its parts and
  any overlay that opens, the bounding box, opacity, transform, clip-path,
  colours, filter and box-shadow. Travel is the largest move of a part's
  centre from where it ends; scale is the range of its drawn width over its
  end width.
- Event times (`pointerdown`, `pointerup`, `click`) logged in the page, so
  latency from the finger to the first visual change is known.
- Frame capture through the CDP screencast, cropped to the control at 1x
  (no zoom). Headless screencast gives about 15 to 30 frames a second, so the
  sheets are sparse; the numbers come from the frame sampler.
- The same set in Studio, Desk and Liquid (Pixel), on the `/interactions`
  stages (16 ids, Pixel), on the local dev gallery, and with
  `platform=ios` and `platform=android`.

## The twenty components

Neutral, Pixel 7, touch, live site. "Perceivable" means a person would notice
it at arm's length at normal speed: roughly a move of 4px or more, a scale
change of 4 percent or more, or a colour or opacity change over a large area,
lasting 150ms or more. Latency is from touch start to the first visual change.

| Component | Gesture | What animated | Measured | Perceivable | Cause |
| --- | --- | --- | --- | --- | --- |
| Button | tap | root scale, label sink, inner shade | scale 1 to 0.98 (116.6 to 114.2px wide), label 1px down, 70ms in, about 270ms back; starts 110ms after touch start, at release | no | c, i |
| IconButton | tap | same as Button | scale 0.98, icon 1px, 70ms; starts 110ms late | no | c, i |
| Switch | tap | thumb travel, thumb grow, fill clip-path, track colour | thumb 12px over 158ms, ease with no overshoot, grows to 1.02; track colour is `steps(1)` (a cut); nothing else reacts | partly: the slide is seen, the colour is a cut | c, h |
| Switch | touch drag | thumb follows the finger, snap back | 12px max, 1:1 follow, snap 158ms; no grow on web | partly | c |
| Checkbox | tap | fill `clip-path` circle, check `stroke-dashoffset` | fill 90ms, check 72ms after 45ms; all done by about 120ms; no press dip on touch (0.98 on desktop) | no, reads as a cut | c, i |
| Radio | tap | dot scale and opacity, ring | dot 0.5 to 1, opacity 0 to 1 over 100ms; ring `box-shadow` steps (a cut) | barely | c |
| Tabs | tap | pill slide with stretch, label colour | pill 60px over 158ms, width 0.87 to 1.07; the panel swaps in one frame | yes, brief; panel is a cut | c |
| SegmentedControl | tap | pill slide, label ink | 55px over 158ms, width 0.92 to 1.09 | yes, brief | c |
| Select | tap to open, tap an option | list rise, fade, scale, row stagger; value roll | open: 5px, 0.98 to 1, opacity 0 to 1, 158ms, rows 24ms apart; pick: value rolls 17.5px over 158ms | open reads as a fade; the roll is seen | c |
| DropdownMenu | tap | menu rise, scale, clip; rows stagger | 8px, 0.98 to 1, 158ms; rows 200ms, 24ms apart; opens on pointer down | reads as a fade | c |
| Dialog | tap | backdrop fade and blur, panel rise and scale, parts stagger | panel 4px, 0.98 to 1, opaque by about 190ms; parts 8 to 10px, 24ms apart; blur 200ms | reads as a fade | c |
| AlertDialog | tap | as Dialog plus icon pop | panel 4px; icon 0.49 to 1 over 200ms | the icon pop, barely | c |
| Sheet | tap | slide from the bottom, parts stagger | 241px over 200ms, no overshoot | yes, fast | c (no overshoot) |
| Toast | tap the trigger | rise, scale, icon pop, timer line | 40px, 0.98 to 1, 200ms; icon 0.49 to 1 | yes, brief | c |
| Tooltip | 900ms long press | appears, then leaves | appears at full opacity at about 556ms with no entrance; fades 100ms after the finger lifts. Desktop: 4.5px, 0.98, 158ms | no entrance on touch | a (touch path), c |
| Accordion | tap a closed item | content reveal, chevron turn | content div clip and slide 220ms; chevron 158ms; the items below jump 49px in one frame | partly: the jump is a cut | c |
| Input | tap (focus); tap an invalid field | border colour, halo `::before`, label | border 150ms, halo 200ms, no movement; invalid: label rises 4px over 158ms | barely (colour only) | c |
| CopyButton | tap | press, icon wipe and pop, label roll | press 0.987 (0.7px) at release; icon wipe 180ms, pop 200ms, label roll 158ms, "Copied" held 2s | yes, small (16px icon) | c, i |
| Slider | touch drag of the thumb | thumb follows, grows, halo, fill | thumb 53px with the finger, grows to 1.15 on pointer down (16ms latency), fill follows | yes: the best touch response | none |
| Chip | tap an unselected filter | check draw and pop, label slide | check 0.6 to 1 over 200ms, label slides 20px over 158ms; no press look on touch | yes, brief | c, i |
| Card | tap an interactive card | lift through `:hover` | 0.3px, starting 265ms after touch start (after the click, through emulated hover); desktop hover lifts 2px and 1.01 | no | b |

Desktop (mouse) differs in two ways only: the press starts 8ms after mouse
down instead of at release, and hover looks run (card lift 2.5px, button glow,
switch lean). The magnitudes are the same.

### By style (Pixel, same gestures)

| | Neutral (default) | Studio | Desk | Liquid |
| --- | --- | --- | --- | --- |
| press scale | 0.98 | 1 (none) | 0.97 | 0.96 |
| snappy, bouncy spring | 158ms, 200ms, no overshoot | 70ms, 120ms, 2 and 3 hard steps | 300ms, 380ms, peak 1.105 and 1.215 | 296ms, 496ms, peak 1.016 and 1.095 |
| `distance.enter` | 4px | 0px | 12px | 12px |
| `scale.enter`, `scale.pop` | 0.98, 1.02 | 1, 1 | 0.9, 1.14 | 0.92, 1.08 |
| dialog parts rise | 9.7px | 0px | 33px | 25px |
| toast icon | 0.49 to 1 | none | 0.27 to 1.15 | 0.37 to 1.05 |
| card on touch | 0.3px | 0px | 0.3px | 0.2px |

Desk and Liquid are two to three times bigger and slower than Neutral and are
close to perceivable. Studio is cut by design. Neutral, the one a phone gets
first, is the quietest style that still moves.

## Suspects

| # | Suspect | Finding | Proof |
| --- | --- | --- | --- |
| a | Motion exists only on the stages or when a demo opts in | Mostly false, partly true | 16 stage ids measured with a tap on Pixel give the same timing and deltas as the normal pages (button 0.98 over 70ms on both; switch 158ms; tab pill 158ms; dialog 4px; toast 40px), `data/stage.pixel.json` against `data/live.pixel.neutral.json`. True for the opt in pieces: `button-result` needs the `result` prop, the floating label needs `floating`, the switch glyph needs `thumbIcon`, the glow only shows on solid fills under a hover. True for the tooltip: on touch it opens with no entrance at all. |
| b | Depends on `:hover`, so nothing happens on touch | Partly true | Card lift is `:hover` only and its press is `:hover:active`: 0.3px on touch against 2.5px on desktop. Button glow, switch lean, chevron lean, toast expand and FAB lift are hover looks. The main presses do not need hover, but see (i). |
| c | Deltas too small or too fast to perceive | True, the main cause | Press 0.98 over 70ms; dialog 4px; menu 8px and 0.98; checkbox done in 120ms; radio 100ms; Neutral `distance.nudge` 2px, `distance.enter` 4px, `duration.instant` 70ms; the median longest animation per component is about 200ms and the main change of the headline part is 70 to 160ms (table above, `data/tokens.live.json`). |
| d | The production build drops or changes them | False | The local dev gallery gives the same 21 results as production, to the pixel and millisecond (`data/dev.pixel.neutral.json`). The built CSS keeps `@starting-style` (4), `linear()` (21), `@layer` (6), `steps()` (7), `@media (hover:hover)` (14) and the reduced motion rules. |
| e | Reduced motion is on when it should not be | False here | `prefers-reduced-motion` is false, no `data-motion` on the component pages, every duration token is non zero in Neutral, Desk and Liquid. Not checked: whether the owner's phone has Reduce Motion turned on; if it has, every duration is 0ms by design. |
| f | A style preset turns them off | True for Studio only | Studio sets every `distance.*` to 0px, `scale.pop`, `scale.enter`, `scale.press` to 1, stagger to 0ms and its springs to 2 and 3 steps; its preset reduces `pop`, `list-stagger`, `number-roll` and turns `error-shake` off. Studio is not the default. |
| g | Docs previews load without the motion CSS or with another style | False | Each preview is an iframe of the same gallery bundle with `style=neutral`; inside it `--ds-duration-spring-snappy` is 158ms with the same `linear()` ease and reduced motion is off. A tap test inside the iframe did not register in headless (see "Not checked"). |
| h | Timing tokens resolve to 0ms or a wrong value in some style | Partly true | No zero durations outside reduced motion, but Neutral's `ease.spring-snappy`, `-bouncy` and `-soft` all peak at 1.0: a "bouncy" release in Neutral is a plain ease out. The round 3 report says the switch travel in Neutral is 220ms with about 6 percent overshoot; live it is 158ms (snappy) with none, and `duration.spring-bouncy` is 200ms. Studio's distances are 0px (see f). |
| i | Pressed states cut short on touch because `:active` ends at once | True (Chromium) | Holding a touch for 60, 90, 150, 300 and 600ms: `:active` turns on only at touch end each time (140, 144, 210, 411, 647ms) and off about 100ms later; the scale dip starts 15ms after that (`data/touch-and-reference-ui.json`). No component sets a pressed state from `pointerdown`; there is no `data-pressed` in the CSS or React source. iOS Safari was not tested. |
| j | The first paint entrance never plays | False | Entrances play on load: Alert at about 606ms, EmptyState 671ms, List 712ms, Accordion 918ms after navigation start. They play while the page is still settling, so they are easy to miss, but they run. |

Two causes outside the list:

- **k. A phone gets the web platform.** The gallery and the docs default to
  `platform=web` on an iPhone and a Pixel; nothing detects the platform. With
  `platform=ios` the switch travels 17.4px and the thumb grows 1.3x, the
  dialog rises 16px; with `platform=android` the switch travels 22.5px and
  the dot grows 1.5x (`data/plat.*.json`). The owner, on a phone, sees none
  of the platform motion of order 1.25 unless the menu is changed.
- **l. The reviews measured presence, not perception.** The round 3 review
  sampled `getAnimations()` on the focus stages, checked that each duration
  "matched a motion token", checked contrast on seeked frames and looked at
  the contact sheets. The recorder (`docs/reports/shots/interactions-3/record.cjs`)
  drives a desktop mouse at 960 by 540, sets a CSS zoom of 1 to 4 on the
  root, crops to the control and lays out 12 frames 40ms apart. A 2 percent,
  70ms dip drawn at 4x and spread over a strip of stills is easy to see; the
  same dip at 1x under a finger is not.

## Reference comparison

Sources: fifteen clips of `khagwal.com/interactions/` (60 fps, 960 by 960,
studied in a scratch folder and not copied into the repo; numbers in
`data/reference-clips.motion.json`) and the own interface of
`bestdesignsonx.com` measured live. The feed of `bestdesignsonx.com` is a
rotating set of posts from X with no stable mapping to components, so its
own controls were measured instead. The clips are recorded at an unknown
scale, so travel is given relative to the element. Times are from the frames.

| Reference clip | Beats and timing | Travel, scale, shape | Secondary, colour, blur, sound | Nearest in the system | Gap in numbers |
| --- | --- | --- | --- | --- | --- |
| Theme toggle (`switch_mode`) | press, thumb slides, whole scene inverts; done by about 330ms | thumb travels one full diameter | the page background fades white to black over about 130ms, icons swap colour | Switch: 12px over 158ms | 2x longer; colour fade 130ms against a cut; 1 secondary element against 0 |
| Save toggle (`save_toggle`) | darken on press (about 70ms), pill collapses to a circle with a spinner (about 70 to 100ms) | width shrinks about 38 percent, shape pill to circle | fill light to dark | ToggleButton flood: opacity 0 to 0.12 over 200ms | shape change 38 percent against 0 |
| Stateful button (`stateful_button`) | hover grows (about 130ms), label swaps letter by letter (about 30 to 40ms apart, about 500ms), then a percentage counts up digit by digit | width about +10 percent | each letter blurs out and in | Button press 0.98 over 70ms; `result` only with a prop | scale 10 percent against 2 percent; 500ms against 70ms; blur none |
| Tabs (`discrete_tabs`) | old tab collapses to an icon while the new one opens its label, about 300 to 350ms | widths about -60 and +150 percent | labels blur out and in | Tabs pill 60px over 158ms; panel cut | 2x longer; the panel and labels do not move |
| Inline toast (`inline_toast`) | field and button merge, content blurs out and the message blurs in, about 150ms; a tint sweeps the pill over about 2.5s | stays in place | blur crossfade, progress sweep | Toast: 40px rise, 0.98, 200ms; timer line | travel similar; blur none; no in place morph |
| Sheet from a button (`share_sheet`) | the button blurs and fades (about 50ms), the panel grows out of it, about 200ms, slight overshoot | from button size to about 3.5x | blur clears as it grows | Sheet: 241px slide over 200ms, no overshoot, no link to the trigger | origin: trigger against screen edge; overshoot 0 percent |
| Menu from its trigger (`dropdown_disclosure`) | the trigger expands into the menu, about 250ms; the trigger label becomes the header | scale from trigger size, roughly 0.4 to 1 | blur during the grow | DropdownMenu: 8px, 0.98 to 1, 158ms | scale delta about 60 percent against 2 percent; 250 against 158ms |
| Slider (`clamped_slider`) | fill follows the finger; the number rolls each step (about 130ms) with blur; the far label fades as the fill reaches it | 1:1 with the finger | the far label yields | Slider: 1:1, thumb 1.15 on press | value text and far label do not react |
| Copy confirmation (`copy_confirmation`) | the whole button fill turns black to green over about 230ms, the icon blurs into a check, letters roll to "Copied", about 350ms in all | width about +12 percent | fill colour, blur | CopyButton: icon wipe 180ms, pop 200ms, label roll 158ms, press 0.987 | fill colour none; about 2x shorter |
| Input (`invite_code`) | lift on hover (about 150ms), the pill splits into a label layer that rises and a code field, 200 to 350ms, settle with overshoot to about 750ms | label layer rises about 45 percent of the pill height, tilt about 10 degrees, scale about 1.04 | shadow grows | Input: border colour 150ms, halo 200ms, no movement | 0px against tens of pixels; 0 against 3 secondary changes |
| Cards (`revolving_cards`) | front card rotates and slides back while the rear card comes forward, about 550 to 600ms | rotation about 15 degrees, travel about 40 percent of the card width, rear card 0.9 to 1 | shadow, the button fades | Card: 0.3px on touch, 2px hover lift | essentially none on touch |
| List (`list_stack`) | stacked rows fan out into a list, each row about 50ms after the last, about 250ms | each row travels about one row height | the toggle label blurs to its new word | List first paint stagger: a few px, 24ms apart | travel 4px against about 1 row (40 to 60px) |
| Number change (`pop_stepper`) | the number pops, tilts and cycles through four colours in about 330ms, then settles | scale about 1.25, rotation about 10 degrees each way | four hue steps | `scale.pop` 1.02 in Neutral, digit roll | scale 25 percent against 2 percent |
| Dialog (`dialog_stack`) | the trigger lifts with a shadow on hover (about 300ms), then the panel rises from below about half its height with a fade, about 270ms | rise about half the panel height | shadow on the trigger | Dialog: 4px rise, 0.98, 200ms | travel about 100px or more against 4px |
| The reference site's own controls (`bestdesignsonx.com`) | hover pill slides 380ms on `cubic-bezier(0.16, 1, 0.3, 1)`, background 220ms; dialog enters 200ms; page words rise with a blur over 900ms | | sounds: 13 short clips of 70 to 380ms played through Web Audio on actions; a "Sounds" switch in the settings | Tabs pill 158ms; no sound anywhere | 2.4x longer pill; sound none |

What the references share, and the system lacks:

1. Durations of 250 to 600ms for anything that carries meaning; the system's
   are 70 to 200ms.
2. Big deltas: whole shape changes, 10 to 60 percent scale, travel near the
   element's own size; the system moves 2 to 8px and scales 2 percent.
3. Origin: what opens grows out of what was touched.
4. A second element reacts (background, label, neighbour, number).
5. Blur as a transition material (4 to 10px), and fill colour changes over
   the whole control.
6. Sound as feedback, with a switch to turn it off.

## Craft, component by component

| Component | Noticeable | Meaningful | Character | Consistent | Differs by style in kind | Call |
| --- | --- | --- | --- | --- | --- | --- |
| Button | no | yes in intent | no | yes | Studio only (no scale) | invisible |
| IconButton | no | yes in intent | no | yes | Studio only | invisible |
| Switch | the slide, yes | yes | little in Neutral; Liquid and Desk better | yes | degree, not kind (Studio steps) | fine in Desk and Liquid, weak in Neutral |
| Checkbox | no | yes | the drawn check exists but is over before it is seen | yes | Studio steps | invisible |
| Radio | barely | yes | no | yes | degree | invisible |
| Tabs | yes | yes | ordinary; the panel cut breaks it | yes | degree | fine for the pill, wrong for the panel |
| SegmentedControl | yes | yes | ordinary | yes, with Tabs | degree | fine |
| Select | the value roll, yes | yes | the roll has some | yes | degree | open is invisible, pick is fine |
| DropdownMenu | as a fade | weak: it does not come from its trigger | no | yes | degree | invisible as motion |
| Dialog | as a fade | weak | no | yes | degree | invisible as motion |
| AlertDialog | as a fade, icon pop | the icon helps | little | yes | degree | weak |
| Sheet | yes | yes | no overshoot, no drag on open | yes | degree | fine, plain |
| Toast | yes | yes | some (icon pop) | yes | degree | fine |
| Tooltip | on touch, no entrance | yes | no | no: touch and desktop differ | degree | wrong on touch |
| Accordion | the chevron; the push below is a jump | partly | no | no: content moves, the rest jumps | degree | wrong (the jump) |
| Input | colour only | yes | no | yes | degree | invisible |
| CopyButton | yes, small | yes | some | yes | degree | fine but too small |
| Slider | yes | yes | yes | yes | degree | fine |
| Chip | yes | yes | some | yes | degree | fine |
| Card | no on touch | no | no | no: hover only | degree | wrong on touch |

The styles differ in amplitude and timing, and Studio in using steps, but not
in kind: the same properties move the same way in every style, only bigger or
smaller. Seven of twenty are fine, nine are invisible, four are wrong
(Tabs panel, Tooltip on touch, Accordion push, Card on touch).

## What it would take: the ten changes that matter most

1. **Press under the finger.** Set a pressed state on `pointerdown` (and on
   Space or Enter down), clear it on `pointerup`, `pointercancel` and leave,
   and hold it at least 120ms so a quick tap still shows. Every pressable
   (Button family, Chip, Card, Tabs, segments, list rows) reads that state,
   not `:active`. Today the press starts at release.
2. **Make Neutral bold enough to see.** As a starting point to judge on a
   phone: press 0.94 to 0.96, `distance.enter` 12 to 16px, `scale.enter`
   0.9 for popups, snappy 240 to 280ms and bouncy 350 to 450ms with 4 to 8
   percent overshoot, colour fades of 150ms or more (no `steps(1)` on the
   switch track or radio ring). Nothing that carries meaning finishes in
   under 150ms. This is a design decision for the owner; Desk and Liquid are
   already near it.
3. **Pick six signature moments and spend on them; keep the rest quiet.**
   Switch, Checkbox, CopyButton, Toast, popups from a trigger (Menu, Select,
   Popover, Sheet) and Tabs. Each gets two or three beats over 300 to 500ms
   and one secondary reaction. Inputs, radios and lists stay calm but must
   still cross the noticeable line.
4. **Open from the trigger.** Menus, selects, popovers, sheets and dialogs
   grow out of the control that opened them (measure it, start at its box,
   scale to the panel, FLIP or a view transition for the shared element), with
   a 4 to 8px blur that clears. Close back into it.
5. **Change the whole control on a result.** CopyButton and the stateful
   Button change fill colour and width (by transform or clip-path), roll the
   label per letter with blur, then return. Make the result look the default
   for CopyButton and for a Button whose `onClick` returns a promise.
6. **Give every hover look a touch equivalent, or drop it.** Card: press to
   0.97 with a shadow drop on `pointerdown`; guard its hover lift with
   `(hover: hover)`. Glow follows the touch point while held. Tooltip on
   touch plays the same entrance and stays about 1.5s after the finger lifts.
7. **Move the neighbours.** Accordion: the items below glide (FLIP on
   transform) instead of jumping 49px. Tabs: the panel slides 16 to 24px in
   the direction of travel and fades. Lists: rows travel on reorder and fan
   out on first open.
8. **Haptics and sound hooks.** One feedback helper: `navigator.vibrate` (10
   to 15ms) on Android for toggles, selection ticks and success; nothing on
   iOS web, which has no vibration API. Optional sounds through Web Audio
   (short synthesised clicks, no files), off by default, with a theme switch.
   Owner decision; no new dependency is needed.
9. **Detect the platform on a phone.** `platform="auto"` in Theme and in the
   gallery and docs picks `ios` or `android` from the device, so the owner
   sees the platform motion that already exists (switch travel 17 to 22px,
   growing dot 1.3 to 1.5x).
10. **Better springs.** Bake the springs from the spring solver with more
    stops (40 or more for long springs), make overshoot real in every style
    but Studio, and release drags (switch, slider, sheet, toast) with the
    finger's velocity on WAAPI instead of a fixed curve.

What should move from the stages into the defaults: the result states of
Button and CopyButton, the floating label for fields that ask for it in the
docs examples, the switch thumb glyph on iOS, and the tooltip entrance on
touch.

## How to verify motion from now on

The past gates passed work the owner rejected because they proved presence and
token use. Verify what a person sees and feels instead:

1. **Test the real path.** The normal component pages and the docs previews,
   not the stages. Phone viewports (390 by 844 at 3x, 412 by 915 at 2.6x)
   with touch, the platform the device would get, no CSS zoom, light and dark.
2. **Gate on perception numbers**, measured on every frame at 1x, in CSS px,
   per signature interaction:
   - latency from `pointerdown` to the first visual change: 32ms or less;
   - the headline part moves 8px or more, or scales 6 percent or more, or
     changes fill over 30 percent of its area;
   - the main change lasts 200 to 500ms;
   - at least one secondary element reacts;
   - fail anything that carries meaning and finishes under 150ms or moves
     under 3px.
   The harness used for this audit does this; it should become the gate in
   `scripts/` (order for the reviewer lane).
3. **Watch it at normal speed first.** A 60 fps capture at 1x played at
   real time, on a phone sized frame, before any contact sheet. Sheets are
   for diagnosis, never for acceptance.
4. **Blind comparison.** Put each signature clip next to the nearest
   reference clip, same size, unlabelled, order shuffled; the owner (or three
   people) say which feels better and which one moved at all. Pass when ours
   is not picked as weaker in most pairs.
5. **One real device check per round.** iOS Safari and Android Chrome on
   hardware, screen recorded by the owner or a device service: press timing
   under the finger, haptics on Android, frame drops under a 4x slower CPU.
6. **Report numbers a person can picture.** "Rises 12px over 280ms with a 6
   percent overshoot" instead of "uses `distance.enter` and
   `duration.spring-soft`". Matching a token is not a pass condition.

## Not checked

- Real iOS Safari or any WebKit: no WebKit browser is installed. Whether
  `:active` shows under the finger there (it needs a touch listener, which
  React registers) and how the motion looks on a real iPhone are open.
- Real Android Chrome: the press delay was measured in Chromium's touch
  emulation; a real device may show `:active` after a short press delay while
  the finger is held. The press would still start late and the delta would
  still be 2 percent.
- Whether the owner's phone has Reduce Motion on.
- Frame rate, thermal throttling and long tasks on real hardware.
- A tap inside a docs preview iframe: the iframe resolved the same tokens, but
  the tap did not register in headless.
- Reference travel in CSS px: the clips are recorded at an unknown scale, so
  travel is given relative to the element.
- Sound on the reference site was detected through Web Audio calls, not heard.
- The Angular gallery, dark scheme, RTL and the other 90 interactions.
- Screencast frames in headless come at about 15 to 30 a second, so the
  contact sheets are sparse; the timings come from the frame sampler.

## Evidence

- `shots/interactions/sheets/<device>.<component>.png`: twelve frames from
  the gesture to about 700ms, at 1x, cropped to the control or the whole
  viewport for overlays, labelled with ms after the gesture. Devices `pixel`,
  `iphone`, `desktop`; Neutral, light.
- `shots/interactions/data/live.<device>.neutral.json`: every animation and
  tracked part per step. The chip, segmented control, select, accordion and
  tooltip rows in these files hit the wrong target; use `fix.<device>.neutral.json`
  and `chip.<device>.neutral.json` for those.
- `live.pixel.{studio,desk,liquid}.json`, `dev.pixel.neutral.json` (local
  dev), `stage.pixel.json` (16 stage ids), `plat.iphone.ios.json`,
  `plat.pixel.android.json`, `tokens.live.json` (computed motion tokens per
  style), `touch-and-reference-ui.json` (press hold timing, tooltip on touch,
  the reference site's own controls and sounds),
  `reference-clips.motion.json` (motion events found in the reference clips).
