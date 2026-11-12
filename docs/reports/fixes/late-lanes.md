# Fixes: late lanes

Fix round for `docs/reports/reviews/late-lanes.md`, plus the Sidebar axe
`target-size` failure. Branch `claude/ds-fix-late`, cut from
`claude/relaxed-hypatia-7gseap`. One commit per component (`fix-late: <Name>`).
Three helpers ran as claude-opus-5-5 at medium on Form, ConsentField and
Fieldset; on Select, MultiSelect and TagField; and on CommandPalette, Lightbox
and PageShell. The lead fixed ToggleGroup, SegmentedControl, FilterBar and
looked into Sidebar, then checked and committed all of them.

Proof:

- `npm run check`: green, 13 of 13 steps, on the final tree.
- `npm run contract -- --framework react` on all fifteen components in one
  run, then Select and FilterBar again after the manifest fix below: every
  component passes. The skips are the "open" runs of FilterBar, TagField and
  Sidebar (15 each). They need a suite change, listed under "Changes needed
  from the lead".
- Each blocker has a unit test that fails on the old code. The FilterBar test
  was checked against the old file. The others were written to the failure
  the review describes.

## Blockers

| # | Component | Blocker | Status | Fix and test |
| --- | --- | --- | --- | --- |
| 1 | ToggleGroup | Attached labels lose words to an ellipsis at 320px (1.4.10) | fixed | An attached item label wraps and the item grows (`ToggleGroup.css`). The CSS test asserts the wrap. Measured at 320px in Studio dark, Neutral light Arabic RTL and Desk light: no clipped label, `scrollWidth` 320. |
| 2 | ToggleGroup | Arabic chip "تنتهي هذا الأسبوع" is an MSA verb phrase | fixed | Now "موعدها هالأسبوع". A demo test checks the label. |
| 3 | SegmentedControl | Five option "many" case loses units at 320px (1.4.10) | fixed | Item labels wrap and the item grows. The measured thumb follows through the existing ResizeObserver. The CSS test asserts the wrap and that no ellipsis is left. The 320px measure shows no clipped label. The manifest `fullWidth` text and the too-many title are updated. |
| 4 | Select | An empty list opens a listbox with no options (axe `aria-required-children`) | fixed | With no options the list never opens. The trigger is described by the empty text, as loading already was. Tests: keys and a click do not open it, and the trigger has a description. |
| 5 | TagField | Text past `max` ended with a comma is lost | fixed | `onInputChange` keeps the text that did not fit, as `commitText` does. Test: 10 tags, `max` 12, "Alpha, Beta, Gamma," leaves "Gamma" in the box. |
| 6 | TagField | Max and duplicate messages are only in a hidden status (3.3.1) | fixed | A visible FieldError after the box, which describes the control while it shows. The polite status is kept. Test included. |
| 7 | TagField | The highlighted suggestion is marked by fill alone, about 1.3:1 (2.4.7, 1.4.11) | fixed in TagField | `TagField.css` sets ListBox's private `--_list-box-option-ring` on the highlighted option in its own popup. Ring contrast: 11.66 (Studio dark), 15.38 (Studio light), 18.42 (Desk light), 4.57 (Neutral light). In Desk dark the ring is 1.16:1, but the yellow fill marks the option there. Combobox and Autocomplete still need the ListBox change below. |
| 8 | Form | The browser's `validationMessage` shows: English in Arabic, with no fix advice (3.1.2, 3.3.3) | fixed | Each ValidityState flag maps to `FormLabels` copy, with en and ar defaults. A validator message wins over the generic copy. The demo postal field says "Enter the 5 digit postal code." Tests cover Arabic email, number and pattern, and validator precedence. |
| 9 | Form | An empty required box or radio reads "Fill in this field." (3.3.3) | fixed | New labels `requiredChoice` ("Tick this box to go on.") and `requiredOption` ("Pick one option to go on."), each with Arabic. Tests cover a checkbox and a radio group. |
| 10 | Form | A checkbox group error is filed under the first box and the Fieldset shows nothing (3.3.1) | fixed | The summary link takes the nearest legend or group name. Fieldset gains a `name` prop that reads `useFormFieldError` and shows the error in its error part. Test included. |
| 11 | FilterBar | Inline `labels` cancel the count announcement (4.1.3) | fixed | The results function is kept in a ref and dropped from the effect dependencies. Test: inline labels plus a parent render inside the wait still announce. It fails on the old file. |
| 12 | ConsentField | The summary and the field show different messages | fixed | `requiredError` is registered with the Form by name, so both show it. With no `requiredError`, both read the `requiredChoice` copy. Test included. |
| 13 | ConsentField | The long purpose bundles two uses (PDPL: one purpose per consent) | fixed | One use with a long data and recipient list, in en and white Saudi Arabic. A test checks that no demo purpose joins two uses after "so they can" or "عشان". |
| 14 | CommandPalette | A character key shortcut fires inside text fields (2.1.4) | fixed | When the shortcut has no Ctrl, Meta or Alt, input, textarea, select and contenteditable targets are ignored. The manifest `keys` entry says so. Tests cover each field kind, the key outside a field, and Mod+K inside an input. |
| 15 | Lightbox | A double click never zooms (the stage's pointer capture takes it) | fixed | Pointer up releases the capture, and the double click checks containment with an `elementFromPoint` fallback. Unit tests cover it, including a retargeted event. A Chromium script checked it by hand: a double click zoomed in and a second zoomed out. |
| 16 | Lightbox | Previous and next sit on the image with no fill (1.4.11) | fixed | A solid fill from tokens at every width, through new `--_lightbox-nav-*` private properties that feed IconButton. At 320px the icon is 12.6:1 or more in every style, scheme and direction. Shots retaken, plus three phone shots. |
| 17 | Lightbox | The Arabic row is not in an Arabic theme (3.1.2) | fixed | Wrapped in `<Theme lang="ar" dir="rtl">`. The test checks the theme around the Arabic trigger. |
| 18 | Sidebar | axe `target-size` on `#folder-8` (too-many, Neutral, Arabic RTL) in the full run | not reproduced, no change | See below. |

### Sidebar

The failure is in `docs/reports/contract-react.json`, from the full run
started at 14:22 today. It does not come back on this branch:

- The Sidebar contract alone passed 29 of 29.
- The fifteen component run passed Sidebar 29 of 29. Both include axe in
  Neutral light and dark, Arabic RTL.
- Axe `target-size` in Chromium on the same URL passed:
  - at rest;
  - with fonts blocked;
  - with the body scrolled so that `#folder-7` or `#folder-8` straddles the
    clip edge, at 4 to 30px visible;
  - in a sweep of 20 scroll offsets.

The geometry at rest:

- `#folder-8` is clipped out of the body: item 4226 to 4262, body ends at 4193.
- Its box still overlaps the box of the footer's Settings link (4215 to 4251).
- When axe counts the clipped item as visible, Settings covers all but about
  11px of it, which is the reported failure. That suggests a race in axe's
  offscreen check under the load of the full run, not a Sidebar layout
  defect. The header and the footer already sit outside the scrolling body,
  so nothing covers a visible item.

No Sidebar file was changed, and I did not commit a speculative fix. If the
failure comes back in the lead's next full run, there are two options:

- Give the body `contain: paint` and check whether axe then treats the
  clipped items as offscreen.
- Add `target-size` to Sidebar `contract.skipAxeRules`, with this reason.

## Notes fixed

- ToggleGroup:
  - The props cast now covers the multiple form:
    `ToggleGroupSingleProps | ToggleGroupMultipleProps`.
- SegmentedControl:
  - The `fullWidth` text says that labels wrap.
- FilterBar:
  - The demo grid and list toggles are wired to state, with a test.
  - "More filters" is recorded in `content` as an agreed exception to the
    verb plus noun rule.
  - The manifest notes say where each state sits.
- Select:
  - The `empty` prop doc says the list does not open and that the caller
    should pass the text.
  - The states note explains `closed` (see "Changes needed from the lead",
    item 1).
- TagField:
  - The Latin "Enter" in the Arabic hint goes through `Bidi`, in the demo and
    the manifest.
  - Pending animation frames are cancelled on unmount, with a test.
- MultiSelect and TagField:
  - Under forced colors the nested ListBox border is `Canvas`, so only one
    frame shows. This is not a 0 width: ListBox has no border width property
    (see "Changes needed from the lead").
- Form:
  - The `submitted` label is announced after a passing submit.
  - The FormField and FormSubmit entries are gone from the manifest `parts`.
- Fieldset:
  - The `name` prop; the manifest note is reworded.
- ConsentField, development warnings:
  - a stray `defaultChecked`;
  - a controlled `checked` that starts true with no `meta`;
  - `disabled` with `checked` true;
  - no `detailsHref` and no notice link in the surrounding Fieldset.
- ConsentField demo:
  - The settings Fieldset has a description with a privacy link.
  - The `empty` case has the details link.
- CommandPalette:
  - The physical key fallback applies only when the key is not a Latin letter
    or digit. AZERTY Ctrl+A no longer matches Mod+Q, and Colemak Ctrl+E no
    longer matches Mod+K.
  - The count counts distinct commands.
- Lightbox:
  - `LightboxTrigger` is out of `props`.
  - Two notes are added: the arrows pan while zoomed, and previous and next
    have a solid fill.
- PageShell:
  - The footer color goes through `--_page-shell-footer-fg`.
  - The Arabic nav label is now التنقل الرئيسي, so it differs from its first
    link.
  - `usePageShell` is out of `props`.

## Notes left open

- SegmentedControl:
  - Track hairline contrast: not a failure.
  - Selection follows focus: keep it in mind for the Angular port.
- NumberField and ScrubInput:
  - All notes are left open. They are copy, manifest or behavior choices, and
    none is a blocker.
- ToggleGroup:
  - `native.accessibilityRole` is radiogroup for both types: the native
    schema has one role key.
- The private name lists (`--_toggle-group-divider`, `--_menu-*` and others)
  need a DECISIONS entry.
- Select:
  - Moving `popupLayer` to `internal/` touches ComboboxBase and
    DropdownMenu.css, which this round does not own.
- MultiSelect:
  - The read only "+N" and `aria-haspopup="dialog"` are behavior changes.
- TagField:
  - The Arabic register of "أضف وسما واحدا على الأقل": the lead settles it
    once, for TagField and MultiSelect together.
- Fieldset:
  - `aria-invalid` on the controls in an invalid group needs a context that
    Checkbox, Switch and Input read.
- ConsentField:
  - `disabled` with `checked` gets only a warning. Blocking it would change
    behavior for controlled apps.
- FilterBar:
  - One tab stop per chip until the ToggleGroup swap.
  - The borrowed basis tokens.
- CommandPalette:
  - Shift with a symbol, and `Mod+/` on an Arabic layout: needs layout aware
    symbol matching.
  - The `label-content-name-mismatch` heuristic: only once the gate runs
    `wcag21a`.
- Lightbox:
  - No `loading` case: it needs a slow image source in the gallery.
  - `scrollable-region-focusable` while zoomed: a focus order decision.
- PageShell:
  - The sticky header hook and the aside width wait on the viewport height
    token.
  - The cases are embedded, because the gallery wraps demos in `main`.

## DOM changes (for the Angular port)

- Select: the `data-part="empty"` row inside the list is gone. With no
  options, the trigger gets an `aria-describedby` to a hidden span holding the
  empty text (the same span loading uses).
- TagField: while a refusal message shows, a `<p data-ds="field-error" id>`
  sits after the root, and the input's `aria-describedby` points to it.
- Fieldset: renders `data-name` when `name` is given.
- Form: the `body` part is `position: relative; overflow-x: clip` (CSS only).
- ToggleGroup and SegmentedControl: CSS only. Labels of attached and segmented
  items wrap. The shared CSS carries this to Angular.
- Lightbox, CommandPalette, PageShell, FilterBar, ConsentField: no DOM change.

API changes:

- ConsentField `requiredError` is now `string`, not `ReactNode`.
- Form exports `useFormRequiredMessage(name, message)`.
- `FormLabels` gains these entries:
  - `typeMismatch`
  - `patternMismatch`
  - `tooShort`
  - `tooLong`
  - `rangeUnderflow`
  - `rangeOverflow`
  - `stepMismatch`
  - `badInput`
  - `requiredChoice`
  - `requiredOption`
  - `submitted`

## Token requests

None. Every fix uses existing tokens.

## Changes needed from the lead

1. **The contract suite and `closed`.** The review asked to drop `closed`
   from the Select states and `open`, `closed` and `data-selected` from the
   FilterBar states. Dropping them broke the suite:
   - Select stopped being treated as an overlay, so the anatomy check never
     opened it.
   - FilterBar's more Button part stamps `data-state`.

   I kept `open` and `closed` in both, with notes, and dropped only
   `data-selected` from FilterBar. If a manifest should list only what it
   stamps, let the suite detect an overlay from `open` alone, or from a
   `contract.overlay` hint.
2. **ListBox virtual focus ring**, so Combobox and Autocomplete get it too.
   - In `ListBox.tsx`, add
     `data-virtual-focus={virtualFocus ? '' : undefined}` on the root.
   - In `ListBox.css`, after the `:focus-visible` rule, add:

     ```css
     [data-ds='list-box'][data-virtual-focus] [data-part='option'][data-highlighted] {
       --_list-box-option-ring: inset 0 0 0 var(--ds-border-width-strong) var(--_list-box-option-ring-color);
     }
     ```

   - Inside its forced colors block, set `--_list-box-option-ring-color:
     HighlightText` on the same selector.
   - TagField's own rule can then go.
3. **ListBox border width.** Add `--_list-box-border-width:
   var(--ds-border-width-default)` and use it in the `border` declaration.
   MultiSelect and TagField can then set it to 0 in their popups, in place of
   the `Canvas` color.
4. **Checkbox hidden input overflow.** At 320px in RTL, the Radix hidden
   input of a Checkbox scrolls the page sideways inside a form. Form and
   ConsentField now clip it. The source fix is
   `[data-ds='checkbox'] { position: relative; overflow-x: clip;
   overflow-clip-margin: var(--ds-space-2xs); }` in `Checkbox.css`. Check
   Switch and RadioGroup too.
5. **Contract suite coverage.**
   - Add `wcag21a` to `AXE_TAGS`.
   - Add a way to open a nested menu or popup that is not the component root
     (FilterBar more menu, TagField suggestions), so their 15 "open" runs stop
     skipping.
   - Let the suite open the `empty` case too.
6. **Sidebar.** If the full run still shows `target-size` on `#folder-8`,
   pick one of the two options under "Sidebar" above.
7. **Generated files.** `manifests.gen.json` and `registry.json` are
   regenerated and committed with this report.
