import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Button } from '../Button';
import { Theme } from '../../theme';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, type AccordionSize, type AccordionVariant } from './index';

const variants: AccordionVariant[] = ['plain', 'divided', 'card'];
const sizes: AccordionSize[] = ['sm', 'md'];

const sections = [
  ['Billing', 'Your plan renews on 12 March. Change the card on file or download past invoices from the billing page.'],
  ['Members', 'Invite people by email. Each person gets the role you pick and can change it later in settings.'],
  ['Notifications', 'Pick which events send an email and which only show in the bell menu.'],
  ['Security', 'Turn on two step sign in and review the devices that are signed in to your account.'],
  ['Integrations', 'Connect the tools your team uses. Each connection asks for its own access.'],
  ['Data export', 'Download every board and comment as JSON. The file is ready within an hour.'],
  ['Language', 'Pick the language and the date format for your account.'],
  ['Appearance', 'Pick a style and a light or dark scheme. The choice follows you to every device.'],
  ['Shortcuts', 'See every keyboard shortcut and change the ones you use most.'],
  ['Storage', 'You use 4 GB of 10 GB. Delete old versions to free space.'],
  ['Audit log', 'See who changed what in the last 90 days.'],
  ['Delete workspace', 'Deleting the workspace removes every board for every member after 30 days.'],
] as const;

const sectionsAr = [
  ['الفوترة', 'يتجدد اشتراكك في 12 مارس. تقدر تغير البطاقة أو تنزل الفواتير السابقة من صفحة الفوترة.'],
  ['الأعضاء', 'أرسل دعوة بالإيميل، وكل شخص ياخذ الدور اللي تختاره وتقدر تغيره بعدين.'],
  ['التنبيهات', 'اختر الأحداث اللي توصلك بالإيميل والأحداث اللي تظهر في قائمة الجرس بس.'],
] as const;

/**
 * The contract suite's open checks (axe, target size) need a trigger that
 * adds an accordion with a section open (review note N12): this one mounts
 * one with a list in the open section, so the child stagger plays too.
 */
function OpenOnDemand() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button data-demo-trigger="" onClick={() => setShown(true)}>
        Show the plan details
      </Button>
      {shown && (
        <Accordion defaultValue="plan">
          <AccordionItem value="plan">
            <AccordionTrigger>Plan details</AccordionTrigger>
            <AccordionContent>
              <p>Your plan renews on 12 March.</p>
              <ul>
                <li>Ten members</li>
                <li>Unlimited boards</li>
              </ul>
              <p>Change the card on file from the billing page.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="members">
            <AccordionTrigger>Members</AccordionTrigger>
            <AccordionContent>{sections[1][1]}</AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </>
  );
}

function Sections({ items, count = 3 }: { items: readonly (readonly [string, string])[]; count?: number }) {
  return items.slice(0, count).map(([title, body]) => (
    <AccordionItem key={title} value={title}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>{body}</AccordionContent>
    </AccordionItem>
  ));
}

export default function AccordionDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: plain, divided and card at sizes sm and md">
        {sizes.map((size) =>
          variants.map((variant) => (
            <DemoRow key={`${size}-${variant}`} label={`${variant} ${size}`}>
              <div style={{ flex: '1 1 20rem', minInlineSize: 0 }}>
                <Accordion size={size} variant={variant} defaultValue={sections[0][0]}>
                  <Sections items={sections} />
                </Accordion>
              </div>
            </DemoRow>
          )),
        )}
        <DemoRow label="Multiple open">
          <div style={{ flex: '1 1 20rem', minInlineSize: 0 }}>
            <Accordion type="multiple" defaultValue={[sections[0][0], sections[1][0]]}>
              <Sections items={sections} />
            </Accordion>
          </div>
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <Accordion variant="card" defaultValue={sectionsAr[0][0]}>
            <Sections items={sectionsAr} />
          </Accordion>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One section">
        <Accordion>
          <Sections items={sections} count={1} />
        </Accordion>
      </DemoCase>

      <DemoCase id="many" title="Many sections, one open at a time">
        <Accordion defaultValue={sections[2][0]}>
          <Sections items={sections} count={6} />
        </Accordion>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: twelve sections, any number open">
        <Accordion type="multiple" size="sm">
          <Sections items={sections} count={12} />
        </Accordion>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the title wraps, the chevron stays at the end">
        <Accordion defaultValue="long">
          <AccordionItem value="long">
            <AccordionTrigger>{`${sample.en.word} settings for every board you share with people outside your team`}</AccordionTrigger>
            <AccordionContent>{sample.en.long}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="other">
            <AccordionTrigger>{sections[0][0]}</AccordionTrigger>
            <AccordionContent>{sections[0][1]}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Accordion defaultValue="long">
          <AccordionItem value="long">
            <AccordionTrigger>إعدادات المشاركة لكل اللوحات اللي تشاركها مع أشخاص من خارج فريقك</AccordionTrigger>
            <AccordionContent>{sample.ar.long}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="other">
            <AccordionTrigger>{sectionsAr[1][0]}</AccordionTrigger>
            <AccordionContent>{sectionsAr[1][1]}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </DemoCase>

      <DemoCase id="open" title="Opened on demand: a section open with a paragraph, a list and a paragraph that arrive one after another">
        <OpenOnDemand />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled: a section that cannot open stays focusable">
        <Accordion>
          <AccordionItem value="a">
            <AccordionTrigger>{sections[0][0]}</AccordionTrigger>
            <AccordionContent>{sections[0][1]}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b" disabled>
            <AccordionTrigger>Audit log, on the business plan only</AccordionTrigger>
            <AccordionContent>{sections[10][1]}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </DemoCase>
    </DemoPage>
  );
}
