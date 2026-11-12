# Interaction round 2, feedback family (order 1.22)

Family agent (f): feedback, progress, data display and layout. Every row is
**proposed** and waits for the owner. Timings below are Neutral, Desk,
Studio base values of the round 2 tokens (soft spring 220, 340, 100ms;
snappy 180, 300, 80ms; bouncy 220, 440, 120ms; stagger 24, 45, 0ms;
celebrate 220, 480, 120ms; morph 200, 320, 100ms). Studio's springs are
steps, so its parts land in hard cuts and together.

## 1. Interactions

Registry: `packages/motion/src/interactions/content.ts` (23 rows, all
`round: 2`). Stages: `apps/gallery-react/src/interactions/feedback.tsx`.

| Id | Components | Trigger | Beats and timing | Reduced | Files |
| --- | --- | --- | --- | --- | --- |
| `alert-entrance` (new, CSS) | Alert, Banner, Callout | mount | Surface fades and rises distance.enter (Alert also from scale.enter) on the soft spring; one stagger step later the icon pops from scale.morph on the bouncy spring; two steps later title, body, actions settle from distance.nudge. Callout only fades its box (no travel in a text column). Neutral 220ms, Desk 340ms with a 440ms bouncing icon and 45ms steps, Studio 100ms steps, all parts at once | none | Alert.css, Banner.css, Callout.css |
| `alert-dismiss` (new, WAAPI, flip) | Alert, Banner | close button | onClose runs at once; before the next paint a decorative ghost shrinks to scale.enter and fades over duration.quick (flipExit, about half the entrance) while neighbours slide up on the snappy spring (flipPlay) | fade of the ghost | Alert/ghost.ts, Alert.tsx, Banner.tsx |
| `state-illustration` (new, CSS) | EmptyState, ErrorState | mount | Icon falls from distance.lift and grows from scale.enter on the bouncy spring (lands with overshoot in Desk); title, body, actions (and details) follow one stagger step apart from distance.nudge on the soft spring | none | EmptyState.css, ErrorState.css |
| `error-state-details` (new, CSS) | ErrorState | open the details | chevron turns 180 degrees on the snappy spring, swinging past in Desk | none | ErrorState.css |
| `accordion-reveal` (reworked) | Accordion | open a section | layer slides from -100% and fades (duration.slow, ease.standard, no panel overshoot); chevron turns on the snappy spring; each element child of the content settles from distance.nudge one stagger step apart (capped at 6) | none | Accordion.css |
| `skeleton-swap` (reworked) | Skeleton | content replaces the skeleton | shimmer three loops then still (kept); on swap the skeleton leaves at once and a ghost fades out over duration.morph on top of the content: a cross fade | no band, swap at once | Skeleton.tsx, Alert/ghost.ts |
| `stat-roll` (reworked, digit-roll) | Stat | number changes | each changed digit rolls in its column on the snappy spring, last digit first one stagger step apart; trend mark nudges distance.nudge the way the number went one step later; at most one roll per 333ms | digit fade | Stat.tsx, Stat/useDigitRoll.ts, Stat.css |
| `toast-enter` (reworked) | Toast | show, close | travel and scale.enter on the bouncy spring; icon pops one step later; exit over duration.toast-exit, faster | none | Toast.css |
| `toast-stack` (reworked, flip) | Toast | stack changes | toasts that stay move with flipPlay on the snappy spring | none | Toaster.tsx |
| `toast-swipe` (reworked) | Toast | swipe let go | spring back on the snappy spring; past the threshold out over duration.toast-exit | instant | Toast.css |
| `notification-change` (new, flip) | NotificationCenter | items or unread change | new entries pop (flipPlay enter, bouncy, staggered), removed ones shrink as ghosts, the rest slide (snappy); the number in the unread count rolls (words stay whole, so Arabic keeps its joins) and the pill pops | fades | NotificationCenter.tsx, AvatarGroup/useFlipList.ts |
| `progress-spring` (new) | ProgressBar, ProgressCircle | value changes | bar fill eases on the soft spring; ring arc turns into place from the old value on the soft spring; ring value rolls | instant | ProgressBar.css, ProgressCircle.tsx/.css |
| `progress-celebrate` (new, WAAPI) | ProgressBar, ProgressCircle | value reaches max from below | track (block axis) or ring dips to scale.anticipate and pops to scale.pop over duration.celebrate, once per completion, never on a first paint at max | none | ProgressBar.tsx (`useCelebrate`), ProgressCircle.tsx |
| `meter-fill` (new, script) | Meter | first view | an inline scaleX(0) holds the fill empty from before the first paint; on screen at mount, or when an IntersectionObserver sees it, the hold drops and the fill transitions on ease.spring-soft over duration.reveal (640ms), once | value at once | Meter.tsx, Meter.css (soft spring for later changes) |
| `avatar-status` (new, WAAPI) | Avatar | status changes after first paint | status dot pops; a ring in the status color grows 2.5 times and fades, duration.pulse, loop count from the live duration so it ends before 5s (3 at 1.4s); pauseLoops() catches it | none | Avatar.tsx, Avatar.css |
| `status-pulse` (reworked, CSS) | StatusDot | `pulse` | each loop the dot dips and pops in its first third while the ring grows and fades; `--_status-dot-loops: 3` (4.2s) | none | StatusDot.css |
| `avatar-group-change` (new, flip) | AvatarGroup | avatars change | new avatars pop, removed ones shrink as ghosts, the rest slide; overflow number rolls and the overflow pops | fades | AvatarGroup.tsx, useFlipList.ts |
| `badge-count` (new, digit-roll) | Badge | count changes | digits roll (snappy), badge dips and pops (celebrate); a badge with its own transform pops its label instead; a dot only pops | digit fade | Badge.tsx |
| `card-lift` (new, CSS + pointer) | Card, Tile | pointer over an interactive card or tile | rises distance.lift and grows to scale.lift on the soft spring; a decorative aria-hidden empty span (last child) draws a highlight on its ::before that follows the pointer by transform. Studio: lift tokens at rest, so only the highlight and tone | no lift, no highlight | Card.tsx, Tile.tsx, Card/pointerGlow.ts, Card.css, Tile.css |
| `spinner-loop` (new, CSS) | Spinner | mount | fades in over duration.spring-soft, then the endless linear turn; pause path pauseLoops() | still ring | Spinner.css |
| `kbd-press` (new, WAAPI) | Kbd | the real key a keycap names is pressed | keycap dips distance.nudge and to scale.anticipate on the snappy spring and holds; release springs back on the bouncy spring; repeats ignored; passive listener | none | Kbd.tsx |
| `handle-grip` (new, CSS) | ResizablePanels, SplitView | hover, focus, drag the handle | grip grows along the line from scale.morph on the bouncy spring as it fades in; stretches to scale.stretch while dragged | no growth | ResizablePanels.css |
| `split-view-pane` (new, CSS) | SplitView | stacked pane switch | the pane slides distance.enter from the side it comes from, transform only (focus ring shows at once) | none | SplitView.css |

DescriptionList and ScrollArea: no change in motion (no interactive part that
the rules let move; the ScrollArea thumb is positioned by Radix with a
transform). ScrollArea got the `data-motion` reduced block.

Decisions:

- Exit ghosts (`Alert/ghost.ts`): a removal is never delayed. The element
  leaves in the consumer's commit; just before the next paint an inert,
  aria-hidden copy is put back absolutely and plays its exit, then removes
  itself on `settled()`. Used for alert-dismiss, skeleton-swap and list
  removals. If the consumer keeps the element, nothing plays.
- Digit roll host: the drawn number is aria-hidden and React renders its text
  as the only child, so the first paint and the server need no script; the
  number is read from a `data-visually-hidden` copy (Stat, NotificationCenter
  count) or the existing name (Badge split form, AvatarGroup overflow,
  ProgressCircle value). Badge counts are now always the split form.
- FLIP lists measure in the render that changes them (`useFlipList`), so the
  first box is what is drawn, a move in flight included.

## 2. Rejected ideas

- A Callout that travels on mount: it sits in a text column and would push
  the reading line; it only fades and pops its icon.
- Panel overshoot for the accordion content: rule 2 of the study, panels and
  text ease out.
- Pulsing every online avatar at load: a page of avatars would move for four
  seconds; the pulse plays only on a status change.
- Rolling whole words of the unread count: per character columns break Arabic
  joins; only the number rolls.
- A ScrollArea thumb grow: Radix moves the thumb with transform, a second
  transform would fight it.

## 3. Needs a rule change

| Idea | Property | Built instead |
| --- | --- | --- |
| ProgressCircle sweep from the old value to the new | the conic mask angle (`@property` number transition) | the new arc turns into place from the old end on the soft spring |
| Skeleton content that fades in under the leaving shape | an API change: `<Skeleton loading>{content}</Skeleton>` | a ghost of the skeleton fades over the content |
| Card highlight as a gradient that follows the pointer | `background-position` | a circle on a decorative span moved by transform |
| Stat or Badge value text that blurs while it rolls | `filter` | roll and fade only |

## 4. Work for Angular and native

- CSS only, free in Angular: alert-entrance, state-illustration,
  error-state-details, accordion-reveal (children stagger; Angular's content
  needs the one unnamed div), toast-enter, toast-swipe, progress-spring (bar),
  status-pulse, handle-grip, split-view-pane, spinner-loop, card-lift lift.
- Needs code in Angular: the exit ghost (alert-dismiss, skeleton-swap), the
  FLIP lists (notification-change, avatar-group-change, toast-stack through
  flipPlay), the digit rolls (stat-roll, badge-count, overflow, unread count,
  ring value), progress-celebrate, the ring turn, meter-fill hold and
  observer, avatar-status, kbd-press, and the card-lift highlight span plus
  its pointer handler. Without the span the CSS keeps the round 1 look.
- Native: the same beats with Reanimated springs from the spring tokens.

## 5. Token requests

None. Every timing reads existing round 2 tokens.

## 6. Preset rows needed from the lead

None required. Notes: Studio plays `pop` and `number-roll` reduced, so
badge-count, progress-celebrate and avatar-status do not pop in Studio and
stat-roll fades its digits there. If the owner wants Studio's hard cut roll,
add `interactions: { 'stat-roll': 'full', 'badge-count': 'full' }` to
`packages/styles/studio/motion.ts`.

## 7. Changes needed from the lead

- `apps/gallery-react/src/interactions.css` already zeroes the tokens under
  `data-motion="reduce"`; the component CSS of this family now carries its own
  `:root[data-motion='reduce']` twins (B2), so nothing more is needed here.

## 8. Review findings taken in

- **B2, fixed** for every CSS file of this family: each
  `prefers-reduced-motion` block has a `:root[data-motion='reduce']` twin
  (Accordion, Alert, Avatar, Banner, Callout, Card, EmptyState, ErrorState,
  Meter, ProgressBar, ProgressCircle, ResizablePanels, ScrollArea, Skeleton,
  Spinner, SplitView, StatusDot, Tile, Toast). Test:
  `packages/react/src/components/Alert/reducedMotion.test.ts`.
- **N3, fixed**: `ROLL_WINDOW_MS = 333` in `Stat/useDigitRoll.ts`; a change
  within 333ms (or the roll, if longer) of the last roll changes in place in
  every style; comments updated. Test in `Stat.test.tsx` ("rolls at most three
  times a second").
- **N6, fixed** (Accordion): the chevron reads `--_accordion-icon-duration`
  and the child stagger `--_accordion-stagger`; the `off` row sets both and
  `--_accordion-duration` to 0s. Test in `Accordion.test.tsx`.
- **N12, fixed**: `Accordion.demo.tsx` has an "open" case with a
  `data-demo-trigger` that mounts an accordion with a section open. Test in
  `Accordion.test.tsx`.

- **Readable stagger (the lead's rule after the List contrast finding),
  applied**: every CSS keyframe of a staggered or fading part in this family
  (Alert, Banner and Callout surface, icon and text; Toast card and icon;
  EmptyState and ErrorState art and text; Accordion children) reaches
  opacity 1 at 30% of its run (READABLE_AT) while the transform settles
  over the whole run, and every CSS stagger delay is
  `min(n * step, duration.base)`, so no part waits more than 120ms. The FLIP
  entries and digit rolls get the same from the foundation (`stepsWithin`,
  `readableEnter`). Test: the second block of `Alert/reducedMotion.test.ts`.

## 9. Proof

- `npx vitest run` on the 25 component folders and the registry test: green
  (new tests: `Alert/motion.test.tsx`, 14 tests of the WAAPI interactions;
  `Alert/reducedMotion.test.ts`; Stat, Accordion, Badge, NotificationCenter,
  Toast updates).
- `npx tsc --noEmit -p tsconfig.json`: clean. eslint on the touched files:
  clean. `packages/manifest/validate.ts`: 111 manifests, 0 errors.
- Contract suite, `--framework react` on all 25 components: green. First run:
  Accordion to Kbd passed; Meter failed target size in every style (1.5
  minutes each): the meter-fill hold was a paused finite animation, and the
  suite waits for finite animations to end. Fixed by holding with an inline
  scaleX(0) and playing the fill as a one off transition. Second run (Meter
  to Toast, 13 components): 385 passed, 0 failed.
- `npm run check`: typecheck, eslint and manifests green. Failures, none in
  this family's files: vitest in the lint gates (raw z-index in
  CommandPalette, DropdownMenu, Menubar CSS; a bare button in an Angular
  form spec), NumberField and PhoneField demos, the cli docs test and a
  timing test in shared filter; Angular, gallery-angular and both consumers
  failed on a transient syntax error in `packages/motion/src/interactions/fields.ts`
  (another family's file, mid edit at the time).
- Recordings: `docs/reports/shots/interactions-2/feedback.neutral.webm`
  (light), `feedback.studio.webm` (dark), `feedback.desk.webm` (dark), from a
  static build of the gallery (the dev server reloaded under other agents'
  edits and dropped the page mid run). Re-encoded to VP8 at 960 by 600 and
  15 frames a second to stay under 8 MB. They were recorded before the
  Meter hold change (which looks the same) and before the readable stagger
  rule (parts now reach full opacity sooner). At the time of the commit the
  machine ran at a load of about 35 and the encode ran at about one frame a
  second, so the three files were still encoding from the raw recordings in
  the scratch folder (`f/vid/feedback.<style>.raw.webm`); the encode loop
  copies each finished file to `docs/reports/shots/interactions-2/`. The
  command, if it has to run again:
  `ffmpeg -i feedback.<style>.raw.webm -vf "fps=15,scale=960:-2" -c:v libvpx -b:v 220k -maxrate 280k -bufsize 560k -deadline realtime -cpu-used 16 feedback.<style>.webm`. A probe listed the running animations
  after each trigger in Desk: every row plays (for example stat-roll 3 digit
  columns and the trend nudge, toast-stack `ds-motion:flip`, meter-fill held
  then played at 640ms, alert-dismiss `flip-exit` plus two neighbour flips).
  Frames read: the dismiss ghost shrinking over the alert below, the avatar
  group popping its fourth avatar, the ring and bar mid spring. Fixed after
  reading: the alert-dismiss stage changed state without the close button, so
  no exit played; it now presses the alert's own close button.
