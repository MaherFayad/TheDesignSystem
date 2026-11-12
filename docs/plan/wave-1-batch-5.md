# Wave 1, batch 5: feedback (12)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`. Starts when batch 4 is green.

Every order also reads: `packages/react/src/components/Toast/` (tones, icons,
live regions), GB css `.st-alert` (lines 1137 to 1207).

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 1 | 5A Messages | Alert, Callout, Banner | batch 4 green |
| 1 | 5B Progress | Spinner, ProgressBar, ProgressCircle, Meter | batch 4 green |
| 1 | 5C States | StatusDot, Skeleton, ErrorState, NotificationCenter | batch 4 green |

Slot 4 runs Angular A4 and 1.12 part 2.

## 1.5.1 Alert

- Goal: a message about the page or a section that stays until it is fixed
  or dismissed (a form error summary, a sync problem).
- Behavior: hand built. `role="alert"` only for danger that appears after
  load; `role="status"` for the others; none when present at load.
- Anatomy: root (`data-ds="alert"`), `icon`, `title`, `body`, `actions`,
  `close` (a CloseButton root).
- Axes: tone (all six), emphasis (`soft`, `outline`, `solid`), size (`sm`,
  `md`).
- States: none beyond tone.
- Keys: Tab reaches actions and close.
- Read: GB css lines 1137 to 1207, FK2 `Alert/` (all files).
- Owns: standard set for Alert.
- Depends: none.
- Accept: checklist; the tone has an icon and a title word, never color
  alone; `insteadUse` points page wide notices to Banner and passing
  messages to Toast.

## 1.5.2 Banner

- Goal: a page wide notice at the top of the app (maintenance, trial ends).
- Behavior: hand built; a `region` with a label; dismiss remembered by the
  consumer (an `onDismiss` callback, no storage in the component).
- Anatomy: root (`data-ds="banner"`), `icon`, `body`, `actions`, `close`.
- Axes: tone, emphasis (`soft`, `solid`).
- States: `data-sticky`.
- Keys: Tab reaches actions and close; close returns focus to the start of
  main content.
- Read: no source: design from the dials table and the nearest existing
  component (Alert).
- Owns: standard set for Banner.
- Depends: 1.5.3 (same lane).
- Accept: checklist; a sticky banner reserves scroll padding (WCAG 2.4.11);
  no sideways scroll at 320px.

## 1.5.3 Callout

- Goal: a static note inside content (a tip, a caution in docs).
- Behavior: hand built; no live role; `aside` or `div` with a label.
- Anatomy: root (`data-ds="callout"`), `icon`, `title`, `body`.
- Axes: tone, emphasis (`soft`, `outline`).
- States: none.
- Keys: none.
- Read: GB css `.st-alert` (static form), FK2 `Alert/`.
- Owns: standard set for Callout.
- Depends: 1.5.1 (same lane).
- Accept: checklist; `insteadUse` points live messages to Alert.

## 1.5.5 ProgressBar

- Goal: progress of a task, known or unknown.
- Behavior: Radix Progress.
- Anatomy: root (`data-ds="progress-bar"`), `label`, `value` (text),
  `track`, `indicator`.
- Axes: size (`sm`, `md`, `lg`), tone (`accent`, `success`, `warning`,
  `danger`).
- States: `data-state` (`loading`, `complete`, `indeterminate`).
- Keys: none.
- Read: no source: design from the dials table and the nearest existing
  component (Slider track).
- Owns: standard set for ProgressBar.
- Depends: 1.5.9 (same lane).
- Accept: checklist; the indicator moves with `transform: scaleX` and its
  origin flips in RTL; indeterminate stops under reduced motion and says
  "Loading"; values formatted with `number.ts`.

## 1.5.6 ProgressCircle

- Goal: compact progress in a ring (a file upload, a card).
- Behavior: Radix Progress, SVG ring.
- Anatomy: root (`data-ds="progress-circle"`), `track`, `indicator`,
  `value`.
- Axes: size (`xs`, `sm`, `md`, `lg`), tone.
- States: as ProgressBar.
- Keys: none.
- Read: no source: design from the dials table and the nearest existing
  component (ProgressBar).
- Owns: standard set for ProgressCircle.
- Depends: 1.5.5 (same lane).
- Accept: checklist; the ring animates only `transform` or `opacity` (draw
  with a rotated mask or `stroke-dashoffset` is not allowed; use a conic
  mask or a transform on two halves, and say which); ring contrast 3:1.

## 1.5.7 Meter

- Goal: a measured value in a known range (storage used, a score).
- Behavior: hand built; `role="meter"` with `aria-valuenow`, `min`, `max`,
  `aria-valuetext`.
- Anatomy: root (`data-ds="meter"`), `label`, `value`, `track`,
  `indicator`.
- Axes: size, tone (set by thresholds `low`, `high`, `optimum`).
- States: `data-level` (`low`, `medium`, `high`).
- Keys: none.
- Read: GB admin/`RunSignals.tsx` (`.adm-meter`).
- Owns: standard set for Meter.
- Depends: 1.5.6 (same lane).
- Accept: checklist; the level is in text too; `insteadUse` points task
  progress to ProgressBar.

## 1.5.8 Skeleton

- Goal: a placeholder shape while content loads.
- Behavior: hand built; `aria-hidden`; the loading container carries
  `aria-busy`.
- Anatomy: root (`data-ds="skeleton"`), no parts. The form (`text`,
  `circle`, `rect`) is a `variant` prop rendered as `data-variant`, not
  `data-shape`, whose words are fixed for controls.
- Axes: size for `text` lines.
- States: none.
- Keys: none.
- Read: GB css lines 1209 to 1245, FK2 `Skeleton/` (all files).
- Owns: standard set for Skeleton.
- Depends: 1.5.10 (same lane).
- Accept: checklist; shimmer is the `skeleton-shimmer` pattern and stops
  under reduced motion; forced colors shows an outline.

## 1.5.9 Spinner

- Goal: a small indeterminate busy sign.
- Behavior: hand built; `role="status"` with a visually hidden label, or
  `aria-hidden` when the parent already says it is busy.
- Anatomy: root (`data-ds="spinner"`), `label`.
- Axes: size (`xs`, `sm`, `md`, `lg`), tone (`neutral`, `accent`).
- States: none.
- Keys: none.
- Read: GB css lines 72 to 90 (`.st-spinner`), Button's `spinner` part.
- Owns: standard set for Spinner.
- Depends: none.
- Accept: checklist; `spinner` motion pattern; under reduced motion it is a
  still glyph and the label stays; report to the lead whether Button should
  render Spinner as its `spinner` part (exact change).

## 1.5.10 StatusDot

- Goal: a small state marker next to text (online, failed, syncing).
- Behavior: hand built; the meaning is always in adjacent text or a hidden
  label.
- Anatomy: root (`data-ds="status-dot"`), `dot`, `label`.
- Axes: tone, size (`sm`, `md`).
- States: `data-pulse` (only for live states; stops under reduced motion).
- Keys: none.
- Read: GB site/`landing.css` (`.mock-status-dot`, line 554), GB
  admin/`ui.tsx` (`StatusChip`).
- Owns: standard set for StatusDot.
- Depends: none.
- Accept: checklist; never color alone (label required); dot contrast 3:1.

## 1.5.11 ErrorState

- Goal: a section or page that failed to load, with a way forward.
- Behavior: hand built.
- Anatomy: root (`data-ds="error-state"`), `icon`, `title`, `body`,
  `actions` (retry Button first), `details` (a disclosure with the error
  code).
- Axes: size (`sm`, `md`, `lg`).
- States: `data-state` (`error`, `retrying`).
- Keys: Tab reaches the actions.
- Read: GB css lines 1247 to 1289 (`.st-empty`), GB admin/`ui.tsx`
  (`LoadError`), GB site/`NotFoundView.tsx`.
- Owns: standard set for ErrorState.
- Depends: 1.5.8 (same lane).
- Accept: checklist; says what happened and what to do next (copy rules);
  EmptyState (1.9.12) will follow the same anatomy.

## 1.5.12 NotificationCenter

- Goal: the panel of notifications: grouped list, unread marks, mark all
  read, per item actions, empty state. A consumer puts it in a Popover or a
  Sheet (decision 5 in `wave-1.md`).
- Behavior: hand built; `role="feed"` is not used; a list with headings per
  group, items are articles with a time.
- Anatomy: root (`data-ds="notification-center"`), `header`, `title`,
  `count`, `mark-all` (a Button root), `group`, `group-label`, `item`,
  `item-icon`, `item-title`, `item-body`, `item-time`, `item-actions`,
  `unread`, `empty`.
- Axes: size (`sm`, `md`).
- States: items `data-unread`; root `data-empty`.
- Keys: Tab through items and actions; no roving.
- Read: GB desktop/`NotificationStack.tsx`, GB desktop/`desktop.css` lines
  746 to 854.
- Owns: standard set for NotificationCenter.
- Depends: 1.5.11 (same lane).
- Accept: checklist; unread shown by a dot and bold title, not color alone;
  new items announced once through the consumer's Toast, not by the panel;
  times use `Intl.RelativeTimeFormat`.

## Pointer

1.5.4 Toast: done in wave 0 (orders 0.12, 1.0.b count badge, 1.0.f call
shape and demo language). Nothing in section 7 adds to it.
