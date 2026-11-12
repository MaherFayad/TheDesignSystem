import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Button } from '../Button';
import { Badge, type BadgeEmphasis, type BadgeTone } from './index';

const tones: BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const emphases: BadgeEmphasis[] = ['solid', 'soft', 'outline'];

const toneLabel: Record<BadgeTone, string> = {
  neutral: 'Draft',
  accent: 'New',
  success: 'Live',
  warning: 'Expiring',
  danger: 'Failed',
  info: 'Beta',
};

/** Noun forms in white Saudi dialect, no diacritics. */
const toneLabelAr: Record<BadgeTone, string> = {
  neutral: 'مسودة',
  accent: 'جديد',
  success: 'منشور',
  warning: 'قرب ينتهي',
  danger: 'فشل',
  info: 'تجريبي',
};

const unread = (n: number) => (n === 1 ? '1 unread message' : `${n} unread messages`);

/** Arabic plural for small counts, Western digits. */
const unreadAr = (n: number) => {
  if (n === 1) return 'رسالة وحدة غير مقروءة';
  if (n === 2) return 'رسالتين غير مقروءة';
  if (n <= 10) return `${n} رسائل غير مقروءة`;
  return `${n} رسالة غير مقروءة`;
};

export default function BadgeDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each tone in solid, soft and outline, two sizes, and the dot">
        {tones.map((tone) => (
          <DemoRow key={tone} label={tone}>
            {emphases.map((emphasis) => (
              <Badge key={emphasis} tone={tone} emphasis={emphasis}>
                {toneLabel[tone]}
              </Badge>
            ))}
            {emphases.map((emphasis) => (
              <Badge key={`xs-${emphasis}`} tone={tone} emphasis={emphasis} size="xs">
                {toneLabel[tone]}
              </Badge>
            ))}
            <Badge tone={tone} emphasis="solid" count={3} countLabel={unread} />
            <Badge tone={tone} dot>
              {toneLabel[tone]}
            </Badge>
            <Badge tone={tone} dot size="xs">
              {toneLabel[tone]}
            </Badge>
          </DemoRow>
        ))}
        <DemoRow label="Icon">
          <Badge tone="success" icon="check">
            Verified
          </Badge>
          <Badge tone="warning" icon="clock" emphasis="outline">
            Pending review
          </Badge>
          <Badge tone="info" icon="star" size="xs">
            Pro
          </Badge>
        </DemoRow>
        <DemoRow label="Arabic">
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} lang="ar">
              {toneLabelAr[tone]}
            </Badge>
          ))}
          <Badge tone="danger" emphasis="solid" count={12} countLabel={unreadAr} lang="ar" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Empty: a zero count still reads as zero; hide the badge when zero means nothing to see">
        <DemoRow>
          <Badge count={0} countLabel={unread} />
          <Button end={<Badge count={0} countLabel={unread} size="xs" />}>Open inbox</Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One: a badge next to what it counts">
        <DemoRow>
          <Button end={<Badge tone="danger" emphasis="solid" count={1} countLabel={unread} size="xs" />}>Open inbox</Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many">
        <DemoRow>
          {[2, 7, 12, 42, 99].map((n) => (
            <Badge key={n} tone="danger" emphasis="solid" count={n} countLabel={unread} />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: over 99 shows 99+ and reads the full number">
        <DemoRow>
          <Badge tone="danger" emphasis="solid" count={120} countLabel={unread} />
          <Badge tone="danger" emphasis="solid" count={4580} countLabel={unread} size="xs" />
          <Badge tone="accent" emphasis="solid" count={4580} max={999} />
          <Button end={<Badge tone="danger" emphasis="solid" count={348} countLabel={unread} size="xs" />}>Open inbox</Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: a badge ends in an ellipsis and never wraps">
        <div style={{ maxInlineSize: '14rem' }}>
          <Badge tone="info">Available to every member of the workspace</Badge>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <div style={{ maxInlineSize: '14rem' }}>
            <Badge tone="info">متاح لكل أعضاء مساحة العمل بدون استثناء</Badge>
          </div>
          <Badge tone="danger" emphasis="solid" count={348} countLabel={unreadAr} />
          <Badge tone="warning" icon="clock">
            بانتظار المراجعة
          </Badge>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
