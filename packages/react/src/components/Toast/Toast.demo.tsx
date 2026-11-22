// Toast demo. Triggers are Buttons with data-demo-trigger: the contract suite
// clicks the first one to make a toast appear. The variants case also shows
// each tone as a static `Toast`, so the anatomy and the tones are on the page
// before any trigger is clicked.
//
// Language: the Toaster takes its axes from the Theme it is mounted in, so
// it speaks the gallery language. A toast whose copy is in another language
// passes `lang` (every case passes the page language, the long-arabic case
// "ar", so English copy never runs right to left in an Arabic gallery and
// with lang=ar every case reads Arabic): the toast root then
// carries lang and dir, picks the Arabic type and the Arabic close label,
// and still sits in the page's corner. One Toaster per page, never one per
// language.
//
// The banner (order M9.8, proposed): start leads the toast with an Avatar
// (initials only, no photo) or a system icon, meta carries the time, and on
// ios a timed toast has no close button. The danger banner keeps its close
// button on every platform.
import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button';
import { isArabic } from '../Popover/FloatingLayer';
import { Toast, Toaster, toast, type ToastTone } from './index';

type Lang = 'en' | 'ar';

const tones: ToastTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const words = {
  en: {
    tones: {
      neutral: { title: 'Board duplicated', description: 'The copy is at the top of your boards.', trigger: 'Show neutral toast' },
      info: { title: 'New version ready', description: 'Reload the page to get it.', trigger: 'Show info toast' },
      success: { title: 'Draft saved', description: 'Saved to your account a moment ago.', trigger: 'Show success toast' },
      warning: { title: 'Storage almost full', description: 'You have 200 MB left on this plan.', trigger: 'Show warning toast' },
      danger: { title: 'Could not publish page', description: 'The server did not answer. Your draft is safe.', trigger: 'Show danger toast' },
    } as Record<ToastTone, { title: string; description: string; trigger: string }>,
    person: 'Sara Haddad',
    message: 'The new floor plan is in the shared folder. Can you check the kitchen wall before the call?',
    invoice: 'Invoice sent to Omar',
    invoiceNote: 'He gets a copy by email.',
    yesterday: 'Yesterday',
    now: 'now',
    replyFailed: 'Could not send your reply to Sara',
    offline: 'You are offline. The reply is kept as a draft.',
    again: 'Show specimen again',
    saving: 'Saving draft',
    savingNote: 'Your changes are on the way to your account.',
    uploadFailed: 'Could not upload photo.jpg',
    uploadNote: 'The connection dropped at 80 percent. The file is still on your device.',
    retry: 'Retry upload',
    retried: 'Upload started again',
    retryAlt: 'Upload the file again from the Files panel',
    moved: 'Card moved to Archive',
    undo: 'Undo move',
    movedBack: 'Card moved back',
    undoAlt: 'Move the card back from the Archive list',
    withAction: 'Show toast with action',
    withDescription: 'Show toast with description',
    banner: 'Show message banner',
    quiet: 'Show banner without close button',
    dangerBanner: 'Show danger banner',
    copied: 'Link copied',
    copy: 'Copy link',
    shared: 'Board shared with Sara',
    comments: 'Two comments added',
    three: 'Show three toasts',
    uploaded: (file: string) => `${file} uploaded`,
    eight: 'Upload eight files',
    closeAll: 'Close all toasts',
    longTitle: 'Some references on the board Spring campaign moodboard for the retail launch could not be loaded',
    longDescription:
      'Twelve images come from sites that block hotlinking. They show as placeholders until you upload a copy. Open each placeholder to see where it came from, then drop the file on it to replace it. Nothing else on the board changed.',
    showLong: 'Show long toast',
    saveDraft: 'Save draft',
    uploadPhoto: 'Upload photo',
  },
  ar: {
    tones: {
      neutral: { title: 'اللوحة صار لها نسخة', description: 'النسخة في أول لوحاتك.', trigger: 'إظهار إشعار عادي' },
      info: { title: 'فيه إصدار جديد', description: 'حدث الصفحة عشان يوصلك.', trigger: 'إظهار إشعار معلومة' },
      success: { title: 'المسودة محفوظة', description: 'انحفظت في حسابك قبل شوي.', trigger: 'إظهار إشعار نجاح' },
      warning: { title: 'المساحة قربت تخلص', description: 'باقي لك 200 ميجابايت في هذه الباقة.', trigger: 'إظهار إشعار تحذير' },
      danger: { title: 'تعذر نشر الصفحة', description: 'الخادم ما رد، والمسودة محفوظة.', trigger: 'إظهار إشعار خطأ' },
    } as Record<ToastTone, { title: string; description: string; trigger: string }>,
    person: 'سارة الحداد',
    message: 'مخطط الدور الجديد في المجلد المشترك. تقدر تراجع جدار المطبخ قبل المكالمة؟',
    invoice: 'الفاتورة وصلت عمر',
    invoiceNote: 'بتوصله نسخة على البريد.',
    yesterday: 'أمس',
    now: 'الحين',
    replyFailed: 'تعذر إرسال ردك لسارة',
    offline: 'أنت غير متصل، والرد محفوظ كمسودة.',
    again: 'إظهار النموذج مرة ثانية',
    saving: 'حفظ المسودة جار',
    savingNote: 'تعديلاتك في الطريق لحسابك.',
    uploadFailed: 'تعذر رفع photo.jpg',
    uploadNote: 'الاتصال انقطع عند 80 بالمية، والملف باقي في جهازك.',
    retry: 'إعادة الرفع',
    retried: 'الرفع بدأ من جديد',
    retryAlt: 'رفع الملف مرة ثانية من قائمة الملفات',
    moved: 'البطاقة في الأرشيف',
    undo: 'تراجع عن النقل',
    movedBack: 'البطاقة رجعت',
    undoAlt: 'إرجاع البطاقة من قائمة الأرشيف',
    withAction: 'إظهار إشعار مع إجراء',
    withDescription: 'إظهار إشعار مع وصف',
    banner: 'إظهار إشعار الرسالة',
    quiet: 'إظهار إشعار بدون زر إغلاق',
    dangerBanner: 'إظهار إشعار الخطأ',
    copied: 'الرابط منسوخ',
    copy: 'نسخ الرابط',
    shared: 'اللوحة انرسلت لسارة',
    comments: 'تعليقين جداد',
    three: 'إظهار 3 إشعارات',
    uploaded: (file: string) => `${file} انرفع`,
    eight: 'رفع 8 ملفات',
    closeAll: 'إغلاق كل الإشعارات',
    longTitle: 'بعض المراجع في لوحة أفكار حملة الربيع لإطلاق المتاجر ما انحملت',
    longDescription:
      '12 صورة من مواقع تمنع الربط المباشر، وبتطلع كأماكن فاضية لين ترفع نسخة منها. افتح كل مكان فاضي عشان تشوف مصدره، وبعدين اسحب الملف عليه عشان يتبدل. باقي اللوحة ما تغير فيها شي.',
    showLong: 'إظهار إشعار طويل',
    saveDraft: 'حفظ المسودة',
    uploadPhoto: 'رفع الصورة',
  },
};

type Words = (typeof words)['en'];

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000);

function showMessage(w: Words, lang: Lang) {
  toast({
    lang,
    start: { avatar: { name: w.person } },
    title: w.person,
    description: w.message,
    meta: new Date(),
    dedupeKey: false,
  });
}

function showQuietBanner(w: Words, lang: Lang) {
  toast({
    lang,
    start: 'mail',
    title: w.invoice,
    description: w.invoiceNote,
    meta: minutesAgo(5),
    closable: false,
  });
}

function showDangerBanner(w: Words, lang: Lang) {
  toast.danger({
    lang,
    start: { avatar: { name: w.person } },
    title: w.replyFailed,
    description: w.offline,
    meta: new Date(),
    // Ignored: a danger toast stays until closed, so it keeps its close button.
    closable: false,
  });
}

function showArabicMessage() {
  toast({
    lang: 'ar',
    start: { avatar: { name: 'سارة الحداد' } },
    title: 'سارة الحداد',
    description: 'مخطط الدور الجديد في المجلد المشترك. تقدر تراجع جدار المطبخ قبل المكالمة؟',
    meta: new Date(),
    dedupeKey: false,
  });
}

const files = ['brief.pdf', 'hero.png', 'logo.svg', 'notes.md', 'palette.json', 'type.css', 'grid.fig', 'cover.jpg'];

/** A static toast that leaves when its close button is pressed, and a button to bring it back. */
function Specimen({ tone, count, w, lang }: { tone: ToastTone; count?: number; w: Words; lang: Lang }) {
  const [open, setOpen] = useState(true);
  const c = w.tones[tone];
  return open ? (
    <Toast lang={lang} tone={tone} title={c.title} description={c.description} count={count} onClose={() => setOpen(false)} />
  ) : (
    <Button size="sm" emphasis="ghost" onClick={() => setOpen(true)}>
      {w.again}
    </Button>
  );
}

function saveDraft(w: Words, lang: Lang) {
  const id = toast({ lang, title: w.saving, description: w.savingNote, duration: Infinity, dedupeKey: false });
  window.setTimeout(() => {
    toast.update(id, { tone: 'success', title: w.tones.success.title, description: w.tones.success.description });
  }, 1500);
}

function failUpload(w: Words, lang: Lang) {
  toast.danger({
    lang,
    title: w.uploadFailed,
    description: w.uploadNote,
    action: { label: w.retry, onAction: () => toast.success(w.retried, { lang }), altText: w.retryAlt },
  });
}

export default function ToastDemo() {
  const lang: Lang = isArabic(useTheme().lang) ? 'ar' : 'en';
  const w = words[lang];
  return (
    <DemoPage>
      <Toaster />

      <DemoCase id="variants" title="Variants: one toast per tone, with an action, with a title and a description">
        <DemoRow>
          {tones.map((tone) => (
            <Button key={tone} data-demo-trigger="" tone={tone} onClick={() => toast({ lang, tone, title: w.tones[tone].title })}>
              {w.tones[tone].trigger}
            </Button>
          ))}
        </DemoRow>
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() =>
              toast({
                lang,
                title: w.moved,
                action: { label: w.undo, onAction: () => toast(w.movedBack, { lang }), altText: w.undoAlt },
              })
            }
          >
            {w.withAction}
          </Button>
          <Button data-demo-trigger="" onClick={() => toast.info({ lang, title: w.tones.info.title, description: w.tones.info.description })}>
            {w.withDescription}
          </Button>
        </DemoRow>
        <DemoGrid min="18rem">
          {tones.map((tone) => (
            <Specimen key={tone} tone={tone} count={tone === 'danger' ? 3 : undefined} w={w} lang={lang} />
          ))}
        </DemoGrid>
        <DemoRow>
          <Button data-demo-trigger="banner" onClick={() => showMessage(w, lang)}>
            {w.banner}
          </Button>
          <Button data-demo-trigger="banner-quiet" onClick={() => showQuietBanner(w, lang)}>
            {w.quiet}
          </Button>
          <Button data-demo-trigger="banner-danger" tone="danger" onClick={() => showDangerBanner(w, lang)}>
            {w.dangerBanner}
          </Button>
        </DemoRow>
        <DemoGrid min="18rem">
          <Toast lang={lang} start={{ avatar: { name: w.person } }} title={w.person} description={w.message} meta={minutesAgo(2)} />
          <Toast lang={lang} start="mail" title={w.invoice} description={w.invoiceNote} meta={w.yesterday} />
          <Toast
            lang={lang}
            tone="danger"
            start={{ avatar: { name: w.person } }}
            title={w.replyFailed}
            description={w.offline}
            meta={w.now}
            onClose={() => undefined}
          />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="one" title="One toast">
        <DemoRow>
          <Button data-demo-trigger="" onClick={() => toast.success(w.copied, { lang })}>
            {w.copy}
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many: three toasts at once">
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() => {
              toast.success(w.tones.success.title, { lang });
              toast.info(w.shared, { lang });
              toast(w.comments, { lang });
            }}
          >
            {w.three}
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: eight toasts, three show and the rest wait">
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() => {
              for (const file of files) toast.success({ lang, title: w.uploaded(file), dedupeKey: false });
            }}
          >
            {w.eight}
          </Button>
          <Button emphasis="ghost" onClick={() => toast.dismiss()}>
            {w.closeAll}
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the toast grows and the text wraps in full">
        <DemoRow>
          <Button data-demo-trigger="" onClick={() => toast.warning({ lang, title: w.longTitle, description: w.longDescription })}>
            {w.showLong}
          </Button>
        </DemoRow>
        <Toast lang={lang} tone="warning" title={w.longTitle} description={w.longDescription} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic toasts" lang="ar">
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() =>
              toast.success({ lang: 'ar', title: 'المسودة محفوظة', description: 'انحفظت التغييرات في حسابك قبل شوي.' })
            }
          >
            إظهار إشعار النجاح
          </Button>
          <Button
            data-demo-trigger=""
            onClick={() =>
              toast.danger({
                lang: 'ar',
                title: 'تعذر نشر الصفحة',
                description:
                  'الخادم ما رد على الطلب، والمسودة محفوظة في حسابك. جرب النشر مرة ثانية بعد شوي، وإذا تكررت المشكلة نزل الملف وأرسله لفريق الدعم عشان يراجعونه.',
                action: { label: 'إعادة النشر', onAction: () => toast({ lang: 'ar', title: 'بدأ النشر من جديد' }), altText: 'إعادة النشر من قائمة الملف' },
              })
            }
          >
            إظهار إشعار الخطأ
          </Button>
          <Button data-demo-trigger="banner-ar" onClick={showArabicMessage}>
            إظهار إشعار الرسالة
          </Button>
        </DemoRow>
        <Toast
          lang="ar"
          start={{ avatar: { name: 'سارة الحداد' } }}
          title="سارة الحداد"
          description="مخطط الدور الجديد في المجلد المشترك. تقدر تراجع جدار المطبخ قبل المكالمة؟"
          meta={minutesAgo(5)}
        />
        <Toast
          tone="danger"
          title="تعذر نشر الصفحة"
          description="الخادم ما رد على الطلب، والمسودة محفوظة في حسابك. جرب النشر مرة ثانية بعد شوي، وإذا تكررت المشكلة نزل الملف وأرسله لفريق الدعم."
        />
      </DemoCase>

      <DemoCase id="loading" title="Loading: one toast updated from Saving draft to Draft saved">
        <DemoRow>
          <Button data-demo-trigger="" onClick={() => saveDraft(w, lang)}>
            {w.saveDraft}
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error: a danger toast stays until it is closed">
        <DemoRow>
          <Button data-demo-trigger="" tone="danger" onClick={() => failUpload(w, lang)}>
            {w.uploadPhoto}
          </Button>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
