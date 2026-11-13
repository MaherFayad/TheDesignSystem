# Review: interaction round 2

Fresh eyes review by ds-qa of order 1.22, the 96 interactions of the round 2
registry in `packages/motion/src/interactions/`. Branch
`claude/ds-review-interactions-2`, cut from `claude/relaxed-hypatia-7gseap`.
No component source, CSS, token, manifest or test was edited.

Four reviewers split the work, each as claude-opus-5-5 at medium. Three
measured the interactions in Chromium, two families each. One ran the
contract suite, axe, target sizes and the Angular gallery, and rechecked the
six round 1 blockers. The lead read the code behind every blocker before it
went into this file, and answered one question from the lead session
(switch-stretch, finding B5).

Evidence is under `docs/reports/reviews/shots/interactions-2/`:

- `<id>.sheet.png`: a contact sheet per interaction. Rows are Studio, Desk
  and Neutral. Columns are frames after the trigger.
- `<id>.measure.json`: every run of that interaction.
- `probe.cjs`: the shared sampler. `BRIEF.txt`: the shared brief.
- Files that start with `qa-actions-inputs.`, `qa-selection-overlays.` and
  `qa-navigation-feedback.` belong to the three measuring reviewers.
- Files that start with `contract.`, `axe.`, `target.`, `angular.` and
  `recheck.` belong to the regression reviewer.
- `lead-switch-stretch.frames.png` and `.json`: the switch frames for B5.

The builder's report `docs/reports/interactions-2.md` was read only for its
list of ids until these findings were formed.

## How it was measured

- React gallery, stage only mode:
  `/interactions?focus=<id>&style=<studio|desk|neutral>&scheme=<dark|light>&chrome=0`,
  and the same with `&dir=rtl&lang=ar`. Studio and Desk ran dark, Neutral
  light, with one light run per style where color mattered.
- Every interaction ran in three motion modes:
  - full;
  - media, which is `prefers-reduced-motion: reduce` emulated;
  - attr, which is `data-motion="reduce"` on `<html>`, the gallery's switch.
- `document.getAnimations()` was sampled on every frame. Each sample kept the
  timing (`getComputedTiming()`), the keyframes, the properties and the first
  and last frame seen. The trigger's state attributes and the focused
  element's ring were sampled on the same frames.
- Rapid triggers ran 30ms apart. Interrupted triggers reversed the action
  before the motion ended.
- The `off` rows of the registry were injected under `@layer ds.recipes`.
- Contact sheets pause every animation and seek it to each time.
- The machine has 4 cores and was shared by four reviewers, at a load of 18
  to 50. The durations below are the values the animations carry, and they
  matched the motion tokens in every run. Wall clock times are used only for
  the order of events.

`npm run check` is green on this branch, 13 of 13 steps.

## Verdicts

| Area | Verdict |
| --- | --- |
| Rules of order 1.22 | fix needed: the reduced motion form fails under the person's own setting (B1 to B4), an input is lost (B6), and one interaction reads as a glitch (B5) |
| Richness | most interactions are richer; Desk carries most of it, Studio is flat by subtraction, Neutral and Desk often share one shape |
| Regressions | see part 3 |
| Round 1 blockers | see part 4 |
| Acceptance evidence of 1.22 | fix needed (B7): most of the required recordings are missing |

PART_TABLES

PART_FINDINGS
