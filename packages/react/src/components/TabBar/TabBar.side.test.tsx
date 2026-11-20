// Order C5 (item 6): TabBarSearch with its field while the bar sits in the
// side column. The column is a placement of the same DOM (the field leaves
// the column and is drawn at the foot of the content by the platform CSS);
// here the parts, the name and the focus path are proven in each placement.
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import { SearchField } from '../SearchField';
import { TabBar, TabBarItem, TabBarSearch } from './index';
import type { TabBarPlacement } from './TabBar';

function Bar({ placement, compact = false, lang }: { placement?: TabBarPlacement; compact?: boolean; lang?: 'ar' }) {
  const ar = lang === 'ar';
  return (
    <Theme platform="ios" lang={lang} dir={ar ? 'rtl' : undefined}>
      <TabBar aria-label={ar ? 'التنقل الرئيسي' : 'Main'} placement={placement} compact={compact}>
        <TabBarItem href="#home" icon="home" label={ar ? 'الرئيسية' : 'Home'} />
        <TabBarItem href="#library" icon="library" label={ar ? 'المكتبة' : 'Library'} />
        <TabBarSearch
          href="#search"
          label={ar ? 'البحث' : 'Search'}
          active
          field={<SearchField shape="pill" placeholder={ar ? 'أغاني وفنانين' : 'Songs and artists'} />}
        />
      </TabBar>
    </Theme>
  );
}

const parts = (bar: Element) => Array.from(bar.children).map((c) => c.getAttribute('data-part'));

describe('TabBarSearch in the side column (order C5)', () => {
  for (const placement of ['side', 'bottom', undefined] as const) {
    it(`keeps the field, named by the label, last in the bar (${placement ?? 'auto'})`, () => {
      const { container } = render(<Bar placement={placement} compact />);
      const bar = container.querySelector('[data-ds="tab-bar"]')!;
      expect(bar.getAttribute('data-placement')).toBe(placement ?? null);
      expect(parts(bar).at(-1)).toBe('search');
      const box = bar.lastElementChild!;
      expect(box.hasAttribute('data-expanded')).toBe(true);
      expect(screen.getByRole('searchbox', { name: 'Search' })).toBeTruthy();
    });
  }

  it('Tab reaches the field after the items in the column, as in the row', async () => {
    const user = userEvent.setup();
    render(<Bar placement="side" />);
    screen.getByRole('link', { name: 'Library' }).focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search' }));
  });

  it('names the field in Arabic in the column', () => {
    render(<Bar placement="side" lang="ar" />);
    expect(screen.getByRole('searchbox', { name: 'البحث' })).toBeTruthy();
  });
});
