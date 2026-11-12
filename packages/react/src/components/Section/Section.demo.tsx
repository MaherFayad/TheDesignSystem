import { DemoCase, DemoPage, sample } from '../../demo';
import { IconButton } from '../IconButton';
import { Section } from './index';

const text = { margin: 0 } as const;

export default function SectionDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: md and sm, collapsible open and closed, static">
        <div>
          <Section
            level={3}
            title="Account"
            description="Your name, photo and sign in methods."
            collapsible
            actions={<IconButton icon="more" label="Open account menu" emphasis="ghost" size="sm" />}
          >
            <p style={text}>Signed in with a work email.</p>
          </Section>
          <Section level={3} title="Billing" description="Invoices and the card on file." collapsible defaultOpen={false}>
            <p style={text}>The next invoice is due on 3 December.</p>
          </Section>
          <Section level={3} title="Notifications" description="A static section: no toggle.">
            <p style={text}>Email for mentions and replies.</p>
          </Section>
        </div>
        <div>
          <Section
            level={4}
            size="sm"
            title="Fill"
            collapsible
            actions={<IconButton icon="plus" label="Add fill" emphasis="ghost" size="xs" />}
          >
            <p style={text}>Solid, 100 percent.</p>
          </Section>
          <Section level={4} size="sm" title="Stroke" collapsible defaultOpen={false}>
            <p style={text}>Inside, 1 px.</p>
          </Section>
          <Section level={4} size="sm" title="Export">
            <p style={text}>PNG at 2x.</p>
          </Section>
        </div>
        <div lang="ar" dir="rtl">
          <Section
            level={3}
            title="الحساب"
            description="الاسم والصورة وطرق الدخول."
            collapsible
            actions={<IconButton icon="more" label="قائمة الحساب" emphasis="ghost" size="sm" />}
          >
            <p style={text}>مسجل الدخول ببريد العمل.</p>
          </Section>
          <Section level={3} title="الفوترة" collapsible defaultOpen={false}>
            <p style={text}>الفاتورة الجاية في 3 ديسمبر.</p>
          </Section>
        </div>
      </DemoCase>

      <DemoCase id="empty" title="Empty: a collapsible section with no body draws the header alone">
        <Section
          level={4}
          size="sm"
          title="Effects"
          collapsible
          actions={<IconButton icon="plus" label="Add effect" emphasis="ghost" size="xs" />}
        />
      </DemoCase>

      <DemoCase id="one" title="One section">
        <Section level={3} title="Release notes" collapsible>
          <p style={text}>{sample.en.short}</p>
        </Section>
      </DemoCase>

      <DemoCase id="many" title="Many sections in a panel, set off by hairlines">
        <div>
          {['Layout', 'Fill', 'Stroke', 'Effects', 'Export'].map((name) => (
            <Section key={name} level={4} size="sm" title={name} collapsible>
              <p style={text}>Settings for {name.toLowerCase()}.</p>
            </Section>
          ))}
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: closed sections keep the panel short">
        <div>
          {sample.en.items.map((name) => (
            <Section key={name} level={4} size="sm" title={name} collapsible defaultOpen={false}>
              <p style={text}>Rules for {name.toLowerCase()}.</p>
            </Section>
          ))}
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long title and description wrap">
        <Section
          level={3}
          title="Quarterly planning notes for the design system team, with every comment and reference"
          description={sample.en.long}
          collapsible
          actions={<IconButton icon="more" label="Open notes menu" emphasis="ghost" size="sm" />}
        >
          <p style={text}>{sample.en.long}</p>
        </Section>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Section
          level={3}
          title="إعدادات الحساب والاشتراك والفواتير وكل أعضاء الفريق"
          description="هنا تقدر تعدل بيانات الحساب وتراجع الفواتير وتضيف أعضاء جدد للفريق."
          collapsible
          actions={<IconButton icon="more" label="قائمة الإعدادات" emphasis="ghost" size="sm" />}
        >
          <p style={text}>{sample.ar.long}</p>
        </Section>
      </DemoCase>
    </DemoPage>
  );
}
