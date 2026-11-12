# Lane 5A report: Messages (Alert, Callout, Banner)

Branch `claude/ds-lane-5a`. Built in the lane order: Alert, Callout, Banner.

| Order | Component | Commit | Check | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.5.1 | Alert | `wo-1.5.1: Alert` | green | 21 passed |
| 1.5.3 | Callout | `wo-1.5.3: Callout` | green | 20 passed, 1 skipped (no keys: the keyboard check has nothing to press) |
| 1.5.2 | Banner | `wo-1.5.2: Banner` | green | 21 passed |

Screenshots: `docs/reports/shots/wave-1/{alert,callout,banner}/` in studio dark,
studio light, desk dark, desk light and desk dark rtl ar. Banner was also
checked at 320px wide in every combination (no sideways scroll; actions
move below the body).

Sources: GoBanana could not be added to this session (the `add_repo` call
was denied), so GB css `.st-alert` and the Arabic copy cookbook were not
read. Alert and Callout follow Figma-Killer-2 `Alert/` and the Toast parts in
this repo; Banner had no source by order. The manifests and CSS headers say
so.

Generated files (`packages/react/src/index.ts`, `packages/css/src/index.css`,
`packages/manifest/manifests.gen.json`, `apps/gallery-react/src/routes.gen.ts`)
are committed as `npm run gen` wrote them. Regenerate on merge.

## Shared helper

`packages/react/src/components/Alert/messageTones.ts`: the tone to icon map
(`neutral bell`, `accent star`, `info info`, `success success`,
`warning warning`, `danger danger`) and `wordsFor(words, lang)`. Callout and
Banner import it from the Alert folder. Not exported from the barrel.

Every message component names its tone through the icon: the icon is
`role="img"` with the tone word as its name (Error, Warning, Tip), in
Arabic under a Theme in Arabic. The tone is never told by color alone. A
custom `icon` node keeps the word on the icon part.

## 1.5.1 Alert

```ts
type AlertTone = Tone; // all six
type AlertEmphasis = 'soft' | 'outline' | 'solid';
type AlertSize = 'sm' | 'md';

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  tone?: AlertTone;          // default 'neutral'
  emphasis?: AlertEmphasis;  // default 'soft'
  size?: AlertSize;          // default 'md'
  title: ReactNode;          // required
  children?: ReactNode;      // body
  actions?: ReactNode;       // up to two Buttons, size sm
  icon?: IconName | ReactElement;
  toneLabel?: string;        // default by tone and language
  live?: boolean;            // default false: role alert (danger) or status (others)
  onClose?: () => void;      // renders the close IconButton
  closeLabel?: string;       // default 'Dismiss alert' / 'إغلاق الرسالة'
  ref?: Ref<HTMLDivElement>;
}
```

Anatomy: root `data-ds="alert"`, `icon`, `title`, `body`, `actions`, `close`.
Motion `fade-rise` (CSS keyframe on mount, transform and opacity, none
under reduced motion).

Decisions:

- **`live` prop** decides the role, since the component cannot know whether
  it mounted after load. Off: no role. On: `role="alert"` for danger,
  `role="status"` with `aria-atomic` for the rest. The manifest warns that a
  status region inserted with its text is missed by some screen readers.
- **`title` is required**, to meet "the tone has an icon and a title word".
- **Solid emphasis restyles nested Buttons** through their private
  `--_button-*` properties (outlined in the alert ink, ink veil on hover,
  `focus.shadow.primary` two color ring for 3:1 on any fill). Specificity is
  set so Button's hover and active swaps cannot bring back low contrast text.
- **Actions on soft and outline alerts should be `emphasis="outline"`.** A
  neutral soft Button on the danger tint measured 4.46:1 in studio light.
  Written in the manifest content rules; the demo follows it.
- **No empty close column**: `:has()` drops the third column when there is
  no close button.

## 1.5.3 Callout

```ts
type CalloutTone = Tone; // all six
type CalloutEmphasis = 'soft' | 'outline';

interface CalloutProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'role'> {
  tone?: CalloutTone;          // default 'neutral'
  emphasis?: CalloutEmphasis;  // default 'soft'
  title?: ReactNode;
  children?: ReactNode;        // body
  icon?: IconName | ReactElement;
  toneLabel?: string;          // Note, Tip, Information, Success, Warning, Caution
  as?: 'div' | 'aside';        // default 'div'
  ref?: Ref<HTMLElement>;
}
```

Anatomy: root `data-ds="callout"`, `icon`, `title`, `body`. No motion key:
a callout never moves (Field has none either).

Decisions:

- **`div` with `role="note"`** by default. A plain div cannot take a name
  (axe flags aria-label on a generic), and an aside inside main is a nested
  complementary landmark. `as="aside"` is there for a note beside the main
  content.
- **Named by `aria-labelledby`** pointing at the icon (tone word) and the
  title: "Tip Move faster with the keyboard". A consumer `aria-label` or
  `aria-labelledby` wins.
- **A 2px tone edge on the inline start side** sets it apart from Alert, so
  static guidance and a live message do not look the same.
- No size axis: the order lists none.

## 1.5.2 Banner

```ts
type BannerTone = Tone; // all six
type BannerEmphasis = 'soft' | 'solid';

interface BannerProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'role'> {
  tone?: BannerTone;           // default 'neutral'
  emphasis?: BannerEmphasis;   // default 'soft'
  children: ReactNode;         // body
  actions?: ReactNode;
  label?: string;              // region name, default 'Announcement' / 'إعلان'
  icon?: IconName | ReactElement;
  toneLabel?: string;
  sticky?: boolean;            // default false, stamps data-sticky
  onDismiss?: () => void;      // renders close; focus moves first, then this runs
  returnFocus?: HTMLElement | string; // default 'main, [role="main"]'
  closeLabel?: string;         // default 'Dismiss announcement' / 'إغلاق الإعلان'
  ref?: Ref<HTMLElement>;
}
```

Anatomy: root `data-ds="banner"` (a `section`, so a named region), `icon`,
`body`, `actions`, `close`. State `data-sticky`. Motion `fade-rise`.

Decisions:

- **Dismiss**: the banner stores nothing and never hides itself. The close
  button moves focus to the start of main content (adding `tabindex="-1"`
  when the target is not focusable), then calls `onDismiss`, where the
  consumer unmounts it and remembers the choice.
- **Sticky (WCAG 2.4.11)**: sticks to the top of its scroll container with
  `z.topbar`, and sets that container's `scroll-padding-block-start` to its
  measured height through a ResizeObserver. The previous value is restored
  on unmount or when sticky turns off.
- **Always opaque**: the tone tint is a gradient layer over `bg.surface`, so
  content never shows through a sticky banner.
- **Reflow (WCAG 1.4.10)**: a grid with a container query on the banner's
  own width (`breakpoint.phone`); under it the actions move below the body.
  Gaps are margins on the parts, so a missing part leaves no empty gap.

## Token gaps

- No token for an ink veil on a solid tone fill. Alert and Banner use
  `color-mix(in srgb, <on-solid> 12% / 20%, transparent)` for the hover and
  press backgrounds of nested buttons. Proposed: `color.state.veil-hover`
  and `color.state.veil-active` (or reuse `bg.scrim-10/20` if the lead
  confirms they flip correctly per scheme).
- No neutral "solid" pair: neutral solid uses `bg.surface-4` with
  `text.bright`. In Desk light this is close to the soft fill. A
  `color.neutral.solid` and `color.neutral.on-solid` (an inverse pair) would
  give neutral solid a real weight.
- No `text.on-inverse` for `bg.inverse`, which is why the above could not
  use the inverse surface.

## Review findings

Each component had one fresh eyes review by a ds-qa subagent.

Alert, fixed: focus ring under 3:1 on solid fills (blocker; now the two
color ring); forced colors overrides lost to emphasis rules; link emphasis
buttons got a border on solid; links in a solid body; empty close column;
title comment; Arabic close label repeated the warning word (now
`إغلاق الرسالة`); native role was unconditional; optional parts listed.
Left open: the color-mix ratios (token gap above).

Callout, fixed: consumer `aria-labelledby` was overwritten; empty
`toneLabel` gave an unnamed image (now falls back in all three components);
native role `summary` changed to `text`; title slot type. Left open, by
design: the extra private names (`--_callout-tone-*`, `-edge`, `-icon`) go
beyond the name list in anatomy.md rule 1, the same pattern as Toast and
Alert; in forced colors soft and outline look the same (the tone stays in
the icon name).

Banner: see the section below.

## Changes needed from the lead

1. **CloseButton (order 1.1.9).** The `close` part of Alert and Banner is an
   IconButton (`icon="close" size="xs" emphasis` default ghost, with
   `data-part="close"`) because CloseButton does not exist on this branch.
   When it lands, in `packages/react/src/components/Alert/Alert.tsx` and
   `Banner/Banner.tsx` replace
   `<IconButton data-part="close" icon="close" label={...} size="xs" onClick={...} />`
   with `<CloseButton data-part="close" label={...} size="xs" onClick={...} />`.
   The CSS selectors use `[data-part='close']` and, for solid fills,
   `[data-ds='icon-button'][data-part='close']`; the second must become
   `[data-ds='close-button'][data-part='close']` (Alert.css and Banner.css,
   the solid emphasis blocks).
2. **DECISIONS.md**: record that private properties may carry a
   `-tone-*` group and part names (`-icon`, `-edge`, `-title-fg`) beyond
   the rule 1 list, as Toast, Alert, Callout and Banner do.
3. **Motion catalog (1.11)**: Alert and Banner name `fade-rise`. Their CSS
   keyframes (`ds-alert-in`, `ds-banner-in`) can move to the catalog
   helper once it exists.
4. **Tokens**: the gaps above.

## What I could not do

- Read GoBanana (`.st-alert`, the Arabic copy cookbook): not reachable in
  this session.
- Neutral and Liquid styles are not on this branch; the CSS uses tokens
  only, no recipes, so they should apply without changes.
