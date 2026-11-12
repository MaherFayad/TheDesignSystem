# Adoption guide: GoBanana

How GoBanana (GB) moves from its Studio CSS (`.st-*`), its studio and window
components and its desktop pages to the system. Written in order 1.19.

**Not checked against the source.** The GoBanana repository could not be
fetched in this session: attaching `MaherFayad/GoBanana` read only was
refused. This guide is built from what the system already holds about GB:
`docs/contracts/token-mapping.md` (written from GB's token files in order
0.4), `AGENTS.md`, the wave 0 and wave 1 orders (whose "Read" lines name each
GB file and line range an order was built from), the manifests and the wave 0
reports. Every path and line number below is quoted from those orders, not
read again. The last section lists what to check before the move starts.

Real adoption is a HUMAN GATE: the owner decides at the end of wave 1 whether
and when GB starts. This guide is the plan, not the change.

## What GB is, as far as the system knows

- A Next app router product in `banana-server/`, with a `[locale]` route
  segment (English and Arabic), site pages, an admin console and a desktop
  (Desk) experience for the marketing pages.
- Studio styles in `banana-server/styles/studio-components.css` (`.st-btn`,
  `.st-input`, `.st-menu` and so on) on the tokens in
  `banana-server/styles/studio-tokens.css` (`--st-*`).
- Desk styles in `app/(site)/_components/desktop/desktop.css` and
  `window-layer.css`, with `--st-desk-*` values.
- React components in `banana-server/components/studio/` (Dialog, Tooltip,
  Kbd, `modalStack.ts`, `shortcutKeys.ts`), `components/window/` and the site,
  desktop and admin `_components` folders.

The system's Studio and Desk styles are GB's own values: Studio is
`studio-tokens.css` renamed, Desk is Studio dark plus the `--st-desk-*`
values. The consumer that matches GB is `examples/consumer-next`. Copy from
it.

Short forms used below, as in `docs/plan/wave-1.md`:

- `GB css` = `banana-server/styles/studio-components.css`
- `studio/` = `banana-server/components/studio/`
- `desktop/` = `banana-server/app/(site)/_components/desktop/`
- `site/` = `banana-server/app/(site)/_components/`
- `admin/` = `banana-server/app/(site)/[locale]/(pages)/(home)/admin/_components/`
- `pages/` = `banana-server/app/(site)/[locale]/(pages)/`

## What to install

```json
"dependencies": {
  "@the-system/react": "0.0.0",
  "@the-system/tokens": "0.0.0",
  "@the-system/css": "0.0.0",
  "@the-system/styles": "0.0.0"
}
```

`@the-system/react` brings `radix-ui` and `react-aria-components` (behavior),
`@the-system/icons`, `@the-system/motion` and `@the-system/shared`.
`@the-system/styles` brings the fonts (Inter, Instrument Sans, IBM Plex Sans
Arabic). React and React DOM stay GB's own (peer dependencies, React 19).
Add `@the-system/cli` as a dev dependency for `ds doctor` and `ds init`.

The packages export TypeScript and CSS source, so Next must compile them:

```ts
// next.config.ts
transpilePackages: [
  '@the-system/react', '@the-system/shared', '@the-system/icons',
  '@the-system/motion', '@the-system/styles', '@the-system/css', '@the-system/tokens',
],
```

Turbopack (the Next 16 default) and `next build --webpack` both build it
(proved in `examples/consumer-next`).

## CSS import order

In the root layout, before the product's own CSS:

```ts
import '@the-system/tokens/css'; // tokens for every style
import '@the-system/css';        // reset, base, components
import '@the-system/styles';     // recipes and fonts for every style
import './app.css';              // GB's own CSS last
```

The system draws in cascade layers (`ds.reset`, `ds.tokens`, `ds.base`,
`ds.recipes`, `ds.overrides`). GB's CSS is not in a layer, so it wins over
every system rule without `!important`, whatever the order. That is also the
trap of the move: a `.st-*` rule that still matches a moved element overrides
the system. Remove each `.st-*` block when its last user moves.

`studio-tokens.css` and the system tokens load side by side during the move.
They do not clash: GB's names start with `--st-`, the system's with `--ds-`.

## Root Theme

In the root layout (a server component), stamp `<html>` with
`themeAttributes` so the first paint is themed and `lang` and `dir` are right,
then render one root `Theme`, the `Toaster` and one `TooltipProvider`:

```tsx
import { Theme, Toaster, TooltipProvider, themeAttributes } from '@the-system/react';

<html {...themeAttributes({ style, scheme, lang: locale })}>
  <body>
    <Theme style={style} scheme={scheme} lang={locale}>
      <Toaster />
      <TooltipProvider>{children}</TooltipProvider>
    </Theme>
  </body>
</html>
```

- `style` is `studio` for the product and admin, `desk` for the desktop
  pages. Read it, and `scheme`, from a cookie in the layout, as
  `examples/consumer-next/lib/theme-cookie.ts` does, so the server render
  matches the client.
- `lang="ar"` sets `dir="rtl"`; the components mirror on their own and the
  Arabic labels of Dialog, Toast, Window and Form come from their defaults.

## Component map

Every GB source a wave 1 or wave 0 order was built from, with the system
component that replaces it and the order id. Line numbers are from the
orders.

### Studio CSS (`GB css`) and studio components

| GB source | System component | Order |
| --- | --- | --- |
| `GB css` `.st-btn` (lines 92 to 308), `RollButton.tsx` | Button, IconButton | 0.9, 1.1.1, 1.1.2 |
| `GB css` lines 92 to 160 (buttons side by side) | ButtonGroup | 1.1.3 |
| `GB css` lines 242 to 258 (selected toggle) | ToggleButton | 1.1.5 |
| `GB css` `.st-spinner` (lines 72 to 90) | Spinner | 1.5.9 |
| `GB css` `.st-input` | Field, Input | 0.10, 1.2.1, 1.2.3 |
| `GB css` `.st-input` (multi line) | Textarea | 1.2.4 |
| `GB css` lines 310 to 400 (adornments) | InputGroup | 1.2.11 |
| `GB css` `.st-menu` (lines 402 to 528) | DropdownMenu, ContextMenu, SplitButton menu | 1.6.8, 1.6.9, 1.1.4 |
| `GB css` `.st-menu` (as a value list) | Select | 1.3.6 |
| `GB css` lines 449 to 528 (menu items) | ListBox | 1.3.11 |
| `GB css` `.st-menu` (surface) | Popover | 1.6.5 |
| `GB css` `.st-menu-sep` (lines 521 to 528) | Separator | 1.8.6 |
| `GB css` lines 530 to 607, `studio/Tooltip.tsx` | Tooltip | 1.6.6 |
| `GB css` lines 859 to 901, `studio/Kbd.tsx` | Kbd | 1.9.5 |
| `studio/shortcutKeys.ts` | Kbd, CommandPalette | 1.9.5, 1.6.11 |
| `GB css` `.st-chip` (lines 903 to 972) | Chip | 1.9.4 |
| `GB css` `.st-tile-grid`, `.st-tile`, `.st-tile-title` (lines 974 to 1066) | Tile, Grid, Bento | 1.9.10, 1.8.2, 1.8.11 |
| `GB css` `.st-section` (lines 1068 to 1135) | Section, Fieldset (legend) | 1.8.4, 1.4.2 |
| `GB css` `.st-section-toggle` (lines 1093 to 1135) | Accordion | 1.9.11 |
| `GB css` `.st-alert` (lines 1137 to 1207) | Alert, Callout, FieldError | 1.5.1, 1.5.3, 1.4.3 |
| `GB css` `.st-alert a` (lines 1204 to 1208) | Link | 1.1.8 |
| `GB css` lines 1209 to 1245 | Skeleton | 1.5.8 |
| `GB css` `.st-empty` (lines 1247 to 1289) | EmptyState, ErrorState | 1.9.12, 1.5.11 |
| `studio/Dialog.tsx`, `modalStack.ts` | Dialog | 0.11, 1.6.1 |
| `studio/Dialog.tsx` (danger tone) | AlertDialog | 1.6.2 |
| `studio/Dialog.tsx` (close button) | CloseButton | 1.1.9 |
| `toastBus.ts` | Toast, `toast()` | 0.12, 1.5.4 |

### Window and desktop (Desk)

| GB source | System component | Order |
| --- | --- | --- |
| `components/window/`, `desktop/Window.tsx`, `FrameLights.tsx` | Window, TitleBar, WindowControls | 0.13 |
| `desktop/MenuBarMenu.tsx`, `desktop/MenuClock.tsx`, `desktop.css` lines 154 to 400 | Menubar | 1.6.10 |
| `desktop/MenuBarMenu.tsx` (one menu) | DropdownMenu | 1.6.8 |
| `desktop.css` lines 154 to 283 | Navbar | 1.7.1 |
| `desktop.css` popover rules | Popover | 1.6.5 |
| `desktop/NotificationStack.tsx`, `desktop.css` lines 746 to 854 | NotificationCenter | 1.5.12 |
| `desktop/Dock.tsx`, `desktop.css` lines 1169 to 1287 | Dock | 1.7.12 |
| `desktop/MailApp.tsx`, `desktop.css` lines 1040 to 1168 | SplitView | 1.8.9 |
| `desktop/MailApp.tsx` (message list) | List | 1.9.7 |
| `desktop/MailApp.tsx` (`.mail-avatar`) | Avatar | 1.9.1 |
| `desktop/MailApp.tsx` (accordion rows) | Accordion | 1.9.11 |
| `desktop.css` lines 1327 to 1542 (phone home screen) | TabBar | 1.7.8 |

### Site

| GB source | System component | Order |
| --- | --- | --- |
| `site/PricingToggle.tsx` | SegmentedControl, ToggleButton | 1.1.7, 1.1.5 |
| `site/SiteNav.tsx` | Navbar, Link | 1.7.1, 1.1.8 |
| `site/SiteNav.tsx` (`switchLocalePath`) | LanguageSwitch | 1.7.13 |
| `site/SiteNav.tsx` (badge inside a link) | Badge | 1.9.3 |
| `site/CodeBlock.tsx`, `pages/(home)/install/CopyButton.tsx` | CopyButton | 1.1.10 |
| `site/ExportTabs.tsx`, `pages/(home)/install/InstallTabs.tsx` | Tabs | 1.7.4 |
| `site/AnchorScroll.tsx` | TableOfContents | 1.7.10 |
| `site/NotFoundView.tsx` | ErrorState | 1.5.11 |
| `site/landing.css` (`.mock-status-dot`, line 554) | StatusDot | 1.5.10 |
| `site/landing.css` (page widths) | Container | 1.8.3 |
| `site/landing.css` (tile layouts) | Bento | 1.8.11 |
| `app/(site)/site.css` lines 77 to 100, `app/(site)/[locale]/layout.tsx` | SkipLink | 1.7.11 |
| `app/(site)/[locale]/layout.tsx` | PageShell | 1.8.12 |

### Pages

| GB source | System component | Order |
| --- | --- | --- |
| `pages/takedown/TakedownForm.tsx` | Form | 1.4.1 |
| `pages/takedown/TakedownForm.tsx` line 257 | Textarea | 1.2.4 |
| `pages/takedown/TakedownForm.tsx` line 275 | Checkbox, ConsentField | 1.3.1, 1.4.6 |
| `pages/takedown/TakedownForm.tsx` (check lists) | CheckboxGroup | 1.3.2 |
| `pages/takedown/TakedownForm.tsx` lines 216 to 240 | RadioGroup | 1.3.3 |
| `pages/(home)/account/DeleteAccount.tsx` | ConsentField, AlertDialog | 1.4.6, 1.6.2 |
| `pages/(home)/account/AccountWindow.tsx` | Avatar | 1.9.1 |
| `pages/gallery/GalleryFilter.tsx` | FilterBar | 1.4.5 |
| `pages/(home)/canvases/Dashboard.tsx` | Toolbar | 1.7.9 |
| `pages/(home)/canvases/dashboard.css` (badge) | Badge | 1.9.3 |

### Admin

| GB source | System component | Order |
| --- | --- | --- |
| `admin/ui.tsx` `PeriodSwitch` | ToggleGroup | 1.1.6 |
| `admin/ui.tsx` `StatusChip` | StatusDot | 1.5.10 |
| `admin/ui.tsx` `LoadError` | ErrorState | 1.5.11 |
| `admin/ui.tsx` `Section` | Section | 1.8.4 |
| `admin/ui.tsx` `TableScroll` | ScrollArea | 1.8.7 |
| `admin/ui.tsx` `Chip` | Chip | 1.9.4 |
| `admin/ui.tsx` `StatTile` (line 138) | Stat | 1.9.6 |
| `admin/ui.tsx` `Empty` | EmptyState | 1.9.12 |
| `admin/TelemetrySwitch.tsx` | Switch | 1.3.5 |
| `admin/FeedbackList.tsx` (rating display) | Rating | 1.3.14 |
| `admin/RunSignals.tsx` (`.adm-meter`) | Meter | 1.5.7 |
| `admin/AdminNav.tsx` | Sidebar, PageShell | 1.7.2, 1.8.12 |

### Tokens

| GB source | System | Order |
| --- | --- | --- |
| `banana-server/styles/studio-tokens.css` (`--st-*`, dark and light) | `--ds-*`, one row each in `docs/contracts/token-mapping.md`, section "GoBanana studio-tokens.css" (427 rows) | 0.4, 0.5 |
| `--st-desk-*`, `desktop.css`, `window-layer.css` values | the Desk style, `packages/styles/desk/` | 0.4, 0.17 |
| `studio-tokens.css` surface steps | Surface | 1.8.5 |

The name rule: the new name in the table, dots to dashes, `--ds-` in front.
`--st-accent-1` is `color.accent.1`, so `var(--ds-color-accent-1)`.

## Order of replacement

1. **Install and import.** The packages, `transpilePackages`, the three CSS
   imports and the root Theme in the layout. GB's CSS stays loaded. Nothing
   changes on screen.
2. **Run `ds doctor` once** and keep the report as the baseline (see below).
3. **Buttons:** Button, IconButton, Spinner, then ToggleButton and
   ButtonGroup. Most other components draw on the Button base.
4. **Text entry:** Field and Input, then Textarea and InputGroup, then the
   takedown form on Form, Checkbox, RadioGroup and ConsentField.
5. **Messages:** Toast (replace `toastBus.ts` with `toast()`), Alert,
   Callout, EmptyState, ErrorState, Skeleton.
6. **Overlays:** Dialog and AlertDialog (with `modalStack.ts` gone: Radix
   stacks dialogs), then Tooltip, DropdownMenu, ContextMenu, Select,
   Popover. Test each screen by keyboard: focus trap, Escape, focus return.
7. **Desk:** Window with TitleBar and WindowControls, then Menubar, Dock,
   NotificationCenter, SplitView, TabBar. Desk pages switch the root Theme
   to `style="desk"`.
8. **Site and admin:** Navbar, LanguageSwitch, Link, Tabs, CopyButton,
   TableOfContents, SkipLink, PageShell, Sidebar, then the admin `ui.tsx`
   parts.
9. **Tokens:** replace each `var(--st-*)` left in GB's own CSS with its
   `--ds-*` name from the mapping table, delete the empty `.st-*` blocks,
   then `studio-components.css` and `studio-tokens.css`.
10. **`ds doctor` clean**, then `ds init` for `AGENTS.md` and `DESIGN.md`.

Each step ships on its own. Remove the `.st-*` block and the old component in
the same change that moves its last user.

## Risks

1. **Desk glass contrast.** In Desk dark, muted and subtle text on glass
   measures 3.04 to 4.33, and window text over a white backdrop 3.02 to
   3.37, below the 4.5:1 of WCAG 2.2 SC 1.4.3 (contrast, minimum). These are
   GB's own values; the system keeps them as known failures in its contrast
   gate and waits on the owner (`docs/reports/wave-0.md`, "Waiting on the
   owner", item 2): change the values, or confirm bright content never sits
   behind Desk glass. Until then, on Desk pages keep photos and bright
   embeds out from behind windows, and use bright text on glass for anything
   a person must read. Under reduced transparency or more contrast the glass
   turns solid. Desk Light is "proposed" (`docs/reports/desk-light.md`) and
   not for production yet.
2. **28px versus 32px.** GB's controls default to 28px; the system default
   size is `md`, 32px, decided in wave 0 (`docs/reports/wave-0.md`, "Default
   size"). A screen moved as is grows by 4px per control row. Where the
   studio must keep 28px, set `density="compact"` on its Theme (there `md`
   is 28px) or `size="sm"` on a control. Both heights pass WCAG 2.2 SC 2.5.8
   (target size, 24px minimum); keep 44px targets on touch layouts
   (`ds/touch-target`).
3. **Unlayered CSS wins.** A `.st-*` rule left on a moved element overrides
   the system without a warning. Remove the block with the component.
4. **Behavior changes with Radix.** Menus and selects gain typeahead and RTL
   arrow keys, dialogs stack through Radix instead of `modalStack.ts`, and
   toasts above an open dialog are visible and clickable but keyboard focus
   stays in the dialog (`docs/reports/wave-0.md`, "Decisions that differ").
   Tests that counted on the old focus order need updating.
5. **Arabic copy.** The Arabic defaults of the system follow GB's
   `docs/arabic-copy-cookbook.md` (noun form labels, no diacritics, Western
   digits). Product copy keeps its own strings; the system only supplies the
   labels of its own chrome.
6. **Known system bugs from order 1.18** (`docs/reports/lanes/order-1-18.md`):
   a Tooltip whose hint repeats an IconButton's label drops the button's own
   `onClick`, and `ds doctor` reports a Tooltip around a DropdownMenu trigger,
   DropdownMenuContent, and FieldLabel or FieldError as Field children.
   `examples/consumer-next/components/BoardsScreen.tsx` shows the workaround
   for each until the fixes land.

## How to run `ds doctor`

From `banana-server/`, with `@the-system/cli` installed:

```sh
npx ds doctor                 # text: one line per finding, then a count
npx ds doctor app/(site)      # one folder
npx ds doctor --json          # { apiVersion: 1, type: "doctor.report", data: { findings, summary } }
```

It exits with 1 when there is an error, so it can gate CI. The rules have
stable ids (`ds/no-raw-color`, `ds/no-raw-value`, `ds/token-vocabulary`,
`ds/logical-properties`, `ds/direction`, `ds/primitives`, `ds/no-radix-import`,
`ds/touch-target`, `ds/copy`, `ds/no-dash`, `ds/slot-limits`,
`ds/shared-axes`, `ds/no-native-title`). It reads `.tsx`, `.css` and Angular
templates. During the move, a `ds.doctor.json` at the root skips the folders
not yet moved and marks touch layouts:

```json
{
  "exclude": ["app/(site)/_components/desktop"],
  "touch": ["app/(site)/[locale]/(pages)/*"]
}
```

Remove each `exclude` entry as its folder moves. Turning a rule `"off"` is
possible but hides real findings; prefer `exclude`. Expect `ds/no-raw-color`
and `ds/no-raw-value` on every `.st-*` file until step 9: those files go
away, so exclude `banana-server/styles` rather than fixing them.

## Check before the move starts

Not verified in this session, because GB was not reachable:

- That every path and line range above still exists at GB's current commit.
  The orders were written against an earlier one.
- GB's Next and React versions, its bundler (Turbopack or webpack) and how it
  loads `studio-components.css` today.
- How many files import each component, to confirm the order of
  replacement by use. The FK2 guide has those counts; this one does not.
- Whether GB's `toastBus.ts` call sites match `toast(title, { description,
  action })`.
- The exact `touch` and `exclude` paths for `ds.doctor.json`.

The token values themselves were checked in order 0.4 against GB's
`studio-tokens.css`, `desktop.css` and `window-layer.css`, and a test
(`packages/tokens/tests/mapping.test.ts`) keeps every mapped name present in
the token build.
