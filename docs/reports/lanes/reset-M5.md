# Order M5, Angular parity: report

## Built

- Switch: the root carries `data-pressed` from a primary `pointerdown` on the
  control to `pointerup`, `pointercancel`, lost pointer capture, or a mouse
  leaving before a drag starts. Same calls and order as React's
  `Switch/drag.ts`, with `markPressed` from `@the-system/motion`. Never while
  disabled or read only. Files: `packages/angular/src/internal/toggles-switch-drag.ts`
  (new `pointerLeave`), `packages/angular/src/components/switch/switch.ts`
  (binds `pointerleave`).
- Button base: one shared helper, `packages/angular/src/internal/pressed.ts`
  (`trackPressed`), wired once in `DsButtonBase`. It covers every control on
  the base: Button, IconButton, CloseButton, ToggleButton, CopyButton,
  FloatingActionButton and the FilterBar stand in chip. Set on a primary
  `pointerdown` with the main button, cleared on `pointerup`, `pointercancel`,
  `lostpointercapture` and `pointerleave`. Never while disabled, loading or
  `aria-disabled`. Native listeners, no signal, no change detection per press.
- Tests: `packages/angular/src/internal/pressed.spec.ts` (each base control,
  each release event, primary pointer only, disabled and loading, keys, the
  switch root with each release event, disabled switch).

## Not done

- Chip, TabBar item, linked List row, Pagination pages and Sheet have no
  Angular port in this checkout (their manifests say `planned`). There is
  nothing to wire, and the sheet close button in the title bar cannot be
  built. The FilterBar stand in chip gets the press through the base, and the
  helper is ready for the ports: the Chip port on the base gets it for free,
  the others call `trackPressed(host, () => disabled)`.

## Proof

- `npm run check -w @the-system/angular`: 3 runs, 2 passed. Counting every
  full suite run after the final spec (10 runs): 6 passed, 3 failed only on
  the four switch drag tests, 1 failed only on the dropdown menu exit copy
  test. The switch drag file passes alone, and the new tests passed in every
  run.
- `npm run contract -- --framework angular --platform ios --component Switch`:
  43 passed. Same on android: 43 passed. Button on android: 43 passed.

## Why the switch drag tests flake

In a failing run every drag test sees no travel (no `data-dragging`, progress
0), so `beginSwitchDrag` returned null. The spec stubs
`Element.prototype.getBoundingClientRect`. Other specs (`list-box.motion.spec.ts`,
`toggle-button-motion.spec.ts`) spy on `HTMLElement.prototype.getBoundingClientRect`;
after restore an own property can stay on `HTMLElement.prototype` and shadow
the switch stub, so the track measures 0 wide. Whether it happens depends on
which files share a worker first. Not fixed here.
