// List demo. Cases: variants, empty, one, many, too-many, long-text,
// long-arabic, disabled. No loading, error or readonly: a list that loads
// shows Skeleton rows, and a failed load is the page's message.
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Theme } from '../../theme/Theme';
import { IconButton } from '../IconButton';
import { List, ListItem, type ListSize, type ListVariant } from './index';

const variants: ListVariant[] = ['plain', 'divided', 'inset'];
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
        <Theme lang="ar">
          <DemoGrid min="18rem">
            <List variant="divided" aria-label="الوارد">
              <MailRows items={mailAr} lang="ar" />
            </List>
            <List variant="inset" aria-label="الوارد">
              <MailRows items={mailAr} lang="ar" />
            </List>
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <List variant="inset" empty="No mail yet. Mail you get from your team shows here." aria-label="Inbox" />
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
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <List variant="divided" aria-label="الملفات">
          <ListItem
            href="#long-ar"
            start="file"
            title="مراجعة دليل الهوية للربع الرابع مع فرق التسويق في المناطق والوكالة"
            description="لو خلصت من تعديل الملف، احفظه وارجع للوحة عشان تشوف كل التغييرات في مكان واحد. وإذا تبي تشاركه مع فريقك، نزله بصيغة JSON وأرسله لهم."
            end="12:40"
            actions={<IconButton size="xs" icon="more" label="خيارات مراجعة الدليل" />}
          />
        </List>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled row">
        <List variant="divided" aria-label="Boards">
          <ListItem href="#open" start="grid" title="Brand board" description="Open" />
          <ListItem href="#locked" start="lock" title="Finance board" description="You need access from an admin" disabled />
        </List>
      </DemoCase>
    </DemoPage>
  );
}
