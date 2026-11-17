# Order M9.5 (and the built parts of M9.13): iOS and Android looks for the M9 families

Status: proposed. Liquid and Neutral, light and dark, `ios` and the
`android` forms the component orders asked for. Nothing is committed.

## What changed

| File | What |
| --- | --- |
| `packages/css/src/platform/ios.css` | ds.platform: a new section "the families of orders M9.1 to M9.7" (geometry for every style, then a container block for the styles that take the platform's look in full, Liquid and Neutral); toast banner paint in the toast section. ds.chrome: banner geometry with `start` and `meta`, the alert field well, the sheet confirm. The clear material section is untouched. |
| `packages/css/src/platform/android.css` | ds.platform: the same families as Material forms. ds.chrome: the snackbar hides `start` and `meta`. |
| `packages/styles/liquid/recipes/Input.css` | ios: a plain field keeps the small corner of its focus ring (the Liquid field corner otherwise wins over the platform). |
| `packages/styles/neutral/recipes/Button.css` | ios: the stepper halves are the kit's gray capsule with no outline and no lift. |

No new recipe files: a new file needs `npm run gen` to reach the style's
generated `index.css`, which this order may not run. Every rule sits in an
existing file. Every new selector carries `[data-platform='ios']` or
`[data-platform='android']`.

## Families

Verdict by eye per scheme: same family, close, not there. Light and dark
are judged against the kit's light and dark pages; where the kit page or
the Mobbin screen has no dark sample, against the kit's dark ladders.

| Family | Request | Result | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- | --- | --- |
| Grouped field rows (M9.1) | rows 52, card on the raised surface with no edge, round gray clear button, plain corner | done | close | close | close | close |
| Grouped rows, android | plain drawn as the filled field with its indicator line | done (fill, border color and padding set as properties) | same family | same family | same family | same family |
| List sections (M9.2) | text inset, header and footer type, section gap | done; also: on ios a row with no start part starts its text at the hairline (it sat one gap later) | close | close | close | close |
| Index bar (M9.2) | no fill on the current key while not scrubbing, keys 24 by 24 | done | same family | same family | same family | same family |
| Index bar, android | fast scroll letter bubble while dragging | partly: the bubble is drawn from the key's `data-key` attribute, which the component does not write yet (request); proven with the attribute planted in a capture | close | close | n/a | n/a |
| Pop-up button (M9.3) | ghost semibold, smaller glyph | done | close | close | close | close |
| Stepper (M9.3) | Neutral as the gray filled capsule, no outline | done, and a light divider in both styles | close | close | close | close |
| Pop-up and stepper, android | text button with arrow; outlined capsule | done | same family | same family | same family | same family |
| Quick actions (M9.4) | label size, padding, gaps, the line under the row inset like the group separators | done | close | close | close | close |
| Quick actions, android | inline padding | done | same family | same family | same family | same family |
| Popover arrow (F1) | the iOS look | done: 28 by 10, no edge, the tip rounded by a stroke in the popover's fill; android hides the arrow | close | close | close | close |
| Alert with fields (M9.6) | 300 wide, the well, each label stacked above its field | done | close | close | close | close |
| Default action (M9.6) | tint capsule, white label, our darker tint in dark | already drawn by the M1 and F1 rules; checked | same family | same family | same family | same family |
| Sheet confirm (M9.6) | round tint 44 at the top trailing corner, white glyph, label visually hidden | done | close | close | close | close |
| Alert and confirm, android | text actions, outlined body fields, text confirm | done | same family | same family | same family | same family |
| Swipe actions (M9.7) | round gapped actions, label under the disc, armed cue, chevron hidden or moved, menu room | done: chevron moves with the row; armed, the edge disc runs on to the far edge as one capsule | close | close | close | close |
| Swipe actions, android | square ends at 48 | done | same family | same family | same family | same family |
| Toast banner (M9.8) | 10 and 12 side room, 8 gap, 38 picture, meta at 15 muted; tone cue; android hides both parts | done; tone cue is a small tone mark on the picture's corner (see decisions) | close | close | close | close |
| Spinner spokes | if the owner says yes to decision 1 | not done: decision 1 is not answered | | | | |

Not there anywhere. "Close" gaps that stay: the kit's popover arrow has
concave flanks (our SVG path is straight; markup); the swipe row in the kit
and the messages app rounds the shifted row's trailing end (the row parts
move one by one, so there is no box to round); the banner keeps a close
button where the toast has one.

## Decisions made

- Platform paint for Liquid and Neutral goes in the ios container block
  (`--_ios-glass`), as F1 did, instead of two recipes per family.
- Clear button disc: a mid gray (#8c8c8c from the glass backdrop tokens),
  darker than the kit's, so the disc keeps 3:1 against the card and the
  cross 3:1 on the disc. The kit's lighter disc is about 1.8:1.
- A grouped card inside a Sheet takes the alert's well (a quiet fill a step
  off the sheet), because Neutral's sheet is the raised surface itself and
  a raised card vanished on it, in light and in dark.
- Banner tone cue: a 12 mark in the tone's icon color on the picture's
  lower trailing corner, ringed in the banner fill. The suggested edge cue
  (`--_toast-edge` on the 1px start edge) does not show on a 24 corner; a
  2px edge did not show either.
- Banner text: the time is mixed toward the text color and the message is
  the text color (the kit draws its message in the text color). With the
  muted text both fell to about 3.1:1 where the light glass banner sits
  over dark content.
- Swipe armed cue: the faded actions leave the line while armed (display,
  not animated), so the capsule's round end sits by the row.
- android fast scroll: the bubble is its own layer; transforming the key
  itself would move the box the scrub measures.

## Requests

For the lead (base CSS, markup or contract):

1. SectionIndex markup: write `data-key={section.key}` on each key (or
   always an `aria-label`), so the android fast scroll bubble can show the
   letter with `attr()`. Until then no bubble is drawn.
2. List base: a row with no start part keeps the empty start column's gap,
   so its text sits one gap past the separator. ios now offsets the title
   and description; a base fix (no gap when the start column is empty)
   would let the platform rule go.
3. Popover markup: the arrow path is straight with a sharp tip; the kit's
   has concave flanks and a round tip. Radix also places the arrow from the
   SVG's 10 by 5 attributes, so a CSS size of 28 by 10 overlaps the panel by
   about 2px (hidden by the fill). A platform arrow size prop or a shaped
   path would fix both. The collision padding on a phone is 8; the kit
   keeps 16 (behavior, a prop).
4. Fieldset contract: the M9.1 text says the card edge carries 3:1 against
   the page. After the owner ruling (no dark stroke on ios) the raised card
   is 1.09 to 1.23:1 against the page; the row label names each field and
   the focus ring shows it (2.4.7). The contract sentence needs the ruling.
5. Toast recipes of Studio and Desk (their owner, every platform): Studio
   writes `--_toast-areas` without a `meta` area; Desk writes
   `--_toast-columns` without an `auto` first column for `start`. Liquid
   and Neutral write neither, so they need no change.
6. SwipeActions: if the owner wants the shifted row's rounded trailing end
   (kit and messages app), the List row needs a box that moves as one.

## Contrast, from pixels

Device scale 2, the most common pixel of the element as the background and
the pixel of highest contrast as the foreground. Lowest of Liquid and
Neutral per scheme; full lists in scratch (`m9-5/contrast*.txt`).

| Pair | Light | Dark | Needs |
| --- | --- | --- | --- |
| Field row label on card | 15.56 | 13.97 | 4.5 |
| Field value on card | 15.56 | 13.97 | 4.5 |
| Fieldset footer and list section header on page | 7.00 | 10.26 | 4.5 |
| Index key on page | 6.31 | 9.44 | 4.5 |
| Ghost select value on page | 6.31 | 9.44 | 4.5 |
| Quick action label on menu | 14.39 | 10.99 | 4.5 |
| Alert label in the well | 13.65 | 9.18 | 4.5 |
| Alert placeholder in the well | 5.32 | 5.11 | 4.5 |
| Sheet confirm white glyph on tint | 5.17 | 4.62 | 3 (glyph); 4.5 kept |
| Banner meta (time) over the page | 7.43 | 8.05 | 4.5 |
| Banner meta, dark content under the banner | 4.54 | 11.04 | 4.5 |
| Banner meta, white content under the banner | 11.46 | 7.51 | 4.5 |
| Banner message, dark content under it | 6.25 | 13.51 | 4.5 |
| Banner message, white content under it | 15.75 | 9.18 | 4.5 |
| Banner title, dark content under it | 7.09 | 15.49 | 4.5 |
| Stepper glyph on its fill | 12.41 | 13.31 | 3 |
| Clear cross on its disc | 3.36 | 5.12 | 3 |

Boundaries where a stroke was dropped (WCAG 2.2 1.4.11):

| Boundary | Liquid light | Liquid dark | Neutral light | Neutral dark | What carries it |
| --- | --- | --- | --- | --- | --- |
| Field card against page | 1.11 | 1.23 | 1.09 | 1.23 | row label and focus ring (request 4) |
| Stepper fill against page | 1.23 | 1.21 | 1.07 | 1.48 | the minus and plus glyphs, 12:1 and more |
| Clear disc against card | 3.36 | 5.07 | 3.36 | 5.07 | the disc |

Before the banner fixes the time measured 3.03 to 3.29:1 and the message
3.07 to 3.35:1 over dark content in light.

## Web unchanged

On each touched page with `platform=web` (Fieldset, SectionIndex, Select,
NumberField, DropdownMenu open, Popover open, AlertDialog open, Sheet
open, SwipeActions, Toast open, List, Input; Liquid and Neutral, light and
dark), the computed style of every element was recorded, then every CSS
rule whose selector names `data-platform` ios or android was deleted from
the page (627 rules, the two recipe rules included), and the computed
style recorded again. 48 pages: 0 elements differ on every page except
the open Toast (16 to 18 elements in two of four runs). A control run on
that page with nothing removed also differs in 18 elements: the live toast
animates between the two snapshots. Scripts:
`m9-5/tools/webab.mjs` and `webab2.mjs` in scratch, output `m9-5/webab.txt`.

## Contract runs

RESULT_CONTRACT

## Pictures

Sheets (kit, Mobbin, ours Liquid, ours Neutral; light row, dark row), in
scratch `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/m9-5/sheets/`:
grouped-field-rows, list-sections-index, pop-up-button, stepper,
menu-quick-actions, popover-arrow, alert-one-field, alert-two-fields,
alert-default-action, sheet-confirm, swipe-open, swipe-armed, banner,
banner-danger. Android and RTL captures are in `m9-5/ours/` and
`m9-5/swipe/`. Our own captures, downsized, are in
`docs/reports/reset/M9.5/` (`si-bubble-android-*` has `data-key` planted
for the picture only).

Mobbin, cited, images kept in scratch only where an earlier order saved
them: [timespent settings](https://mobbin.com/screens/3dbbba07-85fb-446a-b7f6-6716cd8b5a3e),
[Outlook contacts](https://mobbin.com/screens/7a3ef555-9ca1-43dc-b993-17b4c2f450a0),
[Telegram contacts](https://mobbin.com/screens/b1f60825-edc1-40e4-92ed-0c2d8a79fe60),
[MD Vinyl settings](https://mobbin.com/screens/36c13178-2eb0-4c24-bad1-d048d6f31ccf),
[Freeform menu](https://mobbin.com/screens/dcb93eb2-5728-4cf0-b779-6f5ae058c0b5),
[Brave alert with field](https://mobbin.com/screens/8b0cf01b-25f8-4848-a43b-0c3a52cdabf9),
[Wallet pass sheet](https://mobbin.com/screens/f3ce79fa-8661-4833-a601-04c40cc95ef5),
[The Atlantic swipe](https://mobbin.com/screens/e97a2ae1-ef94-4f8d-bdfb-f85b325a9936).
No new Mobbin search was made in this order; where scratch had no image the
sheet cell says so.
