// The content kit of the iOS test screens (order M10.0). Our own names,
// places and copy in English and Arabic, the formatters every screen uses,
// the shell every screen draws in, and generated artwork drawn from tokens.
//
// Rules for the content (plan section 5, and the lead's brief):
// - Our own names, places, titles and numbers. No third party names, logos,
//   lyrics, titles or marks, and no photos: the artwork is gradients and
//   plain shapes in the tokens' chart colours (ios-screens.css), after the
//   M6 art of /platforms.
// - Arabic: white Saudi dialect where a person speaks, noun form labels, no
//   diacritics, Western digits.
// - Prices in SAR: "SAR 120" in English, "120 ر.س" in Arabic.
// - Dates and times through @the-system/shared (date.ts), Western digits.
// - Phone numbers in the +966 form, set left to right inside Arabic.
//
// A screen may keep content of its own in its file; what more than one
// screen needs belongs here.
import type { ReactNode } from 'react';
import { PageShell, useTheme, type PageShellProps } from '@the-system/react';
import { dateLocale, formatFullDate, formatNational, formatNumber, monthTitle } from '@the-system/shared';

/* ------------------------------------------------------------ language */

export type Lang = 'en' | 'ar';

/** One string in both languages. */
export interface Text {
  en: string;
  ar: string;
}

export function langOf(tag: string): Lang {
  return tag === 'ar' || tag.startsWith('ar-') ? 'ar' : 'en';
}

/** The language of the nearest Theme. */
export function useLang(): Lang {
  return langOf(useTheme().lang);
}

/** The string of a Text in a language. */
export function t(text: Text, lang: Lang): string {
  return text[lang];
}

/** The locale every formatter here uses: Saudi English or Saudi Arabic. */
export function localeOf(lang: Lang): string {
  return lang === 'ar' ? 'ar-SA' : 'en-SA';
}

/* ------------------------------------------------------------ formatters */

/** A whole number or a decimal with Western digits: 1,250 and 1,250 in both languages. */
export function countText(n: number, lang: Lang, options: Intl.NumberFormatOptions = {}): string {
  return formatNumber(n, localeOf(lang), options);
}

/** A price in riyals: "SAR 120" in English, "120 ر.س" in Arabic. Halalas only when there are some. */
export function priceText(amount: number, lang: Lang): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  const n = formatNumber(amount, localeOf(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return lang === 'ar' ? `${n} ر.س` : `SAR ${n}`;
}

/** Date forms the screens use. ISO dates in ("2026-11-20"); Gregorian, Western digits. */
export type DateForm = 'full' | 'day-month' | 'weekday-day' | 'month';

export function dateText(iso: string, lang: Lang, form: DateForm = 'day-month'): string {
  const locale = localeOf(lang);
  if (form === 'full') return formatFullDate(iso, locale);
  if (form === 'month') return monthTitle(iso, locale);
  const options: Intl.DateTimeFormatOptions = form === 'day-month' ? { day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat(dateLocale(locale), { ...options, timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
}

/** A clock time, "7:30 PM" or "7:30 م", Western digits. Hours 0 to 23. */
export function timeText(hours: number, minutes: number, lang: Lang): string {
  const at = new Date(Date.UTC(2026, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat(dateLocale(localeOf(lang)), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(at);
}

/** A length of time as a player shows it: 3:07, 1:02:45. The same in both languages. */
export function durationText(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** A Saudi mobile number in the +966 form: "+966 50 123 4567". */
export function phoneText(national: string): string {
  return `+966 ${formatNational(national, 'SA')}`;
}

/** A phone number set left to right, so it reads the same inside Arabic. */
export function Phone({ national }: { national: string }) {
  return <bdi dir="ltr">{phoneText(national)}</bdi>;
}

/* ------------------------------------------------------------ the shell */

/**
 * The frame of every screen: a PageShell with `placement="auto"`, so on the
 * folding iPhone the bars move to the side column by themselves. Pass the
 * PageShell slots (header, nav, footer) as usual; the content goes in main.
 */
export function ScreenShell({ children, ...rest }: Omit<PageShellProps, 'placement'> & { children?: ReactNode }) {
  return (
    <PageShell data-gallery="ios-screen-shell" placement="auto" {...rest}>
      {children}
    </PageShell>
  );
}

/* ------------------------------------------------------------ artwork */

/** The art names ios-screens.css draws, each a gradient with plain shapes in the chart colours. */
export const ART_NAMES = ['dawn', 'tide', 'ember', 'moss', 'dusk', 'lake', 'dune', 'palm', 'night', 'coral', 'mint', 'sand'] as const;
export type ArtName = (typeof ART_NAMES)[number];

/** square: a cover. wide: a banner, 2 to 1. circle: a person or a round badge. tall: a card, 3 to 4. */
export type ArtShape = 'square' | 'wide' | 'circle' | 'tall';

/** A stable art name for any id, so the same item always has the same picture. */
export function artFor(seed: string): ArtName {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ART_NAMES[h % ART_NAMES.length] ?? 'dawn';
}

export interface ArtProps {
  art: ArtName;
  shape?: ArtShape;
  /** A name for the picture when it carries meaning. Without it the art is decoration, hidden from assistive tech. */
  label?: string;
  /** Letters drawn over the art, for a person without a picture: "SH". */
  initials?: string;
}

/**
 * Generated artwork. The size comes from the parent (the art fills its
 * inline size and keeps its shape's ratio); a screen's own CSS sets it.
 */
export function Art({ art, shape = 'square', label, initials }: ArtProps) {
  return (
    <span data-gallery="ios-art" data-art={art} data-shape={shape} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {initials && <span data-gallery="ios-art-initials">{initials}</span>}
    </span>
  );
}

/* ------------------------------------------------------------ people */

export interface Person {
  id: string;
  name: Text;
  /** Two letters for an avatar without a picture. */
  initials: Text;
  /** The national number, without the country code. */
  phone: string;
  email: string;
  city: string;
  art: ArtName;
}

export const people: readonly Person[] = [
  { id: 'sara', name: { en: 'Sara Al Harbi', ar: 'سارة الحربي' }, initials: { en: 'SH', ar: 'سح' }, phone: '501234567', email: 'sara@example.com', city: 'riyadh', art: 'dawn' },
  { id: 'faisal', name: { en: 'Faisal Al Qahtani', ar: 'فيصل القحطاني' }, initials: { en: 'FQ', ar: 'فق' }, phone: '551239876', email: 'faisal@example.com', city: 'jeddah', art: 'tide' },
  { id: 'noura', name: { en: 'Noura Al Dosari', ar: 'نورة الدوسري' }, initials: { en: 'ND', ar: 'ند' }, phone: '532224410', email: 'noura@example.com', city: 'dammam', art: 'coral' },
  { id: 'khalid', name: { en: 'Khalid Al Otaibi', ar: 'خالد العتيبي' }, initials: { en: 'KO', ar: 'خع' }, phone: '561870032', email: 'khalid@example.com', city: 'riyadh', art: 'moss' },
  { id: 'reem', name: { en: 'Reem Al Shehri', ar: 'ريم الشهري' }, initials: { en: 'RS', ar: 'رش' }, phone: '544019283', email: 'reem@example.com', city: 'abha', art: 'dusk' },
  { id: 'abdullah', name: { en: 'Abdullah Al Mutairi', ar: 'عبدالله المطيري' }, initials: { en: 'AM', ar: 'عم' }, phone: '509917345', email: 'abdullah@example.com', city: 'riyadh', art: 'lake' },
  { id: 'lama', name: { en: 'Lama Al Zahrani', ar: 'لمى الزهراني' }, initials: { en: 'LZ', ar: 'لز' }, phone: '597301122', email: 'lama@example.com', city: 'jeddah', art: 'mint' },
  { id: 'turki', name: { en: 'Turki Al Ghamdi', ar: 'تركي الغامدي' }, initials: { en: 'TG', ar: 'تغ' }, phone: '583364408', email: 'turki@example.com', city: 'alula', art: 'sand' },
];

/* ------------------------------------------------------------ places */

export interface Place {
  id: string;
  name: Text;
}

export const cities: readonly Place[] = [
  { id: 'riyadh', name: { en: 'Riyadh', ar: 'الرياض' } },
  { id: 'jeddah', name: { en: 'Jeddah', ar: 'جدة' } },
  { id: 'dammam', name: { en: 'Dammam', ar: 'الدمام' } },
  { id: 'abha', name: { en: 'Abha', ar: 'أبها' } },
  { id: 'alula', name: { en: 'AlUla', ar: 'العلا' } },
];

export const districts: readonly Place[] = [
  { id: 'olaya', name: { en: 'Al Olaya', ar: 'العليا' } },
  { id: 'malqa', name: { en: 'Al Malqa', ar: 'الملقا' } },
  { id: 'hittin', name: { en: 'Hittin', ar: 'حطين' } },
  { id: 'rawdah', name: { en: 'Al Rawdah', ar: 'الروضة' } },
];

/** Venues of our own: made up names, not real businesses. */
export interface Venue extends Place {
  kind: Text;
  district: string;
  /** Average price for two, in riyals. */
  price: number;
  rating: number;
  art: ArtName;
}

export const venues: readonly Venue[] = [
  { id: 'najd-courtyard', name: { en: 'Najd Courtyard', ar: 'حوش نجد' }, kind: { en: 'Saudi kitchen', ar: 'مطبخ سعودي' }, district: 'malqa', price: 240, rating: 4.7, art: 'sand' },
  { id: 'palm-room', name: { en: 'The Palm Room', ar: 'غرفة النخيل' }, kind: { en: 'Breakfast and coffee', ar: 'فطور وقهوة' }, district: 'olaya', price: 120, rating: 4.5, art: 'palm' },
  { id: 'sand-salt', name: { en: 'Sand and Salt', ar: 'رمل وملح' }, kind: { en: 'Seafood', ar: 'مأكولات بحرية' }, district: 'hittin', price: 380, rating: 4.8, art: 'tide' },
  { id: 'juniper-table', name: { en: 'Juniper Table', ar: 'طاولة العرعر' }, kind: { en: 'Grill', ar: 'مشويات' }, district: 'rawdah', price: 200, rating: 4.4, art: 'ember' },
];

/* ------------------------------------------------------------ music (M10.1, M10.2) */

export interface Artist {
  id: string;
  name: Text;
  art: ArtName;
}

/** Made up artists. */
export const artists: readonly Artist[] = [
  { id: 'juniper-trio', name: { en: 'The Juniper Trio', ar: 'ثلاثي العرعر' }, art: 'moss' },
  { id: 'maha-saleh', name: { en: 'Maha Saleh', ar: 'مها صالح' }, art: 'coral' },
  { id: 'night-caravan', name: { en: 'Night Caravan', ar: 'قافلة الليل' }, art: 'night' },
  { id: 'rawabi-strings', name: { en: 'Rawabi Strings', ar: 'أوتار الروابي' }, art: 'lake' },
];

export interface Track {
  id: string;
  title: Text;
  artist: string;
  /** Length in seconds. */
  length: number;
  art: ArtName;
}

/**
 * Made up track titles, one per letter from A to L in English so the
 * section index has sections. Arabic titles are their own words, sorted by
 * the screen with Intl.Collator.
 */
export const tracks: readonly Track[] = [
  { id: 'amber-gate', title: { en: 'Amber at the gate', ar: 'كهرمان عند البوابة' }, artist: 'maha-saleh', length: 214, art: 'ember' },
  { id: 'blue-diriyah', title: { en: 'Blue hour in Diriyah', ar: 'الساعة الزرقاء في الدرعية' }, artist: 'rawabi-strings', length: 251, art: 'night' },
  { id: 'cardamom-morning', title: { en: 'Cardamom morning', ar: 'صباح الهيل' }, artist: 'juniper-trio', length: 187, art: 'mint' },
  { id: 'dunes-rain', title: { en: 'Dunes after rain', ar: 'كثبان بعد المطر' }, artist: 'night-caravan', length: 302, art: 'dune' },
  { id: 'early-tide', title: { en: 'Early tide on the corniche', ar: 'مد الصباح على الكورنيش' }, artist: 'maha-saleh', length: 199, art: 'tide' },
  { id: 'falcon-road', title: { en: 'Falcon road north', ar: 'طريق الصقر شمالا' }, artist: 'night-caravan', length: 266, art: 'sand' },
  { id: 'lantern-garden', title: { en: 'Garden of lanterns', ar: 'حديقة الفوانيس' }, artist: 'rawabi-strings', length: 233, art: 'dusk' },
  { id: 'small-boats', title: { en: 'Harbour of small boats', ar: 'مرفأ القوارب الصغيرة' }, artist: 'juniper-trio', length: 178, art: 'lake' },
  { id: 'ink-palm', title: { en: 'Ink and palm', ar: 'حبر ونخل' }, artist: 'maha-saleh', length: 205, art: 'palm' },
  { id: 'juniper-slope', title: { en: 'Juniper slope', ar: 'منحدر العرعر' }, artist: 'juniper-trio', length: 241, art: 'moss' },
  { id: 'kite-abha', title: { en: 'Kite over Abha', ar: 'طائرة ورقية فوق أبها' }, artist: 'rawabi-strings', length: 222, art: 'coral' },
  { id: 'lantern-market', title: { en: 'Lantern market', ar: 'سوق الفوانيس' }, artist: 'night-caravan', length: 290, art: 'dawn' },
];

/* ------------------------------------------------------------ passes (M10.3) */

export interface Pass {
  id: string;
  title: Text;
  place: Text;
  /** ISO date. */
  date: string;
  hours: number;
  minutes: number;
  seat: Text;
  price: number;
  holder: string;
  art: ArtName;
}

export const passes: readonly Pass[] = [
  {
    id: 'design-days',
    title: { en: 'Najd design days', ar: 'أيام نجد للتصميم' },
    place: { en: 'Hall 3, Riyadh Front', ar: 'القاعة 3، واجهة الرياض' },
    date: '2026-12-03',
    hours: 18,
    minutes: 30,
    seat: { en: 'Row F, seat 12', ar: 'الصف F، المقعد 12' },
    price: 120,
    holder: 'sara',
    art: 'dusk',
  },
  {
    id: 'oud-night',
    title: { en: 'An evening of strings', ar: 'أمسية الأوتار' },
    place: { en: 'Open theatre, AlUla', ar: 'المسرح المفتوح، العلا' },
    date: '2026-12-18',
    hours: 20,
    minutes: 0,
    seat: { en: 'Section B, seat 4', ar: 'القسم B، المقعد 4' },
    price: 350,
    holder: 'sara',
    art: 'night',
  },
];

/* ------------------------------------------------------------ saved reading (M10.5) */

export interface Article {
  id: string;
  title: Text;
  source: Text;
  /** Minutes to read. */
  minutes: number;
  /** ISO date it was saved. */
  saved: string;
  art: ArtName;
}

/** Made up articles from a made up magazine. */
export const articles: readonly Article[] = [
  { id: 'mud-walls', title: { en: 'Why mud walls keep a house cool', ar: 'ليش الجدران الطينية تبرد البيت' }, source: { en: 'Rawdah Review', ar: 'مجلة الروضة' }, minutes: 8, saved: '2026-11-16', art: 'sand' },
  { id: 'night-sky', title: { en: 'A guide to the winter sky over AlUla', ar: 'دليل سماء الشتاء فوق العلا' }, source: { en: 'Rawdah Review', ar: 'مجلة الروضة' }, minutes: 12, saved: '2026-11-15', art: 'night' },
  { id: 'coffee-roast', title: { en: 'Light roast, dark roast and the cup in between', ar: 'التحميص الفاتح والغامق وما بينهما' }, source: { en: 'Cup Notes', ar: 'ملاحظات الفنجان' }, minutes: 6, saved: '2026-11-14', art: 'ember' },
  { id: 'red-sea-reefs', title: { en: 'The reefs of the Red Sea, mapped by divers', ar: 'شعاب البحر الأحمر بخرائط الغواصين' }, source: { en: 'Coast Weekly', ar: 'أسبوعية الساحل' }, minutes: 10, saved: '2026-11-12', art: 'tide' },
  { id: 'sadu-loom', title: { en: 'Learning the Sadu loom in four weekends', ar: 'تعلم نول السدو في أربع عطل' }, source: { en: 'Rawdah Review', ar: 'مجلة الروضة' }, minutes: 9, saved: '2026-11-10', art: 'coral' },
  { id: 'cycle-lanes', title: { en: 'How the new cycle lanes changed a commute', ar: 'كيف غيرت مسارات الدراجات طريق الدوام' }, source: { en: 'City Pages', ar: 'صفحات المدينة' }, minutes: 5, saved: '2026-11-08', art: 'mint' },
];

/* ------------------------------------------------------------ notes (M10.7) */

export interface Note {
  id: string;
  title: Text;
  body: Text;
  /** ISO date it was edited. */
  edited: string;
}

export const notes: readonly Note[] = [
  {
    id: 'trip',
    title: { en: 'Trip to Abha', ar: 'رحلة أبها' },
    body: {
      en: 'Leave Thursday after work. Book the cabin near the juniper trail, two nights. Pack warm layers, the evenings get cold. Ask Reem about the market on Saturday.',
      ar: 'نطلع الخميس بعد الدوام. نحجز الكوخ اللي جنب درب العرعر ليلتين. ناخذ ملابس دافية لأن الليل يبرد. نسأل ريم عن سوق السبت.',
    },
    edited: '2026-11-16',
  },
  {
    id: 'groceries',
    title: { en: 'For the weekend', ar: 'أغراض نهاية الأسبوع' },
    body: { en: 'Dates, cardamom, fresh bread, laban, two kilos of rice, lemons.', ar: 'تمر، هيل، خبز طازج، لبن، كيلوين رز، ليمون.' },
    edited: '2026-11-14',
  },
];

/* ------------------------------------------------------------ fitness (M10.9, M10.10) */

export interface Exercise {
  id: string;
  name: Text;
  sets: number;
  reps: number;
  /** Kilograms, 0 for body weight. */
  weight: number;
  art: ArtName;
}

export interface Workout {
  id: string;
  title: Text;
  /** Minutes. */
  minutes: number;
  /** Kilocalories. */
  energy: number;
  exercises: readonly Exercise[];
}

export const workouts: readonly Workout[] = [
  {
    id: 'upper',
    title: { en: 'Upper body, day A', ar: 'الجزء العلوي، اليوم الأول' },
    minutes: 52,
    energy: 410,
    exercises: [
      { id: 'press', name: { en: 'Bench press', ar: 'ضغط الصدر' }, sets: 4, reps: 8, weight: 60, art: 'ember' },
      { id: 'row', name: { en: 'Seated row', ar: 'سحب أرضي' }, sets: 3, reps: 10, weight: 45, art: 'tide' },
      { id: 'shoulder', name: { en: 'Shoulder press', ar: 'ضغط الكتف' }, sets: 3, reps: 10, weight: 20, art: 'coral' },
      { id: 'pullup', name: { en: 'Pull up', ar: 'العقلة' }, sets: 3, reps: 6, weight: 0, art: 'moss' },
    ],
  },
  {
    id: 'lower',
    title: { en: 'Lower body, day B', ar: 'الجزء السفلي، اليوم الثاني' },
    minutes: 47,
    energy: 380,
    exercises: [
      { id: 'squat', name: { en: 'Back squat', ar: 'القرفصاء بالبار' }, sets: 4, reps: 6, weight: 80, art: 'dune' },
      { id: 'lunge', name: { en: 'Walking lunge', ar: 'طعنات مشي' }, sets: 3, reps: 12, weight: 16, art: 'mint' },
      { id: 'deadlift', name: { en: 'Romanian deadlift', ar: 'رفعة رومانية' }, sets: 3, reps: 8, weight: 70, art: 'sand' },
    ],
  },
];

/* ------------------------------------------------------------ lookups */

export function personById(id: string): Person | undefined {
  return people.find((p) => p.id === id);
}

export function artistById(id: string): Artist | undefined {
  return artists.find((a) => a.id === id);
}

export function cityById(id: string): Place | undefined {
  return cities.find((c) => c.id === id);
}

export function districtById(id: string): Place | undefined {
  return districts.find((d) => d.id === id);
}
