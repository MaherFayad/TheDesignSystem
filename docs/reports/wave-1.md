# Wave 1 report

Date: 2026-11-13, 19:45 UTC. Status: **Gate 1 is not passed. Work is paused
by the owner.** Six of seven conditions pass. The React condition passes in
the default style and fails in Liquid by four tests, with the same fault in
Desk.

## Gate 1

Evidence: the second run of order 1.17, `docs/reports/matrix-wave-1.md` and
`docs/reports/lanes/order-1-17b.md`, on the lead's branch after the fix
round 1.29 and the `:dir()` build fix.

| Condition | Result | Evidence |
| --- | --- | --- |
| Both web example apps use only system components | Pass | `ds doctor` on both: 0 findings |
| `ds doctor` is clean on both | Pass | 0 errors, 0 warnings |
| The 55 Angular components pass the contract suite | Pass | 59 ready. 2278 pass, 0 fail. Compare with React: 1312 pairs, 0 over the limit |
| 105 React components | Pass in the default style, fail in Liquid by 4 tests | 111 manifests. 4412 pass, 0 fail. iOS and Android controls 0 fail. Slider and RangeSlider overflow at 320px in Liquid (8px) and in Desk (10px, measured by hand) |
| Neutral style | Pass, proposed | `ds style check neutral` and `liquid` both pass |
| Docs site, registry, CLI, checker | Pass on each order's own proof | The docs build and link check run inside `npm run check` |
| `npm run check` | Pass | 13 steps, 2580 tests, alone on the machine. Two gate tests and one Angular spec time out when a contract suite shares the 4 cores |

Other measurements from the same run:

- axe sweep (WCAG 2.2 AA): React 2240 runs, 2 fail, one finding: the Desk
  danger AlertDialog title on `/platforms`, 4.42:1 (WCAG 1.4.3). Angular 1136
  runs, 0 fail.
- Target size (WCAG 2.5.8): 0 fail at 24px in every style and density.
- Reduced motion: 0 interactions still move.
- Switch contrast on every frame: 0 of 144 runs under 3:1, lowest 3.23.
- `tab-slide` long task at 4x CPU: median 184ms in Neutral, 211ms in Liquid.
  Down from 821 to 1030ms, still over the 50ms target.
- Production CSS keeps all 109 `:dir(rtl)`; 1141 Arabic RTL tests pass on
  the fixed build.
- Screenshot matrix: 6 visible shots not byte stable across two captures
  (ScrollArea, Menubar).

## Open when work paused

1. **Slider and RangeSlider overflow at 320px in Liquid and Desk.** The fill
   `::before` reaches 36px past the track (`Slider.css:205`). This is the
   one thing between the tree and gate 1.
2. **Desk danger AlertDialog title contrast**, 4.42:1 against 4.5:1.
3. **`tab-slide`** is still a long task on a slow phone. ToggleGroup calls
   `followIndicator` directly; move it onto `inFrame`.
4. **The suite runs reflow only in the default style**, which is why the
   Desk overflow was found by hand. Run reflow in every style.
5. **Not reviewed:** the fix round 1.29, the Angular sync for round 3, the
   hook wiring 1.28, the docs restyle 1.30.
6. **Angular** has no Sheet or Drawer, so detents and swipe to dismiss are
   React only.
7. Order 1.31 (fix round 2 of 3 for round 3) is not started. Wave 2 is not
   started.

## What was built

- **React:** 111 components with a manifest, tests, a demo with the content
  cases, and CSS on tokens. Every batch had a fresh review. 55 first review
  blockers were rechecked: 52 fixed in round one, the rest in round two.
- **Angular:** 59 components on the same CSS with no CSS change, each with
  `ControlValueAccessor` where it is a form control.
- **Neutral:** the third style, proposed.
- **Motion:** a catalog of patterns, 24 interactions from round 1 (proposed),
  round 2 in progress.
- **Tooling:** `ds doctor`, the shadcn compatible registry, the `ds` CLI,
  `ds init` with agent files and two skills, the docs site in English and
  Arabic with one page per manifest, `llms.txt`.
- **Consumers and guides:** both example apps on wave 1 components;
  adoption guides for GoBanana and Figma-Killer-2 in `docs/adoption/`.

## What changed in the contracts

Written into `docs/contracts/` and `DECISIONS.md`:

- Names for private `--_component-*` properties: a base list, part names,
  tone groups, layout and motion plumbing.
- Layout data attributes used by Stack, Grid, Bento and Container.
- A manifest state may carry values (`data-level=low|ok|high`).
- The contract suite: `opens` for overlays, key hints that open a trigger
  first, a `physical` flag for arrow keys that do not mirror.
- A manifest `motion` value must be a catalog id or `none`.
- React Aria Components 1.22.1 is installed for NumberField and ScrubInput.
- The gallery opens in Neutral.

## What the wave taught

- **A green check is not proof of a clean tree.** `npm run check` passed
  once with merge conflict markers in a CSS file. A gate for that is a
  follow up.
- **The contract suite misses behavior.** Two kinds of Angular blocker (a
  form that never submits its summary, a Select that marks itself touched on
  open) passed a green contract run. The suite needs a submit case and an
  empty Select case.
- **Ports go stale.** Angular was ported from React before React's fix
  rounds. The Form port alone caused eight blockers. A port should start
  after the React review, not before.
- **Parallel sessions collide in shared files.** Two sessions edited the
  Sheet block of `Dialog.css` in the same hour. One owner per CSS file per
  round is the rule that would have prevented it.

## Follow ups

`docs/plan/wave-1-followups.md` holds four rounds of requests. Open at this
point: the conflict marker gate, the CLI snapshot that follows the Angular
file list, an Angular motion order, `labelOf` reading `aria-labelledby` in
one shared place, the two contract suite cases, pause controls for loops
inside components (WCAG 2.2.2), and the Button spinner part, which must land
in React and Angular together.

## Waiting on the owner

1. **Neutral approval.** `docs/reports/neutral.md`: the brand blue, a 36px
   default control height, an 8px control radius, the gray soft button.
2. **Desk Light approval.** `docs/reports/desk-light.md`.
3. **Desk dark glass over bright content.** Change the values or confirm
   bright content never sits behind Desk glass.
4. **Interactions.** Round 1 is proposed; round 2 follows. One ruling is
   needed: whether motion may use more than `transform` and `opacity`.
5. **Real adoption** in GoBanana and Figma-Killer-2, with the guides in
   `docs/adoption/`. No write to either repo has been made.
6. **iPhone check.** `docs/reports/ios-check.md`.
7. **Arabic docs register.** Gulf modern standard Arabic is in use for docs
   prose and white Saudi dialect for demos, unless told otherwise.
