// Toast demo. Triggers are Buttons with data-demo-trigger: the contract suite
// clicks the first one to make a toast appear. The variants case also shows
// each tone as a static `Toast`, so the anatomy and the tones are on the page
// before any trigger is clicked.
//
// Language: the Toaster takes its axes from the Theme it is mounted in, so
// it speaks the gallery language. A toast whose copy is in another language
// passes `lang` (the English triggers pass "en", the long-arabic case "ar",
// so English copy never runs right to left in an Arabic gallery): the toast root then
// carries lang and dir, picks the Arabic type and the Arabic close label,
// and still sits in the page's corner. One Toaster per page, never one per
// language.
import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow } from '../../demo';
import { Button } from '../Button';
import { Toast, Toaster, toast, type ToastTone } from './index';

const tones: ToastTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const copy: Record<ToastTone, { title: string; description: string; trigger: string }> = {
  neutral: { title: 'Board duplicated', description: 'The copy is at the top of your boards.', trigger: 'Show neutral toast' },
  info: { title: 'New version ready', description: 'Reload the page to get it.', trigger: 'Show info toast' },
  success: { title: 'Draft saved', description: 'Saved to your account a moment ago.', trigger: 'Show success toast' },
  warning: { title: 'Storage almost full', description: 'You have 200 MB left on this plan.', trigger: 'Show warning toast' },
  danger: { title: 'Could not publish page', description: 'The server did not answer. Your draft is safe.', trigger: 'Show danger toast' },
};

const files = ['brief.pdf', 'hero.png', 'logo.svg', 'notes.md', 'palette.json', 'type.css', 'grid.fig', 'cover.jpg'];

/** A static toast that leaves when its close button is pressed, and a button to bring it back. */
function Specimen({ tone, count }: { tone: ToastTone; count?: number }) {
  const [open, setOpen] = useState(true);
  const c = copy[tone];
  return open ? (
    <Toast lang="en" tone={tone} title={c.title} description={c.description} count={count} onClose={() => setOpen(false)} />
  ) : (
    <Button size="sm" emphasis="ghost" onClick={() => setOpen(true)}>
      Show specimen again
    </Button>
  );
}

function saveDraft() {
  const id = toast({ lang: 'en', title: 'Saving draft', description: 'Your changes are on the way to your account.', duration: Infinity, dedupeKey: false });
  window.setTimeout(() => {
    toast.update(id, { tone: 'success', title: 'Draft saved', description: 'Saved to your account a moment ago.' });
  }, 1500);
}

function failUpload() {
  toast.danger({
    lang: 'en',
    title: 'Could not upload photo.jpg',
    description: 'The connection dropped at 80 percent. The file is still on your device.',
    action: { label: 'Retry upload', onAction: () => toast.success('Upload started again', { lang: 'en' }), altText: 'Upload the file again from the Files panel' },
  });
}

export default function ToastDemo() {
  return (
    <DemoPage>
      <Toaster />

      <DemoCase id="variants" title="Variants: one toast per tone, with an action, with a title and a description">
        <DemoRow>
          {tones.map((tone) => (
            <Button key={tone} data-demo-trigger="" tone={tone} onClick={() => toast({ lang: 'en', tone, title: copy[tone].title })}>
              {copy[tone].trigger}
            </Button>
          ))}
        </DemoRow>
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() =>
              toast({
                lang: 'en',
                title: 'Card moved to Archive',
                action: { label: 'Undo move', onAction: () => toast('Card moved back', { lang: 'en' }), altText: 'Move the card back from the Archive list' },
              })
            }
          >
            Show toast with action
          </Button>
          <Button data-demo-trigger="" onClick={() => toast.info({ lang: 'en', title: copy.info.title, description: copy.info.description })}>
            Show toast with description
          </Button>
        </DemoRow>
        <DemoGrid min="18rem">
          {tones.map((tone) => (
            <Specimen key={tone} tone={tone} count={tone === 'danger' ? 3 : undefined} />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="one" title="One toast">
        <DemoRow>
          <Button data-demo-trigger="" onClick={() => toast.success('Link copied', { lang: 'en' })}>
            Copy link
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many: three toasts at once">
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() => {
              toast.success('Draft saved', { lang: 'en' });
              toast.info('Board shared with Sara', { lang: 'en' });
              toast('Two comments added', { lang: 'en' });
            }}
          >
            Show three toasts
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: eight toasts, three show and the rest wait">
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() => {
              for (const file of files) toast.success({ lang: 'en', title: `${file} uploaded`, dedupeKey: false });
            }}
          >
            Upload eight files
          </Button>
          <Button emphasis="ghost" onClick={() => toast.dismiss()}>
            Close all toasts
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the toast grows and the text wraps in full">
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() =>
              toast.warning({
                lang: 'en',
                title: 'Some references on the board Spring campaign moodboard for the retail launch could not be loaded',
                description:
                  'Twelve images come from sites that block hotlinking. They show as placeholders until you upload a copy. Open each placeholder to see where it came from, then drop the file on it to replace it. Nothing else on the board changed.',
              })
            }
          >
            Show long toast
          </Button>
        </DemoRow>
        <Toast
          lang="en"
          tone="warning"
          title="Some references on the board Spring campaign moodboard for the retail launch could not be loaded"
          description="Twelve images come from sites that block hotlinking. They show as placeholders until you upload a copy. Open each placeholder to see where it came from, then drop the file on it to replace it. Nothing else on the board changed."
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic toasts" lang="ar">
        <DemoRow>
          <Button
            data-demo-trigger=""
            onClick={() =>
              toast.success({ lang: 'ar', title: 'المسودة محفوظة', description: 'انحفظت التغييرات في حسابك قبل شوي.' })
            }
          >
            إظهار تنبيه النجاح
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
            إظهار تنبيه الخطأ
          </Button>
        </DemoRow>
        <Toast
          tone="danger"
          title="تعذر نشر الصفحة"
          description="الخادم ما رد على الطلب، والمسودة محفوظة في حسابك. جرب النشر مرة ثانية بعد شوي، وإذا تكررت المشكلة نزل الملف وأرسله لفريق الدعم."
        />
      </DemoCase>

      <DemoCase id="loading" title="Loading: one toast updated from Saving draft to Draft saved">
        <DemoRow>
          <Button data-demo-trigger="" onClick={saveDraft}>
            Save draft
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error: a danger toast stays until it is closed">
        <DemoRow>
          <Button data-demo-trigger="" tone="danger" onClick={failUpload}>
            Upload photo
          </Button>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
