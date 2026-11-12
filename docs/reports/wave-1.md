# Wave 1 report

Date: 2026-11-12, 20:40 UTC. Status: Gate 1 is not passed yet. One condition
fails by four tests, and three pieces of work are still open (see "Open
before the gate closes").

## Gate 1

Evidence comes from order 1.17 (`docs/reports/matrix-wave-1.md`), run on the
lead's branch at `6fabe3c`, and from `npm run check` on the lead's branch
after each merge.

| Condition | Result | Evidence |
| --- | --- | --- |
| Both web example apps use only system components | Pass | `ds doctor` on `examples/consumer-next` and `consumer-vite`: 0 findings. Order 1.18 report: `docs/reports/lanes/order-1-18.md` |
| `ds doctor` is clean on both | Pass | consumer-next 11 files, consumer-vite 12 files, 0 errors, 0 warnings |
| The 55 Angular components pass the contract suite | Pass at `6fabe3c` | 59 ready. 1833 tests: 1779 pass, 0 fail, 54 skipped. Compare with React: 984 pairs, 0 over the limit, 73 pairs differ below it in 5 components |
| 105 React components | Fail by 4 tests | 111 manifests ready and valid. 3568 tests: 3421 pass, 4 fail, 143 skipped. The 4 are List axe in Desk: the suite runs axe while the first paint stagger still holds rows at low opacity |
| Neutral style | Pass, proposed | `ds style check neutral`: contract 698, contrast 602, icons 94, fonts 2 |
| Docs site, registry, CLI, checker | Pass on each order's own proof | `docs/reports/lanes/order-1-13.md`, `order-1-15.md`. The docs build and link check run inside `npm run check` |
| `npm run check` | Pass | 13 steps, 2169 tests, on the lead's branch after the last merge |

Other measurements from the same run:

- Target size (WCAG 2.5.8): React 1038 of 1038, Angular 543 of 543, in every
  style and density, overlays open.
- axe sweep (WCAG 2.2 AA): 1656 runs on 111 pages, English and Arabic,
  overlays closed and open, 0 violations.
- Screenshot matrix: React 1782 shots, 17 differ by one channel value across
  two runs (ScrollArea, Tabs). Angular 984 shots, all byte equal.
- Size, gzip: `@the-system/react` 99.5 KB, `@the-system/angular` 94.9 KB,
  `@the-system/css` 57.8 KB. Full tables: `docs/reports/size-wave-1.md`.

## Open before the gate closes

1. **List axe in Desk.** Either the suite waits for the stagger, or the
   stagger never lowers text below its contrast. The second is the safer
   fix: a person can also read a row mid stagger. Handed to order 1.22.
2. **Interaction round 2 (order 1.22).** Running. It rewrites motion in
   every React component, so the React contract suite, the matrix and the
   Angular compare must run again after it merges.
3. **Angular fix round 2.** Merged after the matrix ran. Its 20 blockers are
   reported fixed and have not been rechecked by a fresh reviewer.
4. **Stale images.** The matrix order deleted Angular shots that a later
   merge had changed; the merge kept the older files for ten components. A
   full `npm run shots` for both frameworks replaces them.

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
