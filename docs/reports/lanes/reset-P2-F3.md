# Round 2, lane F3: component CSS fixes

Owner files: `packages/css/src/components/*.css` and one gate in
`packages/lint`. Sheets, scripts and crops:
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p2/f3/`
(`vcmp.js` measures focused against unfocused in a 2x crop, `img/` holds the
side by side pictures).

## Findings

| Finding | Result | New value or proof |
| --- | --- | --- |
| Q5 F1 (and the class of F2, F3) Button ring lost after `--_button-shadow: none` | fixed | `Button.css` focus rule draws `inset 0 0 0 2px var(--_button-select), var(--_button-ring)`; `--_button-shadow` is no longer in a list. With `--_button-shadow: none` injected on every element in `ds.overrides`: ActionSheet Neutral light ios 2123 px at 3:1 or more (max 4.74), Neutral dark ios 2276 px (9.22), Button Liquid light ios 2323 px (4.88), Studio dark web 2068 px (19.26). Was 0 px. |
| Same class, other lists | fixed | The new gate found 8 more `none` values in lists: `Input.css` 2, `InputGroup.css` 4, `SearchField.css` 1, `Tour.css` 1 (forced colors). All now `0 0 transparent`; the SearchField part also sets `--_search-field-bloom-spread: 0px` so its look stays the same. |
| Q5 F7 DateField and TimeField segment | fixed | New `--_date-field-segment-ring` (inset 2px `color.focus.ring`). Segment against the next segment, web: Studio 19.8 and 19.26, Desk 12.3 and 16.31, Neutral 4.74 and 6.98, Liquid 4.88 and 7.7 (light and dark); 628 to 712 px at 3:1 per crop. ios: Studio light 19.8, Desk dark 16.75. Was 1.11 to 1.36. |
| Q5 F6 ColorSwatchPicker focus on the selected swatch | fixed | Grid, selected and focused: the focus ring is twice as wide, so the selection gap band turns to the ring color, then the halo. Studio light ios 768 px at 3:1 (max 19.8), Studio dark 1408 (21), Desk light 767 (18.74), Desk dark 1407 (21), Neutral light 1601 (5.17), Liquid dark 1407 (17), Liquid light web 1913 (5.41). Studio was 0 px. |
| Q5 F8 ColorArea thumb ring | fixed | `--_color-area-ring` is now the halo, the ring and a band in `color.text.bright`: one band near white, one near black, so 3:1 over any area color. Web: Desk dark 850 px (max 9.43), Liquid light 1162 (9.19), Liquid dark 600 (7.67), Neutral light 1132 (8.35), Neutral dark 392 (6.48), Studio dark 885 (9.68). With the halo alone Neutral and Liquid light stayed at 3.09. |
| Q5 F9 Tabs ring on the active tab (ColorPicker views) | fixed | New `--_tabs-ring-active`: ring, halo band, bright text band, inset. Liquid dark 2227 px at 3:1 (max 6.43, was 2.36 to 2.64), Neutral light web 2404 (9.69), Neutral dark 3637 (6.82), Desk dark 2142 (15.18), Liquid light 4717 (19.67), Studio 2304 (19.8), Desk light ios 4030 (13.55). |
| Q5 F4 TabBar current item ring in Studio ios | fixed | New `--_tab-bar-ring-active` (ring plus a halo band inside, works on an inverted pill; a style may set its own). Studio light ios 1430 px at 3:1 (max 19.8), dark 1392 (19.26); was 0 px. Liquid keeps its own rule (unchanged, 5.27); android keeps its own rule. |
| Q4 F13 (ranked 12) long placeholder cut through a letter | fixed | `Input.css`: `text-overflow: ellipsis` while `:placeholder-shown`; a typed value still scrolls. SearchField Arabic long case, ios, all four styles: computed `ellipsis`, picture `img/placeholder-neutral-ios-ar.png`. |
| Q1 F05, Q2 10 List selected mark | fixed | New `--_list-item-fg-active` (default the list ink) and `--_list-item-edge-active` (default transparent, drawn as an inner hairline on the row or on the row-glide layer), beside `--_list-item-bg-active`. Defaults unchanged: Neutral and Liquid active row color and description equal the list ink, edge transparent. Injected edge on Neutral computes `rgb(37, 99, 235) 0 0 0 1px inset`. The Studio and Desk packs already set these names. |
| Q1 F05, Q2 10 Sidebar selected mark | not a defect in the component | `--_sidebar-item-bg-active`, `-fg-active`, `-edge-active` already exist (Sidebar.css 65 to 67, swapped at 332). The mark is a recipe matter for the packs. |
| Q5 F5 (and Q2 15) SplitView pane ring clipped | fixed | `ResizablePanels.css`: a direct child of a panel that is not a system component draws its outline inside (`outline-offset: -2px`). Region "Message text", web: Studio light 16944 px at 3:1 (19.8), Liquid dark 16912 (7.7), Neutral light 16912 (4.74). Was 0 px. |

## New private properties

- `--_button-select`: the color of an on toggle's inner ring while focused.
- `--_date-field-segment-ring`
- `--_tabs-ring-active`
- `--_tab-bar-ring-active`
- `--_list-item-fg-active`, `--_list-item-edge-active`

Each is listed in its file header.

## Gate

`packages/lint/src/rules/no-none-in-shadow-list.ts` and
`packages/lint/src/gates/no-none-in-shadow-list.test.ts`, fixtures in
`packages/lint/fixtures/no-none-in-shadow-list/`. It collects every private
property read as a whole item of a `box-shadow` or `text-shadow` list (or a
`filter` or `backdrop-filter` list) in the component CSS, follows plain
aliases (`--_a: var(--_b)`), then fails when any component, platform or
recipe file sets one of them to `none`, `initial` or `unset`. It is not
added to the rule list in `packages/lint/src/index.ts` (that file holds the
per file rules; this one needs the whole component set first).

## Decisions

- Button draws its focus ring alone. The cost: `--_button-shadow` (an
  elevation or an inner edge) is not drawn while a button has keyboard focus.
  Visible where the shadow is more than the ring covers: the Liquid floating
  button's glass lift and edges, the Liquid toolbar on item highlight, the
  ios glass bar buttons, the Desk inner edges. The on toggle keeps its inner
  ring through `--_button-select`. CSS has no way to keep a style's whole
  shadow in a list and stay valid when that shadow is `none`.
- ColorArea and the active Tabs ring take a third band in every style: a two
  color ring is not enough over a mid gray indicator or a mid tone area.
- ColorSwatchPicker's focused selected cell changes in every style, Neutral
  and Liquid included: before, focus replaced the selection ring there too.

## Passed on

- `packages/css/src/platform/ios.css` (F1): the two `--_button-shadow: none`
  lines (were 721 and 1903) no longer drop the ring, so they need no change
  for focus. The gate stays green with them.
- `packages/react/src/components/Calendar/Calendar.tsx:343` (F4): the
  typecheck error below.
- `packages/css/src/components/Navbar.css`: a current link has fg and edge
  properties but no fill property; not in this order, left as is.

## Commands

CONTRACT_RESULTS
