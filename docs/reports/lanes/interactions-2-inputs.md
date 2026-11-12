# Interaction round 2, family (b): text inputs and forms

Order 1.22. Agent: ds-component, family (b) "inputs". Every interaction here
is **proposed** and waits for the owner. Timings are the base values per
style: Neutral, Desk, Studio.

## 1. Interactions

Registry: `packages/motion/src/interactions/fields.ts` (every row `round: 2`,
with beats, styles and the reduced form). Stages:
`apps/gallery-react/src/interactions/inputs.tsx`. Shared helpers:
`packages/react/src/components/Input/fieldMotion.ts` (token timed beats, a
dip pop, a land pop, a slide in, a short run spread, and a decorative
leaving copy) and `packages/react/src/components/NumberField/useDigitLayer.ts`.

| Id | Components | Trigger | Beats and timing (Neutral, Desk, Studio) | Reduced form | Files |
| --- | --- | --- | --- | --- | --- |
| `focus-glow` (reworked) | Input, PasswordField, OTPField, NumberField, SearchField, Textarea, PhoneField, ScrubInput | focus, blur | Ring at once on the root box shadow. Glow on `::before` grows from `scale.enter` (0.97, 0.9, 1) on the soft spring (220, 340, 100ms); leaves on `duration.quick` (100ms) `ease.exit` | glow at once, no growth | the eight CSS files, InputGroup.css |
| `error-shake` (reworked) | Input, PasswordField, OTPField, NumberField | turns invalid, native `invalid` | Swing `distance.shift` toward the inline end, back two thirds, then `distance.nudge` and half of it, settle; `duration.spring-bouncy` (220, 440, Studio off by preset) on `ease.out`; RTL first swing mirrored | none | `Input/useErrorShake.ts` |
| `field-label-focus` | Field, Label | focus enters a Field | Label rises `distance.nudge` (2, 3, 1px) on the snappy spring (180, 300 with overshoot, 80ms in steps) | label still | `Field.css` |
| `field-message-enter` | Field | a description renders after first paint | Slides from `distance.shift` above and fades in on the soft spring | fade | `Field/Field.tsx`, `Field/context.ts` |
| `field-error-enter` | FieldError, Field, Fieldset, ConsentField | an error renders after first paint | Slide from `distance.shift` above, soft spring; one `delay.stagger` later the icon lands from `scale.morph` on the bouncy spring; the control shakes on the same commit | fade, icon still | `FieldError.tsx`, `Fieldset.tsx`, `ConsentField.tsx` |
| `password-reveal` (reworked) | PasswordField | toggle press | Icon morph: eye turns 90 degrees and shrinks to `scale.morph` over `duration.morph` (200, 320, 100); eye off turns in and lands on the bouncy spring; text fades back in | cross fade | `PasswordField.tsx`, `PasswordField.css` |
| `search-clear` | SearchField | first character, clear | Clear glyph turns in from minus 90 degrees and lands (bouncy); on clear a decorative copy of the button turns out over `duration.morph` | fades | `SearchField.tsx` |
| `search-submit` | SearchField | Enter | Glyph dips to `scale.anticipate` with a 12 degree turn (first quarter, `ease.out`), springs back past rest | none | `SearchField.tsx` |
| `otp-fill` (reworked) | OTPField | type, paste, SMS | One character lands from `scale.morph` on the bouncy spring. A run lands on the snappy spring spread over two stagger steps in all: Neutral ends near 230ms, Desk 390ms | fade | `OTPField.tsx` |
| `otp-caret` | OTPField | focus, active cell moves | A caret bar on the active empty cell's `::after` arrives from `distance.shift` on the snappy spring; no blink | caret at once | `OTPField.css` |
| `otp-complete` | OTPField | code turns full, not invalid | Cells lift `distance.lift` (2, 4, 0px) and settle in `duration.celebrate` (220, 480, 120), spread over two stagger steps | none | `OTPField.tsx` |
| `field-step` (reworked) | NumberField | step key or button | Digit by digit roll (`rollDigits`) in an aria-hidden layer over the input, snappy spring, columns one `delay.stagger` apart | digits fade | `NumberField.tsx`, `useDigitLayer.ts`, `NumberField.css` |
| `scrub-roll` | ScrubInput | drag, arrow nudge | Same digit layer rolls each change; the handle grows to `scale.pop` on the bouncy spring while held | fade, no growth | `ScrubInput.tsx`, `ScrubInput.css` |
| `inline-edit-morph` | InlineEdit | start, save, cancel | Pencil morphs into the save check, cancel lands one stagger step later; save morphs check into pencil, cancel morphs close into pencil; the pencil shows during the morph back, so the check reads as a short tick | cross fade | `InlineEdit.tsx`, `InlineEdit.css` |
| `form-summary-enter` | Form | submit finds errors | Summary rows `staggerGroup` from the inline start | fade together | `Form.tsx` |
| `form-submit-success` | Form | submit passes | Buttons of the actions part rise to `scale.pop` and spring back in `duration.celebrate`, spread over two stagger steps. Never delays the submit | none | `Form.tsx` |
| `wizard-step` | FormWizard | step change | Old step: a decorative copy slides `distance.enter` toward the start and fades in `duration.quick`. New step: from `distance.enter` at the end, soft spring. Back reverses, RTL flips. A completed mark lands its check | cross fade | `FormWizard.tsx`, `FormWizard.css` |
| `wizard-done` | FormWizard | form sent | Every mark dips and springs back as one short wave | none | `FormWizard.tsx` |
| `consent-check` | ConsentField | consent given | On top of the Checkbox wipe, the mark grows from `scale.morph` on the bouncy spring (composite add) | none | `ConsentField.tsx` |
| `rating-fill` (reworked) | Rating | pick | Only stars whose state changed move: filled ones land from `scale.morph` as one run over two stagger steps (chosen star bouncy), emptied ones dip and spring back | fade, no dip | `Rating.tsx` |
| `rating-preview` | Rating | hover | Stars joining the preview dip from `scale.anticipate` and spring back; the star under the pointer waits two stagger steps, the one before it one step | color only | `Rating.css` |

Success tick on valid: no component in the family holds a "valid" state.
The nearest states used: OTPField `data-complete` (`otp-complete`),
InlineEdit save (the check morphing into the pencil), Form `submitted`
(`form-submit-success`), FormWizard `done` (`wizard-done`).

Decisions:

- The NumberField roll layer is an unnamed `<span aria-hidden="true">`
  child of the root, empty at rest. While it holds digits, the CSS draws
  the input text transparent (`:has()`), keeping the caret color. Typing
  (`beforeinput`) empties it at once. No DOM contract change: no part, no
  data attribute. Without the layer (Angular today) nothing changes.
- Leaving copies (search clear, wizard step) are clones with no part, id,
  name, live role or form value, `inert` and `aria-hidden`, removed when
  their exit ends. The real element is removed or hidden at once.
- The FieldError and FieldDescription entrances never play on a Field's
  first paint (a `settled` ref on the internal Field context).
- Readable text (the lead's rule): every text entrance of the family
  (description, error, FormWizard step) uses `readableEnter` from the
  foundation through `slideIn`, so opacity is full by `READABLE_AT` (30%)
  of its run: Neutral 66ms, Desk 102ms, Studio 30ms. Runs wait at most two
  stagger steps (Desk 90ms, inside `STAGGER_BUDGET_MS`), so the last OTP
  character or star is readable by about 220ms in Desk. The CSS staggers
  of the family (`rating-preview`) move only transform, never opacity.
- `runStep` spreads any run (OTP paste, rating pick, complete wave, summary
  of buttons) over two stagger steps in all, so a run stays one beat (N8).
- FormWizard does not animate the current Stepper mark: the navigation
  family's `indicator-answer` already does (seen in the probe). Only the
  check of a mark that turned complete lands.
- SearchField and Textarea, PhoneField and ScrubInput now split ring and
  glow (`--_<c>-ring` on the root at once, `--_<c>-shadow-focus` on
  `::before`). A SearchField that is a part (the CommandPalette band) draws
  no glow (`[data-ds='search-field'][data-part]`), so CommandPalette.css
  needs no change.

## 2. Rejected ideas

| Idea | Why |
| --- | --- |
| A blinking OTP caret | A loop with no end; the static bar that moves is enough (WCAG 2.2.2) |
| Animating the FormWizard title | It takes focus on a step change; moving it would move its ring |
| An exit for the FieldError | It unmounts with the fix; keeping it would hold a stale message in the DOM |
| A full roll inside the NumberField input (round 1 rejection kept) | Built as the aria-hidden layer instead |

## 3. Needs a rule change

| Richer idea | Property | Built instead |
| --- | --- | --- |
| The error pushes the content below with a slide | `height` or layout | The content moves at once; the error slides out from under the control |
| A check that draws as a stroke in ConsentField | `stroke-dashoffset` | Checkbox's wipe plus a scale pop (composite add) |
| Label color easing to the focus color | `color` | A 2px lift; the color changes at once |

## 4. Work for Angular and native

Angular shares the CSS: focus glow, label lift, OTP caret, rating preview,
scrub handle lift and the FormWizard fade play there today. Code driven
interactions need an Angular player (the `useMotion` twin):

| Angular component | Work |
| --- | --- |
| field, field-error, fieldset | Play `slideIn` on a description or error that renders after first paint, the icon `landPop` one stagger step later |
| input, password-field, number-field, otp-field | Port `shakeBeat` (round 2 swings with a settle) |
| password-field | Keep the leaving glyph in an unnamed aria-hidden span inside the toggle icon; play `iconMorph` |
| search-field | Clear glyph `iconMorph` in; leaving copy out; submit dip |
| number-field, scrub-input | Render the empty aria-hidden layer span as a root child and port `useDigitLayer` |
| otp-field | `landPop` per cell, run spread, `otp-complete` wave |
| inline-edit, form, form-wizard, consent-field, rating | Port the code paths named in section 1 |

Native (wave 2): the same beats map to Reanimated springs from the spring
tokens.

## 5. Token requests

None. Every beat reads the 1.22 tokens.

## 6. Preset rows needed from the lead

None required. Suggested: Studio `otp-complete: 'none'` and
`form-submit-success: 'none'` (both already still in Studio because
`distance.lift` is 0 and `scale.pop` is 1), and Studio `rating-preview`
plays reduced if the steps read busy.

## 7. Changes needed from the lead

1. None blocking. The round 1 InputGroup request (glow off on joined
   children) is now done in `InputGroup.css`, NumberField included.
2. `packages/angular/.../tag-field/tag-field.spec.ts` "Enter adds the typed
   text and drops duplicates" failed once during my Angular run and passed
   on the next: not in my files.

## 8. Review findings assigned to this family

| Finding | Status | Test |
| --- | --- | --- |
| B1 Rating ring fades in | fixed: the ring layer has no transition; only the veil fades | `Field.motion.test.tsx` "B1" |
| B2 reduced blocks under `data-motion` | fixed in every CSS file of the family (each media block has a `:root[data-motion='reduce']` twin) | `Field.motion.test.tsx` "B2" |
| B6 Form and ConsentField in Angular | fixed: required copy by kind, constraint copy from ValidityState (never `validationMessage`), `requiredTrue` says the choice copy, ConsentField `requiredError` registers with the form (field and summary), the four React warnings ported plus a warning when a FormControl writes true first (PDPL) | `packages/angular/src/components/form/form-copy.spec.ts` |
| N1 Rating blanks filled stars | fixed: only stars whose state changed move, no fade on kept stars | `Rating.test.tsx` |
| N8 runs past Neutral's character | fixed: OTP paste and rating runs spread over two stagger steps (Neutral near 230 to 270ms in all) | `Rating.test.tsx` (delays), `OTPField.motion.test.tsx` |
| N16 ConsentField warning | fixed: warns when checked starts true and a text meta has no date (React and Angular) | `Field.motion.test.tsx` "N16" |
| N22 group summary link focus | not fixed: the target needs the group's error on the first checkbox or radio (`aria-describedby`), which lives in Checkbox and RadioGroup | none |
| N24 NumberField Arabic decrement | fixed in the demo: English copy passes `locale="en"`, so the stepper word follows the copy | `NumberField.test.tsx` |

## 9. Proof

- `npx vitest run` on the 18 component folders and `packages/motion`: green
  except demo render tests that timed out at 5s while other agents loaded
  the machine; they pass alone.
- New tests: `packages/react/src/components/Field/Field.motion.test.tsx`
  (15 tests), reworked motion tests for NumberField, OTPField,
  PasswordField and Rating.
- `npm run check -w @the-system/angular`: 62 files, 492 tests green.
- `tsc` and `eslint` on every file of the family: clean.
- Contract suite and `npm run check`: see the summary returned to the lead.
- Recordings: made by the lead in the stage only mode of `/interactions`
  (per interaction clips). Every stage in
  `apps/gallery-react/src/interactions/inputs.tsx` marks the control that
  plays it with `data-interaction-trigger`; where the playing control is a
  part a stage cannot mark (a toggle inside a field, a key, a star), a
  "Play" Button in the stage acts on the real control. My own full page
  recordings were used only to read frames and are not committed.
- A probe in Desk (Playwright, `document.getAnimations()` right after each
  trigger) saw each interaction start on its target: the glow transition,
  `error-shake` on the box with `field-error-enter` and its icon, the
  `field-message-enter`, `icon-morph` out and in on the toggle and InlineEdit,
  `search-clear-out` on the copy, `search-submit`, `otp-fill` and four
  `otp-complete` cells, `digit-roll` columns in the NumberField and
  ScrubInput layers, summary rows (`stagger` on each li),
  `form-submit-success`, `wizard-step` and `wizard-step-check`,
  `wizard-done` on every mark, `consent-check`, `rating-fill` on the three
  changed stars, `ds-rating-preview` on the hovered stars. It also showed
  the navigation family's `indicator-answer` on the Stepper mark, so the
  duplicate wizard mark dip was removed.
- Frames read from my working recordings: the first Desk pass showed the
  NumberField roll layer drawn at the top of the box (the primitive keeps
  an inline-block display, so the layer lost its flex centering). Fixed in
  `useDigitLayer.ts` (the layer sets `display: flex` while it rolls) and
  recorded again. The first recordings also ran while the registry file had
  an unescaped quote (the page did not render); the record script now
  stops when the page has no cards, and the frames were read again after
  the fix.
