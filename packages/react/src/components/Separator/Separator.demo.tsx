import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme';
import { DemoBox } from '../Stack/DemoBox';
import { Stack } from '../Stack';
import { Separator } from './index';

const groups = [sample.en.items.slice(0, 3), sample.en.items.slice(3, 6), sample.en.items.slice(6, 9)];

export default function SeparatorDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Orientation, decorative or semantic, and a label">
        <DemoRow label="Horizontal, decorative">
          <Stack gap="s" style={{ flex: '1 1 0', minInlineSize: 0 }}>
            <DemoBox>Account</DemoBox>
            <Separator />
            <DemoBox>Billing</DemoBox>
          </Stack>
        </DemoRow>
        <DemoRow label="Horizontal, semantic">
          <Stack gap="s" style={{ flex: '1 1 0', minInlineSize: 0 }}>
            <DemoBox>Account</DemoBox>
            <Separator decorative={false} />
            <DemoBox>Billing</DemoBox>
          </Stack>
        </DemoRow>
        <DemoRow label="Vertical, in a row">
          <Stack direction="inline" gap="s">
            <DemoBox>Bold</DemoBox>
            <DemoBox>Italic</DemoBox>
            <Separator orientation="vertical" />
            <DemoBox>Link</DemoBox>
            <Separator orientation="vertical" decorative={false} />
            <DemoBox>Comment</DemoBox>
          </Stack>
        </DemoRow>
        <DemoRow label="Label, decorative">
          <Separator label="Or" style={{ flex: '1 1 0' }} />
        </DemoRow>
        <DemoRow label="Label, semantic">
          <Separator label="Older messages" decorative={false} style={{ flex: '1 1 0' }} />
        </DemoRow>
        <DemoRow label="Vertical with a label">
          <Stack direction="inline" gap="s" style={{ minBlockSize: 'var(--ds-space-12xl)' }}>
            <DemoBox>Sign in with email</DemoBox>
            <Separator orientation="vertical" label="Or" />
            <DemoBox>Sign in with a passkey</DemoBox>
          </Stack>
        </DemoRow>
        <DemoRow label="Arabic">
          <div style={{ flex: '1 1 0' }}>
            <Theme dir="rtl" lang="ar">
              <Stack gap="s">
                <DemoBox>الحساب</DemoBox>
                <Separator label="أو" />
                <DemoBox>الفوترة</DemoBox>
              </Stack>
            </Theme>
          </div>
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="An empty label draws a plain line">
        <Separator label="" />
      </DemoCase>

      <DemoCase id="one" title="One line between two groups">
        <Stack gap="s">
          <DemoBox>{sample.en.short}</DemoBox>
          <Separator />
          <DemoBox>{sample.en.label}</DemoBox>
        </Stack>
      </DemoCase>

      <DemoCase id="many" title="Groups of a menu">
        <Stack gap="2xs" style={{ maxInlineSize: 'calc(var(--ds-breakpoint-phone) / 2)' }}>
          {groups.map((group, i) => (
            <Stack key={group.join()} gap="2xs">
              {i > 0 && <Separator decorative={false} />}
              {group.map((t) => (
                <DemoBox key={t}>{t}</DemoBox>
              ))}
            </Stack>
          ))}
        </Stack>
      </DemoCase>

      <DemoCase id="long-text" title="A long label wraps and the lines shrink">
        <Separator label={sample.en.long} />
        <Separator label={sample.en.word} />
      </DemoCase>

      <DemoCase id="long-arabic" title="A long Arabic label" lang="ar">
        <Separator label={sample.ar.long} />
        <Separator label="الرسائل الأقدم" decorative={false} />
      </DemoCase>
    </DemoPage>
  );
}
