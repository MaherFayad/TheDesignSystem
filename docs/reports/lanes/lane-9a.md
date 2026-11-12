# Lane 9A: People and labels

Batch file: `docs/plan/wave-1-batch-9.md`. Branch: `claude/ds-lane-9a`.
Orders: 1.9.1 Avatar, 1.9.2 AvatarGroup, 1.9.3 Badge, 1.9.4 Chip. All four
are built, green and pushed.

| Order | Component | Commits | `npm run check` | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.9.1 | Avatar | `bb7dc8e` | pass | 20 passed, 1 skipped (keyboard map: no keys) |
| 1.9.2 | AvatarGroup | `31af597`, `a6e77aa` (review fixes) | pass | 21 passed |
| 1.9.3 | Badge | `4cf42c8`, `296cbcd` (review fixes) | pass | 20 passed, 1 skipped (keyboard map: no keys) |
| 1.9.4 | Chip | `1566278`, `3dbe95e` (review fixes) | pass | 21 passed |

The Avatar review fixes went into `bb7dc8e` before it was committed. The
generated files (barrels, `routes.gen.ts`, `manifests.gen.json`,
`packages/css/src/index.css`, `packages/shared/src/index.ts`) were refreshed
with `npm run gen` and committed as generated. Regenerate them on merge.

Screenshots: `docs/reports/shots/wave-1/{avatar,avatar-group,badge,chip}/`,
in studio dark, studio light, desk dark, desk light and desk dark rtl ar.

## Sources

GoBanana could not be read: adding the private repo to this session was
refused. Every GoBanana path in the four orders (`.mail-avatar`,
AccountWindow, dashboard.css, SiteNav.tsx, `.st-chip`, admin `Chip`) is
unread. I designed from Figma-Killer-2 `TagPill/` (all files), the dials
table in PLAN.md 3.7, and Button. Each component file and manifest says so.
A pass against the GoBanana values is worth doing once a session can read it.

## Files touched

- `packages/shared/src/initials.ts`, `initials.test.ts`
- `packages/react/src/components/{Avatar,AvatarGroup,Badge,Chip}/**`
- `packages/css/src/components/{Avatar,AvatarGroup,Badge,Chip}.css`
- `packages/manifest/src/component/{Avatar,AvatarGroup,Badge,Chip}.manifest.json`
- `docs/reports/shots/wave-1/{avatar,avatar-group,badge,chip}/*.png`
- Generated: `packages/react/src/index.ts`, `packages/shared/src/index.ts`,
  `packages/css/src/index.css`, `packages/manifest/manifests.gen.json`,
  `apps/gallery-react/src/routes.gen.ts`
- This report.

No recipes: tokens expressed every difference between Studio and Desk.

## 1.9.1 Avatar

A person or a workspace as an image, initials or an icon, on Radix Avatar.
Anatomy: root (`data-ds="avatar"`, `role="img"`), `image`, `fallback`,
`status`. `data-state` is `loading`, `loaded` or `error`, stamped only when
there is a `src`.

```ts
interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children'> {
  name: string;                       // accessible name, initials, hue
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';   // default 'md', from size.control
  shape?: 'default' | 'square';       // default 'default' (circle)
  icon?: IconName | ReactElement;     // fallback in place of initials
  decorative?: boolean;               // default false; aria-hidden when the name is next to it
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  statusLabel?: string;               // default Online, Away, Busy, Offline
  fallbackDelay?: number;             // default 600 with src
  onStateChange?: (state: 'loading' | 'loaded' | 'error') => void;
  ref?: Ref<HTMLSpanElement>;
}
```

`packages/shared/src/initials.ts`: `initials(name)`, `toneIndex(name, count = 10)`,
`stripDiacritics(name)`, `avatarToneCount`.

Decisions:

- The name is the alt: the root is `role="img"` with `aria-label={name}`
  (plus the status words), the `img` inside has `alt=""` and the fallback is
  `aria-hidden`. The name is read once whether the image or the initials
  show, and a broken image never leaves an unnamed picture.
- Fallback colors: the solid hue `color.accent.<n>` with
  `color.text.on-accent`. A tint with the hue as text failed 4.5:1 in light
  (accent 1 and 8, 4.37 to 4.46). A test in `Avatar.test.tsx` reads
  `tokens.css` and checks all ten hues in every style and scheme block.
- The hue is set inline as `--_avatar-hue: var(--ds-color-accent-<n>)`, so
  Angular can bind the same style.
- Initials: first letters of the first and last word. Arabic: diacritics,
  tatweel removed; the article ال skipped on a family name (also on a single
  word); "عبد" joined to the next word; the two letters split by a zero width
  non joiner so they do not join. The hue key also folds أ إ آ to ا.
- Status is a plain span with `data-part="status"` and `data-tone`, drawn by
  Avatar.css, because StatusDot (1.5.10) does not exist. Offline is a hollow
  ring; online, away and busy differ by color only, and the words are in the
  accessible name. `decorative` hides the status words too (manifest note).
- Motion `fade-rise`: the image fades in and rises 2px with
  `@starting-style`; none under reduced motion.

## 1.9.2 AvatarGroup

```ts
interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  label: string;                       // "5 people", the group name
  children: ReactNode;                 // Avatar elements
  size?: 'xs' | 'sm' | 'md' | 'lg';    // default 'md'; set on every item
  max?: number;                        // default 4
  total?: number;                      // server count, default children count
  overflowLabel?: (hidden: number) => string;  // default `${n} more`
  onOverflowClick?: (event: MouseEvent<HTMLButtonElement>) => void;  // count becomes a Button
  ref?: Ref<HTMLDivElement>;
}
```

Decisions:

- `role="group"` named by `label`. Items get `size` and `data-part="item"`
  through `cloneElement`, so pass only Avatars.
- Overlap is `margin-inline-start` on every item after the first, so it
  flips in RTL. Each item gets a cutout ring through Avatar's private
  `--_avatar-ring`.
- The count is `role="img"` named by `overflowLabel` with the visible `+N`
  hidden, or, with `onOverflowClick`, a system Button (`data-ds="button"
  data-part="overflow"`) named `+N, N more`, so the name starts with the
  visible text (WCAG 2.5.3). The count is isolated as LTR (`<bdi dir="ltr">`)
  so it reads `+3` in Arabic too.
- The Popover list behind the count waits for Popover.

## 1.9.3 Badge

```ts
interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title'> {
  children?: ReactNode;                // visible label
  count?: number;                      // shown in place of the label
  max?: number;                        // default 99; over it shows "99+"
  countLabel?: (count: number) => string;  // words for assistive tech
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';  // default 'neutral'
  emphasis?: 'solid' | 'soft' | 'outline';  // default 'soft'
  size?: 'xs' | 'sm';                  // default 'sm'
  start?: IconName | ReactElement;     // drawn in the icon part
  dot?: boolean;                       // default false; data-dot, label visually hidden
  ref?: Ref<HTMLSpanElement>;
}
export function formatBadgeCount(count: number, max?: number): string;
```

Decisions:

- Default size `sm`, not `md`: the order lists only xs and sm, and a badge
  is not a control. Heights are about 16 and 20px at default density,
  computed from `size.control.xs` minus a space token (see token gaps).
- Over max: the visible `99+` is `aria-hidden` and the full number (or the
  `countLabel` words) is in Radix `VisuallyHidden`. The count is isolated LTR
  so `99+` keeps its order in Arabic.
- A dot takes the solid fill of its tone; the accent dot takes
  `color.primary.on-surface` because Studio's primary fill is a dark step
  that a dot on the page loses.
- No role, not focusable. `insteadUse` points interactive tags to Chip.

## 1.9.4 Chip

```ts
interface ChipCommonProps {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md';           // default 'md'
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';  // default 'neutral'
  emphasis?: 'soft' | 'outline';       // default 'soft'
  shape?: 'pill';                      // default 'pill'
  start?: IconName | ReactElement;     // drawn in the icon part
  disabled?: boolean;                  // default false; aria-disabled, stays focusable
}
// Pressable: the root is the button (ButtonBase).
interface ChipPressableProps extends ChipCommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, ...> {
  selected?: boolean;                  // set makes a toggle: aria-pressed, data-selected, check
  ref?: Ref<HTMLButtonElement>;
}
// Removable: the root is a span with a remove IconButton.
interface ChipRemovableProps extends ChipCommonProps, Omit<HTMLAttributes<HTMLSpanElement>, ...> {
  onRemove: (event) => void;           // click, Delete, Backspace on the remove button
  removeLabel?: string;                // default `Remove ${label}` for a text label
  ref?: Ref<HTMLSpanElement>;
}
type ChipProps = ChipPressableProps | ChipRemovableProps;
```

Decisions:

- A chip is pressable or removable, never both, so a button never sits
  inside a button. A chip that does neither is a Badge.
- Pressable root: `ButtonRoot` from `ButtonBase.tsx` with `ds="chip"` (a
  cast today, see the changes below). It inherits aria-disabled, the inert
  click guard and `asChild`.
- Removable: `data-removable` (a boolean state listed in the manifest). The
  remove part is an IconButton xs with the close icon (`data-ds="icon-button"
  data-part="remove"`), restyled through `--_button-*` only, until CloseButton
  (1.1.9) exists. The chip and its remove are two targets of 24px; an xs
  removable chip grows by its borders so the button fits.
- Selected shows the solid fill of its tone and a check, which replaces
  `start`, so selected never rests on color alone.
- Disabled dims only the controls: the pressable root, or the remove
  button. The label of a removable chip is text and keeps full contrast (axe
  failed on the dimmed span before).
- The demo moves focus after a removal to the next remove button, else the
  previous one, else a reset chip (`useLayoutEffect`). `contract.keys` hints
  check Delete and Backspace as `focus-moves` in the `many` case.

## Shared decisions across the lane

- Leading content is the prop `start` (anatomy rule 6), drawn in the part
  the order names, `icon`, on Badge and Chip. Avatar's `icon` is not leading
  content: it is the fallback picture, so it keeps the name.
- Private property names outside rule 1's list: `--_avatar-size`, `-hue`,
  `-status-size`, `-status-bg`, `-ring`; `--_avatar-group-size`, `-overlap`,
  `-ring`; `--_badge-dot`; `--_badge-tone-*` and `--_chip-tone-*` (as
  Button's `--_button-tone-*`). An avatar is a box, not a control with a
  height, and the hue, ring and dot have no word in the list.
- `motion` is `fade-rise` on all four, named from the 1.11 list. Only
  Avatar animates itself; the others name the pattern a caller uses when the
  item appears, said in each `frameworks.react.note`.
- `since` is `0.2.0` on the four new manifests (wave 1). Change it if the
  lead keeps `0.1.0` for the wave.
- Focus rings are a box shadow on the root, as in Button, not a `::before`
  layer; no `::after` veil, since every fill has a hover value.

## Token gaps

- Badge heights: no 16 and 20px tokens. Today `calc(size.control.xs -
  space.s)` and `calc(size.control.xs - space.2xs)`, which move a pixel or
  two with viewport and density. Proposal: `size.badge.xs` and
  `size.badge.sm` (or `badge.height.*` component tokens).
- Cutout ring color: avatars in a group and the status dot use
  `color.bg.surface`, which is not the page color in the gallery (the page is
  `bg.body`). Proposal: a component token `avatar.ring` per style, or a
  `--ds-color-bg-current` convention set by surfaces.
- Status dot sizes come from space tokens. Proposal: `size.status-dot.*`
  once StatusDot defines them.

## Review findings

One fresh eyes review per component (ds-qa, claude-opus-5-5, medium).

Fixed:

- Avatar: fallback contrast under 4.5:1 in light (blocker), now solid hue
  plus `text.on-accent` with a token test; the status claim "more than
  color" rewritten (blocker); `fade-rise` now rises as well as fades; the
  article skipped on one word and "عبد الله" kept together; mixed script
  initials upper cased; hamza folded in the hue key; xs status dot made
  larger; the decorative note added.
- AvatarGroup: manifest tokens (blocker); count Button name starts with
  `+N`; count Button colors and hover set through private properties so
  the order of files does not matter; Arabic plural for the count words;
  sizes described from size.control.
- AvatarGroup and Badge (from the shots): the count painted under
  positioned avatars; `+N` and `99+` flipped in RTL (now isolated LTR);
  overlap too deep for initials; accent dot invisible in Studio dark.
- Badge: `icon` renamed `start` (blocker, rule 6); label `unicode-bidi:
  plaintext`; negative counts read zero; Arabic dual agreement and the
  `n % 100` plural; a dot plus count test; height described honestly.
- Chip: selected with `start` lost its check (blocker); icon size follows
  chip size; the xs remove button overflowed the chip; forced colors for
  disabled selected; focus after removal moved to `useLayoutEffect`; remove
  names match the full label; فشلت to فاشلة; the too-many case now wraps.

Left open:

- Avatar has no `loading` demo case: a demo image that stays loading needs a
  network stall the gallery does not have. `loading` is covered by a unit
  test. A gallery route that never answers would allow it.
- Avatar status in Arabic: "بعيد" for Away was questioned; kept, as the
  common word in Arabic chat apps. Worth a copy check against the cookbook.
- Studio accent soft and outline chips and badges read close to neutral,
  and the accent solid is a gray step. That is Studio's neutral primary
  (dial 2), so no change.
- `overflow-x` and `overflow-y` on Badge and Chip labels, as in Button.css.
  The gate passes; a logical form (`overflow-inline`) is not yet supported
  everywhere.
- AvatarGroup has no RTL unit test; the overlap flip is shown in the
  `desk-dark-rtl.png` shot and comes from a logical property.

## Changes needed from the lead

1. `packages/react/src/components/Button/ButtonBase.tsx:79`
   - before: `ds: 'button' | 'icon-button';`
   - after: `ds: 'button' | 'icon-button' | 'chip';`
   - and line 152, before:
     `` throw new Error(`${ds === 'button' ? 'Button' : 'IconButton'} with asChild needs one element as its child.`); ``
     after:
     `` throw new Error(`${{ button: 'Button', 'icon-button': 'IconButton', chip: 'Chip' }[ds]} with asChild needs one element as its child.`); ``
   - then in `packages/react/src/components/Chip/Chip.tsx`, drop the cast
     `ds={'chip' as 'button'}` to `ds="chip"` and its comment.
2. When StatusDot (1.5.10) lands: Avatar's status part becomes a StatusDot
   root carrying `data-part="status"`; the `[data-part='status']` rules in
   `Avatar.css` move to StatusDot.css or become private property overrides.
3. When CloseButton (1.1.9) lands: Chip's remove part becomes a CloseButton
   root carrying `data-part="remove"`; keep the `--_button-*` overrides in
   `Chip.css` if CloseButton is styled in Button.css.
4. `DECISIONS.md`: record the extra private property names listed above,
   and "`start` drawn in an `icon` part" for Badge and Chip, so later orders
   with an `icon` part follow one rule.
5. When 1.11 lands: confirm `fade-rise` is the pattern for the four, and
   whether a `none` id should exist for components with no motion.

## Could not do

- Read GoBanana (access refused in this session).
- An Avatar `loading` demo case (see above).
- Neutral (1.10) is not merged here, so the four were not checked in it.
  They use tokens only, with no recipe.
