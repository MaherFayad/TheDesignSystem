# Lane 1E report: Split (SplitButton)

Status: done. SplitButton built, reviewed once, review findings fixed, green.

Branch `claude/ds-lane-1e`.

| Order | Component | Commits | Check | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.1.4 | SplitButton | `wo-1.1.4: SplitButton`, `wo-1.1.4: SplitButton review fixes` | green | 29 passed, 15 skipped (the open-overlay checks, see below) |

Screenshots: `docs/reports/shots/wave-1/split-button/` in studio dark, studio
light, desk dark, desk light, desk dark rtl ar, neutral dark and neutral
light, plus the open menu (`studio-light-open.png`, `desk-dark-rtl-open.png`,
opened with ArrowUp so focus sits on the last item).

Sources: Figma-Killer-2 `SplitButton/` was cloned and read. GoBanana was not
added to this session; the menu look comes from DropdownMenu, which already
follows GB `.st-menu`.

Generated files (`packages/react/src/index.ts`, `packages/css/src/index.css`,
`packages/manifest/manifests.gen.json`, `apps/gallery-react/src/routes.gen.ts`)
are committed as `npm run gen` wrote them. Regenerate on merge.

## 1.1.4 SplitButton

Files:

- `packages/react/src/components/SplitButton/` (`SplitButton.tsx`,
  `SplitButton.test.tsx`, `SplitButton.demo.tsx`, `index.ts`)
- `packages/css/src/components/SplitButton.css`
- `packages/manifest/src/component/SplitButton.manifest.json`
- `docs/reports/shots/wave-1/split-button/*.png`

No Button, IconButton, ButtonGroup or DropdownMenu file was edited. No
recipe file: tokens and Button's private properties cover every style.

```ts
type SplitButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type SplitButtonTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
type SplitButtonEmphasis = 'solid' | 'soft' | 'outline' | 'ghost'; // no link
type SplitButtonShape = 'default' | 'pill' | 'square';

interface SplitButtonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onClick' | 'children' | 'role'> {
  label: ReactNode;                 // visible text of the action, required
  menuLabel: string;                // trigger aria-label, names the menu, required
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void; // the main action
  children: ReactNode;              // 1 to 7 DropdownMenuItems
  start?: IconName | ReactElement;  // leading content of the action
  size?: SplitButtonSize;           // default md, or the ButtonGroup's
  tone?: SplitButtonTone;           // default neutral
  emphasis?: SplitButtonEmphasis;   // default soft, or the ButtonGroup's
  shape?: SplitButtonShape;         // default default, or the ButtonGroup's
  loading?: boolean;                // action only; the menu stays usable
  loadingLabel?: string;            // default 'Loading'
  disabled?: boolean;               // both halves, aria-disabled, focusable
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  ref?: Ref<HTMLDivElement>;        // the root
  actionRef?: Ref<HTMLButtonElement>;
}
```

DOM:

```
div[data-ds=split-button][data-size][data-tone][data-emphasis][data-shape][data-disabled?]
  button[data-ds=button][data-part=action][data-loading?]
  button[data-ds=icon-button][data-part=trigger][aria-haspopup=menu][aria-expanded][data-state=open|closed]
body > div[data-ds=theme][data-menu-layer] > ... > div[data-ds=dropdown-menu][data-part=menu][role=menu]
```

### Decisions

1. **Children are the menu.** `label` is the action's text (convention rule
   7), `children` are the DropdownMenuItems, which matches the order's
   `slots.menu.accepts ["DropdownMenuItem"]`, max 7. Props spread onto the
   root, except `onClick`, which runs the action (the root is not clickable).
2. **No role on the root.** A group role named by the action would announce
   the action's name twice. The two halves are the tab stops.
3. **The seam is drawn in SplitButton.css**, not through a nested
   ButtonGroup element. A nested group would own the `action` and `trigger`
   parts (nearest root rule) and add a group announcement. The rules match
   ButtonGroup.css: the action's end border is the divider, the trigger drops
   its start border, and the inner corners are squared through Button's
   `--_button-radius-*` corner properties. All logical, so they flip in RTL.
   The border sides are written directly because Button has no property for
   one border side. ButtonGroup.css does the same.
4. **Divider color per fill.** `color.border.default` on soft and ghost, the
   outline border on outline, and on solid the action's text color at 35
   percent (`color-mix` over a token, as Alert.css and Banner.css already
   do), so the seam reads on yellow, green, red and the neutral fill alike.
   This redeclares `--_split-button-divider` on the action. That is a
   deliberate exception to convention rule 1: Button's colors exist only on
   the action. The CSS header says so.
5. **Open state.** The open trigger turns its chevron to point up (a
   transform, `duration.quick`, instant under reduced motion) and takes its
   pressed fill. The chevron is needed because some fills (neutral solid,
   Studio's primary) have no separate pressed color. Under forced colors the
   open trigger takes `Highlight`, as an on ToggleButton does.
6. **Focus ring inside each half** (the inset ring ButtonGroup uses), so the
   trigger never covers the action's ring. Forced colors pull the outline
   inside too.
7. **Menu size follows the control**: sm rows for xs and sm, md rows for md
   and lg. The menu aligns to the control's inline end (FK2), side block-end.
8. **Inside an attached ButtonGroup** (the ButtonGroup manifest accepts
   SplitButton): SplitButton.css squares the corners that meet a neighbor and
   draws the group's `--_button-group-divider` toward the next one. Horizontal
   groups only, stated in the manifest notes. Unset size, emphasis and shape
   come from the group, through props or `useButtonGroup()`.
9. **`menu` is an anatomy part.** The order asks for `slots.menu`, and the
   validator needs every slot in the anatomy. The DropdownMenu root carries
   `data-part="menu"` (a nested root with the parent's part name, as
   DropdownMenu's `sub-content`). Because it is portaled under `body`, the
   suite cannot own it to the split-button root, so it is in
   `contract.optionalParts`.
10. **Escape is not in `a11y.keys`.** The manifest's states list `open` and
    `closed` (the trigger's `data-state`, which the suite scans), so a
    generic Escape check would expect the trigger to open a new
    `split-button` root, and it opens a `dropdown-menu`. Escape is written in
    `a11y.focus` and the notes, tested in the unit tests, and checked by the
    suite on DropdownMenu. Enter, Space, ArrowDown and ArrowUp have
    `contract.keys` hints (click on the action, focus moves from the
    trigger).
11. **Motion**: `menu-scale` (the menu). The halves keep Button's press.

### Checks

- Unit tests: 18 covering the axes, ButtonGroup inheritance, the trigger
  name and menu button attributes, the tab order, Enter, Space, ArrowDown,
  ArrowUp, Escape, item select, controlled open (stays open and reports
  `false` on Escape), `defaultOpen`, `start`, loading (action only, the
  trigger not busy) and disabled (neither half acts or opens).
- `npm run check` green. The contract command was green both times it ran.
- The suite's 15 skips are the checks it runs only with an overlay open
  (target size open, axe open), because SplitButton is not an overlay root.
  I ran them by hand. axe (wcag2a, 2aa, 21aa, 22aa) with the menu open:
  no violations in studio, desk and neutral, dark and light, LTR en and RTL
  ar. Menu rows were at least 28px (32px in Neutral).

### Review findings

One fresh eyes review (ds-qa). Fixed:

- Blocker: the open trigger showed no change on neutral solid and Studio's
  primary. Fixed with the chevron turn (decision 5).
- Blocker: no open cue under forced colors. Fixed with `Highlight`.
- Note: the trigger's seam in an attached group used the SplitButton divider.
  It now uses the group's divider, and the outline border on outline.
- Note: vertical attached groups. Stated as unsupported in the manifest and
  the CSS.
- Note: the `many` demo menu held items that are not variants of Publish
  (Unpublish page, Export as PDF). It now holds seven publish variants.
- Note: `border.width.default` was listed but not read. Removed;
  `duration.quick` and `ease.default` added.
- Notes: test gaps (controlled open, `defaultOpen`, `start`, trigger not
  busy, disabled checked after a wait). Added.
- Note: the private property declared on a child. Documented as the
  exception in decision 4.

Left open: none.

### Token gaps

None blocking. A `color.border.on-solid` token (a seam on a solid fill) would
replace the `color-mix` in decision 4.

## Changes needed from the lead

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

## Not done

- Nothing in the order is left. GoBanana was not read (not in the session).
