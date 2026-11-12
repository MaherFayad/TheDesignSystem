# Review: batch 9, lanes 9B and 9C

Fresh eyes review by ds-qa of Kbd, Stat, DescriptionList, List (lane 9B) and
Card, Tile, Accordion, EmptyState (lane 9C) on branch `claude/ds-review-9`,
cut from `claude/relaxed-hypatia-7gseap`. No source file was edited. The
builders' reports were read after the findings below were formed; where a
finding repeats a point they left open, it says so.

## Verdicts

| Component | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| Kbd | pass | 0 | 3 |
| Stat | fix needed | 1 | 4 |
| DescriptionList | pass | 0 | 2 |
| List | pass | 0 | 3 |
| Card | pass | 0 | 4 |
| Tile | fix needed | 1 | 2 |
| Accordion | pass | 0 | 4 |
| EmptyState | pass | 0 | 3 |

`npm run check` is green. The contract command is green for all eight:

```text
npm run contract -- --framework react --component Kbd,Stat,DescriptionList,List,Card,Tile,Accordion,EmptyState
pass  Accordion: 29 passed, 0 failed, 15 skipped
pass  Card: 29 passed, 0 failed, 0 skipped
pass  DescriptionList: 28 passed, 0 failed, 1 skipped
pass  EmptyState: 29 passed, 0 failed, 0 skipped
pass  Kbd: 28 passed, 0 failed, 1 skipped
pass  List: 29 passed, 0 failed, 0 skipped
pass  Stat: 28 passed, 0 failed, 1 skipped
pass  Tile: 29 passed, 0 failed, 0 skipped
```

The skips are expected: Kbd, Stat and DescriptionList have no keys, and the
15 Accordion skips are the "open" target size and axe runs, which need an
overlay trigger that an accordion does not have (its demos open sections
with `defaultValue`, and those open sections are covered by the plain axe
runs).

## What holds across the batch

Checked in code and in Chromium against the React gallery, and not repeated
per component below:

- Anatomy: `data-ds` roots, own parts only, shared axis words, boolean states
  present and empty (`data-interactive=""`, `data-selected=""`), no class for
  state, `ref` as a prop with no `forwardRef`, `"use client"` on the five
  files that use hooks or context (Kbd, Stat, Card, Tile, Accordion) and not
  on the three that do not, rest props spread onto the root so `className`
  and `style` pass through.
- CSS: `@layer ds.base`, private `--_<component>-*` properties only, no
  `--ds-*` declared, every `--ds-*` name used exists in the token build (a
  script checked each one against `packages/tokens/dist/css/tokens.css`),
  logical properties only, only `transform` and `opacity` animate, a reduced
  motion block wherever something moves, a forced colors block in every
  file, the transparent outline only inside focus selectors.
- Contrast: every text node in all eight demos was measured in studio, desk
  and neutral, dark and light (288 part and combination pairs), against the
  background composited from every ancestor. The lowest is 4.72:1 (accent
  Button label inside Card and EmptyState), the lowest component text is
  5.0:1 (Stat delta in the danger tone). Nothing is below 4.5:1. Hover was
  measured too: Tile meta on the hover fill 5.0:1 (studio dark), Card
  description under the hover veil 5.87:1, List description on the hover
  fill 5.21:1 (desk light), Kbd text on the light end of the keycap gradient
  7.45:1.
- Reflow: at 320px in Neutral light, `dir=rtl`, `lang=ar`, the long Arabic
  case of each component measured a `scrollWidth` of 320.
- Targets: Card actions 28 by 28, Tile and List actions 24 by 24.

## Findings

### Kbd: pass

- note: `packages/react/src/components/Kbd/Kbd.tsx:75`. An empty string child
  renders an empty `<kbd>` with no keycap and no spoken text. Return null for
  an empty string, or add a dev warning.
- note: `packages/css/src/components/Kbd.css:139`. md is 24px, not the 32px
  default of anatomy rule 12. The lane already asked for a DECISIONS entry;
  it is a sound exception (inline text, not a control) and should be
  recorded before Tooltip and DropdownMenu start rendering Kbd.
- note: `packages/manifest/src/component/Kbd.manifest.json`. No `motion` key,
  while Card, Tile, List and EmptyState name a pattern they do not play.
  See "One convention", item 3.

Verified: in the Arabic sentence the accessibility tree reads
"اضغط Control K للبحث، و Shift Command P لقائمة الأوامر" with the English
names under `lang="en"`, and the keycaps lay out Ctrl before K left to right
inside the right to left line. Mac modifiers come out in Apple order.

### Stat: fix needed

- **blocker**: `packages/react/src/components/Stat/Stat.tsx:115`. A value of
  `NaN` renders the text "NaN" and `Infinity` renders "∞", both drawn and
  read aloud. Server render of `<Stat label="Users" value={NaN} />`:
  `<span data-part="value">NaN</span>`. The delta already guards with
  `Number.isFinite` (line 118); the value does not. Fix: treat a non finite
  number like a missing value (below), and add the case to `Stat.test.tsx`,
  which today tests NaN only for the delta (line 74).
- note: `packages/react/src/components/Stat/Stat.tsx:138`. A missing value
  (`undefined` or `null`) renders an empty value span, so a screen reader
  hears the label and then the hint with nothing between. Add an
  `emptyLabel` prop with a default per language ("No data", "لا توجد بيانات")
  for both the missing and the non finite case, the same pattern as
  `loadingLabel`.
- note: `packages/react/src/components/Stat/Stat.tsx:159` to `175`. The roll
  is hand written (`translateY(40%)`, `duration.roll`, `ease.reveal`), while
  the catalog's `numberRoll` in `packages/motion/src/patterns/number-roll.ts`
  is now merged with different values (`100%`, `ease.emphasized`) and an exit
  phase. The lane listed this as change 4 for after 1.11; 1.11 is in, so it
  is due now. See "One convention", item 1.
- note: `packages/css/src/components/Stat.css:249`. The icon sits at the far
  inline end of the label row, so in a grid of stats it lands beside the next
  stat's label and reads as that stat's icon. The builder flagged the
  distance; the screenshot shows the worse case:
  `shots/batch-9/stat-icon-beside-neighbour-label.png`. Put the icon at the
  inline start of the label, or give the row a max width.
- note: `packages/react/src/components/Stat/Stat.tsx:143`. A node delta
  without `trend` draws no icon and no trend word, so the change can be color
  free but also meaning free ("+3" in neutral). The lane left this open. Warn
  in development when `delta` is a node and `trend` is missing.

Verified: Western digits in Arabic (`ar-u-nu-latn` gives "12.4%" and
"482,300 ر.س."), a change that rounds to zero reads "No change 0%", the
trend word comes before the number ("Down 18%"), and the tone override for
"down is good" works.

### DescriptionList: pass

- note: `packages/css/src/components/DescriptionList.css:179`. The stack
  follows the viewport, not the list width, so a horizontal list in a narrow
  side panel on a desktop keeps two columns. The manifest says so and points
  to `vertical`. A container query on the list would remove the trap; record
  it for when container query tokens exist.
- note: `packages/react/src/components/DescriptionList/DescriptionList.test.tsx`.
  No test covers the phone stack or long values; the contract reflow run
  covers them in the browser, so this is coverage, not a defect.

Verified: `dl` with `div` pairs, `dt` and `dd` exposed as term and
definition, several `dd` for one term, long Latin and Arabic values wrap at
320px.

### List: pass

- note: `packages/css/src/components/List.css:145` to `154`. The title is one
  line with an ellipsis and there is no way for a sighted pointer user to read
  the rest (no Tooltip, no expand). The link keeps the full name for assistive
  tech. Say in the manifest `mistakes` that a title must be short, or let the
  title wrap to two lines like the description.
- note: `packages/react/src/components/List/List.demo.tsx:120`. "JSON" sits
  in the Arabic description without `Bidi`, against section 12 of PLAN.md
  ("Latin runs inside Arabic go through Bidi"). It renders correctly here
  because it is mid sentence, but the demo should model the rule.
- note: `packages/manifest/src/component/List.manifest.json:208`.
  `"motion": "list-stagger"`, but List plays nothing. See "One convention",
  item 3.

Verified: `ul` or `ol` with `role="list"` set again for Safari, the empty
list is a `div` with a paragraph, a disabled row link is exposed as a
disabled link and leaves the tab order, actions keep their own targets above
the stretched row link.

### Card: pass

- note: `packages/manifest/src/component/Card.manifest.json:17`. `insteadUse`
  does not name Surface or DescriptionList, the two an agent most often
  confuses with Card. `avoidWhen` says "Wrapping a whole page section only to
  draw a border around it" with no target. Add
  `"A plain box with a fill or a border and no title": "Surface"` and
  `"Facts about one thing as term and value pairs": "DescriptionList"`.
  Surface's own manifest already points back to Card.
- note: `packages/css/src/components/Card.css:439` to `442`. Selected uses
  `color.focus.ring`, so in a card that is selected and focused the two rings
  are the same color. The builder left this open as a token gap. The shapes
  differ (inset and outset), which meets 2.4.7, but `color.selected.ring`
  would make it clearer.
- note: `packages/css/src/components/Card.css:432`. The hover state writes
  `transform` itself; rule 2 says states swap properties. Set
  `--_card-transform` on the root and swap it in the state, as the
  background already does.
- note: `packages/react/src/components/Card/Card.demo.tsx:236`. "Restore it
  to open it again" names an action the card does not offer. Add a "Restore
  board" Button in the actions, or change the meta to say who can restore it.

Verified: a click in the middle of a linked card hits the `<a>` (its
`::before`), a click on the action hits the button, no link holds an
interactive descendant in any Card or Tile demo, a disabled CardLink has no
`href`, `role="link"`, `aria-disabled="true"` and `tabIndex` 0. Forced colors:
CanvasText borders, Highlight focus around the whole card.

### Tile: fix needed

- **blocker**: no `packages/styles/neutral/recipes/Tile.css`. The order's
  acceptance (1.9.10) says "in other styles it reads as a card with the
  style's separation", and Neutral's dial 4 is "1px borders and white
  space". In Neutral light the 1px gap between tiles on surface 2 is barely
  visible and the grid reads as one slab; in Neutral dark it is close to
  invisible. Screenshots: `shots/batch-9/tile-neutral-light-separation.png`,
  `shots/batch-9/tile-neutral-dark-separation.png`. The lane listed this as
  change 6. Fix: a Neutral recipe like Desk's (`--_tile-grid-gap` to a space
  token, `--_tile-grid-radius: 0`, each tile `--_tile-radius: radius.panel`,
  `--_tile-bg: color.bg.surface`, `--_tile-border-color: color.border.default`).
- note: `packages/css/src/components/TileGrid.css:21`. Under forced colors the
  grid's `overflow: hidden` with its radius cuts the CanvasText borders of the
  corner tiles and the row ends:
  `shots/batch-9/tile-forced-colors-grid-clip.png`. Set
  `--_tile-grid-radius: 0` inside the forced colors block.
- note: TileGrid is a second root with no manifest and no gallery route (the
  lane's change 5). An agent reading the manifests cannot find it. Either a
  `TileGrid.manifest.json` or a `parts`-like entry in Tile's manifest.

Verified: the gap is 1px and shows the parent, Desk turns tiles into
separate cards through private properties only, focus is a double ring
inside the tile that never matches the single selected ring, the title
clamps at two lines while the link keeps the full name.

### Accordion: pass

- note: `packages/css/src/components/Accordion.css:268` to `277`. The open
  motion is component keyframes (`translateY(-space.xs)`, opacity,
  `duration.medium`, `ease.out`) while the catalog's `accordionHeight` is
  `scaleY` on a clip, `duration.slow`, `ease.standard`. Both are transform
  and opacity only, so the order's rule holds, but the manifest's
  `"motion": "accordion-height"` names values the component does not use.
  See "One convention", item 1.
- note: `packages/manifest/src/component/Accordion.manifest.json:20`.
  "One detail to show or hide": "Collapsible" points to a component that no
  batch builds. Point to the native `details` element through a system
  Disclosure once it exists, or drop the line.
- note: `packages/manifest/src/component/Accordion.manifest.json:111`. The
  role says each trigger has `aria-controls`; Radix sets it only while the
  section is open (closed triggers measured `aria-controls=null`). This is
  allowed by the APG pattern; correct the sentence.
- note: `packages/css/src/components/Accordion.css:292`. Under forced colors
  every trigger draws the Button's pill border, so a divided accordion shows a
  stack of pills plus its divider lines:
  `shots/batch-9/accordion-forced-colors-trigger-borders.png`. Set the Button's
  forced colors border to transparent for `[data-part='trigger']` at rest and
  keep the Highlight focus outline.

Verified in Chromium: headings are `h3` by default and follow
`headingLevel`; Tab, ArrowDown, ArrowUp, Home and End move between triggers;
a disabled item's trigger has `aria-disabled="true"`, no native `disabled`,
`tabIndex` 0, and stays closed; closed content keeps only an empty wrapper
with `hidden`, so it is out of the accessibility tree; an open section is a
`region` labelled by its trigger. The open animation is
`ds-accordion-open 0.14s` and `none` under reduced motion. Closing removed
the content in the same frame (0ms) with and without reduced motion: Radix
does not wait on `animationend`, because the closed state has no animation.

### EmptyState: pass

- note: `packages/react/src/components/EmptyState/EmptyState.demo.tsx:55`.
  "press C" should render the key with Kbd, which this batch built for that
  purpose.
- note: `packages/react/src/components/EmptyState/EmptyState.tsx:31` and
  `33`. EmptyState takes the body as `children` and defaults the heading to
  3; ErrorState, which the order says shares the anatomy, takes `body` as a
  prop and defaults to 2 (`ErrorState.tsx:63`, `97`). See "One convention",
  item 2.
- note: `packages/manifest/src/component/EmptyState.manifest.json:154`.
  `"motion": "fade-rise"` with no motion in the component. See "One
  convention", item 3.

Copy checks: the first action is a verb plus a noun ("Create board",
"Clear search", "Invite people"), the body names the mechanism ("drag a
file onto this page"), Arabic actions are noun form ("إنشاء لوحة",
"استيراد ملف", "دعوة الفريق") in white Saudi dialect with no diacritics.

## Copy across the batch

English is sentence case, buttons are a verb plus a noun, and no demo uses
OK, Continue, Confirm or Yes. Arabic reads as natural white Saudi dialect
("لو تبي", "ما فيه لوحات", "وبيرسلون لك"), labels are nouns ("حذف رسالة
سارة القحطاني", "خيارات مراجعة الدليل"), digits are Western, no diacritics.
No em dash or en dash in any file of the batch.

## The look in Neutral

Screenshots of every demo in Neutral light, Neutral dark and Neutral light
RTL were read. Apart from Tile (blocker above), the components take Neutral's
tokens cleanly: Card outline, soft and solid are distinct, Accordion's card
variant reads as separate sections, Stat and DescriptionList follow the
muted text and type scale, Kbd keeps its keycap tokens.

- note: `apps/gallery-react/src/gallery.css:66`. In Neutral the titles of
  linked Cards and Tiles are blue, from the gallery's own
  `[data-gallery='root'] a:not([data-ds])` rule in `ds.overrides`, which beats
  the component's `color: inherit` in `ds.base`. Studio and Desk hide it
  because their `color.text.link` is close to the text color.
  `shots/batch-9/card-neutral-gallery-link-color.png`. Not a component
  defect, but the gallery shows Neutral wrong. Exclude `[data-part='link']`
  from that rule.

## Tests

The unit tests test behavior, not markup snapshots: Kbd covers platforms,
spoken names, node keycaps and decorative; Stat covers trend from the shown
value, the Arabic trend words, loading and the roll on change; List covers
the Tab order through row links and actions; Accordion covers single and
multiple, the arrow keys, Home and End and the disabled trigger; Card covers
the disabled link and asserts no nested interactive element in the demo.
Gaps: a non finite Stat value (the blocker), the DescriptionList stack, the
Desk Tile recipe and forced colors are untested.

## One convention

1. **Motion comes from the catalog.** Stat and Accordion animate with their
   own keyframes and values, while `packages/motion` now holds
   `number-roll` and `accordion-height` with different values. Recommendation:
   a component that names a pattern plays it through that pattern's helper
   (Stat calls `numberRoll.animate`, Accordion plays `accordionHeight` on an
   inner clip from the content's open state, or the pattern exports a CSS
   keyframes string the component file can use), so a style preset in
   `packages/styles/<id>/motion.ts` changes every use at once.
2. **Heading level prop.** Card and Tile call it `level` on the title part,
   Accordion and EmptyState call it `headingLevel` on the root, ErrorState
   calls it `headingLevel` with default 2 while the others default to 3, and
   the manifests type it as `"number"` (Accordion) or a list of strings
   (the rest). Recommendation: `headingLevel` everywhere, default 3, manifest
   type `["2", "3", "4", "5", "6"]`. On a title part (CardTitle, TileTitle)
   keep the same name.
3. **Manifest `motion` for a component that does not move.** Kbd and
   DescriptionList omit the key; List, Card, Tile and EmptyState name a
   pattern that only a parent could play. Recommendation: `motion` names only
   what the component itself plays; a static component omits it, and an
   entrance a parent should use goes in `a11y.notes` or a new
   `motionHint` field.
4. **Body as children or as a prop.** EmptyState takes children, ErrorState
   takes `body`. Recommendation: children for EmptyState and ErrorState
   alike, since both may hold a sentence with a link or a Kbd.
5. **Selected ring color.** Card and Tile both use `color.focus.ring` for
   selected. Recommendation: one token `color.selected.ring` for Card, Tile,
   RadioCard and ListBox, so focus and selection can differ in color as well
   as shape.
6. **A visually hidden helper.** Kbd (`[data-part='spoken']`) and Stat
   (`[data-trend-label]`, `[data-loading-label]`) each write the same seven
   line visually hidden block. Recommendation: one shared rule in
   `packages/css/src/base.css` on `[data-visually-hidden]`, used by both.

## Not a finding, recorded for the lead

- The lanes could not read GoBanana. Kbd, Stat, List, Tile, Accordion and
  EmptyState follow Figma-Killer-2, the dials table and the tokens. A pass
  against GoBanana is still owed before gate 1.
- Lane 9B asked for `data-trend` and `data-variant` to be valued states in the
  contract suite (`packages/contract-tests/src/lib.ts:58`). Until then Stat's
  `states` cannot list `data-trend`.

## How this was checked

- `npm install`, `npm run check`: green.
- `npm run contract -- --framework react --component Kbd,Stat,DescriptionList,List,Card,Tile,Accordion,EmptyState`: green, results above.
- `npx tsx packages/tokens/build.ts`, then every `--ds-*` name in the nine
  CSS files (with TileGrid and the Desk Tile recipe) looked up in
  `tokens.css`: all exist.
- React gallery on port 5173, Chromium headless through Playwright from node
  scripts in the scratchpad:
  - full page screenshots of all eight demos in neutral light, neutral dark,
    neutral light RTL Arabic, studio dark and desk light;
  - text contrast of every part in 3 styles by 2 schemes, plus hover;
  - Accordion keyboard, headings, disabled trigger, closed content, open and
    close timing with and without emulated reduced motion;
  - Card and Tile hit testing of the stretched link and the actions, nested
    interactive check, disabled link attributes, target sizes;
  - accessibility tree snapshots of Kbd (English and Arabic), Stat, List and
    DescriptionList;
  - forced colors (`forcedColors: 'active'`) screenshots of Card, Tile,
    Accordion, Kbd, Stat and List;
  - 320px width, RTL Arabic, long Arabic case of each component.
- Server render (`react-dom/server`) of Stat with NaN, Infinity, missing,
  null, a NaN delta, a near zero delta, a node delta and compact notation, and
  of Kbd with an empty string, a node and `decorative`.
