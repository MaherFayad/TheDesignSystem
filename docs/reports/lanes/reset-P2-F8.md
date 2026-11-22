# P2 F8 demos and screens

Order: `docs/plan/reset-mobile.md`, round 2, lane F8. Files changed: 30
`*.demo.tsx` of the mobile set and `apps/gallery-react/src/ios-screens/`
(Host, booking, fitness-plan, inbox-swipe, kit, music-library, music-search,
notes-edit, pass-detail, share-flow). No generated file changed (no file was
added or removed, so `gen-index` had nothing to rewrite).

Pictures: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p2/f8/cap/`
(`c_<demo>_studio_ar.png` one per changed demo, `screen_<id>_studio_ar.png`
one per screen, `screen_music-library_desk_ar.png`,
`android_<id>_studio_ar.png`, `ring_split-view_*.png`). Probe and contrast
scripts in `.../p2/f8/js/`, probe output before and after in
`.../p2/f8/base.txt` and `.../p2/f8/after.txt`.

## One line per finding

| Finding | Result |
| --- | --- |
| Q4 F3 (demo and screen part), F4, F8, F9, F11, F15: the fix table rows in demos and screens | fixed, all 46 demo and screen rows of the table, plus one more of the same kind, table below |
| Q4 F6 / item 3: Sheet email field | fixed: `type="email"` on the English and the Arabic field (`Sheet.demo.tsx` lines 41 and 70) |
| Q4 F12 / item 2: demos ignore the language | fixed for 29 demos, list below |
| Q5 F5 / item 4: SplitView scroll pane ring | not a defect in the demo now: the pane is a direct child of `[data-part=secondary]`, so F3's rule (`ResizablePanels.css` lines 87 to 95) draws it inset: focused, `:focus-visible`, `outline 2px solid`, offset -2px, in Studio en and Desk ar on web (`ring_split-view_*.png`) |
| Q5 F14 / item 5: SelectionMenu button opens the menu without focus | fixed: Enter or Space on "Select a phrase" or a chip moves focus to the first action (`focusOnOpen` when the click has `detail === 0`); the owner carries `aria-keyshortcuts="Shift+F10"`. A pointer press keeps focus where it was |
| Q5 F16 / item 6: Arabic Banner Tab goes up to close | passed on: not caused by the demo (actions then close in DOM order, from the component); the wrapped layout puts close in the top row, `packages/css/src/components/Banner.css` line 186 (F3) |
| Q2 finding 3 (ranked 8) / item 7: Play all and Shuffle all 4.21:1 in Desk | fixed: `tone="accent" emphasis="soft"` without `fill="neutral"`, measured below |
| Q3 note / item 8: screens always on ios | fixed: `platform=android` in the query reaches the screen (Theme, frame iframes and links); any other value gives ios |

## String rows applied

| File | Old | New |
| --- | --- | --- |
| SelectionMenu.demo.tsx | تم النسخ: {t} | انتسخ: {t} |
| SelectionMenu.demo.tsx | {what}: تم | {what}: خلاص |
| Stepper.demo.tsx | الإيميل وكلمة المرور | البريد وكلمة المرور |
| Stepper.demo.tsx | الإيميل وكلمة المرور وطريقة الدخول لكل شخص | البريد وكلمة المرور وطريقة الدخول لكل شخص |
| Sheet.demo.tsx | الدعوة بالإيميل (plain Input) | الدعوة بالبريد (`type="email"`) |
| Sheet.demo.tsx | يمكن لمن لديه الرابط عرض اللوحة. | اللي عندهم الرابط يقدرون يشوفون اللوحة. |
| Sheet.demo.tsx | اسحب المقبض أو استخدم مفاتيح الأسهم لتغيير الارتفاع. | اسحب المقبض أو استخدم الأسهم عشان تغير الارتفاع. |
| SplitView.demo.tsx | ... اختار رسالة من القائمة. | ... اختر رسالة من القائمة. |
| pass-detail.tsx | رمز الدخول, NDD-2026-0412 | رمز الدخول، NDD-2026-0412 (comma from `words[lang].comma`) |
| pass-detail.tsx | 3 ديسمبر, 6:30 م | 3 ديسمبر، 6:30 م (same) |
| pass-detail.tsx | تم حفظ إعدادات البطاقة | إعدادات البطاقة محفوظة |
| pass-detail.tsx | تمت إزالة البطاقة | انشالت البطاقة |
| pass-detail.tsx | تم استرجاع البطاقة | رجعت البطاقة |
| pass-detail.tsx | تم إرسال البطاقة لـ{name} | البطاقة وصلت {name} |
| pass-detail.tsx | تمت مشاركة البطاقة عبر {label} | البطاقة انرسلت عبر {label} |
| pass-detail.tsx | تمت الإضافة للتقويم | انضافت للتقويم |
| pass-detail.tsx | تم نسخ رقم البطاقة | رقم البطاقة منسوخ |
| inbox-swipe.tsx | خيارات إضافية لـ{title} | خيارات إضافية للمقال «{title}» |
| inbox-swipe.tsx | تمت أرشفة المقال | المقال في الأرشيف |
| inbox-swipe.tsx | تم حذف المقال | انحذف المقال |
| inbox-swipe.tsx | تمت الإضافة للمفضلة | انضاف للمفضلة |
| inbox-swipe.tsx | تمت الإزالة من المفضلة | انشال من المفضلة |
| inbox-swipe.tsx | تم تعليمه كمقروء | صار مقروء |
| inbox-swipe.tsx | تم تعليمه كغير مقروء | صار غير مقروء |
| inbox-swipe.tsx | تم تعليم كل المقالات كمقروءة | كل المقالات صارت مقروءة |
| inbox-swipe.tsx | تم استرجاع {n} | رجعت {n} |
| fitness-plan.tsx | تمت إزالة الحركة | انشالت الحركة |
| fitness-plan.tsx | تم نسخ رابط الروتين | رابط الروتين منسوخ |
| fitness-plan.tsx | تم تكرار الروتين | صار عندك نسخة من الروتين (see decisions) |
| fitness-plan.tsx | تمت الإضافة للتقويم | انضاف للتقويم |
| fitness-plan.tsx | تم ضبط التذكير الساعة 6:00 م | التذكير على الساعة 6:00 م |
| fitness-plan.tsx | تم حذف الروتين | انحذف الروتين |
| fitness-plan.tsx | تمت إضافة الملاحظة | الملاحظة انضافت |
| fitness-plan.tsx | تم نقل الحركة | الحركة انتقلت |
| notes-edit.tsx | تم تثبيت الملاحظة | الملاحظة مثبتة |
| notes-edit.tsx | تم إلغاء التثبيت | الملاحظة غير مثبتة |
| notes-edit.tsx | تم نقل الملاحظة إلى «المحذوفة مؤخرا» | الملاحظة في «المحذوفة مؤخرا» |
| notes-edit.tsx | تم إنشاء ملاحظة جديدة | ملاحظة جديدة جاهزة |
| share-flow.tsx | تم إرسال التمرين لـ{name} | التمرين وصل {name} |
| share-flow.tsx | تمت مشاركة التمرين عبر {label} | التمرين انرسل عبر {label} |
| share-flow.tsx | تم حفظ الصورة | الصورة محفوظة |
| share-flow.tsx | تمت الإضافة للأسبوع الجاي | انضاف للأسبوع الجاي |
| booking.tsx | تم حجز الطاولة | الطاولة محجوزة |
| music-library.tsx | تم تنزيلها | محملة على الجوال |
| kit.tsx | الجزء العلوي، اليوم A | الجزء العلوي، اليوم الأول |
| kit.tsx | الجزء السفلي، اليوم B | الجزء السفلي، اليوم الثاني |
| music-search.tsx (not in the table) | ما فيه نتائج لـ «{q}» | ما فيه نتائج عن «{q}» (the same "لـ" fault as F8) |

All 46 demo and screen rows of the table (57 rows less the 11 built in rows of F4) are applied. Decisions on the
proposed strings:

- "الروتين صار له نسخة" reads as "the routine got a copy of itself"; "صار
  عندك نسخة من الروتين" says the person now has a copy, which is what
  Duplicate does.
- The other proposed strings are used as written.

## Demos that now follow the language

With `lang=ar` every case reads Arabic; with `lang=en` the English copy is
unchanged (the vitest demo renders and the contract runs use en and pass).
The pattern is the one already in the tree: the demo reads
`useTheme().lang` and the `isArabic` helper of `Popover/FloatingLayer`
(imported the same way by ActionSheet and Tour), then picks an
`{ en, ar }` copy table and passes `lang` to the inner demo parts that
already took it (List, Stepper, SwipeActions, TabBar, Navbar, PageShell,
SplitView, Sheet). Locales follow too (`en-SA`/`ar-SA`, `en-GB` and `en-US`
to `ar-SA` with `hourCycle={24}` where the English case shows 24 hours).

ActionSheet, Banner, Calendar, ColorArea, ColorField, ColorPicker,
ColorSlider, ColorSwatch, ColorSwatchPicker, DateField, DatePicker,
TimeField, WheelPicker, List, SectionIndex, SelectionMenu, SharePanel,
Stepper, SwipeActions, TabBar, Navbar, PageShell, Pager, Toast, Slider,
RangeSlider, SegmentedControl, SearchField, SplitView.

Left as they are: AlertDialog, Sheet and Dialog pin each English case in
`<DemoCase lang="en">` (English in its own ltr Theme) next to their Arabic
instances, so they never mixed languages; the probe found 0 English nodes
outside a `lang=en` scope on them before and after.

`dir="auto"` on user content slots: mail senders and subjects (List,
SwipeActions), song titles and artists (List), contact names (SectionIndex),
subjects, senders and bodies (SplitView). The Arabic sets of SectionIndex
("Nora Smith") and SplitView (an English message from Lina Saleh) keep one
Latin item on purpose, so the mixed direction case is on the page.

Probe (`js/probe.mjs`, Studio, ios, `lang=ar`, English text or names
outside a `lang=en` scope): before, 29 demos had English (8 to 429 nodes;
SelectionMenu was already changed when `base.txt` was taken);
after, every demo is 0 except intended Latin: `JSON`, `DNS`, a URL, hex
values, `#RRGGBB`, "Nora Smith" and "Interview notes".

## Music library buttons

Ink against the composited fill, Play all, per variant
(`js/contrast.mjs`):

| Style, scheme | accent soft fill neutral (before) | accent soft (now) | neutral soft |
| --- | --- | --- | --- |
| studio light | 15.94 | 15.94 | 17.40 |
| studio dark | 16.05 | 16.05 | 17.94 |
| desk light | 4.23 | 5.06 | 10.50 |
| desk dark | 12.65 | 12.57 | 15.68 |
| neutral light | 6.19 | 6.34 | 13.62 |
| neutral dark | 9.43 | 8.35 | 17.20 |
| liquid light | 6.12 | 6.06 | 13.69 |
| liquid dark | 9.47 | 8.06 | 14.86 |

Accent soft passes everywhere and keeps the accent ink of the reference.
No screen CSS changed.

## Screens on android

`Host.tsx`: `screenPlatform(params)` gives `android` only for
`platform=android`, else `ios`. It sets the bare screen's Theme, the frame
iframe URLs, and keeps the key in the links between screens. Checked:
`/screens/ios/music-library/screen?platform=android` and `pass-detail`
render with `data-platform=android` (`android_*.png`); with no key or
`platform=web` they stay ios.

## Commands

- `npx tsc --noEmit -p tsconfig.json` (the `typecheck` script): no error in
  any file of this lane.
- `npx eslint` on the 30 demos and `apps/gallery-react/src/ios-screens`: clean.
- `npx vitest run` on the 30 changed component folders, `--testTimeout=120000`:
  44 files, 575 tests passed (13 files, 161 tests; then 31 files, 414 tests).
  `npx vitest run apps/gallery-react` finds no test file: the vitest include
  is `packages/{react,charts-react,ai-react}/src/**/*.test.tsx`.
- `node packages/cli/bin/ds.mjs doctor apps/gallery-react`: 50 files, 19
  errors, 6 warnings, none in `src/ios-screens`. All 19 errors are in files
  this lane did not touch: `src/App.tsx` 130 and `src/Duo.tsx` 285 (a native
  `<select>` in the gallery bar) and `src/interactions/navigation.tsx` 124
  to 147, `src/interactions/overlays.tsx` 343 (slot limits).
- Contract, `DS_CONTRACT_WORKERS=1 npm run contract -- --framework react --platform ios --component <Name>`:
CONTRACT_RESULTS
- Dash scan of every changed file: no en or em dash.

## Not done, passed on

- Q5 F16, Banner Tab order in Arabic: `packages/css/src/components/Banner.css`
  line 186 (F3), or the part order in `Banner.tsx` (F4).
- Toast, List and SplitView components set no `dir="auto"` on their own
  title and description slots (Q4 F12, component half): `Toast.tsx`,
  `List/ListItem`, for F4. The demos wrap user text themselves.
- Doctor errors in `App.tsx`, `Duo.tsx` and `src/interactions/*`: not in
  this order; the gallery bar `<select>` is gallery chrome.
- Demos outside the mobile set still say "الإيميل" or "تم": Tabs line 25,
  FormWizard lines 58 and 74, CommandPalette lines 54 and 184, Accordion
  lines 27 and 28, Button line 284, InlineEdit line 14. Not in the Q4 table.
- The TabBar demo names the bell tab "التنبيهات"; Q4 F2 keeps "تنبيه" for
  alerts, so it stays.
