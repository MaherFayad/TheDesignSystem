// The copy of the Boards screen in both locales. English: sentence case,
// buttons are a verb plus a noun. Arabic: white Saudi dialect for sentences,
// noun forms on buttons, no diacritics, Western digits.

export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'ar';
}

export interface Board {
  id: string;
  name: Record<Locale, string>;
  frames: number;
}

export const boards: readonly Board[] = [
  { id: 'spring', name: { en: 'Spring launch', ar: 'إطلاق الربيع' }, frames: 12 },
  { id: 'checkout', name: { en: 'Checkout flow', ar: 'مسار الدفع' }, frames: 8 },
  { id: 'brand', name: { en: 'Brand refresh', ar: 'تحديث الهوية' }, frames: 21 },
  { id: 'onboarding', name: { en: 'Onboarding screens', ar: 'شاشات الترحيب' }, frames: 5 },
];

export interface Copy {
  pageTitle: string;
  appName: string;
  listTitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  createBoard: string;
  frames: (n: number) => string;
  deleteBoard: (name: string) => string;
  noMatch: string;
  createTitle: string;
  createDescription: string;
  nameLabel: string;
  nameHint: string;
  nameError: string;
  closeForm: string;
  boardCreated: string;
  deleteTitle: (name: string) => string;
  deleteDescription: (frames: number) => string;
  keepBoard: string;
  confirmDelete: string;
  boardDeleted: string;
  undoDelete: string;
  boardRestored: string;
  showBoards: string;
  styleGroup: string;
  schemeGroup: string;
  languageGroup: string;
  dark: string;
  light: string;
  settings: string;
  sortByName: string;
  rowActions: (name: string) => string;
  duplicateBoard: string;
  boardDuplicated: string;
  copyName: (name: string) => string;
}

export const copy: Record<Locale, Copy> = {
  en: {
    pageTitle: 'Boards',
    appName: 'Consumer Next',
    listTitle: 'All boards',
    searchLabel: 'Search boards',
    searchPlaceholder: 'Board name',
    createBoard: 'Create board',
    frames: (n) => (n === 1 ? '1 frame' : `${n} frames`),
    deleteBoard: (name) => `Delete board ${name}`,
    noMatch: 'No board matches this search. Try a shorter name.',
    createTitle: 'Create a board',
    createDescription: 'A board holds the frames of one project.',
    nameLabel: 'Board name',
    nameHint: 'You can rename it later.',
    nameError: 'Add a name for the board, for example Spring launch.',
    closeForm: 'Close form',
    boardCreated: 'Board created',
    deleteTitle: (name) => `Delete the board ${name}?`,
    deleteDescription: (n) => `Its ${n} frames go with it. You can undo this from the notice that follows.`,
    keepBoard: 'Keep board',
    confirmDelete: 'Delete board',
    boardDeleted: 'Board deleted',
    undoDelete: 'Undo delete',
    boardRestored: 'Board restored',
    showBoards: 'Show boards',
    styleGroup: 'Style',
    schemeGroup: 'Scheme',
    languageGroup: 'Language',
    dark: 'Dark',
    light: 'Light',
    settings: 'Display settings',
    sortByName: 'Sort by name',
    rowActions: (name) => `Actions for ${name}`,
    duplicateBoard: 'Duplicate board',
    boardDuplicated: 'Board duplicated',
    copyName: (name) => `${name} copy`,
  },
  ar: {
    pageTitle: 'اللوحات',
    appName: 'Consumer Next',
    listTitle: 'كل اللوحات',
    searchLabel: 'البحث في اللوحات',
    searchPlaceholder: 'اسم اللوحة',
    createBoard: 'إنشاء لوحة',
    frames: (n) => (n === 1 ? 'إطار واحد' : n <= 10 ? `${n} إطارات` : `${n} إطار`),
    deleteBoard: (name) => `حذف لوحة ${name}`,
    noMatch: 'ما فيه لوحة بهذا الاسم. جرب اسم أقصر.',
    createTitle: 'لوحة جديدة',
    createDescription: 'اللوحة تجمع إطارات مشروع واحد.',
    nameLabel: 'اسم اللوحة',
    nameHint: 'تقدر تغير الاسم بعدين.',
    nameError: 'اكتب اسم للوحة، مثل إطلاق الربيع.',
    closeForm: 'إغلاق النموذج',
    boardCreated: 'اللوحة جاهزة',
    deleteTitle: (name) => `تبي تحذف لوحة ${name}؟`,
    deleteDescription: () => 'تنحذف معها كل إطاراتها، وتقدر تتراجع من التنبيه اللي يطلع بعدها.',
    keepBoard: 'إبقاء اللوحة',
    confirmDelete: 'حذف اللوحة',
    boardDeleted: 'اللوحة محذوفة',
    undoDelete: 'تراجع عن الحذف',
    boardRestored: 'اللوحة رجعت',
    showBoards: 'عرض اللوحات',
    styleGroup: 'النمط',
    schemeGroup: 'المظهر',
    languageGroup: 'اللغة',
    dark: 'داكن',
    light: 'فاتح',
    settings: 'إعدادات العرض',
    sortByName: 'الترتيب حسب الاسم',
    rowActions: (name) => `إجراءات ${name}`,
    duplicateBoard: 'تكرار اللوحة',
    boardDuplicated: 'نسخة اللوحة جاهزة',
    copyName: (name) => `نسخة من ${name}`,
  },
};

export const styles = ['studio', 'desk'] as const;
export type StyleChoice = (typeof styles)[number];
export const schemes = ['dark', 'light'] as const;
export type SchemeChoice = (typeof schemes)[number];

export function isStyle(value: string | undefined): value is StyleChoice {
  return value === 'studio' || value === 'desk';
}

export function isScheme(value: string | undefined): value is SchemeChoice {
  return value === 'dark' || value === 'light';
}

/** Style names are product names and stay in Latin letters in both locales. */
export const styleNames: Record<StyleChoice, string> = { studio: 'Studio', desk: 'Desk' };
