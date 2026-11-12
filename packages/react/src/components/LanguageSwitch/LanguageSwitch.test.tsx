import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import LanguageSwitchDemo from './LanguageSwitch.demo';
import { LanguageSwitch, type LanguageOption } from './index';

const pair: LanguageOption[] = [
  { code: 'en', name: 'English', href: '/en/pricing' },
  { code: 'ar', name: 'العربية', href: '/ar/pricing' },
];
const many: LanguageOption[] = [...pair, { code: 'fr', name: 'Français', href: '/fr/pricing' }];

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="language-switch"]');
  if (!el) throw new Error('no language switch rendered');
  return el;
}

describe('LanguageSwitch', () => {
  it('two languages render a labelled nav of Links with hreflang and lang', () => {
    const { container } = render(<LanguageSwitch languages={pair} current="en" />);
    const el = root(container);
    expect(el.tagName).toBe('NAV');
    expect(el.getAttribute('aria-label')).toBe('Language');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    const en = screen.getByRole('link', { name: 'English' });
    const ar = screen.getByRole('link', { name: 'العربية' });
    for (const [link, code] of [
      [en, 'en'],
      [ar, 'ar'],
    ] as const) {
      expect(link.getAttribute('data-ds')).toBe('link');
      expect(link.getAttribute('data-part')).toBe('item');
      expect(link.getAttribute('hreflang')).toBe(code);
      expect(link.getAttribute('lang')).toBe(code);
    }
    expect(ar.getAttribute('dir')).toBe('rtl');
    expect(en.getAttribute('dir')).toBe('ltr');
    expect(ar.getAttribute('href')).toBe('/ar/pricing');
    expect(en.getAttribute('aria-current')).toBe('page');
    expect(en.getAttribute('data-size')).toBe('sm');
    expect(en.hasAttribute('data-active')).toBe(true);
    expect(ar.hasAttribute('aria-current')).toBe(false);
    expect(ar.hasAttribute('data-active')).toBe(false);
    expect(container.querySelector('[data-part="trigger"]')).toBeNull();
    expect(container.querySelector('img, [data-icon="flag"]')).toBeNull();
  });

  it('three or more render a menu trigger with the current name', () => {
    const { container } = render(<LanguageSwitch languages={many} current="fr" emphasis="soft" size="sm" />);
    const trigger = container.querySelector<HTMLElement>('[data-part="trigger"]');
    expect(trigger?.getAttribute('data-ds')).toBe('button');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger?.getAttribute('data-emphasis')).toBe('soft');
    expect(trigger?.getAttribute('data-size')).toBe('sm');
    expect(trigger?.querySelector('[lang="fr"]')?.textContent).toBe('Français');
    expect(trigger?.querySelector('[data-icon="language"]')).not.toBeNull();
    expect(root(container).getAttribute('data-emphasis')).toBe('soft');
  });

  it('the menu lists every language as radio items, the current one checked, and navigates', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<LanguageSwitch languages={many} current="en" onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: 'English, Language' }));
    const menu = screen.getByRole('menu', { name: 'English, Language' });
    expect(menu.getAttribute('data-part')).toBe('menu');
    const items = screen.getAllByRole('menuitemradio');
    expect(items.map((i) => i.textContent)).toEqual(['English', 'العربية', 'Français']);
    expect(items.map((i) => i.getAttribute('lang'))).toEqual(['en', 'ar', 'fr']);
    expect(items[0]?.getAttribute('aria-checked')).toBe('true');
    expect(items[1]?.querySelector('[dir="rtl"]')).not.toBeNull();
    await user.click(items[1]!);
    expect(onNavigate).toHaveBeenCalledWith(many[1]);
  });

  it('choosing the current language does nothing', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<LanguageSwitch languages={many} current="en" onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: 'English, Language' }));
    await user.click(screen.getAllByRole('menuitemradio')[0]!);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('marks nothing when current matches no language, and renders nothing for one language', () => {
    const { container, rerender } = render(<LanguageSwitch languages={pair} current="fr" />);
    expect(container.querySelector('[data-active]')).toBeNull();
    expect(container.querySelector('[aria-current]')).toBeNull();
    rerender(<LanguageSwitch languages={pair.slice(0, 1)} current="en" />);
    expect(container.querySelector('[data-ds="language-switch"]')).toBeNull();
  });

  it('uses the Arabic label inside an Arabic Theme and takes a custom one', () => {
    const { rerender } = render(
      <Theme lang="ar">
        <LanguageSwitch languages={pair} current="ar" />
      </Theme>,
    );
    expect(screen.getByRole('navigation', { name: 'اللغة' })).not.toBeNull();
    rerender(<LanguageSwitch languages={pair} current="ar" label="Site language" />);
    expect(screen.getByRole('navigation', { name: 'Site language' })).not.toBeNull();
  });

  it('Tab moves through the pair', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitch languages={pair} current="en" />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'English' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'العربية' }));
  });

  it('takes ref as a prop and passes props through', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<LanguageSwitch ref={ref} languages={pair} current="en" className="x" />);
    expect(ref.current).toBe(root(container));
    expect(root(container).className).toBe('x');
  });

  it('renders every demo case', () => {
    const { container } = render(<LanguageSwitchDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    const variants = container.querySelector('[data-demo-case="variants"]');
    for (const size of ['sm', 'md']) expect(variants?.querySelector(`[data-ds="language-switch"][data-size="${size}"]`)).not.toBeNull();
    for (const e of ['ghost', 'soft']) expect(variants?.querySelector(`[data-ds="language-switch"][data-emphasis="${e}"]`)).not.toBeNull();
    expect(variants?.querySelector('[data-ds="theme"][lang="ar"] [data-ds="language-switch"]')).not.toBeNull();
  });
});
