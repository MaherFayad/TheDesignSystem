# Lane angular-a5: Angular batch A5 (feedback)

Branch `claude/ds-angular-a5`, from `claude/relaxed-hypatia-7gseap`. One
commit per component: StatusDot, Skeleton, Alert, Callout, Banner,
ErrorState, NotificationCenter (A5.1), then the A5.2 components. A5.2 was built by a subagent (claude-opus-5-5, medium) in the same tree
while the lead built A5.1; the lead re-ran its proofs before committing. The
generated files (the Angular barrel, `routes.gen.ts`,
`manifests.gen.json`) and the shot tables are refreshed by `npm run gen`
and the shot runs, and are committed once, in the last commit: each
component commit carries its folder, its manifest `angular` block and its
screenshots. A component commit compiles on its own (nothing imports a
folder that is not in it yet); the barrel export and the gallery route
arrive with the last commit.

No file in `packages/css`, `packages/react` or `packages/shared` was
changed. No dependency was added.

## Result, A5.2

| Component | DOM diff vs React | Contract (angular) | Pixels vs React | Unit tests |
| --- | --- | --- | --- | --- |
| Spinner | 0 lines (165) | 28 passed, 1 skipped | 12 shots, 0 px | 4 |
| ProgressBar | 0 lines (255) | 28 passed, 1 skipped | 12 shots, 0 px | 9 |
| ProgressCircle | 0 lines (290) | 28 passed, 1 skipped | 12 shots, 0 px | 5 |
| Meter | 0 lines (224) | 28 passed, 1 skipped | 12 shots, 0 px | 7 |
| Toast | 0 lines: the static cases (179), the empty layer, and each of the 15 triggers open | 44 passed | 24 shots (12 open), 0 px | 16 |

- Toast DOM: the toaster layer `[data-toaster-layer]` was dumped with the
  same normalization. Two runs showed differences only in the hidden live
  region text, from Playwright click timing against the 100 ms flush and
  the 5 s clear; an in-page probe with fixed gaps gives equal lines.
- Toast contract: one early run failed one test with "navigation
  interrupted by another navigation" (a dev server reload from a
  concurrent edit); every later run passed 44 of 44.
- The shot runs re-captured the 16 React Toast PNGs (the committed ones
  were stale against the current React Toast) and added the 8 neutral style
  React Toast shots.
- Full compare table: 214 pairs, 0 over the limit, every pair of this lane
  at 0 differing pixels.


## Result, A5.1

| Component | DOM diff vs React | Contract (angular) | Pixels vs React | Unit tests |
| --- | --- | --- | --- | --- |
| StatusDot | 0 lines (237) | 28 passed, 1 skipped | 12 shots, 0 px | 4 |
| Skeleton | 0 lines (156), also after the loading toggle | 28 passed, 1 skipped | 12 shots, 0 px | 6 |
| Alert | 0 lines (453), also after Sync files and close | 29 passed | 18 shots, 0 px | 8 |
| Callout | 0 lines (275) | 28 passed, 1 skipped | 12 shots, 0 px | 6 |
| Banner | 0 lines (361), also after dismiss (focus target gets tabindex -1 in both) | 29 passed | 18 shots, 0 px | 7 |
| ErrorState | 0 lines (262), also after retry and opening details | 29 passed | 12 shots, 0 px | 6 |
| NotificationCenter | 0 lines (666), also after an item action and mark all read | 29 passed | 18 shots, 0 px | 8 |

- DOM diff: `docs/reports/shots/angular/compare-dom.mjs` on `/c/<slug>?chrome=0`
  for both galleries, plus a variant of it that clicks a list of selectors
  first (the same normalization: tag, sorted attributes, trimmed text, ids
  renamed in order). Line counts in brackets.
- Contract: `npm run contract -- --framework angular --component <Name>`.
  The skips are the keyboard map check on components with no focusable
  part; the React run skips the same check.
- Pixels: `npm run shots -- --framework react|angular --component <kebabs>`,
  then `npm run shots -- --compare react angular`. Every pair of this lane
  passes with 0 differing pixels. One Angular Callout capture was unstable
  once (neutral light rtl) because a `npm run gen` during the run made the
  dev server rebuild; the re-run was stable and equal.
- `npm run check` green before each commit.

## API per component, A5.1

Names follow React. Node props (`ReactNode`) take a string or a
`TemplateRef`, per `frameworks.md`. Handlers whose presence renders a part
(`onClose`, `onDismiss`, `onRetry`, `onMarkAllRead`) are function inputs, as
on WindowControls: an output cannot tell whether anyone listens. Children
are the projected content.

### StatusDot

```html
<span dsStatusDot tone="success" size="sm" pulse hideLabel label="Online"></span>
```

Inputs: `label` (required, string or TemplateRef), `tone` (default neutral),
`size` (sm, md; default md), `pulse`, `hideLabel`. Same names as React.

### Skeleton

```html
<span dsSkeleton variant="rect" [width]="'60%'" [height]="96"></span>
```

Inputs: `variant` (text, circle, rect; default text), `size` (sm, md, lg; text
only), `width`, `height` (a CSS length or a number of px; height for rect
only). They set `--_skeleton-width` and `--_skeleton-height` as inline
styles, as React does. Always `aria-hidden="true"`. Same names as React.

### Alert

```html
<ng-template #retry><button dsButton size="sm">Retry sync</button></ng-template>
<div dsAlert tone="danger" emphasis="solid" size="md" title="Could not sync 3 files"
     [actions]="retry" [onClose]="dismiss" closeLabel="Dismiss alert" toneLabel="Error" live>
  The server did not answer. Your local copies are safe.
</div>
```

Inputs: `tone`, `emphasis` (soft, outline, solid), `size` (sm, md),
`title` (required), `actions`, `icon` (icon name or TemplateRef),
`toneLabel`, `live`, `onClose`, `closeLabel`, `lang`.

- The body is the projected content. React leaves the body part out when
  `children` is empty; Angular cannot see that before it renders, so the
  part renders around `<ng-content>` and `DsFilledPart` (in
  `alert/message.ts`) swaps an empty part for a comment placeholder after
  the render, and puts it back when content arrives (a MutationObserver).
  Used by Alert and Callout.
- `title` is an input on `div[dsAlert]`, not the native attribute; the host
  removes the static attribute, and the strict `ds/no-native-title` gate
  passes because the class declares a `title` input.
- `lang` is an input (it picks the default words) and is stamped back.
- A caller `aria-atomic` is kept unless the role is status.

### Callout

```html
<div dsCallout tone="accent" emphasis="outline" title="Move faster with the keyboard" toneLabel="Tip">
  Press <code>/</code> to search every board.
</div>
<aside dsCallout tone="accent" title="Related: share a board">...</aside>
```

Inputs: `tone`, `emphasis` (soft, outline), `title`, `icon`, `toneLabel`,
`id`, `lang`.

- React's `as` has no input: the host tag is the form (`div[dsCallout]` is a
  note, `aside[dsCallout]` a complementary landmark), as `a[dsButton]` is the
  link form of Button.
- Ids for `aria-labelledby` (icon, then title) come from the CDK
  `_IdGenerator`, or from the `id` input. A static `aria-labelledby` or
  `aria-label` on the host wins, as the React rest props do.

### Banner

```html
<ng-template #pay><button dsButton size="sm" emphasis="outline">Add payment method</button></ng-template>
<section dsBanner tone="warning" emphasis="soft" label="Announcement" [actions]="pay"
         [onDismiss]="hide" returnFocus="#boards" closeLabel="Dismiss announcement" sticky>
  Your trial ends in 3 days.
</section>
```

Inputs: `tone`, `emphasis` (soft, solid), `actions`, `label`, `icon`,
`toneLabel`, `sticky`, `onDismiss`, `returnFocus` (element or selector),
`closeLabel`, `lang`. Same names as React. On dismiss focus moves to
`returnFocus` (default the first `main`), then `onDismiss` runs. `sticky`
reserves `scroll-padding-block-start` on the scroll container in an
`afterRenderEffect` with a ResizeObserver, and restores it on cleanup.

### ErrorState

```html
<ng-template #more><button dsButton>Open boards</button></ng-template>
<div dsErrorState lang="en" size="lg" title="This page did not load" body="Retry, or go back to your boards."
     [onRetry]="reload" [retrying]="busy()" retryLabel="Retry loading" retryingLabel="Retrying"
     [actions]="more" code="ERR_INTERNAL 500" details="Request id 7f3a9c21." detailsLabel="Error details"
     detailsOpen [headingLevel]="3" live></div>
```

Inputs: `title` (required), `body`, `icon` (icon name, TemplateRef or
`false`), `lang`, `size` (sm, md, lg), `headingLevel` (2 to 6), `onRetry`,
`retryLabel`, `retrying`, `retryingLabel`, `actions`, `code`, `details`,
`detailsLabel`, `detailsOpen`, `live`. Same names as React. The title id
comes from the CDK `_IdGenerator`. A static `role`, `aria-atomic`,
`aria-labelledby` or `dir` on the host wins, as the React rest props do.

### NotificationCenter

```html
<section dsNotificationCenter [items]="items()" [now]="now" [onMarkAllRead]="markAll"
         title="Notifications" [headingLevel]="2" size="md" markAllLabel="Mark all as read"
         emptyTitle="No notifications" lang="en"></section>
```

Inputs: `items` (required), `title`, `headingLevel` (2 to 5), `onMarkAllRead`,
`markAllLabel`, `size` (sm, md), `emptyTitle`, `emptyBody`, `now`, `lang`.
Same names as React. `NotificationItem` is the React type with `title` and
`body` as a string or a TemplateRef. Item title ids come from the CDK
`_IdGenerator`, one per item id for the life of the panel (React's `useId`
per item). Mark all read moves focus to the panel title before the handler
runs, as in React.

### Spinner

```html
<span dsSpinner size="md" tone="accent" label="Loading boards"></span>
<span dsSpinner decorative></span>
```

Inputs: `size` (xs, sm, md, lg; default md), `tone` (neutral, accent),
`label`, `decorative`. React enforces "label unless decorative" with a type
union; Angular cannot, so a spinner with neither warns in development.

### ProgressBar

```html
<div dsProgressBar [value]="40" [max]="100" label="Uploading files" [showValue]="true"
     [valueText]="text" loadingLabel="Loading" size="md" tone="accent"></div>
```

Inputs: `value` (number, or null for indeterminate), `max`, `label` (string
or TemplateRef), `showValue` (default true), `valueText` (function),
`loadingLabel`, `size` (sm, md, lg), `tone` (accent, success, warning,
danger), `aria-label`, `aria-labelledby`. `max`, `aria-label` and
`aria-labelledby` are aliased inputs (fields `maxInput` and so on): `max` is
also the clamped computed value, and the aria names decide, as React's rest
props do, whether `aria-labelledby` points at the label part.

### ProgressCircle

```html
<div dsProgressCircle [value]="72" label="Storage used" size="lg" tone="accent"></div>
```

Inputs: `value`, `max`, `label` (required), `showValue` (default by size),
`valueText`, `loadingLabel`, `size` (xs, sm, md, lg), `tone`, `aria-label`.

### Meter

```html
<div dsMeter [value]="180" [min]="0" [max]="200" [low]="120" [high]="170" [optimum]="0"
     label="Storage" [showLevel]="true" size="md"></div>
```

Inputs: `value` (required), `min` (default 0), `max`, `low`, `high`,
`optimum`, `label` (string or TemplateRef), `valueText`, `levelLabels`,
`showLevel`, `tone`, `size`, `aria-label`, `aria-labelledby`. Level and tone
come from `packages/shared/src/meter.ts`. The React demo spreads a range
object; Angular passes the thresholds as separate inputs.

### Toast

```html
<ng-container dsToaster position="bottom-end" label="Notifications" [hotkey]="['F8']"></ng-container>
<div dsToast tone="success" title="Board shared" description="Everyone can comment." [onClose]="close"></div>
```

```ts
import { toast } from '@the-system/angular';
toast({ tone: 'danger', title: 'Could not sync 3 files', action: { label: 'Retry sync', onAction: retry } });
```

`dsToaster` (on an ng-container, the dsDialog pattern) inputs: `position`
(bottom-end, bottom-center, top-end, top-center), `label`, `hotkey`,
`toastLabel`, `closeLabel`, `store` (default the shared `toastStore`).
`dsToast` is the static notice (no `data-state`): `tone`, `title`,
`description`, `count`, `action`, `onClose` (function input), `closeLabel`,
`lang`, `dir`. The store, `toast()`, `createToastStore` and the types are
re-exported from `@the-system/shared` (`toast.ts`), which owns every timing
rule (danger and action toasts stay); the layer only reports pause and
resume. The layer is a CDK ComponentPortal host `div[data-toaster-layer]`
in body, above dialogs, that copies the theme as the Dialog layer does and
carries `aria-live="off"`. The Radix Toast DOM and behavior are hand built:
collection item attribute, swipe, focus proxies, Tab order, F8, Escape
from inside only, and focus to the list when a focused toast closes. No CDK
LiveAnnouncer: it adds an element React does not render, so the layer owns
the two hidden live regions (the manifest note was updated to say so).


## Decisions

- The close part of Alert and Banner. The Angular CloseButton
  (`dsCloseButton`) is on `claude/ds-angular-a1` and needs that branch's
  changes to `button-base.ts`, so it is not in this checkout. Alert and
  Banner render the same DOM with `<button dsIconButton data-ds="close-button"
  data-part="close" icon="close" size="xs">`: the template's static
  `data-ds` wins over the IconButton host attribute, and the DOM diff shows
  no difference from React's CloseButton. A comment marks both places.
- Shared message helpers (`messageIcons`, `wordsFor`, `DsFilledPart`) live in
  `components/alert/message.ts`, the twin of React's
  `Alert/messageTones.ts`, and are not exported from the barrel.
- `NotificationCenter/time.ts` is pure TypeScript in the React folder. The
  Angular folder has a copy (`notification-center/time.ts`) with a header
  that says so, rather than an import across framework packages.
- Demos: helper components React uses (Retryable, Dismissible, Live, Busy)
  would add a host element React does not have, so the Angular demos keep
  that state in signals on the demo class, or use an `ng-template`. The one
  helper component (Skeleton's loading case) takes the grid div itself as
  its host. Where React splits text into two nodes (`{a} {b}`,
  `{word}: `), the Angular template splits it with `ng-container` so the
  DOM text nodes match.

- Progress number formatting: ProgressBar, ProgressCircle and Meter use
  `progress-bar/format.ts`, an Angular copy of React's private
  `ProgressBar/format.ts`, on the shared `formatNumber`.
- Toast's close part is a private `button[dsToastClose]` on `DsButtonBase`
  (`toast/toast-close.ts`) with the exact CloseButton DOM, for the same
  reason as Alert and Banner.

## What I could not do

- Use the real `dsCloseButton` (see Decisions): swap it in on merge.
- Prove Toast above an open Angular Dialog: the Toast demo has no dialog,
  and the Angular Dialog pulls focus back (see change 5).

## Changes needed from the lead

1. On merge with `claude/ds-angular-a1`: in
   `packages/angular/src/components/alert/alert.ts` and
   `packages/angular/src/components/banner/banner.ts`, replace
   `<button dsIconButton data-ds="close-button" data-part="close" icon="close" size="xs" [label]="closeName()" ...>`
   with `<button dsCloseButton data-part="close" size="xs" [label]="closeName()" ...>`,
   import `DsCloseButton` instead of `DsIconButton`, and drop the comment
   above each. The DOM stays the same.
2. Move `packages/react/src/components/NotificationCenter/time.ts` (and its
   test) to `packages/shared/src/time.ts`, then import it from
   `@the-system/shared` in both frameworks and delete
   `packages/angular/src/components/notification-center/time.ts`.
3. Consider moving `Alert/messageTones.ts` (tone icons and `wordsFor`) to
   `packages/shared` for the same reason; the Angular twin is
   `alert/message.ts`.
4. On merge with A1, also replace `toast/toast-close.ts` (`dsToastClose`)
   with `DsCloseButton` in `toast/toast.ts`, and delete the file.
5. `packages/angular/src/components/dialog/dialog.ts`: `onDocumentFocusin`
   should return early when `isInsideToaster(event.target)` is true (import
   from `../toast/is-inside-toaster`), as the React Dialog does. Today a toast
   that takes focus above an open dialog has its focus pulled back into the
   dialog. Pointer clicks still work.
6. Move React's `ProgressBar/format.ts` to `packages/shared` and import it in
   both frameworks; delete `packages/angular/src/components/progress-bar/format.ts`.
7. Run `npm run gen` on merge, as usual.
