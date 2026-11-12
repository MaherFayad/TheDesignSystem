# Review: batch 7 and lane 9A

Fresh eyes review by ds-qa of the batch 7 navigation components (Navbar,
Sidebar, Rail, Tabs, TabBar, Toolbar, Dock, Breadcrumbs, Pagination,
TableOfContents, SkipLink, LanguageSwitch) and lane 9A (Avatar, AvatarGroup,
Badge, Chip), all in React, on branch `claude/ds-review-7`, cut from
`claude/relaxed-hypatia-7gseap`. No source, CSS, manifest, token or test file
was edited. The builders' lane reports were read only after the findings
below were formed; where a finding repeats a point a lane left open, it says
so.

## Verdicts

| Component | Lane | Verdict | Blockers | Notes |
| --- | --- | --- | --- | --- |
| Navbar | 7A | fix needed | 2 | 5 |
| Sidebar | 7A | fix needed | 3 | 3 |
| Rail | 7A | fix needed | 1 | 4 |
| Tabs | 7B | fix needed | 1 | 3 |
| Toolbar | 7B | pass | 0 | 3 |
| TabBar | 7B | pass | 0 | 3 |
| Dock | 7B | fix needed | 4 | 2 |
| SkipLink | 7C | pass | 0 | 3 |
| Breadcrumbs | 7C | fix needed | 2 | 3 |
| Pagination | 7C | fix needed | 4 | 3 |
| TableOfContents | 7C | fix needed | 1 | 6 |
| LanguageSwitch | 7C | pass | 0 | 3 |
| Avatar | 9A | fix needed | 2 | 8 |
| AvatarGroup | 9A | pass | 0 | 5 |
| Badge | 9A | pass | 0 | 5 |
| Chip | 9A | fix needed | 1 | 6 |

Ten of sixteen need a fix; 21 blockers in all. Most blockers fall into
four groups: states marked by fills that are too faint (1.4.11), sticky or
floating parts that hide focus or names (2.4.11, 1.4.13, 1.4.10), focus lost
on re-render (2.4.3), and merged dependencies (Tooltip, Drawer, StatusDot,
CloseButton) still not wired, which also leaves the manifests saying
something that is no longer true.

`npm run check` is green. The contract command is not green: Sidebar fails
two axe runs.

```text
npm run contract -- --framework react --component Navbar,Sidebar,Rail,Tabs,TabBar,Toolbar,Dock,Breadcrumbs,Pagination,TableOfContents,SkipLink,LanguageSwitch,Avatar,AvatarGroup,Badge,Chip
pass  Avatar: 28 passed, 0 failed, 1 skipped
pass  AvatarGroup: 29 passed, 0 failed, 0 skipped
pass  Badge: 28 passed, 0 failed, 1 skipped
pass  Breadcrumbs: 29 passed, 0 failed, 15 skipped
pass  Chip: 29 passed, 0 failed, 0 skipped
pass  Dock: 29 passed, 0 failed, 0 skipped
pass  LanguageSwitch: 29 passed, 0 failed, 15 skipped
pass  Navbar: 29 passed, 0 failed, 15 skipped
pass  Pagination: 29 passed, 0 failed, 0 skipped
pass  Rail: 29 passed, 0 failed, 0 skipped
FAIL  Sidebar: 27 passed, 2 failed, 15 skipped
      failed: axe, neutral light ar rtl; axe, neutral dark ar rtl
pass  SkipLink: 29 passed, 0 failed, 0 skipped
pass  TabBar: 29 passed, 0 failed, 0 skipped
pass  TableOfContents: 29 passed, 0 failed, 0 skipped
pass  Tabs: 29 passed, 0 failed, 0 skipped
pass  Toolbar: 29 passed, 0 failed, 15 skipped
```

The Sidebar failure is axe `target-size` on `#folder-8` in the too-many
case. It is deterministic (four runs, four failures) and its cause is the
first Sidebar blocker below. The skips are expected: Avatar and Badge have
no keys, and the 15 skips on Breadcrumbs, LanguageSwitch, Navbar, Sidebar
and Toolbar are the "open" target size and axe runs, which the suite runs
only for components the manifest marks as opening and closing.

## How it was checked

For each component: the code, CSS, manifest, tests, demo and any recipe were
read against its order, `docs/contracts/anatomy.md` and the checklist in
section 6 of PLAN.md. In Chromium against the React gallery at
`/c/<slug>?chrome=0`: Studio, Desk and Neutral; dark and light; LTR English
and RTL Arabic; 320px and 1280px; forced colors; reduced motion. Keyboard
paths were driven by hand (roving focus, arrow direction in RTL,
`aria-current`, Escape and focus return). axe ran in every combination,
more than 250 runs in all outside the contract suite. Contrast was measured on
the composited background, targets on the rendered box.

Two limits:

- `/home/user/gobanana` is not on this machine, so the Arabic copy cookbook
  and the GoBanana sources named in the orders (`SiteNav.tsx`,
  `desktop.css`, `Dock.tsx`) could not be read. Arabic copy is judged
  against section 12 of PLAN.md and AGENTS.md only, and the Desk look of
  TabBar, Dock and the Navbar menu bar was not compared with the source.
- `env(safe-area-inset-*)` cannot be emulated in Chromium (it reads 0), so
  TabBar's safe area padding was checked in the CSS only.

## What holds across the batch

Checked and not repeated per component below:

- Anatomy: `data-ds` roots, shared axis words, boolean states present and
  empty, no class for state. Rendered `data-part` values equal the manifest
  `anatomy` in every component, with one exception noted under Navbar.
- Every navigation component renders `nav` with a label. Current items use
  `aria-current` (`page`, or `location` in TableOfContents).
- CSS: `@layer ds.base`, tokens only, logical properties only, only
  `transform` and `opacity` animate, reduced motion turns off every movement
  (Tabs indicator 0ms, Dock magnify `none`, Navbar viewport `none`, Sidebar
  groups `none`), a forced colors block in every file.
- No native `title`, no bare `<button>`, no em or en dash.
- No sideways scroll at 320px in any of the 16 components, in every style,
  scheme and direction (1.4.10 at page level; see Navbar and Dock for loss
  of content inside the page).
- Western digits in every Arabic number, Pagination included.
- Focus ring: 2px from the `focus` tokens, with a transparent outline that
  forced colors turns into Highlight.

## Findings

### Navbar: fix needed

- **blocker**: `packages/react/src/components/Navbar/Navbar.tsx:20` to `25`
  and the phone list it renders from line 123. The `mobile` part is a
  hand built disclosure, not a Drawer root, against the order's anatomy
  ("`mobile` (a Drawer root under `breakpoint.tablet`)"). Drawer (1.6.3) is
  merged and ready, so the manifest lines that say "Drawer is not built yet"
  (`a11y.notes[3]`, `frameworks.react.behavior`) are now false. Repeats lane
  7A change 6. Today's disclosure works: `aria-expanded`, Escape returns
  focus to the menu button.
- **blocker**: `packages/css/src/components/Navbar.css:130` to `137` with
  `:383`. WCAG 1.4.10 (no loss of content at 320px). On phones the end
  actions shrink to an ellipsis, so the visible label of the demo's "Start a
  trial" Button is lost. Drawn against full label width: Neutral md 40 of
  69px, Neutral lg 14 of 74px (it reads "..l"), Studio lg 48 of 64px, Desk lg
  49 of 70px. The lane chose this on purpose; it still fails. Move the end
  actions into the phone list or let them wrap to a second row. Evidence:
  `shots/batch-7/navbar-end-action-truncated-320.png`.
- note: `packages/css/src/components/Navbar.css:393` to `396`. In Neutral at
  320px, opening the phone list moves the menu button from x 254, y 134 to
  x 30, y 174, so the close control is no longer where the user tapped. It
  stays put in Studio and Desk. The same shot shows it.
- note: `packages/css/src/components/Navbar.css:111` to `118`. Scroll padding
  is one bar row at root density, so a sticky bar that wraps (too many links
  at tablet width) covers more than it reserves (2.4.11). The manifest says
  so. Measured: bar 47.4px, padding 48.4px; Tab through 40 stops hid
  nothing. A `ResizeObserver` writing the measured height would close it.
- note: `packages/manifest/src/component/Navbar.manifest.json` `a11y.role`
  says the phone list is named "Menu"; the code names it "Site menu"
  (`Navbar.tsx:76`), as `a11y.notes[2]` says. Pick one.
- note: `Navbar.manifest.json` `anatomy`. `trigger-icon` sits inside the
  Button's `end` slot, so by anatomy.md ("a part belongs to the nearest
  ancestor root") it is Button's part, not Navbar's. Move the chevron outside
  the Button or record the exception.
- note (copy): `packages/react/src/components/Navbar/Navbar.demo.tsx:39`.
  "تصدير الرموز والملفات للمطورين": "الرموز" reads as symbols or codes, not
  design tokens. Use "تصدير القيم والملفات للمطورين", or keep "Tokens"
  through `Bidi`. The landmark label "الرئيسية" (`:86`, `:147`) is also the
  word for the Home item; see Sidebar.

Verified: arrows follow the reading direction (RTL ArrowLeft moves forward),
Home and End, Enter and Space open a panel, ArrowDown enters it, Escape
closes and returns focus to the trigger. `aria-current="page"` on Docs with
weight 700, `data-active` on the trigger holding it. Phone list items 48px.
`menu-scale` matches the catalog. The only axe hit is `aria-hidden-focus` on
the Radix focus proxy, already listed under `skipAxeRules` with a reason.

### Sidebar: fix needed

- **blocker**: `packages/css/src/components/Sidebar.css:120` to `150`. WCAG
  2.4.11 (focus not obscured, minimum). The header and footer are sticky
  inside the scrolling `nav`, but the root sets no `scroll-padding-block`.
  Tabbing down scrolls each item to the bottom edge, under the footer, so the
  focused item is fully hidden: visible height 0px for `#folder-7`,
  `#folder-8` and `#folder-14` in Studio dark LTR, and for `#folder-8` and
  `#folder-14` in Neutral Arabic RTL. This is also the contract failure: at
  rest the footer covers `#folder-8` (item 510.1 to 546.1, footer 490.7 to
  543.1) and axe sees only a 10.7px strip of it. It shows in the suite only
  in Neutral Arabic RTL because that header height and row pitch land an
  item there; a sweep at 320px found the same violation in Studio and Desk
  (`#project-2`, `#folder-5`) and Neutral (`#folder-6`). Fix: set
  `scroll-padding-block-start` and `-end` on the root to the header and
  footer heights. Evidence:
  `shots/batch-7/sidebar-focus-hidden-under-footer.png` (focus on Archive, no
  ring visible), `shots/batch-7/sidebar-too-many-item-under-sticky-footer.png`.
- **blocker**: `packages/react/src/components/Sidebar/Sidebar.tsx:22` and the
  item render near line 390. The order's Accept line says "collapsed items
  keep a Tooltip with the label" (also WCAG 1.4.13 and section 12 of PLAN.md).
  Tooltip is merged and ready; collapsed items still render none (0
  `role=tooltip` after hover and focus). Five demo items share the `file` and
  `folder` icons, so a sighted mouse user cannot tell them apart. Repeats
  lane 7A change 5. Evidence: `shots/batch-7/sidebar-collapsed-no-tooltip.png`.
- **blocker**: `packages/manifest/src/component/Sidebar.manifest.json:213`.
  The manifest says "Tooltip (1.6.6) is not built yet". That is false now.
  Fix with the item above.
- note: `packages/css/src/components/Sidebar.css:211`. The group keyframe
  starts at `translateY(-space.xs)`, so the list drops from above; the
  `fade-rise` pattern starts at `+space.xs` and the comment on line 37 says
  "rises". Under reduced motion the pattern's form is a fade; the CSS sets
  `animation: none` (line 386). Either is acceptable; the manifest should say
  which.
- note (copy): `packages/react/src/components/Sidebar/Sidebar.demo.tsx:57`.
  The Arabic landmark label "الرئيسية" is the same word as the first item
  (Home, line 63), so a screen reader hears it twice. Rail uses
  "التنقل الرئيسي". Use one name across the lane.
- note: `Sidebar.demo.tsx:207`. In the too-many case every item uses the
  `folder` icon, Home and Inbox included.

Verified: each group list is named by its heading, the active item has
`aria-current="page"`, weight and a 2px edge bar at 5.43:1 or better against
the active fill (Desk light lowest, Studio dark 11.70:1). Item text 5.76:1
or better, counts 5.02:1 or better. The side and the bar flip in RTL. Enter
and Space on group triggers toggle `aria-expanded`. Forced colors: Highlight
bar and 2px focus outline.

### Rail: fix needed

- **blocker**: `packages/react/src/components/Rail/Rail.tsx:13` to `15` and
  the item render near line 199. The order's Accept line says "every item has
  a visible label or a Tooltip" (also WCAG 1.4.13). With `hideLabels`, items
  draw icons only and no Tooltip (0 tooltips on hover and focus). The demo
  shows four such rails (`Rail.demo.tsx:95`, `:106`), the very case the
  manifest's own `avoidWhen` forbids. `Rail.manifest.json` `a11y.notes[0]`
  still says Tooltip is not built. Repeats lane 7A change 5. Evidence:
  `shots/batch-7/rail-hide-labels-no-tooltip.png`.
- note: `packages/css/src/components/Rail.css:192` to `200`. A label that does
  not fit ends in an ellipsis with no way for a sighted user to read the rest
  ("Supercalifragilisticexpialidocious"). Give a truncated label the same
  Tooltip.
- note: `packages/css/src/components/Rail.css:42`. Label text computes to
  9.85px and the badge to 8.85px in Studio and Desk. Contrast passes (badge
  4.72:1 in Neutral dark, the lowest), but it is smaller than every other
  navigation label in the batch.
- note: `Rail.manifest.json` has no `motion` key. See "Open across the
  batch", item 3.
- note: `Rail.manifest.json` `a11y.notes[3]` says "44px at md in default
  density for touch templates". In `Rail.css:76` to `82` md is 32px and only
  `data-platform` ios or android gives 44 or 48. Reword the note.

Verified: every item 24px or larger in every combination, `aria-current`
plus bold label, fill and edge bar (5.43:1 or better), badge read after the
label ("Inbox 3") with `badgeLabel` for the dot, "99+" kept in order by
`dir=ltr`. axe clean in all 12 combinations.

### Tabs: fix needed

- **blocker**: `packages/css/src/components/Tabs.css:82` (and `:241` to
  `245`). WCAG 1.4.11, and the order's Accept line "active by weight and
  indicator, not color alone". In `soft` emphasis the indicator is
  `overlay-20` on an `overlay-5` track: 1.80:1 Studio dark, 1.50:1 Studio
  light, 1.80:1 Desk dark, 1.51:1 Desk light, 1.89:1 Neutral dark, 1.52:1
  Neutral light. That leaves text color and weight, and in Neutral the weight
  step is only 500 to 600. Toolbar solved the same problem with a
  `text-muted` border (5.75:1 or better); do the same, or use a 3:1 fill.
  Evidence: `shots/batch-7/tabs-soft-pill-low-contrast.png` (Neutral light).
- note: `packages/react/src/components/Tabs/Tabs.tsx:204`. A default tab
  outside the visible part of a scrolling list is never scrolled into view on
  load. Too-many at 320px: "Tokens" is active at x 681 to 736 while the list
  shows 14 to 306. The code sets only `list.scrollLeft`, so the "never on
  load" guard is not needed to protect the page scroll. Evidence:
  `shots/batch-7/tabs-too-many-active-out-of-view.png`.
- note: `packages/css/src/components/Tabs.css:47` and `Tabs.tsx:229`. The
  indicator FLIP is hand written with `ease.emphasized`; the merged
  `tab-indicator` pattern (`packages/motion/src/patterns/tab-indicator.ts`)
  uses `ease.standard`. Play the catalog spec (same point as Stat in the
  batch 9 review).
- note: `Tabs.manifest.json` a11y notes. Native `disabled` on triggers departs
  from anatomy rule 5, and `DECISIONS.md` has no entry for it. Repeats the
  lane's open request.

Verified: Radix roles, names "Comments 12"; arrows move and activate,
reversed in RTL, wrap; Home and End; Up and Down in a vertical list; disabled
tab skipped; Tab moves into the panel. Indicator FLIP 140ms, 0ms under
reduced motion. Overflow scrolls inside the list. `ghost` line 14:1 or
better, inactive labels 5.21:1, active 12.97:1, count 8.78:1. Forced colors:
Highlight line, Highlight frame for soft.

### Toolbar: pass

- note: `packages/css/src/components/Toolbar.css:154` to `157`. In forced
  colors an on toggle differs from an off one only by border color
  (Highlight against ButtonText, both 1px). Use a 2px border or an outline,
  as Tabs soft does. Evidence:
  `shots/batch-7/toolbar-forced-colors-on-state.png`.
- note: `packages/react/src/components/Toolbar/Toolbar.tsx:33` and `:482`, and
  `frameworks.react.note`. Tooltip and ToggleButton are ready: icon only items
  and More tools still have no visible hint, and `ToolbarToggleItem` should
  render ToggleButton, moving the on state out of `Toolbar.css`. Repeats lane
  7B changes 2 and 3.
- note: `Toolbar.tsx:115`. Items of a `single` group go into More tools as
  `menuitemcheckbox`, not radio items. The manifest says so. Repeats an open
  point.

Verified: one tab stop; arrows follow the reading direction and wrap; Home
and End (End lands on More tools when it shows); vertical toolbars use Up and
Down. `aria-label` is required by the types. Overflow: hidden items carry
`data-overflowed`, the trigger is "More text tools" with `aria-haspopup=menu`,
choosing an entry clicks the hidden item and returns focus. Disabled items
stay in the arrow order with `aria-disabled`. Targets 24px at xs, 44px at lg.
On state border 5.75:1 or better.

### TabBar: pass

- note: `packages/css/src/components/TabBar.css:106` to `112`. In Neutral at
  320px the default five item bar cuts "Search" to "...arch", so "five short
  nouns fit at 320px" does not hold in Neutral. The ellipsis also lands on the
  wrong side for an English label in an RTL bar; `unicode-bidi: plaintext` on
  `item-label` fixes that. Evidence:
  `shots/batch-7/tab-bar-neutral-arabic-label-cut-at-320.png`.
- note: `TabBar.css:28`. The icon pill is 1.52:1 to 1.92:1 against the bar.
  The current item still reads by weight (500 to 700, 600 in Neutral) and
  `aria-current`, which is what the batch header asks, but the pill adds
  little. Same remedy as Tabs.
- note: `packages/react/src/components/TabBar/TabBar.demo.tsx:27`. Every demo
  bar is named "Main", so axe best practice `landmark-unique` fires in all 24
  runs. Same in `Dock.demo.tsx:28` ("Apps"). Demo only.

Verified: links with `aria-current="page"`, names "Inbox, 3 new" and the
Arabic comma with جديد in Arabic, badge digit `aria-hidden`, labels always
visible, lg items 50px or more high and 54px wide, safe area padding on block
end and both sides in the CSS. Contrast with the gallery link rule removed:
inactive 5.75:1, active 13.41:1, badge 4.83:1. `insteadUse` points in page
panels to Tabs.

### Dock: fix needed

- **blocker**: `packages/css/src/components/Dock.css:134`. WCAG 1.4.13
  (hoverable). `pointer-events: none` on `item-label` makes the name vanish
  when the pointer moves onto it: in Studio the label goes from opacity 1 to 0
  and `elementFromPoint` at its center is the section behind. The manifest's
  "hoverable (it does not hide while the pointer is on the item)" is not what
  1.4.13 asks.
- **blocker**: `packages/react/src/components/Dock/Dock.tsx:112` to `115`.
  WCAG 1.4.13 (dismissible). Escape is handled only on the focused link. A
  name shown by hover, with focus elsewhere, cannot be dismissed and covers
  the content above the dock. `a11y.keys.Escape` in the manifest says
  "focused or hovered app". Listen on the document while an item is hovered.
- **blocker**: `packages/css/src/components/Dock.css:197` to `200`. WCAG
  1.4.11, and the batch rule "current page by weight and `aria-current`, not
  color alone". The current app ring (`border.strong`, 2px inset) measures
  1.00:1 to 1.23:1 against its tile (Neutral light 1.00, Desk dark 1.14,
  Studio dark 1.15) and 1.53:1 to 2.11:1 against the dock. The label is
  hidden at rest, so this ring is the only visual cue, and it is effectively
  invisible. Evidence: `shots/batch-7/dock-current-app-ring-low-contrast.png`.
- **blocker**: `packages/css/src/components/Dock.css:114` to `118` and `:133`.
  WCAG 1.4.10. At 320px the name of an edge tile is cut off by the viewport,
  and it is the only visible name of an icon only link. Label boxes against a
  0 to 320 viewport: long-text first tile LTR -51 to 133, RTL 171 to 387;
  long-arabic first tile 206 to 352. Clamp the label inside the viewport or
  anchor it to the tile's edge. The lane left this open; it repeats an open
  point but fails the criterion. Evidence:
  `shots/batch-7/dock-label-clipped-at-320.png`.
- note: `packages/styles/desk/recipes/Dock.css:18` to `21` with `Dock.css:116`.
  In Desk the label offset ignores the lift and the 1.25 scale, so the label
  covers the top 11px of the magnified, focused tile and its ring. Partial,
  so 2.4.11 passes. Evidence:
  `shots/batch-7/dock-desk-focus-label-overlaps-tile.png`.
- note: `packages/react/src/components/Dock/Dock.demo.tsx:88`. The room kept
  below the content is hand written (`size.control.lg + space.3xl`). The many
  case clears exactly (text ends at y 584, dock starts at 584), but a consumer
  has no token to reserve with. Repeats the lane's token gap and PageShell
  request.

Verified: the name is always in the link ("Mail, open", "الملفات، مفتوح"),
no `title`, label shown on hover and on focus, Escape on a focused item hides
it. Desk magnify 1.25, `none` under reduced motion. Tiles 44px (48px in
Neutral). Open dot 12.59:1, label text 7.57:1. Forced colors: Highlight frame
on the current tile.

### SkipLink: pass

- note: `packages/react/src/components/SkipLink/SkipLink.tsx:76`. The
  fragment is written with `location.hash = href`, which changes the route in
  an app with a hash router. Say so in the manifest, or let the consumer opt
  out of the fragment write.
- note: `packages/manifest/src/component/SkipLink.manifest.json:106` calls the
  Studio form "a surface-3 pill"; the radius is 11.85px on a 32px link, not a
  pill.
- note: no `motion` key. See "Open across the batch", item 3.

Verified: the first tab stop, drawn at the inline start corner in LTR and
RTL, 32px tall. Enter moves focus to `#demo-main`, adds `tabindex="-1"` only
there, and the next Tab continues after it (2.4.1). Long text wraps at
320px. Forced colors: LinkText on Canvas with a Highlight outline.

### Breadcrumbs: fix needed

- **blocker**: `packages/css/src/components/Breadcrumbs.css:86` to `91`. The
  truncation width never applies. `[data-ds='breadcrumbs'] [data-part='link']`
  and `Link.css:88` `[data-ds='link'][data-standalone]` (which sets
  `max-inline-size: 100%`) have the same specificity in the same layer, and
  Link.css is imported later (`packages/css/src/index.css` line 46 against
  14), so Link wins. Computed: 100% in all three styles. At 1280px the long
  step is 414px wide and nothing truncates; the Arabic demo names never
  truncate at any width tried, so the Accept line "long Arabic names truncate
  with the full text available" is not met. Evidence:
  `shots/batch-7/breadcrumbs-no-truncation-1280.png`.
- **blocker**: `packages/css/src/components/Breadcrumbs.css:93` to `95` with
  `:64`. WCAG 1.4.10. Where a step does truncate (320px, hover pointer, the
  same layout as 400% zoom), focus does not reveal it: the item is capped at
  100%, so the focused step stays 272px wide against 385px of text. The
  manifest (line 85) says "shows whole on hover and keyboard focus". Raise
  the truncation rule's specificity, and let a focused or hovered step wrap.
  Evidence: `shots/batch-7/breadcrumbs-focused-step-truncated-320.png`.
- note: `packages/react/src/components/Breadcrumbs/Breadcrumbs.tsx:90`.
  `maxItems` of 0, 1 or 2 still shows three entries. Clamp or document a
  minimum of 3.
- note: `Breadcrumbs.tsx:138`. A router step picked from the overflow menu
  without `onNavigate` does a full page load through `location.assign`.
- note: `Breadcrumbs.manifest.json:66`. `states` lists `open` and `closed`,
  but the order says "States: none"; the state lives on the overflow trigger.
  Repeats lane 7C open point 3.

Verified: last item a span with `aria-current="page"`, every separator
`aria-hidden` and mirrored in RTL only. Links underlined and the current not,
at weight 500 against 400, so not by color alone. Overflow IconButton 32px
at md, 24px at xs; its menu lists the 7 hidden steps and follows their href.

### Pagination: fix needed

- **blocker**: `packages/react/src/components/Pagination/Pagination.tsx:193` to
  `210`. WCAG 2.4.3. Each page returns an unkeyed inner array
  `[compactGap, <Button key={item}>]`. React matches the inner arrays by
  position, so when the window of pages shifts, the pressed Button is
  unmounted. Enter on 251 from 250, on 252, and on 5 from 4 sends focus to
  `body`; the next Tab starts at the top of the page. The manifest (line 120)
  says "focus stays on the pressed page". Fix: `range.flatMap(...)` so every
  element is keyed at one level, and add a test for 4 to 5; the test at
  `Pagination.test.tsx:71` only presses pages that keep their position.
  Evidence: `shots/batch-7/pagination-focus-lost-after-page-change.png`.
- **blocker**: `Pagination.tsx:139` to `156` with
  `packages/react/src/components/Button/ButtonBase.tsx:170` to `176`. In link
  mode an end with nowhere to go becomes an `<a>` with no `href` and no
  `tabIndex`, so it leaves the tab order (anatomy rule 5, WCAG 2.4.3). Enter
  on Previous from page 2 to 1 drops focus to `body`; Shift+Tab from Next
  never reaches First or Previous. The manifest says ends "stay focusable".
  The root cause is in ButtonBase and affects every inert Button or
  IconButton rendered with `asChild`: add `tabIndex: 0` where the href is
  dropped.
- **blocker**: `packages/css/src/components/Pagination.css:25` and `:28`. WCAG
  1.4.11, and 1.4.1 in practice. The current page's fill is about 1.2:1
  against the page in every style, and its `border.strong` border is 2.37:1
  (Studio and Desk dark), 1.62:1 (light), 2.18:1 (Neutral dark), 1.48:1
  (Neutral light). Weight is the same on every page button. That leaves text
  color as the only strong cue, while the comment at line 15 and manifest
  line 134 claim more. Evidence:
  `shots/batch-7/pagination-current-page-low-contrast-neutral-light.png`,
  `shots/batch-7/pagination-current-page-low-contrast-studio-dark.png`.
- **blocker**: `Pagination.tsx:161` with `packages/shared/src/pagination.ts:74`.
  A non finite item count prints into the summary: `itemCount={NaN}` gives
  "NaN to NaN of NaN", `Infinity` gives "of ∞". The batch 9 review ruled the
  same pattern in Stat a blocker; this follows that ruling. Guard in
  `itemRange` and render no summary.
- note: `packages/shared/src/pagination.ts:84`. `pageCount(NaN, 20)` returns
  NaN though the doc says "at least 1"; `clampPage(2, NaN)` returns NaN;
  `clampPage(Infinity, 20)` returns 1, not 20. Add tests with the fix above.
- note: size lg at 320px wraps to three rows, 92px tall. No sideways scroll;
  the compact form switches at 480px but lg is still too wide below it.
- note (copy): "Next page" and "First page" are not a verb plus a noun. They
  are the standard wording for pagination controls; record the exception in
  the manifest `content`.

Verified: `pageRange` holds its invariants for total 1 to 40, siblings and
boundaries 0 to 3, every current page (current, boundaries and siblings
always shown, strict order, unique keys, every ellipsis hides at least 2
pages, constant length). `aria-current="page"`, names "Page 5" and "صفحة 5".
RTL: Previous on the right, every chevron mirrored. Western digits
throughout: "21 إلى 40 من 312", "6,226 إلى 6,250 من 12,480", page "1,240".
Disabled ends stay focusable in button mode.

### TableOfContents: fix needed

- **blocker**: `packages/react/src/components/TableOfContents/TableOfContents.tsx:146`.
  `decodeURIComponent(view.location.hash.slice(1))` has no guard. Loading a
  page with `#50%` or `#%E0%A4%A` throws "URI malformed" and the component
  fails to render. A user who follows a bad link loses the navigation. SkipLink
  already guards the same call (`SkipLink.tsx:43`); copy that.
- note: `TableOfContents.tsx:94`. `jumpTo` ignores `offset`, so a heading can
  land under a sticky header unless the consumer adds
  `scroll-margin-block-start` (2.4.11). The manifest says so; applying the
  offset inside `jumpTo` would make it safe by default.
- note: `packages/css/src/components/TableOfContents.css:159`. The indicator
  is a CSS transition on `duration.base` and `ease.out`, while the named
  `tab-indicator` pattern uses `duration.medium` and `ease.standard`. Same
  point as Tabs.
- note: `TableOfContents.tsx:144` to `170`. The section named by the fragment
  on load is overwritten by the first measure: loading with `#toc-sharing`
  marks "Get started".
- note: `TableOfContents.demo.tsx:9`. The demo grid keeps two columns at
  320px, leaving the article 74px wide. Demo only.
- note (copy): `TableOfContents.demo.tsx:34` and `:36` mix registers: "أنشئ ...
  وادع" is formal, "وتقدر تصدره" is dialect. Use the dialect throughout.
- note: the empty case renders a named `nav` holding only its title. Render
  nothing when there are no headings.

Verified: `aria-current="location"` on the active link only. Enter scrolls
and moves focus to the heading (`tabindex="-1"`), smooth normally and an
instant jump under reduced motion. Scroll tracking follows the sections. The
sticky list scrolls inside with the focus ring visible. Indicator 14:1 to
21:1. `buildTree` and `activeHeading` handle empty input and skipped levels.

### LanguageSwitch: pass

- note: `packages/css/src/components/LanguageSwitch.css:64` to `70`. Under
  forced colors both names are underlined and the current one differs only by
  CanvasText against LinkText and weight 500 against 400 (1.4.1 in forced
  colors). Add a border or outline on the current one. Evidence:
  `shots/batch-7/language-switch-forced-colors-current.png`.
- note: `packages/react/src/components/LanguageSwitch/LanguageSwitch.tsx:137`.
  The trigger's `aria-label` ("Français، اللغة") replaces the `lang` span, so
  the language name is read in the page language (3.1.2).
- note: the menu opens with focus on the first item, not the checked
  language. This is DropdownMenu behavior; worth a prop there.

Verified: pair links carry `lang`, `hreflang` and `dir`, the current one
`aria-current="page"`, both 24px tall. Three or more languages render a menu
of `menuitemradio` items with `lang`, the current one checked; Escape returns
focus. No flags. The React Native restart note is in the manifest (lines 85
and 117).

### Avatar: fix needed

- **blocker**: `packages/css/src/components/Avatar.css:90` to `116` and
  `packages/react/src/components/Avatar/Avatar.tsx:132`. WCAG 1.4.1. Online,
  away and busy differ only by color (green, orange, red); only offline has a
  shape (hollow). The words are in the `aria-label` only, so a sighted user who
  cannot tell the colors apart gets nothing, and in forced colors the three
  draw as the same dot. The manifest admits it (`Avatar.manifest.json:78`,
  "differ by color only"); the order asked for a status with meaning beyond
  color. Give each status a shape. Evidence:
  `shots/batch-7/avatar-status-color-only.png` (Desk light),
  `shots/batch-7/avatar-status-forced-colors.png`.
- **blocker**: `Avatar.tsx:132` and `Avatar.manifest.json:141`. The order's
  anatomy says `status` is a StatusDot root carrying `data-part="status"`. It
  is a plain span. StatusDot (1.5.10) was merged before Avatar, so the
  manifest note "until StatusDot (1.5.10) exists" is false. Repeats lane 9A
  change 2. The shapes in the blocker above belong in StatusDot.
- note: `packages/shared/src/initials.ts:59`. The article rule fires on first
  names starting with ال: "الهام" gives "ه". Accept it and say so in the
  manifest `content`, or apply the rule only to the last word of two or more.
- note: `initials.ts:27`. Untested inputs outside the rules: presentation
  forms (`ﻣﺤﻤﺪ`) give the shaped glyph U+FEE3 because NFC does not fold them
  (NFKC would) and skip the ZWNJ; "ßtraße" gives "SS".
- note: `initials.ts:92`. Hamza is folded for the tone but not for the
  initials, so "أحمد" and "احمد" share a color and show different letters.
  Defensible; say so in the doc comment.
- note: `Avatar.tsx:107`. `name=""` renders `role="img"` with an empty
  `aria-label`. Warn in development or treat it as decorative.
- note: `Avatar.tsx:25`. The status words fall back to English in Arabic
  ("عمر حداد، Online") unless `statusLabel` is passed. See "Open across the
  batch", item 1.
- note: `Avatar.css:75` and `Avatar.manifest.json:141`. The image rises by
  `space-4xs` and turns `transition: none` under reduced motion, while
  `fade-rise` uses `space.xs` and fades under reduced motion. Align, or say in
  the manifest that this is a CSS form of the pattern.
- note: `Avatar.demo.tsx` has no `loading` case. Open in the lane report.
- note (copy): `Avatar.demo.tsx:11`. "بعيد" for Away reads as "far". Open in
  the lane report; "غير متواجد" or "مشغول حاليا" are the usual Gulf
  readings, with "مشغول" already taken by Busy, so "غير متواجد" fits.

Verified: fallback contrast 4.5:1 for all ten tone indexes in all six style
and scheme pairs, lowest 5.36:1 (light, hue 8) and 9.05:1 (dark), also
checked in `Avatar.test.tsx`. `data-state` `loaded` on 16 images and `error`
on the 2 broken ones, with the fallback shown. The root is `role="img"` named
by the name (plus ", Busy"), the inner image `alt=""`; the decorative case is
`aria-hidden`. Initials strip diacritics and tatweel, skip ال on the last
word, keep "عبد الله" as one, give the user icon for emoji or digits only, and
the tone index is stable across case, spacing and diacritics.

### AvatarGroup: pass

- note: `packages/react/src/components/AvatarGroup/AvatarGroup.tsx:44` and
  `AvatarGroup.manifest.json:110`. Popover is merged, but no demo pairs the
  count Button with a Popover list, while the manifest says it "comes with
  Popover". Add the demo.
- note: `packages/css/src/components/AvatarGroup.css:91`. At xs the count is
  `font-size-3xs`, 8.85px (sm 9.85px). Not a WCAG failure, but hard to read.
- note: `AvatarGroup.css:22`. The cutout ring is `bg.surface`; on any other
  background it draws as a visible gray outline. Needs a token decision; open
  in the lane report.
- note (copy): `AvatarGroup.demo.tsx:42` and `content.ar` mix registers: "3
  آخرين" is formal while "واحد ثاني" and "11 شخص ثاني" are dialect. In dialect,
  "3 ثانيين". Zero gives "0 شخص"; render no count for zero.
- note: `AvatarGroup.manifest.json:104` names `fade-rise` and plays nothing.
  See "Open across the batch", item 3.

Verified: the overlap flips (LTR items at x 18, 44, 70, 96 with the count at
122; RTL 1230 down to 1126). `role="group"` named "6 people", "7 أشخاص",
"48 شخص". The count Button is named "+8, 8 more", starting with the visible
text (2.5.3), 32 by 32 at md. "+N" stays LTR in Arabic. Count text 12.7:1.

### Badge: pass

- note: `packages/css/src/components/Badge.css:21` and `:74`. Labels are
  10.85px (sm) and 9.85px (xs), in Arabic too: the step up in `base.css:78`
  moves only `font-size-s`. See "Open across the batch", item 4.
- note: `packages/react/src/components/Badge/Badge.tsx:76`. `dot` with no
  children and no count renders a dot with no hidden label, while the manifest
  promises "the dot form keeps its words". Warn in development.
- note: `Badge.tsx:71`. A count without `countLabel` reads a bare number.
  Documented; the demo passes words.
- note (copy): `Badge.demo.tsx:22`. "قرب ينتهي" is a verb phrase; a badge is a
  label, so use a noun form: "قريب الانتهاء".
- note: `Badge.manifest.json:137` names `fade-rise` and plays nothing.

Verified: 120 shows "99+" and reads "120 unread messages"; inside a Button
the name is "Open inbox 348 unread messages"; `max={999}` gives "999+"; the
plus stays after the digits in RTL. Every tone, emphasis and size label holds
4.5:1 in all six pairs; every dot 3:1 against the page. `insteadUse` points
pressable tags to Chip.

### Chip: fix needed

- **blocker**: `packages/css/src/components/Chip.css:273` to `277`. In forced
  colors a selected chip's label disappears. The rule sets `HighlightText` on a
  `Highlight` fill, but Chromium draws its text backplate in Canvas behind the
  label, so the text is white on white and only the check stays. This breaks
  anatomy convention item 4 and makes the active filter unreadable for high
  contrast users. Fix: `forced-color-adjust: none`
  on the selected root with its system colors, or drop the fill and mark
  selection by border plus check. Check Button and ToggleButton, which may use
  the same pattern. Evidence: `shots/batch-7/chip-selected-forced-colors.png`.
- note: `packages/react/src/components/Chip/Chip.tsx:173`, `:16` and
  `Chip.manifest.json:165`. The order says `remove` is a CloseButton root.
  CloseButton is merged; the comment and manifest saying it is not are false.
  Repeats lane 9A change 3.
- note: `Chip.tsx:114`. The `ds={'chip' as 'button'}` cast remains. Repeats
  lane 9A change 1 (ButtonBase type).
- note: `Chip.tsx:154`. The default remove name is English ("Remove Arabic")
  inside Arabic. See "Open across the batch", item 1.
- note: `packages/css/src/components/Chip.css:95`. An xs removable chip is 26px
  tall against 24px for a pressable one, so a mixed xs row is 2px out of line.
- note: `packages/react/src/components/Chip/Chip.demo.tsx:86`. "Add filters
  back" is a Chip used as an action; the manifest's `insteadUse` sends
  actions to Button. Use a Button in the demo.
- note: `Chip.css:216`. In Studio the selected accent fill is 1.66:1 (dark)
  and 1.51:1 (light) against the page, 1.07:1 in Desk light. Selection still
  reads by the check and `aria-pressed`, so 1.4.1 passes. Open in the lane
  report as Studio dial 2.

Verified: Enter and Space toggle `aria-pressed`; Delete, Backspace and Enter
on remove remove the chip; a disabled chip blocks Delete and stays focusable.
Remove names "Remove filter Images", "إزالة فلتر العربية". Remove is 24 by 24
(28 in Neutral), chips at least 24 tall (2.5.8). Focus after remove goes to
the next chip, then the previous at the end, then the reset control (2.4.3).
Focus ring on a selected chip is a double ring, outer 4.7:1 or better.
Outline borders 3.3:1 or better.

## Open across the batch

1. **English defaults in Arabic.** Avatar `statusLabel`, AvatarGroup
   `overflowLabel` and Chip `removeLabel` default to English on an Arabic
   page. A shared `lang` aware default, as Stat does for `loadingLabel`,
   removes three traps.
2. **Faint state fills.** `overlay-20` on `overlay-5` or a surface measures
   1.5:1 to 1.9:1 in every style: Tabs soft, TabBar pill, Dock active tile,
   Pagination current page, Toolbar on fill. Where such a fill marks state, it
   needs a 3:1 edge (Toolbar has one). A semantic `color.border.selected` at
   3:1 would let every component reach for one token. Neutral's weight step
   (500 to 600) also makes every "by weight" cue weaker than in Studio and
   Desk.
3. **The `motion` key for components that play nothing.** Rail, SkipLink,
   Breadcrumbs and LanguageSwitch omit it; Pagination sets `none`;
   AvatarGroup, Badge and Chip name `fade-rise`; TableOfContents names a
   pattern it plays with other values. The batch 9 review raised the same.
   It needs one decision in `DECISIONS.md`.
4. **Arabic small text.** `packages/css/src/base.css:78` steps up only
   `font-size-s`, so Badge, xs Chip, the AvatarGroup count and Rail labels
   stay at 9 to 11px in Arabic, against section 12 of PLAN.md ("small text
   one step up"). Step `xs` up under `:lang(ar)` or record the exception.
5. **Merged dependencies not wired.** Tooltip (Sidebar, Rail, Toolbar),
   Drawer (Navbar), StatusDot (Avatar), CloseButton (Chip), ToggleButton
   (Toolbar), Popover (AvatarGroup demo). Each is a lane change marked "after
   the merge"; all those merges are in. While open, the manifests that say
   "not built yet" are false.
6. **Inert links leave the tab order.** `ButtonBase.tsx:170` to `176` drops
   the href without adding `tabIndex`. Every inert Button or IconButton link
   rendered with `asChild` is affected. Owned by Button; route it there with
   the Pagination fix.
7. **Same specificity, later import wins.** Component CSS is imported
   alphabetically into one `ds.base` layer, so a component that restyles a
   nested Link (or any component sorting after it) at equal specificity
   loses. That is the Breadcrumbs blocker; any part rule written as
   `[data-ds='x'] [data-part='y']` over a nested root is exposed.
8. **Gallery paints link parts.** `apps/gallery-react/src/gallery.css:66`,
   `[data-gallery='root'] a:not([data-ds])` in layer `ds.overrides`, beats
   `ds.base` and paints every link part without its own `data-ds` in
   `color.text.link`: the items of Sidebar, Rail, Navbar, TabBar, Dock and
   others. In the gallery TabBar's inactive and current labels came out the
   same color, and Neutral light Sidebar items draw blue. Gallery shots and
   contract axe runs therefore do not show the components' own colors. Lead owned: add `:not([data-part])`. Evidence:
   `shots/batch-7/tab-bar-gallery-link-rule-paints-items.png`.
9. **DECISIONS entries asked for and not written:** Tabs native `disabled`,
   Dock md tiles at 44px, Toolbar `aria-disabled`.
10. **Landmark names.** "الرئيسية" names the landmark in Sidebar and Navbar
    and is also the Home item; Rail uses "التنقل الرئيسي". TabBar and Dock
    demos repeat one name for every bar. Use one distinct name per landmark.

## Repeats and new

Repeats of lane open points: the Tooltip, Drawer, StatusDot, CloseButton and
ToggleButton swaps, the Dock edge label, the motion key, the room token for
Dock and TabBar, the AvatarGroup ring token, Breadcrumbs `states`, the Avatar
loading case and "بعيد".

New, not in any lane report: the Sidebar sticky footer and the contract
failure it causes, the Navbar end action truncation as a 1.4.10 failure, the
Tabs, Dock and Pagination indicator contrast, the Dock 1.4.13 failures, the
Pagination focus losses and NaN summary, the Breadcrumbs specificity loss,
the TableOfContents fragment crash, the Avatar 1.4.1 failure, the Chip forced
colors label, and the gallery link rule. The 7C lane report claims focus
retention in Pagination and truncation in Breadcrumbs; both are contradicted
above.
