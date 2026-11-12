# Fix round 5: feedback batch

Branch `claude/ds-fix-5`, from `claude/relaxed-hypatia-7gseap`. Source of the
findings: `docs/reports/reviews/batch-5.md`. One commit per component,
`fix-5: <Component>`, each pushed.

Every component below: unit tests added that fail on the old code (checked
by stashing the fix and running them), `npm run check` green,
`npm run contract -- --framework react --component <Name>` green, and the
five standard screenshots retaken in `docs/reports/shots/wave-1/<slug>/`.

## Blockers

| Component | Blocker | Result | How |
| --- | --- | --- | --- |
| ProgressBar | Success fill 2.79:1 on the track in Neutral dark (WCAG 1.4.11) | fixed | Tone fills use `state.*.border` (3.05:1 or more on the track in all six pairs) |
| ProgressBar | Reduced motion indeterminate was a full faded bar, reads as done | fixed | A still 40 percent segment in the middle of the track (30 to 70 percent), full tone color. No value can take that shape |
| ProgressCircle | Reduced motion indeterminate was a still quarter arc, reads as 25 percent | fixed | A dashed full ring in the full tone color, mask removed |
| Meter | Demo grid scrolls the 320px page sideways (WCAG 1.4.10) | fixed | `DemoGrid min="min(20rem, 100%)"`; contract reflow checks pass |
| Meter | Success fill 2.79:1 in Neutral dark (WCAG 1.4.11) | fixed | Tone fills use `state.*.border` |
| Skeleton | Shimmer loops forever (WCAG 2.2.2) | fixed | `linear 3`, the pattern's `SHIMMER_ITERATIONS` and easing (4.2s) |
| Skeleton | Nothing announces loading | fixed, demo and manifest | Every demo case keeps a visually hidden `role="status"` line next to (outside) its busy region: "Loading members", "جار تحميل الأعضاء". The manifest `a11y.announce` spells out the pattern. No new component; see the lead list |
| ErrorState | `aria-atomic="false"` documented, never set | fixed | `aria-atomic={live ? false : undefined}` |
| ErrorState | `live` default true shouts on load | fixed | Default false, as Alert. Non live root is now `role="group"` named by its title (it had `aria-labelledby` on a role less div) |
| ErrorState | Default words ignore the Theme language | fixed | `labelsFor(lang ?? theme.lang)`; `lang` and `dir` still come from the prop only |
| NotificationCenter | Mark all read drops focus to the body (WCAG 2.4.3) | fixed | Focus moves to the panel title (`tabIndex={-1}`) before `onMarkAllRead`. Checked in Chromium: active element is the `h2` title |
| NotificationCenter | Words and times ignore the Theme language | fixed | `notificationLanguage(lang ?? theme.lang)`; `lang` and `dir` from the prop only |
| NotificationCenter | Demo grid scrolls the 320px page sideways | fixed | Same clamp as Meter |

13 of 13 blockers fixed.

## Notes

Fixed:

- ProgressBar warning demo label is a task, not a measure: "Upload slowing
  down", "بطء الرفع".
- ProgressBar warns in development when it has no name.
- ProgressCircle tone rings use `state.*.border` too (convention item 4).
- ProgressCircle demo no longer shows the value inside a small ring; the
  manifest says `showValue` at xs and sm spills, and gives the `valueText`
  length limit (about five characters at md, seven at lg, no wrap).
- Skeleton shimmer easing is `linear`, as the pattern; `ease.default`
  dropped from the manifest tokens.
- ErrorState `body` renders in a `div`, so a list or a second paragraph is
  valid HTML.
- NotificationCenter focus ring: the private `--_notification-center-ring`
  is now one inset layer, `inset 0 0 0 border.width.strong color.focus.ring`.
  Neutral's two layer `focus.shadow.ring` drew its 4px layer outside the
  item. Checked in Neutral light: the ring sits fully inside the item.

Already done on the base branch (no change needed): Meter manifest `states`,
`levelLabels` type and `motion`; NotificationCenter manifest `motion`.

Left open (not a few lines, or outside my files):

- ProgressBar `format.ts` swap to `packages/shared/src/number.ts`.
- ProgressBar and Skeleton browser tests of RTL origin and iteration count:
  the new tests read the CSS and the built tokens, not a live browser.
- ProgressCircle track at `overlay-20`: not done. On `overlay-20` the
  `state.*.border` fills drop to 2.2 to 2.9:1 in Studio light, Desk light
  and Neutral light, so it would trade a cosmetic gain for a 1.4.11 failure.
- Skeleton fill at `overlay-20` in light schemes: decorative, left as is.
- ErrorState `--ds-dialog-width-md` as the line length: waits on a measure
  token.
- NotificationCenter ad hoc hooks (`data-entry`, `data-list`,
  `data-unread-word`, `data-empty-title`, `data-empty-body`): turning them
  into parts touches the anatomy, the CSS and Angular parity. Needs a lead
  decision on convention item 8 first.
- NotificationCenter `notificationIcons` copy of `messageIcons`: waits on the
  shared tone table.

## Token requests

None required: every blocker is fixed with existing tokens.

- For the record: Neutral dark `color.state.success.solid` is 2.79:1 on
  `bg.overlay-10` over `bg.body` and 3.55:1 on `bg.body`. Any mark that still
  uses `state.*.solid` without text on it fails there. Request: either raise
  it to 3:1 on the overlay track, or adopt convention item 4 (marks use
  `state.*.border`) as a rule so no one needs it.
- Repeated from the review, not blocking: a measure token for text line
  length (ErrorState), `size.icon.xl` and a ring size token (ProgressCircle
  lg, Spinner lg).

## Changes needed from the lead

1. `packages/manifest/manifests.gen.json` is regenerated and left
   uncommitted in each component commit; it is committed with this report.
   Regenerate on merge.
2. `packages/react/src/demo/index.tsx`: clamp `DemoGrid` to
   `minmax(min(<min>, 100%), 1fr)` so no demo can fail reflow by its grid
   (review item 10). Meter and NotificationCenter are fixed in their demos
   meanwhile.
3. Move `packages/react/src/components/ProgressBar/fillContrast.test-util.ts`
   to a shared test helper (for example `packages/react/src/test/`).
   ProgressCircle and Meter import it from the ProgressBar folder for now.
4. `docs/contracts/anatomy.md`: write down the rules this round applied, so
   the next components follow them:
   - A component that can be present at load has no live role by default;
     `live` opts in; a live root with interactive children sets
     `aria-atomic="false"`.
   - Built in words follow `lang ?? theme.lang`; `lang` and `dir` are set
     only from the prop.
   - A control that removes itself moves focus first.
   - A mark with no text on it uses `state.*.border` or `primary.border`.
   - An indeterminate indicator under reduced motion takes a shape no value
     can take, in the full tone color.
5. Toast has the same Theme language gap as ErrorState and
   NotificationCenter had (review item 2). Not in my files.
6. A `[data-visually-hidden]` rule in `packages/css/src/base.css`. The
   Skeleton demo uses an inline style for its status line until then.
7. Consider a `SkeletonGroup` (or a `label` on a busy wrapper) that renders
   the busy container and its status line, so consumers do not copy the
   demo. It is a new component with its own `data-ds`, so it needs an order.
8. ErrorState manifest `a11y.native.accessibilityRole` still says `alert`;
   the native port should follow the new default (no live role). Native is
   planned, so I left the native block to its owner.
