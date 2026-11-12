# Lane 1D: toggle groups

Branch `claude/ds-lane-1d`. Both components are done: `npm run check` is green,
and `npm run contract -- --framework react --component ToggleGroup,SegmentedControl`
passes 29 of 29 for each. Screenshots are in
`docs/reports/shots/wave-1/toggle-group/` and `docs/reports/shots/wave-1/segmented-control/`
(studio dark and light, desk dark and light, desk dark rtl ar).

Commits:

- `wo-1.1.6: ToggleGroup`
- `wo-1.1.6: ToggleGroup review fixes: focusable disabled items, focus ring over the on ring`
- `wo-1.1.7: SegmentedControl`
- `wo-1.1.7: SegmentedControl review fixes: steady slide, scaled parents, size steps, selected ring, Shift+Tab from disabled items`

Generated files (barrels, `packages/css/src/index.css`, `routes.gen.ts`,
`manifests.gen.json`) were refreshed with `npm run gen` and committed. Regenerate
them on merge.

No Button, ToggleButton or ButtonGroup file and no `Button.css` was edited.

## 1.1.6 ToggleGroup

Files:

- `packages/react/src/components/ToggleGroup/`: `ToggleGroup.tsx`, `ToggleGroup.test.tsx`
  (13 tests), `ToggleGroup.demo.tsx`, `index.ts`, `inertItems.ts` (a private helper,
  shared with SegmentedControl)
- `packages/css/src/components/ToggleGroup.css`
- `packages/manifest/src/component/ToggleGroup.manifest.json`

```tsx
type ToggleGroupProps = (
  | { type: 'single'; value?: string; defaultValue?: string; onValueChange?: (v: string) => void }
  | { type: 'multiple'; value?: string[]; defaultValue?: string[]; onValueChange?: (v: string[]) => void }
) & {
  size?: 'xs' | 'sm' | 'md' | 'lg';              // default md, to the items
  emphasis?: 'solid' | 'soft' | 'outline' | 'ghost'; // no default, to the items
  shape?: 'default' | 'pill' | 'square';          // no default, to the items
  orientation?: 'horizontal' | 'vertical';        // default horizontal
  attached?: boolean;                             // default false
  disabled?: boolean;                             // default false
  loop?: boolean;                                 // default true
  ref?: Ref<HTMLDivElement>;
} & ({ 'aria-label': string } | { 'aria-labelledby': string }) & HTMLAttributes<HTMLDivElement>;

interface ToggleGroupItemProps {
  value: string;
  children?: ReactNode; // the label
  start?: IconName | ReactElement;
  end?: IconName | ReactElement;
  icon?: IconName | ReactElement; // icon only form
  label?: string;                 // its accessible name
  size?, emphasis?, shape?;       // win over the group
  disabled?: boolean;
}
```

Anatomy: root `data-ds="toggle-group"`; `item` is a ToggleButton root
(`data-ds="toggle-button" data-part="item"`), drawn with `ButtonRoot` under
`RadixToggleGroup.Item asChild`, so Button.css styles it, its on state and its
forced colors Highlight included.

Decisions:

- Roles are what Radix 1.2.1 renders: type single is `radiogroup` with `radio`
  items and `aria-checked`; type multiple is `toolbar` with buttons and
  `aria-pressed`. Both tested.
- Axes reach the items through `ButtonGroupContext`, which `ButtonRoot` already
  reads. An item's own prop wins.
- `attached` mirrors ButtonGroup. Inner corners are squared through Button's four
  logical corner private properties, so the seam flips in RTL. The seam borders
  are written directly, as ButtonGroup.css does (Button has no per-side border
  property). The focus ring goes inside an attached item.
- Disabled items stay focusable (anatomy rule 5). Radix is not told about
  `disabled`; `ButtonRoot` makes the item inert. Since `ButtonRoot` drops every
  key handler of an inert item, Radix's included, `inertItems.ts` moves focus on
  from a disabled item (arrows, Home, End, Shift+Tab) from a root `onKeyDown`.
  A disabled group carries `aria-disabled="true"` on its root.
- `motion: "none"`: the group has no motion of its own.
- No tone axis on items: the order lists size, emphasis and shape only.

## 1.1.7 SegmentedControl

Files:

- `packages/react/src/components/SegmentedControl/`: `SegmentedControl.tsx`,
  `SegmentedControl.test.tsx` (14 tests), `SegmentedControl.demo.tsx`, `index.ts`
- `packages/css/src/components/SegmentedControl.css`
- `packages/manifest/src/component/SegmentedControl.manifest.json`

```tsx
type SegmentedControlProps = {
  value?: string;
  defaultValue?: string;                  // set it: one item is always selected
  onValueChange?: (v: string) => void;    // never called with ''
  size?: 'xs' | 'sm' | 'md' | 'lg';       // default md
  shape?: 'default' | 'pill' | 'square';  // default pill
  disabled?: boolean;                     // default false
  fullWidth?: boolean;                    // default false
  ref?: Ref<HTMLDivElement>;
} & ({ 'aria-label': string } | { 'aria-labelledby': string }) & HTMLAttributes<HTMLDivElement>;

interface SegmentedControlItemProps {
  value: string;
  children?: ReactNode;            // the label
  start?: IconName | ReactElement;
  icon?: IconName | ReactElement;  // icon only form
  label?: string;                  // its accessible name
  disabled?: boolean;
}
```

Anatomy: root `data-ds="segmented-control"`, `indicator` (the thumb, the first
child, `aria-hidden`), `item` (a ToggleButton root with `data-part="item"`, ghost
emphasis, restyled through Button's private properties).

Decisions:

- Radix ToggleGroup `type="single"` renders `radiogroup` and `radio` items with
  `aria-checked` (verified in the test). The value never goes empty: a press on
  the selected item is ignored. Selection follows focus (item `onFocus`), so the
  arrows, Home and End select.
- The thumb is placed from the measured frame of the selected item, written as
  four logical private properties (`--_segmented-control-indicator-start`, `-top`,
  `-inline-size`, `-block-size`) on the indicator. It slides with
  `catalog['tab-indicator'].animate(thumb, { from, to })`: transform only. Under
  reduced motion the catalog plays nothing and it jumps. Checked in Chromium: one
  `ds-motion:tab-indicator` animation of transform only, landing exactly on the
  item; none under reduced motion.
- The measurement divides by the root's scale, so a parent that animates scale
  (a Dialog opening) does not skew it. A ResizeObserver re-places the thumb
  without motion when density, fonts or labels change the size, and leaves a
  running slide alone when the frame did not change.
- Shape defaults to `pill`, as the order asks for Studio and Desk. Desk's
  `radius.control` is not a pill, so it could not come from tokens alone.
- Sizes: md 32 and lg 44 px. xs and sm drop the inset and gap so each item keeps
  its 24px target: sm 28 px, xs 26 px (24px items plus the hairline).
- Selected is not shown by color alone: the thumb has a 2px inner ring
  (`border.width.strong`, `color.bg.overlay-50`, as ToggleButton's on ring) and
  the text is `color.text.bright`. In forced colors the thumb hides and the
  selected item is Highlight (Button.css).
- Contract hints: the arrows, Home and End are `focus-moves`. The Space and
  Enter hints were dropped: focusing an item already selects it, so pressing
  them changes nothing the suite can see. Unit tests cover selection.
- No `empty` case: one item is always selected.
- FK2 sources were read (cloned read only). GoBanana could not be fetched; the
  Arabic copy cookbook path named in wave-1.md does not exist in this session.
  Arabic demo copy follows the house style of the existing demos.

## Review findings

Fixed (ToggleGroup review):

- Blocker: the on item's inner ring covered the inset focus ring in an attached
  group. The ring gives way while the item has focus.
- Blocker: disabled items left the tab order, and a disabled group could not be
  reached by Tab. Fixed as described above.
- Notes: the manifest says the native role for type multiple, an unused token
  was dropped, and the demo values were simplified.

Fixed (SegmentedControl review):

- Blocker: in controlled use, the ResizeObserver re-observe cancelled the slide.
  Now it skips an unchanged frame. A test with a reporting ResizeObserver fails
  without the fix.
- Blocker: Shift+Tab could not leave a disabled control. Handled in
  `inertItems.ts`, which also fixes ToggleGroup. Tested.
- Blocker: xs and sm rendered the same height. Fixed as described above.
- Blocker: selected was told by a weak fill and color. The thumb ring was added.
- Blocker: the thumb was placed wrong inside scaled parents. The measurement
  now divides by the scale.
- Notes: the track hairline softens when disabled, the thumb dims under a
  disabled selected item, the hook is called unconditionally, and the reduced
  motion guard comment is clearer.

Left open (notes):

- With no `value` or `defaultValue`, nothing is selected until the first focus.
  This is documented under `mistakes`. A dev warning could be added later.
- The too-many case truncates five labels in a narrow column. This is a stress
  case, and the manifest says five options need room.
- `tab-indicator` scales the thumb, so a pill's corners squash a little while
  it slides between items of very different widths. This belongs to the
  pattern; flag it to the motion owner if it reads wrong.
- The ToggleGroup demo uses white Saudi dialect forms ("اللي"), as the brief
  asks. The reviewer suggested MSA; I kept the brief's rule.

## Token gaps

- No component tokens for SegmentedControl (track fill, thumb fill, thumb ring).
  It reads semantic tokens through private properties. If a style needs another
  thumb, add `segmented-control.*` tokens and point the private properties at them.
- There is no inset focus ring token. `ToggleGroup.css` now copies the inset ring
  from `ButtonGroup.css` (built from `color.focus.*`). A `focus.shadow.ring-inset`
  token, and its solid fill version, would remove both copies.

## Changes needed from the lead

1. `packages/react/src/components/ToggleButton/ToggleButton.tsx`: make `label`
   required when `icon` is set (a discriminated union), as rule 7 says.
   ToggleGroupItem and SegmentedControlItem copy the same props and have the
   same gap. I left them matching ToggleButton, so all three can change together.
2. `docs/plan/wave-1.md`: the Arabic cookbook path
   (`/home/user/gobanana/docs/arabic-copy-cookbook.md`) does not exist when
   GoBanana is not cloned. Lanes cannot check copy against it.
3. Optional, `packages/react/src/components/Button/ButtonBase.tsx` near line 160:
   `ButtonRoot` drops `onKeyDown` while inert. Composite widgets (ToggleGroup,
   SegmentedControl, and later Toolbar, Tabs, RadioGroup) need roving keys on a
   focusable disabled item. Passing navigation keys (arrows, Home, End, Tab)
   through while inert would let `inertItems.ts` go away. Today it works without
   this change.

## Could not do

- GoBanana sources (private, not added). The design used FK2 `SegmentedControl`,
  `RangeTabs` and `FilterBar`, and the existing Button family.
- Angular and native: `planned` in both manifests, as the order asks.
