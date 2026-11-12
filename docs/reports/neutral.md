# Neutral

Status: proposed. Waiting on the owner (HUMAN GATE, Neutral approval).
`packages/styles/neutral/style.json` carries `"status": "proposed"`.

Order 1.10. Neutral is the everyday product look: white and soft gray, one
brand color, 1px borders, small soft shadows, 8px corners, Inter, line icons,
filled primary and outline secondary at 36px. Light is the default scheme,
dark is a true dark. Every value lives in
`packages/styles/neutral/tokens.light.json` and `tokens.dark.json`; each
token Neutral sets says why in its `$description` and ends with "Proposed,
Neutral." Values Neutral does not set (accents, charts, canvas, window
lights, the light state colors) keep the Studio value of the same scheme.

![Neutral light, Button](shots/neutral/button-light-ltr.png)
![Neutral dark, Button](shots/neutral/button-dark-ltr.png)

## Three styles from the same components

The same Button, Input, Dialog and Toast markup in Studio, Desk and Neutral,
light scheme. Only tokens and recipes differ.

![Button in Studio, Desk and Neutral](shots/neutral/compare-button.png)
![Input in Studio, Desk and Neutral](shots/neutral/compare-input.png)
![Dialog in Studio, Desk and Neutral](shots/neutral/compare-dialog.png)
![Toast in Studio, Desk and Neutral](shots/neutral/compare-toast.png)

What tells them apart: Studio is achromatic with an overlay gray primary and
pixel icons on a cool gray desk; Desk is a warm desk with pill controls, the
yellow primary, window lights and a blurred scrim; Neutral is the only one
with a colored primary, square cornered (8px) controls, white fields, line
icons, 13 and 14px text and a plain, unblurred dim behind dialogs.

## What the references taught (proportion only)

Fetched on 12 November 2026 with a headless browser; computed sizes read off
the rendered pages. No code, class name, token name or asset was taken.

- **FlyonUI.** Controls sit at 38px with a 6px corner and a 1px border; the
  filled buttons carry a very short, soft drop (about 1px down, 3px blur) and
  a medium weight label. Fields have the same height, corner and border as
  buttons, on white. Lesson: a field and a button should be the same box.
- **shadcn/ui.** The current default control is 32px with a 10px corner,
  a pale 1px border and no shadow on outline buttons; labels are 14px at
  medium weight. Lesson: weight 500 to 600 and 14px read as "product"; the
  pale border it uses is under 3:1, which our gate does not allow, so
  Neutral's control border is darker.
- **HeroUI.** A light gray page with white cards, round controls at about
  36px, quiet gray secondary fills, generous spacing between groups.
  Lesson: the gray page plus white card split, and gray filled secondary
  buttons as a valid quiet emphasis.
- **Astryx.** A tinted page with large white cards (big corners, very soft
  wide shadows), dark filled primary and gray secondary in pairs, about 36px.
  Lesson: depth comes from wide, low opacity shadows, never a hard edge; the
  primary and secondary pair always sits together at the same height.

## Rationale per dial

### 1 Base

White surfaces on a soft cool gray page (`#f4f5f7`), five steps to
`#d6dae0` for hover, pressed and track fills. The gray has a trace of blue so
the one blue reads at home. Dark is a true dark: the page `#0b0d11`, cards one
step up (`#14171c`), five steps to `#363c45`. Not pure black, so the soft
shadows and borders still read. The overlay ink is a blue black in light and
white in dark.

### 2 Accent

One brand color: `color.primary.fill`, blue `#2563eb` in light, `#2f6bed` in
dark. Hover and pressed go deeper in both schemes. `primary.border` aliases
the fill, so rebranding is one token per scheme (plus the hover and pressed
steps and the text tone, which the gate checks). The text tone of the brand
(`primary.on-surface`, links) is `#1d4fc4` in light and `#86adff` in dark.
The ten identity accents and the light state colors keep Studio's values.
In dark the solid danger, success and info buttons take deep tones with
white text (`#dc2626`, `#047857`, `#6d4fe0`) so every filled button is one
family with the brand fill.

### 3 Depth

Small soft shadows in the blue black ink, two layers each (a 1 to 2px
contact shadow and a wider low one): cards 5%, menus 6% and 10%, toasts 6%
and 8%, windows 6% and 10%, dialogs 6% and 14%. Dark uses black at higher
alphas, since a shadow on a dark page needs more to show. No blur anywhere:
`blur.*` is 0px and every material is a solid surface (`usesGlass: false`).

### 4 Separation

1px borders and white space. Cards, windows and dialogs carry
`border.default` (`#dfe2e7`, dark `#2b3039`); the window header and dialog
bands are split by the same 1px line. Controls carry `border.control`
(`#7f8794`, dark `#6c7584`), the lightest gray that keeps 3:1 against body to
surface 3.

### 5 Radius

6, 8, 12: `radius.sm` 6 (menu rows, small marks), `radius.control` and
`radius.field` 8 (buttons and inputs), `radius.panel`, `card` and `window` 12,
`radius.sheet` 16. `radius.control` is a px dimension here, not Studio's 1em
pill, which is what moves Neutral away from pills with no recipe.

### 6 Controls

Filled primary (`tone="accent" emphasis="solid"`) and outline secondary
(`emphasis="outline"`), both 36px at the default density. The soft neutral
button (the Button default) stays a quiet gray fill; see open choice 3.

### 7 Density

`defaultDensity: "comfortable"`. The shared scale gives md 36, sm 32, xs 28
and lg 48 at that step, which is the Neutral brief (36 to 40px) without
overriding any size token; compact (md 28) and default (md 32) still work.
See contract finding 1 for why this is not a token override.

![Compact](shots/neutral/density-compact.png)
![Default](shots/neutral/density-default.png)
![Comfortable, the Neutral default](shots/neutral/density-comfortable.png)

### 8 Type

Inter, IBM Plex Sans Arabic for Arabic. Neutral fills three base sizes with
its own values, one step up from Studio: `font.size.s` 13 (buttons, inputs,
labels), `m` 14 (body), `l` 15. `font.weight.bold` is 600: Inter at 700
reads heavy at 13 and 14px. Display tracking -0.02.

### 9 Icons

`iconSet: "line"` (lucide-static, ISC). The line set draws at stroke width 2
today; Neutral wants 1.5. Icon.css has no private property for it, so the
glyphs stay at 2 until the change in contract finding 2 lands.

### 10 Chrome

Sidebar, top bar, cards, tables (for the templates of later waves). A Neutral
window is a bordered card with a header and a close button: no window
lights, no title bar band (`optionalParts: {}`), like Studio.

### 11 Motion

150 to 200ms, ease out. `duration.base` aliases `duration.moderate` (150ms)
and `duration.medium` aliases `duration.slow` (180ms), so dialogs open in
150ms and toasts enter in 180ms on the existing `ease.out`. They are aliases,
not values, so under reduced motion they still resolve to 0ms. The motion
preset is `fade`: panels fade and settle in place, nothing grows from its
trigger.

### 12 Focus

A 2px brand ring with a 2px gap: `focus.shadow.ring` is a 2px spread in
`focus.halo` (the surface color) under a 4px spread in `focus.ring` (blue).
On the brand fill the same shape holds (gap, then ring), and the white gap
carries the indicator against the blue fill.

![Focus, light](shots/neutral/focus-light.png)
![Focus, dark](shots/neutral/focus-dark.png)

## Key values, light against dark

| Token | Light | Dark |
| --- | --- | --- |
| `color.bg.body` | `#f4f5f7` | `#0b0d11` |
| `color.bg.surface` to `surface-5` | `#ffffff` to `#d6dae0` | `#14171c` to `#363c45` |
| `color.border.default` (card edge) | `#dfe2e7` | `#2b3039` |
| `color.border.control` / hover | `#7f8794` / `#5f6774` | `#6c7584` / `#8e97a5` |
| `color.text.bright` / `default` | `#0f1729` / `#1c2433` | `#f4f6f9` / `#e2e6eb` |
| `color.text.muted` / `subtle` | `#4b5464` / `#5a6372` | `#a4adba` / `#949dab` |
| `color.primary.fill` / hover / pressed | `#2563eb` / `#1d55d4` / `#1a47b0` | `#2f6bed` / `#2864e8` / `#265fd9` |
| `color.primary.on-surface` (links) | `#1d4fc4` | `#86adff` |
| `color.primary.tint` / hover | blue 8% / 14% | blue 14% / 22% |
| `color.focus.ring` / halo | `#2563eb` / surface | `#6d9bff` / surface |
| `color.bg.scrim` | black 40% | black 60% |
| `radius.control` / `panel` / `sheet` | 8 / 12 / 16px | same |
| `elevation.dialog` | ink 6% (2/6px) and 14% (16/40px) | black 30% and 55% |
| `font.size.s` / `m` / `l` | 13 / 14 / 15px | same |
| `duration.base` / `medium` | 150 / 180ms (aliases) | same |

## Measured contrast

Measured with the `ds/contrast` code (`packages/lint/src/rules/contrast.ts`),
composited in sRGB, worst case across the surfaces of each pair group.
289 pairs per scheme; no failures and no known failures for neutral.

| Pair | Light, worst | Dark, worst | Needs |
| --- | --- | --- | --- |
| Default text on surface 5 | 11.08 | 8.86 | 4.5 |
| Muted text on surface 3 | 6.74 | 6.86 | 4.5 |
| Subtle text (captions) on body or surface 2 | 5.55 | 6.17 | 4.5 |
| Placeholder on surface 2 | 5.75 | 6.17 | 4.5 |
| Link (brand text) on surface 3 | 6.25 | 6.99 | 4.5 |
| Primary label (white) on the fill | 5.16 | 4.72 | 4.5 |
| Brand text on the soft brand fill (hover) | 5.36 | 5.94 | 4.5 |
| Danger solid label | 6.47 | 4.82 | 4.5 |
| Control border on surface 3 | 3.20 | 3.34 | 3 |
| Control border, hover | 5.04 | 5.27 | 3 |
| Primary button edge on surface 3 | 4.56 | 3.29 | 3 |
| Focus ring on surface 5 | 3.68 | 4.11 | 3 |
| Focus on the brand fill (gap against pressed fill) | 5.16 | 3.18 | 3 |
| Ring against the gap | 5.16 | 6.65 | 3 |

The tight ones are the dark primary label (4.72) and the dark gap against
the pressed fill (3.18): the dark fill has a narrow band where white text
holds 4.5:1 and the dark gap holds 3:1. Any other brand color must land in
that band (relative luminance 0.125 to 0.183) or the gap and ring order must
change.

## Recipes, and why a token could not do each

1. `recipes/Input.css`. The field fill in `Input.css` is `transparent` with
   no token behind it, so no token can make a Neutral field white on the
   gray page. In the same file the focus border takes the brand edge:
   `border.control-hover` is shared by hover and focus, so a token cannot
   split them. Read only fields keep their own quiet fill.
2. `recipes/Window.css`. The line under the window header is the private
   `--_title-bar-border-color` of `TitleBar.css`, transparent by default,
   with no token behind it. Studio has the same recipe.

No Button, Dialog or Toast recipe: radius, colors, shadows, scrim, blur and
motion all come from tokens. No native recipe: the React Native Button reads
`radius.control` from the theme object already.

## Contract findings

1. **A style cannot shift the control scale and keep density.** `size` is a
   contract group, so a style may fill `size.control.*`, but the token build
   writes the density blocks as `[data-density='compact']` (specificity 0,1,0)
   before the style blocks `[data-style][data-scheme]` (0,2,0). A style value
   would beat every density. Neutral uses `defaultDensity: "comfortable"`
   instead, which is honest and needs no change. Smallest change if the lead
   wants Neutral's own scale: let a style token carry
   `$extensions["ds.density"]` (`{ "compact": 32, "comfortable": 40 }`) and
   have `packages/tokens/build.ts` emit those under
   `[data-style='<id>'][data-density='<d>']` after the style blocks.
   The same holds for any base token a density file overrides.
2. **Line icon stroke width has no private property.** The line set writes
   `stroke-width="2"` on the svg (`packages/icons/sets/line.ts`), and
   `packages/css/src/components/Icon.css` has no property a recipe can
   override. The one line change, in the `[data-ds='icon'][data-set='line']`
   rule of `Icon.css`:
   `stroke-width: var(--_icon-stroke-width, 2);`
   (CSS beats the presentation attribute). Neutral then adds
   `recipes/Icon.css`:
   `[data-style='neutral'] [data-ds='icon'][data-set='line'] { --_icon-stroke-width: 1.5; }`.
   If raw numbers are not allowed there, a component token
   `icon.stroke.width` (number) in the base tokens, 2, which Neutral sets to
   1.5, removes the recipe entirely.
3. **The token build test lists styles by name.**
   `packages/tokens/tests/build.test.ts` line 12 expects exactly
   `['desk.dark', 'desk.light', 'studio.dark', 'studio.light']`, so every new
   style fails it. Change: add `'neutral.dark', 'neutral.light'` in sorted
   place, or assert that studio and desk are included.
4. **Icons and motion maps.** `packages/react/src/theme/icons.ts` and
   `packages/native/src/theme/icons.ts` fall back to `{ set: iconSet }` for a
   style not in their map, and `Window/styleMotion.ts` falls back to `fade`
   for an unknown preset, so Neutral works without a change. A row for
   neutral in each is optional and only needed once `icons.ts` gains a map.

## Default style

The lead decided: the Theme fallback stays `studio`
(`packages/shared/src/theme.ts` line 91) while Neutral is proposed; the
galleries default to Neutral. Changes needed (files this order does not
edit):

- `apps/gallery-react/src/App.tsx` line 26:
  `const axes = unknownStyle ? { ...asked, style: DEFAULT_STYLE } : asked;`
  becomes
  `const axes = { ...asked, style: unknownStyle || !asked.style ? GALLERY_STYLE : asked.style };`
  with `export const GALLERY_STYLE = 'neutral';` in
  `apps/gallery-react/src/axes.ts`, and line 50 shows `{GALLERY_STYLE}`.
- `apps/gallery-angular/src/app/app.ts` line 157, the same shape, and line
  183 `defaultStyle = GALLERY_STYLE`.

## Open choices for the owner

1. **The brand blue.** `#2563eb` light, `#2f6bed` dark. A familiar product
   blue with room on both sides of the contrast band. Recommendation: keep
   it; a team rebrands Neutral by changing the fill, hover, pressed and
   on-surface tokens in each scheme, and the gate checks the result.
2. **Default control height, 36 against 40.** 36 is what comfortable gives
   today and matches the references (FlyonUI 38, HeroUI and Astryx about 36).
   40 reads touch friendly but heavy next to 14px text on desktop.
   Recommendation: 36, through `defaultDensity: "comfortable"`.
3. **The soft neutral button.** The Button default (neutral, soft) is a gray
   fill (overlay 10%), as HeroUI's secondary. The brief says outline
   secondary, which Neutral already gives with `emphasis="outline"`. A recipe
   could draw soft neutral as a white box with a border, but then soft and
   outline look alike. Recommendation: keep soft as the gray fill and use
   outline for the secondary action in Neutral templates.
4. **Control radius, 6 against 8.** 8 matches the 12px cards (inner corners
   read as one family at 36px). 6 reads tighter and closer to FlyonUI.
   Recommendation: 8.

## Screenshots, every wave 0 component

Gallery routes `/c/<slug>?style=neutral&scheme=<s>&chrome=0`, RTL with
`dir=rtl&lang=ar`. Dialog and Toast are shown open.

| Component | Light LTR | Light RTL | Dark LTR | Dark RTL |
| --- | --- | --- | --- | --- |
| Button | ![](shots/neutral/button-light-ltr.png) | ![](shots/neutral/button-light-rtl.png) | ![](shots/neutral/button-dark-ltr.png) | ![](shots/neutral/button-dark-rtl.png) |
| IconButton | ![](shots/neutral/icon-button-light-ltr.png) | ![](shots/neutral/icon-button-light-rtl.png) | ![](shots/neutral/icon-button-dark-ltr.png) | ![](shots/neutral/icon-button-dark-rtl.png) |
| Icon | ![](shots/neutral/icon-light-ltr.png) | ![](shots/neutral/icon-light-rtl.png) | ![](shots/neutral/icon-dark-ltr.png) | ![](shots/neutral/icon-dark-rtl.png) |
| Input | ![](shots/neutral/input-light-ltr.png) | ![](shots/neutral/input-light-rtl.png) | ![](shots/neutral/input-dark-ltr.png) | ![](shots/neutral/input-dark-rtl.png) |
| Field | ![](shots/neutral/field-light-ltr.png) | ![](shots/neutral/field-light-rtl.png) | ![](shots/neutral/field-dark-ltr.png) | ![](shots/neutral/field-dark-rtl.png) |
| Link | ![](shots/neutral/link-light-ltr.png) | ![](shots/neutral/link-light-rtl.png) | ![](shots/neutral/link-dark-ltr.png) | ![](shots/neutral/link-dark-rtl.png) |
| Dialog | ![](shots/neutral/dialog-light-ltr.png) | ![](shots/neutral/dialog-light-rtl.png) | ![](shots/neutral/dialog-dark-ltr.png) | ![](shots/neutral/dialog-dark-rtl.png) |
| Toast | ![](shots/neutral/toast-light-ltr.png) | ![](shots/neutral/toast-light-rtl.png) | ![](shots/neutral/toast-dark-ltr.png) | ![](shots/neutral/toast-dark-rtl.png) |
| Window | ![](shots/neutral/window-light-ltr.png) | ![](shots/neutral/window-light-rtl.png) | ![](shots/neutral/window-dark-ltr.png) | ![](shots/neutral/window-dark-rtl.png) |
| TitleBar | ![](shots/neutral/title-bar-light-ltr.png) | ![](shots/neutral/title-bar-light-rtl.png) | ![](shots/neutral/title-bar-dark-ltr.png) | ![](shots/neutral/title-bar-dark-rtl.png) |
| WindowControls | ![](shots/neutral/window-controls-light-ltr.png) | ![](shots/neutral/window-controls-light-rtl.png) | ![](shots/neutral/window-controls-dark-ltr.png) | ![](shots/neutral/window-controls-dark-rtl.png) |

## Iterations

1. First pass: controls 36px and blue, but fields were transparent on the
   gray page, the window header had no line, and the dark solid state
   buttons were Studio's pastels with dark text next to a white on blue
   primary. The dark hover went lighter and failed white text (4.00:1), the
   light control border failed on surface 3 (2.92:1), and the dark gap
   failed against the pressed fill (2.92:1).
2. Second pass: the Input and Window recipes, deep dark state solids with
   white text, a deeper dark hover and pressed in the contrast band, a
   darker light control border. All 578 neutral pairs pass.

## Files

`packages/styles/neutral/`: `style.json`, `tokens.light.json`,
`tokens.dark.json` (generated from Studio's paths by a script kept in the
order's scratch folder, then committed as source), `fonts.css`, `icons.ts`,
`motion.ts`, `figma.json` (mode names and variant switches; no schema exists
yet), `recipes/Input.css`, `recipes/Window.css`. `index.css` is generated by
`npm run gen`.
