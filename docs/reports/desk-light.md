# Desk Light

Status: proposed. Waiting on the owner (HUMAN GATE). `style.json` already
lists light under `proposedSchemes`.

Order 0.17. The source (GoBanana) draws Desk in dark only. This scheme is new.
Every value lives in `packages/styles/desk/tokens.light.json`; each token's
`$description` says what it is for, why the light value is what it is, and
ends with "Proposed, Desk Light".

## The idea in one line

Turn the lights on in the same room: a warm light grey desk with the same
grain, white glass windows that sit lighter than the desk (as dark glass sits
lighter than the black desk), the same yellow primary with a gold edge, ink
where dark uses white.

![Desk light, three windows](shots/desk-light/desk-light.png)
![Desk dark, the same three windows](shots/desk-light/desk-dark.png)

## Rationale per dial

### 1 Base

- Desk `#e4e2dd`: a warm light grey. The black desk of dark is pure neutral,
  but the only colour in the chrome is a warm yellow; a grey with a trace of
  warmth (hue about 85, very low chroma) keeps the yellow at home and reads
  as paper, not as a cold app shell.
- Surfaces step down from white: `#ffffff`, `#f8f7f5`, `#f0efec`, `#e7e6e2`,
  `#dad9d4`. Same warm hue. Surface 5 is the darkest surface, so it is the
  darkest backdrop the gate tests glass over; white is the brightest.
- Ink `#121211` for bright text, `#262522` for body text, then dim, muted and
  subtle greys. Dark keeps dim closer to bright than muted (`#b9b9b9` against
  `#a3a3a3`); light keeps that order (`#4f4d48`, `#57554f`, `#65635e`).
  Subtle is the lightest grey that still holds 4.5:1 on the desk.
- Overlays are the desk ink at the same alphas as the white overlays of dark.
- The grain stays. The Window recipe inverts the tile in light, at the shared
  strength `palette.site.grain-opacity` (0.14). In the shots it reads as a
  fine paper tooth, not as dirt. See "What this order could not change".

### 2 Accent

- The yellow `#ffd84d` stays, and the dark text on it (`#111827`) stays:
  10.79:1 or more on every fill step.
- On light the fill is 1.38:1 on white and 1.06:1 on the desk, so it needs an
  edge. `color.primary.border` is a gold `#987400`: 3.35:1 on the desk, 4.34:1
  on white, and 3.14:1 against the yellow itself, so the edge also reads as a
  line, not a shadow. It is the lightest gold that passes on every control
  surface, so the yellow still leads.
- Hover goes one step deeper (`#ffcf26`), pressed deeper again (`#f5c400`).
  Dark goes lighter on hover; on a light page a lighter yellow would vanish.
- The yellow fails as text on light, so `primary.on-surface` is a deep gold of
  the same hue, `#765700` (5.17:1 on the desk). Soft fills use the yellow at
  24% and 36% (dark: 12% and 20%) so the tint still reads as yellow on white.
- Identity accents keep the first pass: the deep tone of each dark pastel,
  same hue (mint to `#047857`, lavender to `#6d28d9` and so on). White text
  holds 4.5:1 on each, and each holds 4.5:1 as text on surface 2.
- States go from the 400 tones of dark to deep tones of the same hue on light:
  red, amber, emerald and violet. Info is violet now, the hue of the dark info
  (`#a78bfa`); the first pass had indigo from Studio.

### 3 Depth

- Glass is white at 72% (dark: `#1f1f1f` at 53%). Over the darkest backdrop
  it lands at `#f5f4f3`, over the desk at `#f7f7f5`, over white at white.
- Strong glass (toasts) white at 88%, menu bar the desk tone lifted to
  `#f4f3f0` at 72% (the same alpha as the black menu bar), dock `#fafaf8` at
  62%, tinted glass a cream of the yellow at 66%.
- Title bar: white at 32% over the glass, so the band is a touch lighter than
  the body, as in dark (white at 3% on dark glass gives the same small step).
- Blur stays 24 and 40px with the recipe's saturate.
- Shadows keep the dark shapes (window: 30px down, 80px blur, minus 20 spread,
  then a 1px ring) in a cool ink `#1a1d24` at about a third of the strength:
  26% for the window, 22% for the soft window shadow, 6% for the ring. On a
  light desk a black shadow at dark strength reads as a dirty halo.
- Scrim 36% black (dark 65%), window backdrop dim the cool ink at 20%.

### 4 Separation

- Windows stay free on the desk with a hairline inside: black at 10% (dark:
  white at 10%), plus the 6% ring in the shadow.
- Glass against the desk is only about 1.2:1. The window reads by its edge
  and shadow, as in dark, where glass on black is about 1.1:1.
- Control borders are the ink at 52% (3.51:1 on the desk), hover at 70%.

### 12 Focus

- A 2px ink ring (`#121211`) with a white halo: 13.26:1 or more on every
  surface.
- On the yellow, the doubled ring keeps the order of dark: inner ring ink
  against the fill (11.4:1 or more), outer ring white, so it shows as two
  rings on the grey desk. On white the outer ring merges with the page and the
  inner ink ring carries the indicator alone (14.47:1 on the desk).

![Focus on the primary, light](shots/desk-light/focus-light.png)
![Focus on the primary, dark](shots/desk-light/focus-dark.png)
![Focus on a neutral button, light](shots/desk-light/focus-light-2.png)

### Window lights

The mac colours do not reach 3:1 on a white title bar: red `#ff5f57` 2.99:1,
yellow `#febc2e` 1.69:1, green `#28c840` 2.23:1. There is no edge token, and
this order may not edit the Window recipe, so the light scheme uses deeper
tones of the same hues: close `#f5534b`, minimize `#c08000`, zoom `#119f2d`,
idle dots `#8b8a85`. The glyph ink goes a little darker (`#3a0000` at 78%) so
it keeps 3:1 on the deeper lights.

![Lights on hover, light](shots/desk-light/lights-light.png)
![Lights on hover, dark](shots/desk-light/lights-dark.png)

### Charts and canvas

Chart hues stay. Categorical 3, 4, 6 and 7 fell under 3:1 on light surfaces;
each is darkened in OKLCH, same hue, just to 3:1 on surface to surface 3.
Axis and grid take the warm border tones. Canvas hover, selector and guide are
the dark colours darkened only as far as 3:1 on surface 2. The neon green
selection stays, with the ink halo of the first pass carrying 3:1.

## Key values, dark against light

| Token | Dark | Light |
| --- | --- | --- |
| `color.bg.body` (desk) | `#000000` | `#e4e2dd` |
| `color.bg.surface` to `surface-5` | `#1b1b1b` to `#605f5f` | `#ffffff` to `#dad9d4` |
| `color.material.glass` | `#1f1f1f` 53% | `#ffffff` 72% |
| `color.material.glass-strong` | `#161616` 88% | `#fdfdfc` 88% |
| `color.material.menubar` | `#000000` 72% | `#f4f3f0` 72% |
| `color.material.dock` | `#1c1c1c` 65% | `#fafaf8` 62% |
| `color.material.titlebar` | `#ffffff` 3% | `#ffffff` 32% |
| `color.material.glass-solid` | `#141414` | `#f6f5f2` |
| `color.border.hairline` | `#ffffff` 10% | `#000000` 10% |
| `color.border.control` | `#ffffff` 40% | `#121211` 52% |
| `color.text.bright` / `default` | `#ffffff` / `#ededed` | `#121211` / `#262522` |
| `color.text.dim` / `muted` / `subtle` | `#b9b9b9` / `#a3a3a3` / `#8f8f8f` | `#4f4d48` / `#57554f` / `#65635e` |
| `color.primary.fill` / hover / pressed | `#ffd84d` / `#ffe170` / `#f2c832` | `#ffd84d` / `#ffcf26` / `#f5c400` |
| `color.primary.border` | the fill | `#987400` |
| `color.primary.on-surface` | the fill | `#765700` |
| `color.focus.ring` / halo | `#f4f4f5` / `#000000` | `#121211` / `#ffffff` |
| ring on primary, inner / outer | `#000000` / `#f4f4f5` | `#121211` / `#ffffff` |
| lights close / min / zoom / idle | `#ff5f57` / `#febc2e` / `#28c840` / `#e8e8e8` | `#f5534b` / `#c08000` / `#119f2d` / `#8b8a85` |
| `elevation.window` | black 85%, ring 40% | `#1a1d24` 26%, ring 6% |
| `color.bg.scrim` | black 65% | black 36% |

## Measured contrast (desk light)

Measured with the `ds/contrast` code (`packages/lint/src/rules/contrast.ts`),
composited in sRGB. The darkest backdrop is surface 5, the brightest is white.
The gate passes with no known failures for desk light.

| Pair | Worst case | Ratio | Needs |
| --- | --- | --- | --- |
| Bright text on every glass, both backdrops | tinted glass over surface 5 | 15.66 | 4.5 |
| Body text on every glass | tinted glass over surface 5 | 12.80 | 4.5 |
| Dim text on every glass | tinted glass over surface 5 | 7.05 | 4.5 |
| Muted text on every glass | tinted glass over surface 5 | 6.22 | 4.5 |
| Subtle text on every glass | tinted glass over surface 5 | 5.01 | 4.5 |
| Subtle text on regular glass | over surface 5 / over white | 5.47 / 6.00 | 4.5 |
| Subtle text on menu bar / dock | over surface 5 | 5.06 / 5.14 | 4.5 |
| Muted text on a hovered row in glass | over surface 5 | 6.15 | 4.5 |
| Subtle text (captions) | desk | 4.63 | 4.5 |
| Muted text | desk | 5.75 | 4.5 |
| Dark text on the yellow | pressed fill | 10.79 | 4.5 |
| Gold border of the yellow | desk / white / the fill | 3.35 / 4.34 / 3.14 | 3 |
| Gold text (`primary.on-surface`) | desk | 5.17 | 4.5 |
| Control border | desk | 3.51 | 3 |
| Focus ring | surface 5 | 13.26 | 3 |
| Inner ring on the yellow | pressed fill | 11.40 | 3 |
| Close light on the title bar | over glass over surface 5 / white | 3.17 / 3.37 | 3 |
| Minimize light | over surface 5 / white | 3.11 / 3.31 | 3 |
| Zoom light | over surface 5 / white | 3.27 / 3.48 | 3 |
| Idle light | over surface 5 / white | 3.24 / 3.45 | 3 |
| Light glyph on its light | close light | 3.82 | 3 |
| State fills (danger, warning, success, info) | desk | 3.73, 3.87, 4.23, 4.40 | 3 |
| State text on its 20% tint | over the desk | 5.09, 4.90, 5.38, 5.57 | 4.5 |
| Categorical chart colours | surface 3 | 3.07 or more | 3 |

## What I tried and rejected

1. **The first pass (Studio Light neutrals).** Cool slate ink `#111827` and
   blue grey surfaces. Next to the pure neutral black of Desk dark and the
   warm yellow it read as another product. Replaced by warm neutrals and a
   neutral ink. ![First pass](shots/desk-light/rejected-first-pass-window.png)
2. **Glass at 66% near white.** Over the grey desk the windows went a flat
   putty grey and the blur looked like dirt on the glass. 72% white keeps the
   window clearly lighter than the desk.
3. **Title bar at 40% white.** The band under the lights read as a separate
   strip. 32% gives the same small step as dark.
4. **Info in indigo** (from Studio) broke the hue of the dark violet info.
   Violet `#6d28d9` as on-tint text failed on its own 20% tint (4.16:1); the
   tint now uses the lighter violet `#8b5cf6` and the text `#5b21b6` (5.57:1).
5. **Mac light colours unchanged.** Under 3:1 on a light title bar (1.69:1 for
   minimize). Deeper tones of the same hues reach 3:1; the first try for zoom
   and idle (`#14a630`, `#93928d`) still fell to 2.98:1 and 2.89:1 over the
   darkest backdrop and went one step deeper.
6. **A neutral grey desk** `#e3e3e3`: works and passes, see choice 1.

## Open choices for the owner

1. **Warm or neutral desk.** Warm grey `#e4e2dd` (proposed) or neutral grey
   `#e3e3e3` with neutral surfaces. Both pass every pair. Recommendation:
   warm. The yellow is the one colour in the chrome, and the warm desk makes
   the white windows read as lit paper; neutral reads closer to Studio Light
   and a little colder than the dark desk feels.
   ![Neutral desk option](shots/desk-light/option-neutral-desk.png)
2. **How strong the gold edge on the yellow is.** `#987400` (proposed, 3.35:1
   on the desk, the lightest that passes) or `#7a5c00` (GoBanana light,
   4.83:1 on the desk, a firm outline). Recommendation: the lighter one; the
   firmer edge makes the button read as an outlined badge and fights the
   pill shapes of the other buttons. Take `#7a5c00` if the owner wants the
   primary to win harder on busy screens.
3. **Window lights.** (a) Deeper tones that reach 3:1 on their own
   (proposed), (b) the mac colours with a 1px darker edge per light, or
   (c) the mac colours as they are, under 3:1. Option (b) keeps the familiar
   yellow and green but needs an edge token in the contract and a change in
   the Window recipe or WindowControls CSS (another order). Recommendation:
   (a) now; (b) is the better look if the contract gets
   `color.window.light-edge`. The amber minimize light is the one value that
   reads less like a mac light.

Decided here, open to a change: glass is lighter than the desk, as in dark.
Darker glass on a light desk (grey frosted windows) was not built: it would
make every window a dim box and put text at its weakest exactly where the
content is.

## What this order could not change

- **Grain strength.** `palette.site.grain-opacity` is a base token (0.14)
  shared by both schemes; the light scheme only inverts the tile (Window
  recipe). It reads fine in the shots, but a light value near 0.08 would be
  closer to the brief. That needs a desk token name in the contract or a
  recipe change, neither in this order.
- **Plausible dark backdrops.** The gate tests glass over the desk surfaces
  only. Glass over a dark picture on a light desk is the clear glass rule
  (35% dark layer under bright content) and is not covered by the pair list.

## Screenshots

Desk light, every component page, English left to right and Arabic right to
left, plus dark for comparison. Taken from the gallery with Playwright
(Chromium, 1280 wide, reduced motion).

| Page | Light, ltr | Light, rtl | Dark, ltr |
| --- | --- | --- | --- |
| Button | ![](shots/desk-light/button-light-ltr.png) | ![](shots/desk-light/button-light-rtl.png) | ![](shots/desk-light/button-dark-ltr.png) |
| IconButton | ![](shots/desk-light/icon-button-light-ltr.png) | ![](shots/desk-light/icon-button-light-rtl.png) | |
| Input | ![](shots/desk-light/input-light-ltr.png) | ![](shots/desk-light/input-light-rtl.png) | |
| Field | ![](shots/desk-light/field-light-ltr.png) | ![](shots/desk-light/field-light-rtl.png) | |
| Toast | ![](shots/desk-light/toast-light-ltr.png) | ![](shots/desk-light/toast-light-rtl.png) | ![](shots/desk-light/toast-dark-ltr.png) |
| Window | ![](shots/desk-light/window-light-ltr.png) | ![](shots/desk-light/window-light-rtl.png) | ![](shots/desk-light/window-dark-ltr.png) |
| WindowControls | ![](shots/desk-light/window-controls-light-ltr.png) | ![](shots/desk-light/window-controls-light-rtl.png) | |
| TitleBar | ![](shots/desk-light/title-bar-light-ltr.png) | ![](shots/desk-light/title-bar-light-rtl.png) | |

Window detail, light then dark:

![Window detail, light](shots/desk-light/detail-window-light.png)
![Window detail, dark](shots/desk-light/detail-window-dark.png)
