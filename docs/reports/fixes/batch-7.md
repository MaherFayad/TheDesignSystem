# Fixes: review of batch 7 and lane 9A

Branch `claude/ds-fix-7`, cut from `claude/relaxed-hypatia-7gseap`. One
commit per component (`fix-7: <Component>`). Review:
`docs/reports/reviews/batch-7.md`. Four subagents worked distinct
components in parallel; the lead committed each one after its tests,
`npm run check` and its contract run were green.

On the final tree: `npm run check` green (every step passes), and
`npm run contract -- --framework react --component` for the ten fixed
components green (results under "Contract" below).

## Blockers

All 21 blockers are fixed.

| Component | Blocker | Status |
| --- | --- | --- |
| Navbar | `mobile` is a hand built disclosure, not a Drawer root; manifest says Drawer is not built | fixed |
| Navbar | end actions shrink to an ellipsis at 320px (1.4.10) | fixed |
| Sidebar | sticky header and footer hide the focused item (2.4.11), contract axe failure | fixed, with a DOM change |
| Sidebar | collapsed items have no Tooltip | fixed |
| Sidebar | manifest says Tooltip is not built | fixed |
| Rail | `hideLabels` items have no Tooltip | fixed |
| Tabs | soft indicator 1.5 to 1.9:1 (1.4.11) | fixed |
| Dock | label not hoverable (1.4.13) | fixed |
| Dock | hovered label not dismissible by Escape (1.4.13) | fixed |
| Dock | current app ring 1.0 to 1.2:1 (1.4.11) | fixed |
| Dock | edge labels cut by the viewport at 320px (1.4.10) | fixed |
| Breadcrumbs | truncation width loses to Link.css | fixed |
| Breadcrumbs | a focused truncated step stays truncated at 320px (1.4.10) | fixed |
| Pagination | focus lost when the page window shifts (2.4.3) | fixed |
| Pagination | inert link ends leave the tab order | fixed in Pagination; root cause in ButtonBase sent to the lead |
| Pagination | current page fill and border under 3:1, same weight | fixed |
| Pagination | NaN and Infinity print into the summary | fixed in Pagination; shared guard sent to the lead |
| TableOfContents | malformed fragment crashes the component | fixed |
| Avatar | online, away and busy differ by color only (1.4.1) | fixed |
| Avatar | `status` is not a StatusDot root | fixed, with a DOM change |
| Chip | selected label vanishes in forced colors | fixed |

### Navbar (fixed)

- The menu button is a `DrawerTrigger`. `DrawerContent` (side start, size sm,
  modal) carries `data-part="mobile"` and is titled "Site menu"; its body is
  the Sidebar built from the items. Focus trap, Escape and focus return come
  from Drawer. When the window grows past `breakpoint.tablet` the Drawer
  closes and focus goes to the first bar item.
- Under `breakpoint.tablet` the bar hides `end` when a menu button follows it,
  and the same `end` renders in the Drawer footer. With no items (no menu
  button) the end actions keep full width and wrap to their own row. axe clean
  at 320px in Studio, Desk and Neutral, LTR and RTL, Drawer closed and open.
- Notes fixed: the Neutral menu button no longer jumps; naming is "Menu" for
  the button and "Site menu" for the Drawer and its nav; the `trigger-icon`
  part is gone (the chevron is the trigger Button's own `end`); Arabic copy
  "تصدير القيم والملفات للمطورين"; landmark "التنقل الرئيسي".
- Not done (note): a `ResizeObserver` for the sticky scroll padding on a
  wrapped bar. The manifest already states the limit.
- Tests: the menu button opens a Drawer root named "Site menu", end actions
  sit in its footer, Escape returns focus; following a link closes it; the
  chevron is the Button `end` part.

### Sidebar (fixed)

- Scroll padding alone does not fix the axe failure: at rest, before anything
  scrolls, a sticky footer link is drawn over part of an item. The groups now
  sit in a new `body` part, the only scroller; the header and footer are
  outside it and no longer sticky. `body` has `scroll-padding-block:
  space.xs`. axe clean in all styles, both directions, at 1280 and 320px;
  tabbing every case leaves every focused item visible.
- Collapsed items are wrapped in Tooltip (side end), disabled while
  expanded, so collapsing never remounts an item. A small Slot wrapper drops
  the tooltip id from `aria-describedby` (the hint repeats the name) and the
  item keeps `data-state` off its part. Manifest note rewritten.
- Notes fixed: the group keyframe rises from below, as `fade-rise`; reduced
  motion plays none, and the manifest says so. Arabic landmark "التنقل
  الجانبي". Too-many items each have their own icon.
- Tests: groups scroll in `body` with header and footer outside it; a
  focused collapsed item shows a Tooltip with its label and no
  `aria-describedby`; no Tooltip while expanded, focus kept on collapse.

### Rail (fixed)

- Every item is wrapped in Tooltip, on while `hideLabels` is set, and also
  on for a label cut to an ellipsis (measured with `ResizeObserver`). Same
  `aria-describedby` and `data-state` handling as Sidebar.
- Manifest: the Tooltip note, the target note (md 32px, sm 28px; only
  `data-platform` ios or android grows to 44 or 48px), `avoidWhen` and the
  `hideLabels` text. Arabic landmark "أقسام التطبيق".
- Not done: the label size (`2xs`) and the `motion` key; both wait on the
  batch decisions below.
- Tests: a focused hidden-label item shows a Tooltip; a fitting label shows
  none, a cut one does.

### Tabs (fixed)

The soft pill has a 1px `color.text.muted` border (new private
`--_tabs-indicator-border-color` and `-width`, transparent and 0 for ghost).
Measured from pixels in Chromium:

| Style | Scheme | edge vs track | edge vs pill | fill vs track |
| --- | --- | --- | --- | --- |
| Studio | dark | 7.58 | 4.24 | 1.79 |
| Studio | light | 5.49 | 3.66 | 1.50 |
| Desk | dark | 7.70 | 4.31 | 1.79 |
| Desk | light | 5.18 | 3.43 | 1.51 |
| Neutral | dark | 7.76 | 4.16 | 1.86 |
| Neutral | light | 6.29 | 4.14 | 1.52 |

Notes fixed: the default active tab scrolls into view inside the list on
load (list offset only, never the page); the indicator plays the
`tab-indicator` catalog values (`duration.medium`, `ease.standard`). Tests
cover all three.

### Dock (fixed)

1. The label takes the pointer while shown (private props swap
   `pointer-events` and overflow), and an undrawn bridge covers the gap
   between tile and label. Walked tile to label in Chromium: the label stays.
2. `DockItem` listens for Escape on the document while hovered (pointer, not
   touch). Checked with focus on `body`.
3. The current ring is `color.text.default`. `text.muted` was tried first and
   read 3.00:1 against the tile in Studio dark, too close.

   | Style | Scheme | ring vs tile | ring vs dock |
   | --- | --- | --- | --- |
   | Studio | dark | 6.57 | 12.59 |
   | Studio | light | 8.93 | 13.69 |
   | Desk | dark | 8.72 | 16.00 |
   | Desk | light | 8.87 | 13.56 |
   | Neutral | dark | 7.10 | 13.50 |
   | Neutral | light | 9.66 | 14.76 |

4. The first item anchors its label to the tile's inline start, the last to
   its inline end; a single item stays centered. At 320px every item of
   every case, focused, in Studio and Desk LTR and RTL and Neutral LTR: no
   label outside the viewport.

Notes fixed: the label clears the magnified Desk tile (offset includes lift
and scale; gap 5 to 6px). `--_dock-lift` is `0px`, not `0`, so the `calc`
stays valid. Demo landmarks are all distinct. Tests: Escape while hovered
with focus elsewhere, the four CSS rules, distinct landmark names.

### Breadcrumbs (fixed)

- The truncation rules are `[data-ds='breadcrumbs'] [data-part='link'][data-ds='link']`,
  three attributes against Link's two. At 1280px every long step caps at
  200px (`menu.width.min`) with an ellipsis, English and Arabic, all three
  styles.
- On hover and `:focus-visible` a step gets `max-inline-size: 100%`,
  `white-space: normal` and visible overflow, so it wraps in its row. At
  320px the focused long step is 272 by 48px with nothing hidden; page width
  stays 320.
- Notes: `maxItems` below 3 reads as 3, a non finite value shows every step.
  `states` keeps `open` and `closed`: an empty list fails the contract
  suite, which reads `data-state` on the overflow trigger. The a11y note now
  says the states belong to that trigger.
- Tests: the clamp; the truncation selector outweighs Link's (reads both
  CSS files); the focus and hover wrap rule.

### Pagination (fixed)

- The row is one `range.flatMap(...)` keyed at one level. Tests press 4 to 5,
  250 to 251 and 251 to 252 and assert the same element keeps focus.
- An inert end in link mode gets `tabIndex={0}`, as does every link when the
  row is disabled. Enter on Previous from 2 to 1 keeps focus there.
- The current page border is `color.text.muted`; page numbers step from
  `font.weight.regular` to `font.weight.bold` (new private
  `--_pagination-weight` and `-weight-active`).

  | Style | Scheme | edge vs page | edge vs fill | fill vs page | weight |
  | --- | --- | --- | --- | --- | --- |
  | Studio | dark | 8.19 | 6.83 | 1.20 | 700 / 400 |
  | Studio | light | 6.09 | 4.99 | 1.22 | 700 / 400 |
  | Desk | dark | 8.33 | 6.93 | 1.20 | 700 / 400 |
  | Desk | light | 5.76 | 4.70 | 1.22 | 700 / 400 |
  | Neutral | dark | 8.58 | 6.75 | 1.27 | 600 / 400 |
  | Neutral | light | 7.00 | 5.71 | 1.23 | 600 / 400 |

- A non finite `itemCount` renders no summary and counts as one page; a page
  size under 1 or non finite reads as 20.
- Notes: the manifest `content.en` records "Next page" and the other control
  names as an accepted exception to verb plus noun. Not done: size lg wraps
  to three rows at 320px (no sideways scroll).
- Five new tests, each failing on the old code.

### TableOfContents (fixed)

- New exported `fragmentId(hash)` decodes in a try and falls back to the raw
  text, as SkipLink does. `#50%` and `#%E0%A4%A` render.
- Notes fixed: no headings renders nothing; the section a fragment names
  keeps its mark until the first `scrollend`; `jumpTo` sets an inline
  `scroll-margin-block-start` from `offset` when the heading has none; the
  indicator plays `duration.medium` and `ease.standard`; the Arabic demo copy
  is all dialect; the demo wraps at 320px.
- Tests for each.

### Avatar (fixed)

- Status shapes: online a full disk, away a ring with its lower half filled,
  busy a disk with a bar, offline an empty ring. Drawn in `Avatar.css` as
  percent sized background layers, so they scale. In forced colors the status
  takes `forced-color-adjust: none` with CanvasText on Canvas; the four stay
  distinct in light and dark. Evidence:
  `shots/wave-1/avatar/forced-colors.png`.
- `status` is `<StatusDot data-part="status" size="sm" hideLabel aria-hidden>`.
  StatusDot has no per status shapes, so Avatar.css sets its private
  `--_status-dot-size` and `--_status-dot-bg: transparent` and draws the
  shape on the root.
- Notes fixed: Arabic default status words (`avatarStatusLabelAr`, exported)
  under an Arabic Theme, Away is "غير متواجد"; a `loading` demo case
  (Skeleton circles, since the gallery cannot stall an image); `name=""` is
  decorative and warns in development; the manifest says the image motion is
  a CSS form of `fade-rise`.
- Not done: the `initials.ts` notes (shared, not owned).

### Chip (fixed)

- In forced colors the selected root takes `forced-color-adjust: none` with
  system colors only (Highlight fill and border, HighlightText text, no
  shadow). Checked light and dark, disabled selected and focus. Evidence:
  `shots/wave-1/chip/forced-colors.png`.
- Notes fixed: `remove` is a CloseButton root; the default remove name is
  "إزالة <label>" under Arabic; an xs removable chip is 24px, not 26px; the
  demo's reset control is a Button.
- Not done: the `ds={'chip' as 'button'}` cast (ButtonBase type), the Studio
  selected fill contrast (dial 2), the motion key.

## DOM changes for the Angular port

- **Navbar:** `mobile` is a Drawer root in a portal
  (`data-ds="drawer" data-part="mobile" data-side="start" data-size="sm"`),
  holding a Sidebar; the menu button is its trigger. The end actions render
  again in the Drawer footer below `breakpoint.tablet`. The `trigger-icon`
  part is removed; the chevron is the trigger Button's `end`.
- **Sidebar:** new part `body`: `nav > [data-part=header]`,
  `> div[data-part=body]` (every group), `> [data-part=footer]`. Header and
  footer are no longer sticky. Collapsed items get a Tooltip with the label.
- **Rail:** no part change. Items get a Tooltip when labels are hidden or cut.
- **Avatar:** `status` is a StatusDot root:
  `<span data-ds="status-dot" data-part="status" data-tone data-size="sm" data-hide-label aria-hidden="true">`
  with its `dot` and `label` parts. Empty `name`: no role, `aria-hidden`.
  Arabic default status words. New `loading` demo case.
- **Chip:** `remove` is `data-ds="close-button"`, not `icon-button`. Arabic
  default remove name.
- **TableOfContents:** no root when there are no headings.
- **Pagination:** inert link controls carry `tabindex="0"`; no summary for a
  non finite count.
- Behavior only: Tabs scrolls the default tab into view on load (list offset
  only); Dock listens for Escape on the document while an item is hovered;
  Breadcrumbs reads `maxItems` below 3 as 3; TableOfContents guards the
  fragment decode, holds the fragment mark until `scrollend` and applies
  `offset` as a scroll margin.

## Token requests

None needed for these fixes. Optional, from "Open across the batch" item 2:
a semantic `color.border.selected` at 3:1 against the page and the fill.
Tabs and Pagination now use `color.text.muted` as a border, and Dock uses
`color.text.default`, where that token would apply. Still open from lane 7B:
a token for the room a fixed Dock or TabBar takes.

## Changes needed from the lead

1. `packages/react/src/components/Button/ButtonBase.tsx`, `asChild` branch
   where an inert link loses its href:
   ```ts
   cloneElement(children, {
     href: undefined,
     role: children.props.role ?? 'link',
     tabIndex: (children.props as { tabIndex?: number }).tabIndex ?? 0,
   })
   ```
   Add a Button test: an inert `asChild` link keeps `tabindex="0"`. Then the
   `tabIndex` lines in `Pagination.tsx` can go.
2. `packages/shared/src/pagination.ts`: `pageCount` returns 1 for a non finite
   total and floors a finite page size at 1; `clampPage` reads a NaN page as
   1, `Infinity` as the count, and a non finite count as 1; `itemRange` returns
   an empty range for a non finite total. Tests: `pageCount(NaN, 20)` is 1,
   `clampPage(2, NaN)` is 1, `clampPage(Infinity, 20)` is 20, `itemRange` with
   NaN or Infinity prints no NaN.
3. `packages/css/src/components/Button.css`, forced colors block: the rule
   `[data-ds='toggle-button'][data-state='on']` has the Chip bug (a pressed
   toggle draws as a blank Highlight pill; ToggleGroup items too). Add
   `forced-color-adjust: none; border-color: Highlight; box-shadow: none;`.
4. `ButtonBase` `ButtonDs` type: add `'chip'` so Chip can drop its cast.
5. `packages/react/src/components/Tooltip/Tooltip.tsx`: Radix Slot merges
   `aria-describedby`, so a Tooltip whose hint repeats the trigger name makes
   screen readers read it twice; Sidebar and Rail work around it with a small
   Slot wrapper. Tooltip's own wrapper for this case drops the child's `ref`.
   A `describe={false}` option on Tooltip would let both wrappers go.
6. Optional: move the Avatar status shapes into `StatusDot.css` (per tone on
   `> [data-part='dot']`, the same four background layers) if other
   components should share them; Avatar.css would then drop its copy.
7. `packages/shared/src/initials.ts`: the three Avatar review notes (ال on a
   first name, NFKC for presentation forms, the hamza doc comment).
8. `DECISIONS.md`: Tabs uses native `disabled` on triggers (Radix), Dock md
   tiles are 44px, Toolbar items use `aria-disabled`.
9. Decide "Open across the batch" items 3 (the `motion` key for components
   that play nothing) and 4 (Arabic small text: step `font-size-xs` up under
   `:lang(ar)`). Rail labels, Badge and xs Chip wait on them.
10. Optional, item 7: a lint rule or a line in `anatomy.md` for the
    import order trap (a part rule over a nested root at equal specificity
    loses to a later file). Breadcrumbs now uses three attributes.
11. Regenerate `packages/manifest/manifests.gen.json` on merge. It is
    committed here as generated so the contract suite reads the new parts.

## Not done

- Navbar: `ResizeObserver` for scroll padding on a wrapped sticky bar (note).
- Pagination: size lg wraps to three rows at 320px (note).
- Rail: label size and motion key (wait on item 9).
- Avatar: `initials.ts` notes (item 7).
- Chip: the type cast (item 4), the Studio selected fill (dial 2).
- Review notes on components with no blocker (Toolbar, TabBar, SkipLink,
  LanguageSwitch, AvatarGroup, Badge) were out of scope for this round.
- Older TableOfContents scrolled and page-end shots and the Breadcrumbs
  open-menu shot were not retaken; their look did not change.

## Contract
