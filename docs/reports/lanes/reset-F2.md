# Lane report: F2, refraction on the iOS glass

Order F2 of `docs/plan/reset-mobile.md`, after the owner said "also make
liquid effect not blur". Proposed until the owner signs it on a phone. Not
committed by me.

## What the reference glass does at the edge

Looked at 4x and more: the music app's light tab bar (Mobbin crop
`z-library-tabbar-3x`, M1), its dark bottom buttons (`darklist`), and the
vendor's community kit in Figma, read only (Materials page: the small glass
over gray and over coloured stripes, light and dark; the medium and large
panels; the clear glass symbol).

- The middle is nearly clear: in dark the kit's small glass shows the gray
  stripes almost as they are; in light it is a white tint with the content
  under it still sharp enough to read text behind the tab bar.
- In a band about a quarter to a third of the short side wide, the content is
  bent and stretched toward the rim: where a stripe boundary passes under the
  end cap of a kit pill it curves along the cap and shifts by several points;
  album art and text under the tab bar's caps are smeared along the curve.
- The band is brighter than the middle (in light a whitening, in dark a soft
  lift), strongest on the upper leading arc and fainter on the lower trailing
  one, and it fades in: there is no line where it starts.
- At the very rim a thin light edge (order F1's subject, not this one).

## What was built

- `packages/shared/src/refraction.ts` (pure): `refractionAt` and
  `buildRefractionMap` draw the map of a rounded rectangle or capsule from its
  signed distance and outward normal: zero past the band, inside the band a
  move of (1 - depth/band)^2 pointing inward (red x, green y, 128 no move), and
  a glare in blue. Band 0.3 of the short side, 4 to 24px; the deepest move is
  half the band, where the stretch is strongest without folding. One map pixel
  per CSS px, half for parts over 60000 px^2. The map is written as a 24 bit
  BMP data URL (no canvas, no compressor, same bytes in a test and a page).
  `refractionFilter` gives the filter as data: `feImage` (the map) ->
  `feDisplacementMap` on `SourceGraphic` -> the glare (`feColorMatrix` of the
  blue channel, then `feComposite` arithmetic: brightens the content in
  proportion, plus a little light). Every number is data in TypeScript, with
  a comment. `refractionSupported` is the probe.
- `packages/shared/src/refraction-dom.ts`: `acquireRefraction(document)`
  mounts one hidden SVG with one filter per size and corner (parts of the same
  size share it, ref counted), sets `--_ios-refraction: url(#id)` on each part
  once its map is decoded, follows size with a ResizeObserver and new parts
  (menus, toasts in portals) with a MutationObserver on added and removed
  nodes, batched to one animation frame. It only tracks parts whose style sets
  `--_ios-glass` (Liquid, Neutral). Once the first maps are decoded it sets
  `data-refraction="true"` on the document element. Shared between callers;
  the last release takes it all off.
- `packages/react/src/theme/Theme.tsx`: the only React file changed. Like the
  platform detection (`useSyncExternalStore`, server value false), the root
  Theme probes after mount and, when the probe is true and the platform is
  `ios`, calls `acquireRefraction(document)` in an effect (restarted when the
  platform or style changes).
- `packages/css/src/platform/ios-refraction.css`, new, in `ds.platform` and
  `ds.chrome` like `ios.css`, keyed on the same `--_ios-glass` style query and
  `[data-platform='ios']`. `npm run gen` added it to the CSS barrel and the two
  modules to the shared barrel.
- Tests: `packages/shared/src/refraction.test.ts` (map, band, normal at the
  corners, no fold, glare side, BMP bytes, base 64, filter shape, ids, probe)
  and `refraction-dom.test.ts` (jsdom: mount, property, attribute, skip parts
  without the glass, sharing and release).

### Tier 1, Chromium

Parts: tab bar, current tab lens, navigation and sheet buttons, menu, toast,
segmented thumb. `backdrop-filter: var(--_ios-refraction,) blur(blur.backdrop
* 0.25) saturate(1.6)` (panels * 0.5; the lens adds brightness 1.04). Until a
part's map is decoded the var is empty and the part shows the low blur.

Measured in Chromium 153: a sample taken outside the part's box is clamped to
the edge pixel, so an outward bend smears one colour; the map points inward.
Filters in user space units follow the part's transform (checked at scale 1.4
and a stretch).

The held switch thumb is not on the list: it grows and stretches while held,
and the bend drew a ragged edge on the end of the track at 4x even with a full
resolution map. It keeps tier 2's band in every browser.

### Tier 2, every browser and the first paint

A low blur on the part (bars and buttons blur.backdrop * 0.5, panels * 1:
a quarter and a third of M6) and a band in the part's `::before` (in
`ds.chrome`, z-index under the content and over the tint): `blur(* 2)
brightness(1.1) saturate(1.8)` cut by two soft gradient masks along the
inline and block edges (bars and panels 18px, lens and segmented thumb 8px,
held switch 6px). Pseudo elements per part:

| Part | ::before | ::after | Band |
| --- | --- | --- | --- |
| Tab bar | free on ios (Liquid hides its scroll fade there since M6) | F1 rim | yes |
| Current tab lens | free | free | yes |
| Nav and sheet buttons | glow (Button.css) | F1 rim | no, low blur only |
| Menu | free | F1 rim | yes |
| Toast | free | F1 rim | yes |
| Segmented thumb | free | F1 rim | yes |
| Held switch thumb | free | free | yes (both tiers) |

### Gate

`data-refraction="true"` on the document element (covers menus and toasts
portaled into body), set only by the probe, after mount, never on the server.
The probe needs `CSS.paintWorklet` and `navigator.userAgentData` as objects and
`CSS.supports('backdrop-filter', 'url(#a)')`. Both objects are Chromium only in
MDN's compatibility data (verified, mdn/browser-compat-data `api/CSS.json`
`paintWorklet_static`: Chrome 65, Safari and Safari iOS false, Firefox false;
`api/Navigator.json` `userAgentData`: Chrome 90, Safari, Safari iOS, WebView
iOS and Firefox false). Every browser on iOS uses WebKit, so none gets it.
Two independent engine features rather than the user agent string: a string
can be spoofed or frozen and says nothing about what paints; requiring both
means a browser that gains one of them later still fails the other, and a
browser that fails gets the CSS only glass, which is the safe side. The cost:
if WebKit ships the url() form (patches are in review, below) it still gets
tier 2 until the probe is widened.

### Facts checked

- Safari paints nothing for `backdrop-filter: url(#svg)`; Chromium paints it.
  Verified from WebKit bug 245510 (open, "No effect" in Safari 16 and STP
  154, Chrome Canary renders the distortion; feColorMatrix also fails in
  Safari): https://bugs.webkit.org/show_bug.cgi?id=245510. Pull requests to
  implement it were posted in July 2026 and crash the GPU process on trunk as
  of September 2026 (same bug, comments 2026-07-16 and 2026-09-05), so a
  later Safari may paint it. Seen running in Chromium 153 here.
- Safari parses the value, so `@supports` cannot tell: not verified by
  running Safari (not available). Consistent with the bug (the declaration
  applies and draws nothing) but no WebKit source read.
- Firefox does not run SVG filter graphs in backdrop-filter: verified,
  https://bugzilla.mozilla.org/show_bug.cgi?id=1808785 (closed invalid; a
  Mozilla engineer: "We don't currently support SVG filter graphs on
  backdrop-filter").
- `filter: url()` on ordinary content works everywhere but filters the
  element's own painting, not what is behind it: by the Filter Effects spec;
  not separately tested here.
- No library code was read or copied; the method (inward displacement from a
  rounded rect normal, BMP map, arithmetic glare) is our own.

## Verdict by eye (4x, reference left, ours right)

Sheets in scratch `f2/sheet-tier{1,2}-{liquid,neutral}-{light,dark}.png`;
our own triptychs (M6, tier 2, tier 1) in `docs/reports/reset/F2/`.

- Tab bar, tier 1: the middle is clear (stripes and card edges read through
  at a 1.5px blur, against 12px in M6); at both caps and along the top the
  card corners and stripes curve round the shape and brighten. It reads as
  thick glass, not blur, in all four. The tint (52% light, 74% dark after the
  contrast fix) still whitens light content more than the reference does; the
  current tab lens is the dense M6 lens.
- Tab bar, tier 2: middle clear, the edge band frosted and brighter; there is
  no bend, so it reads as a clear pane with a frosted rim. In light a faint
  straight line shows where the band's blur meets the clear middle over a
  hard card edge.
- Nav buttons: tier 1 shows the purple shape bending at the top of the
  capsule, good in both schemes; tier 2 is the low blur only (no free pseudo).
- Menu: tier 1, content through the menu bends at the corners; middle less
  blurred than M6 but still soft enough that rows read. Dark, close to the kit.
  Tier 2 similar with a frosted rim.
- Toast: as the menu. Title text behind the toast is visible as a soft shape
  (blur 3px in tier 1), not legible text.
- Sheet close and segmented thumb: nothing coloured behind them in the demo
  (a solid sheet, a solid track), so both tiers look as M6.
- Held switch: the band brightens the lens edge; the lens itself is the
  style's bright green on fill (M1, F1), not clear as in the reference.

## Cost of scrolling under the tab bar

Chromium headless, software GPU, iPhone 15 Pro profile, settings screen,
4px a frame for 240 frames, 2 runs each, a trace for the compositor's draw
time. Numbers compare the three materials; they are not phone numbers.

| Run | Material | Frame interval | Draw per frame |
| --- | --- | --- | --- |
| quiet machine, Liquid light | M6 | 17.4 ms | 8.7 ms |
| | tier 2 | 17.8 ms | 11.7 ms |
| | tier 1 | 17.3 ms | 10.6 ms |
| loaded machine (other agents), Liquid dark | M6 | 30.1 ms | 29.0 ms |
| | tier 2 | 35.7 ms | 37.6 ms |
| | tier 1 | 39.7 ms | 37.5 ms |
| loaded, Neutral light | M6 | 30.4 ms | 24.7 ms |
| | tier 2 | 40.1 ms | 49.5 ms |
| | tier 1 | 37.7 ms | 36.6 ms |

Both tiers cost about 1.2 to 1.5 times the M6 draw time on scroll; tier 1 is
not dearer than tier 2 (the band's second backdrop filter costs about what the
displacement does). On the quiet run all three hold 60 frames a second. If a
phone shows drops, the limit I propose: tier 1 on the tab bar and its lens
only (the parts that sit over scrolling content), and tier 2 without the band
on menus and toasts. `npm run perceive` measures touch interactions, not
scrolling, so the trace was used.

Clips, 60 frames a second, frame exact (the record pack's `FramedPage`):
`docs/reports/reset/F2/scroll-{tier1,tier2,m6}-{liquid,neutral}-{light,dark}.mp4`.

## Contrast, from pixels (WCAG 2.2 1.4.3 and 1.4.11)

Same method as M6: each label or glyph's colour against every backdrop pixel
in its box with the label hidden, six scroll positions on settings, the menu,
toast and sheet screens. Minimum per item, after the tint fix:

| Item | Liquid light t1 / t2 | Liquid dark t1 / t2 | Neutral light t1 / t2 | Neutral dark t1 / t2 |
| --- | --- | --- | --- | --- |
| Tab label | 7.96 / 7.96 | 6.08 / 5.28 | 7.45 / 7.45 | 5.05 / 5.18 |
| Tab label, current | 5.87 / 5.87 | 5.62 / 5.50 | 5.93 / 5.93 | 5.51 / 5.43 |
| Tab glyph | 7.96 / 7.96 | 5.90 / 5.05 | 6.92 / 7.45 | 4.75 / 4.72 |
| Tab glyph, current | 5.87 / 5.87 | 5.63 / 5.46 | 6.10 / 6.22 | 5.52 / 5.44 |
| Bar button label | 10.58 / 10.60 | 6.56 / 6.68 | 10.02 / 10.04 | 6.17 / 6.26 |
| Menu item | 4.74 / 4.55 | 4.73 / 4.69 | 4.98 / 4.68 | 4.78 / 5.69 |
| Menu glyph | 5.06 / 4.69 | 4.81 / 4.75 | 5.34 / 5.00 | 4.89 / 5.76 |
| Toast title | 11.88 / 14.07 | 12.08 / 13.77 | 11.01 / 13.52 | 10.86 / 12.61 |
| Toast close glyph | 6.06 / 7.19 | 6.26 / 7.01 | 5.39 / 6.33 | 6.56 / 7.28 |
| Sheet close glyph | 18.56 / 18.71 | 13.94 / 14.13 | 17.87 / 17.87 | 13.31 / 13.49 |

Before the fix tier 1 failed three: Liquid dark tab label 4.14, Neutral dark
tab label 3.87, Liquid light menu item 4.37. The tint went up (not the blur),
for tier 1 and the `regular` strength only: dark tab bar 62% to 74%, light
menu 74% to 80%. Tier 2 passed as it was. M6 for reference, same probe: tab
label 8.20, 5.70, 7.45, 5.74; menu item 4.63, 4.85, 4.84, 5.79.

## What ios-refraction.css overrides in ios.css (for the merge with F1)

The platform barrel loads files in name order, so this file comes before
`ios.css`; every rule starts with `:root` and the tier attribute, two steps of
weight over the ios.css rule it replaces. It overrides:

- `backdrop-filter` and `-webkit-backdrop-filter` of the tab bar, the nav and
  sheet buttons, the segmented thumb, the menu and the toast (the M6 strength
  blocks), and adds one to the current tab lens. Nothing else of those rules.
- `background-color` of the dark tab bar and of the menu, tier 1, `regular`
  only (the contrast fix above).
- It draws in `::before` of the tab bar, menu, toast, segmented thumb, current
  tab lens and held switch thumb (tier 2). It does not touch `::after`, the
  box shadows, borders or the rim, and adds no stroke or ring.
- It repeats the fallbacks for what it sets (reduced transparency, more
  contrast media and attribute, forced colours, no backdrop-filter): no
  backdrop filter and no band, so the solid paint of ios.css shows.

If the lead would rather have it load after `ios.css`, renaming the file so it
sorts after (or listing platform files in an order) would let the weight steps
go; I did not touch the generator.

## Web, Android, Studio and Desk

Computed style of every element and its `::before` and `::after` (15
properties), with and without this order's rules, platform web and android in
all four styles and ios in Studio and Desk, light and dark, settings, menu,
sheet and toast: 80 pages, zero changed values (one page was reloaded by
another agent's change while it was read and was not compared). No
`data-refraction` attribute or filter on web or android. On ios in Studio and
Desk the attribute is set (the probe does not know the style) but no part is
tracked and no filter is built.

## Checks

- `npx vitest run packages/shared/src/refraction packages/react/src/theme`:
  47 passed.
- `npm run check` (other agents running, machine loaded): tokens build, gen,
  eslint, manifests, native, docs, galleries and consumers pass. Typecheck
  failed on one line of my test (fixed, `tsc` now passes). Vitest: one
  failure is mine, `ds/token-vocabulary`: `--_ios-refraction` is read with
  `var()` in `ios-refraction.css`, and the gate wants every private property
  declared in a file under `packages/css/src/components`, which this order
  does not list. Fix for the lead: declare it on the part roots (for example
  `--_ios-refraction: ;` in TabBar.css, Button.css, DropdownMenu.css,
  Toast.css and SegmentedControl.css), or let platform files declare their
  own. The other vitest failures are not from this order: four 5s timeouts
  under load (PhoneField, RadioCard, Sidebar, ToggleGroup perf, doctor) pass
  when rerun alone, and `cli` search ranks ContextMenu over Kbd (manifests,
  untouched here). Angular: one tag-field spec (`design is already added`),
  untouched here.

## What cannot be known without a real iPhone

- Safari on iOS should never get tier 1 (no paint worklet, no client hints);
  that it then paints tier 2 as Chromium does (the band's nested backdrop
  filter inside a part with its own backdrop filter, the soft masks, the
  `-webkit-` prefix on older iOS) is the human gate of the order.
- Cost and smoothness on the phone's GPU: the numbers above come from a
  software renderer.
- Whether tier 2's frosted rim reads as thick glass at arm's length, and
  whether the light tint is still too white against the reference.
- A future Safari that paints url() in backdrop-filter (WebKit bug 245510 is
  being worked on) would still get tier 2 until the probe is widened.

## Decisions I made

1. Inward bend, measured: Chromium clamps samples outside the box.
2. Gate on two Chromium only engine objects, not the user agent; attribute on
   the document element so portaled menus and toasts are covered.
3. The attribute waits for the maps to decode, so no frame runs a filter on an
   empty map (that would shift the whole backdrop).
4. Held switch thumb kept out of tier 1 (ragged edge); tier 2 band there in
   all browsers.
5. Buttons get no band (no free pseudo element).
6. Tint raised only where a label failed, only in tier 1 and the `regular`
   strength; `clear` and `frosted` keep the M6 tints.
7. Strengths: the tiers set the same blur for all three strengths; only the
   tint differs between them, as in M6.

## G2, second pass on the glass (Liquid and Neutral, light and dark)

Order G2, after the lead looked at the F2 sheets. Proposed until the owner
signs it on a phone. Not committed by me. Files: `ios-refraction.css`,
`refraction.ts` and its test, the clear material section of `ios.css`, the
held lens rules of the Liquid and Neutral Switch recipes. `refraction-dom.ts`
needed no change.

Sheets (reference left, ours before, ours after, 4x, Liquid and Neutral,
light and dark) are in scratch only, since they hold kit and vendor crops:
`g2/sheet-p{1-switch,2-panels,3-buttons,4-tabbar}-tier{1,2}.png`. Our own
before and after crops and the 1x phone screens are in
`docs/reports/reset/G2/`.

### 1. Held switch lens

Cause of the blob: the lens lifted what it sat on (`brightness(1.12)
saturate(1.6)`, then the band `brightness(1.08) saturate(1.8)`), so the light
gray off track went white and the green went neon; Liquid also lit a white
sheen inside the lens. Now, on ios only: the lens passes the track as it is
(`saturate(1.05)`, no lift, no blur on the thumb itself: a blur there smeared
both ends of the green), the paint stays 8 percent white (the kit's lens is
the track mixed with about 10 percent white, measured: track 52 199 89, lens
70 204 104), no sheen, and the edge is a soft light along the top (80 percent
white, 2px blur), a fainter one along the bottom (45) and the soft lift; in
dark 40, 18 and a deeper lift. No ring, no stroke. The band in `::before` is
softer (`blur(* 0.75) brightness(1.04) saturate(1.15)`, 4px along the ends,
8px along the top and bottom), so the track's edge bends softly where it
passes under the rim. The rest thumb is untouched: plain white, soft shadow.

Tier: I kept tier 2 for the thumb in both tiers. The track shows through
crisp and its end softens at the rim, which is close to the kit; tier 1 on a
thumb that grows by 1.4 and stretches while held would need the map redrawn
per frame of the press (the ResizeObserver sees the layout box, not the
transform), and F2's ragged track end came from that. Not attempted again.

Verdict: Liquid and Neutral light, close (the lens over our white card reads
as a white rim round the track, as clear glass on white does; the kit shows
it on gray). Dark, close (the gray or green track shows through, the lens is
a soft light edge and a shadow).

### 2. Light menus and toast

The light panel tint of the `regular` strength went from 74 to 64 percent,
and tier 1's raise to 80 percent was taken out (dark keeps its F2 values).
At 64 percent alone the menu rows fell under 4.5:1 over the darkest demo
content, so, as the order prefers, the rows carry a faint local shade: a soft
halo in the panel's own tint that follows the letters of each label
(`text-shadow` of `material.glass-solid` at 2, 4 and 8px), light only, off
under every fallback. A row band behind the text was tried first and read as
boxes over the content at the end of each row. A heavier weight was not
used: at 17px it does not reach large text, so 4.5:1 still applies.

Verdict: light, close: the colour behind now reads through the panel (pink,
peach and green as colour, not pastel), the halo is visible only as a slight
lift round the letters. Dark, unchanged by this point, same family.

### 3. Navigation and sheet buttons

Their `::before` was Button.css's pointer glow (ios turns it off; Liquid's
sheen turns it back on for a soft fill). In tier 2 it now holds the same band
as the bar (12px, `blur(* 1.5) brightness(1.16) saturate(1.2)`); in tier 1
it is empty (opacity 0) and the bend and glare draw the edge. The tint went
from 52 to 38 percent in light and 62 to 54 percent in dark, and the buttons
take a lower saturation than the bar (1.15, not 1.6): with the lower tint
the bar's saturation turned a button over the blue card into a neon cyan
pill. The F1 rim and the shadow are unchanged; no stroke was added.

Verdict: tier 1 light, close (clear middle, the blue behind at its own hue,
bright bent upper edge); tier 2 light, close (frosted bright edge, clearer
middle); dark both tiers, close. Sheet close button: nothing coloured behind
it in the demo, so it reads as before.

### 4. A stronger bend

`refraction.ts`: the band is 0.36 of the short side, 4 to 30px (was 0.3, 4
to 24), and at the ends of the long side it is wider by half again, capped at
0.85 of the half short side, so the caps bend most, as on the reference. The
profile is `(1 - depth / band) ^ 1.6` with a deepest move of 0.6 of the band
(was a square and 0.5): the sampled point never goes backwards while
1.6 * 0.6 <= 1, and the start of the band stays smooth. Glare gain 0.55 to
0.65, glare light 0.08 to 0.10. For the 64px tab bar: band 23px on the flat
sides and 27px at the caps, deepest move 14 and 16px (was a 19px band and a
9.6px move).
Tests: band numbers, the cap band, no fold along the cap and down the top
edge (27 pass). Tier 2's band matches: 24px (was 18), `brightness(1.16)`
(was 1.1) on bars and panels, `1.12` on the lens and the segmented thumb.

At 1x (`docs/reports/reset/G2/phone-1x-tier1-liquid-{light,dark}.png`,
settings scrolled so the blue action button passes under the bar): the blue
curves up round both caps and along the top edge without zooming; nothing
folds or tears. Where the content under a cap is one flat colour (the pink
card) or the current tab's lens covers the cap, there is nothing to see bent,
as on the phone.

Verdict: tier 1, close in light and dark (the bend now reads at 1x); tier 2,
same family (a brighter, wider frosted edge, no bend: CSS cannot move
pixels).

### The bright band inside the menu edge (F1)

At 4x before G2 it showed in light as a white strip under the top rim of the
menu: the glare on a narrow band. With the wider band the glare spreads and
fades in, and in the after crops it reads as the lit upper edge of the glass,
not a line; in dark a faint lift on the upper leading arc. Kept.

### Contrast, from pixels (WCAG 2.2 1.4.3 text 4.5:1, 1.4.11 glyphs 3:1)

Same probe as F2 (six scroll positions on settings, the menu, toast and sheet
screens, 2x), with two changes: a label is hidden by its glyph colour only, so
a halo it carries stays in the backdrop, and each item is read two ways: over
the pixels under and 2px round its letters (the backdrop of the text), and,
in brackets, over its whole box (F2's way). Minimum per item, tier 1 / tier 2:

| Item | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Tab label | 7.96 / 7.96 | 6.17 / 5.46 | 7.45 / 7.69 | 5.28 / 5.74 |
| Tab label, current | 5.87 / 5.87 | 5.62 / 5.50 | 6.22 / 6.28 | 5.45 / 5.45 |
| Tab glyph | 7.96 / 7.96 | 6.00 / 5.21 | 6.52 / 7.45 | 4.75 / 4.72 |
| Tab glyph, current | 5.87 / 5.87 | 5.62 / 5.38 | 6.22 / 6.22 | 5.52 / 5.35 |
| Bar button label | 8.67 / 8.67 | 5.75 / 5.94 | 8.14 / 8.15 | 5.48 / 5.56 |
| Menu item | 4.63 / 4.62 (3.86 / 4.06) | 4.81 / 4.82 | 4.78 / 4.78 (4.03 / 4.13) | 4.90 / 5.76 |
| Menu glyph | 4.34 / 4.31 | 4.70 / 4.75 | 4.55 / 4.55 | 4.78 / 5.76 |
| Toast title | 9.08 / 12.67 | 11.73 / 13.77 | 8.69 / 12.30 | 10.86 / 12.94 |
| Toast close glyph | 5.96 / 7.06 | 6.64 / 7.01 | 5.05 / 6.10 | 6.87 / 7.47 |
| Sheet close glyph | 18.71 / 18.87 | 14.31 / 14.50 | 17.87 / 17.87 | 13.67 / 13.86 |

Every label passes over its letters. Over the whole box, the light menu item
does not (3.86 to 4.13): the label's box runs to the end of the row, and its
empty end sits over unshaded content. If the lead reads 1.4.3 by box, the
fix is the old tint (74 percent) or a row band, and I would rather keep the
halo. Box values equal the letter values elsewhere, within 0.3.

### Web, Android, Studio and Desk

Computed style (15 properties on every element and its `::before` and
`::after`, animations finished) with this order's hunks in and out (the
served CSS modules swapped for the files with only G2's hunks taken back,
other agents' hunks kept): web and android in all four styles, light and
dark, settings, menu, sheet and toast, 64 pages, zero changed values; ios in
Studio and Desk, 16 pages, zero changed values.

### What still needs a real iPhone

- Tier 2 is what Safari on iOS gets: the soft band, the halo and the lens
  have only been seen in Chromium with tier 1 switched off.
- Whether the bend at 16px on a cap reads as glass at arm's length, and its
  cost on the phone's GPU (the map is the same size; the band is wider).
- The held lens's movement: the stills are at rest in the press; the grow,
  stretch and spring were not judged frame by frame here.

### Decisions I made

1. Held lens stays on tier 2 in both tiers (above).
2. Menu rows keep 4.5:1 with a letter halo, not a whiter panel and not a
   heavier weight; measured over the letters.
3. The buttons' glow layer becomes the band on ios; Liquid's sheen on a soft
   nav button is dropped there.
4. Buttons get a lower saturation than the bar.
5. A wider band at the caps of the long side, not a wider band everywhere,
   so the middle of a 64px bar keeps a clear strip.
