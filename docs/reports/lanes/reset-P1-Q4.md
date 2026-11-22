# P1 Q4 Arabic and right to left audit of the mobile set

Order: `docs/plan/reset-mobile.md`, section "Rounds to finish Studio and Desk
on mobile", round 1, lane Q4. Audit only: no file changed but this report.

## How it was checked

- Every component of the mobile set (32 pages) at
  `/c/<kebab>?style=<style>&scheme=light&platform=ios&dir=rtl&lang=ar&chrome=0`,
  390 by 844, in `studio`, `desk`, `neutral` and `liquid` (128 pages).
- Every screen under `/screens/ios/<id>/screen` (10 screens) in the same
  four styles (40 pages).
- Spot checks on `platform=web` at 1280 by 800: Sheet, Dialog, TabBar,
  DatePicker, Slider, Navbar, Pager, SegmentedControl, SplitView, Toast, in
  all four styles (40 pages).
- A DOM probe on each page: Eastern digits in text and in `aria-label`,
  `aria-valuetext`; diacritics; letter spacing on Arabic text; uppercase on
  Arabic nodes; clipped or truncated Arabic (scroll size against client
  size, with the element's overflow and text overflow); line height under
  1.25 of the font size on Arabic; physical `text-align` in rtl; every icon
  with its computed mirror; English words left inside the Arabic demo
  blocks (`[data-demo=content][lang=ar]`) and on the screens.
- Overlays: every trigger with `aria-haspopup` or `aria-expanded` was
  opened, first the first 14 on each page, then every trigger whose label is
  Arabic, in Studio and Liquid; on the screens in all four styles. For each
  open layer: computed direction, nearest `lang`, English words inside.
- Keyboard: ArrowRight and ArrowLeft on the Arabic instance of Slider,
  RangeSlider, ColorSlider, ColorArea, SegmentedControl, TabBar, Pager,
  WheelPicker and Calendar, with the thumb or focus position measured
  before and after.
- Copy: every Arabic string in the mobile set's demos and components, in
  `packages/shared/src` and in the screens, read against the rules in
  `AGENTS.md` and `/home/user/gobanana/docs/arabic-copy-cookbook.md`.
- Every finding below was measured again on the current tree, after the
  other lanes' edits of the hour, before it went in.

Pictures: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/q4/`
(`f_*.png` are the crops cited below; `mont/` has a contact sheet per
component with the four styles side by side; `ov/` the Arabic overlays;
`scr/` the screens; `web/` the web spot checks).

## What passed (no finding)

- Digits: no Eastern digit anywhere, in text or in names, in 208 pages and
  every opened overlay. Hijri dates, prices, times, percentages and counts
  all use Western digits.
- Diacritics: none in any built in or demo string.
- Letter spacing: no Arabic node has a letter spacing other than normal or
  0 in any style.
- Overlays keep `dir` and `lang`: every Arabic trigger opened a layer with
  computed `rtl` and `lang=ar` (ActionSheet, AlertDialog, DatePicker
  popovers, List menus and alerts, SharePanel, Navbar menu, PageShell
  drawer, Sheet, Dialog, SwipeActions menu, and every overlay on the ten
  screens). The AlertDialog `dir=ltr` seen in Z1 (C6.1) is the demo's
  English case, which sits in a `Theme lang="en"` on purpose
  (`AlertDialog.demo.tsx` line 261); the Arabic alerts are `rtl ar`.
- Mirroring: chevron back and forward, arrow back, send, list, panel and
  undo glyphs flip; check, clock, play, pause, next track, eyedropper,
  bell and grid do not. Calendar arrows: previous at the right pointing
  right, next at its left pointing left, in all styles
  (`f_ok_calendar_chevrons_neutral.png`). Navbar and SplitView back point
  right at the start. List disclosure chevrons point left at the end.
  Slider and RangeSlider fill from the right. ColorSlider and the opacity
  slider in ColorPicker mirror. Pager page 1 sits at the right, page 2 to
  its left; the active dot is the right one. SegmentedControl and TabBar
  put item 1 at the right. Switch on: thumb at the left. Stepper: minus at
  the right. The SectionIndex column sits at the left and the TabBar side
  column at the left, both the inline end as their docs say.
- Keyboard follows the visual direction: Slider ArrowRight moves the
  thumb right and lowers the value (12,500 to 12,000); RangeSlider,
  ColorSlider (214 to 213) and ColorArea (60 to 59) the same; Calendar
  ArrowRight goes to the day on the right (17 to 16); WheelPicker
  ArrowLeft moves from hours to minutes (the column on the left);
  SegmentedControl ArrowLeft moves to the item on the left and ArrowRight
  from the first item wraps to the last; TabBar the same; Pager ArrowLeft
  shows page 2, which slides in from the left.
- Bidi in the screens: phone numbers sit in `<bdi dir="ltr">` and read
  "+966 11 000 0000." with the full stop at the sentence end; times "7:30 م",
  durations "5:02", prices "240 ر.س" and the range "250,000 ريال - 1,500,000
  ريال" read in the right order. URLs and pass numbers stay left to right.

## Findings

Severity: blocker, major, minor. "All" means all four styles.

### F1. SearchField: the clear button and the loading status are English in Arabic

- Axes: all styles, ios and web, Arabic; every SearchField that does not
  pass its own words (the TabBar search field, the screens rely on the
  callers).
- What: `clearLabel` and `loadingLabel` default to English with no Arabic
  default. In the Arabic TabBar case the clear button reads
  `aria-label="Clear search"`. The SearchField demo hides it by passing
  "مسح البحث" by hand. Every other component in the set picks Arabic from
  the Theme language.
- Current: "Clear search", "Searching". Corrected: "مسح البحث", "البحث جار"
  (built in, Gulf modern standard; "جاري" is the colloquial form).
- Cause: `packages/react/src/components/SearchField/SearchField.tsx` lines 88
  and 90.
- Severity: major.
- Picture: `tabbar_liquid_ar.png` (the field with the clear button in the
  Arabic block).

### F2. One word, three meanings: "تنبيه" for warning, notification and alert

- Axes: all, Arabic, screen reader names.
- What: Banner names its warning tone "تنبيه", Toast names every toast
  "تنبيه" and its region "التنبيهات", AlertDialog names its controls "أزرار
  التنبيه". A reader hears the same word for a warning banner, a plain
  notification and an alert. Banner already uses "إشعار" for a notice.
- Current and corrected:
  - Toast `region` "التنبيهات" to "الإشعارات"; `toast` "تنبيه" to "إشعار";
    `close` "إغلاق التنبيه" to "إغلاق الإشعار".
  - Banner warning tone "تنبيه" to "تحذير".
  - AlertDialog keeps "التنبيه".
- Cause: `packages/react/src/components/Toast/Toast.tsx` line 88;
  `packages/react/src/components/Banner/Banner.tsx` line 43.
- Severity: major.
- Picture: none (names only).

### F3. "تم" plus a noun in built in and screen confirmations

- Axes: all, Arabic; SharePanel built in, SelectionMenu demo, 33 toast and
  status strings in the screens.
- What: "تم X" is the English passive carried over (cookbook 4.8). Built in
  strings should be nominal; demo strings should be the white dialect
  form.
- Current and corrected (built in): SharePanel "تم نسخ الرابط" to "الرابط
  منسوخ".
- Current and corrected (demo, white dialect): see the string table: for
  example "تم حذف الروتين" to "انحذف الروتين", "تمت أرشفة المقال" to "المقال
  في الأرشيف", "تم نسخ رقم البطاقة" to "رقم البطاقة منسوخ".
- Cause: `packages/react/src/components/SharePanel/SharePanel.tsx` line 84;
  `packages/react/src/components/SelectionMenu/SelectionMenu.demo.tsx` lines
  39 and 40; `apps/gallery-react/src/ios-screens/fitness-plan.tsx` lines 144,
  156 to 161, 163; `inbox-swipe.tsx` lines 159, 162 to 168;
  `notes-edit.tsx` lines 154 to 157; `pass-detail.tsx` lines 138, 150, 152,
  164 to 167; `share-flow.tsx` lines 123 to 126; `booking.tsx` line 142;
  `music-library.tsx` line 157.
- Severity: major (built in), minor (demo).
- Picture: none (copy).

### F4. Latin comma inside Arabic: the pass sheet and the pass code name

- Axes: all styles, screen pass-detail, Arabic.
- What: the sheet row reads "3 ديسمبر, 6:30 م" and the pass code image is
  named "رمز الدخول, NDD-2026-0412". Every other join in the screens uses
  "، " in Arabic.
- Corrected: "3 ديسمبر، 6:30 م"; "رمز الدخول، NDD-2026-0412" (pick the comma
  by language as `booking.tsx` line 184 does).
- Cause: `apps/gallery-react/src/ios-screens/pass-detail.tsx` lines 212 and
  296.
- Severity: minor.
- Picture: `f_pass_detail_comma.png`.

### F5. Calendar: the hidden heading joins the name and the month with a Latin comma

- Axes: all, Arabic, screen reader; standalone Calendar with an Arabic
  `aria-label`.
- What: React Aria builds the hidden heading as "تاريخ الحجز, نوفمبر 2026"
  and "تاريخ الموعد, جمادى الآخرة 1448 هـ". DatePicker avoids this by not
  naming its Calendar (`DatePicker.tsx` lines 30 to 33); Calendar passes the
  name straight through.
- Corrected: "تاريخ الحجز، نوفمبر 2026".
- Cause: `packages/react/src/components/Calendar/Calendar.tsx` line 318
  (the `aria-label` handed to React Aria).
- Severity: minor.
- Picture: none (hidden heading).

### F6. Sheet demo: the email field is not an email field, so it reads right to left

- Axes: all, Arabic, ios and web.
- What: the "الدعوة بالإيميل" field is a plain `Input`; its placeholder
  "name@example.com" sits at the right and an address typed in follows the
  page direction, so "name@example.com" can reorder around the "@" and ".".
  `Input.css` lines 326 to 336 already set email, url and tel fields left to
  right in rtl; the demo does not ask for one.
- Corrected: `type="email"` on the Input; label "الدعوة بالبريد الإلكتروني"
  (see F9).
- Cause: `packages/react/src/components/Sheet/Sheet.demo.tsx` lines 69 and 70.
- Severity: minor.
- Picture: `f_sheet_email_placeholder.png`.

### F7. TabBar: the Arabic badge name reads "الجديد 3"

- Axes: all, Arabic, screen reader.
- What: a tab with a count is named "الوارد، الجديد 3": "the new 3", English
  order kept with an article. The dot case "الوارد، جديد" is fine.
- Corrected: "الوارد، 3 جديدة" for a count; for 99+ "الوارد، أكثر من 99
  جديدة".
- Cause: `packages/react/src/components/TabBar/TabBar.tsx` line 242.
- Severity: minor.
- Picture: none (hidden status).

### F8. Inbox screen: "لـ" glued to a title that starts with "ال"

- Axes: all, screen inbox-swipe, Arabic, button names.
- What: `خيارات إضافية لـ${title}` gives "خيارات إضافية لـالتحميص الفاتح
  والغامق وما بينهما" and "لـكيف تحافظ...". "لـ" before "ال" must merge
  ("للتحميص"), and before a verb it does not read at all.
- Corrected: `خيارات إضافية للمقال «${title}»`.
- Cause: `apps/gallery-react/src/ios-screens/inbox-swipe.tsx` line 156.
- Severity: minor.
- Picture: none (names).

### F9. English written in Arabic letters: "الإيميل"

- Axes: all, Arabic demo copy.
- What: "الإيميل" is English in Arabic letters. The screens already say
  "البريد" (`settings.tsx` line 88, `pass-detail.tsx` line 170), so one
  concept has two words.
- Current and corrected: Stepper "الإيميل وكلمة المرور" to "البريد
  وكلمة المرور"; "الإيميل وكلمة المرور وطريقة الدخول لكل شخص" to "البريد
  وكلمة المرور وطريقة الدخول لكل شخص"; Sheet "الدعوة بالإيميل" to "الدعوة
  بالبريد".
- Cause: `packages/react/src/components/Stepper/Stepper.demo.tsx` lines 16
  and 145; `packages/react/src/components/Sheet/Sheet.demo.tsx` line 69.
- Severity: minor.
- Picture: `mont/stepper_p0.png`.

### F10. Built in labels that read as literal translations

- Axes: all, Arabic, names.
- What and corrected:
  - PageShell `menu` "فتح التنقل" ("open navigation") to "فتح القائمة".
  - WheelPicker time column `dayPeriod` "ص أو م" (the English "AM or PM")
    to "الفترة"; the TimeField demo hint already calls it "الفترة".
  - SelectionMenu `more` "إجراءات أكثر" to "إجراءات إضافية", in line with
    "خيارات إضافية" used for "More options" across the set.
- Cause: `packages/react/src/components/PageShell/PageShell.tsx` line 62;
  `packages/shared/src/wheel.ts` line 269;
  `packages/react/src/components/SelectionMenu/SelectionMenu.tsx` line 141.
- Severity: minor.
- Picture: none (names).

### F11. Demo copy register: one Sheet case is formal, its twin is dialect

- Axes: all, Arabic demo copy.
- What: Sheet line 67 says "اللي عندهم الرابط يقدرون يشوفون اللوحة." (white
  dialect, right); line 373 says the same thing in formal Arabic "يمكن لمن
  لديه الرابط عرض اللوحة.", and line 374 "اسحب المقبض أو استخدم مفاتيح الأسهم
  لتغيير الارتفاع." SplitView says "اختار رسالة" where white dialect writes
  "اختر".
- Corrected: "اللي عندهم الرابط يقدرون يشوفون اللوحة."; "اسحب المقبض أو
  استخدم الأسهم عشان تغير الارتفاع."; "ما فيه رسالة مختارة. اختر رسالة من
  القائمة."
- Cause: `packages/react/src/components/Sheet/Sheet.demo.tsx` lines 373 and
  374; `packages/react/src/components/SplitView/SplitView.demo.tsx` line 50.
- Severity: minor.
- Picture: none (copy).

### F12. Demo pages keep English copy under `lang=ar`

- Axes: all, ios and web, `lang=ar`.
- What: with `lang=ar` in the URL, most demo cases still show English copy
  (only the `long-arabic` cases and a few demos switch). Built in words turn
  Arabic around them, so a page mixes "Account، مكتملة" (Stepper), an Arabic
  "القائمة" button that opens an English menu (Navbar, PageShell), and
  English sentences in an rtl block whose full stop jumps to the start
  (".The hero directions are ready.", SplitView on web). 26 of the 32 demos
  read no language. This is a gallery matter, not a component defect, but
  it hides how a Latin sentence behaves inside an Arabic layout: no slot in
  List, Toast or SplitView sets `dir="auto"` on user text, so a real English
  message preview in an Arabic app would show the same jumped stop.
- Corrected: either every demo reads `useTheme().lang` and shows its `ar`
  copy, or the English cases sit in `<DemoCase lang="en">` as AlertDialog
  does. For the components: `dir="auto"` on the title and description
  slots that carry user content (List item, Toast, SplitView row).
- Cause: `packages/react/src/demo/index.tsx` lines 61 to 70 (the case
  wrapper only nests a Theme when `lang` is set); the demos of the set.
- Severity: minor.
- Picture: `f_web_splitview_latin_period.png`.

### F13. SearchField: a long Arabic placeholder is cut through a letter

- Axes: neutral and liquid, ios, Arabic long text case.
- What: "ابحث في كل الملفات والمجلدات واللوحات المشتركة معك" is cut inside
  "المشتركة" with no ellipsis; the last visible glyph is half a kaf, which
  reads like a stray mark. Studio fits it at its smaller size.
- Cause: the input control sets `text-overflow: clip`
  (`packages/css/src/components/Input.css` line 222), which the
  SearchField control inherits; `ellipsis` there would end the placeholder
  on a whole word mark.
- Severity: minor.
- Picture: `f_searchfield_long_cut_neutral.png`.

### F14. ColorSlider label is set to uppercase on ios

- Axes: all styles, ios.
- What: `text-transform: uppercase` on the ColorSlider label and the
  ColorPicker opacity label. It does nothing to Arabic, but it breaks the
  sentence case rule for the English label ("HUE", "OPACITY"), and the lane
  brief asks for no uppercase transforms.
- Cause: `packages/css/src/platform/ios.css` lines 2659 to 2663.
- Severity: minor.
- Picture: `mont/color-slider_p0.png`.

### F15. Fitness and share screens: a Latin letter as the day name

- Axes: all, screens fitness-plan and share-flow, Arabic.
- What: the routine title is "الجزء العلوي، اليوم A" (and "اليوم B"); in a
  34 point title the "A" sits at the left end, a Latin letter where an
  Arabic reader expects a word. Seat letters ("الصف F") stay Latin, they are
  printed on the seat.
- Corrected: "الجزء العلوي، اليوم الأول"; "الجزء السفلي، اليوم الثاني".
- Cause: `apps/gallery-react/src/ios-screens/kit.tsx` lines 381 and 393.
- Severity: minor.
- Picture: `mont/scr_liquid_1.png`.

### F16. RangeSlider value joins the two ends with a hyphen in Arabic

- Axes: all, Arabic.
- What: "250,000 ريال - 1,500,000 ريال". It reads in the right order, but
  Arabic writes a range with words.
- Corrected: "من 250,000 إلى 1,500,000 ريال" (or "250,000 إلى 1,500,000
  ريال" when the unit is shown once).
- Cause: `packages/react/src/components/Slider/Slider.tsx` line 320.
- Severity: minor.
- Picture: `mont/range-slider_p0.png`.

### Seen in passing, not Arabic specific (for Q1)

- Studio Toast: the 38 px avatar sits in a 16 px start slot, sticks out
  past the capsule and covers 3 px of the title, the same in English and
  Arabic (`f_toast_studio_avatar_overlap.png`; measured: start part 16 px
  wide, fallback 38 px, title overlapped by 3 px).
- Desk DatePicker chips: content 38 px in a 32 px button with overflow
  clip, the same in English (20.4 px line) and Arabic (22.95 px line); no
  glyph is visibly cut.
- Navbar brand line height 24 px under a 34 px title (Link.css line 275):
  the known shared item E2.3; on the current tree the Arabic titles no
  longer overlap in the pictures.

## Top 15, ranked

1. F1 SearchField clear and loading names are English in Arabic (major).
2. F2 "تنبيه" used for warning, notification and alert (major).
3. F3 SharePanel built in "تم نسخ الرابط" (major); "تم" in 33 screen
   confirmations (minor).
4. F12 Demos keep English under `lang=ar`; no `dir="auto"` on user text
   slots (minor, wide reach).
5. F5 Calendar hidden heading with a Latin comma (minor).
6. F10 PageShell "فتح التنقل", WheelPicker "ص أو م", SelectionMenu "إجراءات
   أكثر" (minor).
7. F7 TabBar badge name "الجديد 3" (minor).
8. F4 pass-detail Latin commas (minor).
9. F6 Sheet email field not typed as email, reads rtl (minor).
10. F8 "لـالتحميص" in inbox-swipe names (minor).
11. F9 "الإيميل" against "البريد" (minor).
12. F13 SearchField placeholder cut through a letter in Neutral and Liquid
    (minor).
13. F11 Register drift in Sheet and SplitView demos (minor).
14. F15 "اليوم A" in the fitness titles (minor).
15. F16 RangeSlider hyphen range, and F14 uppercase on the ColorSlider label
    (minor).

Counts: blocker 0, major 3 (F1, F2, F3 built in), minor 14 (F3 demo part
counted with F3), 3 cross lane notes.

## String fix table

| File | Line | Current | Proposed |
| --- | --- | --- | --- |
| packages/react/src/components/SearchField/SearchField.tsx | 88 | Clear search (no Arabic) | مسح البحث |
| packages/react/src/components/SearchField/SearchField.tsx | 90 | Searching (no Arabic) | البحث جار |
| packages/react/src/components/Toast/Toast.tsx | 88 | التنبيهات / تنبيه / إغلاق التنبيه | الإشعارات / إشعار / إغلاق الإشعار |
| packages/react/src/components/Banner/Banner.tsx | 43 | warning: تنبيه | warning: تحذير |
| packages/react/src/components/SharePanel/SharePanel.tsx | 84 | تم نسخ الرابط | الرابط منسوخ |
| packages/react/src/components/TabBar/TabBar.tsx | 242 | ، الجديد 3 | ، 3 جديدة |
| packages/react/src/components/PageShell/PageShell.tsx | 62 | فتح التنقل | فتح القائمة |
| packages/shared/src/wheel.ts | 269 | ص أو م | الفترة |
| packages/react/src/components/SelectionMenu/SelectionMenu.tsx | 141 | إجراءات أكثر | إجراءات إضافية |
| packages/react/src/components/Slider/Slider.tsx | 320 | 250,000 ريال - 1,500,000 ريال | من 250,000 إلى 1,500,000 ريال |
| packages/react/src/components/Calendar/Calendar.tsx | 318 | تاريخ الحجز, نوفمبر 2026 | تاريخ الحجز، نوفمبر 2026 |
| packages/react/src/components/SelectionMenu/SelectionMenu.demo.tsx | 39 | تم النسخ: ... | انتسخ: ... |
| packages/react/src/components/SelectionMenu/SelectionMenu.demo.tsx | 40 | ...: تم | ...: خلاص |
| packages/react/src/components/Stepper/Stepper.demo.tsx | 16 | الإيميل وكلمة المرور | البريد وكلمة المرور |
| packages/react/src/components/Stepper/Stepper.demo.tsx | 145 | الإيميل وكلمة المرور وطريقة الدخول لكل شخص | البريد وكلمة المرور وطريقة الدخول لكل شخص |
| packages/react/src/components/Sheet/Sheet.demo.tsx | 69 | الدعوة بالإيميل | الدعوة بالبريد (and type="email" on line 70) |
| packages/react/src/components/Sheet/Sheet.demo.tsx | 373 | يمكن لمن لديه الرابط عرض اللوحة. | اللي عندهم الرابط يقدرون يشوفون اللوحة. |
| packages/react/src/components/Sheet/Sheet.demo.tsx | 374 | اسحب المقبض أو استخدم مفاتيح الأسهم لتغيير الارتفاع. | اسحب المقبض أو استخدم الأسهم عشان تغير الارتفاع. |
| packages/react/src/components/SplitView/SplitView.demo.tsx | 50 | اختار رسالة من القائمة. | اختر رسالة من القائمة. |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 212 | رمز الدخول, NDD-2026-0412 | رمز الدخول، NDD-2026-0412 |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 296 | 3 ديسمبر, 6:30 م | 3 ديسمبر، 6:30 م |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 138 | تم حفظ إعدادات البطاقة | إعدادات البطاقة محفوظة |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 150 | تمت إزالة البطاقة | انشالت البطاقة |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 152 | تم استرجاع البطاقة | رجعت البطاقة |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 164 | تم إرسال البطاقة لـ{name} | البطاقة وصلت {name} |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 165 | تمت مشاركة البطاقة عبر {label} | البطاقة انرسلت عبر {label} |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 166 | تمت الإضافة للتقويم | انضافت للتقويم |
| apps/gallery-react/src/ios-screens/pass-detail.tsx | 167 | تم نسخ رقم البطاقة | رقم البطاقة منسوخ |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 156 | خيارات إضافية لـ{title} | خيارات إضافية للمقال «{title}» |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 159 | تمت أرشفة المقال | المقال في الأرشيف |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 162 | تم حذف المقال | انحذف المقال |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 163 | تمت الإضافة للمفضلة | انضاف للمفضلة |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 164 | تمت الإزالة من المفضلة | انشال من المفضلة |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 165 | تم تعليمه كمقروء | صار مقروء |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 166 | تم تعليمه كغير مقروء | صار غير مقروء |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 167 | تم تعليم كل المقالات كمقروءة | كل المقالات صارت مقروءة |
| apps/gallery-react/src/ios-screens/inbox-swipe.tsx | 168 | تم استرجاع {n} | رجعت {n} |
| apps/gallery-react/src/ios-screens/fitness-plan.tsx | 144 | تمت إزالة الحركة | انشالت الحركة |
| apps/gallery-react/src/ios-screens/fitness-plan.tsx | 156 | تم نسخ رابط الروتين | رابط الروتين منسوخ |
| apps/gallery-react/src/ios-screens/fitness-plan.tsx | 157 | تم تكرار الروتين | الروتين صار له نسخة |
| apps/gallery-react/src/ios-screens/fitness-plan.tsx | 158 | تمت الإضافة للتقويم | انضاف للتقويم |
| apps/gallery-react/src/ios-screens/fitness-plan.tsx | 159 | تم ضبط التذكير الساعة 6:00 م | التذكير على الساعة 6:00 م |
| apps/gallery-react/src/ios-screens/fitness-plan.tsx | 160 | تم حذف الروتين | انحذف الروتين |
| apps/gallery-react/src/ios-screens/fitness-plan.tsx | 161 | تمت إضافة الملاحظة | الملاحظة انضافت |
| apps/gallery-react/src/ios-screens/fitness-plan.tsx | 163 | تم نقل الحركة | الحركة انتقلت |
| apps/gallery-react/src/ios-screens/notes-edit.tsx | 154 | تم تثبيت الملاحظة | الملاحظة مثبتة |
| apps/gallery-react/src/ios-screens/notes-edit.tsx | 155 | تم إلغاء التثبيت | الملاحظة غير مثبتة |
| apps/gallery-react/src/ios-screens/notes-edit.tsx | 156 | تم نقل الملاحظة إلى «المحذوفة مؤخرا» | الملاحظة في «المحذوفة مؤخرا» |
| apps/gallery-react/src/ios-screens/notes-edit.tsx | 157 | تم إنشاء ملاحظة جديدة | ملاحظة جديدة جاهزة |
| apps/gallery-react/src/ios-screens/share-flow.tsx | 123 | تم إرسال التمرين لـ{name} | التمرين وصل {name} |
| apps/gallery-react/src/ios-screens/share-flow.tsx | 124 | تمت مشاركة التمرين عبر {label} | التمرين انرسل عبر {label} |
| apps/gallery-react/src/ios-screens/share-flow.tsx | 125 | تم حفظ الصورة | الصورة محفوظة |
| apps/gallery-react/src/ios-screens/share-flow.tsx | 126 | تمت الإضافة للأسبوع الجاي | انضاف للأسبوع الجاي |
| apps/gallery-react/src/ios-screens/booking.tsx | 142 | تم حجز الطاولة | الطاولة محجوزة |
| apps/gallery-react/src/ios-screens/music-library.tsx | 157 | تم تنزيلها | محملة على الجوال |
| apps/gallery-react/src/ios-screens/kit.tsx | 381 | الجزء العلوي، اليوم A | الجزء العلوي، اليوم الأول |
| apps/gallery-react/src/ios-screens/kit.tsx | 393 | الجزء السفلي، اليوم B | الجزء السفلي، اليوم الثاني |

## What I did not reach

- Swipe gestures: a mouse drag did not open SwipeActions rows or Pager
  pages in the headless browser, so the swipe direction in rtl was read
  from the code (`SwipeActions.tsx` line 230, `Toaster.tsx` line 449,
  `SplitView.css` lines 50 to 58), not felt. The keyboard paths were
  tested.
- SelectionMenu: it opens on a text selection; it was not opened. Its back
  and forward glyphs are `chevron-back` and `chevron-forward`, which
  mirror.
- Dark scheme: not captured; no finding above is scheme specific.
- The overlay runner closed some overlays badly in Desk and Liquid (pages
  where Escape left a layer open), so not every English case overlay was
  opened in those two styles; every Arabic trigger was opened in Studio and
  Liquid, and every screen overlay in all four.
- DateField, DatePicker and TimeField part order: left to the lane adding
  isolation, as asked.
- Android and forced colors: other lanes.
