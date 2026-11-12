# Review: interactions and the late fix round

Fresh eyes review by ds-qa of order 1.21 (the 24 interactions in section 4 of
`docs/reports/interactions.md`) and of the fix round for the late lanes
(`docs/reports/fixes/late-lanes.md`). Branch `claude/ds-review-interactions`,
cut from `claude/relaxed-hypatia-7gseap`. No component source, CSS, manifest,
token or test was edited. Four reviewers split the work (claude-opus-5-5 at
medium): two measured the interactions in Chromium, one ran the contract
suite, axe, the Angular gallery and a static sweep, one rechecked the late
blockers. The lead read the code behind every blocker before it went into
this file.

Evidence is under `docs/reports/reviews/shots/interactions/`. Per
interaction measurements are in `<id>.all.measure.json` (the first twelve
rows) and `<id>.all.runs.json` (the last twelve rows). Files for the contract
suite, axe, Angular and the static sweep start with `contract.`, `axe.`,
`angular.` and `static.`. Files for the late round start with `late.`.

## How it was measured

- React gallery `/interactions?style=<studio|desk|neutral>&scheme=<dark|light>&chrome=0`,
  and the same with `&dir=rtl&lang=ar`. Every interaction ran in Studio,
  Desk and Neutral, in LTR and in Arabic RTL.
- `document.getAnimations()` was sampled on every frame after the trigger,
  with each animation's timing, keyframes and play state. The computed
  transition of each target was sampled too.
- The reduced form was played twice: once under `emulateMedia({ reducedMotion: 'reduce' })`
  and once under `data-motion="reduce"` on `<html>`, the gallery's own switch.
- The `off` private properties of the registry were injected under
  `@layer ds.recipes` to prove that a style can turn each CSS interaction off.
- Rapid triggers ran 30ms apart. Interrupted triggers reversed the action
  before the motion ended. Both were fired from inside the page.
- The machine was shared, with a load average of 46 to 50 on 4 cores. So the
  durations below are the values the animations carry
  (`effect.getTiming()`), which matched the tokens in every run. Wall clock
  frame sampling ran 0 to about 200ms over them. The action delay is given
  as an order of events: the state change came on the same frame as the
  first animation frame, or before it.

`npm run check` is green on this branch, 13 of 13 steps.

## Verdicts

| Area | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| Interaction round (24 interactions) | fix needed | 3 | 15 |
| Late fix round (17 blockers plus Sidebar) | fix needed | 3 | 10 |

## Part 1: interactions

Durations are Studio / Desk / Neutral in ms. "Reduced, media" is the form
under `prefers-reduced-motion`. The rapid, interrupted and input checks
passed for all 24, so the table leaves them out. The state never waited on
the motion in any run. Every transition and keyframe in every run touched
only `transform` or `opacity` (and the `translate`, `scale` and `rotate`
properties).

| Interaction | Measured duration | Ease | Properties | Reduced, media | Verdict |
| --- | --- | --- | --- | --- | --- |
| `button-press` | 70 / 70 / 70 | `ease.out` | transform, scale 0.97 | no scale | **blocker** (B2: no reduced form under `data-motion`); gallery axe **blocker** (B3) |
| `copy-swap` | 120 / 120 / 150 | `ease.emphasized` in, `ease.exit` out; Neutral `ease.out` | transform (6px), opacity | 0ms, nothing visible | pass |
| `check-draw` | 140 / 140 / 180; uncheck 80 | `ease.out` | transform on clip and mark, opacity | mark at once | **blocker** (B1: ring fades in) |
| `switch-stretch` | press 70, slide 140 / 140 / 180 | `ease.out`, slide `ease.emphasized` | transform, scaleX 1.1536 | thumb jumps | **blocker** (B1, B2); notes N6, N7 |
| `rating-fill` | run 120 (fade) / 300 / 340; step 140 / 180 | `ease.emphasized`; Neutral `ease.out` | transform, opacity | none | **blocker** (B1); note N1 |
| `focus-glow` | in 120 / 120 / 150, out 80 | `ease.out` | transform (from 0.98), opacity on `::before` | glow at once | pass, ring at once |
| `error-shake` | none / 300 / 180 | `ease.out` | transform, translateX 4px then 2.67px | none | pass |
| `password-reveal` | 120 / 120 / 150 | `ease.emphasized`; Neutral `ease.out` | transform, opacity | none | pass |
| `otp-fill` | per cell 120 (fade) / 140 / 180; paste run 120 / 340 / 380 | `ease.emphasized`; Neutral `ease.out` | transform, opacity | none | pass; note N8 |
| `field-step` | 120 (fade) / 120 / 150 | `ease.emphasized`; Neutral `ease.out` | transform (6px), opacity | none | pass |
| `slider-pull` | 120 / 120 / 150 | `ease.emphasized` | transform, scale 1.1536 | no lift | **blocker** (B1, B2); note N7 |
| `slider-nudge` | 120 / 120 / 180 | `ease.out` | transform, 4px, composite add | none | **blocker** (B1, on the thumb) |
| `menu-origin` | in 120 / 120 / 150, out 100 | `ease.emphasized` in, `ease.exit` out | transform, scale 0.97, opacity | none | note N2 (RTL origin), N7 |
| `tooltip-rise` | 120 / 120 / 150 | `ease.out` | transform (5.7 or 7.4px), opacity | none | pass |
| `toast-enter` | 140 / 140 / 180 | `ease.out` | transform, scale 0.98, opacity | none | pass |
| `toast-stack` | 120 / 180 / 180 | `ease.emphasized`; Neutral `ease.out` | transform (FLIP) | none | pass |
| `toast-swipe` | spring back 120 / 120 / 150; out 150 | `ease.emphasized` | transform (140px), opacity | none | pass |
| `dialog-spring` | in 120 / 300 / 150, out 120 / 220 / 150 | `ease.emphasized`; Desk `cubic-bezier(0.2, 0.8, 0.2, 1)` | transform, opacity | none | note N4, N5, N7 |
| `sheet-spring` | in 180 / 180 / 180, out 120 / 220 / 150 | `ease.emphasized` in, `ease.exit` out | transform (100%), opacity | none | note N4, N7 |
| `tab-slide` | 140 / 140 / 180 | `ease.standard`; Neutral `ease.out` | transform (FLIP) | none | pass |
| `accordion-reveal` | 180 / 180 / 180; chevron 120 / 120 / 150 | `ease.standard` | transform on the inner layer, opacity | none | note N6, N7 |
| `skeleton-swap` | 1400 x 3, ends at 4.2s | linear | transform on `::before` | no band | pass |
| `list-stagger` | 120 (fade) / 340 (180 plus delays 0, 80, 160) / 150 (fade) | `ease.reveal` (Desk) | transform, opacity | none | pass |
| `stat-roll` | 120 (fade) / 300 / 180 | `ease.emphasized`; Neutral `ease.out` | transform, opacity | none | note N3 |

What held for all 24:

- **Tokens.** Every measured duration, ease, scale and travel matched the
  style's tokens. These were instant 70, fast 80, base 120 or 150, medium
  140 or 180, roll 300, slow 180. The scales were press 0.97, glow 0.98, and
  stretch and lift 1.1536, which is `2 - scale.window-enter` squared. A grep
  of the component CSS and the interaction TSX found no raw ms and no raw
  `cubic-bezier`. The raw values that remain are listed in N10.
- **Flash and loops.** Only the skeleton loops: three sweeps of 1400ms, a
  luminance peak about every 1.4s (0.7 a second, band contrast 1.22 to
  1.35:1), all done by 4.2s. Everything else runs once. The longest run is
  the Neutral OTP paste at 380ms. The shake and the nudge move without a
  luminance change. WCAG 2.3.1 and 2.2.2 hold.
- **No wait on end events.** `transitionend`, `animationend`,
  `onTransitionEnd` and `onAnimationEnd` appear only in comments in
  `packages/react`, `packages/css`, `packages/motion` and `packages/angular`.
  CopyButton removes its leaving glyph on `settled()`, after the state is
  set (`packages/react/src/components/CopyButton/CopyButton.tsx:112`, `:128`).
  Slider and Stat use a `busyUntil` window that skips a decoration, never a
  state change. Radix Presence does wait for the exit animation before it
  unmounts. That is N4.
- **Never delays, never blocks.** `aria-pressed`, `aria-checked`,
  `aria-invalid`, `data-state`, `aria-expanded`, the value, the password
  input type, focus inside a menu or dialog, and the toast in its live region
  all changed in the microtask of the trigger or on the first animation frame.
  Hit tests during every animation landed on the control, and
  `pointer-events` stayed `auto`. Escape 30 to 50ms into an opening menu,
  dialog or sheet closed it. Rapid and interrupted runs all ended in the right
  state with transform and opacity at rest, no animation left holding a fill,
  and no leftover nodes. Three tab clicks 30ms apart ended on one indicator
  aligned to the right tab. Ten stat clicks ended on the right number.
- **Reduced motion, media query.** Under `prefers-reduced-motion` nothing
  plays over 0ms in any of the 24, and the state still appears at once.
- **A style can turn it off.** With the `off` properties injected, each CSS
  interaction stops: the press stays at 1, the check and glow have no
  transition, the menu, popover and toast enter from 1, the sheet becomes a
  fade, the accordion reveal and the skeleton band stop, and the slider lift
  stays at 1. The WAAPI interactions go through `useMotion()`. It reads the
  active style's `motionPreset` at run time
  (`packages/react/src/internal/motion.ts:256-257`). Studio's `reduced` rows
  were proven in the browser: pop, number roll and field step become a fade,
  and the field error does not shake. Two exceptions are N6, and N9 explains
  why none of this reaches apps yet.
- **Focus ring at once**, for buttons, fields (the round's fix holds),
  tabs, menu items, menu and popover triggers, and dialog triggers. The
  exceptions are B1 and N5.
- **RTL.** The toast moves to the left edge and swipes left. The drawer
  slides from the left, the tab indicator travel mirrors (+145px against
  -139px), the skeleton band reverses, and the shake and nudge flip. The
  menu origin is the exception (N2).

### Contract suite and axe

`npm run contract -- --framework react` on all 28 touched components: every
component passes. Three tests failed once under load and passed on rerun:

- `DropdownMenu: keyboard map` and `Menubar: keyboard map`: `page.goto` timeouts.
- `Popover: state attributes`: trigger 7 opened no popover.

| Component | Pass | Fail | Skip |
| --- | --- | --- | --- |
| Button, IconButton, ToggleButton, CopyButton, Checkbox, Switch, Rating, Input, PasswordField, OTPField, NumberField, Tooltip, Tabs, List, Slider, RangeSlider | 29 each | 0 | 0 |
| DropdownMenu, ContextMenu, Menubar, Popover, Toast, Dialog, AlertDialog, Sheet, Drawer | 44 each (after rerun) | 0 | 0 |
| Accordion | 29 | 0 | 15 (no `data-demo-trigger`, see N12) |
| Skeleton, Stat | 28 each | 0 | 1 (no keys) |

The List 4.17:1 mid fade reading from the round report did not come back.
Logs: `contract.react.batch1.log`, `contract.react.batch2.log`,
`contract.react.batch3.log` and `contract.react.rerun.log`.

Axe on `/interactions` (wcag2a, wcag2aa, wcag21aa, wcag22aa, after the
finite animations end), in Studio dark, Desk dark, Neutral light and Neutral
light Arabic RTL: one critical `button-name` in each (B3). Axe with the
dialog frozen at 25% and 50% of its enter found nothing new. With the menu
frozen mid scale, Neutral light also reports `target-size` on three nodes
(N13). Files: `axe.interactions-page.json`, `axe.interactions-page.mid.json`.

### Angular gallery

Angular shares `packages/css`. Sixteen components are ported and were
checked: Button, IconButton, ToggleButton, CopyButton, Checkbox, Switch,
Input, PasswordField, OTPField, Toast, Dialog, DropdownMenu, Rating,
Skeleton, Slider and RangeSlider. Each was compared to the React route at
1024px in Studio dark and Neutral light, LTR and Arabic RTL, with
pixelmatch at threshold 0.1. The Angular contract suite passes all 16.

| Result | Components |
| --- | --- |
| 0 differing pixels in all four setups | Button, IconButton, ToggleButton, CopyButton, Checkbox, PasswordField, Toast, Dialog, DropdownMenu, Rating, Skeleton, Slider |
| Differs by demo content only, not motion | Switch, 114 to 128 px (Arabic state text "غير مفعل" against "متوقف"); Input, 55 to 105 px (a space before the required asterisk); OTPField, 114 to 190 px (heading "OTPField" against "OtpField"); RangeSlider, 1091 to 1234 px (default 2019 to 2022 against 2019 to 2020) |
| CSS interaction plays with no Angular code, same timing as React | press (Button, IconButton, ToggleButton, CopyButton), switch-stretch, focus-glow (Input, PasswordField, OTPField), toast-enter, dialog-spring, menu-origin (with the same RTL origin as N2), slider-pull |
| CSS interaction inert, nothing broken | check-draw. The Angular indicator holds the svg directly. The rules at `packages/css/src/components/Checkbox.css:160-187` target `[data-part='indicator'] > span`, so they match nothing. The checked mark sits at opacity 1 with no transform, and its screenshot is byte equal to React's. It appears and leaves at once. |
| Not ported, not checked | AlertDialog, Sheet, Drawer, ContextMenu, Menubar, Popover, Tooltip, NumberField, Tabs, Accordion, List, Stat |

Files: `angular.pixel-diff.json`, `angular.diff.*.png`, `angular.checkbox.json`,
`angular.checkbox-checked.compare.png`, `angular.interactions-play.json` and
`contract.angular.log`. Note N15 lists the demo differences.

### Feel

Measured, and said plainly:

- **Right.** These are short and they answer the action: `tab-slide` (140
  to 180ms, the best of the set), `button-press` (70ms), `focus-glow`,
  `tooltip-rise`, `toast-enter`, `toast-swipe`, `copy-swap`, `field-step`,
  `error-shake` in Desk (300ms reads as an error, not a decoration).
- **Too busy.** `rating-fill` blanks the stars that were already filled and
  pops them again (N1). A pick from 4 to 5 replays four stars to say one
  thing. That is 300ms in Desk and 340ms in Neutral, to confirm a single
  click.
- **Too slow for what it says.** The Neutral OTP paste takes 380ms and the
  Neutral rating run 340ms. Both are against Neutral's own 150 to 200ms
  character (N8). The Desk dialog enter (300ms) is the slowest panel and is
  the reason focus return waits 220ms on close (N4). It fits Desk's window
  character, but it is at the limit.
- **Close to pointless.** Studio's `list-stagger` and `stat-roll` are a
  120ms fade that is hard to see. Neutral's `list-stagger` (150ms fade) is
  the same. They cost a WAAPI call per row for no reading gain. The
  `password-reveal` text fade adds nothing the glyph swap does not already
  say.
- **Busy outside the round.** In Desk every button click also rolls the
  label for 300ms (`packages/styles/desk/recipes/Button.css:41-48`).

## Part 2: late fix round

The 13 unit test files of the reviewed components pass, 216 of 216.
`npm run contract -- --framework react` on ToggleGroup, SegmentedControl,
Select, TagField, ListBox, Combobox, Autocomplete, Form, Fieldset,
FilterBar, ConsentField, CommandPalette, Lightbox and Sidebar passes. The
exception is one ToggleGroup `keyboard map` timeout in the 31 minute
combined run, which passed 29 of 29 alone (`late.contract.log`,
`late.contract.toggle-group-rerun.log`). The open runs of Autocomplete,
FilterBar, TagField and Sidebar are skipped (15 each).

| # | Component | Blocker | Status | Evidence | File and line |
| --- | --- | --- | --- | --- | --- |
| 1 | ToggleGroup | Attached labels cut by an ellipsis at 320px (1.4.10) | fixed | scrollWidth 320, no clipped label in Studio dark, Neutral light Arabic RTL and Desk light: `late.toggle-group.reflow-320-*.png`, `late.toggle-group-segmented-control.reflow.json` | `packages/css/src/components/ToggleGroup.css:62-76` |
| 2 | ToggleGroup | Arabic chip was an MSA verb phrase | fixed | Now "موعدها هالأسبوع"; demo test | `packages/react/src/components/ToggleGroup/ToggleGroup.demo.tsx:24` |
| 3 | SegmentedControl | Five option "many" case loses units at 320px (1.4.10) | **fixed with a regression** | Nothing is clipped, but in Neutral, LTR and RTL, labels break inside words ("ye / ar", "hour / s", "day / s") and items grow to 55 to 65px. Studio and Desk wrap cleanly at 38px. `late.segmented-control.many-320-neutral-light-ltr.png`, `late.segmented-control.many-320-neutral-light-rtl.png`, `late.toggle-group-segmented-control.midword.log` | `packages/css/src/components/SegmentedControl.css:155` |
| 4 | Select | Empty list opens a listbox with no options | fixed | Click, Enter, Space and the arrows do not open it; the trigger is described by the empty text; axe clean in Studio dark, Desk light RTL and Neutral dark: `late.behaviour.json` | `packages/react/src/components/Select/Select.tsx:154`, `:173`, `:301` |
| 5 | TagField | Text past `max` ended with a comma is lost | fixed | 10 tags, max 12, "Alpha, Beta, Gamma," leaves "Gamma" in the box: `late.tag-field.max-comma.png` | `packages/react/src/components/TagField/TagField.tsx:375-383` |
| 6 | TagField | Max and duplicate messages only in a hidden status (3.3.1) | fixed | A visible message that describes the input: `late.tag-field.duplicate.png` | `TagField.tsx:232-245` |
| 7 | ListBox, through TagField, Combobox, Autocomplete | Highlighted option marked by fill alone, about 1.3:1 (2.4.7, 1.4.11) | **not fixed** for Combobox and Autocomplete; fixed in TagField | TagField ring 3.73 to 15.18:1. Combobox and Autocomplete: no ring (box-shadow 0), fill against the resting row 1.22 to 1.37:1 in five of six style and scheme pairs; only Desk dark passes, by its fill. `late.listbox.highlight-ring.json`, `late.combobox.highlight-*.png`, `late.autocomplete.highlight-*.png` | `packages/css/src/components/ListBox.css:161-163` (ring on `:focus-visible` only, not on `[data-highlighted]`) |
| 8 | Form | Browser `validationMessage` shows: English in Arabic, no fix advice | fixed (React) | Arabic email error reads "اكتب بريد إلكتروني صحيح، مثل name@example.com." in the field and the summary: `late.form.arabic-submit.png` | `packages/react/src/components/Form/Form.tsx:310-325` |
| 9 | Form | A required box reads "Fill in this field." | fixed (React) | `requiredChoice` and `requiredOption` in en and ar; tests | `Form.tsx:298-306` |
| 10 | Form and Fieldset | Group error filed under the first box | fixed | Summary names the group; Fieldset shows the error in its error part | `Form.tsx:355-361`, `packages/react/src/components/Fieldset/Fieldset.tsx:69`, `:104` |
| 11 | FilterBar | Inline `labels` cancel the count announcement (4.1.3) | fixed | Results function in a ref; the test fails on the old file | `packages/react/src/components/FilterBar/FilterBar.tsx:198-210` |
| 12 | ConsentField | Summary and field show different messages | fixed (React) | Test "in a Form: requiredError is the message in the field and in the summary" | `packages/react/src/components/ConsentField/ConsentField.tsx:157` |
| 13 | ConsentField | Long purpose bundled two uses | fixed | One use per purpose, en and ar; demo test | `ConsentField.demo.tsx:103`, `:112` |
| 14 | CommandPalette | Character key shortcut fires inside text fields (2.1.4) | fixed | "/?" typed in a textarea opens nothing; Ctrl+K from an input opens it and Escape returns focus: `late.behaviour.json` | `packages/react/src/components/CommandPalette/CommandPalette.tsx:299`, `matchShortcut.ts:82-96` |
| 15 | Lightbox | Double click never zooms | fixed | A double click zooms in and a second zooms out, at 1280 and 320px: `late.lightbox.json` | `packages/react/src/components/Lightbox/Lightbox.tsx:178-180`, `:361`, `:423` |
| 16 | Lightbox | Previous and next have no fill over the image (1.4.11) | fixed | Solid fill, icon 14.33 to 15.56:1 in all 12 style, scheme and direction runs at 320px: `late.lightbox.nav-320-neutral-dark.png` | `packages/css/src/components/Lightbox.css:52-56`, `:95` |
| 17 | Lightbox | Arabic row not in an Arabic theme (3.1.2) | fixed | Trigger inside `lang="ar" dir="rtl"`; Arabic names on the viewer and its buttons: `late.lightbox.arabic-viewer.png` | `Lightbox.demo.tsx:77-79` |
| 18 | Sidebar | axe `target-size` on `#folder-8` (fix report item) | not reproduced | Sidebar contract 0 failures, axe in Neutral Arabic RTL included | no change |

### ConsentField and Saudi PDPL

Checked against the Personal Data Protection Law and its Implementing
Regulations: consent must be explicit, specific to one purpose, informed, and
as easy to withdraw as to give.

| Point | Result | Evidence |
| --- | --- | --- |
| Explicit: an affirmative act, never implied by submit | pass | A real Radix checkbox or switch named by a native label (`ConsentField.tsx:240-253`). The form value starts empty; only a click, a click on the purpose, or Space sets it (`late.consent-field.json`). |
| Unbundled: one purpose per control | pass, with notes | One `purpose` per control. The manifest names "I agree to the terms, the privacy policy and offers" as the wrong way (`packages/manifest/src/component/ConsentField.manifest.json:238-239`). Notes N18 and N19. |
| Never pre-ticked | pass for defaults; **blocker** for misuse in Angular (B6) | The uncontrolled state starts false (`ConsentField.tsx:153`), and `defaultChecked` is dropped with a development warning (`:146`, `:167`). The only consent shown as given is the settings row with a record line (`ConsentField.demo.tsx:27`, `:38`). React accepts `checked={true}` and warns only when `meta` is missing, once on mount (`:170`), so any `meta` string silences it (N16). Angular `writeValue(true)` from `new FormControl(true)` pre-ticks silently, with no warning at all (`packages/angular/src/components/consent-field/consent-field.ts:201-203`). |
| Informed: purpose, data, recipient, retention, before the tick | partial | A details link with en and ar defaults sits beside the box (`ConsentField.tsx:114`, `:259-263`). A missing `detailsHref` warns in development unless the Fieldset description links the notice (`:181-188`). The warning is skipped when disabled, and Angular has none. The "many" demo purposes name no recipient (`ConsentField.demo.tsx:12-14`). The long cases do state data, recipient and retention in both languages (`:103-114`). |
| Withdrawal as easy as giving | pass for behavior; partial for copy and record | The same control and one action withdraw. The form value goes from `marketing=granted` to absent, and `onCheckedChange(false)` and `onDecision({ granted: false })` fire (`ConsentField.tsx:190-194`). Gaps are N17. |
| Arabic copy | pass | No diacritics in the React, manifest or Angular files. White Saudi dialect ("تقدر تلغي الموافقة متى ما تبي من الإعدادات"). The noun form link reads "طريقة استخدام بياناتك". The cookbook named in AGENTS.md (`/home/user/gobanana/docs/arabic-copy-cookbook.md`) does not exist, so the copy was judged against the rule in AGENTS.md. |

## Findings

### Blockers

**B1. blocker: the keyboard focus ring fades in on Checkbox, Switch, Rating and Slider (WCAG 2.4.7).**

- Where: `packages/css/src/components/Checkbox.css:133`,
  `packages/css/src/components/Switch.css:128`,
  `packages/css/src/components/Rating.css:116` and
  `packages/css/src/components/Slider.css:156`. Each ring layer (`::before`)
  carries `transition: opacity var(--ds-duration-base) var(--ds-ease-default)`.
- After Tab the ring opacity was:

  | Time after focus | Ring opacity |
  | --- | --- |
  | 3 to 7ms | 0 |
  | 21ms | 0.16 |
  | 38ms | 0.47 |
  | 71ms | 0.85 |
  | 120ms (Studio, Desk) or 150ms (Neutral) | 1 |

  Every style and both directions measured the same.
- The round fixed exactly this on the fields and called it a 2.4.7 problem
  (`docs/reports/interactions.md`, `focus-glow` row). It left these four.
  The fade predates the round, but `check-draw`, `switch-stretch`,
  `rating-fill`, `slider-pull` and `slider-nudge` all sit on these
  controls, and order 1.21 asks for the ring at once.
- Fix: drop the opacity transition on the ring layer, or move the ring to
  the control's own box shadow as `focus-glow` did.
- Evidence: `check-draw.neutral.ltr.ring-fade.png`,
  `switch-stretch.neutral.ltr.ring-fade.png`. For contrast, the fixed Input
  shows its ring at once in `focus-glow.neutral.ltr.ring-at-once.png`. Ring
  frames for every control are in `*.all.measure.json`.

**B2. blocker: under `data-motion="reduce"` the press, stretch and lift scales still apply (WCAG 2.3.3).**

- Where: `apps/gallery-react/src/interactions.css:9-31` zeroes only the
  duration and delay tokens. The size rules of the reduced form sit only
  under `@media (prefers-reduced-motion: reduce)`:
  `packages/css/src/components/Button.css:558-563`
  (`--_button-press-scale: 1`), `packages/css/src/components/Switch.css:254-257`
  (`--_switch-stretch: 1`) and
  `packages/css/src/components/Slider.css:264-267` (`--_slider-lift: 1`).
- Measured while held, Neutral:

  | Control | Normal | Media reduce | Attribute reduce |
  | --- | --- | --- | --- |
  | Button, ToggleButton | scale 0.97 | 1 | 0.97 |
  | Switch thumb | scaleX 1.1536 | 1 | 1.1536 |
  | Slider thumb | 1.1536 | 1 | 1.1536 |

- The registry's reduced forms say "No scale", "The thumb jumps" and "No
  lift". The report offers `data-motion="reduce"` as the page's reduced
  motion setting. Under it the size changes still happen, without the
  motion. Desk's roll label also still jumps 28px on hover and focus
  (`packages/styles/desk/recipes/Button.css:41-48`).
- Lead change 3 in the round report emits only the zeroed token block under
  `:root[data-motion='reduce']`, so it would not fix this. Every component
  reduced block also needs `:root[data-motion='reduce']` in its selector.
- Evidence: `static.data-motion-reduce.json`, `button-press.all.measure.json`,
  `switch-stretch.all.measure.json`, `slider-pull.all.measure.json`.

**B3. blocker: an unnamed ToggleButton on `/interactions` (axe `button-name`, critical, WCAG 4.1.2).**

- Where: `apps/gallery-react/src/Interactions.tsx:240` renders
  `<ToggleButton label="Bold" />` with no `icon` and no children.
  `packages/react/src/components/ToggleButton/ToggleButton.tsx:63` sets
  `aria-label` only in the icon only form, so the button has no name.
- Axe failed it in all four setups.
- The page is the acceptance surface of order 1.21. Related note: when
  ToggleButton gets `label` without `icon`, it drops the label silently, with
  no development warning.
- Evidence: `axe.interactions-page.json`.

**B4. blocker: SegmentedControl labels break inside words in Neutral at 320px (late blocker 3, regression).**

- Where: `packages/css/src/components/SegmentedControl.css:155`,
  `overflow-wrap: anywhere`. It lowers each label's min content size, so
  with Neutral's wider item padding the "many" case splits "year", "hours"
  and "days" across lines in LTR and RTL.
- `overflow-wrap: break-word` keeps whole words and still wraps.
  ToggleGroup uses the same rule (`ToggleGroup.css:74`) and showed no split
  word, but it should change with it.
- Evidence: `late.segmented-control.many-320-neutral-light-ltr.png`,
  `late.segmented-control.many-320-neutral-light-rtl.png`.

**B5. blocker: the highlighted option in Combobox and Autocomplete is still marked by fill alone (late blocker 7, not fixed; WCAG 2.4.7, 1.4.11).**

- Where: `packages/css/src/components/ListBox.css:161-163`. The ring is set
  on `:focus-visible` only, and a virtual focus row is `[data-highlighted]`.
- The fix report put this change on the lead's list and it was never made.
- Measured, fill against the resting row: 1.22 to 1.37:1 in five of six
  style and scheme pairs.
- Evidence: `late.listbox.highlight-ring.json`, `late.combobox.highlight-*.png`,
  `late.autocomplete.highlight-*.png`.

**B6. blocker: the Form and ConsentField fixes never reached Angular, which both manifests mark ready (late blockers 8, 9 and 12).**

- `packages/angular/src/components/form/form.ts:174` gives every empty
  required control "Fill in this field.", with no `requiredChoice` or
  `requiredOption`.
- `form.ts:176` falls back to the browser's `validationMessage`, which is
  English in an Arabic page.
- `packages/angular/src/components/consent-field/consent-field.ts:156`
  shows `requiredError` at the field only, never in the summary.
- None of the four React development warnings exist in Angular. For PDPL
  that means a `FormControl(true)` pre-ticks consent with no warning
  (`consent-field.ts:201-203`).

### Notes, interactions

- **N1. note.** `packages/react/src/components/Rating/Rating.tsx:140`. The
  pop loop runs from star 1 to the new score, after it cancels the last run.
  - Stars that were already filled drop to opacity 0 on frame 0 and pop
    again, going up or down.
  - The round report accepts this as "once per pick". It is the busiest
    thing on the page for the least information.
  - Fix: pop only the stars whose state changed.
  - Evidence: `rating-fill.neutral.ltr.refill-blink.png` and
    `rating-fill.studio.ltr.refill-blink.png`.
- **N2. note.** `packages/css/src/components/DropdownMenu.css:131` and
  `:143`, with ContextMenu and Menubar at `:150` and `:161`. In RTL, Radix
  gives `--radix-dropdown-menu-content-transform-origin` as `0% 0px` while
  the menu is aligned to the trigger's right edge.
  - The menu grows from the corner away from its trigger. In Neutral RTL its
    left edge stays at 840 while its right edge grows from 1034 to 1040; the
    trigger's right edge is 1039.6.
  - Angular shows the same, since it shares the CSS. Popover is correct (a
    centre origin).
  - Evidence: `menu-origin.neutral.rtl.origin.png`,
    `menu-origin.neutral.ltr.origin.png`, `angular.menu-origin.json`.
- **N3. note.** `packages/react/src/components/Stat/Stat.tsx:207`, `:211`.
  The skip window is one roll, so a fast counter rolls about 5.3 times a
  second in Studio and 4.4 in Neutral (10 clicks: 6 rolls in 952ms, 5 in
  911ms). Only Desk holds 3.3.
  - The comment at `Stat.tsx:191-192` and `docs/reports/interactions.md`
    ("a live counter never flashes") hold only for Desk.
  - It is a small text area with no luminance flash, so it is under the
    2.3.1 threshold. But the claim is wrong, and a large display Stat would
    need a fixed 333ms window.
  - Evidence: key `statRapid` in `interactions-qa-b.behave.studio.ltr.normal.json`.
- **N4. note.** Focus returns only after the exit animation, for the dialog,
  sheet, drawer, menu and popover.
  - The order was always: Escape, exit starts, exit ends, node removed,
    focus on the trigger.
  - Designed delay: 100ms for menus and the popover; 120, 220 or 150ms for
    the dialog and sheet.
  - The cause is Radix Presence, not our code. It is lead item 6 of the round
    report; this measures it.
  - Evidence: `interactions-qa-b.focusret.ltr.normal.json`,
    `interactions-qa-b.escopen.ltr.normal.json`.
- **N5. note.** In the dialog and sheet, the first focused control draws its
  ring at frame 0, but the panel is at opacity 0 then.
  - The ring becomes visible with the fade: 120 to 180ms, and 300ms in the
    Desk dialog.
  - Evidence: key `dialog.kbOpenFrame0` in `interactions-qa-b.behave.*.json`.
- **N6. note.** Two `off` rows leave motion behind.
  - Switch: `packages/motion/src/interactions/selection.ts:26-32` and
    `:241-245` keep a 120 or 150ms slide on `ease.default`, while the reduced
    form says "The thumb jumps".
  - Accordion: `packages/motion/src/interactions/content.ts:139` sets only
    `--_accordion-duration`, so the chevron at
    `packages/css/src/components/Accordion.css:117` still rotates for 120 to
    150ms.
  - Evidence: `static.off-runtime.json`, `accordion-reveal.all.runs.json`.
- **N7. note.** Style presets do not reach the CSS interactions.
  - Neutral's preset (`packages/styles/neutral/motion.ts:20`, `:21`, `:23`,
    `:25`) asks for `ease.out` on enter and `duration.base` on the menu exit.
    Measured in Neutral:

    | Part | Measured | Preset asks for |
    | --- | --- | --- |
    | Menu, dialog, sheet enter | `ease.emphasized` | `ease.out` |
    | Switch slide, slider lift | `ease.emphasized` (`Switch.css:63`, `Slider.css:59`) | `ease.out` |
    | Accordion | `ease.standard` | `ease.out` |
    | Menu exit | 100ms | 150ms |
    | Toast spring back | `ease.emphasized` | `ease.out` |

  - Studio's preset (`packages/styles/studio/motion.ts:18`) sets the sheet to
    `duration.base`, but Sheet and Drawer play 180ms (`Dialog.css:433`,
    `:556`).
  - So `docs/reports/interactions.md:138-142` ("every moving pattern
    resolves to 150 to 200ms on ease.out", "The dialog keeps ease.out on
    enter") is true only for the WAAPI interactions.
  - The generator writes `off` rows only (N9), so a CSS timing must come
    from style tokens or recipes.
  - Evidence: `menu-origin.all.runs.json`, `dialog-spring.all.runs.json`,
    `sheet-spring.all.runs.json`, `accordion-reveal.all.runs.json`.
- **N8. note.** `packages/motion/src/patterns/pop.ts:17`
  (`POP_MAX_STEPS = 6`, half a `delay.reveal-step` per step). In Neutral the
  OTP paste run ends at 380ms and the rating run at 340ms, against Neutral's
  150 to 200ms character. Each step is in range; the run is not.
  - `preset.test.ts` exempts nothing for this, because it checks patterns
    and not runs.
- **N9. note.** `interactionRecipes()` does not reach apps.
  - It is defined at `packages/motion/src/interactions.ts:51`; its only
    caller is `apps/gallery-react/src/Interactions.tsx:88`.
    `scripts/gen-index.ts` never calls it, and no `packages/styles/<id>/motion.css`
    exists.
  - The output is empty today for all three styles (`static.modes.json`),
    so nothing is lost yet. It is lead item 2 of the round report.
  - Also, `packages/react/src/internal/motion.ts:222-231` imports the three
    presets statically, so a new style needs a change in the React package.
  - Also, `motion.ts:272`: an interaction row of `full` still plays reduced
    when its pattern row is `reduced`.
  - Studio keeps `slider-nudge` in full, since only the field error shake is
    turned off. That matches the report's wording.
- **N10. note.** Raw values left in the motion code:
  - `0s` in `packages/css/src/components/Checkbox.css:166`, `:181` and
    `:186`;
  - `calc(2 - scale.window-enter squared)` in `Switch.css:66` and
    `Slider.css:56`, while the `scale.stretch` and `scale.lift` token
    requests are open;
  - `* 0.4` and a decay factor in `packages/motion/src/patterns/shake.ts:36`
    and `:41`;
  - the tooltip open delays of 500 and 300ms in
    `packages/react/src/components/Tooltip/Tooltip.tsx:65` and `:67`
    (behavior delays with no token).
- **N11. note.** The "Reduced form" column of `docs/reports/interactions.md`
  section 4 says "Fade" for the menu, tooltip, toast, dialog, sheet, list
  and stat. Under the person's reduced motion nothing animates at all, since
  every duration token is 0ms. "Fade" happens only when a style preset plays
  a pattern reduced, as Studio does for the list and the stat. The column
  should say "None (state at once)".
- **N12. note.** `packages/react/src/components/Accordion/Accordion.demo.tsx`
  has no `data-demo-trigger`, so the contract suite never runs axe or target
  size with a section open. The accordion-reveal open state is untested by
  the suite.
- **N13. note.** Axe with the menu frozen at 25% and 50% of its scale reports
  `target-size` (serious) in Neutral light on the menu trigger, the popover
  trigger and a gallery shell link 21px tall. At rest it is clean.
  - The shell link is the gallery's own and is short at rest as well. Axe
    only reaches it in this run.
  - Evidence: `axe.interactions-page.mid.json`.
- **N14. note.** `packages/css/src/components/Button.css:508`. With
  `--_button-press-scale: 1` (off or reduced), a 70ms transition from
  `none` to `scale(1)` still registers. Nothing moves; it is noise in
  `getAnimations()`.
- **N15. note.** Demo differences between the React and Angular galleries,
  not motion:
  - Switch Arabic state text "غير مفعل" against "متوقف";
  - a space before the required asterisk in Angular Input labels;
  - the OTPField heading reads "OtpField" in Angular;
  - the RangeSlider default is 2019 to 2022 against 2019 to 2020.

  Angular also plays no `check-draw` (the svg has no span wrapper), which the
  port plan in section 8 of the round report already covers.

### Notes, late round and ConsentField

- **N16. note.** `packages/react/src/components/ConsentField/ConsentField.tsx:170`.
  A consumer can pass `checked={true}` with any `meta` string and get no
  warning. Warn when `checked` is true on mount and `meta` lacks a record
  date, or document that a pre-given consent must come from a stored
  decision.
- **N17. note.** Withdrawal gaps.
  - A controlled `checked` with a no-op `onCheckedChange` blocks withdrawal
    with no warning.
  - `disabled` with `checked` true only warns (`ConsentField.tsx:175-180`),
    and Angular does not warn at all.
  - Withdrawing sends no field in the form, so a server cannot tell
    "withdrawn" from "never asked" unless the app stores the `onDecision`
    record. A `withdrawn` value would make the record survive a plain form
    post.
  - The default link text "How we use your data" does not tell the person
    they can withdraw. Only four demo cases say it (`ConsentField.demo.tsx:68`,
    `:87`, `:106`, `:114`).
- **N18. note.** `ConsentField.demo.tsx:103`. The long case asks consent to
  share delivery data "so they can deliver my orders". That is the main
  service, where consent is probably the wrong legal basis under PDPL; the
  example should be a purpose the service does not need.
- **N19. note.** The same purpose ends with the stress word
  "Supercalifragilisticexpialidocious" (`sample.en.word`), so the consent
  sentence reads as nonsense in the demo.
- **N20. note.** `packages/css/src/components/TagField.css:288`. TagField
  sets ListBox's private `--_list-box-option-ring`. It does not leak
  (Combobox and Autocomplete measure box-shadow 0). In Desk dark the ring is
  1.13:1 against the resting row, but the fill is 13.39:1. Remove it once B5
  is fixed in ListBox.
- **N21. note.** `packages/css/src/components/ToggleGroup.css:64-66`. In
  Neutral Arabic RTL an attached xs item is 28.6px tall, against 28px for
  the spaced items in the same row: the new `padding-block` plus the label
  line height.
- **N22. note.** `packages/react/src/components/Form/Form.tsx:359`. The
  group summary link focuses the first checkbox, which has no `aria-invalid`
  and no `aria-describedby`.
- **N23. note.** `packages/react/src/components/CommandPalette/matchShortcut.ts:82`.
  `isEditableTarget` reads `event.target`. For an input in a shadow root the
  document listener sees the host, so a character shortcut still fires.
  Read `event.composedPath()[0]`.
- **N24. note.** NumberField in the Arabic RTL run names its decrement
  button "خفض Quantity": half Arabic, half English. The label is not passed
  into the Arabic copy.
- **N25. note.** The open runs of Autocomplete skip (15) too; the fix report
  lists only FilterBar, TagField and Sidebar.

## Not run

- **Angular for the 12 components not yet ported**, and the code driven
  interactions in Angular (the Enter press, copy swap and toast stack),
  which section 8 of the round report says are not built.
- **ContextMenu and Menubar motion in the browser.** They share
  `DropdownMenu.css`, and their contract runs pass.
- **Light scheme for the overlay set**, except the Neutral skeleton. The
  field and slider set ran in light.
- **Reduced and `off` runs in RTL for the overlay set**, except the Drawer
  and the menu in Neutral RTL.
- **A preset row set to `none` for a code driven interaction.** No style
  sets one, and it needs a source change. The Studio `reduced` rows were
  proven instead.
- **Exact wall clock action delays**, because of the machine load. The order
  of events was recorded instead.
