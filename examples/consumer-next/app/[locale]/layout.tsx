// The root layout. A server component: it reads the locale from the route
// and the style and scheme from cookies, and stamps every theme attribute on
// <html> with themeAttributes, so the first paint is already themed and the
// page has the right lang and dir before any script runs.
//
// CSS order: the system first (tokens, then components, then style packs),
// then the app's own CSS. The app CSS sits outside any layer, so it wins over
// the system layers whatever the order; importing the system first keeps the
// rule simple for teams that add layers of their own.
import '@the-system/tokens/css';
import '@the-system/css';
import '@the-system/styles';
import '../app.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Theme, Toaster, TooltipProvider, themeAttributes } from '@the-system/react';
import { copy, isLocale, locales } from '../../lib/copy';
import { readThemeChoice } from '../../lib/theme-cookie';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Omit<LayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  const t = isLocale(locale) ? copy[locale] : copy.en;
  return { title: `${t.pageTitle} | ${t.appName}` };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const jar = await cookies();
  const { style, scheme } = readThemeChoice((name) => jar.get(name)?.value);

  return (
    <html {...themeAttributes({ style, scheme, lang: locale })}>
      <body>
        {/* The root Theme gives client components their axes (useTheme), and
            the Dialog and Toaster portals copy them. The Toaster is mounted
            once, here, before any dialog can open. One TooltipProvider shares
            the tooltip delays across the page. */}
        <Theme style={style} scheme={scheme} lang={locale} className="app-root">
          <Toaster />
          <TooltipProvider>{children}</TooltipProvider>
        </Theme>
      </body>
    </html>
  );
}
