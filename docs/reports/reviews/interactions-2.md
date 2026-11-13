# Review: interaction round 2

Fresh eyes review by ds-qa of order 1.22, the 96 interactions of the round 2
registry in `packages/motion/src/interactions/`. Branch
`claude/ds-review-interactions-2`, cut from `claude/relaxed-hypatia-7gseap`.
No component source, CSS, token, manifest or test was edited.

Four reviewers split the work, each as claude-opus-5-5 at medium. Three
measured the interactions in Chromium, two families each. One ran the
contract suite, axe, target sizes and the Angular gallery, and rechecked the
six round 1 blockers. The lead read the code behind every blocker before it
went into this file, and answered one question from the lead session
(switch-stretch, finding B5).

Evidence is under `docs/reports/reviews/shots/interactions-2/`:

- `<id>.sheet.png`: a contact sheet per interaction. Rows are Studio, Desk
  and Neutral. Columns are frames after the trigger.
- `<id>.measure.json`: every run of that interaction.
- `probe.cjs`: the shared sampler. `BRIEF.txt`: the shared brief.
- Files that start with `qa-actions-inputs.`, `qa-selection-overlays.` and
  `qa-navigation-feedback.` belong to the three measuring reviewers.
- Files that start with `contract.`, `axe.`, `target.`, `angular.` and
  `recheck.` belong to the regression reviewer.
- `lead-switch-stretch.frames.png` and `.json`: the switch frames for B5.

The builder's report `docs/reports/interactions-2.md` was read only for its
list of ids until these findings were formed.

## How it was measured

- React gallery, stage only mode:
  `/interactions?focus=<id>&style=<studio|desk|neutral>&scheme=<dark|light>&chrome=0`,
  and the same with `&dir=rtl&lang=ar`. Studio and Desk ran dark, Neutral
  light, with one light run per style where color mattered.
- Every interaction ran in three motion modes:
  - full;
  - media, which is `prefers-reduced-motion: reduce` emulated;
  - attr, which is `data-motion="reduce"` on `<html>`, the gallery's switch.
- `document.getAnimations()` was sampled on every frame. Each sample kept the
  timing (`getComputedTiming()`), the keyframes, the properties and the first
  and last frame seen. The trigger's state attributes and the focused
  element's ring were sampled on the same frames.
- Rapid triggers ran 30ms apart. Interrupted triggers reversed the action
  before the motion ended.
- The `off` rows of the registry were injected under `@layer ds.recipes`.
- Contact sheets pause every animation and seek it to each time.
- The machine has 4 cores and was shared by four reviewers, at a load of 18
  to 50. The durations below are the values the animations carry, and they
  matched the motion tokens in every run. Wall clock times are used only for
  the order of events.

`npm run check` is green on this branch, 13 of 13 steps.

## Verdicts

| Area | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| Rules of order 1.22, 96 interactions | fix needed | 8 (B1 to B8) | 33 |
| Richness | the ask is met for most of the set: 21 of 24 round 1 ids are richer, and 43 of 72 new ids have more than one beat in every style that plays them. Desk carries most of it, Studio is flat by subtraction, and Desk and Neutral often share one shape | | |
| Regressions | contract suites green (React 3072 passed, Angular 1779 passed); one new critical axe violation (B8); reduced motion under the media query regressed (B1, B2) | | |
| Round 1 blockers | all six fixed; B2 regressed under the media query | | |
| Acceptance evidence of 1.22 | fix needed | 1 (B9) | |

Read B1, B2 and B4 first. B1 and B2 mean the person's own reduced motion
setting does not stop about 32 interactions. The gallery's own switch hides
this. B4 shows wrong numbers to a sighted Arabic reader.

## Part 1: the 96 interactions

Read the columns this way:

- Durations are Studio / Desk / Neutral, in ms, as the animation carries
  them. "+ 45" is a stagger delay. "Round 1" gives the round 1 value where
  the id existed then.
- "Reduced, media / attr" says what moves under the person's
  `prefers-reduced-motion` setting, then under the gallery's
  `data-motion="reduce"` switch. "still" or "none" means nothing moves.
  "identity only" means animations run between equal transforms, so nothing
  moves on screen. Bold means something moves that the registry says should
  not.
- "Rules" is pass, or the finding that breaks a rule.
- "Richness" is "richer", "same as round 1" or "too much" for the 24 ids of
  round 1. For the 72 new ids it is "new, rich" (more than one beat) or "new,
  flat" (one beat), with the style it holds for.

What held for all 96:

- **Properties.** Only `transform` and `opacity` animate, with `translate`,
  `scale` and `rotate`. No computed `transition-property` named anything
  else, before or after the trigger, and none named `all`.
- **Action first.** The state, value and focus changed on or before the
  first frame of motion in every run. A press and hold dip starts on pointer
  down and the state changes on release, which is the right order.
- **No stuck state.** Rapid and interrupted runs ended in the right state
  with transform and opacity at rest, no fill held and no leftover node. The
  exceptions are B5 and B6.
- **Hit tests.** At each control's rest centre the hit test stayed on the
  control during the motion, except for FLIP lists (N24) and a trigger moved
  by an inserted message (N12).
- **Focus ring at once.** On every control, after Tab, the ring is at full
  opacity on the first frame. The ring inside a fading overlay is N7.
- **Flash and loops.** Nothing flashes more than three times a second. The
  skeleton band, status pulse and avatar ring run 1.4s three times and stop
  at 4.2s. The spinner is the only endless loop (N21).
- **Staggered text.** Every staggered part reached opacity 0.9 within 20 to
  180ms. The slowest are the Desk menu rows and state actions, at 170 and
  180ms.
- **No wait on end events.** No code waits on `transitionend` or
  `animationend`. The `.finished` and `settled()` calls in
  `NumberField/useDigitLayer.ts:82`, `Input/fieldMotion.ts:247`,
  `internal/indicator.ts:372`, `Button/ButtonBase.tsx:126`,
  `CopyButton.tsx:136`, `PasswordField.tsx:128`, `InlineEdit.tsx:176` and
  `Alert/ghost.ts:75` remove decorations only. The exceptions that hold
  focus are N6 and N8.
- **Tokens.** Every measured duration and ease matched a motion token. The
  raw values left are N20.
- **Under `data-motion="reduce"`** nothing timed over 0ms in any of the 96,
  and the round 1 size changes stay at rest. The two that still shift are
  B3.
- **A style can turn it off.** Every `off` row injected under
  `@layer ds.recipes` stopped its travel and scale, and left at most the
  documented fade. Every WAAPI interaction passes its id to
  `useMotion().mode()` (`packages/react/src/internal/motion.ts:57`), so a
  preset row can set it to `none`. The gaps are N2 and N19.

### Actions and toggles

| Interaction | Beats measured | Duration S / D / N (ms) | Properties | Reduced, media / attr | Rules | Richness |
| --- | --- | --- | --- | --- | --- | --- |
| `button-press` | dip to 0.97 on `duration.instant`; release on the spring (Studio 3 steps, Desk 25% swing, Neutral 6%) | 70 + 120 / 70 + 440 / 70 + 220 | transform | still / still | pass | richer |
| `segment-press` | parts dip, spring back; neighbours still | 80 + 80 / none (label roll plays instead) / 180 + 180 | transform | still / still | pass; N4 | new; rich in Neutral, flat in Studio, broken in Desk |
| `button-loading` | root dip, label rolls out, spinner pops; back: spinner shrinks, label rolls in; width held | 120 / 485 / 244; back 100 / 385 / 244 | transform, opacity | label cut at once / same | pass | new, rich |
| `copy-swap` | icon rolls out, check turns in from -45deg past size, button swells | 120 / 485 / 244 | transform, opacity | still / still | pass | richer |
| `button-nudge` | end part nudges toward the inline end; mirrors in RTL | 80 / 300 / 180 | transform | still / still | pass | new, rich |
| `close-turn` | quarter turn of the glyph, Desk overshoot | 80 / 300 / 180 | transform | **turns** / jumps | **B1** | new, rich |
| `split-chevron` | hover drop, half turn on open, menu scales in with rows | 80 / 300 / 180; rows 100 / 460 / 292 | transform, opacity | **turns** / jumps | **B1, B6** | new, rich |
| `fab-morph` | plus turns an eighth to a close mark; label slides out from behind the icon | 80 / 300 / 180 | transform, opacity | **turns** / jumps | **B1, B6** | new, rich |
| `toggle-pop` | parts pop to `scale.pop`, staggered (Desk 45, Neutral 24) | none / 525 / 244 | transform | still / still | pass | new; flat in Studio |
| `switch-stretch` | thumb stretches toward its travel, track dips, bouncy travel, tint sweeps in | 70, then 120 / 440 / 220; tint 100 / 340 / 220 | transform, opacity | jump / jump | **B7** | richer, but reads as a glitch in Neutral and Desk |
| `link-underline` | line draws from the inline start, exits faster; external icon nudges | 100 / 320 / 200; icon 80 / 300 / 180 | transform | **draws** / at once | **B1** | new, flat |

### Inputs and forms

| Interaction | Beats measured | Duration S / D / N (ms) | Properties | Reduced, media / attr | Rules | Richness |
| --- | --- | --- | --- | --- | --- | --- |
| `focus-glow` | ring at once; glow fades and grows (from 1 / 0.9 / 0.97) | 100 / 340 / 220; out 100 | transform, opacity on `::before` | **glow fades** / at once | pass, ring at once; B1 | same as round 1 |
| `error-shake` | decaying swings toward the inline end, mirrored in RTL | none / 440 / 220 | transform | still / still | pass | richer in Desk and Neutral |
| `field-label-focus` | label rises a nudge | 80 / 300 / 180 | transform | glow fade / still | pass | new, flat |
| `field-message-enter` | slides from above and fades; readable at 20 / 44 / 77ms | 100 / 340 / 220 | transform, opacity | still / still | pass; N12 | new, flat |
| `field-error-enter` | message slides, icon lands past size one step later, input shakes; readable at 43 to 53ms | 120 / 485 / 244 | transform, opacity | still / still | pass; N12 | new, rich |
| `password-reveal` | eye turns out and shrinks, new glyph turns in past size, input text fades in | 120 / 440 / 220 | transform, opacity | still / still | pass; N13 | richer |
| `search-clear` | glyph turns in from -90deg past size; out, a copy turns out and fades | in 120 / 440 / 220; out 100 / 320 / 200 | transform, opacity | **fade** / at once | pass; B1 | new, rich |
| `search-submit` | glyph dips with -12deg, springs back | 120 / 440 / 220 | transform | **fade** / at once | pass; B1 | new, rich |
| `otp-fill` | pasted characters land from `scale.morph`, two stagger steps | 120 (fade) / 390, wave to 570 / 228 | transform, opacity | **fade** / still | pass | richer |
| `otp-caret` | caret slides and fades | 80 / 300 / 180 | transform, opacity | **fade** / at once | pass | new, flat |
| `otp-complete` | cells lift in a wave (Desk only) | fade 120 / 570 / none | transform | **fade** / still | pass; N3 | new; Desk only |
| `field-step` | digits roll in clipped columns, last digit first | 120 (fade) / 340 / 220 | transform, opacity | glow fade / still | pass | richer in Desk and Neutral |
| `scrub-roll` | digit roll; handle swells while dragged | 120 / 340 / 220; handle 120 / 440 / 220 | transform, opacity | still / still | pass | new, rich |
| `inline-edit-morph` | pencil turns into a check, cancel lands one step later | 120 / 485 / 244 | transform, opacity | **fade** / still | pass | new, rich |
| `form-summary-enter` | summary scales in, icon lands, title and body staggered, rows slide; readable at 118 to 157ms | 120 / 485 / 268 | transform, opacity | glow fade / still | pass; N3 | new; rich in Desk only |
| `form-submit-success` | submit pops to `scale.pop` and springs back | none / 480 / 220 | transform | still / still | pass | new; none in Studio |
| `wizard-step` | old step slides out toward the start, new step slides in, check lands | 120 / 440 / 244 | transform, opacity | still / still | pass; N14 | new, rich |
| `wizard-done` | marks dip and spring back in a wave | none / 530 / none | transform | still / still | pass; N3 | new; Desk only |
| `consent-check` | box wipe, mark grows from `scale.morph` | 120 / 440 / 220 | transform, opacity | jump / jump | pass | new, rich |
| `rating-fill` | only the changed stars land; the chosen one last, on the bouncy spring | 120 (fade) / 530 / 268 | transform, opacity | still / still | pass; round 1 N1 fixed; N15 | richer |
| `rating-preview` | stars joining the preview dip toward the pointer, staggered | 120 / 530 / 268 | transform | still / still | pass | new, rich |

### Selection

| Interaction | Beats measured | Duration S / D / N (ms) | Properties | Reduced, media / attr | Rules | Richness |
| --- | --- | --- | --- | --- | --- | --- |
| `check-draw` | dip, clip and mark draw with overshoot, select all cascade, fade out | dip 70; draw 120 in 3 steps / 440 / 220; cascade 0 / 45 / 24 a step; out 80. Round 1: 140 / 140 / 180 | transform, opacity | none / none, no dip | pass | richer |
| `radio-pop` | dip; new dot pops past size, old dot shrinks; circle springs back | 120 steps / 440 / 220; Studio a 100 fade (gallery `off` row) | transform, opacity | identity only / none | pass | new, rich; flat in Studio |
| `radio-card-lift` | dip to 0.97, lift 0 / 4 / 2px, dot pops, old card settles | 120 / 440 / 220; settle 340 / 220 | transform, opacity | identity only / none | pass | new, rich; flat in Studio |
| `slider-pull` | grab grows to 1.08 / 1.3 / 1.15; release dips under size | in 80 / 300 / 180; out 120 / 440 / 220. Round 1: 120 / 120 / 150 | transform | identity only / no lift | pass; round 1 B2 fixed here | richer |
| `slider-bubble` | bubble rises, digits roll one column a step, drops on release | 120 / 440 / 220; digits 120 fade / 300 + 45 / 180 + 24; out 100 | transform, opacity | identity only / none | **B4** | new, rich |
| `slider-nudge` | one swing | 120 / 120 / 180 | transform | none / none | pass | same as round 1 |
| `picker-chevron-turn` | half turn with overshoot | 80 in 2 steps / 300 / 180 | transform | none / none | pass | new, flat |
| `menu-rows` | surface, then rows cascade (Desk only); rows readable at 90 / 90 to 140 / 120ms | Desk rows 340 at +45, +90; Studio and Neutral a 120 / 150 fade; surface 120 / 120 / 150 | transform, opacity | none / none | pass; N3 | new; rich in Desk only |
| `picker-value-roll` | label rises with overshoot | 80 steps / 300 / 180 | transform, opacity | none / none | pass | new, flat |
| `row-glide` | fill travels, stretches at 45% of the way, settles | 80 steps / 300 / 180 | transform | none / none | pass | new, rich |
| `collection-flip` | rows move, the new one rises and pops, a removed copy shrinks while the gap closes | move 80 / 300 / 180; in 120 / 440 / 220; out 100 | transform, opacity | none / none | pass; rapid add and remove leaves 3 rows, 0 copies | new, rich |
| `chip-check-pop` | glyph turns in and pops; clearing plays nothing | 120 steps / 440 / 220 | transform, opacity | none / none | pass; N16 | new, flat |
| `filter-count-roll` | count rolls by column, chips and count move (FLIP), clear button pops | roll 120 fade / 300 + 45 to 90 / 180 + 24 to 120; FLIP 80 / 300 / 180 | transform, opacity | none / none | **B4** | new, rich |
| `list-stagger` | rows rise staggered in Desk; a fade in Studio and Neutral; readable at 90 / 20 to 110 / 120ms | 120 fade / 180 at +0, +45, +90, plus a 300 FLIP / 150 fade. Round 1: 120 / 340 / 150 | transform, opacity | none / none | pass; N10 | same as round 1 |

### Overlays

| Interaction | Beats measured | Duration S / D / N (ms) | Properties | Reduced, media / attr | Rules | Richness |
| --- | --- | --- | --- | --- | --- | --- |
| `menu-origin` | surface travels 2 / 6 / 4px and grows from 0.97 with overshoot; rows rise a step apart; faster exit; rows readable at 80 / 140 to 170 / 90 to 180ms | in 80 steps / 300 / 180; rows 100 / 340 / 220 up to +120 / +144; out 100. Round 1: 120 / 120 / 150 | transform, opacity | none / none | pass; round 1 N2 fixed; B6 | richer |
| `menu-row-slide` | fill slides between rows and across separators | 80 steps / 300 / 180 | transform | none / none | pass | new, rich |
| `menu-submenu-nudge` | chevron leans 1 / 3 / 2px and comes back; submenu opens from that side | 120 / 440 / 220 | transform | **moves** / **still shifted** | **B3** | new, flat |
| `popover-spring` | surface lands on the bouncy spring; title and body a step apart; hover card in three parts | 120 steps / 440 / 220; parts 100 / 340 + 45, + 90 / 220 + 24, + 48; out 100 | transform, opacity | **parts move** / none | **B2** | new, rich |
| `tooltip-rise` | rise with overshoot, shortcut one step later, faster exit | 80 steps / 300 / 180; out 100. Round 1: 120 / 120 / 150 | transform, opacity | none / none | pass | richer, a little |
| `tooltip-follow` | the new tooltip slides from where the old one was | 80 / 300 / 180; old one fades 100 | transform, opacity | none / none | pass; N17 | new, rich |
| `dialog-spring` | backdrop and panel; parts a step apart; AlertDialog icon pops; faster exit | Studio 100, parts together; Desk 300 from 0.92, parts 340 at +45 to +120, icon 440; Neutral 220, parts +24 / +48 / +72; out 100. Round 1: 120 / 300 / 150 | transform, opacity | **parts move** / none | **B2** | richer |
| `sheet-spring` | panel slides with no fade, body one step later, faster exit | 100 / 340 / 220; body +0 / +120 / +72; out 100. Round 1: 180 / 180 / 180 | transform | **body moves** / none | **B2** | richer |
| `command-palette-open` | panel rises, key hints one step later | 80 steps / 300 / 180; out 100 | transform, opacity | none / none | pass | new, rich |
| `command-palette-results` | rows cascade in Desk; rows that stay move (FLIP) while typing; readable at 30 to 90 / 40 to 140 / 30 to 120ms | Desk 340 at +45, +90; Studio and Neutral a 120 / 150 fade; FLIP 300 in Desk | transform, opacity | none / none | pass | new; rich in Desk only |
| `command-palette-row-slide` | fill slides | 80 steps / 300 / 180 | transform | none / none | pass | new, flat |
| `lightbox-zoom` | image grows from the thumbnail (FLIP), then toolbar, arrows and caption; shrinks back on close | 100 / 340 / 220; parts +24 / +45; out 120 / 120 / 150 | transform, opacity | **parts move** / none | **B2** | new, rich |
| `tour-spotlight` | ring closes in, panel lands, parts stagger; on Next the ring travels and the panel trails a step | ring 80 / 300 / 180; panel 120 / 440 / 220; follow 100 / 340 + 45 / 220 + 24 | transform, opacity | **parts move** / none | **B2** | new, rich |
| `window-settle` | Desk: grow, then a swell at 55% of the open and zoom; a gather before close. Studio and Neutral: a fade | Desk open 300, settle 440 at +165 (605 in all); zoom 280, settle at +154; close 220, gather 100; Studio and Neutral 120 / 150 | transform, opacity | none / none | pass; N8 | new; rich in Desk only |
| `window-lights` | colors fade, glyphs pop a step apart, a press dips the dot | pop 440 + 45 / 220 + 24; dip on the snappy spring; Studio a fade | transform, opacity | **pop plays, dot dips** / **dot dips** | **B3** | new, rich in Desk and Neutral |
### Navigation

| Interaction | Beats measured | Duration S / D / N (ms) | Properties | Reduced, media / attr | Rules | Richness |
| --- | --- | --- | --- | --- | --- | --- |
| `tab-slide` | pill slides and stretches (up to 1.66 at the start); overshoot Desk 19px, Neutral 3px, Studio 2 steps; the left label dips, the reached label pops | slide 80 / 300 / 180; labels 120 / 440 / 220. Round 1: 140 / 140 / 180 | transform | none / none | pass; **B8** on its stage | richer |
| `nav-current-slide` | bar slides and stretches (1.36 / 1.56 / 1.35), Desk overshoot 16.5px; Sidebar label and Rail icon dip and pop | 80 / 300 / 180; answers 120 / 440 / 220 | transform | none / none | pass | new, rich |
| `nav-hover-follow` | hover pill fades in and slides from the neighbour with stretch; separator leans; underline draws | lean 80 / 300 / 180; underline 100 / 320 / 200 | transform, opacity | **underline draws** / none | **B1** | new, rich |
| `pagination-roll` | arrow winds up; changed slots roll digit by digit (stagger 0 / 45 / 24); current label pops | roll 80 / 300 / 180; pop 120 / 440 / 220 | transform, opacity | none / none | **B4, B5** | new, rich |
| `sidebar-collapse` | width at once; labels, counts and group title slide in staggered; icons pop | labels 100 / 340 + 90 / 220 + 120; icons 80 / 300 / 180 | transform, opacity | none / none | pass | new, rich |
| `stepper-travel` | ring travels, stretches and fades; new indicator pops; connector fills | ring 80 / 300 / 180; pop 120 / 440 / 220; fill 100 / 340 / 220 | transform, opacity | none / none | pass | new, rich |
| `toc-travel` | the stretch plays, but the bar jumps: no travel | 80 / 300 / 180 | transform | none / none | pass; N18 | new, broken |
| `tab-bar-pop` | icon pops from a dip; label rises one step later | 120 / 440 + 45 / 220 + 24 | transform | **plays in full** / none | **B2**; N19 | new; rich in Desk |
| `dock-lift` | hovered icon lifts and grows (Desk 1.31, Neutral 1.01 and 2px, Studio nothing); neighbours swell; current tile pops | 120 / 440 / 220 | transform; label opacity | none / none | pass; N20 | new; rich in Desk only |
| `toolbar-press` | dip on press, spring back on release, icon gathers and pops | press 70; release 120 / 440 / 220; icon 80 / 300 / 180 | transform | **icon pops** / none | **B2** | new, rich |
| `language-roll` | name rolls a line with a fade; pair link dips and pops; readable at 80ms | 80 / 300 / 180; pair 120 / 440 / 220 | transform, opacity | none / none | pass | new, rich |
| `skip-link-slide` | slides in 4 / 12 / 6px, Desk overshoot; ring at once | 120 / 440 / 220 | transform | none / none | pass | new, small but right |

### Feedback and content

| Interaction | Beats measured | Duration S / D / N (ms) | Properties | Reduced, media / attr | Rules | Richness |
| --- | --- | --- | --- | --- | --- | --- |
| `alert-entrance` | surface rises and grows; icon pops a step later (Desk peak 1.17); text two steps later; readable at 40 / 140 / 100ms | 100 / 340 / 220; icon 120 / 440 + 45 / 220 + 24; text +0 / +90 / +48 | transform, opacity | none / none | pass | new, rich |
| `alert-dismiss` | state first; a copy shrinks and fades; content below slides up (Desk overshoot) | copy 100 all; gap 80 / 300 / 180 | transform, opacity | none / none | pass | new, rich |
| `state-illustration` | icon drops and scales; title, body and actions cascade; actions readable at 20 / 180 / 120ms | icon 120 / 440 / 220; text +0 / +45 to +120 / +24 to +72 | transform, opacity | **7 animations play** / none | **B2** | new, rich |
| `error-state-details` | chevron turns | 80 / 300 / 180 | transform | none / none | pass; N23 | new, flat |
| `accordion-reveal` | layer slides and fades; children stagger; chevron turns; readable at 80 / 80 to 160 / 80 to 120ms | layer 180 all; chevron 80 / 300 / 180. Round 1: 180 all | transform, opacity | none / none | pass; round 1 N6 fixed | richer |
| `skeleton-swap` | band sweeps 1400ms three times and stops at 4.2s; the placeholder cross fades into the content | 1400 x 3 all; fade 100 / 320 / 200 | transform, opacity | **fade plays** / none | **B1**; no flash | richer |
| `stat-roll` | digits roll last first (stagger 0 / 45 / 24); trend mark nudges | 80 / 300 + 90 / 180 + 48; trend 120 / 440 / 220. Round 1: 120 / 300 / 180 | transform, opacity | none / none | **B4**; round 1 N3 fixed | richer |
| `toast-enter` | toast travels and grows; icon pops a step later; readable at 40ms | 120 / 440 + 45 / 220 + 24. Round 1: 140 / 140 / 180 | transform, opacity | none / none | pass | richer |
| `toast-stack` | toasts that stay move (FLIP, Desk overshoot); the new one enters | 80 / 300 / 180 | transform, opacity | none / none | pass; N24 | richer |
| `toast-swipe` | follows the finger; a short release springs back; past the line it leaves | back 80 / 300 / 180; out 120 / 120 / 150. Round 1: 120 / 120 / 150 | transform, opacity | none / none | pass | richer, a little |
| `notification-change` | new entry rises and pops; others move; count rolls and pill pops | in 120 / 440 / 220; move 80 / 300 / 180; pop 120 / 480 / 220 | transform, opacity | none / none | pass; N24 | new, rich |
| `progress-spring` | fill eases on the soft spring; ring arc turns into place; value rolls | 100 / 340 / 220; roll 80 / 300 + 45 / 180 + 24 | transform, opacity | none / none | pass | new, rich |
| `progress-celebrate` | once at the end: dip, pop, settle (Desk 0.90 to 1.13, Neutral 0.96 to 1.04, Studio none) | none / 480 / 220 | transform | none / none | pass; no flash | new; rich in Desk |
| `meter-fill` | fills from 0 once on first view | 640 / 640 / 640 | transform | none / none | pass | new, flat; no style difference |
| `avatar-status` | dot dips and pops; ring grows to 2.5x and fades, 1.4s three times (4.2s) | pop none / 480 / 220; ring 1400 x 3 | transform, opacity | none / none | pass; `pauseLoops` pauses it; N20 | new, rich |
| `status-pulse` | dot beat plus ring, 1.4s three times, stops on its own | 1400 x 3 all | transform, opacity | none / none | pass; under 5s; under 2.4 changes a second on 257 to 555 px | new, rich |
| `avatar-group-change` | new avatar rises and pops; others slide; overflow count rolls and pops | 120 / 440 / 220; slide 80 / 300 / 180 | transform, opacity | none / none | pass; 10 fast clicks end right | new, rich |
| `badge-count` | digits roll; badge dips and pops | roll 80 / 300 / 180; pop 120 / 480 / 220 | transform, opacity | none / none | pass; N22 | new, rich |
| `card-lift` | card lifts and grows (Desk 4px and 1.03, Neutral 2px and 1.01, Studio none); highlight follows the pointer | 100 / 340 / 220; glow 150 | transform, opacity | none / none | pass | new; rich in Desk |
| `spinner-loop` | fades in, then an endless 800ms turn | fade 100 / 340 / 220 | transform, opacity | none / none | pass; N21 | new, flat |
| `kbd-press` | keycap dips and holds; on release springs back past rest in Desk | 80 / 300 / 180; 120 / 440 / 220 | transform | none / none | pass | new, rich |
| `handle-grip` | grip grows along the line | 120 / 440 / 220 | transform, opacity | none / none | pass | new, small |
| `split-view-pane` | pane slides 4 / 12 / 6px | 100 / 340 / 220 | transform | **slides** / none | **B2** | new, flat |

### Richness against the owner's ask

The owner found round 1 acceptable but too plain. Counted from the table:

| Group | Count |
| --- | --- |
| Round 1 ids now richer (more beats, springs, a secondary part) | 21 of 24 |
| Round 1 ids the same as round 1: `slider-nudge`, `list-stagger`, `focus-glow` | 3 of 24 |
| New ids with more than one beat in every style that plays them | 43 of 72 |
| New ids rich in Desk only | 10 of 72 |
| New ids with one beat | 13 of 72 |
| New ids that do not play as described: `toc-travel` (N18) | 1 of 72 |
| Too much | none |

So the ask is met for most of the set. No interaction reads as too much.
Three things still hold it back. The richest forms live in Desk. Studio is
flat because beats are turned off, not because it has a hard cut character
of its own. And three of the most visible interactions, `switch-stretch`,
`pagination-roll` and `stat-roll`, are broken in a way a person sees (B7, B5,
B4).

**The ten weakest**

1. `toc-travel`: the bar jumps and stretches in place. The travel never
   plays (N18).
2. `menu-submenu-nudge`: a 1 to 3px lean nobody sees, and it breaks the
   reduced form (B2, B3).
3. `slider-nudge`: unchanged from round 1, 120ms in both Studio and Desk.
4. `list-stagger`: unchanged. A fade in Studio and Neutral, and Desk plays
   a FLIP on top of the stagger (N10).
5. `meter-fill`: one beat, 640ms in every style, slow for Studio, and empty
   until the meter is seen (N28).
6. `split-view-pane`: a 4 to 12px slide with no other beat, and it plays
   under reduced motion (B2).
7. `link-underline`: one scale draw, the same shape in every style, and it
   draws under reduced motion (B1).
8. `field-label-focus`: a 1 to 3px rise that is hard to see.
9. `chip-check-pop`: one beat; clearing plays nothing and the siblings jump
   (N16).
10. `picker-value-roll`: one beat, the same shape as `language-roll` with
    less to say.

`segment-press` would sit here too for Desk, where the label roll replaces
it (N4).

**The ten strongest**

1. `tab-slide`: a pill that travels and stretches, an overshoot in Desk, and
   the old and new labels answer. It runs in four lists.
2. `menu-origin`: the surface overshoots from the trigger corner, the rows
   rise a step apart, the exit is faster, and the RTL origin is now right.
3. `copy-swap`: the icon rolls out, the check turns in past size and the
   button swells.
4. `button-loading`: dip, label roll and spinner pop, with the width held to
   the pixel.
5. `alert-entrance`: three clear beats, readable at 40 to 140ms.
6. `notification-change`: enter, FLIP, count roll and pill pop at once.
7. `lightbox-zoom`: a real FLIP from the thumbnail, with the parts after it.
8. `tour-spotlight`: the ring travels and the panel trails it by a step.
9. `collection-flip`: moves, pops and an exit copy, clean under rapid input.
10. `field-error-enter`: the message slides, the icon lands a step later and
    the input shakes. Readable within 53ms.

`switch-stretch` has the best choreography of the set (four parts, distinct
per style) and would rank first if B7 were fixed. `stat-roll` and
`rating-fill` come next.

### Where the three styles do not differ enough

- **Desk and Neutral share one shape.** Desk is about Neutral times 1.5 with
  more overshoot. Neutral's springs overshoot 0.3 to 4% in scale and 0.2 to
  3px in travel, which reads as an ease out. This holds for `focus-glow`,
  `field-label-focus`, `field-message-enter`, `link-underline`,
  `password-reveal`, `search-submit`, `close-turn`, `button-nudge` and most
  pops. Order 1.22 asked for "further apart".
- **Studio is flat by subtraction.** It plays nothing or a 100 to 120ms
  fade for these: `toggle-pop`, `form-submit-success`, `wizard-done`,
  `otp-complete`, `error-shake`, `field-step`, `scrub-roll`, `dock-lift`,
  `card-lift`, `progress-celebrate`, `avatar-status`, `menu-rows`,
  `command-palette-results` and `list-stagger`. Its steps show only on the
  snappy and bouncy springs, at 80 and 120ms. Its soft spring is a smooth
  `cubic-bezier(0, 0, 0.2, 1)`, so its panels, sheets, sidebar labels,
  progress bar, card and meter are smooth slides, not hard cuts.
- **Studio and Neutral are the same plain fade** for `menu-rows`,
  `command-palette-results` and `list-stagger` (120 against 150ms). Only Desk
  cascades. `window-settle` is a fade in both.
- **Same value in all three styles:** `meter-fill` 640ms, the accordion layer
  180ms, the alert dismiss copy 100ms, the toast swipe exit 120 / 120 / 150,
  the skeleton band and status pulse 1400ms, and `slider-nudge` 120ms in
  Studio and Desk.
- Some Studio differences exist only in the gallery, where the `off` rows
  are injected: `radio-pop`, `window-lights` and the submenu nudge. In an
  app Studio plays them in full (N2).



## Part 2: regressions

### Contract suite

`npm run contract -- --framework react` ran over the 96 touched components and
the components that render them, with 2 workers. Result: **3072 passed, 0
failed, 102 skipped.** Nothing failed, so nothing needed a rerun alone.
Evidence: `contract.react.json`.

| Pass / fail / skip | Components |
| --- | --- |
| 44 / 0 / 0 | Accordion, AlertDialog, Breadcrumbs, Combobox, CommandPalette, ContextMenu, Dialog, Drawer, DropdownMenu, HoverCard, LanguageSwitch, Lightbox, Menubar, MultiSelect, Popover, Select, Sheet, SplitButton, Toast, Tour |
| 29 / 0 / 0 | Alert, AvatarGroup, Banner, Button, ButtonGroup, Card, Checkbox, CheckboxGroup, Chip, CloseButton, ConsentField, CopyButton, Dock, EmptyState, ErrorState, Field, Fieldset, FloatingActionButton, Form, FormWizard, IconButton, InlineEdit, Input, InputGroup, Link, List, ListBox, NotificationCenter, NumberField, OTPField, Pagination, PasswordField, PhoneField, RadioCard, RadioGroup, Rail, RangeSlider, Rating, ResizablePanels, ScrollArea, ScrubInput, SearchField, SegmentedControl, SkipLink, Slider, SplitView, Stepper, Switch, TabBar, TableOfContents, Tabs, Textarea, Tile, ToggleButton, ToggleGroup, Tooltip, Window, WindowControls |
| 29 / 0 / 15 (the open runs skip) | Autocomplete, FilterBar, Navbar, Sidebar, TagField, Toolbar |
| 28 / 0 / 1 (no keys) | Avatar, Badge, Callout, FieldError, Kbd, Meter, ProgressBar, ProgressCircle, Skeleton, Spinner, Stat, StatusDot |

Accordion now runs its open checks, so round 1 note N12 is fixed.

The contract suite is green, but it did not catch B4, B5 or B7. They need a
visible text check in RTL and a check of the frames in the middle of a
motion. N33 asks for both.

### Axe

Axe ran with the wcag2a, wcag2aa, wcag21aa and wcag22aa rules.

- **`/interactions`.** It ran in Studio dark, Desk dark, Neutral light and
  Neutral light Arabic RTL. Each setup ran at rest, and again after "replay
  all" with every animation frozen at 50% (49 to 59 animations). All eight
  runs show one critical `aria-valid-attr-value` (B8). Freezing mid motion
  adds nothing. Evidence: `axe.interactions-page.json`.
- **Component pages.** Each touched component's own page ran in Neutral
  light and Studio dark, English and Arabic. 95 of 96 are clean. Navbar
  shows `aria-hidden-focus` on the Radix focus proxy. That rule is already
  skipped in `Navbar.manifest.json:135`, so it is not a regression.
  Evidence: `axe.components.json`.

### Target size (WCAG 2.5.8)

411 interactive elements on `/interactions`, at rest and at 50% of motion,
per setup (`target.interactions-page.json`). One element is under 24px
everywhere: the HoverCard link in the `popover-spring` stage, 19 to 24px
tall. It passes by the spacing exception (N30). In Desk dark, two alert close
buttons dip just under 24px while the alert entrance plays, and are 24px at
rest.

### Angular gallery

Angular shares `packages/css`. In Neutral, LTR and RTL, the same action ran on
each component page in both galleries
(`angular.interactions-play.neutral.json`).

| Result | Interactions |
| --- | --- |
| Plays with no Angular code, same timing as React | `button-press` (Button, IconButton, CloseButton, FloatingActionButton), `segment-press`, `button-nudge`, `close-turn`, `check-draw` (Checkbox and CheckboxGroup; inert in round 1, it now plays), `rating-preview`, `menu-origin`, `alert-entrance` (Alert, Banner, Callout), `state-illustration`, `error-state-details`, `skeleton-swap`, `toast-enter`, `progress-spring`, `status-pulse`, `spinner-loop`, `field-label-focus`, most `focus-glow` rows |
| Plays, a part missing in Angular | `switch-stretch` (the track tint layer `Switch.tsx:151` is React only), `radio-card-lift` (the inner span `RadioCard.tsx:156`), `slider-pull` (the value bubble). See N25 |
| React only, as planned | the WAAPI morphs, `menu-rows` |
| Broken or inert | none. No target box moved and no state stuck |
| Not compared | `fab-morph` and `link-underline` (the generic action fired nothing in React either); TitleBar and WindowControls (no Angular page, N27) |

Pixel diff at rest, 60 components, 1024px, threshold 0.1, Studio dark and
Neutral light, LTR and Arabic RTL (`angular.pixel-diff.json`):

- 0 differing pixels for 50 components.
- Small or demo only: NotificationCenter 45px, StatusDot 8px, RadioCard 1px,
  and Switch 57 to 60px (the Arabic state text, as in round 1).
- ToggleGroup, 3121 to 4075px: React draws the selected fill with the shared
  sliding indicator, Angular on the item. The edges differ by about 1px
  (N26).
- FilterBar, 14202 to 20191px: the React Arabic count is broken (B4), the
  Angular one is right.
- Meter, 30770 to 36058px: React holds a meter that has not been seen at an
  empty bar (N28).

The Angular contract suite on 58 ported components: **1779 passed, 0 failed,
53 skipped** (`contract.angular.json`).

## Part 3: the six round 1 blockers

| # | Round 1 blocker | Status | Evidence | File and line |
| --- | --- | --- | --- | --- |
| B1 | Focus ring fades in on Checkbox, Switch, Rating, Slider (2.4.7) | fixed | After Tab, the ring is at opacity 1 on the first frame (1 to 19ms) in all three styles, LTR and Neutral RTL. Its transition is `all 0s`. `recheck.b1.json`, `recheck.b1.*.ring.png` | `packages/css/src/components/Checkbox.css:143-151`, `Switch.css:154-163`, `Rating.css:121-129`, `Slider.css:170-178` |
| B2 | Press, stretch and lift scales under `data-motion="reduce"` (2.3.3) | fixed under the attribute; **regressed** under the media query | Held under the attribute: Button and ToggleButton `matrix(1, 0, 0, 1, 0, 0)`, Switch and Slider thumbs at identity, all styles (`recheck.b2.json`). The sweep of every round 2 interaction under the attribute finds nothing over 0ms (`recheck.reduce-sweep.*.json`). But round 1 measured nothing over 0ms under the media query, and now about 32 interactions move there: B1 and B2 of this review | `Button.css:675-679`, `Switch.css:342-352`, `Slider.css:333-337` |
| B3 | Unnamed ToggleButton on `/interactions` (4.1.2) | fixed, but the page has a new critical violation (B8) | No `button-name` in any setup. The stage uses `icon` and `label`, and a development warning was added for `label` without `icon` | `apps/gallery-react/src/interactions/actions.tsx:76`, `packages/react/src/components/ToggleButton/ToggleButton.tsx:88` |
| B4 | SegmentedControl splits words at 320px in Neutral (1.4.10) | fixed | No split word in any style, LTR or RTL. Tallest item 46px in Neutral, 38px elsewhere. scrollWidth 320. `recheck.b4.json`, `recheck.b4.many-320-neutral-light-{ltr,rtl}.png` | `SegmentedControl.css:159`, `ToggleGroup.css:86` (`overflow-wrap: break-word`) |
| B5 | Combobox and Autocomplete highlight by fill only (2.4.7, 1.4.11) | fixed | A 2px inset ring on the highlighted row in every style and scheme: Studio 15.38 and 11.66:1, Desk light 18.42:1, Neutral 4.57 and 5.77:1. In Desk dark the ring is 1.16:1 on the list, but it sits on a yellow fill that carries the contrast. `recheck.b5.json`, `recheck.b5.*.png` | `ListBox.css:170-174` |
| B6 | Form and ConsentField fixes missing in Angular | fixed | The Angular Arabic form shows "اكتب بريد إلكتروني صحيح، مثل name@example.com." and "الحقل هذا مطلوب، عبه قبل الإرسال." in the field and the summary, as React does, with no browser message. `recheck.b6.json`, `recheck.b6.{angular,react}.arabic-submit.png` | `packages/angular/src/components/form/form.ts:263-290`, `consent-field.ts:244`, `:298-308`, `form-copy.spec.ts:39-75` |

Round 1 notes rechecked on the way:

- **Fixed:**
  - N1: the rating replays only the changed stars.
  - N2: the RTL menu grows from the trigger corner (`DropdownMenu.css:197-211`).
  - N3: the Stat rolls 2.4 times a second at most, in every style (`Stat/useDigitRoll.ts:21`).
  - N6: the Accordion and Switch `off` rows now stop all motion.
  - N12: the Accordion open checks run.
- **Better:** N4 and N5, now this review's N6 and N7.
- **Still true:** N7 and N9, now N1 and N2.

## Part 4: findings

### Blockers

**B1. blocker: under `prefers-reduced-motion`, every motion token added in round 2 keeps its full value (WCAG 2.3.3; order 1.22 asks for a reduced form for each interaction).**

- Where: `packages/tokens/build.ts:597` writes each mode as
  `[data-style='<id>'][data-scheme='<scheme>']` (specificity 0,2,0), and
  round 2 put the spring, morph, celebrate and stagger tokens in that block.
  The zeroing block at `build.ts:601-606` is `:root, [data-style]` (0,1,0),
  so it loses. In the output, `packages/tokens/dist/css/neutral.css:924`
  (`--ds-duration-spring-bouncy: 220ms`) wins over `:997-1027`.
- Measured on the themed element under the media query:

  | Token | Studio | Desk | Neutral |
  | --- | --- | --- | --- |
  | `duration.spring-bouncy` | 120 | 440 | 220 |
  | `duration.spring-snappy` | 80 | 300 | 180 |
  | `duration.spring-soft` | 100 | 340 | 220 |
  | `duration.morph` | 100 | 320 | 200 |
  | `duration.celebrate` | 120 | 480 | 220 |
  | `delay.stagger` | 0 | 45 | 24 |
  | `duration.base`, `fast`, `medium`, `pulse` | 0 | 0 | 0 |

- What moves because of it:
  - the close glyph turn, the split button chevron and the FAB plus;
  - the link underline draw and the nav underline;
  - every field glow (focus, OTP, search, number, inline edit) and the OTP caret;
  - the skeleton cross fade and the Alert dismiss copy (WAAPI).

  The sweep counts about 32 interactions with timed motion under the media
  query.
- Round 1 measured nothing over 0ms here, so this is a regression.
- The gallery's switch hides it. `apps/gallery-react/src/interactions.css:9-38`
  zeroes the same tokens under `:root[data-motion='reduce'] [data-style]`,
  which wins. Round 1 asked the token build to emit that selector too; it
  still does not.
- Also, CloseButton, FloatingActionButton, `SplitButton.css:158-167` and
  `Link.css:233-237` have no reduced rule of their own for the turn or the
  draw. They rely on the tokens alone.
- Fix: write the reduced block with the mode selectors, or wrap the mode
  blocks so the reduced block wins. Emit `:root[data-motion='reduce']` from
  the build as well. Add a token test that reads every duration and delay
  under emulated reduce, per mode.
- Evidence: `recheck.reduce-tokens.json`,
  `qa-navigation-feedback.tokens-reduced.json`,
  `qa-selection-overlays.reduced-media.json`, `qa-actions-inputs.still.json`,
  `recheck.reduce-sweep.desk.json`, `recheck.reduce-sweep.neutral.json`.

**B2. blocker: eleven component reduced blocks lose on specificity, so the motion plays in full under `prefers-reduced-motion` (WCAG 2.3.3).**

Each motion rule carries an extra state selector that its
`@media (prefers-reduced-motion)` block lacks. Under `data-motion="reduce"`
they pass, because `:root[data-motion]` adds weight.

| Component | Motion rule | Losing reduced block | What plays |
| --- | --- | --- | --- |
| Dialog, AlertDialog, Sheet, Drawer | `packages/css/src/components/Dialog.css:219` (`:not(:focus-within)`) | `:791-795` | parts rise 4 to 6px and fade, 100 / 340 / 220ms, staggered |
| Popover, HoverCard | `Popover.css:136` | `:274-278` | the same |
| Lightbox | `Lightbox.css:153` | `:359-363` | toolbar, arrows and caption |
| Tour | `Tour.css:112` | `:274-278` | panel parts |
| DropdownMenu submenu | `DropdownMenu.css:458-460` | `:500-502` | chevron leans 2 to 3px over 220 or 440ms |
| WindowControls | `WindowControls.css:157` | `:172-176` | glyphs pop from 0.5 with the stagger |
| TabBar | `TabBar.css:179`, `:183` (`[data-active]`) | `:196-199` | icon and label pop, 120 / 485 / 244ms |
| Toolbar | `Toolbar.css:149` (`[data-state='on']`) | `:154-161` | icon pop, 120 / 440 / 220ms |
| EmptyState | `EmptyState.css:131`, `:135` | `:171-175` (`> *`) | icon and text cascade |
| ErrorState | `ErrorState.css:79`, `:83` | `:223-229` | the same, seven animations, up to 244ms |
| SplitView | `SplitView.css:44`, `:48` (`[data-state]`) | `:65-69` | pane slides 4 / 12 / 6px |

- Fix: give each reduced block the same selector as the rule it undoes, or
  put the reduced form in the private properties the motion rule reads.
  Then a reduced block cannot lose. Add a contract check that plays each
  component's trigger under emulated reduce and fails on any animation over
  0ms.
- Evidence: `qa-selection-overlays.media-leaks.json`, the `*.media` runs in
  `dialog-spring`, `popover-spring`, `sheet-spring`, `lightbox-zoom`,
  `tour-spotlight`, `menu-submenu-nudge`, `window-lights`, `tab-bar-pop`,
  `toolbar-press`, `state-illustration` and `split-view-pane`
  `.measure.json`.

**B3. blocker: two size changes still apply under both reduced modes (the pattern of round 1 B2).**

- Window lights: `packages/css/src/components/WindowControls.css:128-130`
  dips the pressed dot to `--_window-controls-press-scale`. The reduced
  blocks at `:171-185` never reset it. Held, the dot measures 0.95 in Neutral
  and 0.9 in Desk under full, media and attr. The registry says "no dip".
  Evidence: the `heldUnderAttr` check in `window-lights.measure.json`.
- Submenu chevron: in Desk the lit row's chevron sits at `translateX(3px)`
  under media and attr, because `--_menu-nudge` is never reset in the reduced
  blocks (`DropdownMenu.css:500-502`). The registry says "The chevron stays
  still." Evidence: runs `desk.ltr.media` and `desk.ltr.attr` in
  `menu-submenu-nudge.measure.json`.

**B4. blocker: the digit roll reverses numbers in RTL and breaks Arabic letters apart (the shown value is wrong; WCAG 1.3.2).**

- Where: `packages/motion/src/primitives/digit-roll.ts:58-86` writes each
  character into its own inline block column. There is no `direction: ltr`
  and no isolation on the host. In an RTL line the columns run right to left.
- Measured in Arabic RTL:
  - Pagination: pages 16, 17 and 18 show as "61", "71" and "81"
    (`Pagination.tsx:174`).
  - Stat: 1,501 shows as "105,1" (`Stat/useDigitRoll.ts:49`, `:53`).
  - Slider and RangeSlider bubble: 200 ريال shows as "002 ريال", 45% as "54%"
    and 17 as "71" (`Slider.tsx:134`, `:138`).
  - FilterBar: `FilterBar.tsx:242-243` sends the whole sentence through
    `renderDigits` and `rollDigits`. "فلتر واحد مفعل، 12 نتيجة" shows as
    letters that do not join, with "21". This shows at rest, on the Arabic
    page and on the Arabic row of the English page. Angular shows it right.
- The accessible names stay right. Only the visible text is wrong, so a
  sighted person reads the wrong page, total or price.
- Fix: set `direction: ltr` and `unicode-bidi: isolate` on the host for
  numbers (as `bdi` does), roll only the digit runs, and render other text as
  one plain text node.
- Evidence: `recheck.digit-rtl.json`, `recheck.digit-rtl-after.json`,
  `recheck.digit-rtl-after.{pagination-roll,stat-roll,slider-bubble,filter-count-roll}.png`,
  `recheck.slider-bubble.range-slider.rtl.held.png`,
  `recheck.filter-bar-count-ar.{react,angular}.png`.

**B5. blocker: Pagination draws wrong page numbers after two changes 30ms apart.**

- Measured in all three styles: the 120 page Pagination draws "152" and "163"
  for pages 15 and 16. The aria labels are right. The wrong text stays until
  the next page change. Ten fast changes gave slot text like "23=293229026".
- Cause: `packages/react/src/components/Pagination/Pagination.tsx:167` reads
  each slot's `from` text from the DOM in the middle of a roll. Then `:174`
  rolls into a host that React also renders (`digit-roll.ts:96`). Studio
  breaks too, although its digits only fade.
- Fix: keep the last shown value in a ref, as `Stat/useDigitRoll.ts` does,
  and never read it back from the columns.
- Evidence: `pagination-roll.rapid-leftover.json`,
  `pagination-roll.{studio,desk,neutral}.rapid-leftover.png`.

**B6. blocker: a click on a menu trigger within about 100ms of the menu closing is lost (order 1.22: never block input).**

- Where: `packages/css/src/components/DropdownMenu.css:411-412` plays
  `ds-menu-out ... forwards`. Radix keeps the content mounted until it ends
  (`packages/react/src/components/DropdownMenu/DropdownMenu.tsx:53-58`).
- Measured in Desk and Neutral: close by Escape or by a click, then click
  the trigger again.
  - At 40 or 80ms the click does not reopen the menu.
  - At 120 and 200ms it does.
  - Under the attribute (no exit) it reopens at 30ms. Studio reopens.
- The hit test lands on the trigger, so the click arrives and is swallowed.
- It shows on SplitButton and the floating action button, and on every
  DropdownMenu.
- Fix: let a press on the trigger during the exit reopen at once (cancel the
  exit animation, then open), or unmount at once and play the exit on a copy,
  as `Alert/ghost.ts` does.
- Evidence: `qa-actions-inputs.menu-reopen.json`, the `rapid` runs in
  `split-chevron.measure.json` and `fab-morph.measure.json`.

**B7. blocker: `switch-stretch` loses the thumb for 60 to 100ms in Neutral and Desk (asked by the lead session).**

- On release two things happen together:
  - the thumb takes the on color at once
    (`packages/css/src/components/Switch.css:278`): white in Neutral, near
    black in Desk;
  - the track has no fill of its own once the tint layer exists (`:182-184`),
    and the tint layer starts at opacity 0 and fades on
    `duration.spring-soft` (`:186-197`).
- So a white thumb sits on a pale, empty track. In the contact sheet only the
  focus page's pointer dot stays visible, so the thumb seems to shrink to a
  dot. Then the track flashes pale before it fills.
- Neutral tint opacity: 0 at 0ms, 0.15 at 20, 0.28 at 40, 0.41 at 60, 0.53 at
  80, 0.63 at 100, 0.82 at 140, 1 at 220.
- Desk is longer: 0.10 at 20ms, 0.36 at 80, 0.58 at 140, 0.83 at 220, 0.98 at
  300. Its tint starts at scaleX 0.3, and the thumb dips to scaleX 0.93 at
  140ms.
- Studio's on fill is a 20% white under a light thumb, which stays visible.
- It happens once per toggle, so it is not a 2.3.1 flash. But it hides the
  one thing a switch shows, its state, during the travel. It reads as a bug,
  on the most used toggle of the set.
- Fix: draw the tint at opacity 1 from frame 0 and sweep it in by scaleX
  alone from `scale.morph`, or keep the track's own fill under the layer.
  Either keeps contrast behind the thumb through the travel.
- Evidence: `lead-switch-stretch.frames.png` (rows Studio, Desk, Neutral;
  columns 0 to 440ms after release), `lead-switch-stretch.frames.json`, and
  the lead's `docs/reports/shots/interactions-2/sheets/switch-stretch.neutral.png`
  on `claude/relaxed-hypatia-7gseap`.

**B8. blocker: a new critical axe violation on `/interactions`, the acceptance page of the order (WCAG 4.1.2).**

- `apps/gallery-react/src/interactions/navigation.tsx:93-99`: the second
  Tabs of the `tab-slide` stage ("Board settings, soft") has no `TabsPanel`.
  Its selected tab's `aria-controls` points to an id that does not exist
  (`aria-valid-attr-value`).
- It fails in all four setups, at rest and mid motion.
- Evidence: `axe.interactions-page.json`.

**B9. blocker for acceptance: the recordings order 1.22 asks for are mostly missing.**

- The order asks for a screen recording per family in Neutral, Studio and
  Desk: 18 clips in `docs/reports/shots/interactions-2/`.
- On the merged branch only `feedback.desk.webm` is there. Commit d34b4cd
  removed eight clips and said per interaction clips replace them. None were
  committed.
- Since then the lead branch has a contact sheet per interaction and a clip
  per family for Neutral (commit 0437d1d). Studio and Desk are still missing.
- The Neutral sheets are a third of the frame size, so a small control is
  hard to judge (N32).

### Notes

- **N1. note: presets reach only the mode, never the timing.**
  - Round 1 N7 is still true, and now covers the primitives as well.
  - A preset row can set full, reduced or off. It cannot change a duration or
    an ease, in CSS or in the primitives.
  - Neutral asks for `ease.out` on the menu, sheet, drag and drop, tab
    indicator, dialog and swap, and `duration.base` on the menu exit
    (`packages/styles/neutral/motion.ts:25-32`). Measured: snappy 180ms on
    the menu and slides, soft 220ms on the dialog and sheet, a 100ms menu
    exit.
  - Studio asks for `duration.base` on the sheet and drag and drop
    (`packages/styles/studio/motion.ts:24`, `:28`). Measured 100 and 80ms.
  - The indicator reads the spring tokens directly
    (`packages/react/src/internal/indicator.ts:68-69`).
  - Either make presets carry timing, or take the timing fields out of the
    presets so they do not promise it.
- **N2. note: the `off` recipes exist only in the gallery.**
  - Round 1 N9 is still true. `apps/gallery-react/src/Interactions.tsx:29`
    builds them and `:82` injects them. There is no
    `packages/styles/<id>/motion.css`.
  - So in an app Studio plays `radio-pop`, the submenu nudge and the window
    lights in full, although its preset says reduced.
- **N3. note: the registry text does not match what plays.** The registry is
  what the owner approves, so it must say what plays.
  - `menu-rows`, Neutral "a short cascade"
    (`packages/motion/src/interactions/selection.ts:150`): plays a 150ms fade,
    because Neutral's `list-stagger` row is reduced
    (`packages/styles/neutral/motion.ts:31`).
  - The same Neutral row removes the waves promised for `otp-complete`
    (`fields.ts:259`), `wizard-done` (`:412`) and `form-summary-enter`
    (`:349`). Measured: no wave.
  - Studio "hard flips" for `slider-bubble` and `filter-count-roll`
    (`selection.ts:103`, `:229`): Studio plays a 120ms fade.
  - Studio "fades" or "no pop" for pagination digits
    (`navigation.ts:98`), the stat (`content.ts:142`), the badge (`:339`), the
    tab bar (`navigation.ts:186`) and the meter (`content.ts:270`): Studio
    plays the full form, because `packages/styles/studio/motion.ts:38-41`
    sets those rows to `full`.
  - Desk dialog and palette, "spring-soft 340, 2%" and "snappy 300, 10%"
    (`overlays.ts:194`, `:249`): Desk plays `ease.window` 300 from 0.92
    (`packages/styles/desk/recipes/Dialog.css:41-42`, `CommandPalette.css:33`).
  - `tooltip-follow`, "the last one is hidden at once" (`overlays.ts:167`):
    the old tooltip fades over 100ms while the new one shows
    (`Tooltip.css:128`).
  - The reduced form "cross fade over duration.base" for `button-loading`,
    `copy-swap` and `password-reveal`: `duration.base` is 0 under reduce, so
    it is a cut. That is safe, but the text should say so.
- **N4. note: Desk's button label roll replaces `segment-press`, and the `off` rows do not stop it.**
  - `packages/styles/desk/recipes/Button.css:30-39` rolls the label on hover.
    Held, the Desk segment reads `matrix(1, 0, 0, 1, 0, -32)` with no dip.
    Neutral holds 0.95 and Studio 0.97.
  - The roll plays on every plain Button click, and the `off` rows of
    `button-press` and `button-nudge` leave it running.
  - Evidence: `segment-press.sheet.png`, `segment-press.measure.json`.
- **N5. note: Neutral totals pass its 150 to 220ms band.** The stagger is
  added to the 220ms spring.
  - 268ms: `rating-fill`, `rating-preview` and `form-summary-enter`.
  - 244ms: `button-loading`, `copy-swap`, `inline-edit-morph`,
    `field-error-enter` and `state-illustration`.
  - 292ms: the split button menu rows.
- **N6. note: focus returns only after the exit (round 1 N4, shorter now).**
  - Focus comes back in the frame the node is removed, after a 100ms exit.
    The Desk dialog was 220ms in round 1.
  - Select returns focus before unmount.
  - Evidence: `qa-selection-overlays.focusret.json`.
- **N7. note: the ring inside a fading overlay (round 1 N5, better).**
  - The ring is drawn on frame 0, but the panel is still fading in.
  - Effective opacity of the focused control:
    - Neutral dialog and lightbox: 0.82 at 30ms.
    - Neutral menu: 0.79 at 60ms.
    - Neutral popover: 0.69 at 60ms.
    - Studio popover: 0.67 at 100ms.
  - Sheet, drawer, tooltip and palette input are at about 1 at once.
  - Round 1 was 120 to 300ms.
  - The `menu-origin` text "the row is there from the first frame" does not
    hold: on Select open in Desk, the focused option is at opacity 0 until
    30ms.
- **N8. note: Window close and minimize hold focus until their exit ends.**
  - `packages/react/src/components/Window/Window.tsx:354-358` and `:405-409`
    move focus and unmount after `settled(anim)`: 220ms on close and 320ms
    on minimize, in Desk.
  - This predates round 2.
- **N9. note: the stage only mode is large enough; the sheets are not.**
  - `?focus=` draws the stage at zoom 2.5. In a 960 by 540 frame the switch
    is 105 by 60px, the check box 60 by 60, the tab list 341 by 80 and the
    button 239 by 90. That is enough to judge on video.
  - `docs/reports/shots/interactions-2/record.cjs` crops 80% of the frame
    and scales it to 240 by 135, about 0.31, so a switch ends up about 33px
    wide on the sheet.
  - Crop each tile to the stage box, at 480px or wider, and use a zoom of
    3.5 to 4 for single small controls.
- **N10. note: Desk `list-stagger` plays two animations on first paint.**
  On a repaint the rows run a 300ms FLIP from -17.7px on top of the 8px
  stagger rise. The FLIP group at
  `packages/react/src/components/List/List.tsx:90` plays on a first paint,
  which `collection-flip` says it never does.
- **N11. note: Tooltip open delays and the stagger budget are raw values.**
  The Tooltip delays of 500 and 300ms are behavior, not motion.
  `STAGGER_BUDGET_MS = 120` is at `packages/motion/src/primitives/shared.ts:91`.
- **N12. note: a field message or error pushes the control below it at once
  by layout.** In Neutral `field-message-enter`, Studio `field-error-enter`
  and the form summary, a second click at the old place of the next control
  lands on the new message. This is reflow, not motion, but the person's
  target moves (2.5.8 in spirit).
- **N13. note: `password-reveal` fades the whole native input from opacity
  0** over 120 / 120 / 150ms (`PasswordField.tsx:125`). The text is
  unreadable on frame 0. The ring sits on the root, so focus stays visible.
- **N14. note: on every wizard step change the Next button plays the full
  loading morph** (dip, spinner, label back), because `checking` flips for
  one frame (`packages/react/src/components/FormWizard/FormWizard.tsx:546`).
- **N15. note: a rating click also plays `rating-preview`.** On a pick from
  2 to 5 all five stars move: 1 and 2 dip from the preview while 3 to 5 land.
  No star blinks, but it is busy.
- **N16. note: Chip.** Selecting a chip adds the glyph and the siblings
  jump. Clearing plays nothing.
- **N17. note: `tooltip-follow` shows two tooltips for 100ms.** See N3.
- **N18. note: `toc-travel` does not travel.**
  `TableOfContents.tsx:252` starts the WAAPI stretch (composite add, on
  transform) before `:253` sets the offset. Chromium then starts no CSS
  transition, so the bar jumps and swells in place. Set the offset first.
  Evidence: `toc-travel.transition-check.json`.
- **N19. note: the `tab-bar-pop` off row** (`navigation.ts:191`) sets only the
  duration. The label keeps its stagger delay with a backwards fill, so it is
  held 2 or 3px low, then jumps.
- **N20. note: raw values.**
  - `packages/styles/desk/recipes/Dock.css:18` (1.25) and `:20` (1.1).
  - `StatusDot.css:142` (0.6) and `:148` (2.5), and the same in
    `Avatar.tsx:140`.
  - `rotate(-12deg)` and `rotate(90deg)` in `SearchField.tsx:143`, `:218`.
- **N21. note: the spinner pauses only through the `pauseLoops()` API.** It
  works (1 paused, 0 running, resumed). There is no control on the
  component or in the gallery. It is endless by nature, so WCAG 2.2.2 is met
  only if the app offers the pause.
- **N22. note: the Badge pop has no rate limit** (`Badge.tsx:88`). Ten
  changes 30ms apart gave 8 to 10 pops in about 270ms. The digits are
  limited to 2.4 rolls a second. The area is small, so this is not a 2.3.1
  flash, but it should share the digit limit.
- **N23. note: the `error-state-details` stage has no
  `data-interaction-trigger`**
  (`apps/gallery-react/src/interactions/feedback.tsx:427-429`), so its
  replay control presses nothing.
- **N24. note: FLIP moves a close button away for 160 to 280ms.** In
  `toast-stack` and `notification-change` a moving item's close button is up
  to 61 to 133px from its rest place mid move. A pointer aimed where it is
  drawn still hits it. This is inherent to FLIP and noted for 2.5.8.
- **N25. note: Angular lacks two round 2 layers.** The Switch track span
  (`Switch.tsx:151`) and the RadioCard inner span (`RadioCard.tsx:156`) are
  not in the Angular DOM. Part of `switch-stretch` and `radio-card-lift` does
  not play there, though nothing breaks at rest. Under `frameworks.md` this
  is a gap in the shared contract to report.
- **N26. note:** the ToggleGroup selected fill differs by about 1px between
  React (shared indicator) and Angular (item fill).
- **N27. note:** the Angular gallery has no page for TitleBar and
  WindowControls, so `window-lights` could not be compared.
- **N28. note: Meter holds an empty bar until it is seen.**
  `packages/react/src/components/Meter/Meter.tsx:146-147` and `:163-167` set
  an inline `scaleX(0)` until the meter enters the view. Print, full page
  captures and a meter that never scrolls into view show an empty bar next to
  "99 GB of 100 GB, Full". The bar should rest at its value and play the fill
  only when it will be seen.
- **N29. note:** under the attribute the close glyph still jumps a quarter
  turn on hover (`CloseButton.css:32-34` keeps `--_button-turn`), while the
  comment at `Button.css:674` says "no turn". A cross looks the same after a
  quarter turn, so nothing visible changes.
- **N30. note: target size.** The HoverCard link on `/interactions`
  (`apps/gallery-react/src/interactions/overlays.tsx:268`) is 19 to 24px tall.
  It passes only by the spacing exception.
- **N31. note:** several Arabic stages keep English copy ("Jump three pages",
  "Live visitors"), so the RTL runs show mixed text.
- **N32. note:** the Neutral sheets on the lead branch are about a third of
  the frame size (N9).
- **N33. note: the gates did not catch B4, B5 or B7.** Three checks would
  have caught them:
  - a contract check that compares the visible text of a value to its
    accessible text, in RTL, after a roll;
  - a rapid run that does the same;
  - a check that the state indicator keeps contrast against its track at
    the middle of a motion.

## Not run

- Light scheme for Studio and Desk, except where color mattered; dark scheme
  for Neutral.
- Reduced and `off` runs in RTL for the overlays, beyond the Neutral RTL
  checks.
- Tour Next and Previous in Arabic, window minimize and restore (the stage
  has no control for them), dragging a sheet, the menubar pointer move,
  `menu-rows` in MultiSelect, Combobox, Autocomplete and TagField, and the
  ContextMenu RTL origin.
- The copy failure path of `copy-swap` (the headless clipboard succeeds).
- The Angular motion comparison in Studio and Desk (Neutral only), and for
  `fab-morph`, `link-underline`, `toast-swipe` and `menu-submenu-nudge`.
- Axe on component pages in Desk, and in the dark scheme beyond Studio dark.
  The contract suite covers those with its own axe checks.
- Exact wall clock action delays, because of the machine load. The order of
  events was recorded instead.
- One possible issue left unconfirmed: in one probe, a radio arrow key after
  a pointer pick did not change the radio in Neutral and Desk.
