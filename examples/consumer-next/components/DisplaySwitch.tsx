'use client';
// The style, scheme and language switch: three small groups of system
// Buttons. Style and scheme write a cookie and refresh the route, so the
// server layout stamps the new theme on <html>. Language is a link to the
// other locale segment, rendered as a Button through asChild.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button, useTheme } from '@the-system/react';
import { copy, schemes, styleNames, styles, type Locale } from '../lib/copy';
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
      <div role="group" aria-label={t.styleGroup} className="switch-group">
        {styles.map((id) => (
          <Button
            key={id}
            size="sm"
            emphasis={theme.style === id ? 'solid' : 'ghost'}
            aria-pressed={theme.style === id}
            data-choice={`style-${id}`}
            onClick={() => choose(STYLE_COOKIE, id)}
          >
            {styleNames[id]}
          </Button>
        ))}
      </div>
      <div role="group" aria-label={t.schemeGroup} className="switch-group">
        {schemes.map((id) => (
          <Button
            key={id}
            size="sm"
            emphasis={theme.scheme === id ? 'solid' : 'ghost'}
            aria-pressed={theme.scheme === id}
            data-choice={`scheme-${id}`}
            onClick={() => choose(SCHEME_COOKIE, id)}
          >
            {id === 'dark' ? t.dark : t.light}
          </Button>
        ))}
      </div>
      <nav aria-label={t.languageGroup} className="switch-group">
        <Button size="sm" emphasis={locale === 'en' ? 'solid' : 'ghost'} asChild>
          <Link href="/en" hrefLang="en" lang="en" aria-current={locale === 'en' ? 'page' : undefined} data-choice="lang-en">
            English
          </Link>
        </Button>
        <Button size="sm" emphasis={locale === 'ar' ? 'solid' : 'ghost'} asChild>
          <Link href="/ar" hrefLang="ar" lang="ar" aria-current={locale === 'ar' ? 'page' : undefined} data-choice="lang-ar">
            العربية
          </Link>
        </Button>
      </nav>
    </div>
  );
}
