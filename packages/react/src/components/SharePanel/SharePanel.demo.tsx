// SharePanel demo. Cases: variants (system first, and the app's own targets
// with system never), empty (a title and a link only), one (one person),
// many (people, targets and actions), too-many (40 people: the row scrolls
// inline), long-text (long title, names and labels), long-arabic (the same
// in Arabic, rows from the right), disabled (one action that cannot run
// now). No loading, error or readonly: the panel only shows what the app
// passes in.
//
// Every picture is drawn here as an inline svg, our own demo marks: no
// network, no third party logo, icon or name. Targets are the app's own
// places (a trip board, a message in the app), with system icons. The copy
// follows the page language: with lang=ar every case reads Arabic.
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button';
import { isArabic } from '../Popover/FloatingLayer';
import { Toaster } from '../Toast';
import { SharePanel, type ShareAction, type SharePerson, type ShareTarget } from './index';

/** A stand in picture: hills under a sun. Demo only. */
function scene(sky: string, sun: string, hill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${sky}"/><circle cx="44" cy="20" r="9" fill="${sun}"/><path d="M0 64V42c10-8 20-8 30 0s22 8 34-4v26z" fill="${hill}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A stand in portrait. Demo only. */
function portrait(skin: string, back: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${back}"/><circle cx="32" cy="25" r="12" fill="${skin}"/><path d="M10 64c2-14 11-21 22-21s20 7 22 21z" fill="${skin}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const picture = scene('#f2c48d', '#fff4d6', '#b5653a');
const photos = [portrait('#c99a7a', '#3d5a80'), portrait('#8d5b3e', '#98c1d9'), portrait('#e8c4a8', '#5c4d7d')];

const namesEn = ['Sara Alqahtani', 'Omar Haddad', 'Lina Saleh', 'Fahad Alotaibi', 'Noura Alharbi', 'Yousef Kamal', 'Reem Aldosari', 'Tariq Nasser'];
const namesAr = ['سارة القحطاني', 'عمر حداد', 'لينا صالح', 'فهد العتيبي', 'نورة الحربي', 'يوسف كمال', 'ريم الدوسري', 'طارق ناصر'];

function peopleOf(names: string[], count = names.length): SharePerson[] {
  const out: SharePerson[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({ id: `p${i}`, name: names[i % names.length]!, avatar: i % 3 === 2 ? undefined : photos[i % photos.length] });
  }
  return out;
}

const targetsEn: ShareTarget[] = [
  { id: 'board', label: 'Trip board', icon: 'grid' },
  { id: 'message', label: 'Message', icon: 'send' },
  { id: 'email', label: 'Email', icon: 'mail' },
  { id: 'saved', label: 'Saved places', icon: 'star' },
];

const targetsAr: ShareTarget[] = [
  { id: 'board', label: 'لوحة الرحلة', icon: 'grid' },
  { id: 'message', label: 'رسالة', icon: 'send' },
  { id: 'email', label: 'بريد', icon: 'mail' },
  { id: 'saved', label: 'الأماكن المحفوظة', icon: 'star' },
];

const noop = () => {};

const actionsEn: ShareAction[] = [
  { id: 'list', label: 'Add to list', icon: 'list', onSelect: noop },
  { id: 'image', label: 'Save image', icon: 'download', onSelect: noop },
];

const actionsAr: ShareAction[] = [
  { id: 'list', label: 'إضافة للقائمة', icon: 'list', onSelect: noop },
  { id: 'image', label: 'حفظ الصورة', icon: 'download', onSelect: noop },
];

const trip = { title: 'Weekend in AlUla', url: 'https://example.com/trips/alula-weekend', image: picture };
const tripAr = { title: 'عطلة في العلا', url: 'https://example.com/trips/alula-weekend', image: picture };

const words = {
  en: {
    names: namesEn,
    targets: targetsEn,
    actions: actionsEn,
    trip,
    share: 'Share trip',
    send: 'Send trip',
    list: { title: 'Packing list', url: 'https://example.com/lists/packing' },
    shareList: 'Share list',
    text: 'Two nights, three walks and one long dinner.',
    longTitle: 'A long weekend in AlUla with the whole family, three hikes and a night under the stars',
    longPeople: ['Abdulrahman Alabdulkarim', 'Mariam Bint Abdulaziz Alsaud', 'Sara Alqahtani'],
    longBoard: 'Family trips board for next spring',
    message: 'Message',
    longAction: 'Add to the shared packing list',
    addToList: 'Add to list',
    saveImage: 'Save image',
  },
  ar: {
    names: namesAr,
    targets: targetsAr,
    actions: actionsAr,
    trip: tripAr,
    share: 'مشاركة الرحلة',
    send: 'إرسال الرحلة',
    list: { title: 'قائمة الأغراض', url: 'https://example.com/lists/packing' },
    shareList: 'مشاركة القائمة',
    text: 'ليلتين، ثلاث جولات مشي وعشاء طويل.',
    longTitle: 'عطلة طويلة في العلا مع العيلة كلها، ثلاث جولات مشي وليلة تحت النجوم',
    longPeople: ['عبدالرحمن العبدالكريم', 'مريم بنت عبدالعزيز آل سعود', 'سارة القحطاني'],
    longBoard: 'لوحة رحلات العيلة للربيع الجاي',
    message: 'رسالة',
    longAction: 'إضافة لقائمة الأغراض المشتركة',
    addToList: 'إضافة للقائمة',
    saveImage: 'حفظ الصورة',
  },
};

export default function SharePanelDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <Toaster />
      <DemoCase id="variants" title="System sheet first, and the app's own targets">
        <DemoRow>
          <SharePanel item={w.trip} people={peopleOf(w.names, 4)} targets={w.targets} actions={w.actions}>
            <Button data-demo-trigger="prefer" start="share">
              {w.share}
            </Button>
          </SharePanel>
          <SharePanel item={w.trip} people={peopleOf(w.names, 4)} targets={w.targets} actions={w.actions} system="never">
            <Button data-demo-trigger="never" start="send">
              {w.send}
            </Button>
          </SharePanel>
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="A title and a link only">
        <SharePanel item={w.list} system="never">
          <Button data-demo-trigger="empty" start="share">
            {w.shareList}
          </Button>
        </SharePanel>
      </DemoCase>

      <DemoCase id="one" title="One person">
        <SharePanel item={w.trip} people={peopleOf(w.names, 1)} system="never">
          <Button data-demo-trigger="one" start="send">
            {w.send}
          </Button>
        </SharePanel>
      </DemoCase>

      <DemoCase id="many" title="People, targets and actions">
        <SharePanel item={{ ...w.trip, text: w.text }} people={peopleOf(w.names)} targets={w.targets} actions={w.actions} system="never">
          <Button data-demo-trigger="many" start="share">
            {w.share}
          </Button>
        </SharePanel>
      </DemoCase>

      <DemoCase id="too-many" title="40 people: the row scrolls inline">
        <SharePanel item={w.trip} people={peopleOf(w.names, 40)} targets={w.targets} system="never">
          <Button data-demo-trigger="too-many" start="send">
            {w.send}
          </Button>
        </SharePanel>
      </DemoCase>

      <DemoCase id="long-text" title="Long title, names and labels">
        <SharePanel
          item={{ title: w.longTitle, url: 'https://example.com/trips/a-long-weekend-in-alula-with-the-whole-family?from=share', image: picture }}
          people={[
            { id: 'a', name: w.longPeople[0]! },
            { id: 'b', name: w.longPeople[1]! },
            { id: 'c', name: w.longPeople[2]!, avatar: photos[0] },
          ]}
          targets={[
            { id: 'board', label: w.longBoard, icon: 'grid' },
            { id: 'message', label: w.message, icon: 'send' },
          ]}
          actions={[{ id: 'list', label: w.longAction, icon: 'list', onSelect: noop }]}
          system="never"
        >
          <Button data-demo-trigger="long-text" start="share">
            {w.share}
          </Button>
        </SharePanel>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: rows start at the right" lang="ar">
        <SharePanel item={{ ...tripAr, text: 'ليلتين، ثلاث جولات مشي وعشاء طويل.' }} people={peopleOf(namesAr)} targets={targetsAr} actions={actionsAr} system="never">
          <Button data-demo-trigger="long-arabic" start="share">
            مشاركة الرحلة
          </Button>
        </SharePanel>
      </DemoCase>

      <DemoCase id="disabled" title="An action that cannot run now">
        <SharePanel
          item={w.trip}
          targets={w.targets}
          actions={[
            { id: 'list', label: w.addToList, icon: 'list', onSelect: noop },
            { id: 'image', label: w.saveImage, icon: 'download', onSelect: noop, disabled: true },
          ]}
          system="never"
        >
          <Button data-demo-trigger="disabled" start="share">
            {w.share}
          </Button>
        </SharePanel>
      </DemoCase>
    </DemoPage>
  );
}
