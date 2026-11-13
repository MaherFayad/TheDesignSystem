# Review: interaction round 3

Fresh eyes review by ds-qa of order 1.23, the 109 interactions of the round 3
registry in `packages/motion/src/interactions/` (71 of them added or reworked
in round 3). Branch `claude/ds-review-interactions-3`, cut from
`claude/relaxed-hypatia-7gseap` at 0747686, which merges
`claude/ds-order-1-23` at f686e32. No component source, CSS, token,
manifest, test or gallery file was edited.

Five reviewers split the work, each as claude-opus-5-5 at medium. Four
measured the interactions in Chromium, one or two registry files each. One
ran the contract suites, axe, target sizes and the Angular gallery, and
rechecked the round 2 blockers. The lead ran the performance traces, read
the code behind every blocker before it went into this file, and looked at
the contact sheets behind the switch and floating label blockers.

Evidence is under `docs/reports/reviews/shots/interactions-3/` (contact
sheets and JSON, no video):

- `<id>.sheet.png` and `<id>.measure.json` for every interaction.
- `probe.cjs`: the shared sampler. `perf.cjs`: the performance probe.
  `BRIEF.txt`: the shared brief.
- Files that start with `qa-toggles-actions.`, `qa-inputs.`,
  `qa-overlays-selection.` and `qa-navigation-content.` belong to the four
  measuring reviewers.
- Files that start with `contract.`, `axe.`, `target.`, `angular.`,
  `recheck.` and `reduce.` belong to the regression reviewer.
- `perf.liquid.json`, `perf.neutral.json` and `perf.cpu-profile.json`: the
  performance traces.

The builder's report `docs/reports/interactions-3.md` (on
`origin/claude/ds-order-1-23`, not on this branch) was read only for its
list of ids and hooks until these findings were formed.

## How it was measured

- React gallery, stage only mode:
  `/interactions?focus=<id>&style=<studio|desk|neutral|liquid>&scheme=light&chrome=0`,
  the same with `&dir=rtl&lang=ar`, and with `&platform=ios|android`. Dark
  runs where color mattered (the switch, the tab ink).
- Three motion modes: full; media (`prefers-reduced-motion: reduce`
  emulated); attr (`data-motion="reduce"` on `<html>`).
- Pointer, touch (390 by 844, `hasTouch`, `isMobile`, taps and touch drags)
  and keyboard (Tab, Space, Enter, arrows, Escape, F8).
- `document.getAnimations()` sampled on every frame, with the timing, the
  keyframes and the properties. The computed `transition-property` and
  `transition-duration` of every stage node and its pseudo elements were read
  before and after each trigger, so a layout property in a transition is
  caught even when no frame shows it.
- Frame contrast: every animation paused and seeked every 20ms from 0 to
  500ms, then the state indicator measured against the pixels around it.
- Rapid triggers 30ms apart; interrupted triggers reversed before the end.
- `off` rows of the registry injected under `@layer ds.recipes`.
- Reduced transparency through CDP `Emulation.setEmulatedMedia`; forced
  colors and more contrast through Playwright. `@supports not
  (backdrop-filter)` cannot be emulated in Chromium and was read in the CSS.
- The machine has 4 cores shared by five reviewers, at a load of 18 to 30.
  Durations below are the values the animations carry
  (`getComputedTiming`), and every one matched a motion token. Wall clock is
  used only for the order of events. The performance traces ran alone, at a
  load under 1.

`npm run check` is green on this branch, 13 of 13 steps. Two reviewers saw
vitest gate tests time out at 5s under a load of 25; run alone they pass.

## Verdicts

| Area | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| Rules of order 1.23, 109 interactions | fix needed | 9 (B1 to B9) | 43 (N1 to N43) |
| Craft against the owner's words | the drawn check, the glass thumb, the copy word and the toast stack are there and mostly good; the growing dot is missing; the switch and the tab pill fail on contrast in the middle of their motion; iOS toasts are upside down | | |
| Performance | fix needed | 1 (B14) | 2 (N44, N45) |
| Regressions | React contract green (one load timeout); Angular contract red, 24 failures (B12); Angular Slider and ProgressCircle broken (B11); phone hit areas dead on the button family (B10) | 3 (B10 to B12) | 3 (N46 to N48) |
| Round 2 blockers | B1 to B8 fixed; B9 partly fixed | 1 (B13) | |

Read B3, B6, B7 and B10 first. B3 hides the state of the most used toggle
for 40 to 80ms on every toggle in Neutral light. B6 leaves a floating field
with no visible label in Neutral and Liquid. B7 and B10 are what the owner
will meet first on a phone.

What held for all 109:

- **Properties.** Every animated property is in the ruling: `transform`,
  `opacity`, `clip-path`, `stroke-dashoffset`, `stroke-dasharray`, `filter`,
  `backdrop-filter`, the colors and `box-shadow`. No layout property is
  animated, in a keyframe or in a computed `transition-property`, in any run,
  before or after the trigger. The lead's scan of every component CSS file
  and recipe agrees: the transitions name only `transform`, `opacity`,
  `border-color`, `box-shadow`, `clip-path`, `background-color`,
  `stroke-dashoffset` and `color`.
- **Reduced motion.** The reduce sweep played every id under media and
  under attr in all four styles (872 runs): 0 timed animations of any kind.
  Every `--ds-duration-*` and `--ds-delay-*` token is 0ms under emulated
  reduce in every style and scheme, except `delay.feedback` and
  `delay.peek-hide`, which are marked as not motion.
- **Action first.** State, value and focus changed on or before the first
  frame of motion in every run. The exception is B8 (focus).
- **No stuck state.** Rapid and interrupted runs ended in the right state,
  at rest, with no held fill, no leftover node and no stuck `data-dragging`.
- **Focus ring.** After Tab the ring is at full opacity on the first frame,
  with no transition, on every control tried.
- **Flash and loops.** Nothing flashes more than three times a second. The
  skeleton band, the status pulse and the avatar ring run three times in
  4.2s and stop. The toast line pauses on hover, focus and F8. The spinner is
  the only endless loop (N36).
- **No wait on end events.** No code waits on `transitionend` or
  `animationend`. `.finished` is used only to remove decorations.
- **Drag paths.** Switch drag, toast swipe, sheet handle and slider all have
  a non drag path (click, keys, a close button, Escape).
- **A style can turn it off.** The injected `off` rows stop travel and scale,
  except the three in N31.

## Part 1: the 109 interactions

Read the columns this way:

- Durations are Studio / Desk / Neutral / Liquid, in ms, as the animation
  carries them. "+ 45" is a stagger delay. "steps" means a stepped ease.
- "Reduced media / attr": "still" means nothing timed played under the
  person's `prefers-reduced-motion`, then under `data-motion="reduce"`.
- "Rules": pass, or the finding that breaks a rule.
- "Craft": good, ordinary or wrong, with the reason.

Motion tokens on the theme element (S / D / N / L): spring-snappy 70 / 300 /
158 / 296; spring-soft 100 / 340 / 200 / 375; spring-bouncy 120 / 380 / 200
/ 496; morph 100 / 320 / 180 / 320; celebrate 120 / 480 / 200 / 480; stagger
0 / 45 / 24 / 40; base 120 / 120 / 150 / 150; distance.shift 0 / 6 / 4 / 6px.

### Toggles and actions

| Interaction | States or beats measured | Duration S / D / N / L (ms) | Properties | Reduced media / attr | Rules | Craft |
| --- | --- | --- | --- | --- | --- | --- |
| `toggle-pop` | press layer, flood on, drain off, content sink | layer 70; flood 100 (2 steps) / 340 / 200 / 375; drain 100; sink 70 then 300 / 158 / 296 | clip-path, opacity, colors, transform | still / still | pass | ordinary: on looks too close to off |
| `switch-stretch` | hover lean, press grow and stretch, travel, fill sweep, thumb color cross, back | press 70; travel 120 (3 steps) / 380 (21% overshoot) / 200 (none) / 496 (9%); color 100 | transform, clip-path, opacity, colors, box-shadow | moves at once, no motion / same | **B3** contrast trough; round 2 B7 fixed in its old form | good shape; the color cross hurts; spring lost on touch |
| `switch-drag` | follow, rubber band capped at 1.12, snap by velocity or nearest end | snap as above; follow untimed | transform, clip-path, opacity, color | follows, lands at once / same | non drag path pass (click, Space, Enter); **B4** | good feel; the thumb fades mid drag |
| `check-draw` | dip, fill circle, short arm, long arm, land; back | fill 50 / 160 / 90 / 160; whole mark 125 / 400 / 225 / 400; back 130 | clip-path, stroke-dashoffset, transform | still / still | pass | good: a real drawn check; Desk long |
| `check-mixed` | dash and check morph both ways | turn 100 (2 steps) / 320 / 180 / 320 | transform, stroke-dashoffset, clip-path | still / still | **B5** wrong glyph from unchecked | good bend, broken entry from empty |
| `radio-pop` | dip, ring closes in, dot grows and slides from the old option, old dot fades | none / ring 300, dot 380 / 158, 200 / 296, 496; old dot 100 | box-shadow, transform, opacity | still / still | pass | good in Desk, Neutral, Liquid; none in Studio; two dots 40 to 80ms |
| `radio-card-lift` | dip, cross to checked, lift, badge fills, check draws; old card back | 120 (3 steps) / colors 320, lift 380 / about 180 to 225 / 496 | colors, box-shadow, transform, stroke-dashoffset | still / still | pass | good; two cards selected up to 120ms |
| `button-press` | dip, sink, inner shade, spring back | 70, then 120 / 380 / 200 / 296 | transform, opacity | still / still | pass | good in Desk; Studio only a label sink |
| `button-glow` | glow fades in at the pointer and follows | 100 / 320 / 180 / 296 | opacity | still / still | pass | ordinary, faint |
| `segment-press` | parts dip and sink, neighbours still | 120 / 380 / 200 / 496 | transform, opacity | still / still | pass | ordinary |
| `button-loading` | dip, label out, spinner pops in, back | dip 70 / 300 / 158 / 296; spinner 120 / 380 + 45 / 200 + 24 / 496 + 40 | transform, opacity | still / still | pass | good |
| `button-result` | label out, check or cross drawn, error shake, back | check 100 / 320 + 45 / 180 + 24 / 320 + 40; cross ends 200 / 685 / 384 / 680 | stroke-dashoffset, transform, opacity | still / still | pass | ordinary: a small glyph, no word, no tone |
| `copy-swap` | glyph closes, check wipes and pops, word rolls to "Copied" | close 100; wipe 100 / 320 + 45 / 180 + 24 / 320 + 40; roll 70 / 300 + 45 / 158 + 24 / 296 + 40 | clip-path, transform, opacity, color | still / still | pass, width held | good idea, untidy roll |
| `copy-bubble` | bubble rises, holds, rises out | 70 / 300 + 45 / 158 + 24 / 296 + 40 | transform, opacity | still / still | pass | not judged frame by frame |
| `button-nudge` | end part nudges toward the inline end | none / 300 / 158 / 296 | transform | still / still | pass | ordinary; nothing in Studio |
| `close-turn` | bloom and quarter turn | 70 (2 steps) / 300 / 158 / 296 | clip-path, transform | still / still | pass | good |
| `split-chevron` | drop, flip, menu rows | 70 / 300 / 158 / 296; rows to + 120 (Desk 460) | transform, clip-path, opacity | still / still | pass | good |
| `fab-morph` | lift, turn, menu | 120 / 430 / 248 / 455 | transform, clip-path, opacity | still / still | pass | not judged frame by frame |
| `link-underline` | line draws, text color eases | 100 / 320 / 180 / 320 | clip-path, color | still / still | pass | not judged frame by frame |

### Inputs and forms

| Interaction | States or beats measured | Duration S / D / N / L (ms) | Properties | Reduced media / attr | Rules | Craft |
| --- | --- | --- | --- | --- | --- | --- |
| `focus-glow` | ring at once, border color, glow fades in and grows, out quicker | 120 / 340 / 200 / 375; border 120 / 120 / 150 / 150 | border colors, box-shadow, opacity, transform | still / still | pass; forced colors outline | good: the best focus feedback of the set |
| `error-shake` | four swings toward the inline end, mirrored in RTL | none / 380 / 200 / 496 | transform | still / still | pass (about 25 reversals a second in Neutral, once per change) | ordinary: Neutral reads as a buzz |
| `field-label-focus` | label rises, color eases | 70 / 300 / 158 / 296 | transform, color | still / still | pass; floating mode **B6** | ordinary; Studio does not rise |
| `field-message-enter` | slide down and fade | 100 / 340 / 200 / 375 | transform, opacity | still / still | pass; N12 | ordinary |
| `field-error-enter` | clip reveal under the control, icon pops a step later, border to danger | 120 / 425 / 224 / 536 | clip-path, transform, opacity, colors | still / still | pass; N12 | good in Desk and Liquid |
| `password-reveal` | type changes at once, diagonal wipe of the eye, input fades | wipe 100 / 320 / 180 / 320; fade 120 / 120 / 150 / 150 | clip-path, opacity | still / still | pass; N11 (round 2 N13) | wipe good, text fade wrong |
| `search-clear` | glyph turns in and lands | 120 / 340 / 200 / 375 | transform, opacity | still / still | pass | ordinary |
| `search-submit` | glyph dips and springs | 120 / 380 / 200 / 496 | transform, opacity | still / still | pass | ordinary, barely seen |
| `otp-fill` | paste lands as one run, two stagger steps | 120 / 570 / 206 / 560 | transform, opacity | still / still | pass | good in Desk |
| `otp-caret` | caret slides and fades | 70 / 300 / 158 / 296 | transform, opacity | still / still | pass; not mirrored in RTL (N14) | ordinary |
| `otp-complete` | cells lift in a wave | 120 / 570 / 200 / 560 | transform | still / still | pass | ordinary; Studio and Neutral barely move |
| `field-step` | digit columns roll, last digit first | 120 / 300 / 158 / 296 | transform, opacity | still / still | pass; round 2 B4 fixed | good |
| `scrub-roll` | digit roll, handle swells | 120 / 340 / 200 / 375 | transform, opacity, box-shadow | still / still | pass; off row stops the handle only (N31) | good |
| `inline-edit-morph` | glyphs turn out and in | 120 / 425 / 224 / 536 | transform, opacity | still / still | pass | ordinary |
| `form-summary-enter` | rows slide from the inline start, fields shake, errors reveal | 120 / 430 / 248 / 536 | transform, opacity, clip-path, box-shadow, colors | still / still | pass; the Send button drops 135px at once (N12) | ordinary: busy |
| `form-submit-success` | mark lands, ring and tick draw, buttons pop | 200 / 480 / 280 / 496 | transform, opacity, stroke-dashoffset | still / still | pass | good tick; Desk button label jumps |
| `wizard-step` | old step out to the start, new in from the end, check lands | 100 / 340 / 200 / 375, plus the spinner | transform, opacity, stroke dash | still / still | pass; N13 (round 2 N14) | wrong: a loading spinner on every Next |
| `wizard-done` | mark lands and draws, stepper wave | 200 / 470 / 280 / 576 | transform, opacity, stroke-dashoffset | still / still | pass | good in Desk and Liquid |
| `consent-check` | box wipe and check draw, mark pops | 125 / 400 / 225 / 496 | clip-path, stroke-dashoffset, transform, border colors | still / still | pass | good |
| `rating-fill` | changed stars land, chosen star last on the bouncy spring | 120 / 560 / 296 / 656 | transform, opacity, clip-path | still / still | pass | good |
| `rating-preview` | clip sweep star by star to the pointer, star under it dips | 120 / 515 / 272 / 616 | clip-path, transform | still / still | pass | good, the best of the family |
| `slider-pull` | halo on hover, thumb grows, bouncy release | 120 / 380 / 200 / 496 | transform, box-shadow | still / still | pass | good |
| `slider-bubble` | bubble rises, digits roll, drops on release | 120 / 380 / 200 / 496 | transform, opacity | still / still | pass; round 2 B4 fixed | good motion, covers the value output (N15) |
| `slider-nudge` | key at the end pulls, holds, springs back | none / 380 / 200 / 496 | transform, clip-path | still / still | pass | ordinary; none in Studio |
| `slider-fill` | fill clip and thumb glide together, mirrored in RTL | 70 / 300 / 158 / 296 | clip-path, transform | still / still | pass | good |
| `slider-rubber-band` | thumb and fill follow past the end, spring back | 120 / 380 / 200 / 496 | transform, clip-path | still / still | pass; key path exists | good in Desk and Liquid; none in Studio |

### Overlays and toasts

| Interaction | States or beats measured | Duration S / D / N / L (ms) | Properties | Reduced media / attr | Rules | Craft |
| --- | --- | --- | --- | --- | --- | --- |
| `toast-enter` | travel in, icon pop, exit | in 120 / 380 / 200 / 496, icon + 0 / + 45 / + 24 / + 40; exit 70 / 120 / 150 / 150 | transform, opacity | still / still | pass; iOS **B7** | good: springy in Desk and Liquid, flat in Studio |
| `toast-stack` | push back, peek, depth, clip; three shown; five added 30ms apart | 70 / 300 / 158 / 296 | transform, clip-path, opacity | still / still | pass; iOS **B7** | good: real depth in Desk, Neutral, Liquid |
| `toast-expand` | hover, F8, F8 then Tab, leave | 70 / 300 / 158 / 296 | transform, clip-path | still / still | pass on desktop (front toast stays under the pointer 8 of 8); iOS **B7** | good; Desk cards touch |
| `toast-swipe` | pointer and touch: short, long, wrong way, flick; RTL; close button | back 70 / 300 / 158 / 296; out 70 / 120 / 150 / 150 | transform, opacity | still / still | pass; close button is the non drag path | good |
| `toast-timer` | pause by hover and by keyboard, resume | 4000 linear line | transform | line hidden, timer runs | pass 2.2.1: frozen during a 2000ms pause, closes at 5937 to 6115ms for 6000 | ordinary: the Neutral line is invisible (1.3:1) |
| `notification-change` | add entry | FLIP 70 to 120 / 300 to 380 / 158 to 200 / 296 to 496 | transform, opacity | still / still | pass | ordinary |
| `popover-spring` | open, parts, exit | 70 / 380 / 200 / 496; parts + 45, + 90 in Desk; exit 100 | transform, opacity, clip-path | still / still | pass; round 2 B2 fixed | good; Studio exits slower than it enters |
| `tooltip-rise` | open, shortcut, exit | 70 / 300 / 158 / 296; exit 100 | transform, opacity | still / still | pass | ordinary |
| `tooltip-follow` | next control within the skip delay | not measured / 300 / 158 / not measured | transform | still | pass; two tooltips show 100ms (N26) | ordinary |
| `dialog-spring` | backdrop, panel, parts, exit, focus | panel 100 / 340 / 200 / 375; parts to + 120; exit 70 / 100 / 100 / 100 | transform, opacity, backdrop-filter | still / still | pass; round 2 B2 fixed; Desk fallback **B9** | good in Neutral and Liquid; Desk panel empty about 120ms |
| `dialog-refuse` | refused backdrop press, burst of five | 140 / 300 / 300 / 300 | transform | still / still | **B8** focus falls to the body | good motion, wrong focus |
| `sheet-spring` | open, body, exit, handle drag | 100 / 340 / 200 / 375; body to + 120; exit 70 / 100 / 100 / 100 | transform, opacity | still / still | pass; close button and Escape are the non drag path | ordinary |
| `lightbox-zoom` | open, parts, exit | 100 / 340 / 200 / 375; exit 120 / 120 / 150 / 150 | transform, opacity | still / still | pass; round 2 B2 fixed | good |
| `tour-spotlight` | open, ring, parts | 120 / 380 / 200 / 496 | transform, opacity | still / still | pass; round 2 B2 fixed | ordinary |
| `window-settle` | open | 120 / 300 + settle 380 / 150 / 150 | transform, opacity | still / still | pass | good in Desk, a fade elsewhere |
| `window-lights` | hover, held press | colors 80; glyphs none / 380 / 200 / 496 | transform, opacity | still / still, held dot at identity | pass; round 2 B2 and B3 fixed | good |

### Menus, lists and collections

| Interaction | States or beats measured | Duration S / D / N / L (ms) | Properties | Reduced media / attr | Rules | Craft |
| --- | --- | --- | --- | --- | --- | --- |
| `picker-chevron-turn` | open, close | 70 / 300 / 158 / 296 | transform | still / still | pass | wrong: the up and down mark reads as a sideways `<>` mid turn (N27) |
| `menu-rows` | open, rows | 70 / 300 / 158 / 296; rows + 45 to + 120 | transform, opacity, clip-path | still / still | pass | ordinary: an empty list about 80ms in Desk and Liquid |
| `picker-value-roll` | open only | as `menu-rows` | transform, opacity | still / still | pass on open | not judged |
| `row-glide` | click a row | none / 300 / 158 / 296 | transform | still / still | pass; nothing in Studio | ordinary |
| `collection-flip` | add | 70 to 120 / 300 to 380 / 158 to 200 / 296 to 496 | transform, opacity | still / still | pass | good |
| `chip-check-pop` | select | draw 70 / 300 / 158 / 296; pop 120 / 380 / 200 / 496 | transform, clip-path, stroke dash | still / still | pass | ordinary: Desk draws in four steps |
| `filter-count-roll` | select a filter | as chip, plus count roll | transform, opacity | still / still | pass | ordinary |
| `list-stagger` | repaint | 100 / 340 / 200 / 375, stagger to + 90 | transform, opacity | still / still | pass | good |
| `menu-origin` | open, rows, exit copy | 70 / 300 / 158 / 296; rows to + 150; exit 70 / 100 / 100 / 100 | transform, opacity, clip-path | still / still | pass; last row readable 180 / 222 (Desk) / 262 (Liquid) | ordinary: an empty card 80 to 120ms in Desk and Liquid |
| `menu-row-slide` | File then ArrowRight | 70 / 300 / 158 / 296 | transform | still / still | pass | good |
| `menu-submenu-nudge` | light the sub trigger, held | 120 / 380 / 200 / 496; held 0 / 6 / 4 / 6px | transform | still / still, held at identity | pass; round 2 B2 and B3 fixed | ordinary |
| `command-palette-open` | open, exit | 100 / 340 / 200 / 375; exit 100 | transform, opacity | still / still | pass | good |
| `command-palette-results` | type | FLIP 70 / 300 / 158 / 296; stagger | transform, opacity | still / still | pass | good |
| `command-palette-row-slide` | ArrowDown twice | marker 80 | transform, opacity | still / still | pass | good |
| `highlight-marker` | pointer and keys | fade 80; pointer on the snappy spring | transform, opacity | still / still | pass; ring at once on trigger, Select, Combobox, toast close | good |
| `check-draw-pick` | pick | 70 / 300 / 158 / 296 | stroke dash, clip-path, transform | still / still | pass | ordinary (Desk steps) |
| `combobox-results` | type | 70 / 300 / 158 / 296; stagger; FLIP | transform, opacity | still / still | pass | good |

### Navigation and content

| Interaction | States or beats measured | Duration S / D / N / L (ms) | Properties | Reduced media / attr | Rules | Craft |
| --- | --- | --- | --- | --- | --- | --- |
| `tab-slide` | pill slides and stretches, label ink twins clipped to the pill; arrows; tap | 70 / 300 / 158 / 296 | transform, clip-path, color | still / still | **B1, B2**; **B14**; N30 | wrong in Desk and Liquid soft tabs; good in the Neutral segment |
| `nav-current-slide` | Navbar bar, Sidebar and Rail edge bars slide; label and icon pop | 70 / 300 / 158 / 296; pops 100 to 120 / 340 to 380 / 200 / 375 to 496 | transform | still / still | pass; the Navbar ink never plays (N37) | ordinary |
| `nav-hover-follow` | pill fades in and follows; Breadcrumbs separator leans | 70 / 300 / 158 / 296; fade 80 | transform, opacity, color, clip-path | fade / fade (allowed) | pass | good |
| `pagination-roll` | arrow wind up, digit roll by column, pill slide, pop | 70 / 300 + 45 / 158 + 24 / 296 + 40; arrow 120 / 380 / 200 / 496 | transform, opacity | still / still | pass; round 2 B4 and B5 fixed | ordinary; the pill crosses wrapped lines |
| `sidebar-collapse` | collapse: icons pop; expand: panel clip opens, labels wipe two steps late | panel 100 / 340 / 200 / 375; labels to + 270 in Desk, whole at 610 | clip-path, transform | still / still | pass, no width transition | good panel; labels late in Desk and Liquid |
| `stepper-travel` | ring travels, current pops, connector fills, check drawn | 70 / 300 / 158 / 296; pop 120 / 380 / 200 / 496; check 100 / 340 / 200 / 375 | transform, opacity, stroke-dasharray, stroke-dashoffset | still / still | pass | good |
| `toc-travel` | travel and stretch | 70 / 300 / 158 / 296 | transform | still / still | pass; round 2 N18 fixed | good |
| `tab-bar-pop` | icon pop, label rise one step later | 120 / 380 + 45 / 200 + 24 / 496 + 40 | transform | still / still | pass; round 2 B2 fixed | rich in Desk |
| `dock-lift` | lift, neighbours, label fade | 120 / 380 / 200 / 496 | transform, opacity | still / still | pass | rich in Desk; none in Studio |
| `toolbar-press` | dip, spring release, icon pop | 70; release 120 / 380 / 200 / 496 | transform | still / still | pass; round 2 B2 fixed | good |
| `language-roll` | name roll, pair dip and pop | 70 / 300 / 158 / 296; pop 120 / 380 / 200 / 496 | transform, opacity, color | still / still | pass | ordinary |
| `skip-link-slide` | drawn at once, slides down | 120 / 380 / 200 / 496 | transform | still / still | pass | ordinary |
| `alert-entrance` | clip wipe and rise, icon pop with halo, text two steps later | 100 / 340 / 200 / 375; icon 120 / 380 + 45 / 200 + 24 / 496 + 40 | clip-path, transform, opacity, box-shadow | still / still | pass | good; Desk shows an empty coloured box about 60ms |
| `alert-dismiss` | ghost shrinks and fades, the content below slides up | ghost 100; slide 70 / 300 / 158 / 296 | transform, opacity | still / still | pass | good |
| `state-illustration` | icon drops, text cascades | 120 / 380 / 200 / 496; text 100 / 340 + 45 to 120 / 200 + 24 to 72 / 375 + 40 to 120 | transform, opacity | still / still | pass; round 2 B2 fixed | good |
| `error-state-details` | chevron half turn | 70 / 300 / 158 / 296 | transform | still / still | pass | ordinary |
| `accordion-reveal` | clip wipe from the header, child stagger, chevron turn; close at once | reveal 220 in every style; chevron 70 / 300 / 158 / 296 | clip-path, transform, opacity, color | still / still | pass, height never animates | good, but the same reveal in every style |
| `skeleton-swap` | band three times 1.4s then still; ghost clip wipe | band 1400 x 3; wipe 100 / 320 / 180 / 320 | transform, clip-path | still / still | pass (4.2s); off row leaves the wipe (N31) | good |
| `stat-roll` | odometer roll, last digit first; trend nudge | 70 / 300 + 45 / 158 + 24 / 296 + 40; trend 120 / 380 / 200 / 496 | transform, opacity | still / still | pass; round 2 B4 fixed | good |
| `progress-spring` | bar clip-path, ring stroke-dashoffset, value roll | 100 / 340 / 200 / 375; roll 70 / 300 / 158 / 296 | clip-path, stroke-dashoffset, transform, opacity | still / still | pass; arc overshoot (N38) | good |
| `progress-celebrate` | pop and halo once per completion | none / 480 / 200 / 480 | transform, box-shadow | still / still | pass (once, again after a reset, never at first paint) | ordinary: fires before the fill lands (N38) |
| `meter-fill` | fill reveal, value lands | 220 / 640 / 640 / 640 | transform, color | still / still | N33 (round 2 N28) | good on screen |
| `avatar-status` | pop, ring ping three times | pop 120 / 480 / 200 / 480; ring 1400 x 3 | transform, box-shadow, opacity, background-color | still / still | pass (4.2s, under one a second) | good |
| `status-pulse` | beat and ring three times | 1400 x 3 | transform, opacity | still / still | pass; off row partial (N31) | good |
| `avatar-group-change` | FLIP, pop, count roll | 70 to 120 / 300 to 380 / 158 to 200 / 496 | transform, opacity | still / still | pass | ordinary |
| `badge-count` | roll and pop | roll 70 / 300 / 158 / 296; pop 120 / 480 / 200 / 480 | transform, opacity | still / still | N32 (round 2 N22) for the dot | ordinary |
| `card-lift` | lift, shadow, edge glow | 100 / 340 / 200 / 375; glow 80 to 150 | transform, box-shadow, opacity | still / still | pass | good |
| `spinner-loop` | fade in, endless turn | fade 100 / 340 / 200 / 375; turn 800 x infinite | opacity, transform | still / still | N36 (round 2 N21) | ordinary |
| `kbd-press` | dip and spring | 70 / 300 / 158 / 296; release 120 / 380 / 200 / 496 | transform | still / still | pass | ordinary |
| `handle-grip` | grip fade, grow | fade 120 / 120 / 150 / 150; grow 0 / 380 / 200 / 496 | opacity, transform | still / still | pass | ordinary |
| `split-view-pane` | detail clip from the inline end, back from the inline start, mirrored in RTL | 100 / 340 / 200 / 375 | clip-path, transform | still / still | pass; round 2 B2 fixed | good |

## Part 2: craft, against the owner's words

The owner asked for a checkbox and toggle that are "much better: a glass
thumb as on iOS, a thumb dot that grows as on Android, a check that is
drawn"; motion and feedback improved everywhere; a copy control that
"animates from the icon to the word Copied"; and toasts and popups with a
better look and feel in every style. Timings are Studio / Desk / Neutral /
Liquid.

**Switch.**
- Rest: the thumb at its end. Hover: the thumb leans toward its travel, 0 /
  3 / 2 / 3px.
- Press: over 70ms the thumb grows (1.0 / 1.14 / 1.02 / 1.08) and stretches
  toward its travel (1.0 / 1.30 / 1.15 / 1.28); the track dips.
- Release: the thumb travels on the style's spring, 120 in three hard steps
  / 380 with a 21% swing past its end / 200 with no swing / 496 with a 9%
  swing. Desk feels physical and a little loose. Liquid reads as iOS.
  Neutral is quiet. Studio is deliberate.
- Selected: the fill sweeps in under the thumb with a clip. Back: it
  retracts.
- The glass is real. Held, the Liquid thumb becomes a clear lens (white at
  62% in light, 22% in dark, backdrop brightness 1.12, a bright rim). It
  turns solid under reduced transparency, more contrast, `data-contrast`
  and forced colors.
- The growing dot is missing. No style sets `--_switch-thumb-size-rest`, so
  the Android ask is not met (N43).
- Two things a person feels as wrong. The thumb color crosses the fill's
  luminance for 40 to 80ms (B3), and the drag midway hides the thumb (B4).
  On a phone the spring does not play: Chromium holds `:active` 150 to 250ms
  after a tap, so the travel runs on the 70ms press curve and the swing comes
  late, as a small wobble (N1).
- Verdict: **good** shape in Desk and Liquid on a desktop; **ordinary** on a
  phone; **wrong** for about 60ms of every toggle in Neutral light.

**Checkbox.**
- Press: the box dips over 70ms (none / 0.9 / 0.95 / 0.96).
- Release: the fill grows from the centre as a circle (clip-path), then the
  short arm strokes to the joint, then the long arm strokes out
  (stroke-dashoffset). The mark takes 125 / 400 / 225 / 400ms. It is a real
  drawn check.
- Back: the reverse, 130ms in every style. For one frame at about 120ms the
  fill is a centre dot, so the box looks like a radio (N9).
- Mixed: the dash bends into the check and folds back flat, with a swing in
  Desk. The best piece of the round. From unchecked to mixed it first draws
  part of a check (B5).
- Verdict: **good** in Neutral, a clear tick at 225ms. 400ms in Desk and
  Liquid is slow for a list of boxes.

**Radio and RadioCard.**
- Hover shows the veil. Press dips the circle.
- Release: the color ring closes inward to the dot; the new dot springs in
  from the side of the old option while the old dot shrinks toward it, so the
  choice reads as one move. Dot 380 / 200 / 496ms in Desk / Neutral /
  Liquid.
- Both options show a dot for 40 to 80ms, and two cards look selected for up
  to 120ms (N2). Studio radios have no motion at all, while Studio
  RadioCards animate (N3).
- Verdict: **good** in Desk, Neutral and Liquid; **wrong** in Studio
  (nothing).

**CopyButton.**
- Press: the copy glyph closes into its centre and turns; the check wipes in
  in the success color (100 / 320 / 180 / 320ms); the label rolls from "Copy
  link" to "Copied" (70 / 300 / 158 / 296ms, one stagger later). In Arabic
  it rolls from "نسخ الرابط" to "تم النسخ", the icon at the inline start.
- The width holds (379, 389 and 273px before and after) because the button
  reserves the widest word, so the rest state has empty room.
- The roll is clipped only on the inline axis. The leaving word crosses the
  top border and the two words overlap at half opacity for 30 to 60ms in every
  style (N4). It reads as untidy.
- Verdict: the ask is met. **Good** idea, **ordinary** finish.

**Stateful Button.**
- Idle to loading: a dip (70 / 300 / 158 / 296), the label rolls out, the
  spinner pops in. Good.
- Success: the spinner shrinks and a check draws (100 / 365 / 204 / 360ms).
  Error: a cross in two strokes plus a shake; the cross ends at 200 / 685 /
  384 / 680ms, long in Desk and Liquid.
- Back: the label drops in, overlapping the leaving glyph at about 40ms.
- The result is a 16px glyph alone in a wide button, with no word and no
  tone (N7). On a phone a person sees the label vanish and a small tick.
- Verdict: **ordinary**.

**Toast.**
- Rest: in Desk, Neutral and Liquid a real stack. Older toasts peek 7 to 9px
  out, one step smaller each (0.9 and 0.8 Desk, 0.95 and 0.9 Neutral, 0.94
  and 0.88 Liquid), clipped so nothing shows through the glass. Studio peeks
  with no shrink.
- Enter: Desk rises its own height on the bouncy spring (380ms), readable at
  about 114ms, the icon 45ms later; Neutral 200ms, readable at 60ms; Liquid
  drops 12px from above even at the bottom edge (N21); Studio cuts in three
  steps. The front toast steps back on the snappy spring. In Desk and
  Neutral the old title shows through the new card for one frame at 60ms.
- Expand on hover, focus or F8: 70 / 300 / 158 / 296ms, and the front toast
  stays under the pointer. Desk cards touch (N24).
- Swipe: the toast follows the finger one to one; the rubber band stops at
  19px for a 100px pull the wrong way; 30px springs back, 80px or a flick over
  0.3px a ms closes it in 120 to 150ms. RTL closes to the left. The close
  button is the non drag path.
- Timer: pauses on the same frame as the store, on hover and on focus, and
  closes at 5937 to 6115ms for a 6000ms toast with a 2000ms pause (WCAG
  2.2.1 met). In Neutral the line is about 1.3:1 and cannot be seen (N20).
- On iOS the stack is upside down and the front toast jumps 165px on expand
  (B7).
- Verdict: **good** on a desktop in Desk, Neutral and Liquid; **ordinary** in
  Studio; **wrong** on iOS.

**Dialog and AlertDialog.**
- Open: the backdrop fades and blurs (Desk 8px, Liquid 6px, Neutral none);
  the panel rises on the soft spring (100 / 340 / 200 / 375ms); the parts
  cascade and are all readable by about 80 / 200 / 152 / 200ms. Focus moves
  in at frame 0.
- In Desk the panel holds only its title bar and buttons until about 120ms,
  then the text arrives: "box first, words late".
- Refused outside press: a two swing nudge of 7 to 10px over 300ms, no flash,
  a burst of five ends at rest. Focus falls to the body (B8).
- Close: 70 / 100 / 100 / 100ms, faster than the entrance; focus returns.
- Verdict: **good** in Neutral and Liquid; **ordinary** in Desk; **wrong**
  focus on a refused press.

**Sheet.**
- Slides in from the bottom on the soft spring (100 / 340 / 200 / 375ms), the
  body follows at + 72 to + 120ms; Desk passes its edge by 2% and settles.
  Exit 70 to 100ms.
- The handle drags with a rubber band upward; a quarter of the height
  closes, less springs back. The close button and Escape are the other path.
- Verdict: **ordinary**: right, with little character beyond the dialog's.

**Select and the menus.**
- Open: the surface grows out of the trigger with a clip from the trigger
  edge (70 / 300 / 158 / 296ms). Rows rise a stagger step apart. Neutral is
  readable at about 180ms and crisp. Desk and Liquid show an empty card for
  80 to 120ms and finish at about 222 and 262ms (N25).
- Hover and keys: the highlight marker glides with the pointer on the snappy
  spring and in 80ms with the keys; it never lags.
- Submenu: the chevron leans 6 / 4 / 6px toward the submenu.
- Pick: a check draws (stroke in Neutral and Liquid, four steps in Desk and
  Studio).
- Close: an inert copy plays the exit and the trigger takes a press at once.
- The Select's up and down chevron turns through a sideways `<>` (N27).
- Verdict: **good** for the marker, the submenu and the palette; **ordinary**
  for the entrance in Desk and Liquid; **wrong** for the Select chevron.

**Overall.** The owner's specific asks are mostly there: a drawn check, a
glass thumb, the word "Copied", a toast stack with depth, swipe and a
pausing timer. What a person will notice first is not the motion but its
middle frames: the switch thumb and the leaving tab label lose contrast,
and two radios or two cards look selected for an instant. Studio is flat by
subtraction in several places (radios, slider nudge, row glide, button
nudge) where the registry promises stepped motion.

## Part 3: the ten weakest interactions

| # | Interaction | What is wrong | Fix |
| --- | --- | --- | --- |
| 1 | `switch-stretch` | thumb and fill cross in luminance for 40 to 80ms (B3); on touch the spring is lost (N1) | on: switch the thumb color at once; off: hold the on color until the fill under the thumb has faded; do not let the press transition carry the travel while `:active` lingers after a tap |
| 2 | `switch-drag` | held midway the thumb is 1.08:1 (B4) | step the thumb color at progress 0.5; keep the fill opaque under the thumb and let only its clip follow |
| 3 | `tab-slide` | the soft Tabs pill paints over the label it leaves (B1); dark labels on Highlight under forced colors (B2); 409ms of script at 4x per press (B14); the ink leads the pill under zoom (N30) | one list level indicator under the labels, or `isolation: isolate` with the labels above; skip the ink under forced colors; build the twins once and batch reads before writes; scale the slide offsets by the zoom factor |
| 4 | `field-label-focus` (floating) | the label is hidden under an opaque box at rest (B6) and off centre at lg, iOS and Android | drop `order: -1` or raise the label; read the box size and inset from the control per size and platform |
| 5 | `toast-stack`, `toast-expand` on iOS | the stack grows up into the status bar and the front toast jumps on expand (B7) | set `--_toaster-dir: 1` and `--_toaster-align: start` with the iOS placement, and swipe up |
| 6 | `check-mixed` | unchecked to mixed draws part of a check first (B5) | from unchecked, take the dash's angles at once and only draw |
| 7 | `dialog-refuse` | focus falls to the body (B8) | prevent the default focus change on a refused backdrop press |
| 8 | `wizard-step` | a loading spinner and label morph on every Next, plus two entrances on one diagonal (N13) | show loading only for a check still pending after a frame; drop the `@starting-style` rise |
| 9 | `menu-origin`, `menu-rows` | an empty card for 80 to 120ms and rows readable at 222 / 262ms in Desk and Liquid (N25) | fade the rows in with the surface and stagger only the rise, or cap the delay so the last row is readable by 200ms |
| 10 | `copy-swap` | the leaving word crosses the top border and the words overlap (N4) | clip the label cell on both axes; shorten the overlap |

Close behind: `picker-chevron-turn` (N27), `password-reveal` (N11),
`button-result` (N7), `radio-pop` in Studio (N3), the Neutral toast timer
(N20) and `progress-celebrate` before the fill lands (N38).

## Part 4: performance

`perf.cjs`: a phone viewport (390 by 844, touch), 4x CPU throttling through
CDP, one trigger, then a Chromium trace of the trigger plus 1200ms. Frames
are the compositor's frame reports (one per frame sequence); "dropped" is
`STATE_DROPPED`; long tasks are main thread tasks over 50ms. The gallery runs
the Vite development build, so React costs more than in production;
`button-press` is the baseline for the React and gallery cost of one press.
Runs at a machine load under 1. Evidence: `perf.liquid.json`,
`perf.neutral.json`, `perf.cpu-profile.json`.

| Interaction | Paint properties | Liquid: presented / dropped frames | Liquid: long tasks (ms) | Neutral: presented / dropped | Neutral: long tasks (ms) |
| --- | --- | --- | --- | --- | --- |
| `button-press` (baseline) | none | 19 / 3 | 73 | 1 / 5 | 114 |
| `switch-stretch` | clip-path, box-shadow, colors | 32 / 5 | 103 | 15 / 6 | 77 |
| `switch-drag` | box-shadow | 48 / 5 | none | 28 / 4 | none |
| `focus-glow` | box-shadow | 26 / 1 | none | 15 / 0 | none |
| `card-lift` | box-shadow | 25 / 6 | 113 | 15 / 6 | 78 |
| `link-underline` | clip-path, color | 2 / 1 | none | 2 / 1 | none |
| `alert-entrance` | clip-path, box-shadow | 34 / 12 | 207 | 16 / 9 | 158 |
| `accordion-reveal` | clip-path | 19 / 25 | 394 | 19 / 10 | 151 |
| `slider-fill` | clip-path | 20 / 12 | 189 | 22 / 27 | 404 |
| `menu-origin` | clip-path | 32 / 27 | 471 | 21 / 32 | 489 |
| `popover-spring` | clip-path | 32 / 24 | 109, 275 | 17 / 25 | 145, 259 |
| `command-palette-open` | backdrop-filter in the recipe | 12 / 53 | 601 | 15 / 47 | 597 |
| `dialog-spring` | backdrop-filter | 15 / 35 | 408 | 13 / 23 | 325 |
| `sheet-spring` | backdrop-filter | 16 / 19 | 269 | 16 / 21 | 344 |
| `toast-enter` | backdrop-filter in the Liquid recipe | 69 / 21 | 314 | 68 / 23 | 313 |
| `toast-stack` (three toasts) | clip-path | 90 / 66 | 224, 348, 354 | 90 / 65 | 296, 253, 270 and three near 60 |
| `toast-expand` (three toasts, then hover) | clip-path | 563 / 222 | 26 tasks, largest 558 | 565 / 217 | 25 tasks, largest 471 |
| `tab-slide` | clip-path, color | 16 / 57 | **821** | 9 / 67 | **1030** |

What it shows:

- The paint properties themselves are cheap. `focus-glow`, `switch-drag`
  and `link-underline` drop 0 to 5 frames with no long task. The
  `backdrop-filter` interactions lose most of their frames inside the open
  task (React mounts the overlay), not during the blur animation: the frames
  after the task are presented.
- Opening a dialog, sheet, menu or palette costs 260 to 600ms of main thread
  at 4x, against about 100ms for a button press. Most of it is the
  development build and Radix's mount; it is noted for a production check.
- **`tab-slide` is the outlier: 821 to 1030ms in one task.** The V8 profile
  puts 409ms of self time in `playInk` (`packages/react/src/components/Tabs/ink.ts:110`),
  which clones each label, reads `getBoundingClientRect` and
  `getComputedStyle` for every part between DOM writes, and calls
  `getAnimations`. This is the interaction's own code, not the framework
  (B14).
- **`toast-expand`: 25 long tasks in 1.5s of hover.** 777ms of self time in
  `writeStack` (`packages/react/src/components/Toast/stack.ts:67-87`), which
  reads `offsetHeight` after writing custom properties in the same loop, and
  runs on every child list change in the toasts' subtree (`:107`) and every
  resize (N44).
- A switch toggle spends 90 to 108ms of style recalculation at 4x on a 49
  element stage, against 39ms for a button press (N45).

## Part 5: regressions

### Contract suites

- **React: 111 components, 4411 passed, 1 failed, 163 skipped**
  (`contract.react.json`). The failure is "Autocomplete: keyboard map"
  (`packages/contract-tests/src/contract.spec.ts:412`), a 1.5 minute timeout
  at a load of 22; run alone it passes, 37 passed (N48). The run hit the 2
  hour limit after ListBox; ListBox to WindowControls ran again: 2259 passed,
  0 failed. The suite's own `docs/reports/contract-react.json` was not
  overwritten.
- **Angular: 59 components, 2254 passed, 24 failed, 69 skipped**
  (`contract.angular.json`). All 24 are the anatomy check
  (`contract.spec.ts:354`) in four styles for six components whose manifest
  now lists a part Angular does not render (B12).

### Axe (wcag2a, wcag2aa, wcag21aa, wcag22aa)

- `/interactions` in Studio, Desk, Neutral and Liquid, light, English and
  Arabic RTL, at rest and after "replay all" paused at 50%
  (`axe.interactions-page.json`): clean in Studio, Neutral and Liquid. Desk
  light fails `color-contrast` on the Select placeholder of the `menu-rows`
  stage, 4.12:1 at rest and 4.39:1 mid motion (N46).
- Round 2 B8 (the Tabs stage without a panel) is fixed
  (`recheck.b8.tab-slide.json`).
- The 76 components touched by 1.23, Neutral light and Studio dark, English
  and Arabic, 304 runs (`axe.components.json`): clean, except Navbar
  `aria-hidden-focus`, which its manifest already skips.

### Target size

- `/interactions`, desktop, four styles, 464 interactive elements each, at
  rest and at 50% of motion (`target.interactions-page.json`): nothing under
  24 by 24. The gallery's top links and the HoverCard link (19 to 21px tall)
  pass by the spacing exception, as in round 2. No target shrinks during
  motion.
- Phone, 390 by 844, touch, Neutral light, the 76 touched components with
  `platform=ios` and `platform=android` (`target.phone.json`): nothing under
  24. The platform hit area of the button family is dead (B10).

### Angular gallery

Angular shares `packages/css`. Pixel diff at rest, 57 pages, 1024px,
threshold 0.1, Studio dark and Neutral light, LTR and RTL
(`angular.pixel-diff.json`, `angular.crop.*.png`): 0 differing pixels for 43
components. Same action played in both galleries, Neutral light LTR and RTL
and Studio dark LTR (`angular.interactions-play.json`):

| Result | Components |
| --- | --- |
| Same, with no Angular code | IconButton, CloseButton, FloatingActionButton, ButtonGroup, ToggleGroup, Dialog, Alert, Banner, Field, Input, Textarea, InputGroup, NumberField, PhoneField, SearchField, OTPField, ScrubInput, TagField, ErrorState, Link, ProgressBar, Skeleton, Spinner, StatusDot |
| Plays, a part missing | Switch (`thumb-lens`), Checkbox, CheckboxGroup, ConsentField, Fieldset (`mark`: the check shows with no draw), Button (`result`), ToggleButton (`state-layer`), CopyButton (`bubble`: Angular cross fades the icon, no word), DropdownMenu, SplitButton, Select, MultiSelect (`highlight`), Combobox, Autocomplete, ListBox (no highlight), Toast (`progress`: no timer line), Rating (`fill`), Form (`success-mark`), FormWizard, PasswordField, InlineEdit, Stepper, FilterBar, RadioCard (`badge`) |
| Broken | Slider and RangeSlider (no fill), ProgressCircle (no arc): B11 |
| Not compared | SegmentedControl, NotificationCenter, Meter, Callout, FieldError |

Angular also has no `floating` input on Field and no `variant` on Input
(N16).

## Part 6: the round 2 blockers

| # | Round 2 blocker | Status | Evidence | File and line |
| --- | --- | --- | --- | --- |
| B1 | Motion tokens not zeroed under `prefers-reduced-motion` per style mode | fixed | All 28 duration and delay tokens 0ms under emulated reduce in four styles, light and dark, except the two marked not motion. Component private durations 0 under both modes. The token build still writes no `:root[data-motion='reduce']` block (N47) | `recheck.b1.reduce-tokens.json`, `recheck.b1.attr-component-pages.json` | `packages/tokens/build.ts:612` |
| B2 | Eleven reduced blocks lose on specificity | fixed | Every trigger of Dialog, Popover, Lightbox, Tour, the DropdownMenu submenu, WindowControls, TabBar, Toolbar, EmptyState, ErrorState and SplitView plays 0 animations under media and attr in four styles | `reduce.sweep.*.json`, the `.media` runs in each `<id>.measure.json` | `Dialog.css:877-890`, `DropdownMenu.css:592-626`, `WindowControls.css:178-200`, `SplitView.css:91-105` |
| B3 | Window light dip and submenu nudge under reduced motion | fixed | Held window dot at `matrix(1, 0, 0, 1, 0, 0)` and submenu chevron at 0 under media and attr | `qa-overlays-selection.b3-recheck.json` | `WindowControls.css`, `DropdownMenu.css` |
| B4 | Digit roll reverses numbers in RTL and breaks Arabic | fixed for Pagination (16, 17, 25, 120), Stat (1,588), the slider and range slider bubbles (160%, 1,480 SAR), field step (99, 100, 101) and scrub roll (129, 130, 131), mid roll and settled. The Arabic FilterBar count reads the same in React and Angular at rest; its roll was not rechecked frame by frame | `qa-navigation-content.numbers-b4-b5.json`, `qa-inputs.checks.json`, `qa-inputs.slider-arabic-bubble.png`, `angular.pixel-diff.json` | `packages/motion/src/primitives/digit-roll.ts` |
| B5 | Pagination wrong numbers after rapid changes | fixed | 0 wrong slots after 2 and 10 changes 30ms apart and 6 direct presses, all styles, both directions | `qa-navigation-content.numbers-b4-b5.json`, `qa-navigation-content.pagination-rtl-ten.png` | `Pagination.tsx` |
| B6 | Menu trigger click lost within 100ms of close | fixed | 60 of 60 presses reopened on DropdownMenu, SplitButton and Select in four styles, at gaps down to 30ms; the hit test lands on the trigger during the exit copy | `qa-overlays-selection.b6-reopen.json` | `ListBox/highlightMarker.tsx` |
| B7 | Switch thumb vanishes on release | fixed in its round 2 form (no frame shows a thumb on an empty track); the frame contrast still fails, now from the thumb color cross (B3 of this review) | `switch-stretch.sheet.png`, `switch-stretch.measure.json` | `Switch.css` |
| B8 | Tabs stage without a panel (axe) | fixed | axe clean on the stage at rest and mid motion, four styles, LTR and RTL | `recheck.b8.tab-slide.json` | `apps/gallery-react/src/interactions/navigation.tsx` |
| B9 | Recordings missing | partly fixed (B13) | 19 of 21 family clips and 303 of 327 sheets on this branch; all on `origin/claude/ds-order-1-23`; the Neutral feedback clip lacks 12 of 19 interactions on both | `recheck.b9.recordings.json` | `docs/reports/shots/interactions-3/` |

Round 2 notes rechecked on the way: N18 (`toc-travel` did not travel) is
fixed. N12, N13, N14, N21, N22, N28 and N31 are still true (N12, N11, N13,
N36, N32, N33 and N41 below).

## Part 7: findings

### Blockers

**B1. blocker: the soft Tabs pill paints over the label it leaves, in Desk and Liquid (rule 7; WCAG 1.4.3 on the frames of the motion).**

- Where: `packages/react/src/components/Tabs/Tabs.tsx:261` renders the
  indicator inside the active trigger, and
  `packages/css/src/components/Tabs.css:248` positions it absolutely with no
  stacking order. Sliding back toward an earlier tab, the pill paints after
  that tab's label and its ink twin.
- Measured on the leaving label: Desk light 5.09:1 at rest, 1.0:1 at 20 to
  40ms; Desk dark 7.3 to 1.0 at 20ms; Liquid light 7.48 to 1.87 at 60ms;
  Liquid dark 6.43 to 4.43. Studio and Neutral, with a translucent pill,
  stay over 5.
- Fix: one list level indicator under every trigger, as SegmentedControl
  does, or `isolation: isolate` on the list with the indicator under the
  labels.
- Evidence: `qa-navigation-content.ink-desk-t40.png`,
  `qa-navigation-content.ink-liquid-t80.png`,
  `qa-navigation-content.ink-contrast.json`, `tab-slide.sheet.png`.

**B2. blocker: under forced colors the label ink makes the selected label unreadable for the whole slide (rule 11).**

- Where: `packages/react/src/components/Tabs/ink.ts:110` (`playInk`) has no
  forced colors check, and runs while
  `packages/css/src/components/SegmentedControl.css:244` hides the
  indicator. The twins draw the selected label dark on the Highlight fill.
- Measured in Neutral: "Week" and "Center" dark on Highlight for 158 to
  300ms.
- Fix: return early when `(forced-colors: active)` matches or the indicator
  is not visible.
- Evidence: `qa-navigation-content.forced-ink-mid.png`,
  `qa-navigation-content.forced-colors.png`.

**B3. blocker: the switch thumb loses contrast for 40 to 80ms on every toggle (rule 7; WCAG 1.4.11 on the frames of the motion).**

- Where: `packages/css/src/components/Switch.css:343-346` crosses the thumb
  color over `--_switch-duration-color` (100ms) on `ease.out`; turning on,
  `:493-498` shows the fill at once (`step-start`); turning off, `:312-315`
  fades the fill on `ease.in` over the travel. The thumb crosses early and
  the fill fades late, so they meet.
- Median contrast of the thumb against the pixels around it:

  | Style and scheme | Turning on | Turning off | Rest |
  | --- | --- | --- | --- |
  | Neutral light | 1.39 at 20ms (minimum 1.02) | 1.10 at 60ms; 1.2 to 1.5 from 40 to 180ms on touch | on 5.17, off 7.0 |
  | Studio light | | 1.58 at 60ms | |
  | Studio dark | | 1.50 at 80ms | |
  | Desk dark | 1.82 at 0ms | 1.34 at 120ms | |
  | Liquid light | ring minimum 1.06 to 1.21 at 0 to 40ms | | |
  | Desk light, Neutral dark | 5.0 or more, 2.25 or more | 5.0 or more, 3.11 or more | |

- Round 2 B7 asked that the state indicator keep contrast through the
  travel. It no longer vanishes, but it still drops under 1.5:1.
- Fix: turning on, switch the thumb color at once (white on the full fill is
  5.17:1 from frame 0). Turning off, hold the on color until the fill under
  the thumb has faded, on the same duration and ease, or step it at the
  middle of the travel.
- Evidence: `switch-stretch.sheet.png`,
  `qa-toggles-actions.switch-frames.dark.png`,
  `qa-toggles-actions.switch-frames.touch.png`, `switch-stretch.measure.json`.

**B4. blocker: a switch drag held near the middle leaves the thumb almost invisible for as long as it is held (rule 7).**

- Where: `packages/css/src/components/Switch.css:506-516` mixes the thumb
  color from off to on with `--_switch-drag-progress`, while the fill
  opacity follows the same progress.
- Measured at progress 0.49: Neutral light 1.08:1, Desk dark 1.33:1, Studio
  1.82:1; Liquid 2.5 to 2.8:1.
- Fix: step the thumb color at 0.5, or keep the fill opaque under the thumb
  and let only its clip follow.
- Evidence: `switch-drag.sheet.png`, `switch-drag.measure.json`
  (`heldMidDrag`).

**B5. blocker: from unchecked to mixed, the select all box first draws part of a check, then turns it into the dash (shows the wrong state).**

- Where: `packages/react/src/components/Checkbox/Checkbox.tsx:105-111` keeps
  the last glyph, a check before any mixed state;
  `packages/css/src/components/Checkbox.css:226-236` and `:272-276` then
  turn that check into the dash while it draws.
- Measured: Studio shows a small check from 20 to 50ms; Desk two dots and two
  dashes from 20 to 80ms; Neutral and Liquid a bent smile from 20 to 60ms.
- Fix: coming from unchecked, take the target glyph's angles at once and
  only draw.
- Evidence: `check-mixed.sheet.png` (row un2mix), `check-mixed.measure.json`.

**B6. blocker: the floating label is hidden under the control box at rest (WCAG 3.3.2).**

- Where: `packages/css/src/components/Field.css:108-114` gives the label
  `order: -1` and a transform, so it paints before the positioned Input root
  (`Input.css:63`) and under it. The comment at `:107` says the opposite.
  `Field.css:131` makes the placeholder transparent at rest.
- Result: in Neutral and Liquid, where the box is opaque white, and at size
  lg and with `platform=ios` and `android`, an empty floating field shows no
  text at all. On focus the label climbs out from behind the top border. In
  Studio and Desk it shows through the translucent box, but a person who
  types at once sees the label over the text for 20 to 40ms.
- Also: `Field.css:53-55` fixes the rest place to `size.control.md` and
  `space.m`, so at lg, iOS (`platform/ios.css:225`) and Android
  (`platform/android.css:347`) the label rests 10 to 25px off centre.
- The gallery has no demo of `floating`; the reviewer set `data-floating`,
  `data-filled` and the label after the control, as `Field.tsx:133-135`
  renders them.
- Fix: drop `order` or raise the label above the box; read the box size and
  inset from the control.
- Evidence: `qa-inputs.floating-label.rest.png`,
  `qa-inputs.floating-label.png`, `qa-inputs.floating-label.json`.

**B7. blocker: on iOS a Toaster at the default position stacks and expands upside down, and the front toast jumps from under the finger (rules 5 and 6; wrong state).**

- Where: `packages/css/src/platform/ios.css:623-629` moves every toaster to
  the top and reverses it, but does not set the two properties that
  `packages/css/src/components/Toast.css:196-200` sets for a top toaster
  (`--_toaster-dir: 1`, `--_toaster-align: start`), and that its own comment
  at `:195` asks a platform to set. `Toaster.tsx:146` (`swipeFor`) reads the
  position prop, so the swipe stays sideways. The gallery mounts `<Toaster />`
  with no `position` (`apps/gallery-react/src/Interactions.tsx:124`).
- Measured in Neutral at 390 by 844 with `platform=ios`: the toaster sits at
  y 16 with `data-position="bottom-end"` and `--_toaster-dir: -1`; the older
  toasts peek up into the status bar area (y 0 and 8); on expand the front
  toast moves from y 16 to y 181. The same in all four styles.
- Fix: set the direction and alignment in `ios.css` with the placement, and
  resolve the iOS placement in the Toaster so `swipeFor` gives "up".
- Evidence: `qa-overlays-selection.toast-platform.json`,
  `qa-overlays-selection.toast-platform.neutral.ios.collapsed.png`,
  `qa-overlays-selection.toast-platform.neutral.ios.expanded.png`.

**B8. blocker: a refused outside press on AlertDialog, or on a Dialog that refuses outside presses, moves focus to the body (WCAG 2.4.3, 2.4.7).**

- Where: `packages/react/src/components/Dialog/DialogBase.tsx:285-290`. The
  backdrop `pointerdown` plays the nudge but never prevents the default
  focus change.
- Measured in four styles, full and media: focus on "Cancel" before the
  press, on BODY 30ms and 630ms after. Tab brings it back.
- Fix: `event.preventDefault()` on a refused press, or refocus the last
  focused element in the panel.
- Evidence: `qa-overlays-selection.dialog-refuse.json`.

**B9. blocker: the Desk dialog scrim keeps `blur(8px) saturate(1.3)` under more contrast and forced colors (rule 10; anatomy contract).**

- Where: `packages/styles/desk/recipes/Dialog.css:41` sets
  `--_dialog-scrim-filter` directly. Only the reduced transparency block at
  `:159-164` resets it; the more contrast blocks at `:166-172` and
  `:174-178` and the forced colors block at `:180-186` do not, and the base
  reset of `--_dialog-backdrop-blur` cannot reach it.
- The Desk scrim also stays at alpha 0.28 under reduced transparency, where
  every other style goes to 0.8.
- Fix: reset `--_dialog-scrim-filter: none` in all four blocks.
- Evidence: `qa-overlays-selection.blur-fallbacks.json`,
  `qa-overlays-selection.dialog-forced.desk.png`.

**B10. blocker: the iOS and Android hit areas of the button family no longer take a press (a regression of 1.23; PLAN.md: touch targets 44pt on iOS, 48dp on Android).**

- Where: `packages/css/src/platform/ios.css:90-96` and
  `packages/css/src/platform/android.css:109-115` grow a transparent
  `::before` to 44 or 48px around a smaller control. Order 1.23 made that
  same `::before` the pointer glow with `pointer-events: none`
  (`packages/css/src/components/Button.css:290-299` for button, icon-button,
  toggle-button, copy-button and floating-action-button;
  `CloseButton.css:70-77`). The platform rules do not set `pointer-events`,
  so the grown area is dead. Before 1.23 buttons had no `::before`.
- Hit test 1px inside the intended area: iOS, Button 13 of 35, IconButton 0
  of 8, CloseButton 0 of 9; Android, Button 13 of 143, IconButton 0 of 142,
  CloseButton 0 of 24. Chip, which has no glow, 76 of 76 on both.
- The glow and the hit area also share one pseudo element, so the hit inset
  grows the glow.
- Fix: put the hit area on another layer (`::after` is the hover veil by the
  anatomy convention, so a part or an outline trick), or set
  `pointer-events: auto` in the platform rules and keep the glow inset.
- Evidence: `target.phone.json`.

**B11. blocker: the Angular Slider, RangeSlider and ProgressCircle show no value (WCAG 1.4.11; frameworks contract: the shared CSS must match the Angular DOM).**

- Slider: the fill moved to the track's `::before`, clipped by
  `--_slider-from` and `--_slider-to`
  (`packages/css/src/components/Slider.css:109-115`, `:205`, vertical
  `:398-401`), and the range part has no paint (`:194`). Only React sets
  those properties. Angular still paints the range span
  (`packages/angular/src/components/slider/slider-base.ts:82`). Result: no
  fill. 10000 to 12000 differing pixels.
- ProgressCircle: the arc is now an SVG part (`ProgressCircle.css:101-106`)
  and the conic mask is gone. Angular renders only the indicator span
  (`packages/angular/src/components/progress-circle/progress-circle.ts:66`).
  Result: a grey track, no value arc, no indeterminate arc. 11500 to 12300
  differing pixels.
- Evidence: `angular.crop.slider.neutral-ltr.png`,
  `angular.crop.range-slider.neutral-ltr.png`,
  `angular.crop.progress-circle.neutral-ltr.png`, `angular.pixel-diff.json`.

**B12. blocker: the Angular contract suite is red, and six manifests still say Angular is ready.**

- 24 failures of the anatomy check (`contract.spec.ts:354`), four styles
  each: Button `result` (`packages/manifest/src/component/Button.manifest.json:33`),
  Checkbox `mark` (`Checkbox.manifest.json:26`), ProgressCircle `arc`
  (`ProgressCircle.manifest.json:23`), RadioCard `badge`
  (`RadioCard.manifest.json:28`), Switch `thumb-lens`
  (`Switch.manifest.json:28`), ToggleButton `state-layer`
  (`ToggleButton.manifest.json:24`).
- Fix: port the parts, or mark the Angular status `planned` until they are
  ported. Either way it is a lead decision.
- Evidence: `contract.angular.json`.

**B13. blocker for acceptance: the round 3 recordings are incomplete.**

- `docs/reports/shots/interactions-3/clips/feedback.neutral.webm` is 61.6s
  against 134.2s for Studio. It ends on `stat-roll` and a blank stage: the
  12 interactions from `progress-spring` to `split-view-pane` are missing.
  The same file on `origin/claude/ds-order-1-23`.
- On this branch the actions family has no Studio and Desk clips and no
  Studio and Desk sheets (2 clips and 24 sheets). The order branch has them.
  `navigation.neutral.webm` is 22.6s here and 87.0s there.
- Fix: record the Neutral feedback clip again, and merge the later recordings
  of the order branch.
- Evidence: `recheck.b9.recordings.json`.

**B14. blocker: a tab press blocks the main thread for 821 to 1030ms on a phone at 4x throttle (order 1.22 and 1.23: never block input).**

- Where: `packages/react/src/components/Tabs/ink.ts:110` (`playInk`). For each
  part it clones the label, then reads `getBoundingClientRect` and
  `getComputedStyle` between DOM writes, and reads `getAnimations`. The V8
  profile gives it 409ms of self time at 4x, about 100ms on an unthrottled
  machine, for one press.
- Every other interaction with a paint property stays within about 4 times
  the `button-press` baseline; this one is 7 to 9 times it. A second tap in
  that window waits.
- Fix: read every box and color first, then write; build the twins once per
  list and reuse them; skip the ink when the style turns it off before any
  read (the `--_tabs-ink` check comes after `clearInk`, which is fine, but
  the colors are read for every part).
- Evidence: `perf.liquid.json`, `perf.neutral.json`,
  `perf.cpu-profile.json`.

### Notes

Toggles and actions:

- **N1.** On touch Chromium holds `:active` 150 to 250ms after a tap, so the
  switch travel runs on the press transition (70ms, `Switch.css:415-420`)
  and the spring only shows as the stretch lets go. Desk loses its swing on
  a phone; Neutral travels in 70ms, not 200. The same press rule pattern may
  apply to the checkbox, radio and button. Evidence:
  `switch-stretch.measure.json` (`liveTouchVsPointer`).
- **N2.** Two options look selected during the change: `radio-pop` 40 to
  80ms, `radio-card-lift` 40 to 120ms (`radio-pop.sheet.png`,
  `radio-card-lift.sheet.png`).
- **N3.** Studio RadioGroup has `--_radio-group-motion: 0`: no dip, no veil
  fade, no stepped cut, while `packages/motion/src/interactions/toggles.ts:162`
  promises "a flat cut in steps". Studio RadioCard animates, so Studio is not
  consistent with itself.
- **N4.** The CopyButton roll is clipped only on the inline axis
  (`packages/css/src/components/CopyButton.css:218-249`, `overflow-x:
  clip`). The leaving word crosses the top border and the two words overlap
  at 30 to 60ms in every style and in Arabic (`copy-swap.sheet.png`).
- **N5.** ToggleButton's on state is weak in Neutral and Liquid: a 2px inner
  ring and a slightly darker fill (`toggle-pop.sheet.png`).
- **N6.** In Liquid light the off switch thumb is white on a light grey track
  (1.37 to 1.69:1); only the 1px ring carries its edge
  (`packages/styles/liquid/recipes/Switch.css:35-38`).
- **N7.** `button-result` shows no word and no tone; the Desk and Liquid
  cross ends at 680 to 685ms; the label and the leaving glyph overlap at
  about 40ms on the way back (`button-result.sheet.png`).
- **N8.** Under forced colors the RadioCard badge draws a dark check on a
  Highlight filled circle; the circle still shows the state
  (`qa-toggles-actions.forced-colors.png`).
- **N9.** An uncheck closes the fill to a centre dot for one frame at about
  120ms (`check-draw.sheet.png`).
- **N10.** `lostpointercapture` in `packages/react/src/components/Switch/drag.ts:165-169`
  could not be made to fire from a script; no run left `data-dragging`
  stuck.

Inputs and forms:

- **N11.** Round 2 N13 still true: `PasswordField.tsx:129` fades the whole
  input from 0. Frame 0 is blank, 0.44 to 0.58 at 40ms. Start at 0.6 or more,
  or fade the glyphs only.
- **N12.** Round 2 N12 still true: one frame after the trigger the next
  control drops 48px (Neutral `field-message-enter`), 42px (Studio
  `field-error-enter`), 13px (Neutral `field-error-enter`) and 135px (the
  form summary).
- **N13.** Round 2 N14 still true: `FormWizard.tsx:407` sets `checking` and
  `:554` passes it as `loading`, so every Next plays the dip, the spinner
  and the label morph; the label is back at 0.9 at about 230ms. Also,
  `FormWizard.css:161-173` keeps an `@starting-style` rise that runs with the
  WAAPI slide, so the new step travels on a diagonal with two timings.
- **N14.** The OTP caret is not mirrored in RTL
  (`packages/css/src/components/OTPField.css:219`), and the registry says
  both "toward the inline start" and "from the left"
  (`packages/motion/src/interactions/fields.ts:228`, `:230`).
- **N15.** The slider value bubble covers the value output and the label
  while held, and sits under the finger on a phone (`Slider.css:303-326`;
  `qa-inputs.touch.png`).
- **N16.** Angular has no `floating` input on Field and no `variant` on Input
  (`packages/angular/src/components/field/field.ts`,
  `packages/angular/src/components/input/`); neither prop has a demo case in
  React.
- **N17.** `error-shake` in Neutral reverses about 25 times a second for
  200ms. Not a flash, once per change, but it reads as a buzz.
- **N18.** In Desk `form-submit-success` the Send label jumps and clips at
  20 to 100ms (`form-submit-success.sheet.png`).
- **N19.** On Android the focus border steps from 1 to 2px at once
  (`packages/css/src/platform/android.css:361`), a 1px content nudge.

Overlays, menus and lists:

- **N20.** The Neutral toast timer line is the border color on white, about
  1.3:1 (`Toast.css:241`, `packages/styles/neutral/recipes/Toast.css:23`).
- **N21.** In Liquid a bottom toast drops in from above, 12px
  (`packages/styles/liquid/recipes/Toast.css:36`); the comment at `:20-21`
  is stale.
- **N22.** In Studio the popover and tooltip exits (100ms) are slower than
  the entrances (70ms).
- **N23.** `HoverCard.css:193-215` has no reduced transparency block; only
  the Desk and Liquid recipes cover it.
- **N24.** The Desk toaster keeps `gap: 0` and negative margins from the old
  column stack (`packages/styles/desk/recipes/Toast.css:115-123`); the
  expanded cards touch.
- **N25.** In Desk and Liquid the menu rows are readable at about 222 and
  262ms, and an empty card shows for 80 to 120ms (`menu-origin.sheet.png`,
  `menu-rows.sheet.png`).
- **N26.** `tooltip-follow`: the old tooltip fades over 100ms while the new
  one slides, so two show; the registry says it hides at once.
- **N27.** `picker-chevron-turn`: the Select's up and down chevron turns
  through a sideways `<>`. Flip it (scaleY) instead of turning it.
- **N28.** The Sheet handle takes its speed from the last move only and
  never decays it on a pause before release
  (`packages/react/src/components/Sheet/Sheet.tsx:236-240`). No false close
  was proven.
- **N29.** The toast line starts at mount and the timer at commit; they
  drift by up to about 150ms.

Navigation and content:

- **N30.** The tab ink runs about 10px ahead of the pill under CSS zoom.
  `slideBoxes` (`Tabs/ink.ts:54-70`) adds a translate in CSS px to a box in
  viewport px. Scale by the factor already computed in `playInk`.
- **N31.** Off rows that leave motion: `skeleton-swap` (`content.ts:96`, the
  ghost wipe), `progress-spring` (`content.ts:123`, the digit roll),
  `status-pulse` (`content.ts:165`, the Avatar ping and pop), `scrub-roll`
  (`fields.ts:310`, the digit roll).
- **N32.** Round 2 N22 still true for the dot Badge
  (`Badge.tsx:96`): 10 pops in 594ms.
- **N33.** Round 2 N28 still true: a Meter below the fold keeps an inline
  `scaleX(0)` (`Meter.tsx:168-169`), also in print. `Meter.tsx:180` drops the
  transition after `duration.reveal` plus 50ms, which cuts a style's longer
  `--_meter-reveal-duration`.
- **N34.** `sidebar-collapse` expand: the last label starts at + 270ms in
  Desk and is whole at 610ms (Liquid 615ms).
- **N35.** The Pagination pill flies from the old slot's box across wrapped
  lines (`pagination-roll.sheet.png`).
- **N36.** Round 2 N21 still true: the spinner pauses only through
  `pauseLoops()`.
- **N37.** The Navbar label ink never plays: rest and current share one
  color in every style.
- **N38.** `progress-celebrate` fires in the same frame as the value change,
  before the bar lands; the ProgressCircle arc overshoots past full in Desk
  and Liquid and opens a hairline gap at 12 o'clock at 200 to 300ms
  (`qa-navigation-content.celebrate-desk-liquid.png`).
- **N39.** The Liquid SegmentedControl lens drops `backdrop-filter` under
  reduced transparency but keeps a 62% white fill
  (`packages/styles/liquid/recipes/SegmentedControl.css:35-44`); it sits on a
  solid track, so it passes.
- **N40.** Under forced colors the current Pagination page shows by weight
  only; the Highlight border at `Pagination.css:168-171` did not draw
  (`qa-navigation-content.forced-pagination.png`).
- **N41.** Round 2 N31 still true: Arabic stages keep "Live visitors", "Jump
  three pages" and "Since 9:00" in English.

Across the round:

- **N42.** The registry text does not match what plays, again. Beats quote
  Neutral 180 / 220 and Desk bouncy 440, Studio snappy 80, Studio nudge 1px
  and shift 2px; the tokens are 158 / 200, 380, 70 and 0px, so several Studio
  beats never move (slider nudge and pull, button nudge, label rise, caret,
  row glide). Examples: `toggles.ts:26`, `:46`, `:108`; `buttons.ts:38`,
  `:100`, `:127`, `:135`, `:232`; `fields.ts:27`, `:59`, `:80`, `:540`,
  `:579`; `navigation.ts:16-17`, `:141`, `:196`; `content.ts:9-10`, `:157`;
  the submenu nudge (6 / 4 / 6px held against "3 / 2px"). No row can carry a
  Liquid line, because `styles` allows three style ids
  (`packages/motion/src/interactions/types.ts:50`). The registry is what the
  owner approves.
- **N43.** No style sets `--_switch-thumb-size-rest`, so the "thumb dot that
  grows as on Android" is a hook with no user. Order 1.25 (platform axis)
  should set it for `platform=android`.

Performance:

- **N44.** `writeStack` (`packages/react/src/components/Toast/stack.ts:67-87`)
  reads `offsetHeight` after writing custom properties in the same loop, and
  the MutationObserver at `:107` watches the whole subtree for child list
  changes. A 1.5s hover over three toasts gives 25 long tasks and 777ms of
  self time at 4x.
- **N45.** A switch toggle costs 90 to 108ms of style recalculation at 4x on
  a 49 element stage, against 39ms for a button press. Worth a look with the
  production build before any change.

Regressions:

- **N46.** Desk light `/interactions` fails axe `color-contrast` on the
  Select placeholder of the `menu-rows` stage (#65635e on #d7d6d1, 4.12:1;
  `apps/gallery-react/src/interactions/selection.tsx:186`,
  `packages/css/src/components/Select.css:150-151`), and on a second node
  mid motion. Select.css did not change in 1.23 and round 2 did not run Desk
  light, so this is not a round 3 regression, but the acceptance page should
  be clean.
- **N47.** The token build still writes no `:root[data-motion='reduce']`
  block, so on the React component pages the tokens keep their values under
  the attribute. Every component's own attribute rule stops the motion; the
  one leftover is a 300ms Desk Button label transition between equal
  transforms, which moves nothing.
- **N48.** The React contract case "Autocomplete: keyboard map" times out at
  1.5 minutes under a load of 22; it passes alone.

## Not run

- `@supports not (backdrop-filter)`: cannot be emulated in Chromium; read in
  the CSS (`Dialog.css:901`, `Switch.css:586-590`, the Desk and Liquid
  recipes).
- A real phone. Touch was emulated in Chromium.
- Dark scheme beyond the switch, the tab ink and the Studio dark axe and
  pixel runs.
- RTL frames for the checkbox and radio, and RTL contact sheets in general
  (RTL is in the measure files).
- The Angular motion comparison in Desk and Liquid; Angular for the pages
  that have no Angular route (Sheet, Tabs, TabBar, the Toast stack).
- The tour ring travel on Next, the picker value roll on pick, the Lightbox
  zoom from the thumbnail, `handle-grip` dragging, the rubber band by touch,
  drag and swipe gestures in the reduce sweep.
- Frame by frame for `copy-bubble`, `button-glow`, `segment-press`,
  `button-nudge`, `close-turn`, `split-chevron`, `fab-morph` and
  `link-underline` (sweep data only), and the CopyButton return and failure
  path.
- The Arabic FilterBar count roll frame by frame (B4 of round 2, third part).
- A production build for the performance traces.
- The React contract suite in one run (it hit the 2 hour limit; it ran in two
  parts).
