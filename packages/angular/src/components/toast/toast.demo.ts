// The Toast demo: the same cases, ids and copy as
// packages/react/src/components/Toast/Toast.demo.tsx. Triggers are Buttons
// with data-demo-trigger: the contract suite clicks the first one to make a
// toast appear. The variants case also shows each tone as a static dsToast.
// One toaster per page, mounted in the gallery theme; a toast whose copy is
// in another language passes lang.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsToast, type ToastTone } from './toast';
import { DsToaster } from './toaster';
import { toast } from '@the-system/shared';

const tones: ToastTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const copy: Record<ToastTone, { title: string; description: string; trigger: string }> = {
  neutral: { title: 'Board duplicated', description: 'The copy is at the top of your boards.', trigger: 'Show neutral toast' },
  info: { title: 'New version ready', description: 'Reload the page to get it.', trigger: 'Show info toast' },
  success: { title: 'Draft saved', description: 'Saved to your account a moment ago.', trigger: 'Show success toast' },
  warning: { title: 'Storage almost full', description: 'You have 200 MB left on this plan.', trigger: 'Show warning toast' },
  danger: { title: 'Could not publish page', description: 'The server did not answer. Your draft is safe.', trigger: 'Show danger toast' },
};

const files = ['brief.pdf', 'hero.png', 'logo.svg', 'notes.md', 'palette.json', 'type.css', 'grid.fig', 'cover.jpg'];

const longTitle = 'Some references on the board Spring campaign moodboard for the retail launch could not be loaded';
const longDescription =
  'Twelve images come from sites that block hotlinking. They show as placeholders until you upload a copy. Open each placeholder to see where it came from, then drop the file on it to replace it. Nothing else on the board changed.';

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsButton, DsTheme, DsToast, DsToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container dsToaster />

    <section data-demo="case" data-demo-case="variants" heading="Variants: one toast per tone, with an action, with a title and a description">
      <div data-demo="row">
        @for (tone of tones; track tone) {
          <button dsButton data-demo-trigger="" [tone]="tone" (click)="showTone(tone)">{{ copy[tone].trigger }}</button>
        }
      </div>
      <div data-demo="row">
        <button dsButton data-demo-trigger="" (click)="showAction()">Show toast with action</button>
        <button dsButton data-demo-trigger="" (click)="showDescription()">Show toast with description</button>
      </div>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr))">
        @for (tone of tones; track tone) {
          @if (open()[tone]) {
            <div dsToast lang="en" [tone]="tone" [title]="copy[tone].title" [description]="copy[tone].description"
              [count]="tone === 'danger' ? 3 : undefined" [onClose]="hideFns[tone]"></div>
          } @else {
            <button dsButton size="sm" emphasis="ghost" (click)="setOpen(tone, true)">Show specimen again</button>
          }
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One toast">
      <div data-demo="row">
        <button dsButton data-demo-trigger="" (click)="copyLink()">Copy link</button>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: three toasts at once">
      <div data-demo="row">
        <button dsButton data-demo-trigger="" (click)="showThree()">Show three toasts</button>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: eight toasts, three show and the rest wait">
      <div data-demo="row">
        <button dsButton data-demo-trigger="" (click)="uploadEight()">Upload eight files</button>
        <button dsButton emphasis="ghost" (click)="dismissAll()">Close all toasts</button>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text: the toast grows and the text wraps in full">
      <div data-demo="row">
        <button dsButton data-demo-trigger="" (click)="showLong()">Show long toast</button>
      </div>
      <div dsToast lang="en" tone="warning" [title]="longTitle" [description]="longDescription"></div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Arabic toasts">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <button dsButton data-demo-trigger="" (click)="showArabicSuccess()">إظهار تنبيه النجاح</button>
          <button dsButton data-demo-trigger="" (click)="showArabicDanger()">إظهار تنبيه الخطأ</button>
        </div>
        <div dsToast tone="danger" title="تعذر نشر الصفحة"
          description="الخادم ما رد على الطلب، والمسودة محفوظة في حسابك. جرب النشر مرة ثانية بعد شوي، وإذا تكررت المشكلة نزل الملف وأرسله لفريق الدعم."></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: one toast updated from Saving draft to Draft saved">
      <div data-demo="row">
        <button dsButton data-demo-trigger="" (click)="saveDraft()">Save draft</button>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: a danger toast stays until it is closed">
      <div data-demo="row">
        <button dsButton data-demo-trigger="" tone="danger" (click)="failUpload()">Upload photo</button>
      </div>
    </section>
  `,
})
export default class ToastDemo {
  protected readonly tones = tones;
  protected readonly copy = copy;
  protected readonly longTitle = longTitle;
  protected readonly longDescription = longDescription;
  protected readonly open = signal<Record<ToastTone, boolean>>({ neutral: true, info: true, success: true, warning: true, danger: true });
  /** One stable close handler per specimen, so the input does not change on every render. */
  protected readonly hideFns = Object.fromEntries(tones.map((t) => [t, () => this.setOpen(t, false)])) as Record<ToastTone, () => void>;

  protected setOpen(tone: ToastTone, value: boolean): void {
    this.open.update((o) => ({ ...o, [tone]: value }));
  }

  protected showTone(tone: ToastTone): void {
    toast({ lang: 'en', tone, title: copy[tone].title });
  }

  protected showAction(): void {
    toast({
      lang: 'en',
      title: 'Card moved to Archive',
      action: { label: 'Undo move', onAction: () => toast('Card moved back', { lang: 'en' }), altText: 'Move the card back from the Archive list' },
    });
  }

  protected showDescription(): void {
    toast.info({ lang: 'en', title: copy.info.title, description: copy.info.description });
  }

  protected copyLink(): void {
    toast.success('Link copied', { lang: 'en' });
  }

  protected showThree(): void {
    toast.success('Draft saved', { lang: 'en' });
    toast.info('Board shared with Sara', { lang: 'en' });
    toast('Two comments added', { lang: 'en' });
  }

  protected uploadEight(): void {
    for (const file of files) toast.success({ lang: 'en', title: `${file} uploaded`, dedupeKey: false });
  }

  protected dismissAll(): void {
    toast.dismiss();
  }

  protected showLong(): void {
    toast.warning({ lang: 'en', title: longTitle, description: longDescription });
  }

  protected showArabicSuccess(): void {
    toast.success({ lang: 'ar', title: 'المسودة محفوظة', description: 'انحفظت التغييرات في حسابك قبل شوي.' });
  }

  protected showArabicDanger(): void {
    toast.danger({
      lang: 'ar',
      title: 'تعذر نشر الصفحة',
      description:
        'الخادم ما رد على الطلب، والمسودة محفوظة في حسابك. جرب النشر مرة ثانية بعد شوي، وإذا تكررت المشكلة نزل الملف وأرسله لفريق الدعم عشان يراجعونه.',
      action: { label: 'إعادة النشر', onAction: () => toast({ lang: 'ar', title: 'بدأ النشر من جديد' }), altText: 'إعادة النشر من قائمة الملف' },
    });
  }

  protected saveDraft(): void {
    const id = toast({ lang: 'en', title: 'Saving draft', description: 'Your changes are on the way to your account.', duration: Infinity, dedupeKey: false });
    window.setTimeout(() => {
      toast.update(id, { tone: 'success', title: 'Draft saved', description: 'Saved to your account a moment ago.' });
    }, 1500);
  }

  protected failUpload(): void {
    toast.danger({
      lang: 'en',
      title: 'Could not upload photo.jpg',
      description: 'The connection dropped at 80 percent. The file is still on your device.',
      action: {
        label: 'Retry upload',
        onAction: () => toast.success('Upload started again', { lang: 'en' }),
        altText: 'Upload the file again from the Files panel',
      },
    });
  }
}
