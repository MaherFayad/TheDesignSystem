# Lane report: R0.14 The macos platform

Order R0.14 of `docs/plan/reset.md`. The look is **proposed**, waiting for the
owner (HUMAN GATE). Not committed.

## What I built

- `packages/css/src/platform/macos.css` (new), in two parts as ruling 16 and
  `docs/contracts/anatomy.md` ask:
  - `ds.platform` (controls, the style wins): body text 13 on the Theme
    element (`type.body-large`); 13 text on regular and large buttons, 11 on
    mini and small; Label, Input, Textarea and the Select trigger at 13 (11 at
    small), field help text at 11; checkbox corner `shape.corner.extra-small`
    (4px) with the component's mixed dash kept; radio text 13; switch 22 tall
    (`size.control.sm`) at the regular size; menu and Select list rows 22 tall
    with 13 text; tooltip text 11; dialog family body text 13.
  - `ds.chrome` (chrome, the platform wins, geometry only): title bar 28 tall
    (`size.control.md`), 8 inline padding, title 13 (`type.title-large`),
    centred; window controls lead the bar (`order`), and in the styles with no
    lights the window's own minimize, zoom and close buttons move to the
    leading end; Dialog, AlertDialog and Sheet become a card held 12px under
    the top of the window, all four corners `shape.corner.large` (16px),
    entering from above the top edge and leaving the same way; the Sheet is as
    wide as a dialog of its size, closed on all four sides, with no grabber
    (only the pointer handle is hidden; the detent button stays); titles 13;
    the close control re-centred on the smaller title.
- Control heights come from the R0.13 macos tokens with no rule here: every
  control that reads `size.control.*` gets 20, 22, 28 and 32.
- Wiring: `npm run gen` added `@import './platform/macos.css';` to
  `packages/css/src/index.css`. Nothing else was needed.
- No raw values, no colour, no font family, no material, logical properties
  only, nothing animates in this file.

## Evidence

Gallery React at 1440 by 900, `density=default`, `?platform=web` beside
`?platform=macos` (each pair scaled to 75 percent), in
`docs/reports/reset/R0.14/`:

- `<page>-<style>-<scheme>.png` for button, checkbox, window, sheet (open),
  field, switch, select and dialog (open), in Liquid and Neutral, light and
  dark: 32 images.
- `sheet-enter-web.png` and `sheet-enter-macos.png`: the Sheet enter frozen at
  0, 25, 50 and 100 percent (Liquid light). Web rises from the bottom; macos
  drops from the top.

The `/platforms` page is the phone page (web, ios and android frames) and was
not used; the order names the `/c/` pages.

### Measured on macos against the tokens (all four styles)

Tokens: body 13, controls xs 20, sm 22, md 28, lg 32, checkbox corner 4,
sheet corner 16 (`shape.corner.large`), title 13.

| Style | Density stamped | Body | Button md h | Button text | Button radius | Checkbox box, radius | Checkbox text | Input / Select h | Field label | Switch track | Title bar h | Window title | Sheet top, radii | Sheet first enter frame top | Dialog top | Dialog title |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Neutral | default (forced) | 13 | 28 | 14 | 8 | 16, 4 | 13 | 28 / 28 | 13 | 38.5 by 22 | 28 | 13 | 12, 16 and 16 | -213 | 12 | 13 |
| Liquid | default (forced) | 13 | 28 | 13 | 999 | 16, 999 | 13 | 28 / 28 | 13 | 38.5 by 22 | 28 | 13 | 12, 16 and 16 | -198 | 12 | 13 |
| Desk | default | 13 | 28 | 13 | 999 | 16, 6 | 13 | 28 / 28 | 13 | 38.5 by 22 | 28 | 13 | 12, 16 and 16 | -199 | 12 | 13 |
| Studio | default | 13 | 28 | 13 | 2 | 16, 0 | 13 | 28 / 28 | 13 | 38.5 by 22 | 28 | 13 | 12, 16 and 16 | -185 | 12 | 13 |
| Neutral | comfortable (the style's own) | 13 | **36** | 14 | 8 | 16, 4 | 13 | **36 / 36** | 13 | **56 by 32** | **36** | 13 | 12, 16 and 16 | -121 | 12 | 13 |
| Liquid | comfortable (the style's own) | 13 | **36** | 13 | 999 | 16, 999 | 13 | **36 / 36** | 13 | **56 by 32** | **36** | 13 | 12, 16 and 16 | -230 | 12 | 13 |

The same pages on `web` measure as before (button 32, title bar 36, sheet at
the bottom edge with square bottom corners, dialog centred): the web is
untouched. Window controls on macos: Desk's lights start 8px from the bar's
inline start; in Neutral, Liquid and Studio the window's zoom and close
buttons start at 8px, before the title (on web they sit at the trailing end).

## Acceptance

| Check | Result |
| --- | --- |
| Body 13px | pass, all four styles |
| md control 28px | pass at `density=default`; **fails in Neutral and Liquid at their own density** (comfortable gives 36). See "Left open" 1. |
| Checkbox square, 4 to 5px radius | pass in Neutral (4). **Not met** in Liquid (999, round), Desk (6) and Studio (0): their checkbox recipes set the radius in `ds.recipes`, which beats `ds.platform` by ruling 16. See "Left open" 2. The mixed state shows the dash in all four. |
| Lights at the inline start of the title bar | pass: Desk lights at 8px; the other styles have no lights (optional part), and their window buttons now lead at 8px |
| Sheet entering from the top of its window | pass: first frames above the viewport (-185 to -230), resting 12px under the top, all four styles; side by side with web in `sheet-*.png` and `sheet-enter-*.png` |
| Marked proposed | yes |
| `npm run check` | see "Check" |

## What needs the owner's eye

- The sheet and dialog card: 12px under the top edge, 16px corners in every
  style (Liquid's 24 and 28 and Studio's 0 and 2 give way), dialog width.
- Dialog, sheet and alert titles at 13 bold: much smaller than on the web.
- The centred window title, and the window buttons (not lights) at the leading
  end in Neutral, Liquid and Studio, kept in markup order (minimize, zoom,
  close), not the desktop's close first.
- The 22 tall switch and the 22 tall menu rows.
- Neutral's button text stays 14 (its recipe wins on controls).

## Decisions I made

1. Theme text 13 is set where `base.css` sets the system text size, so rem
   still follows the user's setting.
2. Dialog body text is in `ds.platform` (a style may change it); title size
   and every geometry and entry edge are in `ds.chrome`.
3. Lights stay physically left in right to left layouts, as `TitleBar.css`
   does today. I did not mirror them.
4. Desk's lights stay on its dialogs and sheets on macos: in Desk they are the
   only pointer close control, so hiding them would remove a way out.
5. Button press feedback and radius are left to the style.

## Left open

1. **Density (token layer, not mine).** `macos.json` has no `ds.density`
   values, so the shared comfortable block (control md 36) overrides the
   platform in Neutral and Liquid, whose default density is comfortable. The
   fix is `$extensions["ds.density"]` on the macos control sizes (as ios and
   android have), or a lead ruling that density changes macos heights. R0.13
   decision 7 made it this way.
2. **Checkbox shape against ruling 16.** The order asks for a 4 to 5px square
   in all four styles, but the anatomy contract puts Checkbox on the controls
   side, where the style wins. Either the Liquid, Desk and Studio checkbox
   recipes guard their radius with `[data-platform='web']` (R0.15 does that
   for other recipes; Checkbox.css is not in its file list), or the lead rules
   that the checkbox shape is a platform convention.
3. Moving the window buttons to the leading end puts them before the title
   visually but after it in tab order. A lasting fix renders them first in
   `Window.tsx` on macos.
4. Sheets with detents on macos keep the detent handle and transform, which
   assume a bottom edge. The gallery passes detents on ios only.
5. Not done here (desktop parts from the audit): unified toolbar, Table,
   OutlineView, SettingsWindow, alert layout with stacked actions, toast
   placement, keys on key and non key windows.
