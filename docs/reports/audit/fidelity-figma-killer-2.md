# Fidelity audit: the system against Figma-Killer-2

Scope: how far the system is from Figma-Killer-2 (FK2), the editor it was meant
to be extracted from, and why. Analysis only. No source file was changed.
FK2 commit 51b1994, read only. Nothing under FK2's `vendor/alm-design-system`
was read, copied or cited.

Shorthand: FK2 paths are relative to `/home/user/maherfayad-stack/figma-killer-2`.
System paths are relative to `/home/user/TheDesignSystem`. Side by side shots
are in `docs/reports/audit/shots/figma-killer-2/` (source left, system right,
at 1440px and 390px). Source shots come from a harness that renders FK2's own
primitives and shell CSS modules from its source tree (see "What could not be
checked").

## Verdict

The Studio style is not the FK2 editor. It shares FK2's raw material (Inter
Variable, the fluid 11 to 13px text scale, the fluid space scale, the 24, 28,
32 and 44px control heights, the ten pastel accents, the inspector geometry
tokens) and then draws almost every part in a different language. FK2 is a
soft, rounded, filled dark editor: pill controls filled with white at 10 to 20
percent and no border, 12 and 16px rounded panels and menus that float on real
shadows, a gray canvas sheet set into a black frame, a rail of glowing tinted
icons, and quick eased motion with a small scale and rise. Studio today is a
hard, square, outlined monochrome kit: 2px corners on controls and 0px on
panels, menus, tooltips and cards, 1px white outlines, a white primary cell,
no shadow and no blur anywhere, inverted lit rows, and motion that cuts in
`steps()`. This was a choice, not drift: order 1.24 (`docs/reports/styles-apart.md`)
pushed Studio away from its own source to separate it from Desk, and the
"before" sheets (`docs/reports/shots/styles-apart/before/dialog-dark.png`)
show that Studio was closer to FK2 before that order. On top of the look,
the system has none of FK2's editor surfaces: no canvas, no notch toolbar, no
layer tree, no inspector panel, no property rows, no colour field. What is
left is a generic component library that borrows FK2's palette and type scale,
plus a ScrubInput whose behaviour does match FK2. The owner's "they don't look,
or function like the repos" is accurate for FK2.

## Scorecard

0 means nothing of the source, 5 means indistinguishable.

| Area | Score | Evidence |
| --- | --- | --- |
| Shell | 1 | FK2 is a 36px black top bar, 42px tinted rail, 320px layer panel, a `#282828` canvas sheet with a 16px top start corner, a notch toolbar and a 290px inspector (shot 01). The system has only PageShell, a generic boxed app frame with 1px rules on black. |
| Type | 3 | Same family and the same fluid scale (`--text-s` 11 to 12px in both). Weights differ: FK2 buttons 700, menu rows 560, section titles 700; Studio 500, 400 and 600. |
| Colour | 2 | Studio surfaces are `#0a0a0a`, `#111111`, `#1c1c1c` where FK2 has `#1b1b1b`, `#282828`, `#323232`. FK2 fills controls with white alpha; Studio outlines them at 40 percent and uses a solid white primary. Accents never reach the chrome. |
| Shape | 1 | FK2: controls 1em pill, menus 16px with 12px rows, panels and dialogs 12px, cards 16px, tooltips 6px. Studio: 2px controls, 0px menus, rows, tooltips, cards and panels. |
| Density | 3 | Control heights 24, 28, 32, 44 match; space scale matches; menu rows 28px in both. Inspector rows are 32px in FK2, 26 to 28px in the system ScrubInput demo. |
| Controls | 1 | Buttons, inputs, selects, segmented controls, switches and tabs are all redrawn as square outlined cells (shots 06, 08, 10, 11). ScrubInput is the one close part (filled field, glyph label). |
| Overlays | 1 | Menus, select lists, dialogs and tooltips are square tiles with a bright 1px rule and no shadow; FK2's are rounded, borderless or hairline, on `0 12px 28px` to `0 18px 48px` shadows (shots 14 to 17, 20). |
| Feedback | 2 | Toast is a one line square strip with a full tone outline; FK2 is a rounded card with a 2px start edge, blur and shadow. Durations close (4s, 6s; FK2 errors 8s, system danger stays). Dedupe with a repeat count exists in both. |
| Motion | 1 | Studio eases are `steps(2, jump-end)` and `steps(3, jump-end)`, all scales 1, all distances 0. FK2 uses `cubic-bezier(0.16, 1, 0.3, 1)` 130ms with `scale(0.97)` and a 4px rise for menus, 140ms rise for toasts, 80ms tooltip fade, 120ms tab panel rise. |
| Behaviour | 3 | ScrubInput matches FK2 almost key for key. Radix gives good keyboard menus. Tooltip waits 500ms where FK2 opens at once. Tree drag, panel resize, notch peek and every canvas gesture are missing. |

## How the gap happened

1. **Order 1.24 moved Studio away from its source.** The owner said Studio and
   Desk looked too close. Desk had been built as "Studio dark plus desk
   values" (`docs/contracts/token-mapping.md` line 19), so the two shared
   FK2's rounded panels. Instead of pulling Desk toward GoBanana alone, the
   order pushed Studio to "flat, hard, compact and monochrome. No shadow and
   no blur anywhere ... square overlays ... hard cuts in steps"
   (`docs/reports/styles-apart.md`, "The three looks in one line each").
   Order 1.28 then squared the controls too (the 1.24 report still says
   "Controls stay pills"; `packages/styles/studio/recipes/Button.css` header
   now says "flat, near square cells").
2. **The style dials in `PLAN.md` 3.7 already read FK2 as flatter than it is.**
   "Flat tone steps" and "Radius 3, 6, 8, 12, 16, pill inputs" are true of
   FK2's tiles and inputs, but FK2's overlays, toasts and dialogs carry real
   shadows and blur (`src/styles/globals.css:342-355`). The dials say nothing
   about the canvas sheet, the notch, the tinted rail glow, or the eased motion.
3. **Tokens were extracted; recipes were invented.** The token mapping carries
   FK2 values faithfully, but `packages/styles/studio/tokens.dark.json`
   overrides them (surfaces at lines 29 to 53, radius at 1629 to 1670,
   elevations at 1708 onward), and component CSS was written from the
   contract, not from FK2's CSS modules.
4. **The editor surfaces were never in scope as components.** PLAN.md lists
   FK2's 50 primitives as "reference", but the wave 1 batches built a general
   catalogue (149 components). The parts that make FK2 feel like FK2 are
   app level: `AdminCanvasLayout`, `PanelRail`, `TreeRow`, `CanvasRoot`,
   `CanvasNotch`, `PropertiesPanel`, `Section` in the inspector skin.

## Detailed differences

Gap words: same, close, different, missing.

### Shell and layout

| Part | Source | System | Gap | To close it |
| --- | --- | --- | --- | --- |
| Frame | Black body `--bg-body #000` behind everything; the canvas is a sheet of `--bg-surface-2 #282828` with `border-top-left-radius: 16px` and 12px top end when the inspector is open (`src/admin/pages/site/canvas/CanvasRoot.module.css:30-31`, `src/admin/layouts/AdminCanvasLayout/AdminCanvasLayout.module.css:80-82`) | PageShell: every region on black, split by 1px rules, no sheet (shot 01) | different | An editor shell template: body black, canvas region on surface 2 with the two corner radii, panels sit on body with no rules |
| Top bar | 36px, `--bg-body`, padding `--space-s`, 2 to 3px gaps, project name 11px 600 subtle, Share secondary sm, Publish primary sm (`src/admin/pages/site/toolbar/Toolbar.module.css:4-15, 73-89`) | PageShell header ~44px with a bordered "Create board" button and a 1px rule under it | different | A 36px TitleBar or Toolbar variant on body with no rule, sm pill buttons |
| Rail | 42px column, 6px padding, ghost md icon buttons; each item carries `--rail-icon-tint` from a job group (navigate gold `--accent-7`, style mint `--accent-1`, content lilac `--accent-2`, assist violet `--accent-9`); icon `drop-shadow(0 0 5px tint 28%)`, hover tint 10%, pressed tint 16%, a 2px x 14px tinted indicator that scales from 0.6 in 140ms (`src/admin/pages/site/sidebars/PanelRail/PanelRail.module.css:1-83`, `src/ui/railAccent.ts:37-48, 65-76`) | Rail: white icons with text labels under them, boxed with a 1px rule, white 2px indicator, no tint, no glow (shot 04, `packages/css/src/components/Rail.css` has no tint) | different | Add an icon only variant, a per item `tint` prop mapped to `color.accent.N`, the glow and tint fills in the Studio recipe; drop the box rule |
| Left panel | 320px default (`src/admin/state/workspaceLayout.ts:14`), no fill, width animates 180ms ease (`LeftSidebar.module.css:16-23`), resize handle | Sidebar: navigation list with group headings, boxed (shot 05) | different | A panel slot with resize, sized from tokens; reuse ResizablePanels |
| Layer tree | TreeRow: 28px rows (36 comfortable), 8px radius, text 11 to 12px 500 muted, hover and selected `--overlay-10`, 14px chevron rotating 90deg in 120ms, 14px icon slot in disabled text, hidden rows 35 percent (`src/admin/pages/site/ui/Tree/TreeRow.module.css:3-140`) | No tree component. List and ListBox only | missing | A Tree component with roving focus, expand keys, drag with drop lines (`TreeDrop.module.css`), rename |
| Canvas toolbar | CanvasNotch: a body coloured tab hung from the canvas top centre, 16px bottom corners and inverse 16px top corners drawn with radial gradients, `0 12px 28px scrim-30`, peek mode rolls it up with a 600ms hide delay and 180ms roll (`src/admin/pages/site/canvas/CanvasNotch.module.css:5-143`) | None | missing | A Notch part on Toolbar (an optional part of Studio), with the peek behaviour as a prop |
| Inspector | 290px, `data-field-skin="inspector"`: fields are filled `#212426`, 8px radius, 32px rows, border only on hover and focus, 12px side padding, 8px between groups, sections split by an `--overlay-10` hairline, title 11px 700, section icon swaps to a chevron on hover (`src/styles/globals.css:288-313`, `src/ui/components/Section/Section.module.css:10-178`) | Section exists and cites FK2 (`packages/css/src/components/Section.css:1-30`); ScrubInput is filled; no inspector scope, no panel | close for Section, missing for the panel | An `inspector` scope attribute (or density) that switches Input, Select, SegmentedControl, ScrubInput and IconButton to the filled 8px skin |
| Windows, menu bar, dock | FK2 has none | Window, TitleBar, WindowControls, Menubar, Dock exist and render in Studio | invented (for FK2) | Fine as Desk parts; keep them out of Studio demos |
| Phone | FK2 is a desktop editor: under 900px the left panel collapses to the rail when the inspector is open, under 760px the inspector overlays (`src/admin/pages/site/layout/responsiveChrome.ts`, `RightSidebar.module.css:58-65`) | PageShell collapses to a menu button; the gallery is phone first | different | Not a fidelity priority; keep the system's phone work |

### Typography

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Family | Inter Variable, `system-ui` fallback (`globals.css:21`) | Inter Variable (`packages/tokens/dist/css/studio.css`, `--ds-font-family-sans`) | same |
| Scale | `--text-xs` 10 to 11, `--text-s` 11 to 12, `--text-m` 12 to 13, `--text-l` 13 to 14 (`globals.css:39-45`) | `--ds-font-size-xs` to `l` identical clamps (`packages/tokens/dist/css/tokens.css:110-114`) | same |
| Button label | 700, `--text-s` (`Button.module.css:8-9`); measured 12px/700 | 500 with tabular figures (`packages/styles/studio/recipes/Button.css`); measured 12px/500 | different |
| Menu row | 12px/560 (`ContextMenu.module.css:107-114`) | 12px/400, medium only when checked | different |
| Dialog title | `--text-l` 700, line height 1.2, optional 9 to 10px uppercase eyebrow with 0.12em tracking (`Dialog.module.css:63-84`) | 14px/600, no eyebrow part | close |
| Tile title | 11px 600 uppercase, 0.07em tracking, subtle, with a 7px tint dot (`docs/design.md` "Tile cards") | Tile title 13px 600 sentence case, no dot (shot 12) | different |
| Tabs | 14px 500, active 600, 2px underline merged into a 1px rule (`Tabs.module.css:11-55`) | Tabs, see shot 11 | close |
| Tracking | 0 everywhere except uppercase labels | 0 | same |

### Colour and surfaces

| Item | Source | System Studio dark | Gap | To close it |
| --- | --- | --- | --- | --- |
| Surfaces | body `#000`, surface `#1b1b1b`, 2 `#282828`, 3 `#323232`, 4 `#4a4a4a`, 5 `#605f5f` (`globals.css:76-81`) | `#000`, `#0a0a0a`, `#111111`, `#1c1c1c`, `#4a4a4a`, `#606060` (`packages/styles/studio/tokens.dark.json:29-53`) | different | Put the FK2 values back (the mapping already says so) |
| Text | bright `#f4f4f5`, default `#ededed`, muted `#a1a1aa`, subtle `#787878` (`globals.css:90-93`) | `#f5f5f5`, `#ededed`, `#a3a3a3`, `#8f8f8f` (subtle raised for contrast, a GB A11y change) | close | Keep the A11y change, note it |
| Control border | `--overlay-20` (white 20 percent), hover 30, focus 50 (`Input.module.css:7-22`) | `border.control` white 40 percent, hover 60 | different | Studio recipe uses overlay 20, 30, 50; check the 3:1 control contrast rule (SC 1.4.11) with the owner, since FK2's 20 percent is under it |
| Primary | `--overlay-20` fill, `--text` label, hover `--overlay-30` (`Button.module.css:187-196`) | `#f5f5f5` fill, black label, hover `#d4d4d4` | different | Primary is a white alpha fill, not an inverted cell |
| Accents | Identity on rail icons, tile dots, tag pills, widget headers | Only in tags and charts | different | Wire accents into Rail, Tile and Chip tints |
| Canvas neon | selection `#39ff14`, hover `#ff2bd6`, selector `#ff8800` | Tokens exist (`color.canvas.*`), no component uses them | missing | Used by the missing canvas parts |
| Glass and grain | FK2 has no grain; floating panels and toasts use `backdrop-filter: blur(24px)` (`globals.css:342`, `Toast.module.css:38`) | Studio blur tokens are 0px | different | Studio `blur.panel` 24px for toasts, popovers and the palette |
| Elevation | `--shadow-panel`: `inset 0 -1px 0 scrim-40, 0 12px 40px rgba(0,0,0,0.65)`; menus `0 12px 28px scrim-50`; dialog `0 18px 48px`; tooltip `0 4px 16px scrim-50, inset 0 1px 0 overlay-5`; tile hover `0 2px 4px scrim-30, 0 8px 20px scrim-40` (`globals.css:343-355`, `ContextMenu.module.css:18`, `Dialog.module.css:21`) | Every `--ds-elevation-*` is a transparent zero shadow | different | Restore the FK2 shadows in `tokens.dark.json` 1708 onward |
| Light scheme | FK2 light: body `#e3e7ed`, surface `#fff`, 2 `#f6f7f9`, cool gray steps (`globals.css:670-687`) | Studio light: body `#e5e5e5`, neutral steps (1.24 removed "the old blue tint") (shot 02) | different | Restore the FK2 light block with the GB A11y changes, as the mapping states |

### Borders, separation and radius

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Radius scale | `--radius-sm` 3, `--radius` 6, `--panel-radius` 12, `--card-radius` 16, `--input-radius` 1em, `--tooltip-radius` 6, inspector field 8 (`globals.css:200-205, 308`) | xs 2, sm 2, field 2, control 2, panel 0, card 0, sheet 0, window 0, menu item 0 (`studio.css`, `tokens.dark.json:1629-1700`) | different |
| Cards | Borderless tiles on a darker parent, 1px grid gap, 16px radius, hover lifts tone and rises 2px (`docs/design.md` "Tile cards", `Widget.module.css`) | Tile: square, 1px gap kept, image placeholder block, selected tile gets a white 2px outline (shot 12) | different (the gap survived, the shape did not) |
| Floating panels | `1px solid --overlay-10` hairline, 12px radius, blur and shadow | 1px rule in the bright text colour, square | different |
| Menus | No border, 16px radius, `--bg-surface-3`, separators in surface 2 inset 5px (`ContextMenu.module.css:1-138`) | 1px `#f5f5f5` rule, square, `#111111`, edge to edge rows | different |
| Dialog | No outer border, 12px radius, header and footer bands on surface 2 with `--border` lines (`Dialog.module.css:14-98`) | 1px white rule, 2px radius, title band, full width split footer (shot 16) | different |

### Spacing and density

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Space scale | `--space-4xs` 2 to 3 ... `--space-xl` 12 to 14 (`globals.css:55-62`) | Same clamps at default density (`tokens.css:278-304`) | same |
| Control heights | micro 18, xs 22, sm 26, md 32, lg 44 for buttons; inputs 24, 28, 32 (`Button.module.css:72-103`, `Input.module.css:42-58`) | 24, 28, 32, 44 | close (FK2 buttons are 2px shorter at xs and sm) |
| Button padding | md `5px 12 to 14px`, sm `0 6 to 8px` | md `0 14px` | close |
| Inspector | 32px rows, 12px side padding, 6px field gap, 8px group gap, frozen px (`globals.css:288-313`) | `inspector.*` tokens exist with the same values; ScrubInput demo rows ~26 to 28px | close |
| Menu | 4px panel padding, 28px rows, 10px side padding | 0 panel padding, 28px rows, 10px side padding | close |
| Dialog | header `10 to 12px 12 to 14px`, body 16px, footer same as header | title 8 by 12px, body ~12px, footer flush | close |

### Icons

| Item | Source | System | Gap | To close it |
| --- | --- | --- | --- | --- |
| Set | `pixel-art-icons`, a solid pixel set on a 24 grid with filled glyphs, vendored subset of 117 (`vendor/pixel-art-icons/`, `docs/design.md` "Icons") | `pixelarticons` 2.4.2 (MIT), a 1px outline pixel set (`packages/icons/package.json:18`) | different | The sets are different libraries. FK2's vendored copy declares no licence (`vendor/pixel-art-icons/package.json`). Adopting it is a HUMAN GATE |
| Colour | Rail icons tinted with a glow; elsewhere muted text | White or muted only | different | Tint in Rail |
| Size | 14px in toolbars and inspector, 16px in the rail | 16px default | close | |

### Buttons and icon buttons

Source `src/ui/components/Button/Button.module.css`; system
`packages/css/src/components/Button.css` with
`packages/styles/studio/recipes/Button.css`. Shots 06 and 07.

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Shape | 1em radius (12px at 12px text): a pill | 2px | different |
| Border | none (`border: 0`) | 1px: control border on soft, fill colour on solid | different |
| Primary | white 20 percent fill, `#ededed` label, hover 30 percent, active 20 | solid `#f5f5f5`, black label, hover `#d4d4d4`, press turns into its own outline | different |
| Secondary | white 10 percent, muted label, hover 20 and bright label, active 30 | transparent with a 40 percent border, hover overlay 5 and bright border, press inverts to white | different |
| Ghost | transparent, muted, hover overlay 10, active 20 | transparent, muted | close |
| Destructive | `--danger-10` tint, `--danger` label, hover opacity 0.9 | danger solid is a red fill with dark text | different |
| Transition | colour, background, border, opacity 150ms ease | `transform 0.12s steps(3)`; colour swaps cut | different |
| Focus | `0 0 0 1px --overlay-20` (`globals.css:341`) | 2px ring `#f5f5f5` | different (the system is the stronger, accessible one; keep it) |
| Disabled | opacity 0.38 | opacity 0.38 | same |
| Loading | 12px ring spinner, 2px, 0.8s linear, label hidden | Spinner in place | close |
| Icon only | square at the row height; inspector skin 32px at 8px radius, ghost hover to the field fill | IconButton, 2px corners | different |

### Inputs, number and scrub fields

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Input | transparent, 1px white 20 percent, 1em pill, hover 30, focus 50, placeholder `--text-disabled`, invalid border danger (`Input.module.css:3-103`) | transparent, 1px white 40 percent, 2px corners (shot 08); pill is a shape option | different |
| Prefix and unit | prefix in subtle text, tabular, no right pad; unit at the end (`Input.module.css:172-208`) | InputGroup adornments with icons and units | close |
| Number spinner | a 18px column of two stacked buttons inside the field with a hairline (`Input.module.css:228-281`) | NumberField with its own steppers | close |
| ScrubInput look | outline pill by default, filled `#212426` 8px in the inspector; label glyph in subtle text, `ew-resize`; while dragging the border turns canvas green `#39ff14` (`ScrubInput.module.css:4-149`) | filled field, 2px corners, label and unit (shot 09) | close in look, different in radius and drag colour |
| ScrubInput behaviour | drag the label, arrow keys step 1, Shift 10, Alt 0.1, typed math (`12*2`), Enter commits and keeps focus and selects, Escape reverts, mixed shows italic (`ScrubInput.tsx:9-43, 256-288`) | the same list: pointer capture on the label, arrows, expressions, Enter keeps focus, Escape reverts, mixed (`packages/react/src/components/ScrubInput/ScrubInput.tsx:3-16, 240-312`) | same |

### Selects and menus

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Select trigger | the Input look: pill, white 20 percent border, open adds the 1px focus ring; 14px chevron in disabled text (`Select.module.css:3-111`) | square outlined field with an up and down chevron pair | different |
| Select list | the ContextMenu surface: surface 3, 16px radius, 12px rows, shadow (shot 15) | square list, 1px bright rule, lit row inverted white with black text, two line rows | different |
| Group header | 10 to 11px 650 uppercase, 0.04em | group label | close |
| Search in menu | `MenuSearchHeader` pinned above a scrolling list | Combobox and Autocomplete instead | close |
| Context menu | opens at the pointer; `transform-origin: top center`; enter 130ms `cubic-bezier(0.16,1,0.3,1)` from `translateY(-4px) scale(0.97)`; exit 100ms to `translateY(-3px) scale(0.98)`; viewport clamp `100vh - 16px` (`ContextMenu.module.css:1-76`) | Radix ContextMenu, opens at the pointer, shortcuts shown, submenus; appears "by an opacity step in place, no travel, no scale" (`packages/styles/studio/recipes/DropdownMenu.css:1-25`) | different in look and motion, close in behaviour |
| Danger row | ghost danger tone: red text, hover `--danger-10` | red text, lit row a red fill | close |
| Selected row | check at the end, no fill | check and medium weight | same |

### Context menus, dialogs, popovers and tooltips

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Dialog panel | surface `#1b1b1b`, 12px radius, `0 18px 48px` shadow, sizes 360, 440, 520, 640, 820, max 80vh (`Dialog.module.css:14-44`) | square to 2px, 1px white rule, no shadow; same width tokens | different |
| Dialog header | band on surface 2, 1px `--border` under it, eyebrow plus title, 26px close button column | title band, square ghost close | close |
| Dialog footer | band on surface 2, 1px line above, right aligned, 6 to 8px gap, sized buttons | full width split cells, primary a white block (shot 16) | different |
| Scrim | `color-mix(--bg-body 50%)`, no blur | flat scrim, no blur | close |
| Desk dialog | n/a | rounded, title band, right aligned pills (shot 17). Desk is closer to FK2's dialog than Studio is | note |
| Tooltip | `--bg-body` bubble, 1px overlay 5 hairline, 6px radius, `--shadow-tooltip`, 12px 500 text with 0.01em tracking, 6px rotated arrow, max 240px, opens at once on hover, 80ms fade (`Tooltip.module.css:16-103`, `Tooltip.tsx:106-109`) | inverted `#f5f5f5` chip with black text, square, no arrow, no shadow, opens after 500ms, 300ms skip (`packages/react/src/components/Tooltip/Tooltip.tsx:85-87`) | different |
| Popover | InspectorPopover anchored to a cluster with the inspector skin on its root | Popover, HoverCard | close in behaviour |

### Toasts

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Placement | fixed bottom end 16px, newest at the bottom (`column-reverse`), 8px gap, max 420px | bottom end, stacked 1px apart | close |
| Card | surface, 1px overlay 10, 12px radius, `--shadow-panel`, 24px blur, 16px icon column, title 12px 500 bright, body 11px muted clamped to 3 lines, mono location line (`Toast.module.css:27-153`) | a 28 to 32px one line strip, square, full outline in the tone colour, description ellipsed until hover (shot 18) | different |
| Tone | a 2px start edge in the tone colour only, icon tinted | full 1px tone outline and tone icon | different |
| Enter | 140ms ease out from `translateY(6px) scale(0.98)` | opacity step | different |
| Timing | info and success 4s, warning 6s, error 8s, all pause while hovered (`ToastProvider.tsx:37-42, 82-127`) | 4s, warning 6s, danger and action toasts stay (`packages/shared/src/toast.ts:148-151`) | close (the system choice is the accessible one) |
| Dedupe | same kind, title and body collapses with a repeat count (`toastBus.ts:59-73`) | dedupe key and an `x3` badge | same |

### Tabs and segmented controls

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Segmented | group: 12px radius, 1px overlay 20 border, overlay 5 fill, 2 to 3px padding; segment 8px radius, hover overlay 10, pressed overlay 20; dashed border when mixed; a clear overlay on the pressed segment when clearable (`SegmentedControl.module.css:12-100`) | default shape square outlined cells with a bright outlined thumb; a pill shape option (shot 10) | different (pill shape is close) |
| Segmented in inspector | no group chrome, 32px square segments, 8px radius, hover and pressed field fill | none | missing |
| Tabs | underline tabs, 0.1s colour, panel fades up 4px in 120ms (`Tabs.module.css:11-84`) | Tabs, underline (shot 11) | close in look, motion differs |

### Lists and layer trees

Covered under Shell. The system has List and ListBox but no tree; FK2's
`Tree*` family, `DomPanel` drag (`@dnd-kit/core`) and `TreeDrop.module.css`
drop lines have no counterpart.

### Switch, checkbox, tag, kbd

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Switch | 38 by 22 track, 1px overlay 20, off transparent, on surface 3, 16px `#ededed` thumb, 150ms (`Switch.module.css:23-77`) | Switch, see shot 06 | not measured in detail |
| Checkbox | 16px, 3px radius, overlay 20 border, checked fills `--text` with a body coloured check, 120ms (`Checkbox.module.css:52-81`) | Checkbox with a drawn check | close |
| Tag | TagPill: pill, tint from the first letter through the accent scale, removable (`TagPill.module.css`) | Chip, neutral by default | different |
| Kbd | 3D keycap with face gradient, edge and drop (`Kbd.module.css`, `globals.css` keycap tokens) | Kbd from GB tokens (same keycap tokens) | close |

### Empty and loading states

| Item | Source | System | Gap |
| --- | --- | --- | --- |
| Empty | icon, title states a fact, description names next moves, primary action (`EmptyState.module.css`) | EmptyState with the same copy rules (shot 13) | close |
| Skeleton | four named shapes: block, cards, rows, tree with depth indents; shimmer 1.4s on surface 3 and 4 gradients (`Skeleton.module.css`, `globals.css` `skeletonShimmer`) | Skeleton blocks and lines; `duration.shimmer` 1.4s | close; SkeletonTree missing |

### Focus, hover and press

| State | Source | System Studio | Gap |
| --- | --- | --- | --- |
| Focus | 1px overlay 20 ring on buttons and tabs; inputs brighten the border to overlay 50; toolbar items use a 2px `--accent-2` outline (`Toolbar.module.css:28-31`) | 2px `#f5f5f5` ring, doubled on primary | different, and the system is the more accessible one. Keep it |
| Hover | fills step up one overlay level; tiles lift tone and 2px | borders brighten; fills overlay 5 | different |
| Press | fills step back down; no scale | inversion to white with a 1px sink in steps | different |

### Motion and micro interactions

| Interaction | Source | System Studio |
| --- | --- | --- |
| Menu open and close | 130ms enter with scale 0.97 and 4px rise, 100ms exit | opacity step, `scale.menu-enter` 1 |
| Toast | 140ms rise and scale | opacity step |
| Tooltip | 80ms fade, no delay | 500ms delay, step |
| Tabs panel | 120ms fade up 4px | per Tabs CSS |
| Rail | indicator scales 0.6 to 1 and fades in 140ms; icon colour and glow 140ms | no transition specific to Studio |
| Section | icon to chevron swap 100ms, chevron rotate 120ms | accordion-height, opening body fades and slides |
| Sidebars | width 180ms ease on open and close | none |
| Notch | rolls up out of view in 180ms after a 600ms delay, back at once on hover | none |
| Navigation | view transition fade 100ms (`AdminCanvasLayout.module.css:193-197`) | none |
| Eases | `ease`, `cubic-bezier(0.16,1,0.3,1)`, `cubic-bezier(0.4,0,1,1)` | `steps(2, jump-end)`, `steps(3, jump-end)` for every spring (`studio.css`, `--ds-ease-spring-*`) |
| Reduced motion | zeroed in `globals.css` | zeroed by the token build | same |

### How interactive things behave

| Behaviour | Source | System |
| --- | --- | --- |
| Number scrub | label drag, modifiers, maths, Enter, Escape | same |
| Tooltip | hover or focus, at once, cursor anchored variant (`CursorTooltip`) | Radix, 500ms, no cursor variant |
| Context menu | right click at the point, anchored variant for `...` buttons, measured then shown, scroll inside a viewport clamped list, search header | right click, long press, Shift+F10; submenus; scroll inside |
| Select | custom list with search, hover preview on the canvas (`onOptionPreview`), mixed state | Radix Select, no preview, no mixed |
| Tree | expand, select, rename, drag and drop with drop lines | missing |
| Panels | resize handles, collapse animations, rail toggles a panel and shows its pressed state | ResizablePanels exists; no rail to panel binding |
| Canvas | pan, zoom, selection rings, Alt hover measure, Alt drag duplicate, marquee, snap guides (`STUDIO-FIGMA-FEEL-PLAN.md` track K) | missing |
| Command palette | Spotlight on Cmd+K | CommandPalette exists |

## Missing in the system

Source parts and patterns with no counterpart:

1. Editor shell layout: black frame, rounded canvas sheet, 36px top bar (`AdminCanvasLayout`).
2. CanvasNotch toolbar with peek and roll.
3. Tinted PanelRail with job groups and glow (`railAccent.ts`).
4. Layer tree: `Tree`, `TreeRow`, `TreeDrop`, drag and drop.
5. Properties panel and the inspector field skin as a scope.
6. ControlRow (inline, stacked, caption, bare) and PropertyList.
7. AlignGrid and AlignBar.
8. ColorInput and ColorPickerPopover (with WCAG contrast readout).
9. VariableField and token aware inputs.
10. AddablePropertyField and ExpandableFieldCluster (linked padding and radius).
11. InspectorPopover anchored to a cluster.
12. MixedValue rendering across controls.
13. Widget tile with a tint dot and uppercase label; WidgetList.
14. TagPill with letter derived tint.
15. CanvasModulePlaceholder (diagonal stripes).
16. SkeletonTree.
17. DataTable shell.
18. Small charts (Sparkline, Bars, StackedBar, StatValue) in FK2's look.
19. Canvas affordances: selection, hover and selector rings, measure lines, frame labels, comment pins, prototype links.
20. CursorTooltip.
21. Select hover preview and mixed state.

Things the system invented that FK2 never had, as drawn in Studio:

1. Square 2px controls and 0px panels, menus, cards and tooltips.
2. White solid primary cell and the press inversion.
3. `steps()` motion for every spring.
4. Inverted lit menu rows and inverted white tooltips.
5. Full width split dialog footers.
6. One line toast strips with a full tone outline that expand on hover.
7. Rail labels under icons and a boxed rail.
8. Tile with an image placeholder and a white selected outline.
9. Window, TitleBar, WindowControls, Dock and Menubar (GoBanana parts, rendered in Studio too).

## Ten changes, in order of effect on look and feel

1. **Put FK2's surfaces and shape back into Studio tokens.** Surfaces
   `#1b1b1b`, `#282828`, `#323232`; `radius.control` and `radius.field` the
   pill; `radius.panel` 12; `radius.card` 16; menu 16 with 12px rows; tooltip
   6; inspector field 8. Files: `packages/styles/studio/tokens.dark.json`
   (29 to 53, 1629 to 1700) and `tokens.light.json` (FK2 light block with the
   GB A11y changes). This reverses order 1.24 for Studio: a HUMAN GATE, since
   Studio and Desk must then be kept apart by Desk moving toward GoBanana.
2. **Rewrite the Studio Button recipe to FK2's fills.** No border; primary
   overlay 20, hover 30; secondary overlay 10 with muted label, hover 20;
   ghost hover overlay 10; destructive the danger 10 percent tint; weight 700;
   colour transitions 150ms ease. Remove the press inversion. Keep the 2px
   focus ring.
3. **Restore depth on floating surfaces.** `elevation.menu`
   `0 12px 28px scrim-50`; `elevation.dialog` `0 18px 48px`;
   `elevation.panel` FK2's `--shadow-panel`; `elevation.tooltip` FK2's
   `--shadow-tooltip`; `blur.panel` 24px for toasts and popovers. Menus on
   surface 3 with no border; dialogs with surface 2 header and footer bands
   and a right aligned footer; toasts as rounded cards with a 2px start edge.
4. **Replace stepped motion with FK2's eases.** Menus 130ms
   `cubic-bezier(0.16,1,0.3,1)` from `translateY(-4px) scale(0.97)`, exit
   100ms; toasts 140ms from `translateY(6px) scale(0.98)`; tooltips 80ms fade;
   tab panels 120ms rise of 4px. Files: `packages/styles/studio/motion.ts`,
   spring and scale tokens, `recipes/Motion.css`.
5. **Inputs, selects and segmented controls as FK2 pills.** White 20 percent
   border, hover 30, focus 50, transparent fill; select list on the menu
   surface; segmented group 12px with 8px segments and overlay fills.
6. **Build an editor shell template.** 36px top bar on body, 42px rail,
   320px resizable left panel, canvas region on surface 2 with a 16px top
   start corner, 290px inspector, sidebar width transitions 180ms, and the
   Notch as a Studio optional part on Toolbar.
7. **Tinted rail.** Icon only variant, a `tint` per item from the accent
   scale, hover 10 percent and pressed 16 percent tint fills, a 5px tinted
   glow, the 2px by 14px indicator scaling in 140ms, no box rule.
8. **An inspector scope.** One attribute that switches Input, Select,
   SegmentedControl, ScrubInput and IconButton to filled `#212426`, 8px
   corners, 32px rows, border on hover and focus only; Section with the icon
   to chevron swap and an empty state with a `+`.
9. **A Tree component for layers.** 28px rows, 8px radius, overlay 10 hover
   and selection, 14px chevron rotating in 120ms, indentation by depth, drop
   lines while dragging, rename in place, roving keyboard.
10. **Tooltips and tiles in FK2's voice.** Tooltip on body with a hairline,
    6px radius, arrow and shadow, opening at once (keep focus opening); Tile
    as FK2's Widget: borderless, 16px, uppercase 11px label with a 7px tint
    dot, hover tone plus 2px rise and the contact shadow. The icon set swap
    to FK2's solid pixel glyphs would come next, but the vendored
    `pixel-art-icons` declares no licence: a HUMAN GATE.

## What could not be checked, and why

- **The real FK2 app was not run.** It needs bun, a Bun server with a
  database and sign in, and it depends at install and at runtime on the third
  party `vendor/alm-design-system` package, which this audit may not read or
  copy. Instead a harness under the scratch folder rendered FK2's own
  primitives (`src/ui/components/*`), `src/styles/globals.css` and the shell
  CSS modules (Toolbar, PanelRail, TreeRow, CanvasRoot, CanvasNotch) straight
  from the source tree through Vite aliases, read only. The shell layout, the
  panel content, the layer names, the frames on the canvas and the inspector
  rows were assembled by hand from those modules, so proportions inside the
  panels are a close reconstruction, not a capture. Inspector label size was
  set to `--text-xs` by hand.
- **FK2 at 390px** is not a designed target. The 390px source shots show the
  reconstruction with the panels collapsed to the rail, which is what FK2's
  narrow chrome does when the inspector is closed.
- **Canvas behaviour** (pan, zoom, selection, Alt measure, Alt drag, snap,
  marquee, prototype links) and the Spotlight palette were read from source
  and plans only; nothing was exercised.
- **Light schemes** were compared for the shell only (shot 02). Desk was
  compared for buttons, dialog and toast only, since the token mapping feeds
  Desk from GoBanana.
- **Switch, Kbd, Checkbox and Avatar** were compared from CSS, not measured.
- **Contrast**: FK2's 20 percent control border and 1px 20 percent focus ring
  are below the system's 3:1 non text contrast rule. Any change that brings
  them back needs the owner to choose between fidelity and that rule.

## Shots

All in `docs/reports/audit/shots/figma-killer-2/`, each at `-1440.png` and
`-390.png`: 01 shell, 02 shell light, 03 shell against Desk, 04 rail, 05
sidebar and layers, 06 buttons, 07 buttons against Desk, 08 inputs, 09 scrub
and inspector, 10 segmented, 11 tabs, 12 tiles, 13 empty and loading, 14
context menu, 15 select open, 16 dialog, 17 dialog against Desk, 18 toast, 19
toast against Desk, 20 tooltip.
