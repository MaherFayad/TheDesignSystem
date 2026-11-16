# Reset M4: press from touch down in React

On touch `:active` can wait for the finger to lift, so a press drawn on
`:active` alone comes late on a phone. The pressed element now carries
`data-pressed` from `pointerdown` to `pointerup`, `pointercancel`,
`lostpointercapture` or pointer leave, the same flag the Switch sets (order
M1). The platform CSS already reads `:is(:active, [data-pressed])`.

## How

One shared helper, `packages/react/src/internal/pressed.ts`:
`pressHandlers(own, disabled)` wraps the caller's five pointer handlers, runs
them first, then sets or clears the flag on `event.currentTarget`. The flag
name is `PRESSED_ATTR` from `@the-system/motion`. The motion helper
`markPressed` was not reused as is: it marks the parent of the switch control,
not the element itself. No React state, so a press costs no render.

- Only `button === 0` and `isPrimary` pointers press.
- Never set while disabled. A release clears it whatever the state, so a
  control that turns loading after the click lets go.
- Keyboard presses do not touch it; `:active` covers them.

Where it is wired:

| Component | Where | Never set when |
| --- | --- | --- |
| Button, IconButton, CloseButton, ToggleButton, CopyButton, FloatingActionButton, Chip (pressable), Pagination pages and ends | `ButtonRoot` in `Button/ButtonBase.tsx` | disabled, loading, `aria-disabled` |
| TabBar item | `TabBar/TabBar.tsx`, beside `pressOrigin` | `aria-disabled` (the item has no disabled prop) |
| List linked row (the `li`) | `List/List.tsx` | the row has no link, or is disabled |

Chip and Pagination need no code of their own: both render through
`ButtonRoot`. A removable Chip is a span with a CloseButton, which presses
through `ButtonRoot`.

`data-pressed` was added to `states` in the manifests of Button, IconButton,
CloseButton, ToggleButton, CopyButton, FloatingActionButton, Chip, TabBar,
List and Pagination, and `npm run gen` was run.

## Proof

- Tests: `Button/Button.pressed.test.tsx` (Button, asChild, IconButton,
  CloseButton, non primary pointers, keys, caller handlers),
  `Chip/Chip.pressed.test.tsx`, `TabBar/TabBar.pressed.test.tsx`,
  `List/List.pressed.test.tsx`, `Pagination/Pagination.pressed.test.tsx`.
- Held press in the React gallery, `style=neutral&platform=android`,
  Chromium with `hasTouch`, a CDP touch held 300ms. While the finger was
  down, `:active` was false and `data-pressed` was on, and the ripple layer
  was at opacity 0.1 with the circle open (0 at rest):
  `button-neutral-android-held.png` and
  `tab-bar-item-neutral-android-held.png` in `docs/reports/reset/M4/`.

## CSS requests (not edited)

On android the press shows. These selectors read `:active` alone, so in
those places the press still waits for the release on touch. Each needs
`[data-pressed]` beside `:active`:

- `packages/css/src/components/Button.css` lines 729, 746, 751 (the press
  scale, its parts and its layer) and 998 (reduced motion).
- `packages/css/src/components/Chip.css` line 246.
- `packages/css/src/components/CloseButton.css` lines 80, 84, 88, 117, 133.
- `packages/css/src/platform/ios.css` line 135 (button family) and 425
  (linked List row).
- `packages/styles/neutral/recipes/Button.css` line 75,
  `packages/styles/studio/recipes/Button.css` line 73,
  `packages/styles/desk/recipes/Button.css` line 200.
