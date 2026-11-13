# Interaction round 2 (order 1.22)

Agent: ds-style, leading the round, with six family agents (ds-component).
Branch `claude/ds-order-1-22`. Every interaction, token and preset in this
report is **proposed**: it waits for the owner.

Round 1 mostly changed one property per interaction: a scale on press, a
fade, a slide. The owner asked for the layered feel of the two collections:
anticipation, overshoot, settle, staggered parts, and secondary elements that
react. This round restudies both collections, frame by frame, and builds a
foundation (spring tokens and five primitives) that every family uses.

## 1. The study

Both sites were read on 2026-11-12 in headless Chromium through Playwright.
Both render on the client.

**Method.** 56 clips from `khagwal.com/interactions` and 15 video posts from
`bestdesignsonx.com` were downloaded to a scratch folder outside the repo,
measured, read and deleted. For each clip:

1. Every frame was cut to 96 by 96 gray. A frame difference (the share of
   pixels that changed by more than 6 levels) gives a motion curve at 60
   frames a second (some clips 59).
2. The curve was split into bursts of motion. For each burst: its start, its
   length, where its peak falls, how many separate peaks it has (parts that
   move one after another), and the length of its low tail after the peak
   (the settle).
3. The two largest bursts of each clip were laid out as twelve frames on a
   contact sheet and read by eye, to name the beats: anticipation (a small
   move against the action), action, overshoot, settle, and what else
   reacts.

Nothing was copied: no code, no asset, no name of an interaction is used in
the system. Only the kind of feedback and its timing were taken. Every timing
the system plays comes from its own tokens.

**Reading the numbers.** "Peak" is when the burst moves most, from its
start. A peak early in the burst is an ease out (the motion starts fast and
settles); a long tail after the peak is a spring settling or an overshoot
coming back. "Parts" counts peaks inside one burst: one is a single move,
three or more is a staggered group.

### 1.1 khagwal.com/interactions, 56 clips

Each clip is a square recording, 4 to 26 s long, of one control looping
through its states with a visible pointer.

| # | Clip | Main burst | Peak | Parts | Settle tail | Beats seen |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Action Wheel | 851 to 1168 ms | 200 to 234 ms | 2 to 3 | 284 to 751 ms | The plus rotates to a close mark while six round actions fly out on a circle, each a few frames after the last, landing past their place and settling back; close reverses faster with all at once |
| 2 | Card Swipe | 850 to 1033 ms | 100 to 217 ms | 4 to 7 | 283 to 517 ms | The card leans as it leaves, the next card behind scales up from a smaller size to take its place, the page dots slide; the incoming card overshoots its scale slightly |
| 3 | Clamped Slider | 868 to 1251 ms | 117 to 551 ms | 5 to 16 | 100 to 284 ms | The fill follows the pointer; the value label inside the thumb rolls digit by digit as it changes; past the end the fill stretches a little and springs back on release |
| 4 | Conditional Stepper | 1101 to 1568 ms | 167 to 234 ms | 4 | 751 to 1034 ms | The minus button pops in from the side (scale from small with overshoot) when the value leaves zero, the value slides to make room, the digit rolls; at zero the minus shrinks away and the value slides back |
| 5 | Contextual Action Split | 917 to 950 ms | 117 ms | 2 | 583 ms | Two actions blur out while a close mark and two new actions grow in, the outer ones landing a beat later; the close mark rotates in |
| 6 | Copy Confirmation | 384 to 400 ms | 167 to 217 ms | 2 | 33 to 50 ms | The copy glyph shrinks and fades, the check scales in from small; the label rolls to the past tense; the fill color settles last |
| 7 | Dialog Stack | 534 to 868 ms | 100 to 567 ms | 1 to 2 | 33 to 234 ms | The front card slides down and fades while the card behind rises and scales up to the front; the exit is shorter than the entry |
| 8 | Diary Empty State | 634 to 1218 ms | 133 to 234 ms | 1 to 5 | 300 to 701 ms | An idle illustration: a page turns over in a loop with a soft settle each time; the loop pauses between turns |
| 9 | Dropdown Disclosure | 417 to 567 ms | 67 to 250 ms | 1 | 33 to 234 ms | The trigger grows into the panel; rows fade in after the surface, top first; close folds the panel back into the trigger faster than it opened |
| 10 | Edit Badge | 701 to 1218 ms | 384 ms | 1 | 751 ms | The badge fades and the editor rises from it with a slight scale; inside, the swatches appear after the frame; the chosen swatch ring scales in |
| 11 | Editable Chip | 317 to 400 ms | 67 to 184 ms | 1 to 4 | 50 to 83 ms | The pencil turns into a check (rotate and scale), the chip gains an outline; on save the check pops once |
| 12 | Emoji Spree Choice Chips | 851 to 1468 ms | 133 to 450 ms | 7 to 16 | 150 to 467 ms | Picking a chip makes it pop (scale up past rest, then settle) and the count below rolls; rows shift with a stagger to make room |
| 13 | Fan Menu | 367 to 533 ms | 133 to 250 ms | 1 to 9 | 67 to 317 ms | The plus rotates 45 degrees into a close mark while items fan out one by one from the button with a tilt; close collapses them together, faster |
| 14 | Feature Tour | 1067 to 1300 ms | 317 to 350 ms | 1 to 3 | 583 to 833 ms | The illustration cross fades with a slight scale and the title and body follow a beat later; the page dot slides to the next step |
| 15 | Filter Disclosure | 717 to 750 ms | 500 to 517 ms | 2 to 4 | 50 to 67 ms | A small icon grows into a panel; rows appear one after another from the top, about 40 ms apart; the check of the active row pops last |
| 16 | Floating Preview Chips | long, hover driven | | 17 | | A preview follows the pointer from chip to chip, lagging slightly and tilting with its travel; each new preview pops in from small |
| 17 | Fluid Tabs | 234 to 317 ms | 50 to 83 ms | 1 to 8 | 0 to 100 ms | The pill slides to the new tab; the labels it leaves and reaches blur and sharpen during the move (round 1 rejected the blur) |
| 18 | Frequency Selector | 267 to 951 ms | 83 to 217 ms | 2 to 3 | 0 to 617 ms | A second row of day chips grows out under the first with a soft settle; the pill on the first row slides; the check on the side stays still |
| 19 | Inline Action Confirmation | 267 to 333 ms | 50 to 267 ms | 1 to 3 | 0 | The label shrinks into a short bar of progress in place; done swaps the bar for a check that scales in; then the label returns |
| 20 | Inline Edit | 150 to 217 ms | 67 to 133 ms | 1 | 0 | The edit glyph splits into two action glyphs (cancel, save) that grow in side by side |
| 21 | Inline Overflow | 517 to 533 ms | 133 to 267 ms | 1 to 7 | 0 to 200 ms | The overflow dots give way to the hidden actions, which slide in one after another from the start side |
| 22 | Invite Disclosure | 950 to 1200 ms | 50 to 317 ms | 1 to 3 | 533 to 733 ms | The pill with a count grows into a panel; the count badge fades; the rows stagger in with a slight rise |
| 23 | Labeled Progress Indicator | 900 to 1100 ms | 283 to 617 ms | 11 to 16 | 67 to 117 ms | The bar eases to a new value while its caption rolls to the next word; a highlight sweeps along the fill while it works |
| 24 | Layered Progressive Disclosure | 584 to 834 ms | 133 ms | 3 | 0 to 501 ms | A switch turns on and new rows grow below it, the content under them sliding down; off reverses |
| 25 | List Stack | 550 to 600 ms | 50 to 150 ms | 1 to 3 | 233 to 300 ms | A stack of cards fans out into a list, each a step later, and settles; collapse stacks them back with a smaller step |
| 26 | MacOS Sidebar | 250 to 567 ms | 83 to 150 ms | 1 to 4 | 0 to 117 ms | The sidebar slides out with its labels fading first; opening slides it in with the labels after the panel |
| 27 | Micro Progress Button | 492 to 593 ms | 85 to 220 ms | 1 to 5 | 68 to 220 ms | The label turns into its progress: a ring fills inside the button, the label rolls to the next word, then a check scales in |
| 28 | Morphing Sidebar Controls | 501 to 684 ms | 100 to 150 ms | 2 to 8 | 33 to 284 ms | One panel morphs into another: the old content blurs and shrinks while the new grows in, the frame resizing in the middle |
| 29 | Navigation Controls | 729 to 1407 ms | 136 to 373 ms | 3 to 6 | 17 to 169 ms | A wide button presses (dips), then splits into back, dots and next; the dots slide as steps change; at the end the parts merge back into one button |
| 30 | Pagination | 868 to 1485 ms | 150 to 367 ms | 7 to 14 | 50 to 501 ms | The arrow presses, the page number rolls digit by digit, the arrows dim when at an end |
| 31 | Pin Item | 951 to 1034 ms | 100 to 133 ms | 2 to 3 | 567 to 634 ms | A row lifts and travels to a new group at the top, the rows it leaves close the gap and the rows below push down, all with a soft settle |
| 32 | Preview Slider | 508 to 695 ms | 68 to 356 ms | 4 to 6 | 17 to 119 ms | The thumb grows while held; a preview above scales with the value; on release the thumb settles with a small bounce |
| 33 | Progressive Input Stack | 767 to 833 ms | 533 to 567 ms | 4 | 17 to 583 ms | The field slides up into a stack and the next field rises in under it; the button morphs from Next to Done with its icon |
| 34 | Quick Feedback | 533 to 650 ms | 133 to 150 ms | 1 to 3 | 133 to 233 ms | The pressed thumb grows into a message pill; the other thumb fades; an undo action slides in after the message |
| 35 | Quick Option Picker | 250 to 450 ms | 67 to 200 ms | 1 to 5 | 0 to 50 ms | An option list grows out of a pill; picking one collapses the list back into the pill while the pill's label rolls to the pick |
| 36 | Quick Switcher | 417 to 551 ms | 50 to 167 ms | 4 to 8 | 0 to 17 ms | The leading icon turns into another icon (rotate and cross fade) while the placeholder rolls to the new mode |
| 37 | Range Selection Slider | 367 to 2369 ms | 83 to 651 ms | 2 to 36 | 17 to 284 ms | Two thumbs; the values in the fields below roll digit by digit as the thumbs move |
| 38 | Response Feedback | 683 to 1100 ms | 200 to 350 ms | 5 | 150 to 233 ms | The thumb glyph pops up out of its button, larger than rest, tilts, and drops back in; a soft glow fades behind it |
| 39 | Reversible Action | 934 to 984 ms | 133 to 200 ms | 3 to 4 | 551 to 667 ms | The button presses, then splits into the done state and an undo action that slides out from behind it |
| 40 | Ruler Picker | 780 to 1271 ms | 34 to 763 ms | 2 to 8 | 17 to 186 ms | The ruler scrolls under a fixed needle; the value above rolls digit by digit; ticks near the needle grow |
| 41 | Share Sheet | 2317 to 2883 ms | 1233 ms | 15 | 417 ms | A highlight row follows the pointer from row to row, sliding under the rows rather than jumping |
| 42 | Shuffle Pinned Item | 567 to 617 ms | 100 ms | 1 | 217 ms | A row travels to the pinned group at the top while the others close the gap |
| 43 | Slot Picker | 467 to 784 ms | 200 to 234 ms | 1 to 3 | 434 ms | A switch on a day grows that day's time rows below it, the days under it pushed down; rows fade in after the space opens |
| 44 | Split Actions | 750 to 817 ms | 17 to 383 ms | 2 to 4 | 67 to 533 ms | A round plus presses, blurs and splits into two labelled actions that slide apart; the reverse merges them |
| 45 | Split Button | 651 to 667 ms | 300 to 334 ms | 3 to 6 | 100 to 184 ms | A button fades and three segments grow in from its place with a back arrow first |
| 46 | Stateful Back Up | 328 to 517 ms | 86 to 172 ms | 1 to 5 | 34 ms | The label rolls up out of the button and a thin progress bar rolls in; done rolls a check and label in; back to idle rolls the other way |
| 47 | Stateful Button | 634 to 817 ms | 417 to 484 ms | 1 to 5 | 33 to 167 ms | The button dips (anticipation), the label fades out, a spinner or a percent rolls in at the same width, then a check pops |
| 48 | Status Picker | 345 to 500 ms | 172 to 241 ms | 1 to 6 | 0 to 190 ms | A status dot on an avatar grows into three status choices that fan out with overshoot, one after another |
| 49 | Status Progression | 300 ms | 150 ms | 3 | 17 ms | A status chip rolls its label and icon to the next status while its tint changes |
| 50 | Step Indicator | 1817 to 2733 ms | 517 to 1400 ms | 8 to 14 | 183 to 850 ms | The active step label slides to the next step on the track and its pill stretches as it travels, then settles |
| 51 | Step Pager | 334 to 901 ms | 83 to 133 ms | 1 to 5 | 0 to 33 ms | The arrow presses; the title rolls; the active dot slides and the icon above swaps with a pop |
| 52 | Switch Disclosure | 534 to 1034 ms | 67 to 167 ms | 2 | 217 to 567 ms | Turning a switch on opens a second option under it with a soft settle; its row rises in after the space |
| 53 | Tags | 450 to 567 ms | 283 to 333 ms | 2 to 9 | 17 to 100 ms | A tag flies from the pool to the selected row and the pool closes its gap; the selected row makes room with a slide |
| 54 | Transaction List | 667 to 984 ms | 100 to 133 ms | 1 to 3 | 367 to 567 ms | A detail card shrinks back into its row while the rest of the list rises in around it, top first |
| 55 | Tree Menu | 417 to 650 ms | 100 to 183 ms | 1 to 4 | 67 to 283 ms | A branch opens and its children slide down and fade in one after another; the chevron turns; siblings below are pushed down |
| 56 | Undo Send | 517 to 533 ms | 133 to 217 ms | 1 to 2 | 100 to 233 ms | The send arrow turns into a countdown ring with a number that rolls down each second; undo turns it back to the arrow |

### 1.2 bestdesignsonx.com, 15 video posts

The feed shows design posts with no text about their timing. Fifteen of the
newest video posts were measured the same way (the first 12 s of each).
Seven of them show a product interface; the others are illustration or
brand work and give no interface timing.

| # | Post | Main burst | Peak | Parts | Beats seen |
| --- | --- | --- | --- | --- | --- |
| 57 | File tree | 450 to 467 ms | 67 to 150 ms | 1 to 3 | A folder opens, its children slide down one after another, the row highlight follows the pointer |
| 58 | Top sources card | 317 to 1067 ms | 0 to 83 ms | 3 to 5 | The total rolls digit by digit as the view changes from list to bars to deltas; bars grow from the base one after another |
| 59 | Dashboard | 450 to 1167 ms | 50 to 1000 ms | 3 to 6 | A ring meter fills while its number counts up; cards change in place with a cross fade |
| 60 | Toggle with light | 517 to 850 ms | 100 to 600 ms | 1 to 7 | A big switch: the knob slides with a slight squash, the icon on it turns from sun to moon, a glow follows |
| 61 | Filter menu | 1200 to 1433 ms | 883 to 1067 ms | 1 to 3 | The menu drops out of the trigger and its rows appear in order; picking one closes the menu and rolls the trigger label |
| 62 | Battery widget | 817 to 850 ms | 400 to 467 ms | 3 to 4 | A pill grows from an icon; the value rolls |
| 63 | Photo grid | 325 to 725 ms | 33 to 350 ms | 7 to 13 | A photo grows from its tile to fill the view, the other tiles moving aside; close shrinks it back to the tile |

### 1.3 What the clips teach, as rules for this round

1. **Two or three beats, not one.** A response is a small sequence: a quick
   answer to the input (a dip, a press), then the change itself, then a
   settle. Clips 29, 39, 44 and 47 open with a dip of about 60 to 100 ms
   before the change.
2. **Overshoot is for things that land.** Marks, badges, popped chips, fanned
   items and new icons land past their rest and settle back (clips 1, 4, 12,
   13, 38, 48). Panels and text do not overshoot: they ease out (clips 7, 9,
   22).
3. **Stagger is short and capped.** Parts of one change start 30 to 60 ms
   apart (clips 1, 13, 15, 22, 25, 55), and a group of more than five or six
   shows the rest together. Exits do not stagger, or stagger less.
4. **Exits are faster than entrances.** Close takes about two thirds of open
   in every clip that shows both (clips 7, 9, 13, 25, 26).
5. **Secondary elements react.** When a value changes, the number rolls
   (clips 3, 30, 37, 40, 58); when a list changes, the rest of the list moves
   to close or open the gap (clips 31, 42, 53, 54); when a control opens,
   its icon turns (clips 1, 13, 55).
6. **The change never waits.** In every clip the new state is readable by the
   end of the first beat; the settle runs after it.
7. **Direct answers are short.** A press, a slide of an indicator and a swap
   run 150 to 330 ms; announcements (a panel, a morph, a stack) run 450 to
   1000 ms including the settle.
8. **What the system cannot take.** Many clips blur during a move (clips 5,
   17, 28, 35, 44) or change size (clips 9, 22, 27, 33). Those need a rule
   change and are listed in section 6.

## 2. The foundation (committed before any family work)

Commits `185ea37` (foundation), `fc23d92` (review fixes in the style packs
and the pop pattern), `a1c15d3` (readable stagger), `1e10976` (stage only
mode and recorder), `d34b4cd` (lead changes after the families).

### 2.1 Token additions (all proposed)

Base values in `packages/tokens/src/base/motion.json` and `scale.json`, every
name added to `packages/tokens/src/contract.json`, and every style and scheme
filled in `packages/styles/<id>/tokens.<scheme>.json`. The token snapshots
are updated. Reduced motion zeroes every new duration and delay (the token
build's media block, and the gallery's `data-motion="reduce"` block).

| Token | Type | Neutral (base) | Desk | Studio | Use |
| --- | --- | --- | --- | --- | --- |
| `ease.spring-soft` | string, `linear()` | critically damped, no overshoot | 2% overshoot | `cubic-bezier(0, 0, 0.2, 1)` | reveals, panels, text |
| `ease.spring-snappy` | string, `linear()` | 1.5% overshoot | 11% overshoot | `steps(2, jump-end)` | presses, toggles, indicators |
| `ease.spring-bouncy` | string, `linear()` | 6% overshoot | 25% overshoot | `steps(3, jump-end)` | marks, badges, popovers that land |
| `duration.spring-soft` | duration | 220ms | 340ms | 100ms | settle time of the soft spring |
| `duration.spring-snappy` | duration | 180ms | 300ms | 80ms | settle time of the snappy spring |
| `duration.spring-bouncy` | duration | 220ms | 440ms | 120ms | settle time of the bouncy spring |
| `duration.morph` | duration | 200ms | 320ms | 100ms | one beat of an icon or button morph |
| `duration.celebrate` | duration | 220ms | 480ms | 120ms | the one time completion beat |
| `delay.stagger` | duration | 24ms | 45ms | 0ms | step between staggered parts |
| `spring.soft`, `spring.snappy`, `spring.bouncy` | stiffness, damping, mass | 1176/68.6, 1623/64.5, 980/41.3 | 459/33.4, 937/35.5, 733/21.7 | 5521/148.6, 8809/187.7, 2201/84.4 | the springs behind each curve, for native |
| `scale.pop` | number | 1.05 | 1.14 | 1 | peak of a landing mark |
| `scale.stretch` | number | 1.15 | 1.3 | 1.08 | thumb and indicator stretch (round 1 request) |
| `scale.lift` | number | 1.01 | 1.03 | 1 | card lift (round 1 request) |
| `scale.anticipate` | number | 0.95 | 0.9 | 0.97 | the dip before an action |
| `scale.enter` | number | 0.97 | 0.9 | 1 | start scale of entering content |
| `scale.morph` | number | 0.5 | 0.3 | 0.8 | where a leaving glyph shrinks to |
| `distance.nudge` | dimension | 2px | 3px | 1px | hover nudge of an arrow or chevron |
| `distance.shift` | dimension | 4px | 6px | 2px | label, helper and error slides |
| `distance.enter` | dimension | 6px | 12px | 4px | overlay content travel |
| `distance.lift` | dimension | 2px | 4px | 0px | card and tile lift |

Each `linear()` curve is sampled (20 stops) from its style's spring tokens;
`packages/motion/src/springs.test.ts` fails if a curve and its spring drift
apart, if a settle time is off by more than 5ms, if Desk's bouncy spring
overshoots less than 20%, Neutral's more than 8% or Studio's at all, or if a
Neutral spring leaves 150 to 220ms. A `linear()` curve may pass 1, so a CSS
transition on `transform` overshoots and settles on its own.

### 2.2 Primitives in `packages/motion` (all proposed)

`packages/motion/src/primitives.ts`, one file each in `primitives/`, tests in
`primitives.test.ts` (jsdom). Each moves only transform and opacity, reads
its timing from the live tokens, takes the style's mode (`full`, `reduced`,
`none`, from `useMotion().mode(id)`) and the person's reduced motion, plays
the way between two rest looks the component CSS draws (fill none, so a
cancel leaves the part at rest), and survives a second trigger by starting
from the drawn position.

| Primitive | What it plays | Reduced form |
| --- | --- | --- |
| `flipSnapshot` / `flipPlay` / `flipExit` | FLIP move for add, remove and reorder; `stretch` for a sliding indicator; `scale` for a zoom from a thumbnail | no travel; new items fade |
| `staggerGroup` | parts that arrive one `delay.stagger` apart and leave all at once, faster | a fade with no delay |
| `iconMorph`, `iconTurn`, `iconParts` | glyph to glyph from parts that turn, shrink and cross fade; a glyph that turns; parts that settle in order | a cross fade |
| `renderDigits` / `rollDigits` | digit by digit roll in an `aria-hidden` host, last digit first, with tabular figures | the changed digits fade |
| `buttonMorph` | idle, loading, success, error as one morph: dip, label out, spinner in, check turns in with overshoot, one swell; error shakes once | a cross fade, the button still |

**Readable text (lead finding during the round).** The full React contract
suite failed List axe contrast in Desk because rows sat at low opacity mid
stagger. Every stagger now fits its delays in a 120ms budget at the live
`delay.stagger` (`stepsWithin`: 5 steps in Neutral, 2 in Desk, any in
Studio) and every entering part is at full opacity by 30% of its run
(`readableEnter`, `READABLE_AT`), the transform carrying the rest. The round
1 `list-stagger` pattern follows the same rule (3 steps of `delay.stagger`,
opaque at 30%). Every family applied it to its own CSS staggers.
`npm run contract -- --framework react --component List` is green in Studio,
Desk and Neutral.

### 2.3 Gallery

`/interactions` groups the 96 interactions by the six families, with a
reduced motion switch (`data-motion="reduce"` on `<html>`), a replay control
per card (mounts the stage again and presses its trigger) and one for every
stage, and the beats and per style notes of each row. Stage only mode
`/interactions?focus=<id>` shows one stage centred and zoomed to fit the frame
(at most 2.5 times) with a pointer dot, for recording. Stages live in
`apps/gallery-react/src/interactions/<family>.tsx`.

## 3. Every interaction: beats and timings per style

Generated from the registry (`packages/motion/src/interactions/`), so it
matches the gallery. 96 rows, 94 of them new or reworked in round 2. Each
row gives the trigger, the beats (anticipation, action, overshoot and
settle, secondary, exit), what a rapid second trigger does, the reduced form
and how each style plays it. The family agents' notes, tests and per
component detail are in the lane reports:
[actions](lanes/interactions-2-actions.md),
[inputs](lanes/interactions-2-inputs.md),
[selection](lanes/interactions-2-selection.md),
[overlays](lanes/interactions-2-overlays.md),
[navigation](lanes/interactions-2-navigation.md),
[feedback](lanes/interactions-2-feedback.md).

### Actions and toggles (11)

**`button-press`** (Button, IconButton, ToggleButton, CopyButton, CloseButton, FloatingActionButton; pattern press, CSS; round 2; proposed)

- Trigger: Pointer down on the control, or Space or Enter held down while it has focus, then the release.
- Anticipation: the control dips to scale.press (0.97) over duration.instant on ease.out (Neutral and Desk 70ms, Studio 70ms) while it is held.
- Action: the click runs on release, at once; nothing waits for the motion.
- Overshoot and settle: the control springs back on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms passing rest by 6% of the dip, Desk 440ms passing it by 25%, Studio 120ms in three steps).
- A rapid second press starts from wherever the spring is: the transition picks up the live value.
- Styles: Neutral: a short dip and a quiet settle; Studio: a short dip and a release in three hard steps; Desk: a long release that passes rest and swings back
- Reduced: No scale. The pressed color carries the state.
- Clip and sheets: `actions.<style>.webm`, `sheets/button-press.<style>.png`

**`segment-press`** (ButtonGroup, SplitButton; pattern press, CSS; round 2; proposed)

- Trigger: Pointer down or Space held on one segment of an attached ButtonGroup, or on either half of a SplitButton, then the release.
- Anticipation: the parts of the pressed segment dip to scale.anticipate (Neutral 0.95, Desk 0.9, Studio 0.97) on ease.spring-snappy over duration.spring-snappy.
- Action: the click runs on release, at once.
- Settle: the parts spring back on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing rest by 10%, Studio 80ms in two steps). The box, the seam and the neighbor stay still.
- Styles: Neutral: a small dip and a quiet return; Studio: the parts shrink a hair and snap back in two steps; Desk: a deep dip that swings back past rest
- Reduced: No dip. The pressed color carries the state.
- Clip and sheets: `actions.<style>.webm`, `sheets/segment-press.<style>.png`

**`button-loading`** (Button, IconButton, FloatingActionButton, SplitButton; primitive button-morph, pattern swap, WAAPI; round 2; proposed)

- Trigger: The loading prop turns on when an action starts, and off when it ends.
- Anticipation: the button dips to scale.anticipate and springs back on ease.spring-snappy over duration.spring-snappy.
- Action: the label (or the icon of an icon only button) rolls up and out by distance.shift over duration.quick on ease.exit.
- Overshoot: one delay.stagger step later the spinner grows in from scale.morph on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms passing its size by 25%, Studio 120ms in three steps).
- Back to idle: the spinner shrinks to scale.morph and fades over duration.quick; one stagger step later the label rolls back in from above on ease.spring-soft over duration.spring-soft. The leaving spinner stays only for its exit and rests at opacity 0.
- Styles: Neutral: a light dip and a short roll; Studio: parts cut in and out together in steps, no dip to speak of; Desk: a deep dip, a long roll and a spinner that swells past its size
- Reduced: The label and the spinner cross fade over duration.base. The button does not move.
- Clip and sheets: `actions.<style>.webm`, `sheets/button-loading.<style>.png`

**`copy-swap`** (CopyButton; primitive button-morph, pattern swap, WAAPI; round 2; proposed)

- Trigger: A copy succeeds or fails, and the result ends after delay.feedback.
- Action: the copy icon rolls up and out by distance.shift over duration.quick on ease.exit.
- Overshoot: one delay.stagger step later the check turns in from minus 45 degrees and scale.morph, passing its size on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms by 6%, Desk 440ms by 25%, Studio 120ms in three steps).
- Secondary: the button swells to scale.pop and back over duration.celebrate on ease.out (Neutral 1.05 over 220ms, Desk 1.14 over 480ms, Studio none). After a failure the warning pops in the same way and the button shakes once along the inline axis by distance.nudge instead.
- Back to idle: the result glyph rolls down and out, and one stagger step later the copy icon rolls in from above on ease.spring-soft over duration.spring-soft.
- Styles: Neutral: a short turn and a light swell; Studio: the glyphs cut over in steps, no swell; Desk: a long turn of the check past its size and a full swell
- Reduced: The old icon fades out while the new one fades in, over duration.base. The button does not move.
- Clip and sheets: `actions.<style>.webm`, `sheets/copy-swap.<style>.png`

**`button-nudge`** (Button; pattern press, CSS; round 2; proposed)

- Trigger: The pointer rests on a button with an end icon, or the keyboard focuses it.
- Action: the end part moves distance.nudge (Neutral 2px, Desk 3px, Studio 1px) toward the inline end on ease.spring-snappy over duration.spring-snappy.
- Overshoot and settle: it passes the mark by the spring overshoot (Desk 10%) and settles; leaving plays the same spring back.
- Styles: Neutral: a two pixel nudge; Studio: a one pixel step; Desk: a three pixel nudge that swings
- Reduced: The end part stays still. The hover color carries the state.
- Clip and sheets: `actions.<style>.webm`, `sheets/button-nudge.<style>.png`

**`close-turn`** (CloseButton; pattern press, CSS; round 2; proposed)

- Trigger: The pointer rests on a close button, or the keyboard focuses it.
- Action: the glyph turns a quarter turn on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps).
- Overshoot and settle: it passes the quarter turn by the spring overshoot (Desk 10%, Neutral 1.5%) and settles square.
- With the press: pointer down dips the whole button (button-press).
- Styles: Neutral: a short quiet turn; Studio: a two step turn; Desk: a turn that swings past square and back
- Reduced: The glyph does not turn. The hover fill carries the state.
- Clip and sheets: `actions.<style>.webm`, `sheets/close-turn.<style>.png`

**`split-chevron`** (SplitButton; pattern menu-scale, CSS; round 2; proposed)

- Trigger: The menu of a SplitButton opens or closes, or the pointer rests on its closed trigger.
- Anticipation: on hover the chevron drops distance.nudge toward the menu on ease.spring-snappy.
- Action: on open it turns half a turn on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps) while the menu scales in from the trigger (menu-scale).
- Overshoot and settle: it passes the half turn by the spring overshoot (Desk 10%) and settles pointing up. Close turns it back the same way.
- Styles: Neutral: a short flip with almost no swing; Studio: a two step flip; Desk: a flip that swings past and back
- Reduced: The chevron points up at once and does not drop on hover.
- Clip and sheets: `actions.<style>.webm`, `sheets/split-chevron.<style>.png`

**`fab-morph`** (FloatingActionButton; pattern swap, CSS; round 2; proposed)

- Trigger: A floating action button with a plus icon opens a menu or a popover (aria-expanded), or its extended label appears.
- Action: on open the plus turns an eighth of a turn on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps), with the press of the button before it (button-press).
- Overshoot and settle: it passes the eighth by the spring overshoot (Desk 10%) and settles as a close mark.
- Extended label: it slides from distance.shift behind the icon to rest on ease.spring-snappy and fades in over duration.fast.
- Styles: Neutral: a short turn and a short slide; Studio: a two step turn and a short cut in; Desk: a turn that swings and a long slide
- Reduced: The plus shows as a close mark at once; the label shows at once.
- Clip and sheets: `actions.<style>.webm`, `sheets/fab-morph.<style>.png`

**`toggle-pop`** (ToggleButton; pattern pop, WAAPI; round 2; proposed)

- Trigger: The person turns a ToggleButton on or off with the pointer, Space or Enter.
- Anticipation: the press dips the button (button-press) or, in an attached group, its parts (segment-press).
- Action: aria-pressed, data-state, the fill and the ring change at once on release.
- Overshoot and settle on: each part grows to scale.pop and back over duration.celebrate on ease.out (Neutral 1.05 over 220ms, Desk 1.14 over 480ms), one delay.stagger step apart (Neutral 24ms, Desk 45ms).
- Off: each part sinks from scale.anticipate to rest on ease.spring-soft over duration.spring-soft.
- Styles: Neutral: a small pop; Studio: no pop: the fill and the ring land in place; Desk: a full pop that swells the content and a staggered settle
- Reduced: No pop. The on fill and the ring carry the state.
- Clip and sheets: `actions.<style>.webm`, `sheets/toggle-pop.<style>.png`

**`switch-stretch`** (Switch; pattern press, CSS; round 2; proposed)

- Trigger: The person presses the switch with the pointer or Space, then releases it to toggle.
- Anticipation: the thumb stretches to scale.stretch toward its travel (Neutral 1.15, Desk 1.3, Studio 1.08) and the track dips to scale.press, both over duration.instant on ease.out, while held.
- Action: on release the state changes at once and the thumb travels on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms passing its end by 6%, Desk 440ms by 25%, Studio 120ms in three steps).
- Settle: the stretch and the track spring back to rest on the same spring.
- Secondary: the on tint fades in and grows from scale.morph at the inline start to the full track on ease.spring-soft over duration.spring-soft; turning off fades and shrinks it back toward the start.
- Styles: Neutral: a short stretch and a travel with a small swing; Studio: a short stretch and a travel in three hard steps; Desk: a long stretch, a thumb that swings past its end, a tint that sweeps in
- Reduced: The thumb jumps to the other side and does not stretch; the track does not dip; the tint shows at once.
- Clip and sheets: `actions.<style>.webm`, `sheets/switch-stretch.<style>.png`

**`link-underline`** (Link; pattern chart-draw, CSS; round 2; proposed)

- Trigger: The pointer rests on a standalone link, or the keyboard focuses it; the pointer rests on an external link.
- Action: the line scales from 0 to the label width with its origin at the inline start over duration.morph on ease.out (Neutral 200ms, Desk 320ms, Studio 100ms).
- Exit: it scales back to 0 with its origin at the inline end over duration.quick on ease.exit, about two thirds of the draw.
- Secondary: the external icon moves distance.nudge up and toward the inline end on ease.spring-snappy over duration.spring-snappy.
- Styles: Neutral: a short draw; Studio: a quick draw; Desk: a long draw and a swinging icon
- Reduced: The line shows and goes at once; the icon stays still.
- Clip and sheets: `actions.<style>.webm`, `sheets/link-underline.<style>.png`


### Text inputs and forms (21)

**`focus-glow`** (Input, PasswordField, OTPField, NumberField, SearchField, Textarea, PhoneField, ScrubInput; pattern fade, CSS; round 2; proposed)

- Trigger: The field takes focus, or loses it.
- Action, at once: the 2px ring and the focus border show on the first frame (WCAG 2.4.7). The ring is never on a layer that fades or scales.
- Layer: the glow fades in and grows from scale.enter (Neutral 0.97, Desk 0.9, Studio 1) on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms with a 1% settle, Studio 100ms on a plain curve).
- Exit: the glow fades and shrinks over duration.quick (100ms) on ease.exit, faster than it came.
- Styles: Neutral: a short soft grow from 97%; Studio: ring and glow at once, no growth; Desk: the glow blooms from 90% and settles
- Reduced: The ring and the glow show at once and do not grow (every duration token is 0ms, the start scale is 1).
- Clip and sheets: `inputs.<style>.webm`, `sheets/focus-glow.<style>.png`

**`error-shake`** (Input, PasswordField, OTPField, NumberField; pattern shake, WAAPI; round 2; proposed)

- Trigger: The field turns invalid (the invalid prop, or the Field, turns on), or the browser refuses a submit for it.
- Action: the box swings distance.shift toward the inline end (Neutral 4px, Desk 6px), then back about two thirds of it.
- Settle: two smaller swings, distance.nudge and half of it, then rest, all inside duration.spring-bouncy (Neutral 220ms, Desk 440ms) on ease.out. RTL swings the other way first.
- Secondary: the Field error slides in under the control on the same frame (field-error-enter).
- Styles: Neutral: a short swing that settles in 220ms; Studio: none: the error color and message carry it; Desk: a wide swing with a long settle
- Reduced: No motion. The error color and the Field message carry the state.
- Clip and sheets: `inputs.<style>.webm`, `sheets/error-shake.<style>.png`

**`field-label-focus`** (Field, Label; pattern fade-rise, CSS; round 2; proposed)

- Trigger: Focus enters the control of a Field, or leaves it.
- Action: the label rises distance.nudge (Neutral 2px, Desk 3px, Studio 1px) on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with about 10% overshoot, Studio 80ms in two steps).
- Settle: it rests there while focus stays; on blur it returns on the same spring. A disabled or read only Field does not move.
- Styles: Neutral: a 2px rise in 180ms; Studio: one pixel, in two steps; Desk: a small rise that overshoots and settles
- Reduced: The label does not move.
- Clip and sheets: `inputs.<style>.webm`, `sheets/field-label-focus.<style>.png`

**`field-message-enter`** (Field; pattern fade-rise, WAAPI; round 2; proposed)

- Trigger: A FieldDescription renders after the Field first painted (a hint that appears).
- Action: from distance.shift above (Neutral 4px, Desk 6px, Studio 2px), opacity 0 to 1, on ease.spring-soft over duration.spring-soft (220ms, 340ms, 100ms). Text never overshoots.
- Styles: Neutral: a 4px slide in 220ms; Studio: a 2px fade; Desk: a soft 6px slide
- Reduced: The description fades in.
- Clip and sheets: `inputs.<style>.webm`, `sheets/field-message-enter.<style>.png`

**`field-error-enter`** (FieldError, Field, Fieldset, ConsentField; pattern fade-rise, WAAPI; round 2; proposed)

- Trigger: An error message renders after its Field first painted, for example after a submit or a check.
- Action: the message slides from distance.shift above and fades in, ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms, Studio 100ms).
- Overshoot: after delay.stagger (24ms, 45ms, 0ms) the danger icon grows from scale.morph (0.5, 0.3, 0.8) on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms landing about 25% past, 120ms in three steps).
- Secondary: the control shakes once (error-shake).
- Styles: Neutral: a 4px slide, a small icon pop; Studio: a short fade, the icon steps in; Desk: the icon lands big and settles
- Reduced: The message fades in; the icon does not move.
- Clip and sheets: `inputs.<style>.webm`, `sheets/field-error-enter.<style>.png`

**`password-reveal`** (PasswordField; primitive icon-morph, pattern swap, WAAPI; round 2; proposed)

- Trigger: A press on the show or hide toggle.
- Action: the type changes on the press; the old glyph turns 90 degrees and shrinks to scale.morph while it fades, over duration.morph (Neutral 200ms, Desk 320ms, Studio 100ms) on ease.exit.
- Overshoot: the new glyph turns in from the other side and lands on ease.spring-bouncy (220ms, 440ms, 120ms). Hiding turns the other way.
- Secondary: the field text fades back in over duration.base.
- Styles: Neutral: a quick turn with a small land; Studio: a hard cut in steps; Desk: a wide turn and a big land
- Reduced: The glyphs and the text cross fade, with no turn.
- Clip and sheets: `inputs.<style>.webm`, `sheets/password-reveal.<style>.png`

**`search-clear`** (SearchField; primitive icon-morph, pattern pop, WAAPI; round 2; proposed)

- Trigger: The box gets its first character (the clear button appears) or is cleared (it goes).
- In: rotate from minus 90 degrees and scale.morph, opacity in over the first 40%, on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms, 120ms).
- Out: the copy turns 90 degrees and shrinks to scale.morph while it fades, duration.morph on ease.exit, then it is removed.
- Styles: Neutral: a quick turn in 220ms; Studio: steps in, cuts out; Desk: spins in with a big land
- Reduced: The glyph fades in; the copy fades out.
- Clip and sheets: `inputs.<style>.webm`, `sheets/search-clear.<style>.png`

**`search-submit`** (SearchField; pattern press, WAAPI; round 2; proposed)

- Trigger: Enter in the box (onSubmit).
- Anticipation: the glyph dips to scale.anticipate (0.95, 0.9, 0.97) and turns 12 degrees over the first quarter on ease.out.
- Overshoot and settle: it springs back on ease.spring-bouncy, the rest of duration.spring-bouncy (220ms, 440ms, 120ms).
- Styles: Neutral: a small dip in 220ms; Studio: a 3% dip in steps; Desk: a deep dip and a bounce
- Reduced: No motion.
- Clip and sheets: `inputs.<style>.webm`, `sheets/search-submit.<style>.png`

**`otp-fill`** (OTPField; pattern pop, WAAPI; round 2; proposed)

- Trigger: A character is typed, pasted or filled into a cell.
- One character: from scale.morph and transparent, on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms landing about 25% past, Studio 120ms in steps).
- A run (paste, SMS): every new character on ease.spring-snappy over duration.spring-snappy, starts spread evenly over two delay.stagger steps: Neutral ends by about 230ms, Desk by 390ms, Studio together in 80ms.
- Secondary: the caret moves to the next cell (otp-caret).
- Styles: Neutral: a small land; a paste in about 230ms; Studio: characters step in together; Desk: each lands big; a paste ripples
- Reduced: The characters fade in.
- Clip and sheets: `inputs.<style>.webm`, `sheets/otp-fill.<style>.png`

**`otp-caret`** (OTPField; pattern fade-rise, CSS; round 2; proposed)

- Trigger: Focus enters the field, or the active cell moves on to an empty cell.
- Action: the bar slides distance.shift (4px, 6px, 2px) from the left and fades in on ease.spring-snappy over duration.spring-snappy (180ms, 300ms with overshoot, 80ms in steps).
- Styles: Neutral: a 4px slide in 180ms; Studio: a short step; Desk: slides on and settles
- Reduced: The caret shows at once in its cell.
- Clip and sheets: `inputs.<style>.webm`, `sheets/otp-caret.<style>.png`

**`otp-complete`** (OTPField; pattern list-stagger, WAAPI; round 2; proposed)

- Trigger: The code turns full (typed to the end, pasted or filled), and the field is not invalid.
- Action: each cell rises distance.lift (Neutral 2px, Desk 4px, Studio 0px) over the first third on ease.out, then settles on ease.spring-soft, inside duration.celebrate (220ms, 480ms, 120ms).
- Stagger: the starts spread over two delay.stagger steps in all (48ms, 90ms, 0ms).
- Styles: Neutral: a 2px wave in about 270ms; Studio: none (distance.lift is 0); Desk: a 4px wave
- Reduced: No motion.
- Clip and sheets: `inputs.<style>.webm`, `sheets/otp-complete.<style>.png`

**`field-step`** (NumberField; primitive digit-roll, pattern number-roll, WAAPI; round 2; proposed)

- Trigger: A press on the increment or decrement button, or ArrowUp, ArrowDown, PageUp or PageDown. Typing does not roll.
- Action: each changed digit rolls a full line in its own clipped column on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with about 10% overshoot, Studio 80ms in two steps).
- Stagger: columns start one delay.stagger apart from the last digit (24ms, 45ms, 0ms), at most six.
- Settle: the layer empties when the roll ends; the input text shows again.
- Styles: Neutral: a quick roll in 180ms; Studio: digits fade in place (preset reduced); Desk: an odometer roll with overshoot
- Reduced: The new digits fade in, with no travel.
- Clip and sheets: `inputs.<style>.webm`, `sheets/field-step.<style>.png`

**`scrub-roll`** (ScrubInput; primitive digit-roll, pattern number-roll, WAAPI; round 2; proposed)

- Trigger: A drag on the scrub handle, or ArrowUp and ArrowDown, changes the value. Typing does not roll.
- Action: each change rolls the changed digits on ease.spring-snappy over duration.spring-snappy; a change while a roll plays rolls on from the digits as drawn.
- Secondary: the handle grows to scale.pop (1.05, 1.14, 1) on ease.spring-bouncy over duration.spring-bouncy while the drag runs, and settles back on release.
- Styles: Neutral: a quick roll, a small swell; Studio: digits change in steps, the handle stays; Desk: a rolling counter, the handle swells
- Reduced: The digits fade in; the handle does not grow.
- Clip and sheets: `inputs.<style>.webm`, `sheets/scrub-roll.<style>.png`

**`inline-edit-morph`** (InlineEdit; primitive icon-morph, pattern swap, WAAPI; round 2; proposed)

- Trigger: Editing starts (press, Enter or Space), or ends with save or cancel.
- Action: the old glyph turns 90 degrees and shrinks to scale.morph over duration.morph on ease.exit.
- Overshoot: the new glyph turns in and lands past full size on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms, 120ms).
- Stagger: the cancel glyph lands one delay.stagger after the check.
- Styles: Neutral: a quick turn in about 220ms; Studio: glyphs step in together; Desk: a wide turn with a big land
- Reduced: The glyphs cross fade.
- Clip and sheets: `inputs.<style>.webm`, `sheets/inline-edit-morph.<style>.png`

**`form-summary-enter`** (Form; primitive stagger, pattern list-stagger, WAAPI; round 2; proposed)

- Trigger: A submit finds errors and the summary shows them.
- Action: each row slides from distance.shift at the inline start and fades in on ease.spring-soft over duration.spring-soft, one delay.stagger apart, at most six steps.
- Styles: Neutral: a short ripple; Studio: rows land together; Desk: rows ripple in
- Reduced: The rows fade in together.
- Clip and sheets: `inputs.<style>.webm`, `sheets/form-summary-enter.<style>.png`

**`form-submit-success`** (Form; pattern pop, WAAPI; round 2; proposed)

- Trigger: A submit passes every check and the form turns submitted.
- Action: each button grows to scale.pop (1.05, 1.14, 1) over the first third on ease.out, then springs back on ease.spring-bouncy, inside duration.celebrate (220ms, 480ms, 120ms).
- Stagger: the starts spread over two delay.stagger steps in all.
- Styles: Neutral: a small pop; Studio: none (scale.pop is 1); Desk: a big happy bounce
- Reduced: No motion. The status message says the form was sent.
- Clip and sheets: `inputs.<style>.webm`, `sheets/form-submit-success.<style>.png`

**`wizard-step`** (FormWizard; pattern fade-rise, WAAPI; round 2; proposed)

- Trigger: The current step changes: next, back, or a step picked in the Stepper.
- Exit: the old step travels distance.enter (Neutral 6px, Desk 12px, Studio 4px) toward the start and fades over duration.quick (100ms) on ease.exit.
- Action: the new step comes from distance.enter at the end and fades in on ease.spring-soft over duration.spring-soft (220ms, 340ms, 100ms).
- Secondary: the completed mark lands its check from scale.morph on ease.spring-bouncy; the current mark answers through Stepper (its own interaction).
- Styles: Neutral: a 6px slide in 220ms; Studio: a short slide, marks step; Desk: a wide slide, marks bounce
- Reduced: The steps cross fade, with no travel; the marks do not move.
- Clip and sheets: `inputs.<style>.webm`, `sheets/wizard-step.<style>.png`

**`wizard-done`** (FormWizard; pattern list-stagger, WAAPI; round 2; proposed)

- Trigger: The wizard form is sent (state done).
- Action: each mark dips to scale.anticipate and springs back past rest on ease.spring-bouncy over duration.spring-bouncy, the starts spread over two delay.stagger steps.
- Styles: Neutral: a small quick wave; Studio: a 3% dip in steps; Desk: a bouncing wave
- Reduced: No motion.
- Clip and sheets: `inputs.<style>.webm`, `sheets/wizard-done.<style>.png`

**`consent-check`** (ConsentField; pattern pop, WAAPI; round 2; proposed)

- Trigger: The person gives the consent (the box turns checked).
- Anticipation: the Checkbox box dips on press (its own motion).
- Action: the mark wipes in from the inline start (Checkbox check-draw).
- Overshoot: at the same time the mark grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms landing about 25% past, 120ms in steps).
- Styles: Neutral: a small pop in 220ms; Studio: the mark steps in; Desk: the mark lands big and settles
- Reduced: No pop. The mark shows as the Checkbox draws it.
- Clip and sheets: `inputs.<style>.webm`, `sheets/consent-check.<style>.png`

**`rating-fill`** (Rating; pattern pop, WAAPI; round 2; proposed)

- Trigger: The person picks a score by click, an arrow key, Home or End.
- Action: each new star grows from scale.morph and fades in over the first third, on ease.spring-snappy (Neutral 180ms, Desk 300ms).
- Overshoot: the chosen star on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms landing about 25% past, 120ms in steps).
- Stagger: starts spread over two delay.stagger steps in all, so Neutral ends by about 270ms whatever the run.
- Styles: Neutral: a short run; Studio: stars step in together; Desk: a bouncy run to the pick
- Reduced: The new stars fade in; stars that empty change at once.
- Clip and sheets: `inputs.<style>.webm`, `sheets/rating-fill.<style>.png`

**`rating-preview`** (Rating; pattern pop, CSS; round 2; proposed)

- Trigger: The pointer moves over a star (the hover preview).
- Anticipation and overshoot: from scale.anticipate (0.95, 0.9, 0.97) back to rest on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms, 120ms).
- Stagger: delay.stagger for the star before the pointer, two for the star under it.
- Styles: Neutral: a small dip in 220ms; Studio: a 3% dip in steps, no stagger; Desk: a deep dip and a bounce toward the pointer
- Reduced: The preview color changes at once with no dip.
- Clip and sheets: `inputs.<style>.webm`, `sheets/rating-preview.<style>.png`


### Selection controls and lists (14)

**`check-draw`** (Checkbox, CheckboxGroup; pattern fade, CSS; round 2; proposed)

- Trigger: The person presses and checks a box, or it turns indeterminate, by click, Space or a click on its label; or presses select all in a CheckboxGroup.
- Anticipation: the box dips to scale.anticipate over duration.instant on ease.out while pressed (Neutral 0.95, Desk 0.9, Studio 0.97; 70ms).
- Action: the fill shows at once on release; the clip slides in from the inline start while the mark slides the other way, on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in steps).
- Overshoot: the mark grows from scale.morph (Neutral 0.5, Desk 0.3, Studio 0.8) past its size with the overshoot of the bouncy spring; the box springs back from the dip past its size on the same spring.
- Settle: both settle by the end of duration.spring-bouncy.
- Stagger: under CheckboxGroup select all, box n waits n delay.stagger (Neutral 24ms, Desk 45ms, Studio 0ms), capped at three.
- Exit: unchecking fades the mark over duration.fast (80ms) on ease.out, then the clip jumps back with step timing.
- Styles: Neutral: restrained dip and a small land in 220ms; Studio: a flat cut in steps, no cascade; Desk: deep dip, a long bouncy land with a clear overshoot, a visible cascade
- Reduced: The mark appears and leaves at once with the fill; the box does not dip.
- Clip and sheets: `selection.<style>.webm`, `sheets/check-draw.<style>.png`

**`radio-pop`** (RadioGroup; pattern pop, CSS; round 2; proposed)

- Trigger: The person presses and picks an option, by click, Space, an arrow key or a click on its label.
- Anticipation: the circle dips to scale.anticipate over duration.instant on ease.out while pressed.
- Action and overshoot: the new dot grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in steps) and lands past its size.
- Secondary: the old dot shrinks to scale.morph and fades over duration.quick (100ms) on ease.exit.
- Settle: the circle springs back from the dip on the bouncy spring.
- Styles: Neutral: a small pop in 220ms; Studio: a flat cut in steps; Desk: a deep dip and a long pop
- Reduced: The dot appears at once; the circle does not dip.
- Clip and sheets: `selection.<style>.webm`, `sheets/radio-pop.<style>.png`

**`radio-card-lift`** (RadioCard; pattern press, CSS; round 2; proposed)

- Trigger: The person presses and picks a card, by click, Space or an arrow key.
- Anticipation: the card dips to scale.press (0.97) over duration.instant on ease.out while pressed.
- Action and overshoot: the chosen card rises by distance.lift (Neutral 2px, Desk 4px, Studio 0) on ease.spring-bouncy over duration.spring-bouncy, past its place and back.
- Secondary: its dot grows from scale.morph on the bouncy spring; the old dot shrinks over duration.quick on ease.exit; the card it leaves settles down on ease.spring-soft over duration.spring-soft.
- Styles: Neutral: a 2px lift; Studio: no lift, the dot cuts in; Desk: a 4px lift with a bounce
- Reduced: No lift and no dip; the dot appears at once. Border and fill carry the choice.
- Clip and sheets: `selection.<style>.webm`, `sheets/radio-card-lift.<style>.png`

**`slider-pull`** (Slider, RangeSlider; pattern press, CSS; round 2; proposed)

- Trigger: Hold a slider thumb, or the track, with a pointer, and let go.
- Action: the thumb grows to scale.stretch (Neutral 1.15, Desk 1.3, Studio 1.08) on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms).
- Release and overshoot: it returns on ease.spring-bouncy over duration.spring-bouncy (220, 440, 120ms) and dips under its size before it settles.
- Styles: Neutral: a small lift; Studio: a small lift in steps; Desk: a large lift and a bouncy release
- Reduced: No motion: the thumb keeps its size; the grab cursor and the focus ring carry the state.
- Clip and sheets: `selection.<style>.webm`, `sheets/slider-pull.<style>.png`

**`slider-bubble`** (Slider, RangeSlider; primitive digit-roll, pattern number-roll, WAAPI; round 2; proposed)

- Trigger: Hold a slider thumb with a pointer and move it.
- Action and overshoot: the bubble rises from distance.enter and grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy (220, 440, 120ms), past its size and back.
- Secondary: each changed digit rolls in its own column on the snappy spring (180, 300, 80ms), columns one delay.stagger apart from the last digit.
- Exit: on release it shrinks and fades over duration.quick (100ms) on ease.exit.
- Styles: Neutral: a short rise and roll; Studio: digits flip in hard cuts; Desk: a tall bouncy rise, digits ripple
- Reduced: The bubble shows at once, without travel; the digits change in place with a fade.
- Clip and sheets: `selection.<style>.webm`, `sheets/slider-bubble.<style>.png`

**`slider-nudge`** (Slider, RangeSlider; pattern shake, WAAPI; round 1; proposed)

- Trigger: A key or a drag pushes a thumb past the minimum or the maximum of a horizontal slider.
- Feedback: The thumb nudges space.3xs toward that end and back once (shake, one swing, toward) over duration.base on ease.out, added on top of the lift. A held key nudges once; a drag nudges once each time it goes past the end.
- Reduced: No motion: the value stays at its end.
- Clip and sheets: `selection.<style>.webm`, `sheets/slider-nudge.<style>.png`

**`picker-chevron-turn`** (Select, Combobox, MultiSelect; pattern swap, CSS; round 2; proposed)

- Trigger: The list of a picker opens or closes.
- Action and overshoot: the icon turns to 180deg on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in steps), a little past and back.
- Styles: Neutral: a quick turn; Studio: a cut in steps; Desk: a longer turn with a small overshoot
- Reduced: The icon turns at once.
- Clip and sheets: `selection.<style>.webm`, `sheets/picker-chevron-turn.<style>.png`

**`menu-rows`** (Select, Combobox, Autocomplete, MultiSelect, TagField; primitive stagger, pattern list-stagger, WAAPI; round 2; proposed)

- Trigger: The list of a picker opens.
- Action: the popup surface scales in (menu-scale, unchanged).
- Secondary: row n rises from distance.enter (6, 12, 4px) and fades in on ease.spring-soft over duration.spring-soft (220, 340, 100ms), after n plus 1 delay.stagger (24, 45, 0ms), the steps capped so the last delay stays within 120ms; it is at full opacity by READABLE_AT of its run.
- Styles: Neutral: a short cascade; Studio: all rows at once, a short rise; Desk: a slow cascade
- Reduced: The rows fade in together with no delay.
- Clip and sheets: `selection.<style>.webm`, `sheets/menu-rows.<style>.png`

**`picker-value-roll`** (Select; primitive stagger, pattern swap, WAAPI; round 2; proposed)

- Trigger: A new value is picked in a Select.
- Action and overshoot: the label rises from distance.enter on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms) and fades in, a little past its place and back.
- Styles: Neutral: a short roll; Studio: a cut in steps; Desk: a taller roll
- Reduced: The new label fades in.
- Clip and sheets: `selection.<style>.webm`, `sheets/picker-value-roll.<style>.png`

**`row-glide`** (ListBox, Select, Combobox, Autocomplete, MultiSelect, TagField, List; primitive flip, pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: The lit row changes: the pointer or the arrow keys move the highlight of a list or a picker, or the pointer moves between linked rows of a List.
- Action: the layer travels from the old row on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in steps).
- Overshoot: it stretches to scale.stretch on the block axis at the middle of the travel (1.15, 1.3, 1.08) and settles a little past its row.
- Styles: Neutral: a short glide; Studio: a hop in steps; Desk: a stretchy glide
- Reduced: The fill moves at once.
- Clip and sheets: `selection.<style>.webm`, `sheets/row-glide.<style>.png`

**`collection-flip`** (List, TagField, MultiSelect, FilterBar, Chip; primitive flip, pattern drag-drop, WAAPI; round 2; proposed)

- Trigger: Items of a collection are added, removed or moved: List rows, TagField tags, the tags of a MultiSelect trigger, the chips and parts of a FilterBar.
- Action: moved items travel on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms).
- Overshoot: new items rise from distance.shift and grow from scale.enter on ease.spring-bouncy over duration.spring-bouncy (220, 440, 120ms), one delay.stagger apart.
- Exit: a removed item shrinks to scale.enter and fades over duration.quick (100ms) on ease.exit, faster than an entrance.
- Styles: Neutral: short moves; Studio: hops in steps; Desk: bouncy pops and long moves
- Reduced: Nothing travels; new items fade in, removed items fade out.
- Clip and sheets: `selection.<style>.webm`, `sheets/collection-flip.<style>.png`

**`chip-check-pop`** (Chip, FilterBar; primitive icon-morph, pattern swap, WAAPI; round 2; proposed)

- Trigger: A pressable chip is selected or cleared.
- Action and overshoot: the glyph turns in and grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy (220, 440, 120ms).
- Styles: Neutral: a small turn; Studio: a cut in steps; Desk: a bouncy turn
- Reduced: The glyph fades in.
- Clip and sheets: `selection.<style>.webm`, `sheets/chip-check-pop.<style>.png`

**`filter-count-roll`** (FilterBar; primitive digit-roll, pattern number-roll, WAAPI; round 2; proposed)

- Trigger: The active filter count or the result count of a FilterBar changes.
- Action: each changed character rolls in its own column on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms), columns one delay.stagger apart from the last.
- Styles: Neutral: a short roll; Studio: hard flips; Desk: a rippling roll
- Reduced: The changed characters fade in.
- Clip and sheets: `selection.<style>.webm`, `sheets/filter-count-roll.<style>.png`

**`list-stagger`** (List; pattern list-stagger, WAAPI; round 1; proposed)

- Trigger: A list paints its rows for the first time.
- Feedback: Each row rises by space.s over duration.slow on ease.reveal, one delay.stagger after the row before, capped at three steps (Neutral 72ms, Desk 135ms, Studio 0ms); each row is at full opacity by 30% of its run, so every row reads at full contrast within about 200ms. Every row is in the DOM and read at once. It never plays on a re-render, an added row, a reorder or rows hydrated from server HTML.
- Reduced: A fade of each row over duration.base with no delay and no rise.
- Clip and sheets: `selection.<style>.webm`, `sheets/list-stagger.<style>.png`


### Overlays and menus (15)

**`menu-origin`** (DropdownMenu, ContextMenu, Menubar; pattern menu-scale, CSS; round 2; proposed)

- Trigger: Open a menu from its trigger (a press, a right click, a title of the menu bar, or the keys), then close it.
- Action: the surface travels distance.shift (Neutral 4px, Desk 6px, Studio 2px) out of the trigger side and grows from scale.menu-enter (0.97) while it fades in, on ease.spring-snappy over duration.spring-snappy (Neutral 180ms with a 1.5% overshoot, Desk 300ms with 10%, Studio 80ms in two steps).
- Stagger: the inside of each row, each label and each separator rises distance.shift and fades in on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms, Studio 100ms), the first one step after the surface and each next one delay.stagger later (Neutral 24ms, Desk 45ms, Studio 0ms: Studio rows land together), capped at six steps.
- Settle: the surface passes its size a little (Neutral and Desk) and settles while the last rows land.
- Exit: the surface shrinks back toward the trigger and fades over duration.quick (100ms) on ease.exit, all at once, faster than it came.
- Styles: Neutral: a short drop and a quick cascade; Studio: a quick cut in two steps, the rows together; Desk: a springy drop from the title with rows that cascade
- Reduced: A fade in and out, with no travel, scale or stagger. Under reduced motion the menu is there and gone at once.
- Clip and sheets: `overlays.<style>.webm`, `sheets/menu-origin.<style>.png`

**`menu-row-slide`** (DropdownMenu, ContextMenu, Menubar; pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: Move the pointer down the rows of an open menu, or press the arrow keys; along a menu bar, move between the titles.
- Action: the new row lights at once (text color, focus ring, data-highlighted).
- Travel: the fill moves from the old row to the new one on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing the row by 10% and coming back, Studio 80ms in two steps).
- Settle: the fill rests on the row; a rapid run of rows reads as one fill gliding under the pointer.
- Styles: Neutral: a short glide; Studio: a two step hop from row to row; Desk: a fill that glides and swings a little past each row
- Reduced: No slide: the fill is on the new row at once.
- Clip and sheets: `overlays.<style>.webm`, `sheets/menu-row-slide.<style>.png`

**`menu-submenu-nudge`** (DropdownMenu, ContextMenu, Menubar; pattern pop, CSS; round 2; proposed)

- Trigger: Light a row that opens a submenu with the pointer or the arrow keys, or open its submenu.
- Action: the chevron moves distance.nudge (Neutral 2px, Desk 3px, Studio 1px) toward the submenu on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms passing its place by 25%, Studio 120ms in three steps).
- React: the submenu opens from its trigger side, its rows staggered.
- Exit: the chevron comes back over duration.quick on ease.exit.
- Styles: Neutral: a small lean; Studio: none: the pop preset of Studio is reduced, so the chevron stays still; Desk: a bouncy lean toward the submenu
- Reduced: The chevron stays still.
- Clip and sheets: `overlays.<style>.webm`, `sheets/menu-submenu-nudge.<style>.png`

**`popover-spring`** (Popover, HoverCard; pattern menu-scale, CSS; round 2; proposed)

- Trigger: Open a popover from its trigger, or rest the pointer on a link with a hover card, then close it.
- Action: the surface travels distance.shift and grows from scale.enter (Neutral 0.97, Desk 0.9, Studio 1) on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in three steps).
- Overshoot: it passes its size (Neutral 6% of the way, Desk 25%) and settles.
- Stagger: title, body and footer rise distance.shift on ease.spring-soft over duration.spring-soft, at one, two and three delay.stagger steps (Neutral 24ms apart, Desk 45ms, Studio together).
- Exit: over duration.quick (a hover card duration.fast) on ease.exit, all at once.
- Styles: Neutral: a light landing; Studio: a three step cut; Desk: a bouncy landing with the parts cascading in
- Reduced: A fade with no travel, scale or stagger. Under reduced motion it is there and gone at once.
- Clip and sheets: `overlays.<style>.webm`, `sheets/popover-spring.<style>.png`

**`tooltip-rise`** (Tooltip; pattern fade-rise, CSS; round 2; proposed)

- Trigger: Rest the pointer on a control with a tooltip, or focus it.
- Action: the tooltip travels distance.shift and grows from scale.enter on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms passing its place by 10%, Studio 80ms in two steps).
- Stagger: the shortcut rises distance.shift one delay.stagger step later on the soft spring.
- Exit: back toward the trigger over duration.quick (100ms) on ease.exit.
- Styles: Neutral: a short rise; Studio: a two step pop; Desk: a springy rise with the shortcut a beat later
- Reduced: A fade with no travel. Under reduced motion the tooltip is there and gone at once.
- Clip and sheets: `overlays.<style>.webm`, `sheets/tooltip-rise.<style>.png`

**`tooltip-follow`** (Tooltip; primitive flip, pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: With a tooltip open, move the pointer (or Tab) to the next control of the same toolbar inside the skip delay.
- Action: the next tooltip is open at once and the last one is hidden.
- Travel: it slides from the old place to the new one on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% swing, Studio 80ms in two steps).
- Settle: it rests over its trigger; a run along a toolbar reads as one tooltip following the pointer.
- Styles: Neutral: a short glide; Studio: a two step hop; Desk: a glide that swings a little past the next control
- Reduced: No slide: the next tooltip is there at once and the last one goes, as in round 1.
- Clip and sheets: `overlays.<style>.webm`, `sheets/tooltip-follow.<style>.png`

**`dialog-spring`** (Dialog, AlertDialog; pattern dialog, CSS; round 2; proposed)

- Trigger: Open a dialog, then close it.
- Action: the panel rises distance.enter (Neutral 6px, Desk 12px, Studio 4px) and grows from scale.dialog-enter (0.98) on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms with a 2% overshoot, Studio 100ms in steps); its opacity is full at a third of that.
- Stagger: title at one step, description at two, body at three, footer at four (Neutral 24ms a step, Desk 45ms, Studio 0ms), each rising distance.shift on the soft spring.
- React: the AlertDialog icon pops from scale.morph (Neutral 0.5, Desk 0.3, Studio 0.8) on ease.spring-bouncy over duration.spring-bouncy, passing its size and settling.
- Exit: panel and backdrop over duration.quick (100ms) on ease.exit, all at once.
- Styles: Neutral: a short soft rise with a quick cascade; Studio: a quick stepped rise, the parts together; Desk: a long soft rise with a cascade and a bouncing icon
- Reduced: The panel and the backdrop fade in and out with no travel, scale or stagger. Under reduced motion they are there and gone at once.
- Clip and sheets: `overlays.<style>.webm`, `sheets/dialog-spring.<style>.png`

**`sheet-spring`** (Sheet, Drawer; pattern sheet, CSS; round 2; proposed)

- Trigger: Open a sheet or a drawer, close it, or drag a sheet by its handle and let go.
- Action: the panel slides from its edge on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms passing its place by 2%, Studio 100ms in steps).
- Stagger: header (or title) at one step, description at two, body at three, footer at four, each rising distance.shift on the soft spring.
- Settle: a released sheet springs back to rest on the soft spring.
- Exit: the panel slides out over duration.quick (100ms) on ease.exit, all at once.
- Styles: Neutral: a short soft slide; Studio: a quick stepped slide; Desk: a long slide that settles past its edge and back
- Reduced: The panel fades in and out where it rests, with no slide or stagger, and a released sheet is back in place at once.
- Clip and sheets: `overlays.<style>.webm`, `sheets/sheet-spring.<style>.png`

**`command-palette-open`** (CommandPalette; pattern dialog, CSS; round 2; proposed)

- Trigger: Open the command palette with its trigger or Mod+K, then close it.
- Action: the panel rises and grows on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps).
- Stagger: the result rows follow (command-palette-results), the key hints one step after the panel.
- Exit: over duration.quick on ease.exit, all at once.
- Styles: Neutral: a short rise; Studio: a two step cut; Desk: a springy rise
- Reduced: A fade with no travel. Under reduced motion it is there and gone at once.
- Clip and sheets: `overlays.<style>.webm`, `sheets/command-palette-open.<style>.png`

**`command-palette-results`** (CommandPalette; primitive stagger, pattern list-stagger, WAAPI; round 2; proposed)

- Trigger: Open the palette, or type in its search box.
- Action: the list is rendered and the lit row is there at once.
- Stagger: the other new rows rise distance.enter and fade in on ease.spring-soft over duration.spring-soft, one delay.stagger step apart (Neutral 24ms, Desk 45ms, Studio together), at most six steps.
- React: rows that stay slide to their new place on ease.spring-snappy over duration.spring-snappy.
- Styles: Neutral: played reduced by the list-stagger preset: a fade; Studio: played reduced by the list-stagger preset: a fade; Desk: a visible cascade and rows that swing into place
- Reduced: The new rows fade in with no delay; rows that stay jump to their place.
- Clip and sheets: `overlays.<style>.webm`, `sheets/command-palette-results.<style>.png`

**`command-palette-row-slide`** (CommandPalette; pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: Press ArrowDown or ArrowUp in the search box, or move the pointer over the results.
- Action: the new row is the active descendant at once.
- Travel: the fill moves on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% swing, Studio 80ms in two steps).
- Styles: Neutral: a short glide; Studio: a two step hop; Desk: a glide that swings past the row a little
- Reduced: No slide: the fill is on the new row at once.
- Clip and sheets: `overlays.<style>.webm`, `sheets/command-palette-row-slide.<style>.png`

**`lightbox-zoom`** (Lightbox; primitive flip, pattern window-grow, WAAPI; round 2; proposed)

- Trigger: Press a thumbnail that opens the viewer, then close the viewer.
- Action: the image travels and grows from the thumbnail box on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms with a 2% overshoot, Studio 100ms in steps).
- Stagger: toolbar at one step, arrows at two, caption at three, each rising distance.shift on the soft spring.
- Exit: the image shrinks back into the thumbnail over duration.base (120ms) on ease.exit; the panel holds for half of that and fades.
- Styles: Neutral: a short zoom; Studio: the panel fades, the image zooms in steps; Desk: a long zoom that settles
- Reduced: The viewer fades in and out; the image does not travel.
- Clip and sheets: `overlays.<style>.webm`, `sheets/lightbox-zoom.<style>.png`

**`tour-spotlight`** (Tour; primitive flip, pattern menu-scale, WAAPI; round 2; proposed)

- Trigger: Start a tour, then press Next or Back.
- Action: the ring moves and resizes to the new target on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps).
- Follow: the panel moves one delay.stagger step later on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms, Studio 100ms).
- Stagger: title, body and footer rise distance.shift one step apart after the panel.
- Exit: ring and panel go over duration.fast, all at once.
- Styles: Neutral: a short glide and a light trail; Studio: stepped moves, the panel right behind the ring; Desk: a springy ring with the panel trailing a beat
- Reduced: No travel: the ring and the panel are at the new target at once; the new text fades in.
- Clip and sheets: `overlays.<style>.webm`, `sheets/tour-spotlight.<style>.png`

**`window-settle`** (Window; pattern window-grow, WAAPI; round 2; proposed)

- Trigger: Open a window, zoom it, minimize and restore it, close it.
- Anticipation (close, minimize): the window swells to scale.lift (Desk 1.03) over duration.quick on ease.exit while the shrink starts.
- Action: the window pattern as before (duration.window-open, -zoom, -close, -minimize).
- Overshoot and settle (open, zoom, restore): at 55% of the pattern the window swells to scale.lift and settles over duration.spring-bouncy (Desk 440ms) on ease.out.
- Styles: Neutral: none: Neutral windows fade; Studio: none: Studio windows fade; Desk: a landing swell and a gather before leaving
- Reduced: The window fades; no settle.
- Clip and sheets: `overlays.<style>.webm`, `sheets/window-settle.<style>.png`

**`window-lights`** (WindowControls, TitleBar; pattern pop, CSS; round 2; proposed)

- Trigger: Move the pointer over the lights of a window or a title bar, or Tab into them; press one.
- Action: the colors fade in over duration.fast.
- Stagger and overshoot: the glyphs grow from scale.morph on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms passing their size by 25%, Studio 120ms in three steps), one delay.stagger step apart.
- Press: the dot dips to scale.anticipate on the snappy spring and springs back on release.
- Exit: the glyphs shrink and fade together over duration.fast on ease.exit.
- Styles: Neutral: a quick pop; Studio: none: the pop preset of Studio is reduced, so the glyphs show at once; Desk: glyphs that pop one after another
- Reduced: The colors and glyphs are there at once; no dip.
- Clip and sheets: `overlays.<style>.webm`, `sheets/window-lights.<style>.png`


### Navigation and shared indicators (12)

**`tab-slide`** (Tabs, SegmentedControl, ToggleGroup; pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: Choose another tab, segment or single choice item with a click, a tap or the arrow keys.
- Action: the pill moves from the box of the item it leaves to the box of the item it reaches on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps). The new state is set at once; the pill only draws the way.
- Stretch: halfway the pill is longer along its travel by up to scale.stretch (Neutral 1.15, Desk 1.3, Studio 1.08), less for a short hop, then settles to its own size.
- Secondary: the label it leaves dips to scale.anticipate and back on ease.out over duration.spring-soft; the label it reaches pops from scale.anticipate past rest on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms).
- A second change mid travel starts from where the pill is drawn, not from where it was headed.
- Styles: Neutral: a quick slide that lands with no visible swing; Studio: two hard steps, a short stretch; Desk: a long slide that passes the item and swings back
- Reduced: No motion: the indicator appears under the new item at once.
- Clip and sheets: `navigation.<style>.webm`, `sheets/tab-slide.<style>.png`

**`nav-current-slide`** (Navbar, Sidebar, Rail; pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: Another link becomes the current page (a client side route change, or a click in the stage).
- Action: the pill moves from the box of the item it leaves to the box of the item it reaches on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps). The new state is set at once; the pill only draws the way.
- Stretch: halfway the pill is longer along its travel by up to scale.stretch (Neutral 1.15, Desk 1.3, Studio 1.08), less for a short hop, then settles to its own size.
- Secondary: the label it leaves dips to scale.anticipate and back on ease.out over duration.spring-soft; the label it reaches pops from scale.anticipate past rest on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms).
- A second change mid travel starts from where the pill is drawn, not from where it was headed.
- Styles: Neutral: a quick slide that lands with no visible swing; Studio: two hard steps, a short stretch; Desk: a long slide that passes the item and swings back
- Reduced: No motion: the bar appears on the new item at once.
- Clip and sheets: `navigation.<style>.webm`, `sheets/nav-current-slide.<style>.png`

**`nav-hover-follow`** (Breadcrumbs, Navbar, Sidebar, Rail; pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: Move the pointer from one step, link or item to the next.
- Action: the pill fades in over duration.fast (CSS) while it slides from the neighbour on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps).
- Stretch: halfway it is longer along the travel by up to scale.stretch.
- Secondary: the Breadcrumbs separator leans toward the next step by distance.nudge (Neutral 2px, Desk 3px, Studio 1px) on the snappy spring, and back when the pointer leaves.
- Styles: Neutral: a quick follow and a 2px lean; Studio: a stepped hop and a 1px lean; Desk: a long follow with a swing and a 3px lean
- Reduced: The pill fades in place; nothing slides and the separator stays still.
- Clip and sheets: `navigation.<style>.webm`, `sheets/nav-hover-follow.<style>.png`

**`pagination-roll`** (Pagination; primitive digit-roll, pattern number-roll, WAAPI; round 2; proposed)

- Trigger: Press a page number, previous, next, first or last.
- Anticipation: the arrow icon draws back by distance.nudge (Neutral 2px, Desk 3px, Studio 1px) in the first quarter, against its direction.
- Action: the page changes on the click; the icon goes forward by distance.shift and home on ease.out over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms).
- Secondary: the numbers that changed roll one column at a time from the last digit, delay.stagger apart (Neutral 24ms, Desk 45ms, Studio 0ms), on ease.spring-snappy over duration.spring-snappy.
- Overshoot and settle: the current fill slides with the shared pill when its slot moves (the first and the last pages), and the number it reaches pops on the bouncy spring.
- Styles: Neutral: a quick roll and a small wind up; Studio: digits fade in place (its number-roll preset is reduced), the arrow ticks 1px; Desk: digits roll with a swing, the arrow winds up 3px
- Reduced: The new numbers fade in; nothing travels.
- Clip and sheets: `navigation.<style>.webm`, `sheets/pagination-roll.<style>.png`

**`sidebar-collapse`** (Sidebar, Rail; primitive stagger, pattern fade-rise, WAAPI; round 2; proposed)

- Trigger: Collapse or expand the Sidebar with its toggle; show or hide the Rail labels (hideLabels).
- Action: the panel takes its new width at once.
- Secondary, expand: after two stagger steps the labels slide in from the inline start by distance.shift and fade in on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms, Studio 100ms), delay.stagger apart, capped at six.
- Secondary, collapse: the icons pop from scale.anticipate past rest on the bouncy spring. Rail: the icons travel on the snappy spring.
- Styles: Neutral: a short ripple; Studio: labels land together, stepped; Desk: labels ripple in one by one
- Reduced: The labels fade in with no travel and no delay; the icons do not move.
- Clip and sheets: `navigation.<style>.webm`, `sheets/sidebar-collapse.<style>.png`

**`stepper-travel`** (Stepper; pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: Move to another step (next, back, or a reachable step title).
- Action: the ring travels on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms), stretched by up to scale.stretch, from opacity 1 to 0 as it lands.
- Overshoot and settle: the new current indicator pops from scale.anticipate on the bouncy spring.
- Secondary: the connector after a step that turns complete fills on ease.spring-soft over duration.spring-soft; going back it empties the same way.
- Styles: Neutral: a quick travel; Studio: a stepped hop; Desk: a long travel and a swinging pop
- Reduced: Nothing travels; the current step and the fill change at once.
- Clip and sheets: `navigation.<style>.webm`, `sheets/stepper-travel.<style>.png`

**`toc-travel`** (TableOfContents; pattern tab-indicator, WAAPI; round 2; proposed)

- Trigger: Scroll to another section, or choose a link.
- Action: the bar travels on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with a 10% overshoot, Studio 80ms in two steps).
- Stretch: it grows to scale.stretch from its trailing edge at 40% of the move and settles on ease.standard.
- Styles: Neutral: a quick move; Studio: a stepped move; Desk: a long move that passes the link and swings back
- Reduced: The bar jumps to the active link.
- Clip and sheets: `navigation.<style>.webm`, `sheets/toc-travel.<style>.png`

**`tab-bar-pop`** (TabBar; pattern pop, CSS; round 2; proposed)

- Trigger: A destination becomes current (or the bar mounts on a new page).
- Overshoot and settle: the icon box pops on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms with a 6% overshoot, Desk 440ms with 25%, Studio 120ms in three steps).
- Secondary: the label rises by distance.nudge on the same spring, delay.stagger later.
- Styles: Neutral: a small pop; Studio: no pop: its pop preset is reduced, so the recipe sets the duration to 0ms; Desk: a big bouncy pop
- Reduced: Nothing moves.
- Clip and sheets: `navigation.<style>.webm`, `sheets/tab-bar-pop.<style>.png`

**`dock-lift`** (Dock; pattern pop, CSS; round 2; proposed)

- Trigger: Hover a tile or focus it; an item becomes current.
- Action: the tile lifts (base distance.lift and scale.lift; Desk magnifies to 1.25 and lifts space.xs) on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms with a 25% overshoot, Studio 120ms).
- Secondary: the neighbours lift by half and a quarter, so the row swells around the pointer.
- Overshoot and settle: a tile that becomes current pops from scale.anticipate past rest, added to its hover transform.
- Styles: Neutral: a 2px lift and a small pop; Studio: no lift and no pop (its lift tokens are 0 and its pop preset is reduced); Desk: the magnify with a swing; neighbours swell
- Reduced: No lift, no magnify, no pop.
- Clip and sheets: `navigation.<style>.webm`, `sheets/dock-lift.<style>.png`

**`toolbar-press`** (Toolbar; pattern press, CSS; round 2; proposed)

- Trigger: Press a toolbar item; turn a toggle item on.
- Anticipation: the item dips to scale.press and its icon gathers to scale.anticipate while held (duration.instant).
- Overshoot and settle: on release both spring back on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms).
- Secondary: an item that turns on pops its icon on the same spring.
- Styles: Neutral: a light tap; Studio: a stepped tick; Desk: a deep gather and a swinging release
- Reduced: No scale; the on fill carries the state.
- Clip and sheets: `navigation.<style>.webm`, `sheets/toolbar-press.<style>.png`

**`language-roll`** (LanguageSwitch; pattern swap, WAAPI; round 2; proposed)

- Trigger: The current language changes in place (a client side switch).
- Action: both names roll a full line on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms, Studio 80ms in two steps), fading as they go.
- Secondary, the pair: the leaving name dips to scale.anticipate, the reached name pops past rest on the bouncy spring.
- Styles: Neutral: a quick roll; Studio: a stepped flip; Desk: a roll with a swing
- Reduced: The new name fades in.
- Clip and sheets: `navigation.<style>.webm`, `sheets/language-roll.<style>.png`

**`skip-link-slide`** (SkipLink; pattern fade-rise, CSS; round 2; proposed)

- Trigger: Tab to the skip link.
- Action: drawn at once, ring included.
- Overshoot and settle: it slides by distance.enter (Neutral 6px, Desk 12px, Studio 4px) on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in three steps).
- Styles: Neutral: a small drop; Studio: a short stepped drop; Desk: a long drop with a bounce
- Reduced: It appears in place.
- Clip and sheets: `navigation.<style>.webm`, `sheets/skip-link-slide.<style>.png`


### Feedback, progress, data display and layout (23)

**`alert-entrance`** (Alert, Banner, Callout; pattern fade-rise, CSS; round 2; proposed)

- Trigger: An Alert, a Banner or a Callout mounts.
- Action: the surface fades in while it rises distance.enter (an Alert from below, a Banner from above) and an Alert grows from scale.enter, on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms with a small overshoot, Studio 100ms in steps).
- Overshoot: one delay.stagger later (24, 45, 0ms) the icon pops from scale.morph (0.5, 0.3, 0.8) on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms with a 25% overshoot, 120ms in steps), landing past its size and settling.
- Settle: two steps later the title, the body and the actions rise distance.nudge (2, 3, 1px) and fade in on the soft spring.
- Styles: Neutral: a quick rise, a small icon pop; Studio: hard cuts, every part at once; Desk: a bouncy icon, a long settle
- Reduced: No motion: the message is there at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/alert-entrance.<style>.png`

**`alert-dismiss`** (Alert, Banner; primitive flip, pattern fade, WAAPI; round 2; proposed)

- Trigger: Press the close button of an Alert or a Banner.
- Action: the ghost (aria-hidden, inert) shrinks to scale.enter and fades on ease.exit over duration.quick (100ms in every style), about half the entrance (flipExit).
- Secondary: the neighbours that moved travel from their old place on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms; flipPlay), so the page closes the gap instead of jumping.
- Styles: Neutral: a quick shrink, a short slide; Studio: a fast fade, the gap closes in steps; Desk: the page below springs up with an overshoot
- Reduced: A fade of the ghost; the content below takes its place at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/alert-dismiss.<style>.png`

**`state-illustration`** (EmptyState, ErrorState; pattern fade-rise, CSS; round 2; proposed)

- Trigger: An EmptyState or an ErrorState mounts (a list emptied by a filter, a section that failed).
- Action: the icon falls from distance.lift above (2, 4, 0px) and grows from scale.enter (0.97, 0.9, 1) while it fades in, on ease.spring-bouncy over duration.spring-bouncy, so it lands with an overshoot in Desk.
- Stagger: the title, the body, the actions (and the details of an ErrorState) rise distance.nudge and fade in on the soft spring, one delay.stagger apart starting one step after the icon.
- Styles: Neutral: a light settle and a 24ms cascade; Studio: all parts at once, in steps; Desk: the icon drops in and bounces, a slow cascade
- Reduced: No motion: every part is there at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/state-illustration.<style>.png`

**`error-state-details`** (ErrorState; pattern accordion-height, CSS; round 2; proposed)

- Trigger: Open or close the details of an ErrorState.
- Action and overshoot: the chevron turns 180 degrees on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms), past its angle in Desk, then settles.
- Styles: Neutral: a quick turn; Studio: a stepped turn; Desk: a turn that swings past and back
- Reduced: No motion: the chevron points the new way at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/error-state-details.<style>.png`

**`accordion-reveal`** (Accordion; pattern accordion-height, CSS; round 2; proposed)

- Trigger: Open a section with its header button, Enter or Space.
- Action: the content layer slides from -100% of its own height and fades in, opaque at 60%, over duration.slow on ease.standard. A panel does not overshoot. The height never animates and the text never scales.
- Secondary: the chevron turns 180 degrees on ease.spring-snappy over duration.spring-snappy, past its angle in Desk.
- Stagger: each element child of the content rises distance.nudge and fades in on ease.spring-soft, one delay.stagger apart, capped at six steps. Plain text content has no children, so only the layer slides.
- Styles: Neutral: a quick turn and a 24ms cascade; Studio: a stepped turn, every child at once; Desk: a swinging chevron and a 45ms cascade
- Reduced: No motion: the content shows at once and the chevron points the new way at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/accordion-reveal.<style>.png`

**`skeleton-swap`** (Skeleton; pattern skeleton-shimmer, CSS; round 2; proposed)

- Trigger: A skeleton shows while its content loads, then the content replaces it.
- Loop: the band sweeps linear over duration.shimmer, three times (4.2s), then the placeholder holds still, so it needs no pause control.
- Cross fade: the skeleton leaves the DOM at once; a decorative ghost of it, put back where it was drawn, fades out over duration.morph (200, 320, 100ms) on ease.exit on top of the content that took its place.
- Styles: Neutral: a short dissolve; Studio: a 100ms cut to the content; Desk: a slow dissolve
- Reduced: No motion: the band is not drawn and the content replaces the placeholder at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/skeleton-swap.<style>.png`

**`stat-roll`** (Stat; primitive digit-roll, pattern number-roll, WAAPI; round 2; proposed)

- Trigger: The number of a Stat changes after it first paints.
- Action: each changed digit rolls in its own column, 100% of its height, on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms), the old digit rolling out the other way (rollDigits).
- Stagger: the columns start one delay.stagger apart from the last digit toward the first, so a carry ripples like an odometer.
- Secondary: one step after the digits start, the trend mark nudges distance.nudge in the direction of the change and comes back, over duration.spring-bouncy.
- Limit: a change less than 333ms (or one roll, if longer) after the last roll changes in place, so a fast counter changes at most three times a second in every style.
- Styles: Neutral: a quick roll; Studio: a fade of the new digits (the number-roll pattern is reduced in Studio); Desk: a long odometer roll
- Reduced: The changed digits fade in, with no travel and no nudge.
- Clip and sheets: `feedback.<style>.webm`, `sheets/stat-roll.<style>.png`

**`toast-enter`** (Toast; pattern toast, CSS; round 2; proposed)

- Trigger: A toast is shown, or closed by its timer, its close button or Escape.
- Action: the toast travels space.xs in from the edge and grows from scale.enter while it fades in, on ease.spring-bouncy over duration.spring-bouncy, landing past its place in Desk.
- Overshoot: one delay.stagger later the icon pops from scale.morph on the bouncy spring and settles.
- Exit: a closing toast fades and shrinks to scale.enter over duration.toast-exit on ease.exit, faster than the entrance.
- Styles: Neutral: a short spring, a small pop; Studio: a stepped arrival, icon with the card; Desk: a springy arrival and a bouncing icon
- Reduced: No motion: the toast is there and gone at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/toast-enter.<style>.png`

**`toast-stack`** (Toast; primitive flip, pattern drag-drop, WAAPI; round 2; proposed)

- Trigger: A toast joins the stack or leaves it while other toasts are shown.
- Secondary: each toast that has to make room travels from its old place on ease.spring-snappy over duration.spring-snappy (180, 300, 80ms), past its place in Desk; a move still in flight starts from where the toast is drawn.
- Styles: Neutral: a quick slide; Studio: stepped moves; Desk: springy room making
- Reduced: No motion: the toasts that stay take their new place at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/toast-stack.<style>.png`

**`toast-swipe`** (Toast; pattern toast, CSS; round 2; proposed)

- Trigger: Drag a toast toward the edge it sits on, then let go.
- Action: the toast follows the finger (the Radix swipe variables, no transition).
- Settle: let go short, it springs back on ease.spring-snappy over duration.spring-snappy; past the threshold it travels on out over duration.toast-exit on ease.exit.
- Styles: Neutral: a quick return; Studio: a stepped return; Desk: a return that swings past its place
- Reduced: The toast still follows the finger. Let go, it is back in place at once, or it is gone where it was let go.
- Clip and sheets: `feedback.<style>.webm`, `sheets/toast-swipe.<style>.png`

**`notification-change`** (NotificationCenter; primitive flip, pattern drag-drop, WAAPI; round 2; proposed)

- Trigger: A notification is added or removed, or the unread count changes.
- Action: a new entry rises distance.shift and grows from scale.enter while it fades in, on ease.spring-bouncy over duration.spring-bouncy; several new entries start one delay.stagger apart (flipPlay enter).
- Exit: a removed entry comes back as a ghost that shrinks to scale.enter and fades over duration.quick (flipExit).
- Secondary: the entries and group labels that stay travel from their old place on the snappy spring.
- Secondary: the number in the unread count rolls digit by digit (rollDigits; the words stay whole) and the count pill pops to scale.pop over duration.celebrate.
- Styles: Neutral: short slides and a small pop; Studio: stepped moves, no pop; Desk: bouncy entries and a big pop
- Reduced: New entries fade in; the rest take their place at once; the new count fades in.
- Clip and sheets: `feedback.<style>.webm`, `sheets/notification-change.<style>.png`

**`progress-spring`** (ProgressBar, ProgressCircle; pattern fade-rise, CSS; round 2; proposed)

- Trigger: The value of a ProgressBar or a ProgressCircle changes.
- Action: the bar fill scales on the inline axis on ease.spring-soft over duration.spring-soft (220, 340, 100ms), landing a little past the value in Desk.
- Action: the ring arc starts turned back by the change and turns into place on the soft spring, so its leading end sweeps forward from the old value.
- Secondary: the value inside the ring rolls digit by digit (rollDigits).
- Styles: Neutral: a quick ease; Studio: stepped moves; Desk: a fill that overshoots a little
- Reduced: No motion: the new value shows at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/progress-spring.<style>.png`

**`progress-celebrate`** (ProgressBar, ProgressCircle; pattern pop, WAAPI; round 2; proposed)

- Trigger: The value reaches max after being below it (once per completion, never on a first paint at max).
- Anticipation: a dip to scale.anticipate (0.95, 0.9, 0.97) in the first fifth.
- Overshoot: a pop to scale.pop (1.05, 1.14, 1) at about half, then rest, over duration.celebrate (220, 480, 120ms) on ease.out.
- Styles: Neutral: a small pop; Studio: none (pop is reduced in Studio); Desk: a big, slow pop
- Reduced: No motion: the bar or ring reads done at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/progress-celebrate.<style>.png`

**`meter-fill`** (Meter; pattern chart-draw, WAAPI; round 2; proposed)

- Trigger: A Meter is first seen: at mount when it is on screen, else when it scrolls into view.
- Hold: until it is seen, an inline scaleX(0) holds the fill empty (set before the first paint, so a meter in view never shows full first); no animation waits paused.
- Action: the hold is dropped and the fill transitions from 0 to the value on ease.spring-soft over duration.reveal (640ms), landing a little past the value in Desk; once per mount.
- Styles: Neutral: a smooth fill; Studio: a stepped fill; Desk: a fill that overshoots and settles
- Reduced: No motion: the value shows at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/meter-fill.<style>.png`

**`avatar-status`** (Avatar; pattern pop, WAAPI; round 2; proposed)

- Trigger: The status of an Avatar changes after it first paints (away to online, for example).
- Overshoot: the dot dips to scale.anticipate and pops to scale.pop over duration.celebrate.
- Loop: a ring grows from the dot to 2.5 times its size while it fades, over duration.pulse (1.4s), three times (4.2s), so it ends before five seconds; pauseLoops() also pauses it.
- Styles: Neutral: a small pop and pulse; Studio: none (pop is reduced in Studio); Desk: a big pop and pulse
- Reduced: No motion: the new status shape shows at once. A first paint never pulses.
- Clip and sheets: `feedback.<style>.webm`, `sheets/avatar-status.<style>.png`

**`status-pulse`** (StatusDot; pattern thinking, CSS; round 2; proposed)

- Trigger: A StatusDot with pulse shows a live state (syncing, recording).
- Anticipation and overshoot: in the first third of each loop the dot dips to scale.anticipate and pops to scale.pop, then rests.
- Secondary: a ring grows from the dot to 2.5 times and fades over the whole loop, duration.pulse on ease.out.
- Limit: three loops (4.2s at 1.4s) set by --_status-dot-loops, under five seconds (WCAG 2.2.2), and under three flashes a second.
- Styles: Neutral: a light beat; Studio: a ring only (pop is 1 in Studio); Desk: a strong beat
- Reduced: No motion: a still dot with its label.
- Clip and sheets: `feedback.<style>.webm`, `sheets/status-pulse.<style>.png`

**`avatar-group-change`** (AvatarGroup; primitive flip, pattern drag-drop, WAAPI; round 2; proposed)

- Trigger: An avatar joins or leaves an AvatarGroup, or the overflow count changes.
- Action: a new avatar rises distance.shift and grows from scale.enter on ease.spring-bouncy (flipPlay enter); a removed one comes back as a ghost that shrinks away over duration.quick.
- Secondary: the avatars and the overflow that stay slide to their new place on ease.spring-snappy over duration.spring-snappy.
- Secondary: the overflow number rolls digit by digit and the overflow pops to scale.pop over duration.celebrate.
- Styles: Neutral: quick slides; Studio: stepped slides, no pop; Desk: bouncy arrivals
- Reduced: New avatars fade in; the rest take their place at once; the count fades.
- Clip and sheets: `feedback.<style>.webm`, `sheets/avatar-group-change.<style>.png`

**`badge-count`** (Badge; primitive digit-roll, pattern pop, WAAPI; round 2; proposed)

- Trigger: The count of a Badge changes after it first paints.
- Action: the changed digits roll in their columns on ease.spring-snappy (rollDigits), last digit first.
- Overshoot: the badge dips to scale.anticipate and pops to scale.pop over duration.celebrate. A badge placed with a transform of its own pops its label instead, so it stays where it is.
- Styles: Neutral: a quick roll and a small pop; Studio: a fade of the digits, no pop; Desk: a long roll and a big pop
- Reduced: The new digits fade in; no pop.
- Clip and sheets: `feedback.<style>.webm`, `sheets/badge-count.<style>.png`

**`card-lift`** (Card, Tile; pattern press, CSS; round 2; proposed)

- Trigger: Move the pointer over an interactive Card or Tile (one with a CardLink or a TileLink).
- Action: the card rises distance.lift (2, 4, 0px) and grows to scale.lift (1.01, 1.03, 1) on ease.spring-soft over duration.spring-soft; the hit area moves at most a few pixels.
- Secondary: a soft round highlight on a decorative span inside the card fades in over duration.moderate and follows the pointer by transform. The span is aria-hidden and takes no pointer.
- Styles: Neutral: a 2px lift; Studio: no lift, only the highlight and the tone; Desk: a 4px lift with an overshoot
- Reduced: No motion: the card changes tone only and no highlight is drawn.
- Clip and sheets: `feedback.<style>.webm`, `sheets/card-lift.<style>.png`

**`spinner-loop`** (Spinner; pattern spinner, CSS; round 2; proposed)

- Trigger: A Spinner mounts while something loads.
- Action: the ring fades in over duration.spring-soft on ease.out, so a short wait does not blink.
- Loop: the ring turns once per duration.spin, linear, until the spinner unmounts or pauseLoops() pauses it.
- Styles: Neutral: a 220ms fade; Studio: a 100ms fade; Desk: a 340ms fade
- Reduced: No motion: a still ring with its arc; the label still says what is busy.
- Clip and sheets: `feedback.<style>.webm`, `sheets/spinner-loop.<style>.png`

**`kbd-press`** (Kbd; pattern press, WAAPI; round 2; proposed)

- Trigger: Press on the keyboard a key that a Kbd keycap names.
- Action: the keycap dips distance.nudge and to scale.anticipate on ease.spring-snappy over duration.spring-snappy, and holds.
- Settle: on release it springs back on ease.spring-bouncy over duration.spring-bouncy, past its rest in Desk.
- Styles: Neutral: a light press; Studio: a stepped press; Desk: a deep press and a bounce
- Reduced: No motion: the keycap stays still.
- Clip and sheets: `feedback.<style>.webm`, `sheets/kbd-press.<style>.png`

**`handle-grip`** (ResizablePanels, SplitView; pattern drag-drop, CSS; round 2; proposed)

- Trigger: Hover, focus or drag the handle between two panels.
- Action: the grip grows along the line from scale.morph to its length on ease.spring-bouncy over duration.spring-bouncy while it fades in.
- Secondary: while the handle is dragged the grip stretches to scale.stretch (1.15, 1.3, 1.08) and springs back when it is let go.
- Styles: Neutral: a small grow; Studio: a stepped grow; Desk: a bouncy grow and a long stretch
- Reduced: No motion: the grip shows at its length at once and does not stretch.
- Clip and sheets: `feedback.<style>.webm`, `sheets/handle-grip.<style>.png`

**`split-view-pane`** (SplitView; pattern sheet, CSS; round 2; proposed)

- Trigger: Open a detail, or go back to the list, while a SplitView is stacked.
- Action: the pane slides distance.enter (6, 12, 4px) on ease.spring-soft over duration.spring-soft. Transform only, no fade: focus moves into the pane and its ring shows at once.
- Styles: Neutral: a 6px slide; Studio: a 4px stepped slide; Desk: a 12px slide with a settle
- Reduced: No motion: the pane is there at once.
- Clip and sheets: `feedback.<style>.webm`, `sheets/split-view-pane.<style>.png`

## 4. Findings of the round 1 review, and the lead's findings during the round

The review is `docs/reports/reviews/interactions.md` on the lead branch. Its
six blockers went to the family that owns each file, with a test per fix.

| Blocker | Status | Where and how |
| --- | --- | --- |
| B1, the focus ring fades in on Checkbox, Switch, Rating and Slider (WCAG 2.4.7) | Fixed | The ring layer no longer has an opacity transition: Switch (actions), Rating (inputs), Checkbox and Slider (selection), and also RadioGroup and RadioCard. One test per control |
| B2, reduced forms apply only under the media query, not under `data-motion="reduce"` (WCAG 2.3.3) | Fixed | Every reduced block in every family's CSS and in the Desk recipes (Button roll label, Dock magnify) is repeated under `:root[data-motion='reduce']`; tests walk the rules (for example `Breadcrumbs.test.tsx`, `Alert/reducedMotion.test.ts`) |
| B3, unnamed ToggleButton on `/interactions` (axe button-name) | Fixed | The stage names every ToggleButton, and ToggleButton warns in development when `label` comes without `icon` |
| B4, SegmentedControl labels break inside words at 320px in Neutral | Fixed | `overflow-wrap: break-word`, items take `min-inline-size: min-content` and less inline padding under the phone breakpoint; ToggleGroup the same. Checked at 320px, LTR and Arabic RTL |
| B5, the highlighted option of Combobox and Autocomplete is marked by fill alone | Fixed | `[data-highlighted]` options get the inset ring in ListBox; TagField's ring override removed (N20) |
| B6, the Form and ConsentField fixes never reached Angular | Fixed | Angular Form gives required messages by kind of control and never the browser's English `validationMessage`; ConsentField `requiredError` reaches the summary; the React development warnings are ported, with one for a FormControl that starts consent as true (PDPL: never pre-ticked). Test: `packages/angular/src/components/form/form-copy.spec.ts` |

Notes N1 to N25:

| Note | Status |
| --- | --- |
| N1 rating replays filled stars | Fixed: only the stars whose state changed move |
| N2 menus grow from the far corner in RTL | Fixed: the origin is set on the trigger's corner |
| N3 Stat rolls more than three times a second | Fixed: at most one roll per 333ms in every style (`ROLL_WINDOW_MS`) |
| N4 focus returns after the exit | Partly: every exit is now 100ms or less (Desk dialog and command palette exits moved to `duration.quick` by the lead); the return itself waits on Radix Presence (change 2 below) |
| N5 the dialog's first focused control is invisible during the entrance | Fixed: panels are opaque by a third of the entrance; Sheet and Drawer no longer fade |
| N6 `off` rows leave motion behind (Switch, Accordion) | Fixed: `--_switch-motion` and the accordion row also stop the chevron and the child stagger |
| N7 style presets do not reach CSS timing | Addressed by design: CSS timing now comes from the per style spring tokens, so each style's feel reaches CSS without a preset |
| N8 pop runs too long in Neutral | Fixed: a pop run steps by `delay.stagger` (Neutral 24ms) and Neutral pops on `duration.base`; OTP paste and rating runs spread over at most two steps |
| N9 `interactionRecipes()` does not reach apps | Open: change 1 below |
| N10 raw values in motion code | Fixed for Checkbox (`0s`), Switch and Slider (now `--ds-scale-stretch`); open for `shake.ts` factors and the tooltip delays (token request below) |
| N11 the round 1 reduced column says "Fade" | Fixed in this report: under the person's reduced motion nothing moves; a fade plays only where a style preset asks for the reduced form |
| N12 Accordion demo has no `data-demo-trigger` | Fixed |
| N13 axe target size while a menu is mid scale | Checked: no trigger or target scales |
| N14 a no-op press transition | Fixed: the button rests at `scale(1)` |
| N15 demo differences React against Angular | Not motion; left for the Angular lanes |
| N16 ConsentField `checked` with any `meta` | Fixed: a warning when a consent starts given and its record line has no date |
| N17, N18, N19 consent withdrawal and demo copy | Not in this order; left for the lead |
| N20 TagField ring override | Fixed with B5 |
| N21 ToggleGroup xs height in Neutral RTL | Fixed: 28px attached and spaced |
| N22 Form group summary focuses a checkbox with no error | Open: the group's error must reach the first checkbox or radio, which lives in Checkbox and RadioGroup |
| N23 CommandPalette shortcut in a shadow root | Not in this order |
| N24 NumberField decrement name half Arabic | Fixed in the demo (`locale`) |
| N25 Autocomplete open runs skip | Checked: Autocomplete opens through ComboboxBase and takes the row stagger |

Lead findings during the round: the readable stagger rule (section 2.2), and
recordings that showed the controls too small (section 9: replaced by the
stage only clips). Found by the round's own sheets: the digit roll layer of
NumberField and ScrubInput, and two exit copies, placed wrong under a zoom
or a scale on an ancestor, and the roll layer on the wrong side in a right
to left page (section 9, fixed).

## 5. Rejected, and why

| Idea | Family | Why |
| --- | --- | --- |
| Blur while an indicator, label or panel moves (study clips 5, 17, 28, 35, 44) | all | `filter` may not animate; also a paint per frame |
| A pulse of the Switch track by keyframes on each toggle | actions | A keyframe tied to `data-state` also plays on first paint for every switch; the track dips on press instead |
| A rolling "Copied" label on CopyButton | actions | It changes the accessible name and the width |
| A blinking OTP caret | inputs | A loop with no end (WCAG 2.2.2); a still bar that moves says the same |
| Animating the FormWizard title | inputs | It takes focus on a step change; moving it would move its ring |
| An exit for FieldError | inputs | It unmounts with the fix; holding it keeps a stale message in the DOM |
| One highlight layer per list container | selection | Invalid inside a `ul`, needs scroll and RTL offsets; a layer per row does the same |
| A transient lift of a checked CheckboxGroup row | selection | A keyframe on the checked state plays on first paint |
| A new highlight element in each menu | overlays | It would add a node to the `menu` role; the row's `::after` moved by a pseudo element animation does it with none |
| Re-staggering every CommandPalette row on each key | overlays | Rows that stay jittered while typing; only new rows rise, rows that stay slide |
| Staggered exits | overlays, all | The person asked the overlay to go: exits are faster and all at once |
| Sliding the fill of Sidebar, Rail and Navbar items | navigation | The fill is the item's own background; the current bar slides, the fill swaps |
| A pill that follows keyboard focus in Breadcrumbs | navigation | The ring must show at once and must not move |
| Per character rolls of Arabic words (unread count, language pair, pagination summary) | navigation, feedback | Columns break Arabic joins; only numbers roll |
| Panel overshoot for accordion content | feedback | Study rule 2: panels and text ease out |
| Pulsing every online avatar at load | feedback | A page of avatars would move for four seconds; the pulse plays only on a status change |
| A ScrollArea thumb grow | feedback | Radix moves the thumb with transform; a second transform would fight it |
| A Chip that pops on mount when standalone | selection | It cannot tell a first paint from an addition; the FLIP lives in the containers |

## 6. Needs a rule change (for the owner)

Each idea below needs a property other than `transform` and `opacity`; the
nearest transform and opacity form is built.

| Richer idea (clip) | Needs | Built instead |
| --- | --- | --- |
| A button that shrinks into its progress pill (27, 47) | `width` or `clip-path` | width held, parts roll inside |
| Link underline that draws inside running text | `background-size` or `text-decoration-thickness` | the draw on standalone links; instant thickening in text |
| A thumb, slider bubble or label that changes color while it moves (17, 60) | a color transition | a tint layer that fades (Switch), a still surface, a scale dip and pop (tab labels) |
| A menu or panel that grows out of its trigger (9, 22) | `clip-path` or a size transition | scale from the trigger corner plus a short travel |
| Lightbox zoom from a cropped thumbnail (63) | `clip-path` or `object-view-box` | a scale FLIP that stretches for a moment when aspect ratios differ |
| A Tour spotlight ring that resizes | a size transition | a scale FLIP (the border scales during the move) |
| A dialog backdrop blur that grows | `backdrop-filter` | the backdrop fades |
| An error that pushes the content below with a slide (52) | `height` or layout | the content moves at once; the error slides out from under the control |
| A check or ring that draws as a stroke (ConsentField, ProgressCircle sweep) | `stroke-dashoffset`, a conic angle via `@property` | a wipe plus a pop; the new arc turns into place |
| Sidebar labels that fade before the panel narrows (26) | a width transition or a held exit | labels hide at once on collapse, return after the panel on expand |
| Sidebar, Rail and Navbar sliding fill | a contract note letting an item's fill be a layer | the current bar slides |
| Breadcrumbs pill clipped on its fade out | `clip-path` on the label instead of overflow on the link | the pill fades inside the clip |
| A glide layer that changes height between rows of different height | `block-size` | a scale FLIP of the layer |
| A card highlight gradient that follows the pointer | `background-position` | a circle on a decorative span moved by transform |
| Skeleton content that fades in under the leaving shape | API: `<Skeleton loading>{content}</Skeleton>` | a ghost of the skeleton fades over the content |

## 7. Work for Angular and native

Angular shares the CSS, so every CSS interaction already plays there, and
every CSS rule that needs an inner element React adds falls back to the
round 1 look when the element is missing. `npm run check -w @the-system/angular`
is green. The interactions played from code need an Angular player (a twin
of `useMotion()` over `@the-system/motion`) and these ports; the lane
reports name each file:

| Family | Needs Angular code |
| --- | --- |
| Actions | button-base: the loading `buttonMorph` with the leaving spinner; copy-button: `buttonMorph` instead of the swap; toggle-button: the pop and sink; switch: the aria-hidden tint span in the track |
| Inputs | field, field-error, fieldset: the slide in and icon pop; input, password-field, number-field, otp-field: the round 2 shake; password-field and search-field: `iconMorph`; number-field and scrub-input: the aria-hidden digit layer; otp-field: the pop run and completion wave; inline-edit, form, form-wizard, consent-field, rating code paths |
| Selection | the row fill span and a glide player for ListBox and List; the RadioCard dot span; the Slider bubble with `rollDigits`; the select all step values; the popup open stagger; a `useFlipGroup` port for List, TagField, MultiSelect and FilterBar; the FilterBar count spans; Chip `iconMorph` |
| Overlays | the menu and palette row slide (`slideHighlight`), tooltip follow, palette results stagger and FLIP, Lightbox zoom, Tour spotlight, Window settle |
| Navigation | a port of `packages/react/src/internal/indicator.ts` for tab-slide, the current and hover slides, pagination-roll, sidebar-collapse, stepper-travel, toc-travel and language-roll |
| Feedback | the exit ghosts (Alert, Banner, Skeleton), the FLIP lists (NotificationCenter, AvatarGroup, Toast), the digit rolls, progress-celebrate, the ring turn, the meter fill on view, avatar-status, kbd-press, the card highlight span |

Native (wave 2): every beat maps to Reanimated `withSpring` from the
`spring.*` tokens of each style; the `linear()` curves and settle times in
the registry are the spec. Native values still ignore the style (catalog
note N5).

## 8. How the three styles differ

All from tokens, so a style needs no code. The study's rules hold in each:
exits faster than entrances, overshoot only on things that land, stagger
short and capped, text readable within about 200ms.

- **Neutral, restrained springs at 150 to 220ms.** Soft spring with no
  overshoot for panels, snappy with 1.5% for presses and indicators, bouncy
  with 6% for marks. Stagger 24ms. Pop to 1.05, stretch 1.15, travel 2 to
  6px. Every spring settles in 180 to 220ms (tested).
- **Studio, flat and fast with hard cuts and steps.** Its spring eases are
  `steps(2)` and `steps(3)`, so indicators, thumbs and digits move in two or
  three hard cuts within 80 to 120ms. Stagger 0ms (parts arrive together),
  pop 1 and enter 1 (nothing grows or overshoots), travel 1 to 4px. Studio's
  preset plays the stat, badge and page number rolls, the tab bar and the
  dock in full so they cut in steps instead of fading (added by the lead);
  the field error still does not shake.
- **Desk, rolls, window style scale and playful overshoot.** Springs settle
  over 300 to 440ms; the bouncy one passes its target by a quarter and swings
  back. Stagger 45ms (two steps inside the readable budget), pop 1.14,
  stretch 1.3, entrances from 0.9, travel 3 to 12px. Dialogs keep the window
  grow from the trigger; their exits are now `duration.quick`.

## 9. Proof

| Check | Result |
| --- | --- |
| `npm run check` before the foundation commit | green, every step |
| `npm run check` after all six families (lead run) | every step green but vitest, whose one failure was the cli `docs` snapshot of the Kbd manifest note; the snapshot was updated and a full `npx vitest run` then passed 182 files, 2385 tests |
| Contract suite, react, every touched component | green: actions 10 of 10, inputs 18 of 18 (521 checks), selection 15 of 15, overlays 16 of 16 (652 checks), navigation 15 of 15, feedback 25 of 25. Some runs failed once under a load average near 50 and passed on rerun; the lane reports list them |
| `npm run contract -- --framework react --component List` after the readable stagger rule | 29 of 29, axe contrast green in Studio, Desk and Neutral |
| `npm run check -w @the-system/angular` | green inside the full check (the CSS changes keep Angular compiling and passing) |
| Unit tests per family | each lane report lists them; every code fix of the review has its own test |
| Motion package | `packages/motion`: 284 tests, including the primitives, the spring curves of every style file and the readable stagger budget |

**Recordings.** The lead asked, after looking at the first family videos,
for clips that show the work: the long page recordings (a page of text with
small controls, 150 to 265 seconds) are replaced. `docs/reports/shots/interactions-2/record.cjs`
opens each interaction in the stage only mode (`/interactions?focus=<id>`,
one stage centred and zoomed to fit at most 2.5 times, a dot that follows
the pointer), records a clip at 960 by 540 with real pointer moves (a sweep
across up to four items of the stage, then the control), two real presses
so the motion leaves and returns, and the keyboard path by role (typing,
arrow keys, or Space held for 120ms). It writes a contact sheet per interaction and style,
`sheets/<id>.<style>.png`: one row per beat (hover, first press, second
press, keyboard), eight frames 60ms apart. It stitches the clips of each
family and style into `<family>.<style>.webm`, each under 8 MB. Styles:
Neutral light, Studio dark, Desk dark.

Every clip in the last pass found its control, and no page logged an error.
Each family clip is under 8 MB (8,000,000 bytes); 96 clips per style,
288 contact sheets in `shots/interactions-2/sheets/`.

| Family | Interactions | Neutral light | Studio dark | Desk dark |
| --- | --- | --- | --- | --- |
| actions | 11 | [4.1 MB, 1:49](shots/interactions-2/actions.neutral.webm) | [2.7 MB, 1:48](shots/interactions-2/actions.studio.webm) | [4.0 MB, 1:49](shots/interactions-2/actions.desk.webm) |
| inputs | 21 | [6.9 MB, 3:23](shots/interactions-2/inputs.neutral.webm) | [6.6 MB, 3:18](shots/interactions-2/inputs.studio.webm) | [7.0 MB, 3:26](shots/interactions-2/inputs.desk.webm) |
| selection | 14 | [5.9 MB, 2:13](shots/interactions-2/selection.neutral.webm) | [4.3 MB, 2:08](shots/interactions-2/selection.studio.webm) | [5.6 MB, 2:16](shots/interactions-2/selection.desk.webm) |
| overlays | 15 | [6.4 MB, 2:20](shots/interactions-2/overlays.neutral.webm) | [5.2 MB, 2:19](shots/interactions-2/overlays.studio.webm) | [6.8 MB, 2:26](shots/interactions-2/overlays.desk.webm) |
| navigation | 12 | [6.1 MB, 2:02](shots/interactions-2/navigation.neutral.webm) | [4.7 MB, 2:00](shots/interactions-2/navigation.studio.webm) | [6.7 MB, 2:05](shots/interactions-2/navigation.desk.webm) |
| feedback | 23 | [6.5 MB, 3:30](shots/interactions-2/feedback.neutral.webm) | [5.2 MB, 3:30](shots/interactions-2/feedback.studio.webm) | [5.7 MB, 3:40](shots/interactions-2/feedback.desk.webm) |

What the sheets showed, and what was fixed:

- The first pass zoomed every stage 2.5 times; the FormWizard stage was
  taller than the frame, so the press landed off screen and its sheet showed
  no change. The zoom now fits each stage to the frame.
- Interactions that answer a hover only (the row glide of ListBox and List,
  the Breadcrumbs, Sidebar and Navbar hover pill, the arrow nudge) showed no
  change, because the sheet began at the press. The recorder now sweeps the
  pointer across the stage's items and the sheet's first row is the hover.
- The RadioGroup stage pressed its first option, which is checked at rest,
  and the current page stage pressed the current link, so a press row
  showed nothing. A control already on (checked, selected or current) now
  hands the first press to the next one of its kind that is off, and the
  second press comes back to it, so both presses show the move.
- Rows placed by the time the script logged each beat began late or early:
  the video clock and the script's clock differ by 100 to 850ms from clip to
  clip (the video starts on the first painted frame). The recorder now flips
  a 4px square in the top left corner between black and white just before
  each beat, and each sheet row starts at the flip it reads from the clip.
  The corner is outside the sheets' crop; it shows in the stitched clips.
- Keyboard rows of buttons held still: the recorder pressed Space as a
  keydown and keyup in the same instant, which never paints a pressed
  state. It now holds Space for 120ms, as a finger does. A list, menu or
  tree (and their rows) gets ArrowDown and ArrowUp instead of Space.
- The sheets cropped the frame to its central 80%, which cut off toasts at
  the bottom edge. They now keep the whole frame less 6px at each edge.
- Two stages drove the wrong control: error-state-details pressed Retry,
  not the details toggle, and split-chevron pressed the main action, not
  the chevron. Each stage now marks the control its interaction is about
  as the trigger, which also fixes their Replay button in the gallery.
- **A real bug, fixed.** Read at full size, field-step in the zoomed stage
  drew its rolling digits below the field and to the side, then snapped into
  the box when the roll ended. The roll layer of NumberField and ScrubInput
  was placed from the drawn box (`getBoundingClientRect`), which a zoom or a
  transform on any ancestor scales (a page zoom, a dialog while it scales
  in), and with a logical inset that resolved against the layer's own
  direction (ltr, for the digits), so in a right to left page it sat on the
  wrong side wherever the input was not centred (ScrubInput: 22px off at
  zoom 1). `useDigitLayer` now places the layer from layout offsets with
  physical left and top; measured in the browser it sits within 1px of the
  input in both directions, zoomed and not. A test covers it. The same
  reading of drawn pixels as CSS pixels placed two other copies: the leaving
  copy of a FormWizard step and a SearchField (`fieldMotion.snapshot`) and the
  ghost of a removed ListBox or List item (`selectionMotion.ghostOut`). Both
  now divide by the host's drawn scale; under the stage's 1.91 zoom the
  wizard copy's offset and height match the unzoomed page to 0.03px. Every
  clip and sheet in this report was recorded after these fixes.
- The last pass, screened by the change between the first frame of each
  row and the others, then read by eye. Of 288 sheets, 12 have still press
  rows and 6 a still keyboard row, all by design. Hover only, so the
  press rows hold still and the hover row moves: link-underline,
  nav-hover-follow, card-lift. The grip of handle-grip shows on hover, so a
  press without a drag holds it; its keyboard row moves the split. A press
  dip of 3% on a small control, clear in the clip and faint in a 240px
  tile: window-lights, and the keyboard row of toolbar-press in Neutral.
  The label of field-label-focus lifts on focus, before the keyboard beat.
  Also low by design and not flagged: Studio's radio and badge pops
  (Studio has `scale.pop` 1, so the mark appears in place) and the focus
  glow (a few px).
- After the last pass no sheet shows a press, hover or keyboard beat that
  should move and does not.

## 10. Changes needed from the lead

1. **Token build: `data-motion="reduce"`.** Emit the zeroed duration and
   delay block under `:root[data-motion='reduce']` too (round 1 request 3,
   still open), then remove the copy in `apps/gallery-react/src/interactions.css`.
   Every component and recipe reduced block is now repeated under that
   selector (B2), but the durations still need the token block for apps.
2. **Generated style motion CSS (review N9).** Have `scripts/gen-index.ts`
   write `interactionRecipes(id, preset)` to `packages/styles/<id>/motion.css`
   and import it in each style's `index.css`, so a style that turns a CSS
   interaction off does so in apps, not only in the gallery.
3. **Focus return (review N4).** Radix Presence returns focus only after
   the exit. Every exit is now 100ms or less; moving the return before the
   exit needs a change in `DialogBase.tsx`, the menus and the Angular
   mirrors.
4. **Tokens for the tooltip delays (review N10).** `delay.tooltip-open`
   500ms and `delay.tooltip-skip` 300ms, kept as numbers in Tooltip.tsx today.
5. **Form group summary focus (review N22).** The group error has to reach
   the first checkbox or radio (`aria-invalid`, `aria-describedby`), a change
   in Checkbox and RadioGroup.
6. **Angular players.** Section 7: a twin of `useMotion()` and the ports
   each family lists, as an order for the Angular lanes.
7. **Desk dialog motion.** The Desk recipes keep the window grow on enter
   (`ease.window`, `duration.window-open`) rather than the soft spring; the
   exits now use `duration.quick`. Your call whether Desk dialogs take the
   spring too (delete the two `-in` lines in `packages/styles/desk/recipes/Dialog.css`
   and `CommandPalette.css`).
8. **Manifests.** Every family updated its own manifests' `motion` and notes;
   `manifests.gen.json` and the registry are regenerated and committed.
9. **ErrorState in a centred region.** Opening the details grows the block
   and, where the region centres it (an empty or error page usually does),
   moves the toggle up by half the details' height (about 4px in the
   sheets). The toggle stays under the pointer, so no rule is broken, but
   the eye loses its place. Proposed: when the details open, keep the
   block's start where it was (align it to the start of the region, or
   let the details open below without recentring). Not changed in this
   order: it is a layout choice of the component, not motion.
10. **Owner decision.** Every token, preset, primitive and interaction here is
    proposed. The clips and sheets in `docs/reports/shots/interactions-2/` and
    the `/interactions` page are what to look at.
