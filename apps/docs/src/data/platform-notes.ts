// What a component is on each platform, in English and in Arabic, for the
// component pages and their Markdown twins. Manifest prose has no Arabic
// field, so the docs keep this short note per component here (order M9.22,
// and the foldable notes of order DU9). Keys are manifest names; the link
// check fails on a key that names no manifest.
//
// Every look described here is proposed until the owner signs it. Facts
// about the foldable iPhone come from the vendor's public documentation as
// of 17 November 2026 (docs/plan/reset-duo.md, sections 2 and 3).

export interface PlatformNote {
  web: string;
  ios: string;
  android: string;
  /** The foldable iPhone, where the component changes on it. */
  foldable?: string;
}

/** The labels of the section, in both languages. */
export const platformNoteText = {
  en: { heading: 'On each platform', web: 'Web', ios: 'iOS', android: 'Android', foldable: 'Foldable iPhone', more: 'The iOS page: what to use for each part of an iPhone screen, and the foldable iPhone' },
  ar: { heading: 'حسب المنصة', web: 'الويب', ios: 'iOS', android: 'Android', foldable: 'iPhone القابل للطي', more: 'صفحة iOS: المكون المناسب لكل جزء من شاشة iPhone، وجهاز iPhone القابل للطي' },
} as const;

export const platformNoteKeys = ['web', 'ios', 'android', 'foldable'] as const;

export const platformNotes: Record<string, { en: PlatformNote; ar: PlatformNote }> = {
  ActionSheet: {
    en: {
      web: 'A card anchored to the trigger when there is room beside it, else a centred card.',
      ios: 'A card anchored to the control that opened it, over its corner, with stacked capsule actions and Cancel last and quieter. No scrim.',
      android: 'A bottom sheet of text rows over a scrim, with Cancel as the last row.',
    },
    ar: {
      web: 'بطاقة مثبتة على الزر المشغل إذا اتسع المكان بجانبه، وإلا فبطاقة في الوسط.',
      ios: 'بطاقة مثبتة على العنصر الذي فتحها فوق زاويته، فيها إجراءات كبسولية متراصة، والإلغاء في آخرها بدرجة أهدأ، دون تعتيم خلفها.',
      android: 'لوحة سفلية من صفوف نصية فوق تعتيم، والإلغاء آخر صف فيها.',
    },
  },
  SharePanel: {
    en: {
      web: 'share() opens the system share sheet where the browser has one. Otherwise the panel opens in a Popover from the share button.',
      ios: 'The system share sheet first. The panel is a sheet from the bottom edge, for the fallback and for the app\'s own targets.',
      android: 'The system share sheet first, as Chrome on Android has it. The panel is a bottom sheet with the same rows.',
    },
    ar: {
      web: 'تفتح share() لوحة المشاركة في النظام إذا توفرت في المتصفح، وإلا تفتح اللوحة في Popover من زر المشاركة.',
      ios: 'لوحة النظام أولا، ولوحتنا تظهر من الحافة السفلية بديلا ولوجهات التطبيق الخاصة.',
      android: 'لوحة النظام أولا كما في Chrome على Android، ولوحتنا لوحة سفلية بالصفوف نفسها.',
    },
  },
  SectionIndex: {
    en: {
      web: 'A column of small keys at the inline end of a long list.',
      ios: 'The same column, keys close together in the accent colour, no fill behind it.',
      android: 'The same column, with a large letter bubble beside it while scrubbing.',
    },
    ar: {
      web: 'عمود مفاتيح صغيرة في نهاية السطر بجانب قائمة طويلة.',
      ios: 'العمود نفسه، بمفاتيح متقاربة بلون التمييز، دون تعبئة خلفه.',
      android: 'العمود نفسه، مع فقاعة حرف كبيرة بجانبه أثناء التمرير.',
    },
  },
  SelectionMenu: {
    en: {
      web: 'A capsule of text actions above the selection, below it when there is no room above.',
      ios: 'The same capsule with 44 tall entries, the platform\'s edit menu.',
      android: 'The same capsule with 48 tall entries, as in Material\'s text selection toolbar.',
    },
    ar: {
      web: 'كبسولة إجراءات نصية فوق التحديد، وتحته إذا ضاق المكان فوقه.',
      ios: 'الكبسولة نفسها بعناصر ارتفاعها 44، وهي قائمة التحرير في المنصة.',
      android: 'الكبسولة نفسها بعناصر ارتفاعها 48، كشريط تحديد النص في Material.',
    },
  },
  SwipeActions: {
    en: {
      web: 'The menu button at the end of the row shows on hover and focus; touch swipes as on a phone.',
      ios: 'The row slides to reveal square actions filled with their tone; a long swipe runs the edge action.',
      android: 'The same reveal with square ends.',
    },
    ar: {
      web: 'يظهر زر القائمة في نهاية الصف عند التمرير فوقه أو التركيز عليه، ويعمل السحب باللمس كما في الهاتف.',
      ios: 'ينزلق الصف ليكشف إجراءات مربعة معبأة بلونها، والسحب الطويل ينفذ الإجراء الذي على الحافة.',
      android: 'الكشف نفسه بأطراف مربعة.',
    },
  },
  WheelPicker: {
    en: {
      web: 'The same wheel, turned by the mouse wheel, a drag, a tap on a row or the keys.',
      ios: 'Rows turn away on a curve around a soft band across every column.',
      android: 'A plain scrolling list per column, no curve, the row in the band filled.',
    },
    ar: {
      web: 'العجلة نفسها، وتدار بعجلة الفأرة أو السحب أو النقر على صف أو المفاتيح.',
      ios: 'تدور الصفوف على منحنى حول شريط ناعم يمتد عبر الأعمدة كلها.',
      android: 'قائمة تمرير بسيطة لكل عمود دون منحنى، والصف داخل الشريط معبأ.',
    },
  },
  Calendar: {
    en: {
      web: 'A month grid under a title and two arrow buttons, for a popover or a page.',
      ios: 'The inline month: the title at the start, the arrows at the end, 44 point day discs.',
      android: 'The Material date picker grid, the selected day a filled circle.',
    },
    ar: {
      web: 'شبكة شهر تحت العنوان وزري السهمين، لنافذة منبثقة أو صفحة.',
      ios: 'الشهر المضمن في الصفحة: العنوان في البداية، والسهمان في النهاية، وأقراص الأيام بقطر 44 نقطة.',
      android: 'شبكة منتقي التاريخ في Material، واليوم المختار دائرة معبأة.',
    },
  },
  DateField: {
    en: {
      web: 'A bordered box like Input holding the day, month and year segments.',
      ios: 'The same segments in a 44 point field, as the plain field of a grouped row.',
      android: 'A Material outlined text field holding the segments.',
    },
    ar: {
      web: 'مربع بإطار مثل Input يضم أجزاء اليوم والشهر والسنة.',
      ios: 'الأجزاء نفسها في حقل ارتفاعه 44 نقطة، كالحقل البسيط في صف مجمع.',
      android: 'حقل نص محدد الإطار من Material يضم الأجزاء.',
    },
  },
  TimeField: {
    en: {
      web: 'A bordered box like Input holding the hour, the minute and the day period.',
      ios: 'The same segments in a 44 point field. On a phone, DatePicker opens the wheel instead.',
      android: 'The Material time input, two boxes and the day period, with no clock dial.',
    },
    ar: {
      web: 'مربع بإطار مثل Input يضم الساعة والدقيقة وفترة اليوم.',
      ios: 'الأجزاء نفسها في حقل ارتفاعه 44 نقطة، وعلى الهاتف يفتح DatePicker العجلة بدلا منه.',
      android: 'إدخال الوقت في Material بمربعين وفترة اليوم، دون قرص الساعة.',
    },
  },
  DatePicker: {
    en: {
      web: 'A date chip that opens the Calendar in a popover, then the time typed in segments.',
      ios: 'A grouped row with a date chip and a time chip: the date opens the Calendar, the time opens the wheel, each in a popover.',
      android: 'Chips that open the Material date dialog and the time input dialog, with no clock dial.',
    },
    ar: {
      web: 'شريحة تاريخ تفتح التقويم في نافذة منبثقة، ثم الوقت مكتوبا على أجزاء.',
      ios: 'صف مجمع فيه شريحة للتاريخ وأخرى للوقت: التاريخ يفتح التقويم، والوقت يفتح العجلة، كل منهما في نافذة منبثقة.',
      android: 'شرائح تفتح نافذة التاريخ ونافذة إدخال الوقت في Material، دون قرص الساعة.',
    },
  },
  ColorSwatch: {
    en: {
      web: 'A rounded square with a thin inner edge.',
      ios: 'The same square or disc at the platform\'s control sizes. Content, so always solid.',
      android: 'The same, at the Material control sizes.',
    },
    ar: {
      web: 'مربع بزوايا مستديرة وحافة داخلية رفيعة.',
      ios: 'المربع أو القرص نفسه بمقاسات عناصر التحكم في المنصة، وهو محتوى فيبقى مصمتا دائما.',
      android: 'الشكل نفسه بمقاسات عناصر التحكم في Material.',
    },
  },
  ColorSwatchPicker: {
    en: {
      web: 'A rounded mosaic of colour cells, or a row of saved discs with an add button.',
      ios: 'The grid of the colour panel, with saved discs under it. Content, so solid.',
      android: 'The same form at Material spacing with 48 targets. Material has no colour picker of its own.',
    },
    ar: {
      web: 'فسيفساء خلايا ألوان بزوايا مستديرة، أو صف أقراص محفوظة مع زر إضافة.',
      ios: 'شبكة لوحة الألوان وتحتها الأقراص المحفوظة، وهي محتوى فتبقى مصمتة.',
      android: 'الشكل نفسه بمسافات Material ومساحة لمس 48، إذ لا يوفر Material منتقي ألوان.',
    },
  },
  ColorSlider: {
    en: {
      web: 'The label and the value over a capsule track of the gradient, with a round thumb.',
      ios: 'The colour panel\'s slider: a taller capsule and a ringed thumb. Content, so solid.',
      android: 'The same form at the Android control sizes.',
    },
    ar: {
      web: 'التسمية والقيمة فوق مسار كبسولي بالتدرج، مع مقبض دائري.',
      ios: 'شريط لوحة الألوان: كبسولة أطول ومقبض بحلقة، وهو محتوى فيبقى مصمتا.',
      android: 'الشكل نفسه بمقاسات عناصر التحكم في Android.',
    },
  },
  ColorField: {
    en: {
      web: 'The bordered field box with a small preview swatch at the start.',
      ios: 'The gray rounded value box of the colour panel.',
      android: 'Material\'s filled field.',
    },
    ar: {
      web: 'مربع الحقل بإطار، مع عينة معاينة صغيرة في بدايته.',
      ios: 'مربع القيمة الرمادي المستدير في لوحة الألوان.',
      android: 'الحقل المعبأ في Material.',
    },
  },
  ColorArea: {
    en: {
      web: 'A rounded square of the gradient with a ringed thumb.',
      ios: 'The spectrum view of the colour panel, over the hue slider. Content, so solid.',
      android: 'The same form; the thumb grows to the Android target.',
    },
    ar: {
      web: 'مربع بزوايا مستديرة فيه التدرج، مع مقبض بحلقة.',
      ios: 'عرض الطيف في لوحة الألوان فوق شريط درجة اللون، وهو محتوى فيبقى مصمتا.',
      android: 'الشكل نفسه، ويكبر المقبض إلى مساحة اللمس في Android.',
    },
  },
  ColorPicker: {
    en: {
      web: 'A round swatch button that opens the panel in a Popover.',
      ios: 'The colour panel in a Sheet: the three views as a segmented control, the opacity row and the saved colours.',
      android: 'The same panel in a bottom Sheet at Material spacing, the views as tabs.',
    },
    ar: {
      web: 'زر عينة دائري يفتح اللوحة في Popover.',
      ios: 'لوحة الألوان في Sheet: العروض الثلاثة عنصر تحكم مقسم، ثم صف الشفافية، ثم الألوان المحفوظة.',
      android: 'اللوحة نفسها في Sheet سفلية بمسافات Material، والعروض تبويبات.',
    },
  },
  List: {
    en: {
      web: 'Rows on the page; ListSection adds a header and a footer to a group of rows.',
      ios: 'Inset grouped cards of 52 point rows, the section text outside the card, or a flush list with hairlines.',
      android: '56 rows with a ripple; the section header is a small label above its rows.',
      foldable: 'In the side column layout no row runs under the column: the content keeps a margin equal to it. A scrolling list may cross the fold.',
    },
    ar: {
      web: 'صفوف في الصفحة، ويضيف ListSection رأسا وتذييلا لمجموعة صفوف.',
      ios: 'بطاقات مجمعة بصفوف ارتفاعها 52 نقطة، ونص القسم خارج البطاقة، أو قائمة ممتدة بخطوط فاصلة رفيعة.',
      android: 'صفوف ارتفاعها 56 مع تموج عند اللمس، ورأس القسم تسمية صغيرة فوق صفوفه.',
      foldable: 'مع العمود الجانبي لا يمتد أي صف تحت العمود، إذ يبقى للمحتوى هامش بعرضه. ويجوز أن تعبر القائمة القابلة للتمرير خط الطي.',
    },
  },
  Fieldset: {
    en: {
      web: 'With variant inset, a bordered card of field rows.',
      ios: 'With variant inset, the grouped card of a settings screen: 52 tall rows, hairlines, a small header and footer.',
      android: 'With variant inset, a stack of Material filled fields.',
    },
    ar: {
      web: 'مع variant inset تظهر بطاقة بإطار من صفوف الحقول.',
      ios: 'مع variant inset تظهر البطاقة المجمعة لشاشة الإعدادات: صفوف ارتفاعها 52، وخطوط فاصلة رفيعة، ورأس وتذييل صغيران.',
      android: 'مع variant inset تظهر مجموعة حقول معبأة من Material.',
    },
  },
  Input: {
    en: {
      web: 'A bordered box. Variant plain drops the box for a row of a grouped card.',
      ios: 'A gray rounded field, 44 tall. Plain is a row of an inset group; clearable adds a round clear button while editing.',
      android: 'Material\'s filled field; plain is drawn as a filled field in a stack of rows.',
    },
    ar: {
      web: 'مربع بإطار، ويلغي variant plain المربع ليكون صفا في بطاقة مجمعة.',
      ios: 'حقل رمادي مستدير ارتفاعه 44. والشكل plain صف في مجموعة، ويضيف clearable زر مسح دائريا أثناء الكتابة.',
      android: 'الحقل المعبأ في Material، والشكل plain حقل معبأ ضمن مجموعة صفوف.',
    },
  },
  Select: {
    en: {
      web: 'A field box; with emphasis ghost, a borderless value for toolbars and filter rows.',
      ios: 'The ghost form is the pop-up button: the value in the accent colour with an up and down glyph, the list in the platform menu.',
      android: 'The ghost form is a text button with a dropdown arrow; the list is a Material menu.',
    },
    ar: {
      web: 'مربع حقل، ومع emphasis ghost قيمة بلا إطار لأشرطة الأدوات وصفوف التصفية.',
      ios: 'الشكل ghost هو زر القائمة المنبثقة: القيمة بلون التمييز مع رمز سهمين، والقائمة قائمة المنصة.',
      android: 'الشكل ghost زر نصي مع سهم منسدل، والقائمة قائمة Material.',
    },
  },
  NumberField: {
    en: {
      web: 'A bordered box with decrement and increment buttons, or with variant stepper the value before a gray capsule.',
      ios: 'The stepper is the platform\'s gray capsule of minus and plus, with a 44 point press area.',
      android: 'The stepper is an outlined capsule.',
    },
    ar: {
      web: 'مربع بإطار مع زري الإنقاص والزيادة، أو مع variant stepper تظهر القيمة قبل كبسولة رمادية.',
      ios: 'الشكل stepper هو كبسولة المنصة الرمادية بالناقص والزائد، بمساحة ضغط 44 نقطة.',
      android: 'الشكل stepper كبسولة محددة الإطار.',
    },
  },
  DropdownMenu: {
    en: {
      web: 'The quick actions are a row at the top of the menu with the web menu spacing.',
      ios: 'The quick actions are the platform\'s row of icon actions at the top of the menu, on the menu glass.',
      android: 'The same row at the top of a Material menu.',
    },
    ar: {
      web: 'الإجراءات السريعة صف أعلى القائمة بمسافات قوائم الويب.',
      ios: 'الإجراءات السريعة صف المنصة من الإجراءات ذات الأيقونات أعلى القائمة، على زجاج القوائم.',
      android: 'الصف نفسه أعلى قائمة Material.',
    },
  },
  ContextMenu: {
    en: {
      web: 'Opens on right click, Shift+F10 or the Menu key; the quick actions are a row at the top.',
      ios: 'Opens on a long press; the quick actions are the platform\'s row of icon actions, on the menu glass.',
      android: 'Opens on a long press as a Material menu, with the same row at the top.',
    },
    ar: {
      web: 'تفتح بالنقر الأيمن أو Shift+F10 أو مفتاح القائمة، والإجراءات السريعة صف في أعلاها.',
      ios: 'تفتح بالضغط المطول، والإجراءات السريعة صف المنصة من الإجراءات ذات الأيقونات، على زجاج القوائم.',
      android: 'تفتح بالضغط المطول قائمة من Material، وفيها الصف نفسه في الأعلى.',
    },
  },
  AlertDialog: {
    en: {
      web: 'A centred card with a footer band. AlertDialogBody holds one or two fields; primary marks the default action.',
      ios: 'The platform\'s compact alert card with stacked capsule actions; the default action is filled in the accent colour.',
      android: 'A Material dialog with text button actions.',
      foldable: 'With the side column, the alert is centred in the content beside it. Placement in one segment of a folded screen is planned, not built.',
    },
    ar: {
      web: 'بطاقة في الوسط مع شريط تذييل، ويضم AlertDialogBody حقلا أو حقلين، وتحدد primary الإجراء الافتراضي.',
      ios: 'بطاقة التنبيه المختصرة في المنصة بإجراءات كبسولية متراصة، والإجراء الافتراضي معبأ بلون التمييز.',
      android: 'نافذة حوار من Material بأزرار نصية.',
      foldable: 'مع العمود الجانبي يتوسط التنبيه المحتوى بجانبه، ووضعه في جزء واحد من الشاشة المطوية مخطط ولم يبن بعد.',
    },
  },
  Sheet: {
    en: {
      web: 'A panel from the bottom with the close control in the header and an optional SheetConfirm at the inline end.',
      ios: 'The same, with a round close at the top and SheetConfirm a round check button.',
      android: 'A bottom sheet whose confirm is a text button in the top bar.',
      foldable: 'On the outer screen the sheet spans the width, 8 in from the edges, with close and confirm in its own small column. On the inner screen in landscape it is a centred card. When the browser reports two segments it keeps out of the fold.',
    },
    ar: {
      web: 'لوحة من الأسفل فيها زر الإغلاق في الرأس، وSheetConfirm اختياري في نهاية السطر.',
      ios: 'الشكل نفسه، مع زر إغلاق دائري في الأعلى، وSheetConfirm زر دائري بعلامة صح.',
      android: 'لوحة سفلية زر التأكيد فيها زر نصي في الشريط العلوي.',
      foldable: 'على الشاشة الخارجية تمتد اللوحة بالعرض على بعد 8 من الحواف، والإغلاق والتأكيد في عمود صغير خاص بها. وعلى الشاشة الداخلية بالوضع الأفقي تكون بطاقة في الوسط. وحين يعلن المتصفح جزأين تبتعد عن خط الطي.',
    },
  },
  Toast: {
    en: {
      web: 'A card in a corner with a close button.',
      ios: 'A banner at the top centre: start for an icon or avatar, meta for a time. A timed banner has no close button.',
      android: 'A snackbar at the bottom: one row of text with an action.',
      foldable: 'Planned, not built: the banner centred in the content beside the side column, and in one segment of a folded screen.',
    },
    ar: {
      web: 'بطاقة في زاوية مع زر إغلاق.',
      ios: 'شريط في أعلى المنتصف: start للأيقونة أو الصورة الرمزية، وmeta للوقت. والشريط المؤقت بلا زر إغلاق.',
      android: 'شريط سفلي بصف نصي واحد مع إجراء.',
      foldable: 'مخطط ولم يبن بعد: توسيط الشريط في المحتوى بجانب العمود الجانبي، ووضعه في جزء واحد من الشاشة المطوية.',
    },
  },
  TabBar: {
    en: {
      web: 'A bottom bar of three to five destinations; TabBarSearch is its last item.',
      ios: 'A floating capsule at the bottom; TabBarSearch is a separate round item beside it.',
      android: 'A Material navigation bar; TabBarSearch is its last item.',
      foldable: 'placement auto, bottom or side. In the side column it is a vertical capsule of 48 point items at the bottom of the column, icons only, each label kept as the link\'s name.',
    },
    ar: {
      web: 'شريط سفلي من ثلاث وجهات إلى خمس، وTabBarSearch آخر عناصره.',
      ios: 'كبسولة عائمة في الأسفل، وTabBarSearch عنصر دائري مستقل بجانبها.',
      android: 'شريط تنقل من Material، وTabBarSearch آخر عناصره.',
      foldable: 'القيم auto أو bottom أو side للخاصية placement. وفي العمود الجانبي يكون كبسولة عمودية من عناصر 48 نقطة أسفل العمود، بالأيقونات وحدها، وتبقى التسمية اسما للرابط.',
    },
  },
  Pagination: {
    en: {
      web: 'Page numbers with first, previous, next and last; variant dots draws one dot per page.',
      ios: 'Variant dots sits on a small platter, the current dot wider.',
      android: 'Variant dots without the platter.',
    },
    ar: {
      web: 'أرقام الصفحات مع الأولى والسابقة والتالية والأخيرة، ويرسم variant dots نقطة لكل صفحة.',
      ios: 'تظهر النقاط فوق قاعدة صغيرة، والنقطة الحالية أعرض.',
      android: 'النقاط دون القاعدة.',
    },
  },
  Popover: {
    en: {
      web: 'A card anchored to its trigger, with the arrow.',
      ios: 'The arrow is drawn in the popover\'s fill, with no edge.',
      android: 'The arrow is hidden.',
    },
    ar: {
      web: 'بطاقة مثبتة على العنصر المشغل، مع السهم.',
      ios: 'يرسم السهم بلون تعبئة النافذة دون حافة.',
      android: 'يخفى السهم.',
    },
  },
  Spinner: {
    en: {
      web: 'A turning ring.',
      ios: 'The same ring. A form with spokes waits on an owner decision.',
      android: 'The same ring.',
    },
    ar: {
      web: 'حلقة دوارة.',
      ios: 'الحلقة نفسها، وشكل الأشعة ينتظر قرار المالك.',
      android: 'الحلقة نفسها.',
    },
  },
  Navbar: {
    en: {
      web: 'The top bar of a site or app, with a menu button on phones.',
      ios: 'No bar fill: round glass buttons on the title row and a large title in the content.',
      android: 'A Material top app bar.',
      foldable: 'placement auto, bottom or side. In the side column the icon actions move to the top of the column as 48 point round buttons; text buttons and the title stay at the top of the content.',
    },
    ar: {
      web: 'الشريط العلوي للموقع أو التطبيق، مع زر قائمة على الهاتف.',
      ios: 'دون تعبئة للشريط: أزرار زجاجية دائرية في صف العنوان، وعنوان كبير في المحتوى.',
      android: 'شريط التطبيق العلوي في Material.',
      foldable: 'القيم auto أو bottom أو side للخاصية placement. وفي العمود الجانبي تنتقل الإجراءات ذات الأيقونات إلى أعلى العمود أزرارا دائرية بمقاس 48 نقطة، وتبقى الأزرار النصية والعنوان أعلى المحتوى.',
    },
  },
  PageShell: {
    en: {
      web: 'The page frame with its landmarks; under the tablet breakpoint the navigation moves into a Drawer.',
      ios: 'The same frame. On ios the shell is a size container named ds-shell, which the bars read.',
      android: 'The same frame.',
      foldable: 'placement passes down to the TabBar and the Navbar. auto gives the side column when the shell is at least 440 wide and at most 700 tall; the content then keeps a margin and scroll padding equal to the column.',
    },
    ar: {
      web: 'إطار الصفحة بمعالمه، وتحت مقاس الجهاز اللوحي ينتقل التنقل إلى Drawer.',
      ios: 'الإطار نفسه، ويكون على ios حاوية مقاس باسم ds-shell تقرؤها الأشرطة.',
      android: 'الإطار نفسه.',
      foldable: 'تمرر الخاصية placement إلى TabBar وNavbar. وتعطي auto العمود الجانبي حين يكون عرض الإطار 440 على الأقل وارتفاعه 700 على الأكثر، ويبقى للمحتوى حينها هامش ومسافة تمرير بعرض العمود.',
    },
  },
};
