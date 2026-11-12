'use client';
// The style, scheme and language switch. Style and scheme are two
// SegmentedControls: a choice writes a cookie and refreshes the route, so
// the server layout stamps the new theme on <html>. Language is a
// LanguageSwitch: two links to the other locale segment, each name in its
// own language with lang and hreflang.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LanguageSwitch, SegmentedControl, SegmentedControlItem, useTheme } from '@the-system/react';
import { copy, isScheme, isStyle, schemes, styleNames, styles, type Locale } from '../lib/copy';
import { SCHEME_COOKIE, STYLE_COOKIE } from '../lib/theme-cookie';

const ONE_YEAR = 60 * 60 * 24 * 365;

export function DisplaySwitch({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const theme = useTheme();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const choose = (cookie: string, value: string) => {
    document.cookie = `${cookie}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div className="display-switch">
      <SegmentedControl
        aria-label={t.styleGroup}
        size="sm"
        value={theme.style}
        onValueChange={(value) => isStyle(value) && choose(STYLE_COOKIE, value)}
      >
        {styles.map((id) => (
          <SegmentedControlItem key={id} value={id} data-choice={`style-${id}`}>
            {styleNames[id]}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <SegmentedControl
        aria-label={t.schemeGroup}
        size="sm"
        value={theme.scheme}
        onValueChange={(value) => isScheme(value) && choose(SCHEME_COOKIE, value)}
      >
        {schemes.map((id) => (
          <SegmentedControlItem key={id} value={id} data-choice={`scheme-${id}`}>
            {id === 'dark' ? t.dark : t.light}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <LanguageSwitch
        size="sm"
        current={locale}
        languages={[
          { code: 'en', name: 'English', href: '/en' },
          { code: 'ar', name: 'العربية', href: '/ar' },
        ]}
      />
    </div>
  );
}
