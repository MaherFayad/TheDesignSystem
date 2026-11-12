import type { ReactNode } from 'react';
import { DemoCase, DemoPage, sample } from '../../demo';
import { Button } from '../Button';
import { Bento, BentoItem, type BentoSpan } from './index';

const label = { margin: 0, color: 'var(--ds-color-text-muted)', fontSize: 'var(--ds-font-size-s)' } as const;
const value = { margin: 0, color: 'var(--ds-color-text-bright)', fontSize: 'var(--ds-font-size-2xl)', fontWeight: 'var(--ds-font-weight-bold)' } as const;

function Tile({ span, name, figure, children }: { span?: BentoSpan; name: string; figure?: string; children?: ReactNode }) {
  return (
    <BentoItem span={span} as="li">
      <p style={label}>{name}</p>
      {figure !== undefined && <p style={value}>{figure}</p>}
      {children}
    </BentoItem>
  );
}

/** Wide tiles in the too-many case, placed so every row of 4 fills. */
const wide = new Set([0, 5, 10, 11]);

export default function BentoDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: 2x2, 2x1, 1x2 and 1x1 tiles in 4 and 3 columns">
        <Bento as="ul">
          <Tile span="2x2" name="Visitors this week" figure="12,480">
            <p style={{ margin: 0 }}>Up 8 percent on last week.</p>
          </Tile>
          <Tile span="1x2" name="Open tickets" figure="17">
            <Button size="sm">Open queue</Button>
          </Tile>
          <Tile name="Uptime" figure="99.9%" />
          <Tile name="Errors" figure="4" />
          <Tile span="2x1" name="Sign ups" figure="342" />
          <Tile span="2x1" name="Latency" figure="120 ms" />
        </Bento>
        <Bento as="ul" columns={3}>
          <Tile span="2x1" name="Revenue" figure="$48,200" />
          <Tile name="Refunds" figure="6" />
          <Tile name="Plans" figure="3" />
          <Tile span="2x1" name="Churn" figure="1.2%" />
        </Bento>
        <div lang="ar" dir="rtl">
          <Bento as="ul" columns={3}>
            <Tile span="2x1" name="الزوار هذا الأسبوع" figure="12,480" />
            <Tile name="التسجيلات" figure="342" />
          </Bento>
        </div>
      </DemoCase>

      <DemoCase id="one" title="One wide tile in 2 columns">
        <Bento as="ul" columns={2}>
          <Tile span="2x1" name="Sign ups" figure="342" />
        </Bento>
      </DemoCase>

      <DemoCase id="many" title="Many tiles in source order, every row filled">
        <Bento as="ul">
          <Tile span="2x2" name="Visitors" figure="12,480" />
          <Tile name="Sign ups" figure="342" />
          <Tile name="Uptime" figure="99.9%" />
          <Tile span="2x1" name="Revenue" figure="$48,200" />
          <Tile span="1x2" name="Open tickets" figure="17" />
          <Tile name="Refunds" figure="6" />
          <Tile name="Plans" figure="3" />
          <Tile name="Errors" figure="4" />
          <Tile span="2x1" name="Churn" figure="1.2%" />
          <Tile name="Latency" figure="120 ms" />
        </Bento>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: the grid grows down, never sideways">
        <Bento as="ul">
          {sample.en.items.map((item, i) => (
            <Tile key={item} span={wide.has(i) ? '2x1' : '1x1'} name={item} figure={String((i + 1) * 12)} />
          ))}
        </Bento>
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps inside its tile">
        <Bento as="ul" columns={3}>
          <Tile span="2x1" name="Release notes">
            <p style={{ margin: 0 }}>{sample.en.long}</p>
          </Tile>
          <Tile name={sample.en.word} figure="1" />
        </Bento>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Bento as="ul" columns={3}>
          <Tile span="2x1" name="ملاحظات الإصدار">
            <p style={{ margin: 0 }}>{sample.ar.long}</p>
          </Tile>
          <Tile name="المستخدمين النشطين" figure="1,204" />
        </Bento>
      </DemoCase>
    </DemoPage>
  );
}
