# Wave 1, batch 1: actions (11, plus DropdownMenu)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`, unless it says otherwise.
Starts when batch 0 is green and 1.11 is merged.

Every order also reads: `packages/react/src/components/Button/` (Button.tsx,
ButtonBase.tsx), `packages/css/src/components/Button.css`,
`packages/css/src/components/IconButton.css`, GB css lines 92 to 308
(`.st-btn`).

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 1 | 1A Button base | ToggleButton, CloseButton, CopyButton, FloatingActionButton | batch 0 green |
| 1 | 1B Groups | Link, ButtonGroup | batch 0 green |
| 1 | 1C Menu | DropdownMenu (1.6.8) | batch 0 green |
| 2 | 1D Toggle groups | ToggleGroup, SegmentedControl | ToggleButton green and lane 1B done |
| 2 | 1E Split | SplitButton | ButtonGroup and DropdownMenu green |

Lane 1A alone may add blocks to `Button.css` (rule 10 of `anatomy.md`).
Slot 4 holds 1.10 Neutral during this batch, so at most three lanes run.

## 1.1.1 Button

Done in wave 0 (orders 0.9, 1.0.b, 1.0.f). Nothing in section 7 adds to it.

## 1.1.2 IconButton

Done in wave 0 (order 0.9). Nothing in section 7 adds to it.

## 1.1.3 ButtonGroup

- Goal: a row or column of related actions, either spaced or attached (one
  seam joined control, inner corners square, a 1px divider).
- Behavior: hand built. `role="group"` with `aria-label` or
  `aria-labelledby`. No roving focus (each Button stays in the tab order).
- Anatomy: root (`data-ds="button-group"`); children are Buttons and
  IconButtons, no own parts. `data-orientation`, `data-attached`.
- Axes: size, emphasis, shape passed to the children through context (a child
  prop wins). Tone stays per child.
- States: `data-orientation`, `data-attached`, `data-full-width`.
- Keys: Tab moves between children. Nothing else.
- Read: FK2 `SplitButton/SplitButton.module.css` (seam join), GB css lines
  92 to 160.
- Owns: standard set for ButtonGroup.
- Depends: none. Lane 1B after Link.
- Accept: checklist; attached corners use logical radius properties and flip
  in RTL; manifest `slots.root.accepts` `["Button", "IconButton",
  "ToggleButton", "SplitButton"]`, `max` 5.

## 1.1.4 SplitButton

- Goal: a main action fused to a menu trigger of related actions.
- Behavior: Button plus DropdownMenu (1.6.8) in an attached ButtonGroup base.
- Anatomy: root (`data-ds="split-button"`), `action` (a Button root carrying
  `data-part="action"`), `trigger` (an IconButton root carrying
  `data-part="trigger"`, chevron-down icon), the menu is a DropdownMenu root.
- Axes: size, tone, emphasis, shape (both halves share them).
- States: `data-state` of the trigger (`open`, `closed`), `data-disabled`,
  `data-loading` (on the action only).
- Keys: Tab reaches the action, then the trigger. Enter and Space run the
  action. On the trigger: Enter, Space, ArrowDown open the menu with focus on
  the first item; ArrowUp opens with focus on the last; Escape closes and
  returns focus to the trigger.
- Read: FK2 `SplitButton/` (all files), GB css lines 402 to 528 (menu).
- Owns: standard set for SplitButton.
- Depends: 1.1.3, 1.6.8. Lane 1E, step 2.
- Accept: checklist; the trigger's accessible name names the menu ("More
  publish options"), never only "More"; manifest `slots.menu.accepts`
  `["DropdownMenuItem"]`, `max` 7.

## 1.1.5 ToggleButton

- Goal: a Button that stays pressed or not (bold, mute, grid view).
- Behavior: Radix Toggle on ButtonBase.
- Anatomy: root (`data-ds="toggle-button"`), `start`, `label`, `end`, as
  Button. Icon only form through `label` as the name and `icon`.
- Axes: size, tone, emphasis, shape.
- States: `data-state` (`on`, `off`), `data-disabled`.
- Keys: Space and Enter toggle.
- Read: GB css lines 242 to 258 (selected toggle: fill plus an inner bar and
  weight, not color alone), GB site/`PricingToggle.tsx`.
- Owns: standard set for ToggleButton, plus a `toggle-button` block in
  `Button.css` (lane 1A only).
- Depends: 1.0.b.
- Accept: checklist; pressed is visible without color (inner bar or weight);
  `aria-pressed` reflects the state; forced colors shows the pressed state.

## 1.1.6 ToggleGroup

- Goal: a set of ToggleButtons where one or several can be on (text
  alignment, filter chips).
- Behavior: Radix ToggleGroup, `type` single or multiple.
- Anatomy: root (`data-ds="toggle-group"`), `item` (a ToggleButton root
  carrying `data-part="item"`).
- Axes: size, emphasis, shape (to items).
- States: `data-orientation`, `data-disabled`; items `data-state`.
- Keys: roving focus. ArrowRight and ArrowLeft (reading direction), ArrowDown
  and ArrowUp in vertical; Home and End; Space and Enter toggle.
- Read: FK2 `FilterBar/FilterBar.tsx` (chip group with aria-pressed), GB
  `GB admin/ui.tsx` (`PeriodSwitch`).
- Owns: standard set for ToggleGroup.
- Depends: 1.1.5 (items render ToggleButton). Lane 1D, step 2.
- Accept: checklist; `contract.keys` hints for the arrow keys as
  `focus-moves`; arrows reversed in RTL.

## 1.1.7 SegmentedControl

- Goal: one choice among two to five views or modes, always one selected.
- Behavior: Radix ToggleGroup `type="single"`, value never empty (ignore the
  deselect). Verify the roles Radix renders in the test (radio or pressed).
- Anatomy: root (`data-ds="segmented-control"`), `item`, `indicator` (the
  moving thumb, animated with `tab-indicator`).
- Axes: size, shape (default `pill` in Studio and Desk through tokens).
- States: items `data-state` (`on`, `off`), `data-disabled`.
- Keys: as ToggleGroup; selection follows focus.
- Read: FK2 `SegmentedControl/` (all files), FK2 `RangeTabs/`, GB
  site/`PricingToggle.tsx`.
- Owns: standard set for SegmentedControl.
- Depends: 1.1.6, same lane.
- Accept: checklist; the indicator moves with `transform` only and jumps
  under reduced motion; manifest `slots.root` `min` 2, `max` 5; `insteadUse`
  points to Tabs for panels and to RadioGroup in forms.

## 1.1.8 Link

- Goal: an inline text link, in a sentence or standing alone, with an
  optional external marker.
- Behavior: hand built `<a>`, `asChild` through Radix Slot for router links.
- Anatomy: root (`data-ds="link"`), `label`, `end` (the `external` icon,
  mirrored, with visually hidden "opens in a new tab").
- Axes: tone (`neutral`, `accent`), size (inherits font size by default).
- States: `data-disabled` (rendered without `href`, `aria-disabled`).
- Keys: Enter follows.
- Read: GB css `.st-alert a` (lines 1204 to 1208), GB site/`SiteNav.tsx`.
- Owns: standard set for Link.
- Depends: none.
- Accept: checklist; underline always visible in running text (not color
  alone, WCAG 1.4.1); the inline target exception is noted for links in a
  sentence.

## 1.1.9 CloseButton

- Goal: the one close control for dialogs, toasts, banners, chips, drawers.
- Behavior: hand built on ButtonBase (IconButton shape), icon `close`.
- Anatomy: root (`data-ds="close-button"`), `icon`.
- Axes: size, shape. Emphasis fixed `ghost`.
- States: `data-disabled`.
- Keys: Enter and Space.
- Read: `packages/react/src/components/Dialog/Dialog.tsx` (the close part),
  `Toast.tsx`, GB studio/`Dialog.tsx`.
- Owns: standard set for CloseButton, plus a `close-button` block in
  `Button.css` (lane 1A only).
- Depends: 1.1.5 (same lane).
- Accept: checklist; default label "Close" and the Arabic default under
  `lang="ar"`; report to the lead the change for Dialog, Toast and Window to
  render CloseButton (their owners apply it in 1.6.1 and later).

## 1.1.10 CopyButton

- Goal: copies a value to the clipboard and confirms it.
- Behavior: hand built on ButtonBase; `navigator.clipboard.writeText` inside
  the click handler, never at module scope.
- Anatomy: root (`data-ds="copy-button"`), `icon` (copy, then check),
  `label` (optional), `status` (visually hidden live region).
- Axes: size, emphasis, shape, tone.
- States: `data-state` (`idle`, `copied`, `failed`).
- Keys: Enter and Space.
- Read: GB `banana-server/app/(site)/[locale]/(pages)/(home)/install/CopyButton.tsx`,
  GB site/`CodeBlock.tsx`.
- Owns: standard set for CopyButton, plus a `copy-button` block in
  `Button.css` (lane 1A only).
- Depends: 1.1.9 (same lane).
- Accept: checklist; "Copied" announced once (WCAG 4.1.3); the check stays
  for a token duration and returns; a failure says "Could not copy" and
  keeps the value selectable.

## 1.1.11 FloatingActionButton

- Goal: the one main action of a screen, floating above content at the
  inline end and block end.
- Behavior: hand built on ButtonBase. Extended form with a label.
- Anatomy: root (`data-ds="floating-action-button"`), `icon`, `label`.
- Axes: size (`md`, `lg`), tone, shape (`default`, `pill`, `square`).
- States: `data-disabled`, `data-loading`, `data-extended`.
- Keys: Enter and Space.
- Read: no source: design from the dials table and the nearest existing
  component (IconButton). `elevation.card-hover`, `z` ladder.
- Owns: standard set for FloatingActionButton, plus a block in `Button.css`
  (lane 1A only).
- Depends: 1.1.10 (same lane).
- Accept: checklist; reserves scroll padding guidance in the manifest (WCAG
  2.4.11); 44px when `lg`; never on glass in Liquid (manifest `styles`).

## 1.6.8 DropdownMenu (built here, home batch 6)

- Goal: a menu of actions or options opened from a trigger.
- Behavior: Radix DropdownMenu.
- Anatomy: root (`data-ds="dropdown-menu"`, the content), parts `item`,
  `checkbox-item`, `radio-item`, `indicator`, `label`, `separator`, `group`,
  `shortcut`, `sub-trigger`, `sub-content`, `icon`. Sub components:
  `DropdownMenuTrigger`, `DropdownMenuItem` and so on.
- Axes: size (`sm`, `md`); item tone `danger` only.
- States: `data-state` (`open`, `closed`), items `data-highlighted`,
  `data-disabled`, `data-state` (`checked`, `unchecked`).
- Keys: ArrowDown and ArrowUp move; Home and End; typeahead; Enter and Space
  select; ArrowRight opens a sub menu (ArrowLeft in RTL); Escape closes and
  returns focus.
- Read: GB css lines 402 to 528 (`.st-menu`), GB desktop/`MenuBarMenu.tsx`,
  FK2 `ContextMenu/` (all files).
- Owns: standard set for DropdownMenu. ContextMenu and Menubar later add
  blocks to `DropdownMenu.css` (lane 6C).
- Depends: none. Lane 1C.
- Accept: checklist; motion `menu-scale` from the trigger side; item height
  `menu.item.height`; checked items carry a check icon, not color alone;
  manifest `slots.root.max` 12 with "group or split longer menus".
