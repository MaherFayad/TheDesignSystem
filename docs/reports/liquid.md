# Liquid

Status: proposed. Waiting on the owner (HUMAN GATE, Liquid approval).
`packages/styles/liquid/style.json` carries `"status": "proposed"`.

Order 1.26, brought forward from wave 2 after the owner asked for controls
with a glass look. Liquid is the fourth style of the plan: solid content under
a floating glass layer. Bars, menus, sheets, popovers, toasts, tooltips and the
moving parts of controls (a switch thumb while held, a slider thumb, the
selected segment) are glass. Cards, fields, list rows and tables stay solid.
Every value lives in `packages/styles/liquid/tokens.light.json` and
`tokens.dark.json`; each token Liquid sets says why in its `$description` and
ends with "Proposed, Liquid." Values Liquid does not set (accents, states,
charts, canvas) keep the Neutral value of the same scheme and say so.

Hard limits held: the id is `liquid`, the name "Liquid"; no vendor product
name anywhere; no vendor font file (the platform system font stack, IBM Plex
Sans Arabic for Arabic); no vendor symbol or mark; icons are the line set
(lucide-static, ISC). Reference material was studied for proportion and feel
only. No dependency was added. The token build needed no change: the folder
was discovered.

![Glass over a photo, light](shots/liquid/pages/popover-390.jpg)

## The dials

| Dial | Liquid |
| --- | --- |
| 1 Base | Solid content (`#ffffff` cards on `#f2f3f7` light; `#1c1c1f` on black dark) under a floating glass layer |
| 2 Accent | One tint, blue (`#0a66d6` light, `#2070e8` dark); glass picks it up at low strength at `data-glass="tinted"` |
| 3 Depth | Glass: blur 20 to 32px, saturation 1.8, a 1px light edge on the top and start sides, a soft wide shadow |
| 4 Separation | Content scrolls under glass; the tab bar draws a scroll edge fade; lines are used sparingly |
| 5 Radius | Capsules for controls (`radius.control` 999px), fields 12, cards 20, menus and popovers 22, dialogs 24, sheets 28; menu rows 16 (22 less the 6px padding) |
| 6 Controls | Capsule buttons with a highlight, a floating capsule tab bar, glass toolbars, glass sheets, lens thumbs |
| 7 Density | Roomy, touch first: `defaultDensity: "comfortable"` (md 36, lg 48) and text one to two steps up (14, 15, 17px) |
| 8 Type | `system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`; no file loaded |
| 9 Icons | Line, round caps (the line set already draws round caps and joins) |
| 10 Chrome | Floating tab bar, toolbars, menu bar, dock, sheets |
| 11 Motion | Springs (soft, snappy, bouncy as `linear()` curves), press scale 0.96, panels grow from 0.9 out of their trigger |
| 12 Focus | The same 2px tint ring with a 2px gap; glass is never the only signal of a state |

### Springs

| Spring | Stiffness, damping | Overshoot | Settles |
| --- | --- | --- | --- |
| soft | 400, 40 | 0 | 375ms: sheets, dialogs, panels that travel |
| snappy | 600, 39 | 2% | 296ms: indicators, menus, a press release |
| bouncy | 340, 22 | about 10% | 496ms: a thumb, a lens, a toast that lands |

`ease.spring-*` are generated from these with `springCurve` in
`packages/motion/src/spring.ts`, and `packages/motion/src/springs.test.ts`
checks that each curve and settle time matches its spring. `motion.ts`
(preset `spring`) moves the catalog patterns onto them: dialog and sheet on
soft, menu and tab indicator on snappy, toast and pop on bouncy, every exit
on `ease.exit`. Under reduced motion every duration is 0ms and each pattern
plays its reduced form; each recipe that adds a transform also turns it off
under `:root[data-motion='reduce']`.

## The glass material

Every glass recipe draws the same material (the pattern is
`recipes/Popover.css`):

| Layer | Value |
| --- | --- |
| Fill, regular | `color.material.glass`: white 84% (light), `#1e1e22` 90% (dark) |
| Fill, tinted | `color.material.glass-tinted`: a pale tint 88% (light), a deep tint 92% (dark) |
| Fill, clear | `color.material.glass-clear` (32% ink light, 28% black dark) on a 40% dim (`color.bg.scrim-40`), white text (`color.glass.on-clear`). Only bars over pictures take it; panels that hold reading text stay regular |
| Strong | `color.material.glass-strong` (92 and 94%) with `blur.glass-strong` 32px: dialogs, sheets, the command palette |
| Filter | `backdrop-filter: blur(blur.glass) saturate(blur.window-saturation)`, 20px and 1.8 |
| Edge | an inset 1px `color.material.glass-edge` line on the top and the inline start side (mirrored under `:dir(rtl)`), and a 1px `color.material.glass-border` outer edge |
| Shadow | `elevation.glass`, `-menu`, `-dialog`: two layers, a contact shadow and a wide soft one (10 to 28px down, 32 to 72px blur) |
| Lens | `color.glass.lens` (white 62% light, 22% dark) with a `color.glass.highlight` rim and `backdrop-filter: brightness(1.12) saturate(1.6)` |

The opacity is the honest cost of legibility: lighter glass fails the
contrast gate over a black picture (light) or a white picture (dark). See
open choice 1.

### Fallbacks

| Where | What happens |
| --- | --- |
| `backdrop-filter` unsupported | `@supports not` sets the fill to `color.material.glass-solid` |
| `prefers-reduced-transparency: reduce` | The token build turns every material token into `glass-solid`; the recipes drop the filter, the inset edge, the dim and the clear level's white text |
| `prefers-contrast: more` and `data-contrast="more"` | The same, and borders take `color.border.strong` |
| Forced colors | `Canvas` and `CanvasText`, no filter, no shadow, the outline draws focus |
| Reduced motion | Springs, press scale, stretch and lift go; state changes are instant |

## Contrast over a light and a dark picture

`packages/lint/src/contrast-pairs.ts` gains a Liquid group (`styles:
['liquid']`) that measures every glass that carries text over a pure white
and a pure black picture, the two new test backdrops
`color.glass.backdrop-bright` and `-dark`. The rest of the gate measures
glass over the style's own darkest and brightest surface as before. 798 pairs
for Liquid, no failures, no known failures (`ds style check liquid`).

| Pair (worst case) | Light | Dark | Needs |
| --- | --- | --- | --- |
| Text on glass over the white picture | 6.24 (link on tinted) | 5.13 (subtle on regular) | 4.5 |
| Text on glass over the black picture | 4.67 (link on regular) | 6.95 (subtle on tinted) | 4.5 |
| Text on a hovered or selected glass row, white picture | 7.44 | 4.68 (muted on hover) | 4.5 |
| Text on a hovered or selected glass row, black picture | 5.21 (muted on hover) | 6.62 | 4.5 |
| White text on clear glass and its dim, white picture | 4.85 | 5.08 | 4.5 |
| White text on clear glass and its dim, black picture | 19.87 | 21.00 | 4.5 |
| Focus ring and control edge on glass, white picture | 4.22 | 3.40 | 3 |
| Focus ring and control edge on glass, black picture | 3.15 | 4.61 | 3 |
| White switch thumb on the on fill | 5.40 | 4.62 | 3 |
| Off thumb (light: its control edge; dark: white) on the off track | 3.69 | 11.82 | 3 |
| Text on glass over the style's own surfaces | 5.97 | 6.52 | 4.5 |
| Focus ring on surface 5 | 3.68 | 3.48 | 3 |

The same surfaces over a white and a black page, as pictures:

| | Light over white | Light over black | Dark over white | Dark over black |
| --- | --- | --- | --- | --- |
| Menu | ![](shots/liquid/contrast/dropdown-menu-light-ltr-600-white-open.png) | ![](shots/liquid/contrast/dropdown-menu-light-ltr-600-black-open.png) | ![](shots/liquid/contrast/dropdown-menu-dark-ltr-600-white-open.png) | ![](shots/liquid/contrast/dropdown-menu-dark-ltr-600-black-open.png) |
| Tab bar | ![](shots/liquid/contrast/tab-bar-light-ltr-600-white.png) | ![](shots/liquid/contrast/tab-bar-light-ltr-600-black.png) | ![](shots/liquid/contrast/tab-bar-dark-ltr-600-white.png) | ![](shots/liquid/contrast/tab-bar-dark-ltr-600-black.png) |
| Toolbar | ![](shots/liquid/contrast/toolbar-light-ltr-600-white.png) | ![](shots/liquid/contrast/toolbar-light-ltr-600-black.png) | ![](shots/liquid/contrast/toolbar-dark-ltr-600-white.png) | ![](shots/liquid/contrast/toolbar-dark-ltr-600-black.png) |
| Popover | ![](shots/liquid/contrast/popover-light-ltr-600-white-open.png) | ![](shots/liquid/contrast/popover-light-ltr-600-black-open.png) | ![](shots/liquid/contrast/popover-dark-ltr-600-white-open.png) | ![](shots/liquid/contrast/popover-dark-ltr-600-black-open.png) |
| Toast | ![](shots/liquid/contrast/toast-light-ltr-600-white-open.png) | ![](shots/liquid/contrast/toast-light-ltr-600-black-open.png) | ![](shots/liquid/contrast/toast-dark-ltr-600-white-open.png) | ![](shots/liquid/contrast/toast-dark-ltr-600-black-open.png) |
| Dialog | ![](shots/liquid/contrast/dialog-light-ltr-600-white-open.png) | ![](shots/liquid/contrast/dialog-light-ltr-600-black-open.png) | ![](shots/liquid/contrast/dialog-dark-ltr-600-white-open.png) | ![](shots/liquid/contrast/dialog-dark-ltr-600-black-open.png) |
| Tooltip | ![](shots/liquid/contrast/tooltip-light-ltr-600-white-open.png) | ![](shots/liquid/contrast/tooltip-light-ltr-600-black-open.png) | ![](shots/liquid/contrast/tooltip-dark-ltr-600-white-open.png) | ![](shots/liquid/contrast/tooltip-dark-ltr-600-black-open.png) |

Glass is never the only signal: the current tab, the on toolbar item and the
selected segment carry the tint color and the heavier weight; a checked box
or radio fills with the tint and shows a white mark; a selected menu row keeps
its tint text and its check.

## Signature pieces

- **Switch** (`recipes/Switch.css`): a capsule track (`surface-4` off, the
  tint on), a white thumb in both schemes with a soft shadow; in light the off
  thumb carries a 1px control edge. While held, the thumb turns into a lens
  (lens fill, highlight rim, brightness and saturation of what is under it),
  stretches toward its travel (`scale.stretch` 1.28) and travels on the bouncy
  spring.
- **Checkbox and Radio**: round glass controls: a solid circle with the
  control edge, the tint fill and a white mark when checked, press scale.
- **Button** (`recipes/Button.css`, all controls on its base): capsules, the
  release springs back on the snappy spring from `scale.press`, a
  `color.glass.highlight` sheen at the top start of filled buttons that
  brightens on hover (fixed in place today; see hooks).
- **SegmentedControl and Tabs** (soft): a solid capsule track with the
  selected indicator drawn as a glass lens that slides and stretches on the
  snappy spring.
- **Slider and RangeSlider**: a capsule track, the tint range, a white thumb
  that becomes a lens while held.
- **TabBar and Toolbar**: floating glass capsules (a wrapping toolbar takes
  `radius.panel`), inset from the edges, the current item a lens pill plus
  tint and weight, the three glass levels; the tab bar draws a scroll edge
  fade above itself.
- **Navbar, Menubar, Dock, FloatingActionButton**: the same glass; the
  navbar's open panel is the flat glass, so glass never sits on glass.
- **Dialog, AlertDialog, Sheet, Drawer**: strong glass, radius 24 (dialogs)
  and 28 (sheets, drawers), transparent header and footer bands, the dim
  with a 6px blur behind; they rise on the soft spring and leave on
  `ease.exit`.
- **Toast**: a glass card that drops in from above on the bouncy spring at
  every position; a one line toast is a capsule (the 22px corner caps at half
  its height), a longer one keeps the 22px corner.
- **Menus, Select, Combobox, MultiSelect, ListBox popups, CommandPalette**:
  glass panels at radius 22 with 6px padding and 16px rows; the lit row is a
  lifted lens (glass hover fill, highlight rim, `scale.lift` on the snappy
  spring).
- **Tooltip**: a small glass chip. **HoverCard, Tour, Popover**: glass panels.
- **Card, Surface, Input**: solid content. Input only takes the white field
  fill on the light page.

## Screenshots

Every component page of the React gallery
(`/c/<slug>?chrome=0&style=liquid`), one contact sheet per component and
width in `shots/liquid/pages/<slug>-<width>.jpg`: top row over the plain page,
bottom row over a photo like gradient; columns light LTR, light Arabic RTL,
dark LTR, dark Arabic RTL. Viewport captures at 1280 by 800 (tiles at half
size) and 390 by 844. A page with a demo trigger is captured with its first
trigger open, so the overlays show their glass.

The signature pieces at 390:

![switch, 390](shots/liquid/pages/switch-390.jpg)
![checkbox, 390](shots/liquid/pages/checkbox-390.jpg)
![segmented-control, 390](shots/liquid/pages/segmented-control-390.jpg)
![slider, 390](shots/liquid/pages/slider-390.jpg)
![button, 390](shots/liquid/pages/button-390.jpg)
![tab-bar, 390](shots/liquid/pages/tab-bar-390.jpg)
![toolbar, 390](shots/liquid/pages/toolbar-390.jpg)
![dialog, 390](shots/liquid/pages/dialog-390.jpg)
![sheet, 390](shots/liquid/pages/sheet-390.jpg)
![toast, 390](shots/liquid/pages/toast-390.jpg)
![dropdown-menu, 390](shots/liquid/pages/dropdown-menu-390.jpg)
![tooltip, 390](shots/liquid/pages/tooltip-390.jpg)

Every page (109 components, 218 sheets):

| Component | 1280 wide | 390 wide |
| --- | --- | --- |
| Accordion | [sheet](shots/liquid/pages/accordion-1280.jpg) | [sheet](shots/liquid/pages/accordion-390.jpg) |
| Alert | [sheet](shots/liquid/pages/alert-1280.jpg) | [sheet](shots/liquid/pages/alert-390.jpg) |
| AlertDialog | [sheet](shots/liquid/pages/alert-dialog-1280.jpg) | [sheet](shots/liquid/pages/alert-dialog-390.jpg) |
| AspectRatio | [sheet](shots/liquid/pages/aspect-ratio-1280.jpg) | [sheet](shots/liquid/pages/aspect-ratio-390.jpg) |
| Autocomplete | [sheet](shots/liquid/pages/autocomplete-1280.jpg) | [sheet](shots/liquid/pages/autocomplete-390.jpg) |
| Avatar | [sheet](shots/liquid/pages/avatar-1280.jpg) | [sheet](shots/liquid/pages/avatar-390.jpg) |
| AvatarGroup | [sheet](shots/liquid/pages/avatar-group-1280.jpg) | [sheet](shots/liquid/pages/avatar-group-390.jpg) |
| Badge | [sheet](shots/liquid/pages/badge-1280.jpg) | [sheet](shots/liquid/pages/badge-390.jpg) |
| Banner | [sheet](shots/liquid/pages/banner-1280.jpg) | [sheet](shots/liquid/pages/banner-390.jpg) |
| Bento | [sheet](shots/liquid/pages/bento-1280.jpg) | [sheet](shots/liquid/pages/bento-390.jpg) |
| Breadcrumbs | [sheet](shots/liquid/pages/breadcrumbs-1280.jpg) | [sheet](shots/liquid/pages/breadcrumbs-390.jpg) |
| Button | [sheet](shots/liquid/pages/button-1280.jpg) | [sheet](shots/liquid/pages/button-390.jpg) |
| ButtonGroup | [sheet](shots/liquid/pages/button-group-1280.jpg) | [sheet](shots/liquid/pages/button-group-390.jpg) |
| Callout | [sheet](shots/liquid/pages/callout-1280.jpg) | [sheet](shots/liquid/pages/callout-390.jpg) |
| Card | [sheet](shots/liquid/pages/card-1280.jpg) | [sheet](shots/liquid/pages/card-390.jpg) |
| Checkbox | [sheet](shots/liquid/pages/checkbox-1280.jpg) | [sheet](shots/liquid/pages/checkbox-390.jpg) |
| CheckboxGroup | [sheet](shots/liquid/pages/checkbox-group-1280.jpg) | [sheet](shots/liquid/pages/checkbox-group-390.jpg) |
| Chip | [sheet](shots/liquid/pages/chip-1280.jpg) | [sheet](shots/liquid/pages/chip-390.jpg) |
| CloseButton | [sheet](shots/liquid/pages/close-button-1280.jpg) | [sheet](shots/liquid/pages/close-button-390.jpg) |
| Combobox | [sheet](shots/liquid/pages/combobox-1280.jpg) | [sheet](shots/liquid/pages/combobox-390.jpg) |
| CommandPalette | [sheet](shots/liquid/pages/command-palette-1280.jpg) | [sheet](shots/liquid/pages/command-palette-390.jpg) |
| ConsentField | [sheet](shots/liquid/pages/consent-field-1280.jpg) | [sheet](shots/liquid/pages/consent-field-390.jpg) |
| Container | [sheet](shots/liquid/pages/container-1280.jpg) | [sheet](shots/liquid/pages/container-390.jpg) |
| ContextMenu | [sheet](shots/liquid/pages/context-menu-1280.jpg) | [sheet](shots/liquid/pages/context-menu-390.jpg) |
| CopyButton | [sheet](shots/liquid/pages/copy-button-1280.jpg) | [sheet](shots/liquid/pages/copy-button-390.jpg) |
| DescriptionList | [sheet](shots/liquid/pages/description-list-1280.jpg) | [sheet](shots/liquid/pages/description-list-390.jpg) |
| Dialog | [sheet](shots/liquid/pages/dialog-1280.jpg) | [sheet](shots/liquid/pages/dialog-390.jpg) |
| Dock | [sheet](shots/liquid/pages/dock-1280.jpg) | [sheet](shots/liquid/pages/dock-390.jpg) |
| Drawer | [sheet](shots/liquid/pages/drawer-1280.jpg) | [sheet](shots/liquid/pages/drawer-390.jpg) |
| DropdownMenu | [sheet](shots/liquid/pages/dropdown-menu-1280.jpg) | [sheet](shots/liquid/pages/dropdown-menu-390.jpg) |
| EmptyState | [sheet](shots/liquid/pages/empty-state-1280.jpg) | [sheet](shots/liquid/pages/empty-state-390.jpg) |
| ErrorState | [sheet](shots/liquid/pages/error-state-1280.jpg) | [sheet](shots/liquid/pages/error-state-390.jpg) |
| Field | [sheet](shots/liquid/pages/field-1280.jpg) | [sheet](shots/liquid/pages/field-390.jpg) |
| FieldError | [sheet](shots/liquid/pages/field-error-1280.jpg) | [sheet](shots/liquid/pages/field-error-390.jpg) |
| Fieldset | [sheet](shots/liquid/pages/fieldset-1280.jpg) | [sheet](shots/liquid/pages/fieldset-390.jpg) |
| FilterBar | [sheet](shots/liquid/pages/filter-bar-1280.jpg) | [sheet](shots/liquid/pages/filter-bar-390.jpg) |
| FloatingActionButton | [sheet](shots/liquid/pages/floating-action-button-1280.jpg) | [sheet](shots/liquid/pages/floating-action-button-390.jpg) |
| Form | [sheet](shots/liquid/pages/form-1280.jpg) | [sheet](shots/liquid/pages/form-390.jpg) |
| FormWizard | [sheet](shots/liquid/pages/form-wizard-1280.jpg) | [sheet](shots/liquid/pages/form-wizard-390.jpg) |
| Grid | [sheet](shots/liquid/pages/grid-1280.jpg) | [sheet](shots/liquid/pages/grid-390.jpg) |
| HoverCard | [sheet](shots/liquid/pages/hover-card-1280.jpg) | [sheet](shots/liquid/pages/hover-card-390.jpg) |
| Icon | [sheet](shots/liquid/pages/icon-1280.jpg) | [sheet](shots/liquid/pages/icon-390.jpg) |
| IconButton | [sheet](shots/liquid/pages/icon-button-1280.jpg) | [sheet](shots/liquid/pages/icon-button-390.jpg) |
| InlineEdit | [sheet](shots/liquid/pages/inline-edit-1280.jpg) | [sheet](shots/liquid/pages/inline-edit-390.jpg) |
| Input | [sheet](shots/liquid/pages/input-1280.jpg) | [sheet](shots/liquid/pages/input-390.jpg) |
| InputGroup | [sheet](shots/liquid/pages/input-group-1280.jpg) | [sheet](shots/liquid/pages/input-group-390.jpg) |
| Kbd | [sheet](shots/liquid/pages/kbd-1280.jpg) | [sheet](shots/liquid/pages/kbd-390.jpg) |
| Label | [sheet](shots/liquid/pages/label-1280.jpg) | [sheet](shots/liquid/pages/label-390.jpg) |
| LanguageSwitch | [sheet](shots/liquid/pages/language-switch-1280.jpg) | [sheet](shots/liquid/pages/language-switch-390.jpg) |
| Lightbox | [sheet](shots/liquid/pages/lightbox-1280.jpg) | [sheet](shots/liquid/pages/lightbox-390.jpg) |
| Link | [sheet](shots/liquid/pages/link-1280.jpg) | [sheet](shots/liquid/pages/link-390.jpg) |
| List | [sheet](shots/liquid/pages/list-1280.jpg) | [sheet](shots/liquid/pages/list-390.jpg) |
| ListBox | [sheet](shots/liquid/pages/list-box-1280.jpg) | [sheet](shots/liquid/pages/list-box-390.jpg) |
| Menubar | [sheet](shots/liquid/pages/menubar-1280.jpg) | [sheet](shots/liquid/pages/menubar-390.jpg) |
| Meter | [sheet](shots/liquid/pages/meter-1280.jpg) | [sheet](shots/liquid/pages/meter-390.jpg) |
| MultiSelect | [sheet](shots/liquid/pages/multi-select-1280.jpg) | [sheet](shots/liquid/pages/multi-select-390.jpg) |
| Navbar | [sheet](shots/liquid/pages/navbar-1280.jpg) | [sheet](shots/liquid/pages/navbar-390.jpg) |
| NotificationCenter | [sheet](shots/liquid/pages/notification-center-1280.jpg) | [sheet](shots/liquid/pages/notification-center-390.jpg) |
| NumberField | [sheet](shots/liquid/pages/number-field-1280.jpg) | [sheet](shots/liquid/pages/number-field-390.jpg) |
| OTPField | [sheet](shots/liquid/pages/otp-field-1280.jpg) | [sheet](shots/liquid/pages/otp-field-390.jpg) |
| PageShell | [sheet](shots/liquid/pages/page-shell-1280.jpg) | [sheet](shots/liquid/pages/page-shell-390.jpg) |
| Pagination | [sheet](shots/liquid/pages/pagination-1280.jpg) | [sheet](shots/liquid/pages/pagination-390.jpg) |
| PasswordField | [sheet](shots/liquid/pages/password-field-1280.jpg) | [sheet](shots/liquid/pages/password-field-390.jpg) |
| PhoneField | [sheet](shots/liquid/pages/phone-field-1280.jpg) | [sheet](shots/liquid/pages/phone-field-390.jpg) |
| Popover | [sheet](shots/liquid/pages/popover-1280.jpg) | [sheet](shots/liquid/pages/popover-390.jpg) |
| ProgressBar | [sheet](shots/liquid/pages/progress-bar-1280.jpg) | [sheet](shots/liquid/pages/progress-bar-390.jpg) |
| ProgressCircle | [sheet](shots/liquid/pages/progress-circle-1280.jpg) | [sheet](shots/liquid/pages/progress-circle-390.jpg) |
| RadioCard | [sheet](shots/liquid/pages/radio-card-1280.jpg) | [sheet](shots/liquid/pages/radio-card-390.jpg) |
| RadioGroup | [sheet](shots/liquid/pages/radio-group-1280.jpg) | [sheet](shots/liquid/pages/radio-group-390.jpg) |
| Rail | [sheet](shots/liquid/pages/rail-1280.jpg) | [sheet](shots/liquid/pages/rail-390.jpg) |
| RangeSlider | [sheet](shots/liquid/pages/range-slider-1280.jpg) | [sheet](shots/liquid/pages/range-slider-390.jpg) |
| Rating | [sheet](shots/liquid/pages/rating-1280.jpg) | [sheet](shots/liquid/pages/rating-390.jpg) |
| ResizablePanels | [sheet](shots/liquid/pages/resizable-panels-1280.jpg) | [sheet](shots/liquid/pages/resizable-panels-390.jpg) |
| ScrollArea | [sheet](shots/liquid/pages/scroll-area-1280.jpg) | [sheet](shots/liquid/pages/scroll-area-390.jpg) |
| ScrubInput | [sheet](shots/liquid/pages/scrub-input-1280.jpg) | [sheet](shots/liquid/pages/scrub-input-390.jpg) |
| SearchField | [sheet](shots/liquid/pages/search-field-1280.jpg) | [sheet](shots/liquid/pages/search-field-390.jpg) |
| Section | [sheet](shots/liquid/pages/section-1280.jpg) | [sheet](shots/liquid/pages/section-390.jpg) |
| SegmentedControl | [sheet](shots/liquid/pages/segmented-control-1280.jpg) | [sheet](shots/liquid/pages/segmented-control-390.jpg) |
| Select | [sheet](shots/liquid/pages/select-1280.jpg) | [sheet](shots/liquid/pages/select-390.jpg) |
| Separator | [sheet](shots/liquid/pages/separator-1280.jpg) | [sheet](shots/liquid/pages/separator-390.jpg) |
| Sheet | [sheet](shots/liquid/pages/sheet-1280.jpg) | [sheet](shots/liquid/pages/sheet-390.jpg) |
| Sidebar | [sheet](shots/liquid/pages/sidebar-1280.jpg) | [sheet](shots/liquid/pages/sidebar-390.jpg) |
| Skeleton | [sheet](shots/liquid/pages/skeleton-1280.jpg) | [sheet](shots/liquid/pages/skeleton-390.jpg) |
| SkipLink | [sheet](shots/liquid/pages/skip-link-1280.jpg) | [sheet](shots/liquid/pages/skip-link-390.jpg) |
| Slider | [sheet](shots/liquid/pages/slider-1280.jpg) | [sheet](shots/liquid/pages/slider-390.jpg) |
| Spinner | [sheet](shots/liquid/pages/spinner-1280.jpg) | [sheet](shots/liquid/pages/spinner-390.jpg) |
| SplitButton | [sheet](shots/liquid/pages/split-button-1280.jpg) | [sheet](shots/liquid/pages/split-button-390.jpg) |
| SplitView | [sheet](shots/liquid/pages/split-view-1280.jpg) | [sheet](shots/liquid/pages/split-view-390.jpg) |
| Stack | [sheet](shots/liquid/pages/stack-1280.jpg) | [sheet](shots/liquid/pages/stack-390.jpg) |
| Stat | [sheet](shots/liquid/pages/stat-1280.jpg) | [sheet](shots/liquid/pages/stat-390.jpg) |
| StatusDot | [sheet](shots/liquid/pages/status-dot-1280.jpg) | [sheet](shots/liquid/pages/status-dot-390.jpg) |
| Stepper | [sheet](shots/liquid/pages/stepper-1280.jpg) | [sheet](shots/liquid/pages/stepper-390.jpg) |
| Surface | [sheet](shots/liquid/pages/surface-1280.jpg) | [sheet](shots/liquid/pages/surface-390.jpg) |
| Switch | [sheet](shots/liquid/pages/switch-1280.jpg) | [sheet](shots/liquid/pages/switch-390.jpg) |
| TabBar | [sheet](shots/liquid/pages/tab-bar-1280.jpg) | [sheet](shots/liquid/pages/tab-bar-390.jpg) |
| TableOfContents | [sheet](shots/liquid/pages/table-of-contents-1280.jpg) | [sheet](shots/liquid/pages/table-of-contents-390.jpg) |
| Tabs | [sheet](shots/liquid/pages/tabs-1280.jpg) | [sheet](shots/liquid/pages/tabs-390.jpg) |
| TagField | [sheet](shots/liquid/pages/tag-field-1280.jpg) | [sheet](shots/liquid/pages/tag-field-390.jpg) |
| Textarea | [sheet](shots/liquid/pages/textarea-1280.jpg) | [sheet](shots/liquid/pages/textarea-390.jpg) |
| Tile | [sheet](shots/liquid/pages/tile-1280.jpg) | [sheet](shots/liquid/pages/tile-390.jpg) |
| TitleBar | [sheet](shots/liquid/pages/title-bar-1280.jpg) | [sheet](shots/liquid/pages/title-bar-390.jpg) |
| Toast | [sheet](shots/liquid/pages/toast-1280.jpg) | [sheet](shots/liquid/pages/toast-390.jpg) |
| ToggleButton | [sheet](shots/liquid/pages/toggle-button-1280.jpg) | [sheet](shots/liquid/pages/toggle-button-390.jpg) |
| ToggleGroup | [sheet](shots/liquid/pages/toggle-group-1280.jpg) | [sheet](shots/liquid/pages/toggle-group-390.jpg) |
| Toolbar | [sheet](shots/liquid/pages/toolbar-1280.jpg) | [sheet](shots/liquid/pages/toolbar-390.jpg) |
| Tooltip | [sheet](shots/liquid/pages/tooltip-1280.jpg) | [sheet](shots/liquid/pages/tooltip-390.jpg) |
| Tour | [sheet](shots/liquid/pages/tour-1280.jpg) | [sheet](shots/liquid/pages/tour-390.jpg) |
| Window | [sheet](shots/liquid/pages/window-1280.jpg) | [sheet](shots/liquid/pages/window-390.jpg) |
| WindowControls | [sheet](shots/liquid/pages/window-controls-1280.jpg) | [sheet](shots/liquid/pages/window-controls-390.jpg) |

Gallery labels (the demo headings) are not components: over the photo they
read poorly in every style, which is the gallery's look, not Liquid's.

## Contract suite

`npm run contract -- --framework react --component <twenty>`: the suite runs
every discovered style, Liquid included (both schemes, LTR and Arabic RTL,
three densities for target size, axe, open checks for overlays).

Button, Card, Checkbox, Dialog, Drawer, DropdownMenu, FloatingActionButton,
IconButton, Popover, RadioGroup, SegmentedControl, Select, Sheet, Slider,
Switch, TabBar, Tabs, Toast, Toolbar, Tooltip: all pass (37 or 57 tests each,
Toolbar 37 with 20 skipped for no open state).

The first run failed Toolbar's axe in Liquid dark (both directions): the on
item's tint text on the lens measured 3.8:1. Fixed in `recipes/Toolbar.css`:
in dark the on item takes `color.text.bright`; the lens, its rim and the item
border still mark it. Rerun green.

## Open choices, each with a recommendation

1. **Glass opacity: readable or airy.** Regular glass is 84% white (light)
   and 90% dark (dark), so muted text and links hold 4.5:1 over a black or a
   white picture. 70% looks more like glass but fails the gate over the
   opposite picture. Recommendation: keep 84 and 90 ("lean to readable", the
   plan's rule), and let `data-glass="clear"` carry the airy look for bars
   over pictures, where the dim and white text keep it legible.
2. **The tint.** `#0a66d6` light, `#2070e8` dark. The dark fill sits in a
   narrow band: white text needs it dark enough (4.62:1), the 3:1 button edge
   on surface 3 needs it light enough (3.01:1). Recommendation: keep; any
   rebrand must land in that band, and the gate checks it.
3. **Body text 15px.** Touch first reads better at 15 to 17px, but desktop
   pages look large next to Neutral's 14. Recommendation: 15px body, 14px
   controls, 17px titles, as built.
4. **Toast shape.** A capsule for one line, 22px corners for more.
   Recommendation: keep; a capsule that holds two lines and an action cuts
   into the text.
5. **Scroll edge fade as a band.** Without a hook into the scroll container,
   the tab bar paints a 20px fade toward the page color above itself. Over a
   photo it shows as a band. Recommendation: keep it until the scroll edge
   hook lands, then turn it into a mask (see hooks).
6. **Checkbox and radio at 16px.** Small for a touch first style; there is no
   icon size between 16 and 24. Recommendation: let the platform axis (order
   1.25) raise them on `ios` and `android`; keep 16 on the web.

## Hooks needed from components

Built today with the nearest thing; each line is the exact hook.

1. **Button highlight that follows the pointer.** `--_button-pointer-x` and
   `--_button-pointer-y` written by `Button.tsx` on pointer move, read by a
   highlight layer. Order 1.23 adds exactly this as `--_button-glow`,
   `-glow-x`, `-glow-y`, `-glow-color`, `-glow-size` on a `::before` glow
   layer. On merge, Liquid's `recipes/Button.css` must drop its own
   `::before` sheen and set `--_button-glow: 1;` and
   `--_button-glow-color: var(--ds-color-glass-highlight);` instead, or the
   two `::before` rules collide.
2. **Switch lens.** A thumb lens layer and a backdrop property. Order 1.23
   adds `--_switch-thumb-backdrop`, `--_switch-thumb-highlight` (painting the
   `thumb-lens` part), `-highlight-opacity`, `-opacity-pressed`,
   `--_switch-thumb-solid`, `-solid-pressed`, `--_switch-thumb-shadow` and
   `--_switch-thumb-size-pressed`. On merge, `recipes/Switch.css` sets those
   instead of styling the thumb directly: `--_switch-thumb-solid-pressed:
   0.4`, `--_switch-thumb-backdrop: brightness(1.12) saturate(1.6)`,
   `--_switch-thumb-highlight: radial-gradient(...color.glass.highlight...)`,
   `--_switch-thumb-shadow: var(--ds-elevation-tooltip)`.
   Still missing after 1.23: magnification. A `--_switch-thumb-lens-scale`
   that scales a copy of what is under the lens cannot be done with
   `backdrop-filter`; it needs an SVG filter (Chromium only, behind a prop,
   per the plan) or a cloned layer.
3. **Toast stack that merges.** Order 1.23 adds `--_toaster-gap`,
   `--_toast-peek` and `--_toast-depth` with a stacked toaster. On merge,
   `recipes/Toast.css` drops its direct `gap` on the toaster and sets
   `--_toaster-gap: var(--ds-space-2xs)`, `--_toast-peek: var(--ds-space-s)`,
   `--_toast-depth: 0.05` and the stack ease to `ease.spring-soft`.
4. **Slider.** `--_slider-thumb-bg` apart from `--_slider-fill` (Liquid sets
   the thumb background directly and has to redo forced colors), and a one
   axis `--_slider-stretch` (a scaleX along the travel while dragging).
   1.23's `--_slider-halo` and `--_slider-pull-*` cover the held state.
5. **Scroll edge fade.** TabBar and Toolbar cannot reach the scroll
   container. A `data-edge="top|bottom"` on Toolbar and a
   `--_tab-bar-fade` / `--_toolbar-fade` color, or better a scroll edge mask
   hook on ScrollArea or PageShell (`--_scroll-area-fade-start`, `-end`).
6. **Menu and list rows.** `--_menu-item-shadow`,
   `--_command-palette-item-shadow`, `--_select-item-shadow`,
   `--_list-box-option-shadow`, so the lens rim is a private property and not
   a `box-shadow` set on the row's pseudo element. 1.23's sliding highlight
   markers (`--_menu-highlight-bg` and the same for list box, select and
   command palette) take the lens fill on merge.
7. **Sheet grabber.** A `--_dialog-handle-radius` (the handle is a flat bar).
8. **Optional.** `--_segmented-control-indicator-filter` and
   `--_switch-thumb-shadow` (the latter arrives with 1.23).

## What is left for React Native and a real phone

- The native theme objects are built: `packages/tokens/dist/native/liquid.light.ts`
  and `liquid.dark.ts`, with snapshots. Materials are rgba, springs are
  numbers for Reanimated `withSpring`.
- No native recipes yet (`packages/styles/liquid/native/`). Per section 3.5 of
  the plan, native glass uses `expo-glass-effect` where
  `isLiquidGlassAvailable()` is true, and otherwise a tinted solid with
  `expo-blur`. Neither package is installed; that is wave 2 work and an
  install order.
- A real phone check: the system font stack resolves to the platform font
  only on the device; headless Chromium on Linux draws a fallback. Blur cost
  on a mid range Android phone and the safe area under the floating tab bar
  need a device. The 16px checkbox needs the touch check (open choice 6).

## Changes needed from the lead

1. **Merge order with 1.23.** The two `::before` rules on Button collide
   (hook 1). Merge 1.23 first, then apply hooks 1 to 3 in Liquid's recipes;
   until then Liquid's recipes are correct against the current components.
2. **Glass levels as a token axis.** `data-glass` is handled in each recipe
   (`[data-style='liquid'][data-glass='tinted'] [data-ds='x']`), because a
   recipe may not declare `--ds-*`. If the token build emitted
   `[data-style='<id>'][data-glass='<level>']` blocks from a style token
   extension (as density does for base tokens), each recipe would read
   `color.material.glass` and the level would come for free.
3. **Two edits outside this order's files**, made because the check failed
   with any new style: `packages/react/src/components/ScrollArea/ScrollArea.test.tsx`
   expected exactly 6 style modes (now at least 6), and
   `examples/consumer-vite/DESIGN.md` was rewritten by `ds init` to list the
   new style.
4. **Gallery link rule.** `apps/gallery-react` has an override rule
   `[data-gallery="root"] a:not([data-ds])` that colors every link part with
   `color.text.link`, so inactive TabBar items, Dock items and the Navbar brand
   show the tint in every style (and read poorly at the clear level).
5. **Contract additions.** One group, `color.glass`: `highlight`, `lens`,
   `on-clear`, `backdrop-bright`, `backdrop-dark`, filled in Studio, Desk and
   Neutral too (aliases to their own glass edge, strong glass and default
   text; white and black for the backdrops).
6. Log the HUMAN GATE: Liquid approval.

## Files

`packages/styles/liquid/`: `style.json`, `tokens.light.json`,
`tokens.dark.json` (generated from Neutral's files plus Liquid overrides by a
script in the order's scratch folder, then committed as source), `fonts.css`,
`icons.ts`, `motion.ts`, `figma.json`, and 26 recipes: Button, Checkbox,
Combobox, CommandPalette, Dialog, Dock, DropdownMenu, FloatingActionButton,
HoverCard, Input, ListBox, Menubar, MultiSelect, Navbar, Popover, RadioGroup,
SegmentedControl, Select, Slider, Switch, TabBar, Tabs, Toast, Toolbar,
Tooltip, Tour. `index.css` is generated by `npm run gen`. Also
`packages/tokens/src/contract.json` (the `color.glass` group),
`packages/lint/src/contrast-pairs.ts` (the Liquid pairs), and the token
snapshots.
