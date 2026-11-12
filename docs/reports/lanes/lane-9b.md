# Lane 9B report: Values

Branch `claude/ds-lane-9b`, from `claude/relaxed-hypatia-7gseap` at
`adf1833`. Orders 1.9.5 Kbd, 1.9.6 Stat, 1.9.8 DescriptionList and 1.9.7
List, built in the lane's order. All four are done.

| Order | Component | Commits | check | contract (react) |
| --- | --- | --- | --- | --- |
| 1.9.5 | Kbd | `wo-1.9.5: Kbd`, `wo-1.9.5: Kbd review fixes` | green | 20 passed, 1 skipped (keyboard map: no keys) |
| 1.9.6 | Stat | `wo-1.9.6: Stat`, `wo-1.9.6: Stat review fixes` | green | 20 passed, 1 skipped (keyboard map: no keys) |
| 1.9.8 | DescriptionList | `wo-1.9.8: DescriptionList`, `wo-1.9.8: DescriptionList review fixes` | green | 20 passed, 1 skipped (keyboard map: no keys) |
| 1.9.7 | List | `wo-1.9.7: List`, `wo-1.9.7: List review fixes` | green | 21 passed |

The contract runs cover anatomy, variant and state attributes, the keyboard
map, target size in every style and density, reflow at 320px, and axe in
Studio and Desk, dark and light, en LTR and ar RTL.

Screenshots: `docs/reports/shots/wave-1/{kbd,stat,description-list,list}/`,
in studio dark, studio light, desk dark, desk light, and desk dark with
`dir=rtl&lang=ar`, at 1100px. DescriptionList and List also have
`phone-<case>-{ltr,rtl}.png` shots at 320px. Each phone page measured a
`scrollWidth` of 320: nothing scrolls sideways.

Generated files (barrels, `packages/css/src/index.css`, `routes.gen.ts`,
`manifests.gen.json`, `packages/shared/src/index.ts`) were refreshed with
`npm run gen` and committed as generated. Regenerate them on merge.

## Setup notes

- `npm install` and the first `npm run check` were green before any change.
- GoBanana could not be attached in this session (the request was denied),
  so no GoBanana file was read: not `Kbd.tsx`, `shortcutKeys.ts`, the GB css
  lines, admin `StatTile` or `MailApp.tsx`. Each component follows
  Figma-Killer-2 (cloned with `GIT_LFS_SKIP_SMUDGE=1`; nothing under
  `vendor/alm-design-system` was read), the dials table and the existing
  tokens. Each file header says so. Compare against GoBanana before Gate 1.
- Every review ran as a ds-qa subagent on claude-opus-5-5 at medium effort.

---

## 1.9.5 Kbd

A key or a shortcut drawn as keycaps, with the key names spoken to screen
readers. Shared logic lives in `packages/shared/src/shortcut.ts`.

```ts
type KbdSize = 'xs' | 'sm' | 'md';

interface KbdProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  children: ReactNode;           // 'Mod+K', 'Ctrl+Shift+P', '⌘⇧P', 'Esc', 'Ctrl++', or a node (one keycap)
  size?: KbdSize;                // default 'md': 16, 20, 24 px tall
  platform?: 'mac' | 'other';    // default: iOS Theme gives mac, else the user agent after hydration; the server draws other
  label?: string;                // what screen readers say instead of the spoken names
  decorative?: boolean;          // default false: aria-hidden root, no spoken copy
  separator?: string;            // default '+' on other, '' on mac
  ref?: Ref<HTMLElement>;
}
function useKeyboardPlatform(platform?: KeyboardPlatform): KeyboardPlatform;

// @the-system/shared (shortcut.ts), re-exported from the Kbd barrel
splitShortcut(s): string[];
resolveKey(key, platform): ShortcutKey;            // { label, spoken, modifier }
shortcutKeys(s, platform): ShortcutKey[];          // Mac: modifiers in Apple order ⌃⌥⇧⌘
spokenShortcut(s, platform): string;               // 'Control Shift P'
formatShortcut(s, platform): string;               // '⇧⌘P' or 'Ctrl+Shift+P'
ariaKeyShortcuts(s, platform): string;             // 'Meta+Shift+P', for aria-keyshortcuts
keyboardPlatformFrom(userAgent): 'mac' | 'other';
isModifier(key): boolean;
```

DOM: `<kbd data-ds="kbd" data-size dir="ltr">` holds one `<kbd data-part="key"
aria-hidden="true">` per key, `<span data-part="separator" aria-hidden>`
between them, and a visually hidden `<span data-part="spoken" lang="en">`.

Decisions:

- **Anatomy adds `spoken`.** The order lists root, key and separator. Each
  keycap is hidden from assistive tech and one hidden span says the whole
  shortcut, so a screen reader says "Control Shift P" and not "C T R L
  plus". An `aria-label` on a `kbd` is not reliable: the element has a
  generic role.
- **Default spoken names are English and carry `lang="en"`.** I did not
  invent Arabic key names. `label` overrides them. A tested Arabic table
  for `spokenShortcut` is open (below).
- **Platform** is passed in. Nothing reads `navigator` at module scope. The
  React hook uses `useSyncExternalStore` with an `other` server snapshot,
  so hydration matches, and switches to `mac` on the client when the user
  agent says so. Theme `platform="ios"` means mac.
- Mac draws symbols with no separator, `other` draws names joined by `+`,
  as each platform prints shortcuts. Mac modifiers are put in Apple order.
- The plus key: `Ctrl++`, `⌘+`, `Ctrl+Plus` and a lone `+`. Plus is the
  only separator: `Ctrl K` with a space is one keycap.
- No hover or press from FK2: a keycap is text, not a control. No motion.
  The manifest names no `motion`, because the order names none.
- RTL: the root is `dir="ltr"` with `unicode-bidi: isolate`, so keys read
  Ctrl then K inside Arabic and do not move the sentence punctuation. You
  can see this in `desk-dark-rtl.png` and the long-arabic case.
- Depth from the `kbd.*` tokens. The shadow offsets use
  `border.width.default` and `border.width.strong`, so no raw px is needed.
  Forced colors drops the gradient and the shadow and keeps a CanvasText
  border.

### Tooltip and DropdownMenu: the exact change (order accept line)

Neither component exists on this branch. When they land (1.6.6 Tooltip,
1.6.8 DropdownMenu), their `shortcut` part should be a Kbd root carrying the
parent part, per anatomy.md ("a nested system component keeps its own
`data-ds` and carries the parent's `data-part`"):

```tsx
// DropdownMenuItem, inside the item, after the label
import { Kbd, ariaKeyShortcuts, useKeyboardPlatform } from '../Kbd';

const platform = useKeyboardPlatform();
<RadixDropdownMenu.Item aria-keyshortcuts={shortcut ? ariaKeyShortcuts(shortcut, platform) : undefined} ...>
  ...label...
  {shortcut && <Kbd data-part="shortcut" size="xs" platform={platform} decorative>{shortcut}</Kbd>}
</RadixDropdownMenu.Item>

// Tooltip content, after the text
{shortcut && <Kbd data-part="shortcut" size="xs" decorative={false}>{shortcut}</Kbd>}
```

- Menu items: `decorative`, so the shortcut is spoken once through
  `aria-keyshortcuts`. The prop is `shortcut?: string` in the Kbd string
  form (`Mod+K`).
- Tooltip: not decorative. The tooltip text is the accessible description,
  and the spoken names belong in it.
- Manifests: `slots.shortcut.accepts: ["Kbd"]`, `max: 1`.
- CSS in `DropdownMenu.css` and `Tooltip.css`: push the shortcut to the end
  with `[data-ds='dropdown-menu'] [data-part='item'] > [data-ds='kbd'][data-part='shortcut'] { margin-inline-start: auto; }`.
  Restyle it only through `--_kbd-*` (for example
  `--_kbd-fg: var(--ds-color-text-muted)`).

### Review findings

Fixed:

- Trailing plus lost (`⌘+`, `Ctrl+`).
- A node keycap with no label was hidden and silent. It now stays readable.
- English spoken names on Arabic pages now carry `lang="en"`.
- `line-height: 1` replaced with `font.leading.tight`.
- Separator color moved to `--_kbd-separator-fg`.
- Mac modifiers put in Apple order.

Left open:

- md is 24px, not the 32px of anatomy rule 12. A keycap is inline text, not
  a control. The lead should record the exception or add `kbd.height.*`
  tokens.
- `--_kbd-face-top`, `--_kbd-face-bottom` and `--_kbd-shadow` are outside
  the private names listed in rule 1. They are needed for the two stop face
  and the depth stack.
- ⇧ and ⌥ draw small at xs in the mono font.
- No SSR hydration test.

---

## 1.9.6 Stat

```ts
type StatSize = 'sm' | 'md' | 'lg';
type StatTone = 'success' | 'danger' | 'neutral';
type StatTrend = 'up' | 'down' | 'flat';

interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label: ReactNode;
  value?: number | ReactNode;               // a number goes through Intl, Western digits
  format?: Intl.NumberFormatOptions;
  delta?: number | ReactNode;               // a number sets the trend; shown as |delta| in deltaFormat
  deltaFormat?: Intl.NumberFormatOptions;   // default { style: 'percent', maximumFractionDigits: 1 }
  trend?: StatTrend;                        // default from the sign, as shown (0.0004 as a percent is flat)
  tone?: StatTone;                          // default up success, down danger, flat neutral
  hint?: ReactNode;
  icon?: IconName | ReactElement;           // decorative, at the end of the label line
  size?: StatSize;                          // default 'md': value font.size 2xl, 4xl, 6xl
  loading?: boolean;                        // placeholder block, aria-busy, data-loading, no change
  loadingLabel?: string;                    // default 'Loading' or 'جار التحميل'
  trendLabels?: Partial<Record<StatTrend, string>>;
  ref?: Ref<HTMLDivElement>;
}
const statTrendLabels: { en: {...}; ar: { up: 'ارتفاع'; down: 'انخفاض'; flat: 'بدون تغيير' } };
```

Decisions:

- **Never color alone:** the change shows an arrow icon (`trend-up`,
  `trend-down`, `minus`) and a visually hidden word, so a screen reader hears
  "Up 12%". Tone is a separate prop for metrics where down is good.
- **`number.ts` is missing** (order 1.2.5 owns it). Stat uses a private
  `formatStatNumber.ts` (Intl, `<lang>-u-nu-latn` for Western digits). Swap
  it for `formatNumber` when number.ts lands.
- Intl joins the currency or unit with a no-break space, which makes the
  value one word that broke mid digits in narrow tiles. `breakableValue`
  turns only that space (next to a non digit) into a normal space. Digit
  group spaces (fr) stay.
- **number-roll** is played through the Web Animations API on
  `duration.roll` and `ease.reveal`, read with `readDuration` and
  `readEasing` from `@the-system/motion`. It runs only when a numeric value
  changes after the first paint, uses opacity only under reduced motion,
  and never waits on animationend. Value changes are not announced.
- No surface of its own: a Card or Tile frames it.
- **`data-trend`** (up, down, flat) is on the root but not in manifest
  `states`, because the contract suite treats every `data-*` there as
  boolean. See "Changes needed from the lead".
- Arabic: label and hint one font step up, no display tracking on the value.

### Review findings

Fixed:

- `align-content: start`, so stretched grid cells do not spread the rows.
- Loading now swaps `--_stat-value-*` properties (rule 2).
- The trend is taken from the delta as shown.
- A NaN or infinite delta is not drawn.
- Manifest prop types corrected (`object`, number or node), and the token
  path `font.leading.arabic.snug` fixed.
- The unit space no longer touches fr digit groups.
- The Arabic unit uses `unitDisplay: 'long'`.
- Demo storage copy fixed.
- Arabic small text one step up.

Left open:

- `icon` instead of the `end` name of rule 6. The order names the part
  `icon`.
- The icon sits at the inline end of the label line. That is a KPI tile
  convention, but it reads as far away in a wide cell.
- The loading label is inside the `aria-busy` root. Check with NVDA.
- `trend-up` and `trend-down` do not mirror in RTL. I treat them as chart
  glyphs, and the word carries the meaning.
- A node delta without `trend` draws no icon and no word, and gives no
  dev warning.
- No SSR test for Intl output between Node and the browser.

---

## 1.9.8 DescriptionList

```ts
type DescriptionListSize = 'sm' | 'md';
type DescriptionListOrientation = 'horizontal' | 'vertical';

interface DescriptionListEntry { key?: string; term: ReactNode; details: ReactNode | readonly ReactNode[] }

interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, 'title'> {
  orientation?: DescriptionListOrientation;  // default 'horizontal'
  size?: DescriptionListSize;                // default 'md'
  items?: readonly DescriptionListEntry[];   // rendered before children
  children?: ReactNode;                      // DescriptionListItem elements
  ref?: Ref<HTMLDListElement>;
}
interface DescriptionListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  term: ReactNode;
  children?: ReactNode;                      // the value
  details?: readonly ReactNode[];            // several values, one dd each; an empty array falls back to children
  ref?: Ref<HTMLDivElement>;
}
```

Decisions:

- `dl > div[data-part=item] > dt + dd`. HTML allows div groups inside `dl`.
- Horizontal layout: the root is a two column grid and each item is a
  subgrid row, so terms line up. The term column is
  `fit-content(40%)`. Extra dd values go in column 2.
- Under `breakpoint.phone` (`@media (width < 30rem) /* breakpoint.phone */`,
  as Dialog does) every item stacks. The stack follows the viewport, not
  the list's width. In a narrow desktop panel, use `vertical`. Proved by
  `phone-many-*.png`.
- Values wrap anywhere. A long Arabic address wraps in
  `phone-long-arabic-rtl.png`.
- Latin codes inside Arabic values go through `Bidi` in the demo.
- No motion: the manifest names none.

### Review findings

Fixed:

- Token path `font.leading.arabic.normal`.
- `items` typed `object`, and it takes several values.
- `details={[]}` no longer leaves a dt without a dd.
- Terms wrap anywhere.
- `--_description-list-pair-gap` added, with a wider gap between pairs
  when vertical.
- Arabic sm one step up.
- `align-content: start`.
- Manifest announce and native role made honest.
- Phone shots added.

Left open: none.

---

## 1.9.7 List

```ts
type ListSize = 'sm' | 'md';
type ListVariant = 'plain' | 'divided' | 'inset';
type ListSlotContent = IconName | ReactElement;

interface ListProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  size?: ListSize;           // default 'md'
  variant?: ListVariant;     // default 'plain'
  ordered?: boolean;         // default false: ul; true: ol
  empty?: ReactNode;         // shown when there are no rows; the root is then a div
  children?: ReactNode;      // ListItem elements
  ref?: Ref<HTMLElement>;
}
interface ListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;   // up to two lines
  start?: ListSlotContent;
  end?: ReactNode;           // a time, a count, a Badge
  actions?: ReactNode;       // Buttons or IconButtons
  href?: string;             // the title becomes the row link
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'title' | 'children'>;
  active?: boolean;          // default false: data-active, aria-current
  disabled?: boolean;        // default false: data-disabled, no href, focusable with aria-disabled, click stopped
  ref?: Ref<HTMLLIElement>;
}
```

Decisions:

- **Row height** from `list.row.height`: sm rows are the token, and md rows
  are the token plus two `space.2xs`, at least.
- **Linked rows:** the title anchor's `::before` stretches over the row. It
  is the hit area. The focus ring is an outline drawn inside the row while
  the link has focus. Actions come later in the DOM and are positioned, so they paint
  above the link with no z-index. Each row is one Tab stop, then its
  actions. There are no arrow keys: this is not a composite widget, and
  `insteadUse` points selection to ListBox.
- **Hover** swaps the row fill (`--_list-item-bg`) instead of drawing a
  `::after` veil, which would cover the text and the actions.
- **The separator** is a hidden span in each row, shown for `divided` and
  `inset` from the second row on. A separator `li` would break `ul`
  semantics (axe `list`).
- **An empty list** renders a div with `p[data-part=empty]`, not a list of
  one.
- **Axe fixes:** an active row lifts its description and end to the default
  text color (muted text on the inset active fill was 4.24:1). A disabled
  row dims only start and title. Dimmed description text failed 4.5:1, and
  the description often says why the row is off.
- `role="list"` is set again, because `list-style: none` drops the role in
  Safari and VoiceOver.
- `data-variant` is a component attribute, not a shared axis. `data-linked`
  is a CSS hook for linked rows, not a state.
- The manifest names `list-stagger` from the 1.11 list and states that the
  component plays no motion yet.

### Review findings

Fixed:

- A disabled row no longer runs `linkProps.onClick`: the click is stopped.
- Per anatomy rule 5, the disabled link stays focusable (`tabIndex` 0,
  `role="link"`, `aria-disabled`), with tests.
- `end` is positioned above the row link, so a link or Badge in it can be
  clicked.
- The focus ring is now an outline inside the row (`color.focus.ring`). The
  next row can no longer cover its bottom edge.
- An active row with no link carries `aria-current` on the `li`.
- A labelled empty list takes `role="group"`. The demo drops the label on
  the empty div.
- `data-linked` was moved out of `states`. It is structure.
- `insteadUse` now points navigation to Sidebar (1.7.2).
- A Space key entry, and Arabic content guidance for description and
  actions.
- The Arabic action label now names the action: "عرض خيارات مراجعة الدليل".
- Tests for role list on `ol`, the empty case with and without a label, and
  the disabled link.

Left open:

- md rows are `list.row.height` plus two `space.2xs` (about 36px), not 32px.
  The token is the sm row. Record it, or add a token (see token gaps).
- `ordered` draws no numbers. The manifest says to put a number in `start`
  when people need to see it.
- Empty detection counts direct children only. A wrapper component that
  renders no rows counts as one row. This is documented on `children`.

---

## Token gaps

- `kbd.height.xs|sm|md`: Kbd uses `size.icon.md`, a calc, and
  `size.icon.lg`.
- `stat.value.font-size.*`: Stat uses `font.size.2xl`, `4xl` and `6xl`
  directly.
- `list.row.height` has one value per density. An sm and md pair, or a
  `list.row.inset` token, would replace the calc in List.
- There is no `skeleton` token for a loading block. Stat uses
  `color.bg.overlay-10`.

## Changes needed from the lead

1. **Contract suite, valued state attributes.**
   `packages/contract-tests/src/lib.ts:58`:

   ```ts
   // before
   const VALUED_STATES = new Set(['data-state', 'data-orientation']);
   // after
   const VALUED_STATES = new Set(['data-state', 'data-orientation', 'data-trend', 'data-variant', 'data-side']);
   ```

   Or better, a manifest way to declare valued states. After that, add
   `data-trend` to `Stat.manifest.json` `states`. Toast's `data-swipe` has
   the same problem and passes today only because no swipe happens during
   the scan.

2. **DECISIONS.md:** Kbd's md is 24px, an exception to anatomy rule 12
   (inline text, not a control). Also, `--_kbd-face-top`,
   `--_kbd-face-bottom`, `--_kbd-shadow`, `--_stat-value-*`,
   `--_list-item-bg-*` and `--_description-list-pair-gap` extend the
   private names of rule 1.

3. **After 1.2.5 merges:** replace
   `packages/react/src/components/Stat/formatStatNumber.ts` with
   `formatNumber` from `packages/shared/src/number.ts`. Keep
   `breakableValue` in Stat.

4. **After 1.11 merges:** check that `number-roll` and `list-stagger` are in
   the catalog. Then move Stat's roll keyframes into the pattern, and call
   its `animate()` helper in `useRollOnChange`.

5. **Tooltip and DropdownMenu** (1.6.6, 1.6.8): render the shortcut part as
   given in the Kbd section above.

6. **Icons:** decide whether `trend-up` and `trend-down` go on the mirror
   list in `packages/icons/src/names.ts`. Today they do not mirror.

## Could not do

- Read the GoBanana sources (the repo could not be attached). Kbd, Stat and
  List follow FK2 and the tokens, not GoBanana.
- Arabic spoken key names for `spokenShortcut`. I would not invent them
  without a tested table.
- Check the neutral style: `packages/styles/neutral` is not on this
  branch. Every rule uses tokens, with no recipe.
