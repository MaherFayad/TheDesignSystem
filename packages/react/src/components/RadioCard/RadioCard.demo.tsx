import { useId, type ReactNode } from 'react';
import { Theme } from '../../theme/Theme';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { RadioCard, RadioCardItem, type RadioCardProps, type RadioCardSize, type RadioCardTone } from './index';

const sizes: RadioCardSize[] = ['sm', 'md', 'lg'];
const tones: RadioCardTone[] = ['neutral', 'accent'];

/** A visible heading that names the group. */
function Group({ heading, children, ...props }: RadioCardProps & { heading: string; children: ReactNode }) {
  const id = useId();
  return (
    <div style={{ display: 'grid', alignContent: 'start', gap: 'var(--ds-space-xs)' }}>
      <p data-demo="label" id={id}>
        {heading}
      </p>
      <RadioCard aria-labelledby={id} {...props}>
        {children}
      </RadioCard>
    </div>
  );
}

const plans = Array.from({ length: 12 }, (_, i) => ({ value: `seat-${i + 1}`, title: `${(i + 1) * 5} seats`, price: `$${(i + 1) * 40} a month` }));

/** RadioCard in every content case, English and Arabic. */
export default function RadioCardDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, tones, icons and end content">
        <DemoGrid min="18rem">
          {tones.flatMap((tone) =>
            sizes.map((size) => (
              <Group key={`${tone}-${size}`} heading={`Plan, ${size}, ${tone}`} size={size} tone={tone} defaultValue="team">
                <RadioCardItem value="free" title="Free" description="Up to 3 boards." end="$0" />
                <RadioCardItem value="team" title="Team" description="Unlimited boards and comments." end="$12" icon="user" />
              </Group>
            )),
          )}
        </DemoGrid>
        <Group heading="Shipping" orientation="horizontal" defaultValue="standard" tone="accent">
          <RadioCardItem value="standard" title="Standard" description="Arrives in 4 to 6 days." end="Free" icon="clock" />
          <RadioCardItem value="express" title="Express" description="Arrives in 1 to 2 days." end="$15" icon="send" />
          <RadioCardItem value="pickup" title="Store pickup" description="Ready tomorrow." end="Free" icon="home" />
        </Group>
        <Theme lang="ar">
          <Group heading="الباقة" orientation="horizontal" defaultValue="team">
            <RadioCardItem value="free" title="مجانية" description="حتى 3 لوحات." end="0 ر.س" />
            <RadioCardItem value="team" title="الفريق" description="لوحات وتعليقات بلا حد." end="45 ر.س" icon="user" />
          </Group>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No card checked yet">
        <Group heading="Plan">
          <RadioCardItem value="free" title="Free" description="Up to 3 boards." />
          <RadioCardItem value="team" title="Team" description="Unlimited boards." />
        </Group>
      </DemoCase>

      <DemoCase id="one" title="Title only">
        <Group heading="Board template" defaultValue="blank" orientation="horizontal">
          <RadioCardItem value="blank" title="Blank board" icon="file" />
          <RadioCardItem value="grid" title="Moodboard grid" icon="grid" />
        </Group>
      </DemoCase>

      <DemoCase id="many" title="Four plans">
        <Group heading="Plan" defaultValue="team" tone="accent">
          <RadioCardItem value="free" title="Free" description="Up to 3 boards and 2 people." end="$0" />
          <RadioCardItem value="pro" title="Pro" description="Unlimited boards for one person." end="$8 a month" />
          <RadioCardItem value="team" title="Team" description="Shared boards, comments and roles." end="$12 a seat" />
          <RadioCardItem value="enterprise" title="Enterprise" description="Single sign on and audit logs." end="Talk to sales" />
        </Group>
      </DemoCase>

      <DemoCase id="too-many" title="Twelve cards: use a Select instead">
        <Group heading="Seats" size="sm" orientation="horizontal" defaultValue="seat-1">
          {plans.map((p) => (
            <RadioCardItem key={p.value} value={p.value} title={p.title} end={p.price} />
          ))}
        </Group>
      </DemoCase>

      <DemoCase id="long-text" title="Long title, text and end content">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Group heading="Delivery" defaultValue="long">
            <RadioCardItem
              value="long"
              title="Scheduled delivery to the front desk of your office building"
              description={sample.en.long}
              end="$4 for each delivery after the first"
              icon="calendar"
            />
            <RadioCardItem value="word" title={sample.en.word} description={sample.en.word} end={sample.en.word} />
          </Group>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Group heading="طريقة التوصيل" defaultValue="office">
            <RadioCardItem value="office" title="التوصيل لمكتب الاستقبال في المبنى" description={sample.ar.long} end="15 ر.س" icon="calendar" />
            <RadioCardItem value="pickup" title="الاستلام من الفرع" description="جاهز بكرة بعد الساعة 4 العصر." end="مجاني" icon="home" />
          </Group>
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <ErrorExample />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled group and one disabled card">
        <DemoGrid min="18rem">
          <Group heading="Plan" disabled defaultValue="team">
            <RadioCardItem value="free" title="Free" description="Up to 3 boards." />
            <RadioCardItem value="team" title="Team" description="Only owners can change the plan." />
          </Group>
          <Group heading="Storage region" defaultValue="me">
            <RadioCardItem value="me" title="Middle East" description="Riyadh and Dammam." />
            <RadioCardItem value="us" title="United States" description="Not on your plan." disabled />
          </Group>
        </DemoGrid>
      </DemoCase>
    </DemoPage>
  );
}

function ErrorExample() {
  const id = useId();
  return (
    <div style={{ display: 'grid', alignContent: 'start', gap: 'var(--ds-space-xs)' }}>
      <p data-demo="label" id={`${id}heading`}>
        Billing period
      </p>
      <RadioCard aria-labelledby={`${id}heading`} aria-describedby={`${id}error`} invalid required orientation="horizontal">
        <RadioCardItem value="monthly" title="Monthly" end="$12" />
        <RadioCardItem value="yearly" title="Yearly" description="Two months free." end="$120" />
      </RadioCard>
      <p id={`${id}error`} style={{ margin: 0, color: 'var(--ds-color-state-danger-text)', fontSize: 'var(--ds-font-size-s)' }}>
        Pick a billing period, so we can show the price.
      </p>
    </div>
  );
}
