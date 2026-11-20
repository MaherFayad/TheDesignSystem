// The SwipeActions demo: the same cases, ids and copy as
// packages/react/src/components/SwipeActions/SwipeActions.demo.tsx.
// Names and subjects are made up.
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { consumeHostAttributes } from '../../internal/host';
import { DsButton } from '../button/button';
import { DsList, DsListItem, type ListVariant } from '../list/list';
import { DsSwipeActions, type SwipeAction, type SwipeActionsOptions } from './swipe-actions';

interface Mail {
  id: string;
  from: string;
  subject: string;
  time: string;
}

const inboxEn: Mail[] = [
  { id: 'm1', from: 'Sara Alqahtani', subject: 'Brand review moved to Thursday', time: '09:24' },
  { id: 'm2', from: 'Omar Alharbi', subject: 'Invoice 2041 is ready to download', time: '08:10' },
  { id: 'm3', from: 'Design team', subject: 'New comments on the onboarding board', time: 'Mon' },
  { id: 'm4', from: 'Lama Alotaibi', subject: 'Photos from the site visit', time: 'Sun' },
];

const inboxAr: Mail[] = [
  { id: 'a1', from: 'سارة القحطاني', subject: 'تأجيل مراجعة الهوية ليوم الخميس', time: '09:24' },
  { id: 'a2', from: 'عمر الحربي', subject: 'الفاتورة 2041 جاهزة للتنزيل', time: '08:10' },
  { id: 'a3', from: 'فريق التصميم', subject: 'تعليقات جديدة على لوحة التعريف بالتطبيق', time: 'الاثنين' },
];

const words = {
  en: {
    del: 'Delete',
    mute: 'Mute',
    pin: 'Pin',
    archive: 'Archive',
    read: 'Mark read',
    menu: (from: string) => `Actions for ${from}`,
    done: (verb: string, from: string) => `${verb}: ${from}`,
    reset: 'Reset inbox',
    inbox: 'Inbox',
  },
  ar: {
    del: 'حذف',
    mute: 'كتم',
    pin: 'تثبيت',
    archive: 'أرشفة',
    read: 'تعليم كمقروءة',
    menu: (from: string) => `خيارات رسالة ${from}`,
    done: (verb: string, from: string) => `${verb}: ${from}`,
    reset: 'استرجاع الوارد',
    inbox: 'الوارد',
  },
} as const;

/** A small inbox whose swipe actions work: delete and archive remove the row, the rest say what ran. React's Inbox. */
@Component({
  selector: 'div[dsDemoInbox]',
  imports: [DsList, DsListItem, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: grid; gap: var(--ds-space-xs)' },
  template: `
    <ul dsList [variant]="variant()" [attr.aria-label]="label() ?? w().inbox">
      @for (m of rows(); track m.id) {
        <li dsListItem [href]="'#' + m.id" start="mail" [title]="m.from" [description]="m.subject" [end]="m.time" [swipe]="swipeOf(m)"></li>
      }
    </ul>
    <p role="status" style="margin: 0; min-block-size: 1.5em; color: var(--ds-color-text-muted)">{{ last() }}</p>
    @if (rows().length < source().length) {
      <div><button dsButton size="sm" (click)="reset()">{{ w().reset }}</button></div>
    }
  `,
})
export class DemoInbox {
  readonly lang = input<'en' | 'ar'>('en');
  readonly variant = input<ListVariant>('inset');
  readonly mail = input<Mail[] | undefined>(undefined);
  readonly sides = input<'both' | 'end'>('both');
  readonly fullStart = input(false);
  readonly pointer = input(false);
  readonly label = input<string | undefined>(undefined);

  protected readonly w = computed(() => words[this.lang()]);
  protected readonly source = computed(() => this.mail() ?? (this.lang() === 'ar' ? inboxAr : inboxEn));
  private readonly removed = signal<ReadonlySet<string>>(new Set());
  protected readonly rows = computed(() => this.source().filter((m) => !this.removed().has(m.id)));
  protected readonly last = signal('');
  private readonly options = new Map<string, SwipeActionsOptions>();

  constructor() {
    consumeHostAttributes(['dsDemoInbox', 'lang', 'variant', 'mail', 'sides', 'fullStart', 'pointer', 'label']);
  }

  /** The options of one row, kept, so the row's swipe input does not change on every pass. */
  protected swipeOf(m: Mail): SwipeActionsOptions {
    const known = this.options.get(m.id);
    if (known) return known;
    const w = this.w();
    const remove = (verb: string) => {
      this.removed.update((s) => new Set([...s, m.id]));
      this.last.set(w.done(verb, m.from));
    };
    const note = (verb: string) => this.last.set(w.done(verb, m.from));
    const start: SwipeAction[] = [
      { label: w.archive, icon: 'inbox', tone: 'accent', undoable: true, onSelect: () => remove(w.archive) },
      { label: w.read, icon: 'mail', onSelect: () => note(w.read) },
    ];
    const end: SwipeAction[] = [
      { label: w.del, icon: 'trash', tone: 'danger', onSelect: () => remove(w.del) },
      { label: w.pin, icon: 'star', tone: 'warning', onSelect: () => note(w.pin) },
      { label: w.mute, icon: 'bell-off', onSelect: () => note(w.mute) },
    ];
    const value: SwipeActionsOptions = {
      start: this.sides() === 'both' ? start : undefined,
      end,
      fullSwipe: this.fullStart() ? 'start' : undefined,
      pointer: this.pointer(),
      menuLabel: w.menu(m.from),
    };
    this.options.set(m.id, value);
    return value;
  }

  protected reset(): void {
    this.removed.set(new Set());
  }
}

const noop = () => undefined;

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsTheme, DsList, DsListItem, DsSwipeActions, DemoInbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: actions on both sides in an inset list, end only in a divided list, and content outside a list">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));">
        <div dsDemoInbox label="Inbox, inset"></div>
        <div dsDemoInbox variant="divided" sides="end" label="Inbox, divided" [pointer]="true"></div>
        <div style="display: grid; gap: var(--ds-space-xs); align-content: start">
          <div dsSwipeActions menuLabel="Actions for the draft of the launch note" [end]="draftEnd" [start]="draftStart">
            <div style="padding: var(--ds-space-s)">
              <strong>Launch note</strong>
              <div style="color: var(--ds-color-text-muted)">Draft, edited 2 minutes ago</div>
            </div>
          </div>
          <p role="status" style="margin: 0; color: var(--ds-color-text-muted)">{{ note() }}</p>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One row">
      <div style="max-inline-size: 24rem">
        <div dsDemoInbox [mail]="one"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: delete removes the row, a full swipe toward the start archives it">
      <div style="max-inline-size: 26rem">
        <div dsDemoInbox [fullStart]="true" [mail]="many"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: four end actions given, three kept">
      <div style="max-inline-size: 24rem">
        <ul dsList variant="inset" aria-label="Saved items">
          <li dsListItem href="#saved-1" start="file" title="Field guide to desert plants" description="Saved from the reading list" [swipe]="tooMany"></li>
        </ul>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text">
      <div style="max-inline-size: 22rem">
        <ul dsList variant="inset" aria-label="Long rows">
          <li
            dsListItem
            href="#long-1"
            start="mail"
            title="Quarterly brand guidelines review with the regional marketing teams and the agency"
            description="Your changes are saved to your account. Open the board on any other device to see the same version."
            end="12:40"
            [swipe]="longText"
          ></li>
        </ul>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: 26rem">
          <div dsDemoInbox lang="ar" [mail]="longArabic"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled row: no swipe and no menu">
      <div style="max-inline-size: 24rem">
        <ul dsList variant="inset" aria-label="Boards">
          <li dsListItem href="#board-open" start="grid" title="Brand board" description="Open" [swipe]="brand"></li>
          <li dsListItem href="#board-locked" start="lock" title="Finance board" description="You need access from an admin" disabled [swipe]="finance"></li>
        </ul>
      </div>
    </section>
  `,
})
export default class SwipeActionsDemo {
  protected readonly note = signal('');
  protected readonly draftEnd: SwipeAction[] = [
    { label: 'Delete', icon: 'trash', tone: 'danger', onSelect: () => this.note.set('Delete: launch note') },
    { label: 'Pin', icon: 'star', tone: 'warning', onSelect: () => this.note.set('Pin: launch note') },
  ];
  protected readonly draftStart: SwipeAction[] = [{ label: 'Send', icon: 'send', tone: 'accent', onSelect: () => this.note.set('Send: launch note') }];
  protected readonly one = inboxEn.slice(0, 1);
  protected readonly many: Mail[] = [...inboxEn, { id: 'm5', from: 'Yousef Alzahrani', subject: 'Contract for the March shoot', time: '12 Mar' }];
  protected readonly longArabic: Mail[] = [
    ...inboxAr,
    {
      id: 'a4',
      from: 'لمى العتيبي من فريق المبيعات في المنطقة الشرقية',
      subject: 'صور زيارة الموقع مع ملاحظات الفريق عن الإضاءة وأماكن التصوير في المبنى الجديد',
      time: '12:40',
    },
  ];
  protected readonly tooMany: SwipeActionsOptions = {
    menuLabel: 'Actions for Field guide to desert plants',
    end: [
      { label: 'Delete', icon: 'trash', tone: 'danger', onSelect: noop },
      { label: 'Pin', icon: 'star', tone: 'warning', onSelect: noop },
      { label: 'Mute', icon: 'bell-off', onSelect: noop },
      { label: 'Share', icon: 'send', onSelect: noop },
    ],
  };
  protected readonly longText: SwipeActionsOptions = {
    menuLabel: 'Actions for the quarterly brand guidelines review',
    start: [{ label: 'Mark read', icon: 'mail', onSelect: noop }],
    end: [
      { label: 'Delete', icon: 'trash', tone: 'danger', onSelect: noop },
      { label: 'Mute notifications', icon: 'bell-off', onSelect: noop },
    ],
  };
  protected readonly brand: SwipeActionsOptions = { menuLabel: 'Actions for Brand board', end: [{ label: 'Delete', icon: 'trash', tone: 'danger', onSelect: noop }] };
  protected readonly finance: SwipeActionsOptions = { menuLabel: 'Actions for Finance board', end: [{ label: 'Delete', icon: 'trash', tone: 'danger', onSelect: noop }] };
}
