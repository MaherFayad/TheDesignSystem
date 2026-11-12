# Wave 1 follow ups from the lanes
Collected from `docs/reports/lanes/*.md`, section "Changes needed from the lead",
and from the Neutral and DropdownMenu reports. A consolidation order works
through this list after each round of merges. Tick an item when it lands.

## From lane-5a

1. **CloseButton (order 1.1.9).** The `close` part of Alert and Banner is an
   IconButton (`icon="close" size="xs" emphasis` default ghost, with
   `data-part="close"`) because CloseButton does not exist on this branch.
   When it lands, in `packages/react/src/components/Alert/Alert.tsx` and
   `Banner/Banner.tsx` replace
   `<IconButton data-part="close" icon="close" label={...} size="xs" onClick={...} />`
   with `<CloseButton data-part="close" label={...} size="xs" onClick={...} />`.
   The CSS selectors use `[data-part='close']` and, for solid fills,
   `[data-ds='icon-button'][data-part='close']`; the second must become
   `[data-ds='close-button'][data-part='close']` (Alert.css and Banner.css,
   the solid emphasis blocks).
2. **DECISIONS.md**: record that private properties may carry a
   `-tone-*` group and part names (`-icon`, `-edge`, `-title-fg`) beyond
   the rule 1 list, as Toast, Alert, Callout and Banner do.
3. **Motion catalog (1.11)**: Alert and Banner name `fade-rise`. Their CSS
   keyframes (`ds-alert-in`, `ds-banner-in`) can move to the catalog
   helper once it exists.
4. **Tokens**: the gaps above.

## From lane-5b

1. Button renders Spinner as its `spinner` part: the exact change is under
   Spinner above.
2. Contract suite, `packages/contract-tests/src/lib.ts` line 58: valued state
   attributes are only `data-state` and `data-orientation`, so Meter cannot
   list `data-level` in `states` (it would be checked as a boolean). Change
   to `const VALUED_STATES = new Set(['data-state', 'data-orientation', 'data-level']);`
   or let a manifest state say `data-level=low|medium|high`. Then add
   `"data-level"` to `Meter.manifest.json` `states`.
3. Move `packages/react/src/components/Meter/level.ts` to
   `packages/shared/src/meter.ts` (with its tests) so Angular uses the same
   rule, and replace `packages/react/src/components/ProgressBar/format.ts`
   with `number.ts` once order 1.2.5 lands. Add both to STATE.md so they are
   not lost.
4. Motion catalog (1.11): a bar pattern for the indeterminate slide and a
   fill pattern for value changes; today ProgressBar and ProgressCircle say
   `spinner` and Meter says `number-roll`.
5. Manifest schema, `packages/manifest/schema.json` prop `type` enum (lines
   128 to 134): add `object`, so Meter `levelLabels` can say what it is.
6. Decide whether rule 12 (md is 32 px) covers non controls: Spinner md is
   24 px and ProgressCircle md 44 px. Log it in DECISIONS.md.

## From lane-5c

1. Motion ids. Order 1.11 has no pulse pattern. StatusDot names
   `"motion": "thinking"` as the closest id. Either add a `pulse` pattern to
   the 1.11 list (and change `packages/manifest/src/component/StatusDot.manifest.json`
   `"motion"` to `"pulse"`), or confirm `thinking`.
2. NotificationCenter names `"motion": "list-stagger"` for when new items
   are inserted, but no stagger plays yet: the panel renders a static list.
   When 1.11 lands, either wire `list-stagger` on inserted items or change
   the manifest's `"motion"`.
3. Regenerate on merge (`npm run gen`): the barrels, `packages/css/src/index.css`,
   `routes.gen.ts` and `manifests.gen.json` on this branch were generated
   per commit and are correct as of the last commit.

## From lane-8a

1. Move `SpaceStep` and `spaceSteps` from
   `packages/react/src/components/Stack/space.ts` to a new
   `packages/shared/src/space.ts` (with a test), re-exported from
   `@the-system/shared`, then import it in Stack, Grid and Container
   (`import type { SpaceStep } from '@the-system/shared'`) and drop line 2 of
   `packages/react/src/components/Stack/index.ts`. Lane 8B (Surface padding)
   needs the same type.
2. Add layout tokens to `packages/tokens/src/base/size.json`:
   `size.container.sm` 30rem, `.md` 48rem, `.lg` 68.75rem, `.xl` 84rem;
   `size.grid.item-min.sm` 10rem, `.md` 15rem, `.lg` 24rem; and
   `space.gutter` (16px at phone width in every density). Then in
   `Container.css` set `--_container-max: var(--ds-size-container-<w>)` and in
   `Grid.css` `--_grid-min: var(--ds-size-grid-item-min-<s>)`.
3. Record in `DECISIONS.md` the layout data attributes listed above, that
   layout components omit `motion`, and extend the private property names in
   `docs/contracts/anatomy.md` rule 1 with the layout plumbing names above.
4. Record that Container's width prop is `width`, not the order's `size`.

## From lane-8b

1. `packages/css/src/components/Button.css`: add private properties so a
   parent can restyle a Button without direct declarations. In the root rule
   (`:is([data-ds='button'], [data-ds='icon-button'])`, around line 31):

   ```css
   --_button-justify: center;
   ...
   justify-content: var(--_button-justify);   /* replaces justify-content: center */
   ```

   In `[data-ds='button'][data-wrap] > [data-part='label']` (around line 112):
   `text-align: var(--_button-label-align, center);` in place of
   `text-align: center;`. Then Section.css can set `--_button-justify:
   flex-start` and `--_button-label-align: start` and drop its two direct
   declarations. The start offset and the chevron color stay as they are.
2. `docs/plan/wave-1-batch-8.md`, batch header: say that surface components
   also read color, radius, elevation and border tokens (see Token gaps).
3. `docs/contracts/anatomy.md`, convention 1: allow layout names for private
   properties (`columns`, `row`, `padding`, `shadow`, `item-*`), or tell me
   the names to use and I will rename.
4. Wave 1 shared types: Surface defines `SurfacePadding` (the space steps
   `2xs` to `12xl` plus `none`) locally. Lane 8A (Stack, Grid) needs the same
   list for `gap`. A shared `SpaceStep` type in `packages/shared/src/axes.ts`
   (or `space.ts`) would serve both. Not added here, because no order in this
   lane names that file.
5. GoBanana access for a later pass on these three (see Sources).

## From lane-8c

- Run `npm run gen` on merge (the barrels, `packages/css/src/index.css`,
  `routes.gen.ts` and `manifests.gen.json` were regenerated and committed on
  this branch, but the lead's merge with other lanes needs a fresh run).
- `packages/shared/src/index.ts` gains `export * from './resize';` through
  gen.
- Route the token questions above to ds-tokens.
- Move `packages/react/src/components/Window/useControllable.ts` to a shared
  place (for example `packages/react/src/internal/useControllable.ts`) and
  update its importers: Window, Dialog and now SplitView
  (`SplitView.tsx`, the line `import { useControllable } from '../Window/useControllable';`).
  It is a private helper of another component today; Dialog already
  imports it the same way.

## From lane-9b

1. **Contract suite, valued state attributes.**
   `packages/contract-tests/src/lib.ts:58`:

   ```ts
   // before
   const VALUED_STATES = new Set(['data-state', 'data-orientation']);
   // after
   const VALUED_STATES = new Set(['data-state', 'data-orientation', 'data-trend', 'data-variant', 'data-side']);
   ```

   Or better, a manifest way to declare valued states. After that, add
   `data-trend` to `Stat.manifest.json` `states`. Toast's `data-swipe` has
   the same problem and passes today only because no swipe happens during
   the scan.

2. **DECISIONS.md:** Kbd's md is 24px, an exception to anatomy rule 12
   (inline text, not a control). Also, `--_kbd-face-top`,
   `--_kbd-face-bottom`, `--_kbd-shadow`, `--_stat-value-*`,
   `--_list-item-bg-*` and `--_description-list-pair-gap` extend the
   private names of rule 1.

3. **After 1.2.5 merges:** replace
   `packages/react/src/components/Stat/formatStatNumber.ts` with
   `formatNumber` from `packages/shared/src/number.ts`. Keep
   `breakableValue` in Stat.

4. **After 1.11 merges:** check that `number-roll` and `list-stagger` are in
   the catalog. Then move Stat's roll keyframes into the pattern, and call
   its `animate()` helper in `useRollOnChange`.

5. **Tooltip and DropdownMenu** (1.6.6, 1.6.8): render the shortcut part as
   given in the Kbd section above.

6. **Icons:** decide whether `trend-up` and `trend-down` go on the mirror
   list in `packages/icons/src/names.ts`. Today they do not mirror.

## From lane-9c

1. `packages/css/src/components/Button.css`, root rule: add two private
   properties so a parent can align the content without declarations.
   Before: `justify-content: center;` After:
   `--_button-justify: center;` in the property block and
   `justify-content: var(--_button-justify);`. In the
   `[data-ds='button'][data-wrap] > [data-part='label']` rule, before
   `text-align: center;`, after `text-align: var(--_button-label-align, center);`
   with `--_button-label-align: center;` declared on the root, and add
   `flex: var(--_button-label-flex, 0 1 auto);` to the label rule. Then
   Accordion.css drops its two declarations and sets
   `--_button-justify: space-between; --_button-label-align: start; --_button-label-flex: 1 1 auto;`.
2. `DECISIONS.md`, Components: record that a disabled container (Card) keeps
   text at 4.5:1 and dims only its media, because the contrast exception for
   inactive controls does not cover a container. Convention 5 of
   `docs/contracts/anatomy.md` speaks of actions and text entry only.
3. `packages/motion` (order 1.11): consider a `hover-lift` pattern (transform
   only, reduced form none) for Card, and later Tile and RadioCard.
4. Tokens (ds-tokens): `size.measure` for long text lines, and optionally
   `color.selected.ring`.
5. `docs/contracts/anatomy.md`: a sentence that a family may own a second
   root (TileGrid) in its own CSS file without its own manifest, or a rule
   that it needs one. Today TileGrid has no manifest and no gallery route.
6. Neutral (order 1.10): a `packages/styles/neutral/recipes/Tile.css` like
   Desk's, so tiles read as cards with Neutral's borders.

## From order-1-11

1. The four manifest edits above (one line each, `"motion": ...`). Then
   delete the matching rows of `PENDING_RENAME` in
   `packages/motion/src/catalog.test.ts`; the test tells you when.
2. Decide on `press`: either accept `none` for press feedback (CSS only, no
   catalog entry) or let 1.21 add a 19th id `press` (scale.press,
   spring.press). The 18 ids were fixed by the order, so I did not add it.
3. Window.tsx: no change needed. `animateWindow`, `settle` and `settled` are
   exported from the barrel as before, and `styleMotion.ts` still finds
   `WindowMotionMode` and `preset.window`. Optional later: read
   `patternPreset(style, 'window-grow')` instead of the `window` mode once
   the Theme carries presets.
4. Toast.css line 158 and 165 use a raw `scale(0.98)`. The catalog reads
   `scale.dialog-enter` (0.98). Suggested change in Toast.css:
   `scale(0.98)` to `scale(var(--ds-scale-dialog-enter))` in both
   keyframes. Same value, now a token.
5. `packages/manifest/manifests.gen.json` on the lead branch is stale
   against the source manifests (`npm run gen` rewrites it). I left it as
   it was; regenerate on merge.

## From the Neutral report (order 1.10)

1. A style cannot set its own control sizes without breaking density: density
   rules are weaker than style rules. Let a style token carry
   `$extensions["ds.density"]` and have `build.ts` write those values under
   `[data-style='<id>'][data-density='<d>']` after the style rules.
2. `Icon.css`: `stroke-width: var(--_icon-stroke-width, 2);` in the line set
   rule, or a base number token `icon.stroke.width`, so Neutral can draw at
   1.5.
3. Gallery default style is Neutral: `apps/gallery-react/src/App.tsx` line 26
   and `axes.ts` (`GALLERY_STYLE`), and the same in
   `apps/gallery-angular/src/app/app.ts`. The Theme fallback stays `studio`.
4. `Input.css` sets the field fill to `transparent` with no token behind it,
   and the title bar line has no token: two recipes exist only for that.

## From the DropdownMenu report

1. Tokens: `menu.width.max`, `scale.menu-enter`.
2. The `useMenuLayer` helper could be shared (lane 6C decides).
3. The contract suite cannot open a menu before pressing Home, End, the
   submenu arrows or typeahead.

## From the ButtonGroup report

1. Remove the `cloneElement` fill in `ButtonGroup.tsx` once Button reads the
   group context (lane 1A).

## From the contract suite and Window reports

1. `packages/contract-tests/src/lib.ts`, `moveDirection`: a `physical` flag
   on a key hint, so a positioned object moves the same way in RTL.

# Round 2: requests from lanes merged on 2026-11-12, second merge

Copied from each lane report's "Changes needed from the lead" section. Not yet worked.

## From lane-1e


1. **Contract suite: a key hint that opens through a trigger.** Today
   `contract.keys` can focus one element and press one key. SplitButton (and
   any later component that wraps a DropdownMenu, such as Menubar or a
   toolbar overflow) cannot express "open from this trigger, then press
   Escape, then expect focus back on the trigger". Proposed: a hint field
   `open` (a selector clicked first), and an `expect` value `focus-returns`
   that passes when focus is back on the `open` element after the key. In
   `packages/contract-tests/src/contract.spec.ts` `checkHint`, before the
   focus step: `if (hint.open) await page.locator(scope ? `${scope} ${hint.open}` : hint.open).first().click();`,
   and after the press:
   `hint.expect === 'focus-returns' ? await page.locator(hint.open).first().evaluate((el) => el === document.activeElement)`.
   SplitButton would then add
   `"Escape": { "open": "[data-part='trigger']", "case": "variants", "expect": "focus-returns" }`
   and list Escape in `a11y.keys`.
2. **The suite's open checks for a component that opens another component.**
   Overlay mode needs the trigger to add a root of the same kebab. A manifest
   hint `contract.opens: "dropdown-menu"` would let target size open and axe
   open run on SplitButton. I ran both by hand for now (see Checks).

## From lane-2a


1. Regenerate the barrels on merge (`npm run gen`). The branch's last commit
   carries the generated files as they were here; they also hold other
   lanes' entries that were not regenerated on the base branch
   (ButtonGroup, DropdownMenu, Link, the Desk DropdownMenu recipe import).
2. `docs/plan/wave-1-batch-2.md`, order 1.2.1, Anatomy line. Before:
   "Anatomy: unchanged: root, `label` (...), `required`, `description`,
   `error` (...)". After: "Anatomy: root, `label` (a Label root carrying
   `data-part="label"`), `description`, `error` (a FieldError root carrying
   `data-part="error"`). The required mark is Label's part." And a
   DECISIONS.md line for it.
3. Order 1.11 (motion catalog): Input and Textarea name `fade`, which is not
   in the 18 ids. Either add `fade` (an opacity fade of the focus glow) or
   name the id they should use.

## From lane-2b
  inset beside a button. See "Changes needed from the lead".
- Two elements carry `data-part="control"` in SearchField and PasswordField
  (the nested Input root, owned by the composite, and the native input,
  owned by Input). This follows the ownership rule; noted in the manifest.
- At xs the 24px clear and toggle buttons sit in a 24px box with 1px
  borders, so they overlap the border by 1px. Targets pass; accepted.
- PasswordField `insteadUse` points to OTPField (order 1.2.9, lane 2D), which
  has no manifest yet. The validator accepts it.
- InputGroup decides parts by elimination, so a wrapper child is read as the
  control. Documented; an explicit marker would need a change in Button.
- InlineEdit: a long English value in an Arabic page is cut at the start by
  the ellipsis (the Button label runs in the page direction). Pass `dir` on
  the root for such values; Button's label part has no bidi isolation.
- InlineEdit: the default edit label lower cases the label and is English;
  the manifest says to pass `editLabel` in other languages.
- English demo values in the rtl screenshots show the full stop on the left.
  That is the demo content in an rtl page, not the component.

## From lane-2d


1. **Route slug for acronym names.** `scripts/gen-index.ts` line 127 builds
   the gallery slug with one regex, so `OTPField` becomes `otpfield`. The
   contract suite (`packages/contract-tests/src/lib.ts` `kebabCase`) and
   `data-ds` use `otp-field`, so the contract skips OTPField with "no
   gallery route". Change line 127:

   ```ts
   // before
   const slug = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
   // after
   const slug = name
     .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
     .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
     .toLowerCase();
   ```

   Then `npm run gen`. I patched `routes.gen.ts` locally only to run the
   contract and the screenshots; the committed `routes.gen.ts` is the
   generator's output (`otpfield`).
2. **Private property names.** `anatomy.md` lists the private names
   `height`, `padding-inline`, `gap`, `font-size`, `radius`, `bg`, `fg`,
   `border-color`, `ring` with state suffixes. These lanes also use
   `--_otp-field-border-color-invalid` (as Input does),
   `--_otp-field-separator-color`, `--_phone-field-code-bg` (with `-hover`
   and `-focus`) and `--_phone-field-autofill-bg` (as Input's
   `--_input-autofill-bg`). Add them to the list, or name the rule for a
   part's own fill.
3. **Read only border style** is written directly (`border-style: dashed`)
   in both components, as in Input.css. If the convention wants every state
   to swap properties, add `--_<c>-border-style` to the list.
4. `packages/styles/desk/index.css` gained `@import './recipes/DropdownMenu.css'`
   from `npm run gen`: the recipe was on the branch I started from but the
   index was not regenerated. Not my change; committed as generated.
5. `Field.manifest.json` `slots.root.accepts` should list OTPField and
   PhoneField (order 1.2.1 says so; that is lane 2A's file).

## From lane-3a


1. `docs/plan/wave-1-batch-3.md`:
   - 1.3.5 Switch and 1.3.12 Slider: add `control` to the anatomy, for the
     reasons above.
   - 1.3.1 Checkbox: change "`control` (the box)" to "`control` (the 24px
     target)" and "`indicator` (check or minus icon)" to "`indicator` (the
     box with the check or minus glyph)".
2. 1.3.2 CheckboxGroup says the error is "a FieldError root". Either accept
   the group's own error part, or have FieldError take an `id` without a
   Field context (a change to `Field.tsx`, which this lane does not own).
3. When 1.11 lands, decide on a `toggle` pattern and update the `motion` of
   Checkbox, Switch, Slider and RangeSlider.
4. When `packages/shared/src/number.ts` lands, replace
   `Slider/format.ts` with `formatNumber`. Keep Western digits and the unit
   rule: symbols and px join the number; words get a space.
5. Regenerate on merge. Each commit carries the `npm run gen` output from its
   own tree: the barrels, `index.css`, `manifests.gen.json` and
   `routes.gen.ts`.

## From lane-3b
  "Changes needed from the lead").

## 1.3.3 RadioGroup


1. `docs/contracts/anatomy.md`, rule 1: add `-checked` and `-invalid` to
   the state suffixes. Allow a working property on a part (pattern
   `--_<c>-<name>-now`) that only state rules set. Or tell this lane which
   names to use.
2. `DECISIONS.md`: "Radio controls (RadioGroup, RadioCard, Rating) use
   native disabled, as Radix does: a disabled option leaves the arrow order.
   Rule 5 of anatomy.md covers actions and text entry only."
3. Order 1.11 or `DECISIONS.md`: choose the motion id for small state fades
   (Input, RadioGroup, RadioCard, Rating all name `fade`). Either add `fade`
   to the catalog or rename these to `fade-rise`.
4. Optional: move `packages/react/src/components/Window/useControllable.ts`
   to a shared place (for example `packages/react/src/internal/`). Dialog,
   RadioGroup, RadioCard and Rating import it from Window today.
5. Optional token: `color.primary.graphic`, a primary color for marks that
   keeps 3:1 (text default in Studio, primary border in Desk). It would
   replace the Studio Rating recipe and give RadioGroup and RadioCard a
   stronger accent in Studio.

## From lane-3c


1. **The Combobox contract (decision 2).** Approve it in DECISIONS.md, or
   add a combobox overlay kind to `packages/contract-tests` whose opened root
   needs no tab stop. Then set `contract.trigger` on both manifests.
2. **The MultiSelect and TagField orders (lane 3D)** need an Owns line that
   lets them add `[data-ds='multi-select']` and `[data-ds='tag-field']` to
   the selector lists in `packages/css/src/components/Combobox.css` and
   `packages/styles/desk/recipes/Combobox.css`. They can reuse
   `ComboboxBase.tsx` only for a single text value; MultiSelect needs its own
   trigger and the ListBox in multiple mode.
3. **DECISIONS.md:**
   - the list family popup uses `z.menu`;
   - list rows follow `list.row.height`;
   - the private names in "Left open" above.
4. **Optional:** move `filterListBoxItems` from
   `packages/react/src/components/ListBox/ListBox.tsx` to
   `packages/shared/src/filter.ts` (pure data), and export it from there for
   Angular and native.

## From lane-4b


1. **Generated files.** I ran `npm run gen` and committed the result. The
   lead's committed copies were already stale: they were missing
   ButtonGroup, DropdownMenu and Link. Regenerate on merge:
   `apps/gallery-react/src/routes.gen.ts`, `packages/css/src/index.css`,
   `packages/manifest/manifests.gen.json`, `packages/react/src/index.ts`,
   `packages/shared/src/index.ts` (adds `export * from './stepper';`) and
   `packages/styles/desk/index.css`.
2. **Lane 4A, Form.** When Form lands, change the panel in
   `packages/react/src/components/FormWizard/FormWizard.tsx` from `<form
   ...>` to `<Form data-part="panel" ...>`, and route the step check through
   `collectErrors`. This needs Form to accept `noValidate`, `onSubmit`,
   `aria-labelledby` and a `ref`, and to let a caller check a subset of
   fields (one step). Please give that order the requirement.
3. **Motion catalog (1.11).** Stepper names `tab-indicator` and FormWizard
   names `fade-rise`. Both are on the 1.11 list. No catalog package exists
   yet, so the catalog test will check them.
4. **Optional, Button.** Add private properties for justify and text
   decoration (`--_button-justify`, `--_button-decoration-line`), so a parent
   such as Stepper can restyle a quiet inline Button without direct
   declarations.

## From lane-6a


1. **Angular lane (A5 or the Dialog port owner):** `Dialog.css` and
   `packages/styles/desk/recipes/Dialog.css` changed selectors from
   `[data-ds='dialog']` to `:is([data-ds='dialog'], [data-ds='alert-dialog'], [data-ds='drawer'], [data-ds='sheet'])`.
   Declarations and specificity are unchanged and the React shots are
   identical. Please run
   `npm run shots -- --framework angular --component dialog` and
   `npm run shots -- --compare react angular` after merge to confirm 0 px.
2. **After CloseButton (1.1.9) merges:** in
   `packages/react/src/components/Dialog/Dialog.tsx`, the `closeButton`
   constant, replace
   `<IconButton data-part="close" icon="close" label={closeName} size="sm" disabled={!ctx.dismissible} />`
   with the CloseButton equivalent (`<CloseButton data-part="close" label={closeName} size="sm" disabled={!ctx.dismissible} />`),
   and do the same in `splitHeader` in
   `packages/react/src/components/Drawer/Drawer.tsx`. Lane 6A owns both
   files, so a follow up order for this lane can do it. The `close` part
   rules in `Dialog.css` select only `[data-part='close']`, so no CSS
   change is needed.
3. **Generated files:** `npm run gen` was run and its output committed
   (barrels, `index.css`, `routes.gen.ts`, `manifests.gen.json`,
   `packages/styles/desk/index.css`). At `762fb7f` they were already stale
   for ButtonGroup, DropdownMenu and Link, so the diff in those files
   includes those entries too. Regenerate on merge.
4. **Motion catalog (1.11):** the `dialog` and `sheet` patterns this lane
   names should match the CSS here: `dialog` as already defined, and
   `sheet` as a slide of 100% from the side (Drawer, mirrored in rtl) or
   from the block end (Sheet), on `duration.slow`, `ease.emphasized` in and
   `duration.base`, `ease.exit` out.

## From lane-6b


1. **IconButton shows its label in a Tooltip by default** (order 1.6.6
   acceptance). In `packages/react/src/components/IconButton/IconButton.tsx`:
   - Add to the imports: `import { Tooltip } from '../Tooltip';`
   - Add to `IconButtonProps`:
     ```ts
     /**
      * Shows the label in a Tooltip on hover and focus. Default true. false:
      * no tooltip (an IconButton already inside a labelled toolbar hint).
      */
     tooltip?: boolean;
     ```
   - Replace the function (lines 34 to 49) with:
     ```tsx
     export function IconButton({ icon, label, loading = false, loadingLabel = 'Loading', tooltip = true, ...rest }: IconButtonProps) {
       const button = (
         <ButtonRoot
           {...rest}
           ds="icon-button"
           defaultEmphasis="ghost"
           loading={loading}
           aria-label={label}
           render={() => (
             <>
               <span data-part="icon">{renderSlotContent(icon)}</span>
               {loading && <ButtonLoading label={loadingLabel} />}
             </>
           )}
         />
       );
       return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
     }
     ```
   - Replace the `label` doc line "Never the native title attribute; the
     Tooltip pairing arrives with Tooltip in wave 1." with "Shown in a Tooltip
     on hover and focus (tooltip prop)."
   - Manifest `IconButton.manifest.json`: add the `tooltip` prop (boolean,
     default true) and a note: "The label shows in a Tooltip; it is not read
     twice, because a tooltip that repeats the name is not wired as the
## From lane-6c


1. Optional, `packages/contract-tests`: let `contract.trigger` name the
   opened root kind, for example `"opens": "dropdown-menu"`, so Menubar can
   run the open target size and axe checks without an open-at-load case.
2. `STATE.md`: 1.6.9 and 1.6.10 done; lane 6D (CommandPalette, Lightbox)
   is unblocked on the lane 6C side.
3. Regenerate on merge (`npm run gen`). The generated files in this branch
   are gen output.

## From lane-7a


1. `packages/css/src/components/Button.css`: add a private
   `--_button-justify` (default `center`) used by `justify-content`, and a
   `--_button-label-align` used by the `[data-wrap] > [data-part='label']`
   rule (default `center`). Sidebar's group trigger now sets
   `justify-content: space-between` directly and overrides the label's
   `text-align` (`Sidebar.css`, the group trigger block), which reaches into
   Button's own declarations. With the two properties it would set
   `--_button-justify: space-between` and `--_button-label-align: start`
   instead.
2. Same file: Button's font weight is a direct declaration. A
   `--_button-font-weight` (default `var(--ds-font-weight-bold)`) would let
   Navbar's trigger match the link weight through a property; today
   `Navbar.css` sets `font-weight` on the trigger directly.
3. `DECISIONS.md` (optional): record that the Rail's 44px target comes from
   the platform axis, not from `md`.
4. `DECISIONS.md` or `anatomy.md` rule 7: Sidebar, Rail and Navbar take a
   required `label` that names the `nav` landmark and is never drawn. Rule 7
   says `label` is visible text except on icon only components. Either add a
   written exception for landmark names or rename the prop to a required
   `aria-label` across the navigation family.
5. When Tooltip (1.6.6) lands: wrap each `SidebarItem` of a collapsed
   sidebar and each `RailItem` of a rail with `hideLabels` in a Tooltip with
   its label. The places are marked with a `Tooltip (1.6.6)` comment in
   `Sidebar.tsx` and `Rail.tsx`.
6. When Drawer (1.6.3) lands: replace Navbar's `mobile` disclosure panel with
   a Drawer root carrying `data-part="mobile"` (marked in the header comment
   of `Navbar.tsx`).
7. Generated files were refreshed with `npm run gen` and committed as
   generated (barrels, `packages/css/src/index.css`, `routes.gen.ts`,
   `manifests.gen.json`). `packages/styles/desk/index.css` picked up an
   import of `recipes/DropdownMenu.css` that the last gen on the lead's
   branch had missed. Regenerate on merge.

## From lane-7b


1. **ButtonBase.** `packages/react/src/components/Button/ButtonBase.tsx`,
   lines 145 to 147, `onKeyDown` while inert:
   - Before: `if (!inert) onKeyDown?.(event);`
   - After: `if (!inert || (event.key !== 'Enter' && event.key !== ' ')) onKeyDown?.(event);`
   - Why: as it stands, a disabled Button inside any roving focus group
     (Toolbar, a future ToggleGroup or Menubar) traps the arrow keys.
   - Do the same in `Link.tsx` (`onKeyDown` while disabled).
   - Once this lands, Toolbar can pass the system `disabled` again and drop
     its `inertProps` helper and its aria-disabled CSS.
2. **ToggleButton and ToggleGroup** (batch 1), when merged: make
   `ToolbarToggleItem` render a ToggleButton, and move the on state styling
   from `Toolbar.css` into the ToggleButton block of `Button.css`.
3. **Tooltip** (1.6.6), when merged, add it in these places:
   - every icon only `ToolbarButton` and `ToolbarToggleItem`;
   - the More tools trigger;
   - a Tabs trigger whose label is cut by an ellipsis.

   Dock's drawn name stays a part of the link, not a Tooltip.
4. **PageShell** (1.8.12): add to Accept: "a bottom TabBar or Dock slot
   reserves its block size as `padding-block-end` and
   `scroll-padding-block-end` (WCAG 2.4.11)". The TabBar and Dock manifests
   point to it.
5. **DECISIONS.md**: log three decisions:
   - Tabs use native `disabled` on triggers;
   - Dock `md` tiles are 44px;
   - Toolbar disabled items use aria-disabled without the system `disabled`,
     until change 1 lands.
6. **demo.css**: an optional `data-demo="narrow"` helper would replace the
   inline `maxInlineSize` styles in the Toolbar, TabBar and Dock demos.
7. **Regenerate.** Generated files were regenerated with `npm run gen` and
   committed. Run it again on merge.

## From lane-7c
  `../Window/useControllable`. See "Changes needed from the lead".

## TableOfContents (1.7.10)


1. **Move `useControllable` to a shared hooks location.** Pagination imports
   it from `packages/react/src/components/Window/useControllable.ts`, the
   same way DropdownMenu does. Move it to
   `packages/react/src/hooks/useControllable.ts` and update the imports in
   Window, DropdownMenu and Pagination. It is not my file, so I left it.
2. **Generated files.** Barrels, `css/src/index.css`, `styles/*/index.css`,
   `routes.gen.ts`, `manifests.gen.json` and `shared/src/index.ts` were
   refreshed with `npm run gen` and committed. Regenerate them on merge.
3. **Contract suite support for components that wrap a DropdownMenu.**
   - Breadcrumbs and LanguageSwitch own a DropdownMenu trigger. The suite
     treats `open` and `closed` in `states` as an overlay of the component
     itself, so their "open" axe and target-size checks are skipped.
     DropdownMenu's own contract covers the menu.
   - A hint would let the suite open a nested overlay and check it under
     the parent, for example `contract.nestedTrigger`.
   - Separately, the suite has no way to say that a part's own `data-state`
     is not the component's state.
4. **Schema decision.** Decide whether `motion` may be left out for
   components with no motion (SkipLink, Breadcrumbs, LanguageSwitch). Link
   already does this. Or add a `none` pattern to the catalog.
5. **GoBanana source check.** Add GoBanana to the lane environment, or have
   someone review these components against GoBanana `site.css` lines 77 to
   100, `AnchorScroll.tsx` and `SiteNav.tsx`. I could not read them.

## From lane-9a


1. `packages/react/src/components/Button/ButtonBase.tsx:79`
   - before: `ds: 'button' | 'icon-button';`
   - after: `ds: 'button' | 'icon-button' | 'chip';`
   - and line 152, before:
     `` throw new Error(`${ds === 'button' ? 'Button' : 'IconButton'} with asChild needs one element as its child.`); ``
     after:
     `` throw new Error(`${{ button: 'Button', 'icon-button': 'IconButton', chip: 'Chip' }[ds]} with asChild needs one element as its child.`); ``
   - then in `packages/react/src/components/Chip/Chip.tsx`, drop the cast
     `ds={'chip' as 'button'}` to `ds="chip"` and its comment.
2. When StatusDot (1.5.10) lands: Avatar's status part becomes a StatusDot
   root carrying `data-part="status"`; the `[data-part='status']` rules in
   `Avatar.css` move to StatusDot.css or become private property overrides.
3. When CloseButton (1.1.9) lands: Chip's remove part becomes a CloseButton
   root carrying `data-part="remove"`; keep the `--_button-*` overrides in
   `Chip.css` if CloseButton is styled in Button.css.
4. `DECISIONS.md`: record the extra private property names listed above,
   and "`start` drawn in an `icon` part" for Badge and Chip, so later orders
   with an `icon` part follow one rule.
5. When 1.11 lands: confirm `fade-rise` is the pattern for the four, and
   whether a `none` id should exist for components with no motion.


# Round 3: found by the lead while merging

1. `npm run check` passed while `packages/css/src/components/Dialog.css` held
   merge conflict markers. Add a gate in `packages/lint` that fails on a line
   starting with seven `<`, `=` or `>` characters in any source file, and a
   CSS parse step for `packages/css/src/components/*.css`.
2. The CLI test `ds add --framework angular` snapshots the real Angular file
   list, so it breaks on every Angular merge. Snapshot a fixture folder, or
   assert the shape and a few known files.

# Round 4: from Angular fix round 2 (docs/reports/fixes/angular-2.md)

Done by the lead: `@angular/forms` and `@the-system/motion` declared in
`packages/angular/package.json`. Open, items 2 to 7 of that report: React
Form `visibleTarget` for a radio at `tabindex="-1"`; the ConsentField
manifest note; an Angular motion order for the round 1 and round 2
interactions; `labelOf` reading `aria-labelledby`, once, in
`packages/shared/src/form.ts`; contract suite cases that submit a form and
open an empty Select; a full shots refresh for both frameworks.
