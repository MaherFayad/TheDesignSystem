// List demo. Cases: variants, empty, one, many, too-many, long-text,
// long-arabic, disabled. Sections (order M9.2) show in variants (each
// variant), many (settings groups with headers and footers) and
// long-arabic. Variants also shows swipe rows (order M9.7); the
// SwipeActions demo has the full set. Order C1: variants shows flush lists,
// rows that act in place (onSelect) beside large covers, a linked row with no
// chevron and a control row; long-text and long-arabic show wrapped titles
// (titleLines) and a row footer; disabled shows a disabled action row. No
// loading, error or readonly: a list that loads shows Skeleton rows, and a
// failed load is the page's message.
//
// The copy follows the page language: with lang=ar every case reads Arabic.
// Names, subjects and song titles are user content, so their text sits in a
// span with dir="auto": a Latin subject in an Arabic list keeps its full stop
// at its own end.
import { useState, type ReactNode } from 'react';
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Bidi } from '../../theme/Bidi';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { ActionSheet, ActionSheetAction, ActionSheetContent, ActionSheetTrigger } from '../ActionSheet';
import { isArabic } from '../Popover/FloatingLayer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../DropdownMenu';
import { Slider } from '../Slider';
import { SwipeActions } from '../SwipeActions';
import { List, ListItem, ListSection, type ListSize, type ListVariant } from './index';

const variants: ListVariant[] = ['plain', 'divided', 'inset', 'flush'];
const sizes: ListSize[] = ['md', 'sm'];

const mail = [
  { from: 'Sara Alqahtani', subject: 'Brand review moved to Thursday', time: '09:24', icon: 'mail' as const },
  { from: 'Omar Alharbi', subject: 'Invoice 2041 is ready to download', time: 'Yesterday', icon: 'file' as const },
  { from: 'Design team', subject: 'New comments on the onboarding board', time: 'Mon', icon: 'bell' as const },
];

const mailAr = [
  { from: 'سارة القحطاني', subject: 'تأجيل مراجعة الهوية ليوم الخميس', time: '09:24', icon: 'mail' as const },
  { from: 'عمر الحربي', subject: 'الفاتورة 2041 جاهزة للتنزيل', time: 'أمس', icon: 'file' as const },
];

/** User text: its direction from its own first strong letter. */
function User({ children }: { children: ReactNode }) {
  return <span dir="auto">{children}</span>;
}

const mailArAll = [...mailAr, { from: 'فريق التصميم', subject: 'تعليقات جديدة على لوحة التعريف بالتطبيق', time: 'الاثنين', icon: 'bell' as const }];

function MailRows({ items, actions = true, lang = 'en' }: { items: typeof mail; actions?: boolean; lang?: 'en' | 'ar' }) {
  return (
    <>
      {items.map((m, i) => (
        <ListItem
          key={m.from}
          href={`#mail-${i}`}
          start={m.icon}
          title={<User>{m.from}</User>}
          description={<User>{m.subject}</User>}
          end={m.time}
          active={i === 0}
          actions={
            actions ? (
              <IconButton size="xs" icon="trash" label={lang === 'ar' ? `حذف رسالة ${m.from}` : `Delete mail from ${m.from}`} />
            ) : undefined
          }
        />
      ))}
    </>
  );
}

const songs = [
  { id: 'amber', title: 'Amber gate', artist: 'Maha Saleh' },
  { id: 'blue', title: 'Blue Diriyah', artist: 'Night Caravan' },
  { id: 'cardamom', title: 'Cardamom morning', artist: 'Juniper Trio' },
];

const songsAr = [
  { id: 'amber-ar', title: 'بوابة العنبر', artist: 'مها صالح' },
  { id: 'blue-ar', title: 'الدرعية الزرقاء', artist: 'قافلة الليل' },
];

/** Rows that act in place: a tap plays the song, no link and no chevron. A large cover, so the hairline clears it. */
function SongRows({ items, lang = 'en' }: { items: typeof songs; lang?: 'en' | 'ar' }) {
  const [playing, setPlaying] = useState(items[0]?.id);
  return (
    <List variant="flush" aria-label={lang === 'ar' ? 'الأغاني' : 'Songs'}>
      {items.map((song) => (
        <ListItem
          key={song.id}
          start={<Avatar name={song.title} size="lg" decorative />}
          title={<User>{song.title}</User>}
          description={<User>{song.artist}</User>}
          active={song.id === playing}
          onSelect={() => setPlaying(song.id)}
          actions={<IconButton size="sm" emphasis="ghost" icon="more" label={lang === 'ar' ? `خيارات ${song.title}` : `More for ${song.title}`} />}
        />
      ))}
    </List>
  );
}

function VolumeRow({ lang = 'en' }: { lang?: 'en' | 'ar' }) {
  const [volume, setVolume] = useState(60);
  return (
    <ListItem
      start="bell-off"
      end={<Icon name="bell" size="md" />}
      control={<Slider aria-label={lang === 'ar' ? 'مستوى الصوت' : 'Bell volume'} min={0} max={100} step={5} value={volume} onValueChange={setVolume} />}
    />
  );
}

const words = {
  en: {
    mail,
    songs,
    inbox: (variant: string, size: string) => `Inbox, ${variant}, ${size}`,
    sections: (variant: string) => `Settings in sections, ${variant}`,
    notifications: 'Notifications',
    previewsFooter: 'Previews show the first line of each message.',
    previews: 'Show previews',
    always: 'Always',
    mailTitle: 'Mail',
    account: 'Account',
    profile: 'Profile',
    boardsNoChevrons: 'Boards, no chevrons',
    brand: 'Brand board',
    editedToday: 'Edited today',
    launch: 'Launch plan',
    editedMonday: 'Edited Monday',
    sound: 'Sound',
    bell: 'Bell volume',
    bellFooter: 'The bell follows this level even on silent.',
    swipeInbox: 'Inbox with swipe actions',
    swipeMenu: (from: string) => `Actions for ${from}`,
    markRead: 'Mark read',
    delete: 'Delete',
    mute: 'Mute',
    empty: 'No mail yet. Mail you get from your team shows here.',
    members: 'Members',
    owner: 'Owner',
    owners: 'Sara Alqahtani',
    setup: 'Setup steps',
    steps: ['Create the workspace', 'Invite your team', 'Connect a domain', 'Publish the first page'],
    done: 'Done',
    next: 'Next',
    dns: 'Point your DNS to the address in Settings.',
    settings: 'Settings',
    network: 'Network',
    networkFooter: 'Large files wait for Wi-Fi unless you turn on mobile data.',
    syncData: 'Sync over mobile data',
    off: 'Off',
    wifi: 'Wi-Fi only for large files',
    on: 'On',
    privacy: 'Privacy',
    privacyFooter: 'Boards you share keep the access you gave them.',
    lock: 'Lock with passcode',
    visibility: 'Who can see your boards',
    team: 'Team',
    blocked: 'Blocked people',
    emptySection: 'Empty section',
    noDevices: 'No devices yet. Devices you sign in on show here.',
    folders: 'Folders',
    folderNames: ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash', 'Spam', 'Starred', 'Important', 'Scheduled', 'All mail', 'Templates', 'Snoozed'],
    longRows: 'Long rows',
    longTitle: 'Quarterly brand guidelines review with the regional marketing teams and the agency',
    longDescription: 'Your changes are saved to your account. Open the board on any other device to see the same version, with every comment and every reference in place.',
    longActions: 'Open actions for the guidelines review',
    saved: 'Saved articles',
    wallsCover: 'Mud walls',
    walls: 'Why mud walls keep old houses in Najd cool through the longest summer afternoons',
    wallsMeta: 'Rawdah Review, 8 min read',
    listen: 'Listen',
    wallsMore: 'More for Why mud walls keep old houses cool',
    sessions: 'Number of sessions in one focus block',
    addSession: 'Add a session',
  },
  ar: {
    mail: mailArAll,
    songs: [...songsAr, { id: 'cardamom-ar', title: 'صباح الهيل', artist: 'ثلاثي العرعر' }],
    inbox: (variant: string, size: string) => `الوارد، ${variant}، ${size}`,
    sections: (variant: string) => `الإعدادات في أقسام، ${variant}`,
    notifications: 'الإشعارات',
    previewsFooter: 'المعاينة تعرض أول سطر من كل رسالة.',
    previews: 'عرض المعاينة',
    always: 'دايم',
    mailTitle: 'البريد',
    account: 'الحساب',
    profile: 'الملف الشخصي',
    boardsNoChevrons: 'اللوحات، بدون أسهم',
    brand: 'لوحة الهوية',
    editedToday: 'تعدلت اليوم',
    launch: 'خطة الإطلاق',
    editedMonday: 'تعدلت الاثنين',
    sound: 'الصوت',
    bell: 'مستوى صوت الجرس',
    bellFooter: 'الجرس يمشي على هذا المستوى حتى لو الجوال صامت.',
    swipeInbox: 'الوارد مع إجراءات السحب',
    swipeMenu: (from: string) => `إجراءات رسالة ${from}`,
    markRead: 'تعليم كمقروءة',
    delete: 'حذف',
    mute: 'كتم',
    empty: 'ما فيه رسائل للحين. الرسائل اللي توصلك من فريقك تطلع هنا.',
    members: 'الأعضاء',
    owner: 'المالك',
    owners: 'سارة القحطاني',
    setup: 'خطوات الإعداد',
    steps: ['إنشاء مساحة العمل', 'دعوة الفريق', 'ربط النطاق', 'نشر أول صفحة'],
    done: 'مكتملة',
    next: 'التالية',
    dns: 'وجه إعدادات DNS للعنوان اللي في الإعدادات.',
    settings: 'الإعدادات',
    network: 'الشبكة',
    networkFooter: 'الملفات الكبيرة تنتظر الواي فاي إلا إذا شغلت بيانات الجوال.',
    syncData: 'المزامنة ببيانات الجوال',
    off: 'مقفلة',
    wifi: 'الواي فاي بس للملفات الكبيرة',
    on: 'شغالة',
    privacy: 'الخصوصية',
    privacyFooter: 'اللوحات اللي تشاركها تبقى بنفس الصلاحيات اللي عطيتها.',
    lock: 'القفل برمز',
    visibility: 'مين يقدر يشوف لوحاتك',
    team: 'الفريق',
    blocked: 'الأشخاص المحظورين',
    emptySection: 'قسم فاضي',
    noDevices: 'ما فيه أجهزة للحين. الأجهزة اللي تسجل دخولك منها تطلع هنا.',
    folders: 'المجلدات',
    folderNames: ['الوارد', 'المسودات', 'المرسلة', 'الأرشيف', 'المحذوفات', 'الرسائل المزعجة', 'المميزة', 'المهمة', 'المجدولة', 'كل الرسائل', 'القوالب', 'المؤجلة'],
    longRows: 'صفوف طويلة',
    longTitle: 'مراجعة دليل الهوية للربع الرابع مع فرق التسويق في المناطق والوكالة',
    longDescription: 'لو خلصت من تعديل الملف، احفظه وارجع للوحة عشان تشوف كل التغييرات في مكان واحد، مع كل تعليق وكل مرجع في مكانه.',
    longActions: 'عرض خيارات مراجعة الدليل',
    saved: 'المقالات المحفوظة',
    wallsCover: 'بيوت الطين',
    walls: 'ليش بيوت الطين في نجد تبقى باردة حتى في أطول عصريات الصيف',
    wallsMeta: 'مجلة الروضة، قراءة 8 دقائق',
    listen: 'استماع',
    wallsMore: 'خيارات مقال بيوت الطين',
    sessions: 'عدد الجلسات في فترة التركيز الواحدة',
    addSession: 'إضافة جلسة',
  },
};

export default function ListDemo() {
  const lang = isArabic(useTheme().lang) ? 'ar' : 'en';
  const w = words[lang];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: plain, divided and inset, two sizes, links with actions, and Arabic">
        {sizes.map((size) => (
          <DemoGrid key={size} min="18rem">
            {variants.map((variant) => (
              <List key={variant} size={size} variant={variant} aria-label={w.inbox(variant, size)}>
                <MailRows items={w.mail} lang={lang} />
              </List>
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="18rem">
          {variants.map((variant) => (
            <List key={variant} variant={variant} aria-label={w.sections(variant)}>
              <ListSection header={w.notifications} footer={w.previewsFooter}>
                <ListItem start="bell" title={w.previews} href={`#previews-${variant}`} end={w.always} />
                <ListItem start="mail" title={w.mailTitle} href={`#mail-alerts-${variant}`} />
              </ListSection>
              <ListSection header={w.account}>
                <ListItem start="user" title={w.profile} href={`#profile-${variant}`} />
              </ListSection>
            </List>
          ))}
        </DemoGrid>
        <DemoGrid min="18rem">
          <SongRows items={w.songs} lang={lang} />
          <List variant="flush" aria-label={w.boardsNoChevrons}>
            <ListItem href="#board-brand" start="grid" title={w.brand} description={w.editedToday} chevron={false} />
            <ListItem href="#board-launch" start="grid" title={w.launch} description={w.editedMonday} chevron={false} />
          </List>
          <List variant="inset" aria-label={w.sound}>
            <ListSection header={w.bell} footer={w.bellFooter}>
              <VolumeRow lang={lang} />
            </ListSection>
          </List>
        </DemoGrid>
        <DemoGrid min="18rem">
          <List variant="inset" aria-label={w.swipeInbox}>
            {w.mail.map((m, i) => (
              <ListItem
                key={m.from}
                href={`#swipe-${i}`}
                start={m.icon}
                title={<User>{m.from}</User>}
                description={<User>{m.subject}</User>}
                end={m.time}
                swipe={
                  <SwipeActions
                    menuLabel={w.swipeMenu(m.from)}
                    start={[{ label: w.markRead, icon: 'mail', tone: 'accent', onSelect: () => undefined }]}
                    end={[
                      { label: w.delete, icon: 'trash', tone: 'danger', onSelect: () => undefined },
                      { label: w.mute, icon: 'bell-off', onSelect: () => undefined },
                    ]}
                  />
                }
              />
            ))}
          </List>
        </DemoGrid>
        <Theme lang="ar">
          <DemoGrid min="18rem">
            <List variant="divided" aria-label="الوارد">
              <MailRows items={mailAr} lang="ar" />
            </List>
            <List variant="inset" aria-label="الوارد">
              <MailRows items={mailAr} lang="ar" />
            </List>
            <SongRows items={songsAr} lang="ar" />
            <List variant="inset" aria-label="الصوت">
              <ListSection header="مستوى صوت الجرس">
                <VolumeRow lang="ar" />
              </ListSection>
            </List>
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <List variant="inset" empty={w.empty} />
      </DemoCase>

      <DemoCase id="one" title="One row, no link">
        <List variant="divided" aria-label={w.members}>
          <ListItem start="user" title={<User>{w.owners}</User>} description={w.owner} />
        </List>
      </DemoCase>

      <DemoCase id="many" title="Many: ordered steps with no links">
        <List ordered variant="divided" aria-label={w.setup}>
          <ListItem start="check-circle" title={w.steps[0]} end={w.done} />
          <ListItem start="check-circle" title={w.steps[1]} end={w.done} />
          <ListItem start="dot" title={w.steps[2]} description={w.dns} end={w.next} />
          <ListItem start="dot" title={w.steps[3]} />
        </List>
        <div style={{ maxInlineSize: '24rem' }}>
          <List variant="inset" aria-label={w.settings}>
            <ListSection header={w.network} footer={w.networkFooter}>
              <ListItem start="download" title={w.syncData} href="#sync" end={w.off} />
              <ListItem start="file" title={w.wifi} href="#wifi" end={w.on} />
            </ListSection>
            <ListSection header={w.privacy} footer={w.privacyFooter}>
              <ListItem start="lock" title={w.lock} href="#lock" />
              <ListItem start="eye" title={w.visibility} href="#visibility" end={w.team} />
              <ListItem start="user" title={w.blocked} href="#blocked" end="2" />
            </ListSection>
            <ListSection header={w.emptySection} empty={w.noDevices} />
          </List>
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: twelve folders">
        <div style={{ maxInlineSize: '20rem' }}>
          <List size="sm" variant="plain" aria-label={w.folders}>
            {w.folderNames.map((name, i) => (
              <ListItem key={name} href={`#folder-${i}`} start="folder" title={name} end={String((i * 7) % 23)} active={i === 0} />
            ))}
          </List>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <List variant="divided" aria-label={w.longRows}>
          <ListItem
            href="#long"
            start="file"
            title={w.longTitle}
            description={w.longDescription}
            end="12:40"
            actions={<IconButton size="xs" icon="more" label={w.longActions} />}
          />
          <ListItem start="link" title={<span dir="ltr">https://example.com/boards/brand/2026/q4/guidelines-final-reviewed-copy</span>} />
        </List>
        <div style={{ maxInlineSize: '20rem' }}>
          <List variant="flush" titleLines={3} aria-label={w.saved}>
            <ListItem
              href="#article-walls"
              chevron={false}
              start={<Avatar name={w.wallsCover} size="lg" decorative />}
              title={w.walls}
              description={w.wallsMeta}
              footer={
                <>
                  <Button size="sm" shape="pill" emphasis="soft" start="play">
                    {w.listen}
                  </Button>
                  <IconButton size="sm" emphasis="ghost" icon="more" label={w.wallsMore} />
                </>
              }
            />
            <ListItem title={w.sessions} titleLines={2} actions={<IconButton size="sm" icon="plus" label={w.addSession} />} />
          </List>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <List variant="divided" aria-label="الملفات">
          <ListItem
            href="#long-ar"
            start="file"
            title="مراجعة دليل الهوية للربع الرابع مع فرق التسويق في المناطق والوكالة"
            description={
              <>
                لو خلصت من تعديل الملف، احفظه وارجع للوحة عشان تشوف كل التغييرات في مكان واحد. وإذا تبي تشاركه مع فريقك، نزله
                بصيغة <Bidi>JSON</Bidi> وأرسله لهم.
              </>
            }
            end="12:40"
            actions={<IconButton size="xs" icon="more" label="عرض خيارات مراجعة الدليل" />}
          />
        </List>
        <div style={{ maxInlineSize: '20rem' }}>
          <List variant="flush" titleLines={3} aria-label="المقالات المحفوظة">
            <ListItem
              href="#article-walls-ar"
              chevron={false}
              start={<Avatar name="بيوت الطين" size="lg" decorative />}
              title="ليش بيوت الطين في نجد تبقى باردة حتى في أطول عصريات الصيف"
              description="مجلة الروضة، قراءة 8 دقائق"
              footer={
                <>
                  <Button size="sm" shape="pill" emphasis="soft" start="play">
                    استماع
                  </Button>
                  <IconButton size="sm" emphasis="ghost" icon="more" label="خيارات مقال بيوت الطين" />
                </>
              }
            />
          </List>
        </div>
        <div style={{ maxInlineSize: '24rem' }}>
          <List variant="inset" aria-label="الإعدادات">
            <ListSection header="الإشعارات" footer="المعاينة تعرض أول سطر من كل رسالة، وتقدر توقفها لأي محادثة من إعداداتها.">
              <ListItem start="bell" title="عرض المعاينة" href="#previews-ar" end="دايم" />
              <ListItem start="mail" title="البريد" href="#mail-ar" end="12" />
            </ListSection>
            <ListSection header="الخصوصية وأمان الحساب على كل الأجهزة اللي سجلت دخولك منها">
              <ListItem start="lock" title="قفل التطبيق برمز" href="#lock-ar" />
            </ListSection>
          </List>
        </div>
      </DemoCase>

      <DemoCase id="danger" title="A destructive row (tone danger)">
        <List variant="inset" aria-label={lang === 'ar' ? 'خيارات الروتين' : 'Routine actions'}>
          <ListItem start="share" title={lang === 'ar' ? 'مشاركة الروتين' : 'Share routine'} onSelect={() => undefined} />
          <ListItem start="edit" title={lang === 'ar' ? 'تعديل الروتين' : 'Edit routine'} href="#edit-routine" />
          <ListItem start="trash" title={lang === 'ar' ? 'حذف الروتين' : 'Delete routine'} tone="danger" onSelect={() => undefined} />
        </List>
        <Theme lang="ar" data-demo="content">
          <List variant="inset" aria-label="خيارات الروتين">
            <ListItem start="share" title="مشاركة الروتين" onSelect={() => undefined} />
            <ListItem start="trash" title="حذف الروتين" tone="danger" onSelect={() => undefined} />
          </List>
        </Theme>
      </DemoCase>

      <DemoCase id="trigger" title="A row as a trigger: an action sheet from a destructive row, a menu from a row">
        {lang === 'en' && (
          <List variant="inset" aria-label="Pass actions">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <ListItem start="sort" title="Sort passes" end="Date" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Date</DropdownMenuItem>
                <DropdownMenuItem>Event name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ActionSheet>
              <ActionSheetTrigger>
                <ListItem start="trash" title="Remove pass" tone="danger" />
              </ActionSheetTrigger>
              <ActionSheetContent title="Oud night" description="The pass leaves this phone. You can add it again from the email you got it in.">
                <ActionSheetAction tone="danger" start="trash">
                  Remove pass
                </ActionSheetAction>
              </ActionSheetContent>
            </ActionSheet>
          </List>
        )}
        <Theme lang="ar" dir="rtl" data-demo="content">
          <List variant="inset" aria-label="خيارات البطاقة">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <ListItem start="sort" title="ترتيب البطاقات" end="التاريخ" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>التاريخ</DropdownMenuItem>
                <DropdownMenuItem>اسم الفعالية</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ActionSheet>
              <ActionSheetTrigger>
                <ListItem start="trash" title="إزالة البطاقة" tone="danger" />
              </ActionSheetTrigger>
              <ActionSheetContent title="ليلة العود" description="البطاقة بتختفي من هذا الجوال، وإضافتها مرة ثانية ممكنة من البريد اللي وصلك.">
                <ActionSheetAction tone="danger" start="trash">
                  إزالة البطاقة
                </ActionSheetAction>
              </ActionSheetContent>
            </ActionSheet>
          </List>
        </Theme>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled row">
        <List variant="divided" aria-label={lang === 'ar' ? 'اللوحات' : 'Boards'}>
          <ListItem href="#open" start="grid" title={w.brand} description={lang === 'ar' ? 'مفتوحة' : 'Open'} />
          <ListItem href="#locked" start="lock" title={lang === 'ar' ? 'لوحة المالية' : 'Finance board'} description={lang === 'ar' ? 'تحتاج صلاحية من المشرف' : 'You need access from an admin'} disabled />
          <ListItem
            start="music"
            title={lang === 'ar' ? 'قائمة بدون إنترنت' : 'Offline mix'}
            description={lang === 'ar' ? 'نزلها أول عشان تشغلها هنا' : 'Download it first to play it here'}
            onSelect={() => undefined}
            disabled
          />
        </List>
      </DemoCase>
    </DemoPage>
  );
}
