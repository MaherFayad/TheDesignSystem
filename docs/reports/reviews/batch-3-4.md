# Review: batch 3 and the batch 4 steps lane

Fresh eyes review by ds-qa of Checkbox, CheckboxGroup, Switch, Slider,
RangeSlider (lane 3A), RadioGroup, RadioCard, Rating (lane 3B), ListBox,
Combobox, Autocomplete (lane 3C), and Stepper and FormWizard (lane 4B), on
branch `claude/ds-review-3-4`, cut from `claude/relaxed-hypatia-7gseap`. No
source file was edited. The builders' lane reports were read after the
findings below were formed; none of the blockers is one a lane left open.

## Verdicts

| Component | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| Checkbox | pass | 0 | 2 |
| CheckboxGroup | pass | 0 | 1 |
| Switch | pass | 0 | 2 |
| Slider | pass | 0 | 4 |
| RangeSlider | fix needed | 1 | 1 |
| RadioGroup | pass | 0 | 1 |
| RadioCard | pass | 0 | 1 |
| Rating | fix needed | 1 | 2 |
| ListBox | pass | 0 | 3 |
| Combobox | fix needed | 1 | 1 |
| Autocomplete | pass | 0 | 1 |
| Stepper | pass | 0 | 1 |
| FormWizard | pass | 0 | 2 |

`npm run check` is green. The contract command is green for all thirteen:

```text
npm run contract -- --framework react --component Checkbox,CheckboxGroup,Switch,Slider,RangeSlider,RadioGroup,RadioCard,Rating,ListBox,Combobox,Autocomplete,Stepper,FormWizard
pass  Autocomplete: 29 passed, 0 failed, 15 skipped
pass  Checkbox: 29 passed, 0 failed, 0 skipped
pass  CheckboxGroup: 29 passed, 0 failed, 0 skipped
pass  Combobox: 29 passed, 0 failed, 15 skipped
pass  FormWizard: 29 passed, 0 failed, 0 skipped
pass  ListBox: 29 passed, 0 failed, 0 skipped
pass  RadioCard: 29 passed, 0 failed, 0 skipped
pass  RadioGroup: 29 passed, 0 failed, 0 skipped
pass  RangeSlider: 29 passed, 0 failed, 0 skipped
pass  Rating: 29 passed, 0 failed, 0 skipped
pass  Slider: 29 passed, 0 failed, 0 skipped
pass  Stepper: 29 passed, 0 failed, 0 skipped
pass  Switch: 29 passed, 0 failed, 0 skipped
```

The 15 skips of Combobox and Autocomplete are the open state runs (axe and
target size with the popup open). They skip because neither manifest sets
`contract.trigger`. That is the Combobox blocker below.

## What holds across the batch

Checked in code and in Chromium against the React gallery, and not repeated
per component below:

- Anatomy: `data-ds` roots, shared axis words only, boolean states present
  and empty, `ref` as a prop, `"use client"` on every file with hooks, nested
  system components keep their own `data-ds` and carry the parent's
  `data-part` (Stepper inside FormWizard, IconButton clear and trigger inside
  Combobox, the popup root of Combobox and Autocomplete).
- Keyboard: Slider and RangeSlider arrows follow the reading direction.
  Measured: ArrowRight takes the Slider from 60 to 61 in LTR and from 60 to
  59 in RTL, and the RangeSlider start thumb from 200 to 250 in LTR and from
  200 to 150 in RTL (step 50). Rating, RadioGroup and RadioCard arrows move
  in the reading direction too (Radix direction from the Theme). Combobox
  Escape closes, then clears; Alt+ArrowDown opens without a highlight.
- Arabic matching in Combobox: "الرّياض" finds "الرياض", "الاحساء" finds
  "الأحساء", "ابها" finds "أبها", and the match is drawn with `mark`.
- Axe (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) on the full demo page of
  all thirteen in Studio, Desk and Neutral, dark and light, LTR English and
  RTL Arabic at 1280px, plus Neutral light RTL and Studio dark LTR at 320px:
  clean, except the RangeSlider target size failure and the ListBox note
  below. Axe on the open Combobox and Autocomplete popup, LTR and RTL:
  clean.
- Target size (WCAG 2.5.8): every interactive element measured. Checkbox,
  Switch, Slider thumb and Rating stars are 24 by 24 at sm and md. Combobox
  clear and trigger are 28 by 28. ListBox options are 28px high, Stepper
  step buttons 31px, FormWizard actions 32 to 36px. RadioGroup is the
  exception in shape, not in result: see its note.
- Non text contrast (WCAG 1.4.11), composited against every ancestor: the
  unchecked Checkbox box, the RadioGroup and RadioCard circle, the Switch
  track border, the Combobox field border and the upcoming Stepper indicator
  all use `color.border.control`, lowest 3.32:1 (Neutral light), 3.41:1
  (Studio light), 3.52:1 (Desk light), 3.66:1 (dark). Checked fills 5.18:1
  and up. The one miss is the unfilled Slider track (Slider note 1).
- Reflow (WCAG 1.4.10): `scrollWidth` equals the viewport at 320px for all
  thirteen pages, LTR and RTL.
- Forced colors: Checkbox glyphs, RadioGroup and RadioCard dots, the Switch
  thumb and track, the Slider thumb and the Stepper connector all stay
  visible (`shots/batch-3-4/checkbox-forced-colors.png`,
  `radio-group-forced-colors.png`, `switch-forced-colors.png`).
- Reduced motion: with `reducedMotion: 'reduce'` no element on the Switch,
  Stepper or Combobox pages keeps a transition or animation with a non zero
  duration.
- English copy: buttons are a verb plus a noun everywhere ("Show options",
  "Clear value", "Save account", "Place order", "Go to next step"). Arabic
  copy in the demos and defaults is noun form and free of diacritics.

## Findings

### Checkbox: pass

- note: `packages/react/src/components/Checkbox/Checkbox.tsx:103`. Inside a
  CheckboxGroup a `checked` prop is silently ignored: the group wins. Warn in
  development, or document it in the prop comment and the manifest
  `mistakes`.
- note: `packages/manifest/src/component/Checkbox.manifest.json:197`.
  `"motion": "none"` while the focus ring fades its opacity
  (`Checkbox.css:113`). The same for Switch and Slider. See "One
  convention", item 1.

### CheckboxGroup: pass

- note: `packages/react/src/components/CheckboxGroup/CheckboxGroup.test.tsx`.
  The select all item is tested for indeterminate once. Add the paths
  checked by hand here: all checked then one unchecked, select all while
  some items are disabled, and select all under `readOnly`.

### Switch: pass

- note: `packages/manifest/src/component/Switch.manifest.json:180`.
  `"motion": "none"`, but the thumb slides with a transform transition
  (`packages/css/src/components/Switch.css:134` to `135`). The manifest
  should say what moves, even if no catalog pattern fits yet.
- note: `packages/react/src/components/Switch/Switch.demo.tsx:51` and `92`.
  The Arabic state words "مفعل" and "متوقف" pair a participle of activation
  with one of stopping. Pick one pair: "مفعل" and "غير مفعل" (the GCC app
  convention), or "تشغيل" and "إيقاف" if the words are meant as nouns.

### Slider: pass

- note (WCAG 1.4.11): `packages/css/src/components/Slider.css:37`. The
  unfilled track, `color.bg.overlay-20`, is 1.51:1 (Studio light) to 1.80:1
  (Neutral dark) against the page. The thumb (5.18:1 and up) and the value
  text carry the value, so this is not a failure, but the track is what
  shows the extent of the range. `color.border.control` would give 3.3:1 and
  up. Evidence: `shots/batch-3-4/slider-track-studio-light.png`.
- note: `packages/css/src/components/Slider.css:47`. The label row is
  `minmax(0, 1fr) auto` and the value never wraps, so at 320px a long label
  wraps one word per line beside "1,500,000 SAR - 250,000 SAR". Let the value
  drop under the label when the row is narrow (`flex-wrap`, or a container
  query). Evidence: `shots/batch-3-4/range-slider-long-label-320.png`.
- note: `packages/css/src/components/Slider.css:184`. The first and last
  mark labels are centered on the track end with `translate: -50%`, so they
  overflow the root by half their width: "2000" is cut at the inline end in
  `range-slider-thumbs-overlap-320.png`. Align the end marks to the edge.
- note: `packages/react/src/components/Slider/Slider.tsx:164`. Radix gets
  `dir={theme.dir}`, so a `dir="rtl"` set on a plain element between the
  Theme and the Slider flips the layout but not the arrow keys. State in the
  manifest that direction comes from the nearest Theme.

### RangeSlider: fix needed

- **blocker** (WCAG 2.5.8, axe `target-size`): at 320px the "Thumbs side by
  side" demo (`packages/react/src/components/RangeSlider/RangeSlider.demo.tsx:75`
  to `81`, values 2019 and 2020 on a 2000 to 2025 track) draws the two
  thumbs over each other. Axe: "Target has insufficient size because it is
  partially obscured (smallest space is 10.1px by 24px)" on
  `span[aria-label="First year"]`, in both 320px runs (Neutral light RTL and Studio dark LTR). Evidence:
  `shots/batch-3-4/range-slider-thumbs-overlap-320.png`. Fix in the
  component, not only the demo: keep the thumb that last had focus or
  pointer on top (`z-index` on `[data-thumb]:focus-visible` and a
  `data-active` thumb), so a press on the visible part reaches the thumb
  drawn there, and document in the manifest that `minStepsBetweenThumbs`
  should keep the centers 24px apart at the narrowest width. Then add the
  320px run to the demo test.
- note: `packages/css/src/components/RangeSlider.css:10`. The value pair is
  isolated, which is right for Arabic ("200 ريال" then "700 ريال" in reading
  order), but an English demo under `dir=rtl` shows "700 SAR - 200 SAR". The
  gallery mixes English copy with RTL, so this only shows there; no change
  asked.

### RadioGroup: pass

- note (WCAG 2.5.8): `packages/css/src/components/RadioGroup.css:31` and
  `205`. The `control` element is 14, 16 and 20px; the 24px press area is the
  `::after` veil. Hit testing proves it: `elementFromPoint` 11px from the
  center in all four directions lands on the control at every size. So the
  criterion holds, but tools that read the element box (axe's spacing pass
  aside, the matrix script and any consumer audit) report 16px, and Checkbox
  solved the same problem the other way (the control is the 24px box, the
  indicator draws inside it). Pick one pattern for both; the Checkbox one is
  the one tools can see.

### RadioCard: pass

- note: `packages/react/src/components/RadioCard/RadioCard.tsx`. RadioCard
  has no `label` or `description` prop, while RadioGroup has both. The demo
  names each group with a heading and `aria-labelledby`. Either add the same
  `label` prop, or say in the manifest `mistakes` that an unnamed radio card
  group is wrong.

### Rating: fix needed

- **blocker** (copy rules, WCAG 3.1.2): `packages/react/src/components/Rating/Rating.tsx:27`
  to `34` and `98` to `99`. The default star names ("3 of 5 stars", "Not
  rated") are English whatever the Theme language. Combobox, Stepper and
  FormWizard pick Arabic defaults in an Arabic Theme; Rating makes every
  Arabic consumer pass `getItemLabel` and `getValueLabel` or ship English
  names inside `lang="ar"`. The demo hides this by passing them
  (`Rating.demo.tsx:10` to `11`). Fix: read `useTheme().lang` and default to
  "3 من 5 نجوم" and "بدون تقييم" (the demo's own words), with the count
  formatted for the language.
- note: `star-half` (icon map in `packages/icons/src/names.ts:68`). The
  half star draws only the outline of one half, with no filled half and no
  empty half, so 4.5 reads as four stars and a fragment. It mirrors
  correctly in RTL. Evidence: `shots/batch-3-4/rating-half-star-ltr.png`,
  `rating-half-star-rtl.png`. The image name is right ("4.5 of 5 stars"), so
  this is visual only; route to the icons owner.
- note: `packages/react/src/components/Rating/Rating.tsx:176`. Radix gets
  `orientation="horizontal"`, so ArrowUp and ArrowDown do nothing, while a
  native radio group (and RadioGroup here) takes all four arrows. Drop the
  orientation, or list only the left and right arrows in `a11y.keys` on
  purpose.

### ListBox: pass

- note (WCAG 2.5.3, axe `label-content-name-mismatch`, tag `wcag21a`):
  `packages/react/src/components/ListBox/ListBox.tsx:369`. An option with a
  description is named by its label only, so axe reports 14 to 28 nodes per
  page ("Text inside the element is not included in the accessible name").
  The name does contain the visible label, so 2.5.3 is met and this is a
  false positive; record it with `contract.skipAxeRules` and the reason, so
  a consumer running axe is not surprised. The contract suite does not see
  it because `wcag21a` is missing from its tags (see "Not a finding").
- note: `packages/react/src/components/ListBox/ListBox.tsx:345`. Space is
  never part of the typeahead, so "New York" cannot be typed past "New". In
  single mode Space could join the buffer while one is running, as in the
  APG listbox.
- note: multiple mode has no Shift+arrow or Shift+click range selection. Not
  in the order; say so in the manifest so MultiSelect does not assume it.

### Combobox: fix needed

- **blocker** (order acceptance "`contract.trigger` set"):
  `packages/manifest/src/component/Combobox.manifest.json:316`. The
  `contract` block has no `trigger`, so 15 open state checks skip: axe and
  target size on the open popup in every style and scheme. Run by hand here
  the popup is clean (axe: 0 violations LTR and RTL, options 28px high,
  `aria-activedescendant` set, status "30 results"), so the fix is the
  manifest line, for example `"trigger": "[data-part='trigger']"`. Evidence:
  `shots/batch-3-4/combobox-open-ltr.png`.
- note: `packages/manifest/src/component/Combobox.manifest.json:160`.
  `states` lists `open` and `closed`, but `data-state` is only on the popup
  root, never on the field root. Say "on the popup part" in the manifest, or
  the checker will expect it on the field.

### Autocomplete: pass

- note: `packages/manifest/src/component/Autocomplete.manifest.json:292`.
  The same missing `contract.trigger` and the same 15 skips. The order does
  not ask for it here, so it is a note, but it should get the same line (the
  input itself opens the popup when typed into, so the hint may need a
  `[data-demo-trigger]` in the demo instead). The open popup checked by
  hand: axe clean, LTR.

### Stepper: pass

- note: `packages/manifest/src/component/Stepper.manifest.json:156`.
  `"motion": "tab-indicator"`, while the connector fill is a hand written
  transform transition (`Stepper.css:207`). See "One convention", item 1.

Verified: `aria-current="step"` on the current `li`, the current step is
never a button, complete shows a check and invalid a danger glyph, the
hidden status words are Arabic in an Arabic Theme ("الحساب، مكتملة"),
connectors flip in RTL, and a horizontal stepper turns vertical at 320px.

### FormWizard: pass

- note: `packages/react/src/components/FormWizard/FormWizard.tsx:413`. It
  passes `aria-label={stepsLabel}` even when `stepsLabel` is undefined, and
  Stepper spreads rest props after its own default
  (`packages/react/src/components/Stepper/Stepper.tsx:140` to `141`), so a
  wizard without `stepsLabel` renders an unnamed `ol`. Proved with a
  throwaway test (deleted): `<FormWizard steps={...} />` gives
  `aria-label` null, not "Steps". Fix either side: pass the prop only when
  set, or let Stepper apply its default after the spread when the value is
  undefined. The demo always passes `stepsLabel`, so the gallery does not
  show it.
- note: `packages/css/src/components/FormWizard.css:86` to `93`. The
  manifest names `fade-rise`, the CSS writes its own `@starting-style`
  values. See "One convention", item 1.

Verified: Next on an empty first step moves focus to the first invalid
field, which has `aria-invalid="true"` and its error in
`aria-describedby`. From the code: the status is set once per step change
("Step 2 of 4, Address"), steps that are not current stay in the form with
`hidden`, so typed values survive Back (WCAG 3.3.7), and the back button is
a system Button, so `disabled` becomes `aria-disabled` while a check runs.

## One convention

1. **Motion named in the manifest and played in CSS.** Checkbox, Switch and
   Slider say `none` and move something; Stepper and FormWizard name a
   pattern and play their own values. Batch 9 asked the same for Stat and
   Accordion. Recommendation: `motion` names what the component plays, and
   the CSS reads that pattern's tokens or keyframes from `packages/motion`,
   so a style preset changes every use.
2. **The 24px target.** Checkbox and Switch make the control the target and
   draw a smaller box inside; RadioGroup makes the control small and widens
   the press area with `::after`. Recommendation: the Checkbox pattern
   everywhere, so the element box is the target.
3. **Default words follow the Theme language.** Combobox, Stepper and
   FormWizard do; Rating does not. Recommendation: every component with a
   default accessible string takes it from a per language table and the
   Theme, the same way.

## Not a finding, recorded for the lead

- `packages/contract-tests/src/contract.spec.ts:83`. `AXE_TAGS` is
  `wcag2a, wcag2aa, wcag21aa, wcag22aa`, without `wcag21a`, so level A rules
  added in WCAG 2.1 (2.5.3 label in name among them) never run in the
  contract suite. Adding the tag will surface the ListBox note above.
- The lanes could not read GoBanana for Rating and RadioGroup. A pass
  against GoBanana is still owed before gate 1, as for batch 9.

## How this was checked

- `npm install`, `npm run check`: green.
- `npm run contract -- --framework react --component <the thirteen>`: green,
  results above.
- React gallery on port 5191, Chromium headless through Playwright from node
  scripts in the scratchpad:
  - full page screenshots and axe of all thirteen demos in 3 styles by 2
    schemes by LTR English and RTL Arabic at 1280px, plus two 320px runs;
  - every focusable element measured against 24 by 24, and RadioGroup hit
    tested around the control;
  - non text contrast of 14 control parts in 3 styles by 2 schemes,
    composited through every ancestor;
  - keyboard: Slider, RangeSlider and Rating arrows in LTR and RTL, Combobox
    and Autocomplete open, move and Escape, FormWizard next with an empty
    step;
  - Arabic matching in Combobox with diacritics and alef forms;
  - forced colors (`forcedColors: 'active'`) screenshots of eight
    components, and reduced motion (`reducedMotion: 'reduce'`) computed
    transitions on Switch, Stepper and Combobox.
- A throwaway vitest file for the FormWizard step list name, deleted after
  the run.
