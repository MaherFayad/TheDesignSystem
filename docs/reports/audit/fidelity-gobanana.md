# Fidelity audit: the system against GoBanana

Auditor: ds-qa (claude-opus-5-5, medium). Date: 2026-11-14. Analysis only: no source file changed.

Source: GoBanana at `/home/user/gobanana` (commit 216625c), run locally from a copy in the scratch folder (`npm ci --ignore-scripts`, `next dev` with the repo's own e2e bypass `E2E_AUTH_BYPASS=1 ADMIN_FIXTURES=1 DATABASE_URL=`, and the repo's own seeded board mock `e2e/support/seed-canvas.ts`). Pages captured: `/en` (landing desk), `/en/canvases` (Finder window), `/c/e2e-seed` (canvas editor), `/en/pricing`, `/en/install`, `/en/account`, `/__design` (the Studio primitives gallery), plus the share dialog, toasts, the canvas more menu and the phone menu bar menu.

System: the React gallery at `http://localhost:5231/c/<slug>?chrome=0&style=<id>&scheme=dark`, style `desk` (the one the token mapping and PLAN section 1 say comes from GoBanana) and `studio` (which takes its colour tokens from GoBanana `studio-tokens.css`, but its look from Figma-Killer-2).

Measured values below come from `getComputedStyle` in Chromium at 1440 by 900 (fluid tokens resolve to their maximum there). Side by side shots, source left and system right, are in `docs/reports/audit/shots/gobanana/`.

## Verdict

The system has GoBanana's paint but not its product. Every colour, the radius scale, the window glass, the grain, the yellow primary and the pixel icons were lifted correctly from `studio-tokens.css`, and the Desk pack draws a window, a menu bar and a dock. But GoBanana is two finished screens (a fake macOS desk with free windows for the marketing site and the dashboards, and a dense Studio editor for the canvas), and the system ships neither: what the owner sees in the gallery is a generic component catalogue (110 components, every one in 6 tones and 5 emphases) laid on a grainy black page. Where Desk does draw a component, a series of proposed orders (1.21 to 1.29) has pushed it away from the source rather than toward it: display tracking of -0.04em on every button label, 36px pills where the source uses 28 and 32px, a yellow glass title bar with traffic lights on every dialog, a yellow timer line and icon tiles on toasts, a pointer-following glow and a press that sinks the label, and a bouncy spring that overshoots by about 21% on every menu, dialog, toast and tab. GoBanana has none of that: its controls only change tone, its overlays arrive in 120 to 140ms with a 4px rise, and its only playful motion is the hero CTA's label roll and the window that grows from its trigger. Studio, meanwhile, renders 0 and 2px corners, which neither source has. The short version: right palette, wrong objects, wrong density, invented motion, and the two layouts that make GoBanana look like GoBanana are missing.

## Scorecard

0 is unrelated, 5 is indistinguishable. Scored for Desk against GoBanana unless noted.

| Area | Score | Evidence |
| --- | --- | --- |
| Shell | 1 | Source is a desk (28px glass menu bar, free glass windows, 52px dock tiles) and a canvas editor; the system's `page-shell` is an opaque bordered admin grid with a 2px yellow bar on the current row (shot 01, 12). No desk page, no Finder, no editor. |
| Type | 2 | Instrument Sans is right, but -0.04em is applied to 13px button labels (source: only to display headings, `desktop.css:72-80`), so "Save draft" reads "Savedraft"; chrome is 13 to 14px where the app uses 12px and the site 16px; no two tone display heading. |
| Colour | 4 | Token values match the source to the hex (`token-mapping.md`). Lost points: solid green, orange, violet and red buttons that the source never shows (source rule "colour carries information only"), and a yellow tinted dialog title bar. |
| Shape | 3 | Desk radius scale is the source scale (3, 6, 8, 12, 16, 1rem, pill). But every button is a pill (source sm and md are 12px, xs 8px, only CTAs are pills) and the menu radius is 12 where the source panel menu is 16 and the menubar menu 0.6rem. Studio scores 1: radius 0 and 2px. |
| Density | 2 | Desk md button 36px, 13px, 16px padding against source sm 28px, 12px, 8px padding; menu rows 32px against 28px; dock tiles 44px against 52px; body 14px against 16px on the site. |
| Controls | 2 | Buttons, inputs, segmented control and switch exist and work, but they read as a different family: glass pill with an inner light edge and gradient, tracking, roll on every button (shot 04). |
| Overlays | 2 | Dialog anatomy differs (source: solid surface, surface-2 header and footer bands, 12px radius, no lights; system: glass, traffic lights, yellow bar, 16px radius); menu highlight is a tinted yellow ring instead of the source's solid yellow row (shot 06, 08). |
| Feedback | 2 | Toast: source is a flat panel with a 2px coloured start edge and a bare 16px icon; system adds an 18% icon tile, a circled close and a yellow countdown line (shot 09). Alert, skeleton and empty are close in values but differ in radius and padding. |
| Motion | 1 | Source: 120ms dialog and menu, 140ms toast, 300ms window on `cubic-bezier(0.2, 0.8, 0.2, 1)`, no overshoot. System Desk: 380ms `linear()` spring peaking at 1.215 on every entrance, scale from 0.92, press scale 0.97 plus label sink. |
| Behaviour | 3 | Keyboard models are sound (Radix menus, focus trap, roving groups, windows that drag, minimize and grow from the trigger). Missing the source's own behaviours: menubar folding into one Menu below 768px, phone home screen layout, dock magnify, hover only light colours, card first press selects and second opens, history backed windows. |

## Detailed differences

Each entry: GoBanana, the system, the gap, and what closes it. Source paths are under `/home/user/gobanana/banana-server/`, system paths under `/home/user/TheDesignSystem/packages/`.

### 1. Page shell and layout

- **Desk page.** GoBanana: the whole site is a black desk `#000` (rendered `#0a0a0b` stage) with an SVG grain at 0.14 (`app/(site)/_components/desktop/desktop.css:14-55`), a sticky 28px menu bar (`desktop.css:156-171`, `--desk-bar: 1.75rem`), content in free glass windows, and a fixed dock at the bottom centre (`desktop.css:1193-1254`). Below 768px it becomes a phone home screen: full width stacked windows, the menu bar folds nav, canvases and language into one Menu (`MenuBarMenu.tsx`, shot `07-menubar-390`). System: the grain is there (`styles/desk/recipes/Window.css:33-41`), the parts exist (`Window`, `WindowLayer`, `Menubar`, `Dock`), but there is no desk page, template or pattern that composes them; `packages/` has no patterns or templates yet. Gap: missing. Close it with a `desk` template: menu bar, window layer, dock, phone home screen variant below 768px, built from the existing parts.
- **Finder window** (`/en/canvases`, shot 02). GoBanana: a glass window with a glass sidebar inset 8px inside it (`rgba(255,255,255,0.06)` fill, `0.07` hairline, 9.6px radius, 224px wide), rows 36px at 14.4px with the current row in weight 600 on `overlay-10`, a toolbar with title (28px), a pill search 36px, an Icons and List segmented switch and a New canvas button, cards with a 2 by 2 collage, and an Inspector column with a full width yellow Open canvas pill. System: `Sidebar` is an opaque `#1b1b1b` column, 11px text, rows 28px, current row with a 2px yellow bar (shot 12); `PageShell` draws hard 1px borders between regions (shot 01). Gap: different. Close it by giving Desk a glass inset sidebar recipe (no bar, weight 600 plus fill), 14px rows at 36px, and a Finder pattern.
- **Canvas editor** (`/c/:id`, shot 03). GoBanana: a window inset `clamp(0.5rem, 2.2vw, 2.25rem)` (`components/window/window-layer.css:49-50`) whose 44px top bar carries the lights, the title "Moodboard on GoBanana", a saved dot, a segmented Images and Notes switch, a Phone frames switch, zoom out, 85%, zoom in, fit, Share and more; a progress rail of six numbered steps; a 42px left rail; a plain board on surface-2; a floating glass tool pill at the bottom (40px tall, 20px radius, `blur(24px) saturate(1.3)`, `rgba(22,22,22,0.88)`). System: `Toolbar`, `SegmentedControl`, `Switch`, `Stepper`, `Rail` exist separately; nothing composes an editor. Gap: missing.
- **Gallery presentation.** The system gallery shows every demo on a flat page with labels in a left column. The owner is judging a catalogue page against a product. That alone explains much of "it looks bad".

### 2. Typography

| Item | GoBanana | System (Desk unless noted) | Gap |
| --- | --- | --- | --- |
| Families | Inter Variable for the app and primitives (`styles/studio-tokens.css`), Instrument Sans only on the desk (`desktop.css:15`, `.site { --st-font-sans: var(--st-font-desk) }`) | Instrument Sans everywhere in Desk, Inter everywhere in Studio | Close. Desk is a site and dashboard look; an editor in Desk should still use Inter, as the canvas does. |
| Hero display | 63.4px, weight 500, line height 60.3px (0.95), tracking -2.53px (-0.04em), two tone: `#b9b9b9` first line, `#fff` second (`desktop.css:72-114`) | No display or heading component; `font.tracking.display` exists as a token only | Missing. |
| Section heading | `clamp(1.75rem, 1.2rem + 1.4vw, 2.4rem)`, 500, -0.04em | none | Missing. |
| Lead | 0.95rem (15.2px), line height 1.5, `#a3a3a3`, max 60ch (`desktop.css:116-123`) | body 14px/1.5 `#ededed` | Different. |
| Button label | 12px (`--st-text-s`), 700, line height 1, letter spacing normal (`styles/studio-components.css:126-130`); site CTA 16px 700 | 13px, 700, letter spacing -0.52px (`styles/desk/recipes/Button.css:17`) | Different and harmful: the tracking glues words. Remove the tracking from controls. |
| Menu bar | 13px, 500, current page 600 (`desktop.css:211-238`) | 13px, 400 | Close. Weight 500 and 600 current. |
| Menu item | 12px, weight 560 (`--st-weight-menu`), 28px row (`studio-components.css:449-473`); menubar menu 14px, 28px row (`desktop.css:349-361`) | 13px, 400, 32px row | Different. |
| Window title | 13px, 600 (`desktop.css:535-544`) | 14px, 600 | Close. |
| Dialog title | 14px (`--st-text-l`), 700, line height 1.2, single line ellipsis, optional 12px uppercase eyebrow at 0.12em (`studio-components.css:690-713`) | 14px, 600, -0.56px tracking (`styles/desk/recipes/Dialog.css:97`), no eyebrow | Close in size, different in weight and tracking. |
| Dialog body | 14px, line height 1.5 | 15px, line height 1.5 | Close. |
| Tabs | the source has no tab strip in product UI; selection uses segmented `st-btn[aria-pressed]` at 12px | 11px, 700, -0.44px, rounded top 8px 8px 0 0 | Different. |
| Tile label | 12px uppercase, 600, 0.07em, with a 7px accent dot (`studio-components.css:1035-1055`) | no uppercase label with accent dot | Missing. |
| Chrome body | app chrome 12px (`--st-text-s` floor); site body at least 16px (`site.css` header) | 13 to 14px | Different in both directions. |

### 3. Colour and surfaces

- Token values are faithful. `color.material.glass #1f1f1f87`, `glass-strong #161616e0`, `menubar #000000b8`, `dock #1c1c1ca6`, `primary.fill #ffd84d`, text `#ededed`, `#a1a1aa`, `#8f8f8f`, lights `#ff5f57 #febc2e #28c840` all match `styles/studio-tokens.css` (checked in `docs/contracts/token-mapping.md` and in computed styles).
- Where the source uses colour. GoBanana principle 1 (`docs/site-and-design-language.md`, "The design language"): the base is achromatic, colour only for identity accents, state and canvas affordances; yellow is the one deliberate exception. Its buttons: primary yellow, secondary `overlay-10`, ghost, destructive as a 10% red tint (`studio-components.css:160-201`). System Desk: solid green, orange, violet and red buttons, and soft and outline versions of each (shot 04, top six rows). Gap: different. Close it by hiding tone `success`, `warning`, `info` solid and soft emphases in Desk demos, and drawing Desk `danger solid` as the source destructive tint.
- Window glass. Source `.dwin`: `#1f1f1f87`, 1px `#ffffff1a`, 16px radius, `blur(24px) saturate(1.3)`, shadow `0 40px 100px -30px #000000e6, 0 12px 30px -12px #00000099` (`desktop.css:403-415`). System window: `rgba(31,31,31,0.72)`, same hairline and radius, adds an inner top light `rgba(255,255,255,0.16)` and a black 1px ring. Gap: close; the inner top light is an addition.
- Dialog surface. Source Studio dialog is solid `#1b1b1b` with `#282828` header and footer bands and `#333` dividers (`studio-components.css:611-741`, shot 08 left). System Desk dialog is `rgba(33,33,33,0.9)` glass with a yellow tinted title bar (`styles/desk/recipes/Dialog.css:28-30`). Gap: different.

### 4. Borders and separation

- Source tiles are borderless on a darker parent with a 1px gap (`studio-components.css:976-1006`); dashboard cards are borderless with a 2px light ring when selected; windows use a hairline. System Desk tile has a `#ffffff1a` border and 12px radius; Desk card has a hairline plus a drop shadow. Gap: different for tiles, close for cards.
- `PageShell` and `Sidebar` in the system draw 1px region borders (shot 01, 12); the source separates regions by glass panels floating inside the window, with no rules.

### 5. Radius

| Item | GoBanana | Desk | Studio |
| --- | --- | --- | --- |
| Button | `1em` of the label: 12px at sm and md, 13px at lg; xs 8px (`studio-components.css:107`, `:204-207`) | 999px | 2px |
| Site CTA | 999px (`.roll-btn`) | 999px | 2px |
| Input | `1em` (12px at sm, 16px at lg) | 999px | 2px |
| Menu panel | 16px (`--st-radius-card`), menubar menu 0.6rem | 12px | 0 to 2px |
| Menu row | 12px (`--st-radius-menu-item`), menubar row 0.35rem | 8px | 0 |
| Dialog | 12px | 16px | 2px |
| Toast | 12px | 12px | 0 |
| Window | 16px | 16px | n/a |
| Dock | 17.6px, tile 13.6px | 16px, tile pill | n/a |

Desk: close. Studio: different (radius tokens in `styles/studio/tokens.dark.json` are `xs 2, sm 2, field 2, panel 0, card 0`), though both sources use 3 to 16px and pill inputs.

### 6. Spacing and density

- Source control heights: xs 24, sm 28 (the default), md 32, lg 44; the site raises md to 44px only on the home page (`.story .st-btn[data-size="md"]`). System Desk adds `space.3xs` to every md control (`styles/desk/recipes/Density.css:15-32`), so md is 36px and the default demo is md. Gap: different. Desk reads roomier than the source's own app.
- Padding: source sm button 8px inline, md 14px, lg 16px; Desk 16px at md, 8px at sm.
- Menu rows 28px source, 32px Desk. Dock tile 52px source, 44px Desk. Window bar 36px both. Dialog header padding 12 by 14px source; Desk title bar 36px.

### 7. Icons

Both use pixelarticons (`components/studio/icons/index.ts`; `styles/desk/icons.ts`) at 12, 16 and 24px. Gap: same. The source draws them crisp (`shape-rendering: crispEdges`, `studio-components.css:41-46`); check that the system does the same.

### 8. Buttons

Source `.st-btn` (`studio-components.css:94-308`): flat fill, no border except primary, colour and background change on hover (secondary `overlay-10` to `overlay-20` to `overlay-30` on press), 150ms `ease`, no transform, selected toggle gets `overlay-20` plus a 1px `overlay-50` ring, loading overlays a 12px spinner, disabled 0.38. Site CTA (`desktop.css:126-152`, `RollButton.tsx`) is a 44px yellow pill whose label rolls up on hover over 0.3s `cubic-bezier(.22,1,.36,1)`.

System Desk (`styles/desk/recipes/Button.css`): every button is a pill, glass fill `#ffffff14` with a top gradient and two inset rings (lines 26-38), a glow that follows the pointer (lines 64-79), a press that scales to 0.97 and sinks the label by an eighth of the height then springs back past rest (line 64), the roll on every button (line 167), and -0.04em tracking (line 17). Measured: hover after 400ms left the soft button at `#ffffff14`, press gave `matrix(0.97...)` with the label translated -31px (the roll). Gap: different. To close: flat fill, tone change only on hover and press, no transform, roll only on a `roll` variant used for hero CTAs, no tracking.

### 9. Inputs and fields

Source `.st-input`: 28px, transparent fill, 1px `rgba(255,255,255,0.4)` border, `1em` radius, 12px text, hover border 0.6, focus border `overlay-50` plus an inner glow (`--st-shadow-input-focus`) and the 2px ring (`studio-components.css:312-394`). Site search is a 36px glass pill `rgba(255,255,255,0.06)` with a 0.12 hairline. System Desk input: 36px pill with a `#ffffff14` fill. Gap: close in shape, different in fill and height. Close it with a transparent fill and the source focus glow.

### 10. Menus

- Source app menu `.st-menu` (`studio-components.css:404-528`): solid `surface-3 #323232`, 16px radius, 3 to 4px padding, `0 12px 28px` scrim shadow, rows 28px with 12px radius, highlight `overlay-10`, keyboard focus adds an inset 2px ring, checked rows show a check, enters 120ms `translateY(-4px) scale(0.97)` on `cubic-bezier(0.16,1,0.3,1)`, exits 100ms.
- Source menubar menu `.mb-menu` (`desktop.css:325-394`): `glass-strong` with `blur(40px) saturate(1.6)`, 0.6rem radius, rows 28px, and the highlighted row is solid yellow with ink text, following both pointer and arrow keys (rows take focus on hover). Shot `06-menu-390` left.
- System Desk (`styles/desk/recipes/DropdownMenu.css:35`): glass, 12px radius, rows 32px, highlight is a yellow tint with a yellow ring (shot `06-menu-1440` right), enters on the bouncy spring from 0.92. Gap: different. Close: Desk menus take the menubar menu's solid yellow row and 28px rows; Studio menus take `surface-3` and `overlay-10`.

### 11. Dialogs

Source Studio dialog (`components/studio/Dialog.tsx`, `studio-components.css:611-741`, shot 08 left): native `<dialog>`, sizes 360 to 820px, solid surface, 12px radius, header and footer bands on surface-2 with 1px dividers, title 14px 700 single line, close icon button at the end, footer right aligned with the yellow sm primary, backdrop `bg-body` at 50% (no blur), enters 120ms from `translateY(4px) scale(0.98)`. App windows (`WindowLayer`) are separate: backdrop `#00000066` with `blur(10px) saturate(1.1)` (`components/window/window-layer.css:14-18`), lights in the bar. System Desk dialog (shot 08 right): traffic lights, yellow glass title bar, glass panel, 16px radius, scrim `rgba(0,0,0,0.55)` with `blur(24px) saturate(1.3)`, enters on the bouncy spring over 380ms with staggered parts. Gap: different. A GoBanana dialog is a plain panel; a GoBanana window is a different object. Close it by dropping the dialog `controls` and `titlebar` optional parts in `styles/desk/style.json` and the yellow bar, and using the source header and footer bands.

### 12. Toasts

Source (`studio-components.css:745-857`, `components/studio/Toast.tsx`, shot 09 left): stack bottom end, 16px inset, max 420px, panel `#1b1b1b`, 1px `overlay-10` border, 2px coloured inline start edge, 12px radius, bare 16px icon in the tone colour, title 12px 500 bright, body muted and clamped to 3 lines, plain ghost close X, enters 140ms from `translateY(6px) scale(0.98)`, repeat count chip. System Desk (shot 09 right, `styles/desk/recipes/Toast.css:13-42`): glass, the icon in a tinted tile, title 14px with tracking, circled close, a yellow countdown line along the bottom, bouncy entrance. Gap: different. Close it by removing the icon tile, the timer line and the circle, and matching the source sizes.

### 13. Tabs and segmented controls

GoBanana has no tab strip in its UI; it switches views with segmented `st-btn[aria-pressed]` groups (Images and Notes, Icons and List, Monthly and Yearly on pricing). The selected segment is `overlay-20` with a 1px `overlay-50` ring. System `SegmentedControl` in Desk is close (shot 14). Note a bug in the system demo: "Five options in a narrow column" lets "1 year" escape the track (`react/src/components/SegmentedControl/SegmentedControl.demo.tsx:110`, shot 14 right, bottom). System `Tabs` in Desk (11px, rounded top) has no source.

### 14. Cards, tiles and lists

- Dashboard card (shot 11 left): borderless, 2 by 2 image collage on surface, title 16px, meta 13px muted, selected ring 2px light, hover lifts tone. System `Card` (right): image block, hairline, drop shadow, an overflow menu button. Close.
- `.st-tile` step tiles: uppercase 12px label with a 7px accent dot, 16px radius, on a 1px gap grid, hover lifts 2px with `--st-shadow-card-hover`. System `Tile` has none of the label or grid. Different.
- Phone list rows on the Finder (shot 02 at 390): 56px rows with a collage thumbnail. System `List` exists; no equivalent row recipe.

### 15. Empty and loading states

Source `.st-empty` card: surface, 12px radius, 14px padding, 12px subtle text; centered variant transparent with 24px padding block. `.st-skeleton`: `surface-3` to `surface-4` shimmer over 1.4s, 3px or 6px radius. Window shells while loading (`components/window/WindowShell.tsx`, `window-layer.css:156-255`) draw a skeleton Finder with lights. System Desk skeleton: `rgba(255,255,255,0.1)`, 3px radius, measured 13px tall; empty state transparent, 14px. Close for skeleton values, missing for skeleton windows.

### 16. Focus, hover and press

Focus: source 2px `#f4f4f5` ring as box shadow plus a transparent outline, doubled (black 2px inside, light 4px outside) on yellow (`studio-tokens.css` `--st-primary-focus-ring`). System Desk measured the same: `0 0 0 2px rgb(244,244,245)`, and on accent `0 0 0 2px #000, 0 0 0 4px #f4f4f5`. Same.

Hover: source changes tone only (`overlay-10` to `overlay-20`), tiles lift 2px, dock tiles grow to 1.14 and rise 0.3rem with a label above (`desktop.css:1236-1286`), lights take their colours only while the group is hovered or focused (`desktop.css:507-517`). System: buttons glow and roll; dock tiles do not magnify in the shot; lights behave like the source. Different for buttons, close for lights.

Press: source darker tone, no movement. System: scale 0.97, label sink, bouncy release. Different.

### 17. Motion

| Pattern | GoBanana | System Desk |
| --- | --- | --- |
| Menu enter | 120ms `cubic-bezier(0.16,1,0.3,1)`, from -4px and 0.97 | 380ms `linear()` spring peaking at 1.215, from 0.92 (`styles/desk/motion.ts`) |
| Menubar menu | 140ms ease out, from -0.25rem and 0.98 | same spring |
| Dialog | 120ms ease out, from +4px and 0.98; backdrop fade | 380ms spring, from 0.92, parts staggered |
| Toast | 140ms ease out, from +6px and 0.98 | 380ms spring |
| Window open | 300ms `cubic-bezier(0.2,0.8,0.2,1)`, grows from the pressed control, else from 0.92 (`components/window/motion.ts:16-20`) | grows from the trigger on the window preset |
| Close, zoom, minimize | 220ms, 280ms FLIP, 320ms genie toward the dock icon | close and minimize present; values not measured |
| Label roll | hero CTA and menubar pill only, 0.3s | every button |
| Reduced motion | every move becomes a short fade, durations zeroed | collapses (tokens zeroed) |

Gap: the window grow is the one place the system matches. Everything else adds overshoot the source never has.

### 18. Behaviour

- Menubar: source folds to one Menu below 768px; arrow keys and pointer both move the yellow highlight; Escape, Tab and click outside close and return focus. System Menubar keeps every item and wraps (shot `07-menubar-1440` right, "Too many: the row wraps").
- Windows: source windows with `controls` drag by the title bar, move with arrow keys, close with Escape, and the lights act (close goes back in history, minimize to the dock, zoom FLIP); route windows are part of browser history. System Window drags, minimizes and zooms in its demo; history is out of scope for a component.
- Dashboard card: first press selects and fills the Inspector, second opens (`aria-pressed`). No system counterpart.
- Notifications fan out on hover or focus (`NotificationStack.tsx`). No counterpart.
- Ctrl or Cmd plus wheel zooms the board, never the page. No counterpart.

## Missing from the system

GoBanana parts, patterns and behaviours with no counterpart:

1. The desk page: menu bar plus window layer plus dock, and its phone home screen below 768px.
2. Two tone display heading (`TwoToneHeading.tsx`) and the display type scale.
3. Menubar clock (`MenuClock.tsx`), the yellow dot "Add to Claude" menubar pill, and the menubar fold into one Menu.
4. Finder window: inset glass sidebar, toolbar with search and view switch, collage cards, Inspector column.
5. Canvas editor: board, notes in paper colours, image tile with a source chip, link card fallback with stripes, swatch card with contrast chips (AA, UI only, Fails), type sample card, section frame, the six step progress rail, the 42px left rail with a results badge, the floating tool pill, zoom control, Phone frames switch, notch.
6. `NotificationStack` (fanned cards), `MailApp` (FAQ as list plus reading pane), `ChatRun` (scripted chat with steps and a pause control), `ClipSlider`, export fan and file pile.
7. Step tile with uppercase label and accent dot; Ship and Explore chips.
8. Server address field with copy, code block with a copy toast, install window tabs.
9. Pricing plan windows with a Monthly and Yearly switch and a current plan chip.
10. Privacy banner, usage meter, board access switch that shows an On or Off word.
11. Skeleton windows shown while a route window loads.
12. First open intro, film grain stage, block wipe, cursor tilt mark (marketing only; probably out of scope for a component system, but they are what makes the site look like GoBanana).
13. Software GPU fallback (`GpuProbe.tsx`): blurs off and glass made opaque when there is no GPU.

Things the system invented that GoBanana never had:

1. Tone buttons in green, orange and violet, solid and soft.
2. Display tracking on control labels.
3. Yellow glass dialog title bar and traffic lights on dialogs, alert dialogs and sheets.
4. Toast icon tiles, circled close and a yellow countdown line.
5. Pointer following glow on buttons and a press that sinks the label.
6. A bouncy spring with about 21% overshoot on every entrance.
7. The roll label on every Desk button.
8. Yellow tinted menu highlight with a ring.
9. 2px yellow bar on the current sidebar row (the source says no bars on selected states: `studio-components.css:242-243`).
10. Studio radius 0 and 2px.
11. Six tone by five emphasis matrices on most controls, which turns a two colour language into a rainbow.

## The ten changes that would move the look and feel closest to the source

In order of effect per unit of work.

1. **Build the two GoBanana screens as templates, and show them first in the gallery.** A Desk page (menu bar, window layer, dock, phone home screen) and a Finder window (inset sidebar, toolbar, cards, Inspector), then an editor shell (top bar in the window, progress rail, left rail, floating tool pill). The owner compares screens, not parts.
2. **Remove the overshoot from Desk.** Map Desk `menu-scale`, `dialog`, `toast`, `tab-indicator`, `press`, `swap` to the source timings: 120ms `ease.emphasized` from -4px and 0.97 for menus, 120ms ease out from +4px and 0.98 for dialogs, 140ms from +6px and 0.98 for toasts, no press motion. Keep only the window grow at 300ms `cubic-bezier(0.2,0.8,0.2,1)`.
3. **Take the tracking off controls.** Delete `letter-spacing` at `styles/desk/recipes/Button.css:17` and `Dialog.css:97`; keep -0.04em for display headings only.
4. **Restore source density.** Drop the `+ space.3xs` in `styles/desk/recipes/Density.css`; default control size sm (28px, 12px, 8px padding), md 32px, lg 44px with 16px text for site CTAs; menu rows 28px; dock tiles 52px.
5. **Make Desk buttons the source buttons.** Flat `overlay-10` secondary, ghost, yellow primary, red 10% destructive; tone change only on hover and press; radius `1em` (12px at sm and md, 8px at xs), pill only for the CTA shape; roll as an opt in variant; no glow, no inner rings.
6. **Make Desk dialogs Studio dialogs.** Solid surface, surface-2 header and footer bands with 1px dividers, 12px radius, no lights, no yellow bar, backdrop 50% body colour; keep lights and glass for `Window` only.
7. **Make menus match.** Desk menus: the menubar menu (glass strong, `blur(40px) saturate(1.6)`, 0.6rem radius, solid yellow highlighted row with ink text). Studio menus: `surface-3`, 16px radius, `overlay-10` highlight, inset ring on keyboard focus.
8. **Strip the toast back.** Flat panel, 2px coloured start edge, bare 16px icon, plain X, no timer line, 12px title at 500, body clamped to 3 lines.
9. **Cut the colour matrix in Desk.** Show only the source's four button looks and its chip tones (ship, explore, success, danger, neutral); keep the other tones in the API for other styles but out of the Desk demos.
10. **Add the GoBanana signature parts:** two tone heading, step tile with the accent dot, menubar clock and pill, notification stack, swatch card with contrast chips. Then fix Studio's radius back to the GoBanana and Figma-Killer-2 scale (3, 6, 8, 12, 16, pill inputs), since both sources agree on it.

## What I could not check, and why

- **Backdrop blur in the source.** Headless Chromium runs on a software GPU, so GoBanana's `GpuProbe` set `data-gpu="software"` and turned every live blur off (`desktop.css:57-64`). Source shots show the opaque fallback glass; the system shots do show blur. Glass comparisons are from CSS, not pixels.
- **Light schemes.** GoBanana is dark only in the product (`app/layout.tsx`, DECISIONS 2026-10-11); only `/__design` has light. Desk Light was not compared.
- **Arabic and RTL** were not compared in this pass, beyond noting both keep the lights at the top left in RTL.
- **Reference images in the source.** Thumbnails come from third party hosts that the local run cannot reach (Finder collages show broken images); the canvas uses the repo's own synthetic gradient mocks.
- **Landing motion** (OGL stage, intro, chat run, fan and pile) needs a GPU and GSAP after hydration; shots were taken with reduced motion, so only the static frame was compared.
- **System window close, zoom and minimize timings** were not measured frame by frame; only the open grow and the presets in `styles/desk/motion.ts` were read.
- **Sign in, billing, MCP and database paths** of GoBanana were not run; the e2e bypass covers the screens compared here.
- **Angular and React Native** builds were not looked at.

## Screenshot index

All in `docs/reports/audit/shots/gobanana/`, source left, system right, 1440 or 390 wide each.

| File | Source | System |
| --- | --- | --- |
| `01-shell-landing-1440.png`, `-390` | `/en` desk | `page-shell` Desk |
| `02-finder-window-1440.png`, `-390` | `/en/canvases` | `window` Desk |
| `03-canvas-editor-1440.png`, `-390` | `/c/e2e-seed` | `toolbar` Desk |
| `04-buttons-inputs-desk-1440.png`, `-390` | `/__design?theme=dark` | `button` Desk |
| `05-buttons-studio-1440.png`, `-390` | `/__design?theme=dark` | `button` Studio |
| `06-menu-1440.png`, `-390` | canvas more menu; phone Menu | `dropdown-menu` Desk, open |
| `07-menubar-1440.png`, `-390` | landing menu bar; phone Menu | `menubar` Desk |
| `08-dialog-1440.png`, `-390` | share dialog; primitives page | `dialog` Desk, md open |
| `09-toast-1440.png`, `-390` | four toasts | `toast` Desk |
| `10-dock-1440.png`, `-390` | landing dock | `dock` Desk |
| `11-cards-tiles-1440.png`, `-390` | Finder cards and rows | `card`, `tile` Desk |
| `12-sidebar-1440.png`, `-390` | Finder sidebar | `sidebar` Desk |
| `13-empty-skeleton-1440.png` | primitives page | `empty-state` Desk |
| `14-tabs-segmented-1440.png` | canvas top bar switches | `segmented-control` Desk |
| `15-pricing-vs-card-1440.png` | `/en/pricing` | `card` Desk |
