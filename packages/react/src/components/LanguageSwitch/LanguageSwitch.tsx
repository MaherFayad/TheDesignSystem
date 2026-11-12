'use client';
// LanguageSwitch: moves the reader to the same page in another language.
// Two languages render as a pair of system Links; more render a
// DropdownMenu of radio items behind a Button trigger.
//
// Source: GoBanana site `SiteNav.tsx` (`switchLocalePath`: the same path in
// the other locale) was not reachable from this session. The consumer
// builds each href, so the switch keeps the page.
//
// The DOM, two languages:
//
//   <nav data-ds="language-switch" aria-label="Language" data-size data-emphasis>
//     <a data-ds="link" data-part="item" href hreflang="en" lang="en" aria-current="true" data-active>English</a>
//     <a data-ds="link" data-part="item" href hreflang="ar" lang="ar">العربية</a>
//
// More languages:
//
//   <nav data-ds="language-switch" ...>
//     <button data-ds="button" data-part="trigger" aria-haspopup="menu">  globe-like language icon, the current name
//   <body> ... <div data-ds="dropdown-menu" data-part="menu" role="menu">
//                <div data-part="radio-item" role="menuitemradio" lang aria-checked>
//
// Decisions:
// - Each language is named in its own language with lang set, never a flag:
//   English, العربية. The accessible name is that name, read in its voice.
// - The current language stays in the pair, marked by weight, a missing
//   underline, data-active and aria-current="true", so the pair reads as a
//   choice and the reader sees where they are.
// - Menu items are radio items (the current one checked), so the menu says
//   which language is active. Choosing one calls onNavigate, or sends the
//   browser to its href.
// - emphasis styles the menu trigger (a Button). The pair is always links.
// - The trigger is named "Language: English" (the nav label, then the
//   visible name), so it says what it changes; the menu takes its name from
//   the trigger.
import type { HTMLAttributes, Ref } from 'react';
import type { Emphasis, Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { Button } from '../Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../DropdownMenu';
import { Link } from '../Link';

export type LanguageSwitchSize = Extract<Size, 'sm' | 'md'>;
export type LanguageSwitchEmphasis = Extract<Emphasis, 'ghost' | 'soft'>;

/** One language the page exists in. */
export interface LanguageOption {
  /** A BCP 47 tag: en, ar, fr. Sets lang and hreflang. */
  code: string;
  /** The name of the language in that language: English, العربية, Français. */
  name: string;
  /** The same page in this language. */
  href: string;
}

const words = {
  en: { label: 'Language' },
  ar: { label: 'اللغة' },
} as const;

/** Text direction of a language tag, for the name shown in it. */
function dirOf(code: string): 'rtl' | 'ltr' {
  return /^(ar|fa|he|ur|ps|ckb|dv|yi)(-|$)/i.test(code) ? 'rtl' : 'ltr';
}

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface LanguageSwitchProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  /** The languages the page exists in, each named in its own language. Two render a link pair, more a menu. */
  languages: readonly LanguageOption[];
  /** The code of the language the page is in now. */
  current: string;
  /** Type and trigger size: sm or md. Default md. */
  size?: LanguageSwitchSize;
  /** How loud the menu trigger is. Default ghost. The pair is always links. */
  emphasis?: LanguageSwitchEmphasis;
  /** The accessible name of the nav. Default "Language", in Arabic "اللغة". */
  label?: string;
  /** Called when a language is chosen from the menu. Default: the browser goes to its href. */
  onNavigate?: (language: LanguageOption) => void;
  ref?: Ref<HTMLElement>;
}

/** Switches the page to another language: a link pair for two, a menu for more. */
export function LanguageSwitch({
  languages,
  current,
  size = 'md',
  emphasis = 'ghost',
  label,
  onNavigate,
  ref,
  ...rest
}: LanguageSwitchProps) {
  const { lang } = useTheme();
  const t = words[lang === 'ar' ? 'ar' : 'en'];
  const active = languages.find((l) => l.code === current) ?? languages[0];
  const navLabel = label ?? rest['aria-label'] ?? t.label;

  return (
    <nav
      {...rest}
      ref={ref}
      data-ds="language-switch"
      data-size={size}
      data-emphasis={emphasis}
      aria-label={navLabel}
    >
      {languages.length <= 2 ? (
        languages.map((l) => {
          const isActive = l.code === active?.code;
          return (
            <Link
              key={l.code}
              data-part="item"
              standalone
              href={l.href}
              hrefLang={l.code}
              lang={l.code}
              dir={dirOf(l.code)}
              data-active={isActive ? '' : undefined}
              aria-current={isActive ? 'true' : undefined}
            >
              {l.name}
            </Link>
          );
        })
      ) : (
        <DropdownMenu size={size}>
          <DropdownMenuTrigger>
            <Button
              data-part="trigger"
              size={size === 'sm' ? 'sm' : 'md'}
              emphasis={emphasis}
              start="language"
              end="chevron-down"
              aria-label={`${navLabel}: ${active?.name ?? ''}`}
            >
              <span lang={active?.code} dir={active ? dirOf(active.code) : undefined}>
                {active?.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-part="menu">
            <DropdownMenuRadioGroup
              value={active?.code}
              onValueChange={(code) => {
                const next = languages.find((l) => l.code === code);
                if (!next || next.code === active?.code) return;
                if (onNavigate) onNavigate(next);
                else window.location.assign(next.href);
              }}
            >
              {languages.map((l) => (
                <DropdownMenuRadioItem key={l.code} value={l.code} lang={l.code} textValue={l.name}>
                  {/* The direction goes on the name only: the row keeps the menu's layout. */}
                  <span dir={dirOf(l.code)}>{l.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
