# Lane 5C report: States

Branch `claude/ds-lane-5c`. Orders from `docs/plan/wave-1-batch-5.md`, built
in lane order: 1.5.10 StatusDot, 1.5.8 Skeleton, 1.5.11 ErrorState,
1.5.12 NotificationCenter. All four are done.

Every component passed, before its commit: its unit tests, `npm run check`,
`npm run contract -- --framework react --component <Name>` (StatusDot 20
passed 1 skipped, Skeleton 20 passed 1 skipped, ErrorState 21 passed,
NotificationCenter 21 passed; the skip is the keyboard map of a component
with no keys), screenshots in studio dark and light, desk dark and light,
and desk dark rtl ar, and one fresh eyes review by a subagent.

Screenshots: `docs/reports/shots/wave-1/{status-dot,skeleton,error-state,notification-center}/`.

## Sources

- GoBanana could not be reached: attaching `MaherFayad/GoBanana` was denied
  in this session. No GB file named by the orders was read (`landing.css`,
  admin `ui.tsx`, `studio-components.css` lines 1209 to 1289,
  `NotFoundView.tsx`, `NotificationStack.tsx`, `desktop.css` lines 746 to
  854). Each component says so in its header comment. The lead may want a
  visual pass against GB once it is reachable.
- Figma-Killer-2 was cloned and read: `Skeleton/` and `EmptyState/`.
  Nothing under `vendor/alm-design-system` was read.

## 1.5.10 StatusDot

A dot and the state in words. The label is required. `hideLabel` hides it
visually; only for rows where visible text nearby already names the state
(a group heading such as "Online now").

```ts
interface StatusDotProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children'> {
  label: ReactNode;               // required, never color alone
  tone?: Tone;                    // default 'neutral', all six
  size?: 'sm' | 'md';             // default 'md'
  pulse?: boolean;                // default false, sets data-pulse
  hideLabel?: boolean;            // default false, sets data-hide-label
  ref?: Ref<HTMLSpanElement>;
}
```

Decisions:

- Dot colors are the `color.state.<tone>.border` tokens (the contrast gate
  checks them at 3:1 on body, surface and surface-2); neutral is
  `color.text.muted`, accent `color.primary.border`.
- The dot is a fixed size (`space.fixed-s`, `space.fixed-m`): density does
  not change it.
- The pulse plays three times (3 x 1.4s = 4.2s) and stops, so it stays
  under the five seconds of WCAG 2.2.2 with no pause control. It does not
  play under reduced motion or forced colors. It does not restart on
  re-render; the label carries the live state after it ends.
- The label takes the font family and color of the text around it; the size
  axis sets only the font size.
- `data-hide-label` is a boolean state attribute listed in the manifest.

Review: one blocker fixed (the "many" demo hid labels in a mixed list, so
color alone told states apart; it now groups rows under headings that name
the state). Notes fixed: dot alignment with a hidden label, English case
direction in RTL, Tooltip mention removed, the pulse limit written in the
manifest, case order tested, inherited font and color. Left open: the
motion id (below), and Studio's accent dot reading close to neutral gray
(Studio's primary is achromatic by design; the label carries the meaning).

## 1.5.8 Skeleton

```ts
interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children'> {
  variant?: 'text' | 'circle' | 'rect';  // default 'text', rendered as data-variant
  size?: 'sm' | 'md' | 'lg';             // default 'md', text only
  width?: string | number;               // number is px
  height?: string | number;              // rect only
  ref?: Ref<HTMLSpanElement>;
}
```

Decisions:

- Always `aria-hidden`, even when a caller passes `aria-hidden={false}`.
  The loading container carries `aria-busy`; the demo and its test check
  that every skeleton sits in one.
- The order names a size axis for text with no values. I chose `sm`, `md`,
  `lg` (default `md`): the line stands for `font.size.s`, `m` or `2xl`, with
  half the normal leading above and below so lines stack like text. Circle
  and rect do not stamp `data-size`.
- The fill and the band are `color.bg.overlay-10`, not the FK2 surface
  steps. In the light schemes `surface-3` is lighter than `body`, so a
  skeleton read as a hole and the band as a darker smear. An overlay shows on
  any surface, glass included, and goes the right way per scheme.
- The shimmer is a band on `::before` moved with `transform` only, toward
  the inline end (right to left in RTL, through `:dir(rtl)`). It is not
  drawn under reduced motion. Forced colors draws a `CanvasText` outline.
- `width` and `height` set `--_skeleton-width` and `--_skeleton-height`
  inline; the CSS declares defaults for both on the root and per variant.

Review: no blockers. Notes fixed: private names now `width` and `height`,
the comment about the band, "32px at the default density", the demo title,
an added `long-text` case. Left open: the shimmer uses `ease.default`; the
`skeleton-shimmer` pattern in 1.11 should own the curve (a linear ease
token would suit a loop).

## 1.5.11 ErrorState

```ts
interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  title: ReactNode;                       // what failed, naming the thing
  body?: ReactNode;                       // what to do next, what is safe
  icon?: IconName | ReactNode | false;    // default 'alert-circle'
  size?: 'sm' | 'md' | 'lg';              // default 'md'
  headingLevel?: 2 | 3 | 4 | 5 | 6;       // default 2
  onRetry?: () => void;                   // renders the retry Button first
  retryLabel?: string;                    // default 'Retry loading' / 'إعادة التحميل'
  retrying?: boolean;                     // data-state="retrying", Button loading
  retryingLabel?: string;                 // default 'Retrying'
  actions?: ReactNode;                    // more Buttons after retry
  code?: string;                          // in the details disclosure, ltr
  details?: ReactNode;                    // more detail after the code
  detailsLabel?: string;                  // default 'Error details'
  detailsOpen?: boolean;                  // default false
  live?: boolean;                         // default true: role="alert", aria-atomic false
  lang?: string;                          // sets lang, dir and the default words
  ref?: Ref<HTMLDivElement>;
}
```

Decisions:

- Anatomy grew from the order's six parts to nine: `retry` (the retry
  Button carries `data-part="retry"`, so it is an owned part), `summary`
  and `code` (the toggle and the code inside `details`). EmptyState can
  take the same parts and drop the ones it does not need.
- `details` is a native `details` element: no script, keyboard ready, and
  the summary is not a bare button. The native marker is hidden (also the
  WebKit one) and a chevron turns when open.
- `live` (default true) puts `role="alert"` with `aria-atomic="false"` on
  the root, so an error that replaces content is read once and the retry
  Button's own status does not read it all again. With `live={false}` the
  root is a `group` named by its title.
- Motion: `fade-rise` on mount (transform and opacity), off under reduced
  motion and forced colors.
- Line length uses `dialog.width.md` (440px), since no measure token
  exists (token gap below).
- The retry Button is accent solid with the `refresh` icon, which is a
  circle and is not mirrored.

Review: one blocker fixed (a name on a role-less div; now `role="group"`).
Notes fixed: a duplicated rule inside the forced colors block, the WebKit
marker, `aria-atomic`, missing motion tokens, a fade-rise that was named
but not played, an open details case in the demo, tests for `dir` and the
empty guards. A later commit restored the repo's single quote style in
these files after a formatter run.

## 1.5.12 NotificationCenter

```ts
interface NotificationItem {
  id: string;
  title: ReactNode;
  body?: ReactNode;
  time: Date | number | string;
  unread?: boolean;
  tone?: Tone;                       // icon and its color, default 'neutral'
  icon?: IconName;
  actions?: { label: string; onAction: () => void }[];  // up to two
  group?: string;                    // else Today, Yesterday, Earlier
}

interface NotificationCenterProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  items: NotificationItem[];
  title?: ReactNode;                 // default 'Notifications' / 'التنبيهات'
  headingLevel?: 2 | 3 | 4 | 5;      // default 2, group labels one below
  onMarkAllRead?: () => void;        // mark-all Button while any item is unread
  markAllLabel?: string;             // default 'Mark all as read'
  size?: 'sm' | 'md';                // default 'md'
  emptyTitle?: ReactNode;
  emptyBody?: ReactNode;
  now?: Date;                        // clock for times and day groups
  lang?: string;
  ref?: Ref<HTMLElement>;
}
```

Decisions:

- A `section` named by its title; each group a `group` named by its
  heading, holding a list; each item an `article` in a `li`, named by its
  title, with a `time` element. No `role="feed"`, no live region: new items
  are announced by the consumer through `toast()`.
- Items are tab stops (`tabIndex=0` with the focus ring), as the order says
  "Tab through items and actions"; no roving.
- Unread: a dot (`color.primary.border`), a bold title and a visually
  hidden "Unread:" word before the title, plus `data-unread`.
- Times: `Intl.RelativeTimeFormat` with `numeric: 'auto'`; Arabic uses
  `ar-u-nu-latn` for Western digits. Day groups by local calendar day. The
  helper lives in the component folder (`time.ts` with `time.test.ts`),
  since the order names no shared file. If Angular needs it, it can move to
  `packages/shared`.
- The panel draws no surface, radius or scroll: the Popover or Sheet owns
  them.
- Elements with no part (the `ul`, `li`, the empty state's two lines, the
  hidden word) carry their own data attributes (`data-list`, `data-entry`,
  `data-empty-title`, `data-empty-body`, `data-unread-word`) so the CSS
  stays on attribute selectors.
- The hover veil on `::after` washes over the whole item, actions included:
  lifting the actions above it would need a raw `z-index`.

Review: see the section below.

## Token gaps

- `duration.pulse` (StatusDot uses `duration.shimmer`, 1.4s).
- A measure token for text columns, such as `size.measure` (ErrorState uses
  `dialog.width.md`).
- `ease.linear` for looping motion (Skeleton uses `ease.default`).
- A `z` step for content above a hover veil inside a component (a
  `z.raised` of 1) would let NotificationCenter keep its actions out of the
  veil.

## Changes needed from the lead

1. Motion ids. Order 1.11 has no pulse pattern. StatusDot names
   `"motion": "thinking"` as the closest id. Either add a `pulse` pattern to
   the 1.11 list (and change `packages/manifest/src/component/StatusDot.manifest.json`
   `"motion"` to `"pulse"`), or confirm `thinking`.
2. NotificationCenter names `"motion": "list-stagger"` for when new items
   are inserted, but no stagger plays yet: the panel renders a static list.
   When 1.11 lands, either wire `list-stagger` on inserted items or change
   the manifest's `"motion"`.
3. Regenerate on merge (`npm run gen`): the barrels, `packages/css/src/index.css`,
   `routes.gen.ts` and `manifests.gen.json` on this branch were generated
   per commit and are correct as of the last commit.

## What I could not do

- Read the GoBanana sources (access denied in this session).
- Check Neutral: it is not built yet. Everything is tokens only, with no
  recipes, so Neutral applies once its tokens exist.
- The Angular and native blocks are `planned`.
