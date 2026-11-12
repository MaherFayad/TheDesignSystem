import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE, attributesOf, getStyleData, resolveTheme, styleIds, themeAttributes } from './theme';

describe('resolveTheme', () => {
  it('gives the root defaults: studio, its default scheme and density, web, regular, en, ltr', () => {
    const v = resolveTheme({});
    expect(DEFAULT_STYLE).toBe('studio');
    expect(v).toMatchObject({ style: 'studio', scheme: 'dark', contrast: 'default', platform: 'web', glass: 'regular', lang: 'en', dir: 'ltr' });
    expect(v.density).toBe(getStyleData('studio').defaultDensity);
    expect(v.styleData.id).toBe('studio');
  });

  it('takes the input, then the parent, then the root default, per axis', () => {
    const parent = resolveTheme({ style: 'desk', scheme: 'light', density: 'compact', contrast: 'more', lang: 'ar' });
    const child = resolveTheme({ density: 'comfortable' }, parent);
    expect(child).toMatchObject({ style: 'desk', scheme: 'light', density: 'comfortable', contrast: 'more', lang: 'ar', dir: 'rtl' });
  });

  it('lets lang set dir when dir is not passed, and dir win when it is', () => {
    expect(resolveTheme({ lang: 'ar' }).dir).toBe('rtl');
    expect(resolveTheme({ lang: 'ar', dir: 'ltr' }).dir).toBe('ltr');
    const rtl = resolveTheme({ lang: 'ar' });
    expect(resolveTheme({ lang: 'en' }, rtl).dir).toBe('ltr');
    expect(resolveTheme({}, rtl).dir).toBe('rtl');
  });

  it('falls back to the default scheme for a scheme the style does not list', () => {
    const v = resolveTheme({ style: 'studio', scheme: 'sepia' as never });
    expect(v.scheme).toBe(getStyleData('studio').defaultScheme);
  });

  it('gives a custom style id plain defaults', () => {
    const v = resolveTheme({ style: 'brand-x' });
    expect(v.style).toBe('brand-x');
    expect(v.styleData).toMatchObject({ id: 'brand-x', schemes: ['dark', 'light'], optionalParts: {} });
    expect(styleIds).toContain('studio');
    expect(styleIds).not.toContain('brand-x');
  });

  it('uses root defaults (React Native: the device) only at the root and only when the input is silent', () => {
    const root = resolveTheme({}, null, { platform: 'ios', dir: 'rtl', contrast: 'more' });
    expect(root).toMatchObject({ platform: 'ios', dir: 'rtl', contrast: 'more', lang: 'en' });
    expect(resolveTheme({ platform: 'android' }, null, { platform: 'ios' }).platform).toBe('android');
    expect(resolveTheme({ lang: 'en' }, null, { dir: 'rtl' }).dir).toBe('ltr');
    const parent = resolveTheme({ platform: 'web' });
    expect(resolveTheme({}, parent, { platform: 'ios', dir: 'rtl', contrast: 'more' })).toMatchObject({ platform: 'web', dir: 'ltr', contrast: 'default' });
  });
});

describe('themeAttributes', () => {
  it('stamps every axis and data-ds theme', () => {
    expect(themeAttributes({ style: 'desk', lang: 'ar' })).toEqual({
      'data-ds': 'theme',
      'data-style': 'desk',
      'data-scheme': getStyleData('desk').defaultScheme,
      'data-density': getStyleData('desk').defaultDensity,
      'data-contrast': 'default',
      'data-platform': 'web',
      'data-glass': 'regular',
      dir: 'rtl',
      lang: 'ar',
    });
    expect(attributesOf(resolveTheme({}))['data-style']).toBe('studio');
  });
});
