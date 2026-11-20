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
import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Bidi } from '../../theme/Bidi';
import { Theme } from '../../theme/Theme';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { ActionSheet, ActionSheetAction, ActionSheetContent, ActionSheetTrigger } from '../ActionSheet';
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

function MailRows({ items, actions = true, lang = 'en' }: { items: typeof mail; actions?: boolean; lang?: 'en' | 'ar' }) {
  return (
    <>
      {items.map((m, i) => (
        <ListItem
          key={m.from}
          href={`#mail-${i}`}
          start={m.icon}
          title={m.from}
          description={m.subject}
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
          title={song.title}
          description={song.artist}
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

export default function ListDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: plain, divided and inset, two sizes, links with actions, and Arabic">
        {sizes.map((size) => (
          <DemoGrid key={size} min="18rem">
            {variants.map((variant) => (
              <List key={variant} size={size} variant={variant} aria-label={`Inbox, ${variant}, ${size}`}>
                <MailRows items={mail} />
              </List>
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="18rem">
          {variants.map((variant) => (
            <List key={variant} variant={variant} aria-label={`Settings in sections, ${variant}`}>
              <ListSection header="Notifications" footer="Previews show the first line of each message.">
                <ListItem start="bell" title="Show previews" href={`#previews-${variant}`} end="Always" />
                <ListItem start="mail" title="Mail" href={`#mail-alerts-${variant}`} />
              </ListSection>
              <ListSection header="Account">
                <ListItem start="user" title="Profile" href={`#profile-${variant}`} />
              </ListSection>
            </List>
          ))}
        </DemoGrid>
        <DemoGrid min="18rem">
          <SongRows items={songs} />
          <List variant="flush" aria-label="Boards, no chevrons">
            <ListItem href="#board-brand" start="grid" title="Brand board" description="Edited today" chevron={false} />
            <ListItem href="#board-launch" start="grid" title="Launch plan" description="Edited Monday" chevron={false} />
          </List>
          <List variant="inset" aria-label="Sound">
            <ListSection header="Bell volume" footer="The bell follows this level even on silent.">
              <VolumeRow />
            </ListSection>
          </List>
        </DemoGrid>
        <DemoGrid min="18rem">
          <List variant="inset" aria-label="Inbox with swipe actions">
            {mail.map((m, i) => (
              <ListItem
                key={m.from}
                href={`#swipe-${i}`}
                start={m.icon}
                title={m.from}
                description={m.subject}
                end={m.time}
                swipe={
                  <SwipeActions
                    menuLabel={`Actions for ${m.from}`}
                    start={[{ label: 'Mark read', icon: 'mail', tone: 'accent', onSelect: () => undefined }]}
                    end={[
                      { label: 'Delete', icon: 'trash', tone: 'danger', onSelect: () => undefined },
                      { label: 'Mute', icon: 'bell-off', onSelect: () => undefined },
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
        <List variant="inset" empty="No mail yet. Mail you get from your team shows here." />
      </DemoCase>

      <DemoCase id="one" title="One row, no link">
        <List variant="divided" aria-label="Members">
          <ListItem start="user" title="Sara Alqahtani" description="Owner" />
        </List>
      </DemoCase>

      <DemoCase id="many" title="Many: ordered steps with no links">
        <List ordered variant="divided" aria-label="Setup steps">
          <ListItem start="check-circle" title="Create the workspace" end="Done" />
          <ListItem start="check-circle" title="Invite your team" end="Done" />
          <ListItem start="dot" title="Connect a domain" description="Point your DNS to the address in Settings." end="Next" />
          <ListItem start="dot" title="Publish the first page" />
        </List>
        <div style={{ maxInlineSize: '24rem' }}>
          <List variant="inset" aria-label="Settings">
            <ListSection header="Network" footer="Large files wait for Wi-Fi unless you turn on mobile data.">
              <ListItem start="download" title="Sync over mobile data" href="#sync" end="Off" />
              <ListItem start="file" title="Wi-Fi only for large files" href="#wifi" end="On" />
            </ListSection>
            <ListSection header="Privacy" footer="Boards you share keep the access you gave them.">
              <ListItem start="lock" title="Lock with passcode" href="#lock" />
              <ListItem start="eye" title="Who can see your boards" href="#visibility" end="Team" />
              <ListItem start="user" title="Blocked people" href="#blocked" end="2" />
            </ListSection>
            <ListSection header="Empty section" empty="No devices yet. Devices you sign in on show here." />
          </List>
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: twelve folders">
        <div style={{ maxInlineSize: '20rem' }}>
          <List size="sm" variant="plain" aria-label="Folders">
            {['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash', 'Spam', 'Starred', 'Important', 'Scheduled', 'All mail', 'Templates', 'Snoozed'].map((name, i) => (
              <ListItem key={name} href={`#folder-${i}`} start="folder" title={name} end={String((i * 7) % 23)} active={i === 0} />
            ))}
          </List>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <List variant="divided" aria-label="Long rows">
          <ListItem
            href="#long"
            start="file"
            title="Quarterly brand guidelines review with the regional marketing teams and the agency"
            description="Your changes are saved to your account. Open the board on any other device to see the same version, with every comment and every reference in place."
            end="12:40"
            actions={<IconButton size="xs" icon="more" label="Open actions for the guidelines review" />}
          />
          <ListItem start="link" title="https://example.com/boards/brand/2026/q4/guidelines-final-reviewed-copy" />
        </List>
        <div style={{ maxInlineSize: '20rem' }}>
          <List variant="flush" titleLines={3} aria-label="Saved articles">
            <ListItem
              href="#article-walls"
              chevron={false}
              start={<Avatar name="Mud walls" size="lg" decorative />}
              title="Why mud walls keep old houses in Najd cool through the longest summer afternoons"
              description="Rawdah Review, 8 min read"
              footer={
                <>
                  <Button size="sm" shape="pill" emphasis="soft" start="play">
                    Listen
                  </Button>
                  <IconButton size="sm" emphasis="ghost" icon="more" label="More for Why mud walls keep old houses cool" />
                </>
              }
            />
            <ListItem title="Number of sessions in one focus block" titleLines={2} actions={<IconButton size="sm" icon="plus" label="Add a session" />} />
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
        <List variant="inset" aria-label="Routine actions">
          <ListItem start="share" title="Share routine" onSelect={() => undefined} />
          <ListItem start="edit" title="Edit routine" href="#edit-routine" />
          <ListItem start="trash" title="Delete routine" tone="danger" onSelect={() => undefined} />
        </List>
        <Theme lang="ar" data-demo="content">
          <List variant="inset" aria-label="خيارات الروتين">
            <ListItem start="share" title="مشاركة الروتين" onSelect={() => undefined} />
            <ListItem start="trash" title="حذف الروتين" tone="danger" onSelect={() => undefined} />
          </List>
        </Theme>
      </DemoCase>

      <DemoCase id="trigger" title="A row as a trigger: an action sheet from a destructive row, a menu from a row">
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
        <List variant="divided" aria-label="Boards">
          <ListItem href="#open" start="grid" title="Brand board" description="Open" />
          <ListItem href="#locked" start="lock" title="Finance board" description="You need access from an admin" disabled />
          <ListItem start="music" title="Offline mix" description="Download it first to play it here" onSelect={() => undefined} disabled />
        </List>
      </DemoCase>
    </DemoPage>
  );
}
