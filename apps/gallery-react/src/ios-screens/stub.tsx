// The empty screen a stub shows until its order builds it (order M10.0).
// Screen orders stop importing this file once their screen is built.
import { EmptyState } from '@the-system/react';
import { ScreenShell } from './kit';
import type { ScreenMeta, ScreenProps } from './types';

const words = {
  en: { title: 'Screen not built yet', body: (order: string) => `Order ${order} builds this screen.` },
  ar: { title: 'الشاشة قيد البناء', body: (order: string) => `الطلب ${order} يبني هذي الشاشة.` },
};

export function StubScreen({ meta, lang }: ScreenProps & { meta: ScreenMeta }) {
  const w = words[lang];
  return (
    <ScreenShell>
      <div data-gallery="ios-stub">
        <EmptyState size="lg" icon="grid" title={w.title} headingLevel={2}>
          {w.body(meta.order)}
        </EmptyState>
      </div>
    </ScreenShell>
  );
}
