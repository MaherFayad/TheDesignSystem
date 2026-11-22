# Round 2, lane F4: React fixes and built in strings

Files: `packages/react/src/**` (no demos) and `packages/shared/**`. No CSS,
no manifest, no demo was edited. No new dependency.

## Items

1. Dialog phone close. `packages/react/src/components/Dialog/Dialog.tsx`
   lines 377 to 381 and 419: on `ios` and `android` the title bar takes the
   CloseButton in its `actions` even when the style turns on `controls`, as
   Sheet does. The platform rules that hide the lights once the bar holds a
   CloseButton (`ios.css` about 3434, `android.css` 1530) now hide all
   three lights. Measured in the gallery, Desk, 393 wide: lights
   `display: none`, close 34 by 34, in light and dark, three densities,
   ltr and rtl, and on android. No new part or state: `close` is already
   in the manifest anatomy and in `contract.optionalParts`. The Dialog
   manifest was not edited. Tests: `Dialog.test.tsx`, Desk on ios and
   android has the CloseButton in the bar; Desk on web and macos has none.
2. DateField and TimeField `dir`. `DateField/segments.tsx` line 119: the
   `[data-part='input']` row carries `dir="rtl"` for an Arabic locale and
   `dir="ltr"` otherwise. Tests: `DateField.test.tsx` and
   `TimeField.test.tsx`, an en locale row inside an Arabic Theme is `ltr`
   and reads "9:41AM" in visual order; ar-SA is `rtl`.
3. Popover empty title bar. `Popover/Popover.tsx` about line 339: the
   TitleBar renders only when there is a title or a close control. The
   DatePicker popovers (`close={false}`, no title) now open with the body
   as the first part in Desk on ios (measured). Test: `Popover.test.tsx`,
   no title and no close gives no `titlebar`; a close alone keeps it.
4. Sheet title bar on ios. `Sheet/Sheet.tsx`: a context
   `SheetBarControlSize` and `barSize`; in a style's title bar on ios the
   close (`splitHeader` gained `closeSize`, `Drawer/Drawer.tsx`) and the
   confirm render at `md`, which is 44 on ios in every density. Measured,
   Desk ios, all densities, light and dark, ltr and rtl: close 44 by 44,
   confirm 44 tall (88 to 98 wide). The header form (Liquid, Neutral) is
   unchanged: close and confirm stay `sm`, measured 44 by 44 by the
   platform rules as before. The text stays 13px: that is CSS, passed on
   below. Tests: `Sheet.confirm.test.tsx`.
5. SegmentedControl pointer up. `SegmentedControl/SegmentedControl.tsx`:
   a pointer down marks the item until that pointer is released anywhere
   (window listeners for `pointerup` and `pointercancel`); the focus it
   gives meanwhile does not select. The click on release selects, through
   Radix. Keyboard focus still selects. Test: press, move off, release
   leaves the value; arrows still select; a click selects. The test fails
   on the old code.
6. Strings, one row each (Gulf modern standard Arabic, noun form):

| File | Old | New |
| --- | --- | --- |
| `SearchField/SearchField.tsx` | clear: "Clear search" in every language | Arabic "مسح البحث" |
| `SearchField/SearchField.tsx` | loading: "Searching" in every language | Arabic "البحث جار" |
| `Toast/Toast.tsx` | التنبيهات / تنبيه / إغلاق التنبيه | الإشعارات / إشعار / إغلاق الإشعار |
| `Banner/Banner.tsx` | warning: تنبيه | warning: تحذير |
| `Alert/Alert.tsx` (added, see decisions) | warning: تنبيه | warning: تحذير |
| `SharePanel/SharePanel.tsx` | تم نسخ الرابط | الرابط منسوخ |
| `TabBar/TabBar.tsx` | ، الجديد 3 | ، 3 جديدة; past 99 "، أكثر من 99 جديدة" |
| `PageShell/PageShell.tsx` | فتح التنقل | فتح القائمة |
| `packages/shared/src/wheel.ts` | ص أو م | الفترة |
| `SelectionMenu/SelectionMenu.tsx` | إجراءات أكثر | إجراءات إضافية |
| `Slider/Slider.tsx` (RangeSlider value) | 250,000 ريال - 1,500,000 ريال | من 250,000 ريال إلى 1,500,000 ريال |
| `Calendar/Calendar.tsx` | تاريخ الحجز, نوفمبر 2026 | تاريخ الحجز، نوفمبر 2026 |

Tests beside each: SearchField (English, Theme Arabic, prop wins, `lang`
still on the input), Toast (updated names), Banner (warning and notice
words), Alert (updated), SharePanel (Arabic copied toast), TabBar (count,
past 99, dot), PageShell and WheelPicker and `wheel.test.ts` (updated),
SelectionMenu (Arabic forward control), RangeSlider (Arabic range),
Calendar (root name and hidden heading, after a month change, English
unchanged).

## Decisions

- SearchField reads `lang ?? theme.lang` (anatomy rule 14) from the props
  that go to the input; the words are exported as `searchFieldLabels`.
- Alert shares the tone words with Banner (`messageTones`). I changed its
  warning word too, so a warning Alert and a warning Banner do not differ.
  Callout keeps "تنبيه" for warning: its danger word is already "تحذير".
- RangeSlider: the proposed "من 250,000 إلى 1,500,000 ريال" names the unit
  once, but each end is formatted with its unit by `formatSliderValue`.
  The value reads "من 250,000 ريال إلى 1,500,000 ريال", which Q4 F16 also
  allows. Three or more values join with "، " in Arabic. English keeps
  " - ".
- Calendar: React Aria joins the name and the month with ", " on the root
  and in its hidden h2. In Arabic the joiner after our own `aria-label` is
  rewritten in the render prop; nothing else in the string changes.
- TabBar: the count word is now "جديدة" (a plural of things); the dot
  stays "جديد".
- DateField `dir` comes from the locale, not the theme. Rule 14 says `dir`
  is stamped only from a prop; the locale is the prop here (and falls back
  to the theme language), and the row direction must follow the value,
  not the page. The lead may want a line for this in `anatomy.md`.
- Sheet sizes: only the title bar path on ios changes. android keeps `sm`
  (36): out of this order.

## Passed on

- F1, `packages/css/src/platform/ios.css`, ds.chrome, the Desk sheet title
  bar text (the controls are 44 now; text 13px):

  ```css
  [data-platform='ios'] [data-ds='sheet'] > [data-part='panel'] > [data-part='titlebar'] > [data-part='actions'] > :is([data-part='close'], [data-part='confirm']) {
    --_button-font-size: var(--ds-type-body-large-font-size);
  }
  ```

  The confirm also meets the bar's top end corner (screenshot
  `sheet-desk-ios-dark-rtl.png`): the bar needs inline end padding at least
  the corner radius, or the confirm drawn as the check alone, as the header
  form draws it (`ios.css` about 3649 to 3674).
- F8, demos: `ButtonGroup.demo.tsx` line 222 "إجراءات أكثر" to "إجراءات
  إضافية"; `TabBar.demo.tsx` line 22 "التنبيهات" to "الإشعارات" if the tab
  means notifications. No demo shows an English DateField or TimeField
  inside an Arabic page, so item 2 is proved by unit tests only.
- Lead: `NotificationCenter.tsx` lines 106 and 114 still say "التنبيهات"
  and "لا توجد تنبيهات" for notifications; not in the Q4 table, left as is.

## Commands

- `npm run typecheck`: pass.
- `npx eslint` on every touched folder: pass.
- `npx vitest run` on Dialog, DateField, TimeField, Popover, Sheet, Drawer,
  SegmentedControl, SearchField, Toast, Banner, Alert, SharePanel, TabBar,
  PageShell, SelectionMenu, Slider, RangeSlider, Calendar, WheelPicker,
  DatePicker and `packages/shared`: 67 files, 1055 tests passed.
- Contract (`DS_CONTRACT_WORKERS=1`, react, against the gallery on 5324):

CONTRACT_RESULTS

Captures and logs:
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p2/f4/`.
