import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { densities, themes } from '@the-system/tokens/native';
import { useOptionalPart, useTheme } from './hooks';
import { resolveAxes, themeFor } from './resolve';
import { ThemeProvider } from './ThemeProvider';
import type { ThemeValue } from './types';

let seen: ThemeValue | undefined;
let windowControls: boolean | undefined;

function Probe() {
  seen = useTheme();
  windowControls = useOptionalPart('window', 'controls');
  return <Text>probe</Text>;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    seen = undefined;
    windowControls = undefined;
  });

  it('root defaults: studio, its default scheme and density, the device platform, ltr, en', async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(seen?.axes).toEqual({
      style: 'studio',
      scheme: 'dark',
      density: 'default',
      contrast: 'default',
      platform: 'ios',
      glass: 'regular',
      dir: 'ltr',
      lang: 'en',
    });
    expect(seen?.theme).toBe(themes.studio.dark);
    expect(seen?.styleData.id).toBe('studio');
    expect(seen?.reduceMotion).toBe(false);
    expect(screen.getByText('probe')).toBeTruthy();
  });

  it('picks themes[style][scheme] and the style.json data', async () => {
    await render(
      <ThemeProvider style="desk" scheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(seen?.theme).toBe(themes.desk.light);
    expect(seen?.styleData.id).toBe('desk');
    expect(windowControls).toBe(true);
  });

  it('a nested provider takes the parent axes and changes only what it passes', async () => {
    await render(
      <ThemeProvider style="desk" scheme="light" density="comfortable">
        <ThemeProvider lang="ar">
          <Probe />
        </ThemeProvider>
      </ThemeProvider>,
    );
    expect(seen?.axes).toMatchObject({ style: 'desk', scheme: 'light', density: 'comfortable', lang: 'ar', dir: 'rtl' });
    expect(seen?.theme.size.control.md).toBe(densities.comfortable.size.control.md);
  });

  it('an explicit dir wins over lang, and a nested lang alone sets dir', async () => {
    await render(
      <ThemeProvider dir="rtl" lang="en">
        <ThemeProvider style="desk">
          <Probe />
        </ThemeProvider>
      </ThemeProvider>,
    );
    expect(seen?.axes.dir).toBe('rtl');
    expect(seen?.axes.lang).toBe('en');
    expect(windowControls).toBe(true);
  });

  it('an unknown style keeps its id and draws with the default theme object', async () => {
    await render(
      <ThemeProvider style="brand">
        <Probe />
      </ThemeProvider>,
    );
    expect(seen?.axes.style).toBe('brand');
    expect(seen?.theme).toBe(themes.studio.dark);
    expect(windowControls).toBe(false);
  });

  it('contrast more makes the glass materials solid', async () => {
    await render(
      <ThemeProvider style="desk" contrast="more">
        <Probe />
      </ThemeProvider>,
    );
    const material = seen?.theme.color.material;
    expect(material?.glass).toBe(themes.desk.dark?.color.material['glass-solid']);
    expect(material?.dock).toBe(themes.desk.dark?.color.material['glass-solid']);
  });

  it('fonts system drops the family names so the platform font is used', async () => {
    await render(
      <ThemeProvider fonts="system">
        <ThemeProvider style="desk">
          <Probe />
        </ThemeProvider>
      </ThemeProvider>,
    );
    expect(seen?.fonts).toBe('system');
    expect(seen?.theme.font.family.sans).toBeUndefined();
    expect(seen?.theme.font.size).toBe(themes.desk.dark?.font.size);
  });
});

describe('resolveAxes and themeFor', () => {
  it('follows the device: platform, I18nManager rtl, color scheme only when asked', () => {
    const device = { platform: 'android' as const, isRTL: true, colorScheme: 'light' as const };
    expect(resolveAxes({}, null, device)).toMatchObject({ platform: 'android', dir: 'rtl', scheme: 'dark' });
    expect(resolveAxes({}, null, device, true).scheme).toBe('light');
    expect(resolveAxes({ scheme: 'dark' }, null, device, true).scheme).toBe('dark');
  });

  it('returns the same object for the same axes', () => {
    const axes = resolveAxes({ style: 'desk', density: 'compact' }, null);
    expect(themeFor(axes, { solidMaterials: false, fonts: 'theme' })).toBe(themeFor(axes, { solidMaterials: false, fonts: 'theme' }));
  });
});
