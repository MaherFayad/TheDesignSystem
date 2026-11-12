// Demo kit for `<name>.demo.ts` files: the Angular twin of
// packages/react/src/demo/index.tsx. The same DOM (data-demo page, case,
// title, content, row, label), so the same demo.css lays it out, and the
// same sample copy. Not exported from the package barrel.
//
//   <div data-demo="page">
//     <section data-demo="case" data-demo-case="variants" heading="Variants">
//       <div data-demo="row" [label]="'neutral'">...</div>
//     </section>
//     <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
//       <div dsTheme [lang]="'ar'" data-demo="content">...</div>
//     </section>
//   </div>
//
// The selectors are the data-demo attributes themselves, so no marker
// attribute lands in the DOM.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { consumeHostAttributes } from '../internal/host';

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

/**
 * One content case: the section and its heading. For the long-arabic case
 * the demo writes the nested theme itself, as the first child:
 *
 *   <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
 *     <div dsTheme [lang]="'ar'" data-demo="content">...</div>
 *   </section>
 *
 * React's DemoCase renders that Theme around its children. Angular cannot:
 * DI follows the template where content is declared, not where it is
 * projected, so a dsTheme inside this component's template would stamp the
 * attributes (the CSS would follow) but would not be the DI parent of the
 * projected content (a Dialog opened in it would copy the outer theme).
 */
@Component({
  selector: 'section[data-demo=case]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 data-demo="title">{{ heading() }}</h2>
    <ng-content />
  `,
})
export class DemoCase {
  /** A short heading in sentence case. Not `title`: that would be a native title attribute. */
  readonly heading = input.required<string>();

  constructor() {
    consumeHostAttributes(['heading']);
  }
}

/** A wrapping row of items with a small gap, aligned on the center line. */
@Component({
  selector: 'div[data-demo=row]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label() !== undefined) {
      <span data-demo="label">{{ label() }}</span>
    }
    <ng-content />
  `,
})
export class DemoRow {
  readonly label = input<string | undefined>(undefined);

  constructor() {
    consumeHostAttributes(['label']);
  }
}

export const DEMO = [DemoCase, DemoRow] as const;

/**
 * Fixed sample copy, the same as the React demo kit, so every demo and every
 * screenshot shows the same text.
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
