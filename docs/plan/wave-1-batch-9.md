# Wave 1, batch 9: data display A (12)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`. Starts when batch 8 is green.

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 1 | 9A People and labels | Avatar, AvatarGroup, Badge, Chip | batch 8 green |
| 1 | 9B Values | Kbd, Stat, DescriptionList, List | batch 8 green |
| 1 | 9C Containers | Card, Tile, Accordion, EmptyState | batch 8 green |

Slot 4 runs 1.14 CLI and 1.18 Consumers.

## 1.9.1 Avatar

- Goal: a person or a workspace as an image, initials or an icon.
- Behavior: Radix Avatar (image with fallback after a delay).
- Anatomy: root (`data-ds="avatar"`), `image`, `fallback`, `status` (a
  StatusDot root carrying `data-part="status"`).
- Axes: size (`xs`, `sm`, `md`, `lg`), shape (`default` circle, `square`).
- States: `data-state` (`loading`, `loaded`, `error`).
- Keys: none (not focusable unless wrapped in a link or button).
- Shared: `packages/shared/src/initials.ts`: initials for Latin and Arabic
  names (first letters of the first and last word, no diacritics), a stable
  tone index from the name.
- Read: GB desktop/`MailApp.tsx` (`.mail-avatar`), GB `banana-server/app/(site)/[locale]/(pages)/(home)/account/AccountWindow.tsx`.
- Owns: standard set for Avatar, `packages/shared/src/initials.ts`.
- Depends: none.
- Accept: checklist; the name is the `alt`, or the image is decorative when
  the name is next to it; fallback contrast 4.5:1.

## 1.9.2 AvatarGroup

- Goal: a few overlapping avatars with a "+N" count.
- Behavior: hand built.
- Anatomy: root (`data-ds="avatar-group"`), avatars carrying
  `data-part="item"`, `overflow` (count).
- Axes: size (to items).
- States: none.
- Keys: none; the overflow can be a Button that opens a Popover list.
- Read: no source: design from the dials table and the nearest existing
  component (Avatar).
- Owns: standard set for AvatarGroup.
- Depends: 1.9.1 (same lane).
- Accept: checklist; overlap direction flips in RTL; the group has a label
  ("5 people").

## 1.9.3 Badge

- Goal: a small count or status label attached to something (unread 3,
  Beta).
- Behavior: hand built; not interactive.
- Anatomy: root (`data-ds="badge"`), `icon`, `label`.
- Axes: tone, emphasis (`solid`, `soft`, `outline`), size (`xs`, `sm`).
- States: `data-dot` (dot only form with a hidden label).
- Keys: none.
- Read: GB `banana-server/app/(site)/[locale]/(pages)/(home)/canvases/dashboard.css`
  (badge), GB site/`SiteNav.tsx` (badge inside a link), FK2 `TagPill/`.
- Owns: standard set for Badge.
- Depends: 1.9.2 (same lane).
- Accept: checklist; counts over 99 show "99+" with the full number in the
  name; `insteadUse` points interactive tags to Chip.

## 1.9.4 Chip

- Goal: a compact pressable or removable token (a filter, an attribute).
- Behavior: hand built; pressable form on ButtonBase, removable form with a
  CloseButton.
- Anatomy: root (`data-ds="chip"`), `icon`, `label`, `remove` (a CloseButton
  root).
- Axes: size (`xs`, `sm`, `md`), tone, emphasis (`soft`, `outline`), shape
  (`pill` default).
- States: `data-selected`, `data-disabled`.
- Keys: Enter and Space press; Delete and Backspace remove when removable.
- Read: GB css lines 903 to 972 (`.st-chip`), FK2 `TagPill/` (all files), GB
  admin/`ui.tsx` (`Chip`).
- Owns: standard set for Chip.
- Depends: 1.9.3 (same lane).
- Accept: checklist; remove has a name ("Remove filter Arabic"); a chip and
  its remove are two targets of 24px.

## 1.9.5 Kbd

- Goal: a key or a shortcut shown as keycaps.
- Behavior: hand built `kbd` elements.
- Anatomy: root (`data-ds="kbd"`), `key` (repeated), `separator`.
- Axes: size (`xs`, `sm`, `md`).
- States: none.
- Keys: none.
- Shared: `packages/shared/src/shortcut.ts`: split a shortcut string, map Mod
  to Cmd or Ctrl by platform (passed in, no `navigator` at module scope),
  spoken names for screen readers.
- Read: GB studio/`Kbd.tsx`, GB studio/`shortcutKeys.ts`, GB css lines 859 to
  901, FK2 `Kbd/` (all files, `splitShortcut.ts`).
- Owns: standard set for Kbd, `packages/shared/src/shortcut.ts`.
- Depends: none.
- Accept: checklist; shortcuts read LTR inside Arabic (`Bidi`); report the
  exact change for Tooltip and DropdownMenu to render Kbd in their
  `shortcut` part.

## 1.9.6 Stat

- Goal: one number with its label, change and a short hint (a KPI).
- Behavior: hand built.
- Anatomy: root (`data-ds="stat"`), `label`, `value`, `delta` (icon plus
  text), `hint`, `icon`.
- Axes: size (`sm`, `md`, `lg`), tone of the delta (`success`, `danger`,
  `neutral`).
- States: `data-trend` (`up`, `down`, `flat`), `data-loading`.
- Keys: none.
- Read: GB admin/`ui.tsx` (`StatTile`, line 138).
- Owns: standard set for Stat.
- Depends: 1.9.5 (same lane), `number.ts`.
- Accept: checklist; the trend in words too ("up 12 percent"), never color
  alone; `number-roll` motion with a reduced form; numbers through
  `number.ts`.

## 1.9.7 List

- Goal: a vertical list of rows with optional start, end, description and
  actions (not a selection list; that is ListBox).
- Behavior: hand built `ul` or `ol`; rows can be links or hold actions.
- Anatomy: root (`data-ds="list"`), `item`, `start`, `title`,
  `description`, `end`, `actions`, `separator`, `empty`.
- Axes: size (`sm`, `md`), `data-variant` (`plain`, `divided`, `inset`).
- States: items `data-active`, `data-disabled`.
- Keys: Tab through interactive rows and actions.
- Read: GB desktop/`MailApp.tsx`, FK2 `WidgetList/`, FK2 `PropertyList/`.
- Owns: standard set for List.
- Depends: 1.9.8 (same lane).
- Accept: checklist; row height from `list.row.height`; `insteadUse` points
  selection to ListBox and tabular data to Table (wave 2).

## 1.9.8 DescriptionList

- Goal: term and value pairs (details of an order, settings summary).
- Behavior: hand built `dl`.
- Anatomy: root (`data-ds="description-list"`), `item`, `term`, `details`.
- Axes: size (`sm`, `md`), `data-orientation` (`horizontal`, `vertical`).
- States: none.
- Keys: none.
- Read: FK2 `PropertyList/`, FK2 `ControlRow/`.
- Owns: standard set for DescriptionList.
- Depends: 1.9.6 (same lane).
- Accept: checklist; stacks under `breakpoint.phone`; long Arabic values
  wrap.

## 1.9.9 Card

- Goal: a bordered or raised container for one item with header, body,
  footer and an optional media part.
- Behavior: hand built; a whole card link uses one real link and a
  stretched target, never nested interactive elements inside a link.
- Anatomy: root (`data-ds="card"`), `media`, `header`, `title`,
  `description`, `body`, `footer`, `actions`.
- Axes: emphasis (`outline`, `soft`, `solid` as elevation through tokens),
  size (`sm`, `md`, `lg` as padding).
- States: `data-interactive`, `data-selected`, `data-disabled`.
- Keys: Tab to the link and actions.
- Read: FK2 `Card/` (all files), FK2 `Widget/`.
- Owns: standard set for Card.
- Depends: none.
- Accept: checklist; `insteadUse` points Studio grids to Tile; hover lift
  uses `transform` only.

## 1.9.10 Tile

- Goal: the borderless card of Studio split by a 1px gap, in a tile grid.
- Behavior: hand built.
- Anatomy: root (`data-ds="tile"`), `media`, `title`, `meta`, `actions`.
- Axes: size (`sm`, `md`).
- States: `data-interactive`, `data-selected`.
- Keys: as Card.
- Read: GB css lines 974 to 1066 (`.st-tile-grid`, `.st-tile`,
  `.st-tile-title`).
- Owns: standard set for Tile.
- Depends: 1.9.9 (same lane).
- Accept: checklist; the 1px gap shows the parent surface (Studio dial 4);
  in other styles it reads as a card with the style's separation.

## 1.9.11 Accordion

- Goal: stacked sections that open and close.
- Behavior: Radix Accordion (single or multiple).
- Anatomy: root (`data-ds="accordion"`), `item`, `header`, `trigger`,
  `icon` (chevron-down), `content`.
- Axes: size (`sm`, `md`), `data-variant` (`plain`, `divided`, `card`).
- States: items `data-state` (`open`, `closed`), `data-disabled`;
  root `data-orientation`.
- Keys: Enter and Space toggle; ArrowDown and ArrowUp move between
  triggers; Home and End.
- Read: GB desktop/`MailApp.tsx` (accordion rows), GB css lines 1093 to 1135
  (`.st-section-toggle`).
- Owns: standard set for Accordion.
- Depends: 1.9.10 (same lane).
- Accept: checklist; `accordion-height` motion (transform and opacity only);
  heading level is a prop.

## 1.9.12 EmptyState

- Goal: a place with no content yet that says what to do next.
- Behavior: hand built; the same anatomy as ErrorState (1.5.11).
- Anatomy: root (`data-ds="empty-state"`), `icon`, `title`, `body`,
  `actions`.
- Axes: size (`sm`, `md`, `lg`).
- States: none.
- Keys: Tab reaches the actions.
- Read: GB css lines 1247 to 1289 (`.st-empty`), FK2 `EmptyState/` (all
  files), GB admin/`ui.tsx` (`Empty`).
- Owns: standard set for EmptyState.
- Depends: 1.9.11 (same lane), 1.5.11.
- Accept: checklist; copy says what to do next and names the mechanism; the
  first action is a Button with a verb and a noun.
