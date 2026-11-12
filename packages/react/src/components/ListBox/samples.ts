// Demo and test data for the list family (ListBox, Combobox, Autocomplete).
// Not exported from the package barrel. Arabic: the names people write, no
// diacritics; the alef forms are kept as written so the filter can be seen
// to match across them.
import type { ListBoxOption, ListBoxSection } from './ListBox';

interface City {
  value: string;
  en: string;
  ar: string;
  code?: string;
}

const saudi: City[] = [
  { value: 'riyadh', en: 'Riyadh', ar: 'الرياض', code: 'RUH' },
  { value: 'jeddah', en: 'Jeddah', ar: 'جدة', code: 'JED' },
  { value: 'makkah', en: 'Makkah', ar: 'مكة' },
  { value: 'madinah', en: 'Madinah', ar: 'المدينة', code: 'MED' },
  { value: 'dammam', en: 'Dammam', ar: 'الدمام', code: 'DMM' },
  { value: 'khobar', en: 'Khobar', ar: 'الخبر' },
  { value: 'abha', en: 'Abha', ar: 'أبها', code: 'AHB' },
  { value: 'taif', en: 'Taif', ar: 'الطائف', code: 'TIF' },
  { value: 'tabuk', en: 'Tabuk', ar: 'تبوك', code: 'TUU' },
  { value: 'hail', en: 'Hail', ar: 'حائل', code: 'HAS' },
  { value: 'ahsa', en: 'Al Ahsa', ar: 'الأحساء', code: 'HOF' },
  { value: 'jazan', en: 'Jazan', ar: 'جازان', code: 'GIZ' },
  { value: 'najran', en: 'Najran', ar: 'نجران', code: 'EAM' },
  { value: 'ula', en: 'AlUla', ar: 'العلا', code: 'ULH' },
  { value: 'yanbu', en: 'Yanbu', ar: 'ينبع', code: 'YNB' },
  { value: 'buraydah', en: 'Buraydah', ar: 'بريدة' },
  { value: 'baha', en: 'Al Baha', ar: 'الباحة' },
  { value: 'sakaka', en: 'Sakaka', ar: 'سكاكا' },
  { value: 'arar', en: 'Arar', ar: 'عرعر' },
  { value: 'qatif', en: 'Qatif', ar: 'القطيف' },
  { value: 'jubail', en: 'Jubail', ar: 'الجبيل' },
  { value: 'khamis', en: 'Khamis Mushait', ar: 'خميس مشيط' },
  { value: 'hafar', en: 'Hafar Al Batin', ar: 'حفر الباطن' },
  { value: 'unaizah', en: 'Unaizah', ar: 'عنيزة' },
];

const gulf: City[] = [
  { value: 'dubai', en: 'Dubai', ar: 'دبي', code: 'DXB' },
  { value: 'abu-dhabi', en: 'Abu Dhabi', ar: 'أبوظبي', code: 'AUH' },
  { value: 'doha', en: 'Doha', ar: 'الدوحة', code: 'DOH' },
  { value: 'manama', en: 'Manama', ar: 'المنامة', code: 'BAH' },
  { value: 'kuwait', en: 'Kuwait City', ar: 'مدينة الكويت', code: 'KWI' },
  { value: 'muscat', en: 'Muscat', ar: 'مسقط', code: 'MCT' },
];

/** Cities as options, in one language. The airport code is a keyword. */
export function cityOptions(lang: 'en' | 'ar', list: 'saudi' | 'gulf' | 'all' = 'all'): ListBoxOption[] {
  const rows = list === 'saudi' ? saudi : list === 'gulf' ? gulf : [...saudi, ...gulf];
  return rows.map((c) => ({ value: c.value, label: c[lang], keywords: c.code ? [c.code, c.en] : [c.en] }));
}

/** Cities in two titled groups. */
export function citySections(lang: 'en' | 'ar'): ListBoxSection[] {
  return [
    { key: 'saudi', label: lang === 'en' ? 'Saudi Arabia' : 'السعودية', options: cityOptions(lang, 'saudi') },
    { key: 'gulf', label: lang === 'en' ? 'Gulf' : 'الخليج', options: cityOptions(lang, 'gulf') },
  ];
}

/** Sort options with icons and a description each. */
export function sortOptions(lang: 'en' | 'ar'): ListBoxOption[] {
  return lang === 'en'
    ? [
        { value: 'name', label: 'Name', description: 'A to Z', start: 'sort' },
        { value: 'edited', label: 'Date edited', description: 'Newest first', start: 'clock' },
        { value: 'owner', label: 'Owner', description: 'Grouped by person', start: 'user' },
        { value: 'size', label: 'File size', description: 'Needs a paid plan', start: 'file', disabled: true },
      ]
    : [
        { value: 'name', label: 'الاسم', description: 'من أ إلى ي', start: 'sort' },
        { value: 'edited', label: 'تاريخ التعديل', description: 'الأحدث أولا', start: 'clock' },
        { value: 'owner', label: 'المالك', description: 'حسب الشخص', start: 'user' },
        { value: 'size', label: 'حجم الملف', description: 'يحتاج اشتراك مدفوع', start: 'file', disabled: true },
      ];
}
