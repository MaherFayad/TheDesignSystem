import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { LanguageSwitch, type LanguageOption, type LanguageSwitchEmphasis, type LanguageSwitchSize } from './index';

const sizes: LanguageSwitchSize[] = ['sm', 'md'];
const emphases: LanguageSwitchEmphasis[] = ['ghost', 'soft'];

/** The same page in each language: the consumer keeps the path and swaps the locale. */
const pair: LanguageOption[] = [
  { code: 'en', name: 'English', href: '#/en/pricing' },
  { code: 'ar', name: 'العربية', href: '#/ar/pricing' },
];

const many: LanguageOption[] = [
  ...pair,
  { code: 'fr', name: 'Français', href: '#/fr/pricing' },
  { code: 'tr', name: 'Türkçe', href: '#/tr/pricing' },
  { code: 'ur', name: 'اردو', href: '#/ur/pricing' },
  { code: 'id', name: 'Bahasa Indonesia', href: '#/id/pricing' },
];

const tooMany: LanguageOption[] = [
  ...many,
  { code: 'de', name: 'Deutsch', href: '#/de/pricing' },
  { code: 'es', name: 'Español', href: '#/es/pricing' },
  { code: 'pt', name: 'Português', href: '#/pt/pricing' },
  { code: 'fa', name: 'فارسی', href: '#/fa/pricing' },
  { code: 'hi', name: 'हिन्दी', href: '#/hi/pricing' },
  { code: 'ms', name: 'Bahasa Melayu', href: '#/ms/pricing' },
  { code: 'bn', name: 'বাংলা', href: '#/bn/pricing' },
  { code: 'sw', name: 'Kiswahili', href: '#/sw/pricing' },
];

export default function LanguageSwitchDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size and emphasis; two languages are a link pair, more a menu">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <LanguageSwitch size={size} languages={pair} current="en" />
            {emphases.map((emphasis) => (
              <LanguageSwitch
                key={emphasis}
                size={size}
                emphasis={emphasis}
                languages={many}
                current="en"
              />
            ))}
          </DemoRow>
        ))}
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="Size md">
            <LanguageSwitch languages={pair} current="ar" />
            <LanguageSwitch languages={many} current="ar" emphasis="soft" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One other language: the pair">
        <LanguageSwitch languages={pair} current="ar" />
      </DemoCase>

      <DemoCase id="many" title="Many languages: a menu">
        <LanguageSwitch languages={many} current="fr" />
      </DemoCase>

      <DemoCase id="too-many" title="Too many: the menu scrolls inside">
        <LanguageSwitch languages={tooMany} current="en" />
      </DemoCase>

      <DemoCase id="long-text" title="Long names">
        <LanguageSwitch languages={many} current="id" />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <LanguageSwitch
          languages={[
            { code: 'ar', name: 'العربية الفصحى المبسطة', href: '#/ar/pricing' },
            { code: 'en', name: 'English', href: '#/en/pricing' },
          ]}
          current="ar"
        />
      </DemoCase>
    </DemoPage>
  );
}
