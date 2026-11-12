// Demo kit for `<Name>.demo.tsx` files. Import it with a relative path
// ('../../demo'). It is not exported from the package barrel, and its CSS
// (demo.css next to this file) is loaded by the gallery apps, never by the
// component CSS.
//
//   export default function ButtonDemo() {
//     return (
//       <DemoPage>
//         <DemoCase id="variants" title="Variants">
//           <DemoRow>...</DemoRow>
//         </DemoCase>
//         <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
//           <Button>{sample.ar.long}</Button>
//         </DemoCase>
//       </DemoPage>
//     );
//   }
import type { ReactNode } from 'react';
import { Theme } from '../theme/Theme';

/** Content case ids, in the order of docs/contracts/anatomy.md. */
export const demoCaseIds = [
  'variants',
  'empty',
  'one',
  'many',
  'too-many',
  'long-text',
  'long-arabic',
  'loading',
  'error',
  'disabled',
  'readonly',
] as const;

export type DemoCaseId = (typeof demoCaseIds)[number];

/** The outer wrapper of a demo: one column of cases with even gaps. */
export function DemoPage({ children }: { children: ReactNode }) {
  return <div data-demo="page">{children}</div>;
}

export interface DemoCaseProps {
  /** The case id. The gallery shows one case with `?case=<id>`. */
  id: DemoCaseId | (string & {});
  /** A short heading in sentence case. */
  title: string;
  /**
   * Renders the content in a nested Theme in this language (and its
   * direction), for the `long-arabic` case. The heading stays outside it.
   */
  lang?: 'en' | 'ar';
  children: ReactNode;
}

/**
 * One content case: a section with `data-demo-case="<id>"` and a heading.
 * With `lang`, the content sits in a nested Theme in that language and the
 * heading stays outside it, in the gallery's language.
 */
export function DemoCase({ id, title, lang, children }: DemoCaseProps) {
  return (
    <section data-demo="case" data-demo-case={id}>
      <h2 data-demo="title">{title}</h2>
      {lang ? (
        <Theme lang={lang} data-demo="content">
          {children}
        </Theme>
      ) : (
        children
      )}
    </section>
  );
}

/** A wrapping row of items with a small gap, aligned on the center line. */
export function DemoRow({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div data-demo="row">
      {label !== undefined && <span data-demo="label">{label}</span>}
      {children}
    </div>
  );
}

/** A grid of equal cells that fills the line. `min` is the smallest cell width as a CSS length. */
export function DemoGrid({ min, children }: { min?: string; children: ReactNode }) {
  return (
    <div data-demo="grid" style={min ? { gridTemplateColumns: `repeat(auto-fill, minmax(${min}, 1fr))` } : undefined}>
      {children}
    </div>
  );
}

/**
 * Fixed sample copy, so every demo and every screenshot shows the same text.
 * English in sentence case. Arabic in white Saudi dialect, no diacritics,
 * noun form labels, Western digits.
 */
export const sample = {
  en: {
    label: 'Save changes',
    short: 'Draft saved',
    long: 'Your changes are saved to your account. Open the board on any other device to see the same version, with every comment and every reference in place.',
    word: 'Supercalifragilisticexpialidocious',
    items: ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash', 'Spam', 'Starred', 'Important', 'Scheduled', 'All mail', 'Templates', 'Snoozed'],
  },
  ar: {
    label: 'حفظ التغييرات',
    short: 'المسودة محفوظة',
    long: 'لو خلصت من تعديل الملف، احفظه وارجع للوحة عشان تشوف كل التغييرات في مكان واحد. وإذا تبي تشاركه مع فريقك، نزله بصيغة JSON وأرسله لهم، وبيقدرون يفتحونه من أي جهاز.',
    word: 'والمستخدمين',
    items: ['الوارد', 'المسودات', 'المرسلة', 'الأرشيف', 'المحذوفات', 'الرسائل المزعجة', 'المميزة', 'المهمة', 'المجدولة', 'كل الرسائل', 'القوالب', 'المؤجلة'],
  },
} as const;
