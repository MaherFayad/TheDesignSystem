# iOS families and test screens (orders M9 and M10, owner 2026-11-17)

The owner gave the vendor's iOS and iPadOS 27 community kit (Figma file key
`Cltzs6FZW3N5yiC1x1cpQJ`) as the list of what iOS components are, and said:
"make sure to replicate those all, and have them developed and make then
test screens against mobbin refrences". Order M7 mapped the kit
(`docs/reports/lanes/reset-M7-audit.md`): of 35 families we have 18, we have
7 under another shape, and 10 are missing. This file turns the 17 that are
not done, plus the parts and props the audit asked for, into work orders
M9.1 to M9.23, and adds the test screens M10.0 to M10.11.

Nothing here is built yet. Every look it leads to is proposed until the
owner signs it on a phone (ruling 17).

Binding: `PLAN.md` (sections 3, 4 and 12), `AGENTS.md`, `docs/contracts/`,
`DECISIONS.md` (ruling 16 and its refinement for Neutral in "The iOS glass
switch", "Platform looks on the web follow each vendor's web language", the
toast timing of "Components" 1 and 2), `docs/plan/reset.md` section 2 (rules
every reset order inherits), `docs/plan/reset-mobile.md` (M1 to M6, F1, F2)
and `docs/plan/reset-duo.md` (the folding iPhone).

## Contents

1. What exists, and what each family becomes
2. Rules for every M9 and M10 order
3. Schedule and batches
4. Orders M9.1 to M9.23
5. Orders M10.0 to M10.11, the test screens
6. Contract edits the lead makes first
7. Decisions for the owner
8. Not settled
9. References found on Mobbin

## 1. What exists, and what each family becomes

Checked against `packages/manifest/src/component/` and
`packages/react/src/components/` on 2026-11-17 (111 components):

- There is no date picker, calendar, time field, colour picker, wheel
  picker, swipe row, section index, share panel or page dots component.
  The date and colour families are in the old wave 2 list (PLAN section 8,
  on React Aria Components, which is installed at 1.22.1 and on the allow
  list). `reset.md` section 12 sends them to a new wave 2. This plan pulls
  the parts the kit shows forward (owner decision 4).
- `reset.md` phase R4 (not started) already names five of these jobs:
  ActionSheet (R4.9), WheelPicker (R4.10), ListSection and SwipeActions
  (R4.13), PageIndicator (R4.14), QuantityStepper (R4.15) and the separate
  search item of the tab bar (R4.7). This plan builds them now. Where an
  existing component can take the form, this plan uses it and drops the R4
  name (PageIndicator and QuantityStepper, owner decision 5).
- `Popover` already has an `arrow` part and an `arrow` prop (default true),
  and Liquid paints it. The audit's "no arrow" is a platform look and a
  gallery capture question, not a contract change.
- `Toast` already renders without its close button when no `onClose` is
  given (`ToastParts` `closable`), but the `toast()` bus has no option for
  it.
- `Select` has `shape` and `size` only; `emphasis` is a shared axis it can
  take. `NumberField` has `steppers`, `shape`, `size`. `Input` has
  `data-variant` (`outlined`, `filled`). `Fieldset` has no variant.
  `Pagination` is numbered with first, previous, next and last.
  `AlertDialog` has `cancel` and `action` parts, no body for fields, and no
  way to mark the default action. `Sheet` has a header with a close button
  and a footer, no confirm part.
- Angular has Input, Field, Fieldset, Select, NumberField, Spinner, Toast,
  DropdownMenu and SearchField. It has no List, Popover, AlertDialog, Sheet,
  TabBar, ContextMenu or Pagination; those ports are in the new wave 2
  (reset lead decision 6, approval 8). React Native has Button and
  IconButton only; the rest is phase R5.
- Shared CSS files: `Dialog.css` styles Dialog, AlertDialog, Sheet and
  Drawer; `DropdownMenu.css` styles DropdownMenu and ContextMenu. Each goes
  to one order at a time.

### 1.1 Decision per family

"Look" means a platform look of an existing component (CSS only, a style
order). "Variant" means a new prop value or `data-variant` on an existing
component. "Part" means a new anatomy part on an existing component. "New"
means a new component through the contract.

| # | Kit family (plain words) | Audit | Decision | Our name | Order |
| --- | --- | --- | --- | --- | --- |
| 1 | Card of stacked actions anchored to its source | other shape | New (the contract already names it) | `ActionSheet` | M9.10 |
| 2 | Share panel | missing | New, plus a system share helper | `SharePanel`, `share()` | M9.12 |
| 3 | Alert with text fields | missing | Part of AlertDialog (`body`) on the grouped field rows | `AlertDialog` | M9.6 |
| 4 | Alert default action | prop | Prop on the action | `AlertDialogAction primary` | M9.6 |
| 5 | Colour panel: grid, spectrum, sliders, opacity, swatches | missing | New family (wave 2 names) | `ColorSwatch`, `ColorSwatchPicker`, `ColorSlider`, `ColorField`, `ColorArea`, `ColorPicker` | M9.18, M9.20 |
| 6 | Quick action row at the top of a menu | missing | Part of DropdownMenu and ContextMenu | `DropdownMenuQuickActions`, `ContextMenuQuickActions` | M9.4 |
| 7 | Inline month calendar with time row; compact date and time chips | missing | New family (wave 2 names) | `Calendar`, `DateField`, `TimeField`, `DatePicker` | M9.15, M9.17 |
| 8 | Time wheel | missing (inside 7) | New (R4.10 name) | `WheelPicker` | M9.16 |
| 9 | Swipe actions on list rows | missing | New (R4.13 name) | `SwipeActions` | M9.7 |
| 10 | Index bar beside a list | missing | New | `SectionIndex` | M9.2 |
| 11 | List section header and footer | other shape | Part of List (R4.13) | `ListSection` | M9.2 |
| 12 | Edit menu capsule (cut, copy, paste) | missing | New | `SelectionMenu` | M9.11 |
| 13 | Notification banner | other shape | Look plus two parts of Toast | `Toast` (`start`, `meta`, no close) | M9.8 |
| 14 | Page dots on a small platter | missing | Variant of Pagination | `Pagination variant="dots"` | M9.9 |
| 15 | Popover arrow | prop | Look (the part exists) | `Popover` | M9.5 |
| 16 | Pop-up button | other shape | Variant of Select (shared axis) | `Select emphasis="ghost"` | M9.3 |
| 17 | Spoked activity indicator | other shape | Look of Spinner (owner decision 1) | `Spinner` | M9.5 |
| 18 | Stepper, gray capsule with minus and plus | other shape | Variant of NumberField | `NumberField variant="stepper"` | M9.3 |
| 19 | Separate round search tab beside the tab bar | missing | Part of TabBar | `TabBarSearch` (`search` part) | M9.9 |
| 20 | Fields as rows of a grouped card, clear button | other shape | Variants and one part of Input and Fieldset | `Fieldset variant="inset"`, `Input variant="plain" clearable` | M9.1 |
| 21 | Sheet confirm button at the trailing top | prop | Part of Sheet | `SheetConfirm` (`confirm` part) | M9.6 |
| 22 | Toast without a close button | prop | Option on the `toast()` bus | `toast({ closable: false })` | M9.8 |

The 18 families the audit marks "have" are not reordered here; their look
fixes are F1 (running) and M6.

### 1.2 Why each choice

- **ActionSheet is new.** `docs/contracts/anatomy.md` already lists
  "ActionSheet (order R4.9)" on the chrome side, so the name is in the
  contract. It is not an AlertDialog: it is anchored to its source on
  `ios`, it is a bottom sheet of rows on `android`, and its job is a choice
  among actions on one object, not a question. It reuses AlertDialog's
  focus and Cancel rules by reading `packages/shared/src/dialog-focus.ts`.
- **SharePanel is new, and the system sheet comes first.** On the web the
  system share sheet is the Web Share API (`navigator.share`, with
  `navigator.canShare` for files). It needs a secure context and a user
  gesture, and it exists in Safari on iOS and macOS, Chrome on Android,
  and Chrome and Edge on Windows and ChromeOS, not in Firefox on desktop. A
  page cannot list the device's apps or contacts, so a panel of our own can
  never show what the system sheet shows. We build both: `share()` in
  `packages/shared` calls the system sheet when it exists and otherwise
  opens our `SharePanel`; the panel is also what an app uses when the
  targets are its own (people in the app, copy link, add to a list), and it
  always offers "More options" that calls the system sheet where it exists.
  Default `system="prefer"` (owner decision 3). React Native calls the
  core `Share` module, no dependency.
- **Alert with fields is a part, not a component.** It is the same modal
  question with one or two text fields, so AlertDialog gains a `body` part
  that accepts at most two Inputs, drawn as the grouped field rows of M9.1.
- **The default action is a prop.** `primary` on `AlertDialogAction` stamps
  `data-primary`, draws the action with emphasis `solid` and tone `accent`,
  and makes Return in a field of the body run it. Only one per alert.
- **Colour and date are wave 2 components pulled forward.** React Aria
  Components 1.22.1 has Calendar, DateField, TimeField, DatePicker,
  ColorArea, ColorSlider, ColorSwatch, ColorSwatchPicker, ColorField and
  ColorPicker. PLAN section 1 says calendar math is shared through
  `@internationalized/date`. No new dependency.
- **Quick actions and section headers are parts.** They are rows inside a
  menu and a list that already exist; a new component would copy the menu
  keyboard and the list rows.
- **SwipeActions and SectionIndex are new.** Each has its own gesture,
  keyboard path and DOM, and each is used with List but is not a List row.
  SwipeActions keeps the R4.13 name.
- **SelectionMenu is new.** It is a horizontal menu over a selection, built
  from Popover positioning (a virtual anchor) and the Toolbar keyboard. It
  never replaces the browser's own menu inside a native text field; it is
  for selections the app draws (a message, a canvas object, a chip, a
  read only text block). The name says what it acts on.
- **Toast stays Toast.** The banner is the toast's `ios` chrome look (toasts
  are chrome side, reset lead decision 17) plus `start` (an Avatar or Icon,
  convention 6) and `meta` (a time). The close button is dropped only when
  the toast times out: danger toasts and toasts with an action keep it
  (DECISIONS, "Components" 1 and 2).
- **Page dots are Pagination.** The job is the same (go to page n of m); a
  `dots` variant hides numbers, ends and ellipsis. This drops R4.14's
  PageIndicator. Carousel stays in R4.14.
- **Pop-up button is Select.** `emphasis="ghost"` is a shared axis value,
  so no new word: a borderless trigger with the value in the tint and an up
  and down glyph (Lucide `chevrons-up-down`).
- **Stepper is NumberField.** `variant="stepper"` draws a gray capsule with
  minus and plus. The value stays visible as plain text before the capsule,
  because the spinbutton must stay visible to the keyboard (2.4.7) and to
  screen readers (4.1.2). This drops R4.15's QuantityStepper.
- **Field rows are Input and Fieldset variants.** `Fieldset
  variant="inset"` is the grouped card; `Input variant="plain"` drops the
  box, the border and the fill; `clearable` adds the `clear` part (the round
  clear button SearchField already draws).
- **Sheet confirm is a part.** `SheetConfirm` sits at the inline end of the
  header. On `ios` it is a round 44 tint button with a check glyph and its
  label as the accessible name; on `web` and `android` it is a text button
  with the visible label (the full screen dialog form of Material puts the
  action in the top bar).
- **Search tab is a TabBar part.** It is a destination like any tab. On
  `ios` it draws as a separate round item beside the capsule; on `web` and
  `android` it is the last item of the bar.
- **Spinner spokes are a look.** CSS only: a repeating conic gradient mask
  and a stepped rotation, on `ios` in Liquid and Neutral (style wins on
  controls; Neutral follows the platform where it sets no shape). The audit
  said to keep the ring; the owner decides (decision 1).

### 1.3 Dependencies

No order adds a runtime dependency. What each uses is already allowed:

| Need | Package | Allowed by |
| --- | --- | --- |
| Calendar, date and time fields, colour controls (React) | `react-aria-components` 1.22.1 | PLAN section 4, installed |
| Date math, the Gregorian and Umm al-Qura calendars | `@internationalized/date` | PLAN section 4 (`shared`); the lead adds it to `packages/shared/package.json` (section 6) |
| Positioning, menus, popovers, toolbar | `radix-ui` | PLAN section 4, installed |
| Share | Web Share API in the browser, `Share` from `react-native` | no package |
| Copy and paste | Clipboard API in the browser | no package |
| Eyedropper | EyeDropper API (Chromium only, feature tested, hidden elsewhere) | no package |
| Native swipe rows (phase R5) | `react-native-gesture-handler`, `react-native-reanimated` | PLAN section 4 |
| Native pickers and menus (phase R5) | `@expo/ui` | ruling 9 |

No animation library. Motion uses existing pattern ids (`sheet`,
`menu-scale`, `toast`, `tab-indicator`, `drag-drop`, `spinner`, `swap`,
`fade`). If an order finds it needs a new pattern, it reports it and M9.5,
M9.13 or M9.21 adds it in `packages/motion`.

## 2. Rules for every M9 and M10 order

Everything in `docs/plan/reset.md` section 2 holds. Added here:

- **Read first:** `AGENTS.md`, `docs/contracts/` (all five), this file,
  `docs/reports/lanes/reset-M7-audit.md`, `docs/plan/reset-mobile.md`, the
  current React folder and manifest of every component the order touches.
- **Never edit:** root config, barrels, generated files (`*.gen.ts`,
  `manifests.gen.json`, `index.css` files the gen script writes),
  `STATE.md`, `PLAN.md`, `DECISIONS.md`, `docs/contracts/`, the source
  repos, anything under Figma-Killer-2's `vendor/alm-design-system`. A
  component order never edits `packages/css/src/platform/*`,
  `packages/styles/**` or `apps/gallery-react/src/Platforms.tsx`; a style
  order never edits a component folder or a manifest.
- **The kit:** read only, as a reference to look at. Figma tools allowed:
  `create_session`, `get_metadata`, `get_screenshot`, nothing else, never a
  write. No asset, glyph, text, layer name, variable name or component name
  of the kit enters the repo. Captures go to
  `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/m9/<order id>/`.
  The M7 captures in `.../scratchpad/m7/kit/` may be reused.
- **Mobbin:** references are cited by their Mobbin link in the report.
  Images stay in scratch. No third party artwork, text, logos or marks in
  the repo or in a demo.
- **Names and marks:** the style id is `liquid`. The vendor's name for its
  material never appears in a name, prop, token or docs prose. No vendor
  font by file, no vendor symbol set, no vendor mark. Lucide in Neutral and
  Liquid, pixelarticons in Studio and Desk.
- **Every component has three platform answers.** The manifest's
  `summary` or `styles` text says what the component is on `web`, `ios`
  and `android` (no new manifest key). Nothing is iOS only.
- **Frameworks:** each new manifest has `react` `ready`, `angular`
  `planned` (new wave 2) and `native` `planned` with a note naming what
  phase R5 uses (a system view or a drawn control).
- **Acceptance, pictures first (ruling 5).** For each family the order
  touches, a sheet in scratch with four columns at 393 by 852 (or the
  part's own size): the kit, a Mobbin screen of a native app, ours in
  Liquid, ours in Neutral; one row light, one row dark. Where the kit page
  or the Mobbin screen has no dark sample, the dark verdict uses the kit's
  dark ladders (M7, "Kit foundations") and says so. A measured match that
  looks wrong to the eye is a fail. Then: `platform=web` and
  `platform=android` sheets of the same component, the 320 px reflow check,
  `npm run contract -- --framework react --platform ios` for the touched
  components, the same with `--platform web` (zero change to existing
  components, or each change listed), `npm run check`.
- **Arabic:** every new demo has the `long-arabic` case and an RTL sheet.
  Latin digits by default: every date and number formatter passes the
  `-u-nu-latn` extension for `ar` locales.
- **Do not commit, do not push.** Report: what you built, what you could
  not do, any decision you made, the scratch path of each sheet and the
  Mobbin links.

## 3. Schedule and batches

At most four orders run at once, and no two running orders share a file.
The style orders own `ios.css` and the recipes one at a time; F1 (running)
and F2 must hand `ios.css`, `ios-refraction.css` and the Liquid and Neutral
recipes back first.

The audit ranked the missing families (page dots, date and time, colour,
share, edit menu, swipe, index bar, search tab, quick actions, stepper).
The batches keep that rank where files allow, and move the small parts
that other orders stand on (field rows, list sections) to the front.

| Batch | Orders (parallel) | Starts when |
| --- | --- | --- |
| B1 | M9.1, M9.2, M9.3, M9.4 | Section 6 contract edits are in |
| B2 | M9.5 (style), M9.6, M9.7, M9.8 | B1 green; F1 and F2 done for M9.5 |
| B3 | M9.9, M9.10, M9.11, M9.12 | B2 green |
| B4 | M9.13 (style), M9.14 (Angular), M9.15, M9.16 | B3 green; `@internationalized/date` in `shared` |
| B5 | M9.17, M9.18, M9.19 (qa) | B4 green |
| B6 | M9.20, M10.0 | B5 green |
| B7 | M9.21 (style), M9.22 (docs) | B6 green |
| B8 | M9.23 (qa), M10.1, M10.2, M10.3 | B7 green |
| B9 | M10.4, M10.5, M10.6, M10.7 | B8 green |
| B10 | M10.8, M10.9, M10.10 | B9 green |
| B11 | M10.11 (qa) | B10 green; DU first slice for the folding frames |

File owners that move between batches:

| File | Owners in order |
| --- | --- |
| `packages/css/src/platform/ios.css`, `android.css` | F1, F2, then M9.5, M9.13, M9.21 |
| `packages/styles/liquid/recipes/**`, `neutral/recipes/**` | F1, F2, then M9.5, M9.13, M9.21 |
| `packages/css/src/components/List.css`, `packages/react/src/components/List/` | M9.2, then M9.7 |
| `packages/css/src/components/Dialog.css` | M9.6 |
| `packages/css/src/components/DropdownMenu.css` | M9.4 |
| `packages/css/src/components/Input.css`, `Fieldset.css`, `Field.css` | M9.1 |
| `packages/css/src/components/Toast.css`, `packages/shared/src/toast.ts` | M9.8 |
| `apps/gallery-react/src/router.tsx` | M10.0 |

## 4. Orders M9.1 to M9.23

Each order lists: owner, family (from 1.1), decision, files owned,
anatomy, props, states, keyboard and screen reader, WCAG 2.2, `web` and
`android`, right to left, references, acceptance. The check command for
every order is `npm run check`, plus the contract runs of section 2.

### M9.1 Grouped field rows (ds-component)

- Family: 20, text fields in a grouped card. Decision: variants and one
  part of existing components.
- Files owned: `packages/react/src/components/{Input,Fieldset,Field}/**`,
  `packages/css/src/components/{Input,Fieldset,Field}.css`, their three
  manifests.
- Builds:
  - `Fieldset variant="inset"` (`data-variant`): the grouped card. Rows
    are its Field children, split by hairlines from the text edge to the
    trailing edge, `legend` drawn as the section header above the card,
    `description` as the footer under it.
  - `Field` inside an inset Fieldset lays out as one row: label at the
    leading edge (or none, see below), control filling the rest.
  - `Input variant="plain"`: no box, no border, no fill; `clearable`
    (boolean) adds the `clear` part, a CloseButton that shows while the
    field has a value and focus, clears it, and moves focus back to the
    control (convention 15).
- Anatomy: Input gains `clear`. Fieldset and Field: no new part.
- States: `data-variant` on Fieldset and Input; Input `data-empty`.
- Keyboard and screen reader: the clear button is in the tab order after
  the control only while shown, name "Clear text" (Arabic "مسح النص");
  Escape in a plain clearable field clears it when not inside a dialog. A
  row with no visible label keeps a label: the placeholder is never the
  only name (3.3.2); the visible label may be visually hidden with
  `data-visually-hidden`.
- WCAG 2.2: 1.3.1 (legend and description stay programmatic), 1.4.11 (the
  plain field has no boundary, so the row hairline and the card edge carry
  it, at 3:1 against the page, or the focus ring shows it), 2.4.7 (keyboard
  focus ring; the caret alone is not enough), 2.5.8 (row at least 44 on
  `ios`, clear button hit area 24 or more), 3.3.2.
- `web`: the inset Fieldset is a bordered card with rows; it is a valid
  web form layout. `android`: rows render as stacked filled fields (the
  plain variant draws Material's filled field with its indicator line);
  that paint is M9.5's.
- Right to left: label at the right, clear button at the left, hairline
  inset from the right.
- References: the kit page for text fields (M7 sheet `text-fields`);
  Mobbin settings with rows [timespent](https://mobbin.com/screens/3dbbba07-85fb-446a-b7f6-6716cd8b5a3e).
- Acceptance: section 2 sheets for a three row inset group (name, email,
  phone) with one filled and one empty field; rows measure 52 on `ios` at
  default density; Input outlined and filled unchanged on `web` (computed
  style compare).

### M9.2 List sections and SectionIndex (ds-component)

- Families: 11 section header and footer (part of List), 10 index bar
  (new).
- Files owned: `packages/react/src/components/List/**`, `List.css`,
  `List.manifest.json`; new `packages/react/src/components/SectionIndex/**`,
  `SectionIndex.css`, `SectionIndex.manifest.json`; new
  `packages/shared/src/section-index.ts` and test.
- Builds:
  - `ListSection` (part `section`, with `section-header` and
    `section-footer`): a `header` and `footer` prop, children ListItems.
    Renders `<li role="presentation">` holding a heading and a nested
    list, so a screen reader reads "list, 4 items" per section.
  - `SectionIndex`: a column of section keys beside a list with sections.
    Props: `sections` (`{ key, label, target }` or derived), `onSelect`,
    `label` (landmark name, required), `collapse` (`auto`, `never`).
    Parts: `root`, `item`, `gap` (the dot drawn when keys are collapsed).
    States: `data-active` on the current key, `data-collapsed`,
    `data-dragging`.
  - `section-index.ts`: groups items by first letter with `Intl.Collator`
    for the locale, returns keys in alphabet order for `en` (A to Z, then
    `#`) and `ar` (the 28 letters in alphabet order, then `#`), and
    collapses keys to fit a height so that each key keeps at least 24 px.
- Keyboard and screen reader: SectionIndex is a `nav` landmark with links,
  one tab stop with arrow keys (Up and Down, Home and End) and Enter to
  jump; the jump moves focus to the section heading (tabindex -1) so the
  reader announces it. Pointer: press on a key jumps; a press that moves
  along the column scrubs through keys (no hold needed).
- WCAG 2.2: 2.5.8 (each key at least 24 tall and the column at least 24
  wide; when 27 keys do not fit, keys collapse with a gap dot instead of
  shrinking), 2.5.7 (scrubbing is a single pointer press and drag, and a
  tap on any key does the same without dragging), 2.1.1, 2.4.3 (focus
  goes to the section), 1.4.3 (keys are text at 4.5:1), 1.3.1 (section
  headings are headings).
- `web`: the same column beside a long list; on a wide page it may sit at
  the top as a row (`orientation`), owner may skip. `android`: the same
  column; while scrubbing a letter bubble shows (Material fast scroll).
- Right to left: the column sits at the inline end, which is the left in
  Arabic, and lists Arabic keys from top to bottom. Section headers align
  right.
- References: kit page for lists (index bar, section header and footer);
  Mobbin [Outlook contacts](https://mobbin.com/screens/7a3ef555-9ca1-43dc-b993-17b4c2f450a0),
  [Telegram contacts](https://mobbin.com/screens/b1f60825-edc1-40e4-92ed-0c2d8a79fe60).
- Acceptance: section 2 sheets; a 200 item list in English and in Arabic
  with the column; at 852 tall no key is under 24 px; at 568 tall keys
  collapse; Playwright: Enter on "M" moves focus to the M heading.

### M9.3 Pop-up button and stepper looks of Select and NumberField (ds-component)

- Families: 16 pop-up button, 18 stepper. Decision: variants.
- Files owned: `packages/react/src/components/{Select,NumberField}/**`,
  `Select.css`, `NumberField.css`, both manifests.
- Builds:
  - `Select emphasis` with `outline` (default, today's look) and `ghost`:
    no box, the value in `color.text.link`, an up and down glyph after it,
    the menu opens as today. Size `sm` to `lg` as today.
  - `NumberField variant="stepper"`: the value as plain text before a
    capsule holding decrement and increment split by a hairline. The text
    input stays a real spinbutton (typing works; it draws as text until
    focused).
- Keyboard and screen reader: unchanged from today (Select: Space, Enter,
  arrows; NumberField: Up, Down, PageUp, PageDown, Home, End). Stepper
  buttons keep their labels ("Decrease", "Increase", Arabic "تقليل",
  "زيادة") and stay out of the tab order as today.
- WCAG 2.2: 1.4.11 (a ghost Select has no boundary: the value text meets
  4.5:1 and the glyph 3:1, which identifies the control), 2.5.8 (stepper
  halves are 32 tall in the kit; the hit area grows to the platform target
  44 with a transparent `::before`, no visual change), 4.1.2.
- `web`: ghost is a borderless Select for toolbars and filter rows; stepper
  is the same capsule. `android`: ghost draws as a text button with a
  dropdown arrow; stepper as an outlined capsule (paint in M9.5).
- Right to left: the glyph and the capsule sit at the left of the value;
  minus stays at the inline start (right), plus at the inline end.
- References: kit pages for pop-up buttons and steppers (M7 sheets
  `pop-up-buttons`, `steppers`); Mobbin
  [timespent session count](https://mobbin.com/screens/3dbbba07-85fb-446a-b7f6-6716cd8b5a3e),
  [MD Vinyl provider row](https://mobbin.com/screens/36c13178-2eb0-4c24-bad1-d048d6f31ccf).
- Acceptance: section 2 sheets; outline Select and plain NumberField
  unchanged on every platform (computed style compare).

### M9.4 Quick action row in menus (ds-component)

- Family: 6. Decision: part of DropdownMenu and ContextMenu.
- Files owned: `packages/react/src/components/{DropdownMenu,ContextMenu}/**`
  (including `menuShared.tsx`), `DropdownMenu.css`, both manifests.
- Builds: `DropdownMenuQuickActions` and `ContextMenuQuickActions` (part
  `quick-actions`), first in the content, holding two to four
  `...QuickAction` items (part `quick-action`: icon above a short label,
  `tone` neutral or danger). They read the `--_menu-*` family.
- Keyboard and screen reader: each quick action is a `menuitem` inside a
  `group` named by `label` (required, for example "Quick actions"). Down
  and Up move through all items in order, quick actions first; Left and
  Right move inside the row (mirrored in RTL). The visible label is the
  accessible name.
- WCAG 2.2: 2.5.8 (each at least 44 by 44 on `ios`), 4.1.2, 1.4.3 (labels
  at 4.5:1 on the menu surface, glass included), 2.1.1.
- `web` and `android`: the same row at the top of the menu, with the
  platform's menu spacing; never shown as an icon only row.
- Right to left: the row reads right to left (first action at the right).
- References: kit pages for menus and contextual menus; Mobbin
  [Freeform](https://mobbin.com/screens/dcb93eb2-5728-4cf0-b779-6f5ae058c0b5),
  [Play](https://mobbin.com/screens/f53a80a5-6bbe-4b43-a78c-1152bd2e8121).
- Acceptance: section 2 sheets for a dropdown and a context menu with three
  quick actions over six rows; contract key hints for Left and Right.

### M9.5 iOS and Android looks for batch 1, popover arrow, activity indicator (ds-style)

- Families: 10, 11, 16, 18, 20, 6 (paint), 15, 17.
- Files owned: `packages/css/src/platform/{ios,android}.css`,
  `packages/styles/{liquid,neutral}/recipes/{Input,Fieldset,Field,List,SectionIndex,Select,NumberField,DropdownMenu,Popover,Spinner}.css`
  (new files where none exist), `packages/motion/**` if a pattern is
  missing.
- Depends on: B1 green, F1 and F2 done.
- Builds: the `ios` geometry (controls side in `ds.platform`, chrome side
  in `ds.chrome` per the anatomy table) and the Liquid and Neutral paint
  for the parts of M9.1 to M9.4; the popover on `ios`: corner from the
  platform corner scale (about 34 in the kit), a larger soft shadow, the
  arrow shown on every side; the Spinner spokes on `ios` in Liquid and
  Neutral (if the owner says yes to decision 1; else skip and say so); the
  `android` forms named in M9.1 to M9.4; `android` hides the popover arrow
  in `ds.platform` (Material menus have none) and a recipe may show it.
- WCAG 2.2: 1.4.3 and 1.4.11 measured from pixels in both schemes and over
  the M6 coloured content where glass is involved; 2.3.3 spokes collapse
  to a still shape under reduced motion (convention 17).
- Acceptance: the section 2 sheets for every family listed; Studio and
  Desk on `ios` keep their control shapes (ruling 16); `web` unchanged.

### M9.6 Dialog family parts: alert fields, default action, sheet confirm (ds-component)

- Families: 3, 4, 21. Decision: parts and a prop.
- Files owned: `packages/react/src/components/{AlertDialog,Sheet}/**`,
  `Dialog.css`, `AlertDialog.manifest.json`, `Sheet.manifest.json`.
- Depends on: M9.1 (field rows).
- Builds:
  - AlertDialog `body` part (`AlertDialogBody`): accepts at most two
    Inputs or Fields (manifest `slots.body`), drawn as an inset Fieldset.
  - `AlertDialogAction primary`: stamps `data-primary`, emphasis `solid`,
    tone `accent` (danger tone keeps the danger fill), Return in a body
    field runs it. With `requiresValue`, it is `aria-disabled` until the
    first field has a value.
  - `SheetConfirm` (part `confirm`): `label` required, `icon` default
    `check`; in the header at the inline end; `aria-disabled` while
    `disabled`.
- Focus: with a body, focus opens on the first field, not on Cancel (the
  AlertDialog focus rule changes; contract edit). Without a body the rule
  stays: Cancel.
- Keyboard and screen reader: Return in a field runs the primary action;
  Escape cancels when dismissible; the alert's title and description stay
  `aria-labelledby` and `aria-describedby`; field labels as M9.1.
- WCAG 2.2: 3.3.2 (each field has a label, not only a placeholder), 2.4.3
  (focus order: field, field, actions), 2.5.8 (confirm 44 on `ios`), 4.1.2
  (the confirm's label is its name, a Tooltip on hover where a pointer
  exists), 1.4.3 (white label on the tint fill: our darker tint keeps
  4.5:1; the kit's brighter tint does not, M7 item 15).
- `web`: same parts; the primary is a solid Button. `android`: alert
  actions are text buttons (R4.9), the primary in the tint text, fields as
  outlined fields; the sheet confirm is a text button in the top bar.
- Right to left: actions order follows the platform order mirrored;
  confirm at the left.
- References: kit pages for alerts (one and two field forms) and sheets;
  Mobbin [Brave new folder](https://mobbin.com/screens/8b0cf01b-25f8-4848-a43b-0c3a52cdabf9),
  [Google Drive new folder](https://mobbin.com/screens/6cc2ac04-776e-4ec7-9d14-16904c380da7),
  [Wallet pass sheet with close and share](https://mobbin.com/screens/f3ce79fa-8661-4833-a601-04c40cc95ef5).
- Acceptance: section 2 sheets for an alert with one field, with two
  fields, a default action without fields, a sheet with confirm; the alert
  is 300 wide on `ios` with fields (geometry is M9.13's); Playwright:
  Return in the field runs the primary.

### M9.7 SwipeActions (ds-component)

- Family: 9. Decision: new (R4.13 name).
- Files owned: new `packages/react/src/components/SwipeActions/**`,
  `SwipeActions.css`, `SwipeActions.manifest.json`, new
  `packages/shared/src/swipe.ts` and test; `List/**`, `List.css`,
  `List.manifest.json` (ListItem accepts a SwipeActions wrapper; taken over
  from M9.2).
- Builds: `SwipeActions` wraps the content of one ListItem. Props: `start`
  and `end` (arrays of `{ label, icon, tone, onSelect }`, at most three per
  side), `fullSwipe` (`end`, `start`, `none`; default `none` when the first
  action is danger and the app gives no undo), `menuLabel`. Parts: `root`,
  `content`, `actions` (one per side, `data-side`), `action`, `menu` (the
  non drag path). States: `data-state` (`closed`, `open-start`,
  `open-end`), `data-dragging`.
- Gesture: horizontal drag on touch and pen after a 10 px slop with a
  horizontal angle; the content follows the finger; release past half
  opens, past the full swipe threshold runs the first action; one row open
  at a time; a tap outside closes. Logic in `swipe.ts` (thresholds,
  velocity, direction resolution in RTL).
- Non drag path: the `menu` part is an IconButton ("Actions for <row
  title>") that opens a DropdownMenu of the same actions. It is visually
  hidden until the row has focus within or the pointer is a mouse, and is
  always in the accessibility tree. Shift+F10 and the context menu key on
  the row open the same menu.
- WCAG 2.2: 2.5.7 (every swipe action is in the menu; full swipe is never
  the only way), 2.5.8 (action buttons at least 44 wide when revealed, the
  menu button 24 or more), 2.1.1, 4.1.2, 1.4.3 (labels on the danger,
  warning and accent fills at 4.5:1), 3.3.4 does not apply but a danger
  full swipe with no undo is off by default.
- `web`: the menu button shows on hover and focus; mouse drag is off by
  default (`pointer` prop to allow it). `android`: the same reveal with
  square action ends (owner decision 7).
- Right to left: `end` actions sit at the left and are revealed by a swipe
  toward the right; `start` actions sit at the right. The full swipe
  follows the same side.
- References: kit page for lists (swipe actions); Mobbin
  [The Atlantic saved list](https://mobbin.com/screens/e97a2ae1-ef94-4f8d-bdfb-f85b325a9936),
  [Notion Mail swipe settings](https://mobbin.com/screens/0abd5c81-4cd1-450b-bf9a-1cb0990bdca5).
- Acceptance: section 2 sheets closed, half open and full swipe on both
  sides in LTR and RTL; a recording pack clip of swipe, full swipe and the
  menu path on the iPhone frame; contract key hint for Shift+F10.

### M9.8 Toast as a notification banner (ds-component)

- Families: 13, 22. Decision: two parts and a bus option.
- Files owned: `packages/react/src/components/Toast/**`, `Toast.css`,
  `Toast.manifest.json`, `packages/shared/src/toast.ts` and its test.
- Builds: `start` part (an Avatar, an Icon name or a node; convention 6) and
  `meta` part (a short text or a `Date`, rendered in `<time>` with
  `Intl.RelativeTimeFormat`); `toast({ closable: false })`. The bus
  refuses `closable: false` for `tone: 'danger'` and for toasts with an
  action (they stay until closed), and warns in development.
- Keyboard and screen reader: F8 reaches the region as today; a focused
  toast closes with Escape; one announcement per toast (4.1.3); `meta` is
  read after the description.
- WCAG 2.2: 2.2.1 (timed toasts keep `toast.configure`), 2.5.7 (swipe up to
  dismiss also has Escape and the timeout), 1.4.3, 4.1.3.
- `web`: the same parts; close shown by default as today. `android`: the
  snackbar has no icon, so `start` is hidden there by a chrome rule
  (M9.13), `meta` too.
- Right to left: `start` at the right, `meta` at the top left.
- References: kit page for notifications (M7 sheet `notifications`);
  Mobbin: a banner capture is hard to find (it is system chrome); M9.8
  searches "notification banner at the top of the screen" and, if none,
  says so and uses the kit only.
- Acceptance: section 2 sheets for a banner with an avatar, title, two
  line message and time; danger toast still has its close button; unit
  tests for the bus rule.

### M9.9 Search tab and page dots (ds-component)

- Families: 19, 14.
- Files owned: `packages/react/src/components/{TabBar,Pagination}/**`,
  `TabBar.css`, `Pagination.css`, both manifests.
- Builds:
  - `TabBarSearch` (part `search`): a destination item with `href` or
    `onSelect`, `label` required (the accessible name, Arabic "بحث"),
    `active`. Optional `field`: a SearchField the item turns into while
    active (the music app expands the search tab into the field); state
    `data-expanded`.
  - `Pagination variant="dots"`: no numbers, ends or ellipsis; one dot per
    page; the current dot wider (`data-active`); optional `platter` look
    from the style. When pages do not fit at 24 px each (more than about
    12 at 393 wide), dots shrink in look but the root becomes one control
    where a press on the leading half goes back and on the trailing half
    goes forward.
- Keyboard and screen reader: the search item behaves as a TabBar item
  (`aria-current="page"`). Dots: a `nav` named "Pages"; one tab stop; Left
  and Right (mirrored in RTL) move and select; Home and End; each dot is a
  button named "Page 3 of 5" with `aria-current`.
- WCAG 2.2: 2.5.8 (search item 48 to 56 round; dots keep a 24 px hit area
  each, or the half control is at least 44 tall), 1.4.11 (inactive dots at
  3:1 against their platter), 2.5.7 (the carousel's swipe has the dots and
  previous and next buttons), 4.1.2.
- `web`: the search item is the last item of the bar; dots look as on
  `ios` without the platter. `android`: the search item is a normal
  navigation bar item; dots without the platter.
- Right to left: the search item sits at the left of the bar; dot order
  runs right to left and the trailing half (left) goes forward.
- References: kit pages for tab bars and page controls; Mobbin
  [music search tab](https://mobbin.com/screens/38013fe5-6e15-4038-9c0f-039bf66715c7),
  [Slack tab bar with search](https://mobbin.com/screens/bea69f4d-9efc-4b6a-bf23-c87c027c4b3f),
  [Fi onboarding dots](https://mobbin.com/screens/553ba4e0-41b9-4daa-9e3f-26b882e49254).
- Acceptance: section 2 sheets; the duo side column order from
  `reset-duo.md` (search below the tab bar) is checked later in M10.11;
  numbered Pagination unchanged.

### M9.10 ActionSheet (ds-component)

- Family: 1. Decision: new.
- Files owned: new `packages/react/src/components/ActionSheet/**`,
  `ActionSheet.css`, `ActionSheet.manifest.json`.
- Builds: `ActionSheet`, `ActionSheetTrigger`, `ActionSheetContent`
  (`title`, `description`), `ActionSheetAction` (`tone` neutral or
  danger), `ActionSheetCancel`. Parts: `root`, `backdrop`, `panel`,
  `title`, `description`, `actions`, `action`, `cancel`. States:
  `open`, `closed`, `data-placement` (`anchored`, `bottom`, `center`).
- Placement by platform (chrome side): `ios` anchored to the trigger
  (Radix popper), a 300 wide card like the alert, stacked capsules, no
  separate cancel group (Cancel still rendered as the last capsule,
  visually quiet); `android` a bottom sheet with a list of text rows;
  `web` anchored when there is room, else centred.
- Keyboard and screen reader: role `alertdialog` when an action is danger,
  else `dialog`; focus opens on Cancel when an action is danger, else on
  the first action; Up and Down move between actions; Escape cancels;
  focus returns to the trigger.
- WCAG 2.2: 2.4.3, 2.5.8 (capsules 48 tall), 1.4.3 (danger labels), 4.1.2,
  2.4.11 (the anchored card stays on screen; collision padding).
- Right to left: anchored to the trigger's side as positioned; text right
  aligned.
- References: kit page for action sheets (M7 sheet `action-sheets`);
  Mobbin [Hevy routine actions](https://mobbin.com/screens/15cb87a0-88b5-4a37-adf2-d93f9904f81f).
- Acceptance: section 2 sheets for a three action sheet with one danger
  action, anchored top trailing on the iPhone frame; android bottom form;
  contract suite.

### M9.11 SelectionMenu, the edit menu capsule (ds-component)

- Family: 12. Decision: new.
- Files owned: new `packages/react/src/components/SelectionMenu/**`,
  `SelectionMenu.css`, `SelectionMenu.manifest.json`, new
  `packages/shared/src/selection.ts` and test (rect of a range, flip above
  or below).
- Builds: a horizontal menu over a selection or a point. Props: `open`,
  `onOpenChange`, `anchor` (a DOMRect getter or a Range), `items`
  (`{ id, label, icon?, onSelect, disabled? }`), `overflowLabel`. Parts:
  `root`, `item`, `separator`, `more`. When the items do not fit, the
  last ones go behind a `more` chevron that pages the row (as the kit and
  the Raycast capture do). Built-in helpers for cut, copy and paste on the
  Clipboard API, each shown only when allowed.
- Keyboard and screen reader: role `menu` with `aria-orientation`
  horizontal; opens on the context menu key or Shift+F10 when the app's
  selection has focus; Left and Right (mirrored), Home, End, Escape
  closes and returns focus to the selection owner. Paste reads the
  clipboard only on a user activation.
- WCAG 2.2: 2.5.8 (items 44 tall on `ios`), 2.1.1, 4.1.2, 1.4.3 and 1.4.11
  on the glass capsule, 2.4.11 (never covers the selection: flips below
  when there is no room above).
- `web` and `android`: the same capsule (Material's text selection toolbar
  has the same form). It never opens inside a native input or textarea.
- Right to left: items run right to left; the `more` chevron at the left.
- References: kit page for menus (edit menu); Mobbin
  [Raycast selection](https://mobbin.com/screens/85d075b6-ab61-4db2-b607-ba5aa4b003d7),
  [Notes edit menu](https://mobbin.com/screens/a4cfb735-8a30-4567-88a5-5b5fd2398fc0).
- Acceptance: section 2 sheets; a demo with a selectable read only text
  block and a selectable chip; Playwright: Shift+F10 opens, Escape returns
  focus.

### M9.12 SharePanel and share() (ds-component)

- Family: 2. Decision: new, system sheet first (section 1.2).
- Files owned: new `packages/react/src/components/SharePanel/**`,
  `SharePanel.css`, `SharePanel.manifest.json`, new
  `packages/shared/src/share.ts` and test.
- Builds:
  - `share(data, { system })` in shared: `system` `prefer` (default) calls
    `navigator.share` when `canShare(data)` is true and resolves
    `'system'`, `'cancelled'` or `'fallback'`; `never` skips it. A rejected
    `AbortError` is a cancel, not an error.
  - `SharePanel`: opened by the app on `'fallback'` or directly. Props:
    `item` (`title`, `url`, `image`), `people` (the app's own targets:
    `{ id, name, avatar }`), `targets` (`{ id, label, icon }`), `actions`
    (`{ id, label, icon, onSelect }`), `onShare(targetId)`,
    `moreOptions` (shown when the system sheet exists). Parts: `root`,
    `preview`, `people`, `person`, `targets`, `target`, `actions`,
    `action`, `close`. Built on Sheet on `ios` and `android` (medium
    detent), Popover from the trigger on `web`. Copy link is a built in
    action with a "Link copied" toast.
- Keyboard and screen reader: the panel is a dialog named by the item
  title; each row is a group with a name ("People", "Share to",
  "Actions"); inside a row one tab stop and Left and Right; Escape closes;
  focus returns to the trigger.
- WCAG 2.2: 2.5.8 (people and targets 60 or more wide, 44 tall at least),
  1.1.1 (avatars have the person's name; target icons are decorative next
  to labels), 2.1.1, 4.1.2, 1.4.10 (rows scroll inline at 320 wide; no
  page scroll sideways).
- `web`: popover from the share button. `android`: the system share sheet
  in Chrome first; the panel as a bottom sheet in Material spacing.
- Right to left: rows start at the right and scroll toward the left.
- No dependency. React Native: `Share` from `react-native` (system),
  the panel drawn in R5.
- References: kit page for the share panel; Mobbin
  [WHOOP system share](https://mobbin.com/screens/089e33d7-e9dc-4726-8ba5-257641fb73f1),
  [Snapchat send to](https://mobbin.com/screens/4f15982c-81b5-4d48-8ad6-b301662f8968),
  [Nike Training Club share to](https://mobbin.com/screens/67fe7e4b-eea6-47e2-a3b3-39c40cb672b7).
- Acceptance: section 2 sheets of our panel; Playwright with
  `navigator.share` stubbed present and absent: present calls it and never
  opens the panel under `prefer`; absent opens the panel; our own icons
  for targets (Lucide), never third party app icons.

### M9.13 iOS and Android looks for batches 2 and 3 (ds-style)

- Families: 1, 3, 4, 9, 12, 13, 14, 19, 21, 2.
- Files owned: `packages/css/src/platform/{ios,android}.css`,
  `packages/styles/{liquid,neutral}/recipes/{AlertDialog,Dialog,Sheet,SwipeActions,Toast,TabBar,Pagination,ActionSheet,SelectionMenu,SharePanel}.css`,
  `packages/motion/**` if needed.
- Builds: `ios` chrome geometry (alert 300 wide with fields, corner from
  the scale, capsules 14 in; sheet confirm 44 round tint; action sheet
  anchored card; banner 64 tall, corner about 24; separate search item
  beside the capsule; dots on a small glass platter) and the controls side
  (swipe actions, selection capsule, share rows); `android` forms named in
  M9.6 to M9.12; glass only on the control layer (SelectionMenu capsule,
  dots platter, search item), never on the swipe action fills.
- Acceptance: section 2 sheets for every family; recording pack clips for
  swipe, alert with a field, sheet confirm, banner in, search tab and dots
  on the iPhone frame; `web` unchanged; contrast from pixels on glass.

### M9.14 Angular parity for changed components that Angular has (ds-angular)

- Files owned: `packages/angular/src/components/{input,field,fieldset,select,number-field,dropdown-menu,toast}/**`,
  the `angular` block of their manifests.
- Depends on: M9.1, M9.3, M9.4, M9.8 and their reviews (M9.19 may run in
  parallel; findings return here).
- Builds: the same DOM for `Input variant="plain"` and `clearable`,
  `Fieldset variant="inset"`, Field rows, `Select emphasis`,
  `NumberField variant="stepper"`, DropdownMenu quick actions (CDK menu,
  Left and Right inside the row), Toast `start`, `meta` and the
  `closable` bus rule (the shared toast store). No change to
  `packages/css`.
- Acceptance: the contract suite against the Angular gallery for those
  components; pixel compare against React within the threshold.
- Not here (new wave 2): every new component of M9 and the List, AlertDialog,
  Sheet, TabBar, ContextMenu and Pagination changes (Angular has none of
  those yet). Their manifests say `planned`.

### M9.15 Calendar and date math (ds-component)

- Family: 7 (inline calendar). Decision: new (wave 2 name).
- Files owned: new `packages/react/src/components/Calendar/**`,
  `Calendar.css`, `Calendar.manifest.json`, new
  `packages/shared/src/date.ts` and test.
- Depends on: `@internationalized/date` added to `shared` (section 6).
- Builds: `Calendar` on React Aria `Calendar`. Props: `value`,
  `defaultValue`, `onChange`, `minValue`, `maxValue`, `isDateUnavailable`,
  `calendar` (`gregory`, `islamic-umalqura`), `firstDayOfWeek`, `locale`,
  `size`. Parts: `root`, `header`, `title`, `previous`, `next`, `grid`,
  `weekday`, `cell`, `day`. States: `data-selected`, `data-today`,
  `data-disabled`, `data-unavailable`, `data-outside-month`. `date.ts`:
  the locale with `-u-nu-latn` for Latin digits, the calendar factory,
  month titles in both calendars, today in the user's zone.
- Keyboard and screen reader: React Aria's grid (arrows, PageUp and
  PageDown for months, Shift with them for years, Home and End for the
  week); the month title is a live heading; each day cell is named with
  the full date.
- WCAG 2.2: 2.5.8 (day cells at least 44 on `ios`, 24 on `web`), 1.4.3
  (unavailable days stay 4.5:1 or are marked by a strike, not colour
  alone, 1.4.1), 1.4.11 (selected day disc 3:1), 2.1.1, 1.3.1.
- `web`: a month grid in a popover or inline. `android`: the Material
  date picker grid (round selected day, month header with arrows).
- Right to left: weekdays run right to left; previous at the right and
  next at the left with mirrored chevrons; the Arabic locale starts the
  week on Sunday unless `firstDayOfWeek` says otherwise; Umm al-Qura month
  names in Arabic.
- References: kit page for date and time pickers; Mobbin
  [Deliveroo booking](https://mobbin.com/screens/0dee4854-b1a0-4153-bc9a-f06ce98169dd),
  [Beli booking](https://mobbin.com/screens/1bf31016-1dfb-424a-8f0c-eb29b54bb6a9).
- Acceptance: section 2 sheets; Gregorian and Umm al-Qura demos in English
  and Arabic; unit tests for `date.ts` (digits stay Latin in `ar`).

### M9.16 WheelPicker (ds-component)

- Family: 8. Decision: new (R4.10 name).
- Files owned: new `packages/react/src/components/WheelPicker/**`,
  `WheelPicker.css`, `WheelPicker.manifest.json`, new
  `packages/shared/src/wheel.ts` and test.
- Builds: one to three columns, each a scroll snap list with the selected
  row in a band; `columns` (`{ id, label, options, value }`), `onChange`,
  `loop` (for hours and minutes). Parts: `root`, `column`, `option`,
  `band`. The curve is a transform on each option from its distance to the
  band (no layout animation); it flattens under reduced motion.
- Keyboard and screen reader: each column is a `spinbutton` with
  `aria-valuetext` and `aria-label` from the column label; Up and Down
  step, PageUp and PageDown step five, Home and End; typing digits jumps.
  Arrow focus moves between columns with Left and Right (mirrored).
- WCAG 2.2: 2.5.7 (a flick has the arrow keys and a tap on a visible row),
  2.5.8 (rows 32 to 44 tall, band at least 44), 1.4.3 (rows outside the
  band at 4.5:1, not faded below it), 2.3.3.
- `web`: the same wheel (mouse wheel and drag scroll). `android`: a plain
  scrolling list per column with the selected row filled, no curve.
- Right to left: column order mirrors (hours at the right) except for
  values Latin by default; a 12 hour column order follows the locale.
- References: kit page for date and time pickers (wheel); Mobbin: M9.16
  searches "time picker wheel" on `ios` and cites the link.
- Acceptance: section 2 sheets; a recording of a flick settling; Playwright
  keyboard steps.

### M9.17 DateField, TimeField and DatePicker (ds-component)

- Family: 7 (compact chips and inline form). Decision: new (wave 2 names).
- Files owned: new `packages/react/src/components/{DateField,TimeField,DatePicker}/**`,
  their CSS files and manifests.
- Depends on: M9.15, M9.16.
- Builds: `DateField` and `TimeField` on React Aria (segments);
  `DatePicker` with `variant` `compact` (a chip that shows the date, and a
  second chip for the time when `granularity` includes time) and
  `inline` (a Calendar with a time row under it). The compact date chip
  opens a Calendar in a popover (`ios`, `web`) or a dialog (`android`);
  the time chip opens the WheelPicker in a popover on `ios`, a TimeField in
  a dialog on `android` (no clock dial, which is a drag: 2.5.7), segments
  on `web`.
- Keyboard and screen reader: chips are buttons named with the full value
  ("Date, 18 June 2026"); segments as React Aria; Escape closes the
  popover and returns focus to the chip.
- WCAG 2.2: 2.5.8 (chips 34 to 44 tall on `ios`), 3.3.2 (each picker has a
  label), 1.4.3, 2.1.1, 3.3.7 (no asking twice: the chip keeps the chosen
  value).
- Right to left: chips in reading order; the time chip at the left of the
  date chip in Arabic.
- References: as M9.15, plus the kit's compact chips.
- Acceptance: section 2 sheets for compact and inline, date only and date
  with time; Playwright paths by keyboard for each.

### M9.18 Colour controls (ds-component)

- Family: 5, part 1. Decision: new (wave 2 names).
- Files owned: new `packages/react/src/components/{ColorSwatch,ColorSwatchPicker,ColorSlider,ColorField}/**`,
  their CSS files and manifests, new `packages/shared/src/color.ts` and
  test (names for colours in English and Arabic from hue and lightness,
  contrast of a swatch edge).
- Builds: on React Aria. `ColorSwatchPicker` with `layout="grid"` (the
  kit's 12 by 10 grid of our own generated palette, not the kit's values)
  and `layout="row"` (saved swatches with an add button); `ColorSlider`
  for hue, opacity and each channel; `ColorField` for hex and channels.
- Keyboard and screen reader: React Aria's grid and slider keys; each
  swatch named by `color.ts` ("Blue, dark"; Arabic "أزرق غامق"), never by
  hex alone.
- WCAG 2.2: 1.4.1 (selection shown by a ring and a check, not colour),
  1.4.11 (every swatch has an inner edge at 3:1 against the panel, and the
  selected ring 3:1), 2.5.8 (grid cells at least 24, row swatches 44),
  2.5.7 (sliders and the hex field are the non drag paths), 1.1.1.
- `web` and `android`: the same controls; Material has no colour picker,
  so `android` keeps our form with Material spacing.
- Right to left: sliders mirror like Slider; the grid keeps its hue order
  (a colour map, not reading order) and arrow keys move by what is seen.
- References: kit page for colour pickers; Mobbin
  [Notes colours](https://mobbin.com/screens/29cb7507-470f-4fde-9fa2-c64d978de254),
  [Tiimo colours](https://mobbin.com/screens/30ad14cb-7e49-4f4c-be03-2c8dec0ed343).
- Acceptance: section 2 sheets; names checked in both languages.

### M9.19 Review of batches 1 to 4 (ds-qa)

- Files owned: `docs/reports/lanes/reset-M9-review-1.md`,
  `docs/reports/reset/M9.19/**`, test files of `packages/contract-tests`
  only if a manifest hint needs a runner change.
- Checks every order of B1 to B4 against this file and the contracts with
  fresh eyes: the four column sheets exist and look right, the non drag
  paths work, RTL sheets, targets measured, `web` and `android` answers in
  every manifest, the computed style compare on existing components, axe
  on each new demo, no kit or third party text, icon or image in the repo.
  Findings as a list with file and line; no source edits.

### M9.20 ColorArea and ColorPicker (ds-component)

- Family: 5, part 2.
- Files owned: new `packages/react/src/components/{ColorArea,ColorPicker}/**`,
  their CSS files and manifests.
- Depends on: M9.18.
- Builds: `ColorArea` (saturation and brightness, React Aria) and
  `ColorPicker`, the composite: a SegmentedControl with three views (grid,
  spectrum, sliders), opacity slider, a preview swatch, saved swatches, an
  eyedropper button shown only when `window.EyeDropper` exists. On `ios`
  and `android` it opens in a Sheet; on `web` in a Popover.
- Keyboard and screen reader: ColorArea is a two thumb control with
  arrows; the views are tabs; the eyedropper button is named "Pick a
  colour from the screen".
- WCAG 2.2: 2.5.7 (the spectrum drag has arrows, the grid and the
  sliders), 2.5.8, 1.4.11, 4.1.2, 1.4.10 (the sheet fits 320 wide).
- References: as M9.18.
- Acceptance: section 2 sheets for each view; the eyedropper hidden in
  WebKit and Firefox.

### M9.21 iOS and Android looks for date, wheel and colour (ds-style)

- Families: 5, 7, 8.
- Files owned: `packages/css/src/platform/{ios,android}.css`,
  `packages/styles/{liquid,neutral}/recipes/{Calendar,DateField,TimeField,DatePicker,WheelPicker,ColorSwatch,ColorSwatchPicker,ColorSlider,ColorField,ColorArea,ColorPicker}.css`.
- Builds: `ios` and `android` geometry and Liquid and Neutral paint for
  the components of M9.15 to M9.20. The wheel band and the date popover
  are the control layer (glass allowed); calendar days and colour swatches
  are content (solid, PLAN section 3.7).
- Acceptance: section 2 sheets; contrast from pixels; `web` checked.

### M9.22 Docs for the iOS families (ds-docs)

- Files owned: `apps/docs/**` (the iOS platform page and the component
  pages' platform notes), `packages/registry/**` and `scripts/gen-llms.ts`
  only if a new manifest key needs them.
- Builds: on the iOS platform page, a table "what the platform calls a
  thing, and what to use here" in our own words (no kit names), linking
  each new component; the share section saying the system sheet comes
  first; registry items and llms entries come from `npm run gen` (the lead
  runs it).
- Acceptance: links validator; every new component has a page in English
  and Arabic; axe clean.

### M9.23 Review of batches 5 to 7 and the M9 report (ds-qa)

- Files owned: `docs/reports/lanes/reset-M9-review-2.md`,
  `docs/reports/lanes/reset-M9.md`, `docs/reports/reset/M9.23/**`.
- As M9.19 for M9.15 to M9.22, then the M9 report: the coverage map of M7
  updated (35 rows, each "have" with the order that built it), every sheet
  path, every Mobbin link, open findings, what stays proposed.

## 5. Orders M10.0 to M10.11, the test screens

A screen is the acceptance test for the families on it (reset-mobile.md,
M10). Each screen is built only from our components, with our own content:
our own names, places and numbers, our own generated artwork (gradients and
shapes from tokens, as M6 did), Lucide icons. No third party artwork, text,
logos or marks. Each is rebuilt from one Mobbin reference of a native iOS
app: same structure, proportion and behaviour, never its pictures or copy.

Every screen is shown, reference left and ours right:

- at 393 by 852, light and dark, Liquid and Neutral;
- once in Arabic RTL (Liquid, light);
- on the folding iPhone's outer screen (466 by 678 full screen, 382 by 580
  in Safari) and inner screen (669 by 951 portrait and 951 by 669
  landscape), in the `/platforms/duo` frames of `reset-duo.md` section 6.
  This part waits for the owner's model choice (reset-duo decision 1) and
  the DU first slice; until then M10.11 records it as blocked.

### M10.0 Screen host (ds-component)

- Files owned: new `apps/gallery-react/src/ios-screens/**` (host, the list
  of screens, a content kit of our own names and generated artwork, one
  stub file per screen for M10.1 to M10.10), `apps/gallery-react/src/router.tsx`
  (one route), `apps/gallery-react/src/ios-screens.css`.
- Builds: route `/screens/ios/<id>?style=&scheme=&dir=&lang=&frame=` where
  `frame` is `phone`, `duo-outer`, `duo-inner`; a screen renders inside a
  Theme with `platform="ios"`; the duo frames come from the DU host when it
  exists, else the key is ignored. Artwork is drawn from tokens (no image
  files over 20 KB, no photos).
- Acceptance: the host renders an empty screen in every frame; `npm run
  check`; `ds doctor` 0 findings on the folder.

### M10.1 to M10.10 The screens (ds-component, one order each)

Each order owns only `apps/gallery-react/src/ios-screens/<id>.tsx` and an
optional `<id>.css` beside it (gallery overrides layer only). It reads M10.0
read only. Acceptance: the sheets above, `ds doctor` 0 findings, axe clean
on the screen, every interactive element from the system, a recording for
each gesture on the screen.

| Id | Screen | Reference to rebuild (Mobbin, `ios`) | Families it proves |
| --- | --- | --- | --- |
| M10.1 `music-library` | A library of tracks with a large title, play and shuffle buttons, sections by first letter and an index bar; long press a track | [Music, songs](https://mobbin.com/screens/3a938b4d-3b4e-43b7-8de3-cb039a924e31); index bar from [Telegram contacts](https://mobbin.com/screens/b1f60825-edc1-40e4-92ed-0c2d8a79fe60) | top bar with large title, glass buttons, capsule buttons, grouped list, section header, index bar, context menu with quick action row, tab bar, search tab, progress bar (a download), activity indicator (loading more), bottom toolbar (mini player) |
| M10.2 `music-search` | The search tab expanded into the field, scope chips, results, an empty result | [Music, search](https://mobbin.com/screens/38013fe5-6e15-4038-9c0f-039bf66715c7) and [with field](https://mobbin.com/screens/0fdc7e6a-e4aa-4c5a-8879-84396df1a589) | search tab, search field, segmented control, empty state, activity indicator |
| M10.3 `pass-detail` | A pass detail sheet: close, share and confirm in the header, switches, a remove row, details | [Wallet pass sheet](https://mobbin.com/screens/f3ce79fa-8661-4833-a601-04c40cc95ef5), [Wallet pass front](https://mobbin.com/screens/e1061c73-0be8-42ba-aaed-3bb1c3321a4e) | sheet with confirm, grouped list, switches, section footer, popover with arrow (info button), action sheet (remove pass, anchored), share panel and the system share |
| M10.4 `settings` | App settings: grouped rows, switches, a stepper, a pop-up button, a slider, account fields | [timespent interval timer](https://mobbin.com/screens/3dbbba07-85fb-446a-b7f6-6716cd8b5a3e), [MD Vinyl settings](https://mobbin.com/screens/36c13178-2eb0-4c24-bad1-d048d6f31ccf) | grouped list, section header and footer, switch, stepper, pop-up button, slider, text fields in grouped rows, segmented control |
| M10.5 `inbox-swipe` | A list of saved items with swipe actions on both sides, filter menu, a banner after an action | [The Atlantic saved](https://mobbin.com/screens/e97a2ae1-ef94-4f8d-bdfb-f85b325a9936), [Notion Mail swipe](https://mobbin.com/screens/0abd5c81-4cd1-450b-bf9a-1cb0990bdca5) | list swipe actions (full swipe and the actions menu), menu from a button, notification banner (toast without close), bottom toolbar, top bar |
| M10.6 `booking` | Book a table: party size stepper, inline calendar, time chips, a confirm alert with the default action | [Deliveroo booking](https://mobbin.com/screens/0dee4854-b1a0-4153-bc9a-f06ce98169dd), [Beli booking](https://mobbin.com/screens/1bf31016-1dfb-424a-8f0c-eb29b54bb6a9) | date and time picker (inline and compact), time wheel, stepper, capsule buttons, alert with default action |
| M10.7 `notes-edit` | A note with a selection menu, a colour sheet for the pen, rename by an alert with a field | [Notes edit menu](https://mobbin.com/screens/a4cfb735-8a30-4567-88a5-5b5fd2398fc0), [Notes colours](https://mobbin.com/screens/29cb7507-470f-4fde-9fa2-c64d978de254), [Brave new folder](https://mobbin.com/screens/8b0cf01b-25f8-4848-a43b-0c3a52cdabf9) | edit menu capsule, colour picker in a sheet, alert with text fields, bottom toolbar with glass groups |
| M10.8 `onboarding` | Three pages of onboarding with page dots and a capsule action | [Fi onboarding](https://mobbin.com/screens/553ba4e0-41b9-4daa-9e3f-26b882e49254) | page control, capsule buttons, glass close button |
| M10.9 `fitness-plan` | A workout plan with a medium detent sheet of actions, a menu on an exercise, progress for the week | [Hevy routine sheet](https://mobbin.com/screens/15cb87a0-88b5-4a37-adf2-d93f9904f81f), [Bevel workout menu](https://mobbin.com/screens/95037e85-88cb-42be-bd02-a1fbb6891989) | sheet with detents and grabber, menu, progress bar, toast, popover |
| M10.10 `share-flow` | Share a workout card: our share panel with people, targets and actions, then "Link copied" | [WHOOP share](https://mobbin.com/screens/089e33d7-e9dc-4726-8ba5-257641fb73f1), [Snapchat send to](https://mobbin.com/screens/4f15982c-81b5-4d48-8ad6-b301662f8968) | share panel, system share path, notification banner |

On the folding iPhone's inner screen in landscape, M10.1 also renders with
the Sidebar (the kit's sidebar is the regular width form), which proves the
sidebar family; M10.4 renders as a split of settings list and detail.

Coverage of the 35 kit rows by the screens: action sheet (M10.3), share
panel (M10.3, M10.10), alert (M10.6), alert with fields (M10.7), capsule
buttons (M10.1, M10.6, M10.8), glass buttons (M10.1, M10.8), colour picker
(M10.7), context menu (M10.1), quick action row (M10.1), date and time
picker (M10.6), empty state (M10.2), grouped list (M10.1, M10.3, M10.4),
swipe actions (M10.5), index bar (M10.1), section header and footer
(M10.3, M10.4), menu from a button (M10.5, M10.9), edit menu (M10.7),
notification banner (M10.5, M10.10), page control (M10.8), popover
(M10.3, M10.9), pop-up button (M10.4), progress bar (M10.1, M10.9),
activity indicator (M10.1, M10.2), segmented control (M10.2, M10.4), sheet
(M10.3, M10.9), sidebar (M10.1 on the inner screen), slider (M10.4),
stepper (M10.4, M10.6), tab bar (M10.1), search tab (M10.1, M10.2), text
fields (M10.4, M10.7), search field (M10.2), switch (M10.3, M10.4), bottom
toolbar (M10.1, M10.5, M10.7), top bar (M10.1, M10.5).

### M10.11 Screen review and capture (ds-qa)

- Files owned: `docs/reports/lanes/reset-M10.md`,
  `docs/reports/reset/M10/**` (contact sheets only; Mobbin images stay in
  scratch), `packages/contract-tests/src/record/clips.ts` entries for the
  screens.
- Captures every screen per the list above, reference left and ours right,
  checks the coverage list, runs axe and the 320 px reflow on each, the
  duo frames when DU has landed, and writes the verdict per screen and
  scheme as M7 did. Findings go back to the owning M9 order (at most three
  fix rounds, `reset.md` section 2).

## 6. Contract edits the lead makes first

1. `docs/contracts/anatomy.md`, "Chrome side" table: add `SharePanel`
   (placement and form on phones), the banner form of `Toast` (already
   there), `ActionSheet` stays; add a sentence that `SelectionMenu`,
   `SwipeActions`, `SectionIndex`, the date, wheel and colour components
   are on the controls side.
2. `docs/contracts/anatomy.md`, convention 1, shared family: `SelectionMenu`
   and the quick action row read `--_menu-*`.
3. `docs/contracts/anatomy.md`, convention 11 table, new rows: Fieldset
   `data-variant`; Input `data-variant` gains `plain`, and `data-empty`;
   NumberField `data-variant`; Pagination `data-variant`; DatePicker
   `data-variant`; AlertDialog action `data-primary`; TabBar search item
   `data-expanded`; SwipeActions `data-side` on its `actions` parts;
   SectionIndex `data-collapsed`; ActionSheet `data-placement`; Calendar
   `data-today`, `data-unavailable`, `data-outside-month`.
4. `docs/contracts/anatomy.md`, controls side list: add Fieldset (the
   inset variant gets platform rules for the first time). Toast stays on
   the chrome side.
5. `docs/contracts/frameworks.md`: a "System services" section: share goes
   to the system sheet first (`navigator.share` on the web, `Share` on
   React Native) through `share()` in `packages/shared`, with `SharePanel`
   as the fallback and for app targets; clipboard and eyedropper are
   feature tested, never assumed. Dates: React on React Aria, math in
   `packages/shared/src/date.ts` on `@internationalized/date`; Latin digits
   through `-u-nu-latn`.
6. `docs/contracts/manifest.md`: no new key. Note in "Keys" that `a11y.keys`
   must include the non drag path of every gesture (SwipeActions,
   SectionIndex, WheelPicker, ColorArea, Pagination dots).
7. AlertDialog focus rule (manifest text owned by M9.6, rule in
   `DECISIONS.md` "Components"): with a body of fields, focus opens on the
   first field.
8. `packages/shared/package.json`: add `@internationalized/date` (on the
   allow list), one install, before B4.
9. `docs/plan/reset.md`: mark R4.7 (separate search item), R4.9
   (ActionSheet), R4.10 (WheelPicker), R4.13 (ListSection and
   SwipeActions), R4.14 (PageIndicator, replaced by Pagination dots) and
   R4.15 (QuantityStepper, replaced by NumberField stepper) as moved to M9;
   section 12: Calendar, DateField, TimeField, DatePicker and the six
   colour components moved to M9.
10. `DECISIONS.md`: the answers to section 7, and "M9 names: SharePanel,
    SectionIndex, SelectionMenu, SwipeActions, WheelPicker, ActionSheet;
    page dots are Pagination, the stepper is NumberField, the pop-up button
    is Select ghost".
11. `STATE.md` "Waiting on owner": the decisions of section 7.

## 7. Decisions for the owner

1. Activity indicator on `ios` in Liquid and Neutral: spokes drawn by us
   (CSS only), or keep the ring (the audit's advice).
2. Toast on `ios`: keep the close button by default and let apps pass
   `closable: false`, or drop it by default on `ios` for timed toasts. The
   rule that danger and action toasts keep it stands either way.
3. Share: the system sheet first on every platform, our panel as fallback
   and for app targets (recommended), or always our panel on `web`.
4. Pull the date and colour families forward from wave 2 into M9 (needed
   to replicate the kit), with Umm al-Qura in the first cut.
5. Drop R4's PageIndicator and QuantityStepper in favour of Pagination dots
   and NumberField stepper.
6. Arabic section index: the 28 letters at the left edge (recommended), or
   Latin letters only.
7. Swipe actions on `android`: the same reveal with square ends
   (recommended), or Material's swipe to dismiss only.
8. The search tab that expands into a field (as the music app does): in
   M9.9 (recommended) or later.
9. The kit's brighter tint for the default alert action fails 4.5:1 with a
   white label; keep our darker tint (audit item 15). Confirm.
10. The colour grid uses our own generated palette, not the kit's values.
    Confirm.

## 8. Not settled

- I did not open the kit for this plan; the family list and measurements
  come from the M7 audit. Each order captures the kit page it needs.
- Mobbin references for the notification banner and the time wheel were
  not searched; M9.8 and M9.16 search and cite them. Most Mobbin captures
  found are light; dark references may be missing for some screens.
- Whether `-u-nu-latn` holds in React Aria's formatters for every part
  (segments, month title) is not checked; M9.15 verifies.
- The EyeDropper API exists only in Chromium; no Safari behaviour is
  known. The button is hidden where it is missing.
- The duo views of M10 wait on reset-duo decision 1 and the DU orders.
- Haptic ticks for the wheel and the index bar wait on the feedback helper
  of R3.9, not built.
- Native forms are named in each manifest but built in R5; the hybrid rule
  (ruling 8) says pickers, menus, share and alerts are system views there.

## 9. References found on Mobbin

Searched on 2026-11-17 with the Mobbin connector, platform `ios`. Images
stay in scratch; only the links are kept.

| Use | Link |
| --- | --- |
| Music, songs list | https://mobbin.com/screens/3a938b4d-3b4e-43b7-8de3-cb039a924e31 |
| Music, latest songs with tab bar and search tab | https://mobbin.com/screens/3dc82c55-bb68-49a4-bdfa-2f71f2b8a90e |
| Music, search | https://mobbin.com/screens/38013fe5-6e15-4038-9c0f-039bf66715c7 |
| Music, search with field | https://mobbin.com/screens/0fdc7e6a-e4aa-4c5a-8879-84396df1a589 |
| Wallet, pass sheet | https://mobbin.com/screens/f3ce79fa-8661-4833-a601-04c40cc95ef5 |
| Wallet, pass front | https://mobbin.com/screens/e1061c73-0be8-42ba-aaed-3bb1c3321a4e |
| Notes, edit menu | https://mobbin.com/screens/a4cfb735-8a30-4567-88a5-5b5fd2398fc0 |
| Notes, colours | https://mobbin.com/screens/29cb7507-470f-4fde-9fa2-c64d978de254 |
| Freeform, menu with quick actions | https://mobbin.com/screens/dcb93eb2-5728-4cf0-b779-6f5ae058c0b5 |
| Play, menu with quick actions | https://mobbin.com/screens/f53a80a5-6bbe-4b43-a78c-1152bd2e8121 |
| Outlook, contacts with index | https://mobbin.com/screens/7a3ef555-9ca1-43dc-b993-17b4c2f450a0 |
| Telegram, contacts with index and search tab | https://mobbin.com/screens/b1f60825-edc1-40e4-92ed-0c2d8a79fe60 |
| Slack, tab bar with search tab | https://mobbin.com/screens/bea69f4d-9efc-4b6a-bf23-c87c027c4b3f |
| The Atlantic, swipe to delete | https://mobbin.com/screens/e97a2ae1-ef94-4f8d-bdfb-f85b325a9936 |
| Notion Mail, swipe settings | https://mobbin.com/screens/0abd5c81-4cd1-450b-bf9a-1cb0990bdca5 |
| Deliveroo, booking calendar | https://mobbin.com/screens/0dee4854-b1a0-4153-bc9a-f06ce98169dd |
| Beli, booking calendar | https://mobbin.com/screens/1bf31016-1dfb-424a-8f0c-eb29b54bb6a9 |
| Brave, alert with field | https://mobbin.com/screens/8b0cf01b-25f8-4848-a43b-0c3a52cdabf9 |
| Google Drive, dialog with field | https://mobbin.com/screens/6cc2ac04-776e-4ec7-9d14-16904c380da7 |
| WHOOP, system share | https://mobbin.com/screens/089e33d7-e9dc-4726-8ba5-257641fb73f1 |
| Snapchat, send to | https://mobbin.com/screens/4f15982c-81b5-4d48-8ad6-b301662f8968 |
| Nike Training Club, share to | https://mobbin.com/screens/67fe7e4b-eea6-47e2-a3b3-39c40cb672b7 |
| Fi, onboarding dots | https://mobbin.com/screens/553ba4e0-41b9-4daa-9e3f-26b882e49254 |
| timespent, settings with stepper | https://mobbin.com/screens/3dbbba07-85fb-446a-b7f6-6716cd8b5a3e |
| MD Vinyl, settings | https://mobbin.com/screens/36c13178-2eb0-4c24-bad1-d048d6f31ccf |
| Hevy, routine sheet | https://mobbin.com/screens/15cb87a0-88b5-4a37-adf2-d93f9904f81f |
| Bevel, workout menu | https://mobbin.com/screens/95037e85-88cb-42be-bd02-a1fbb6891989 |
| Tiimo, colours | https://mobbin.com/screens/30ad14cb-7e49-4f4c-be03-2c8dec0ed343 |
| Raycast, selection menu | https://mobbin.com/screens/85d075b6-ab61-4db2-b607-ba5aa4b003d7 |
