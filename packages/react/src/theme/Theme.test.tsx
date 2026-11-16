import { act, render, screen } from '@testing-library/react';
import { use } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Direction } from 'radix-ui';
import { IconSetContext } from '@the-system/icons/react';
import desk from '@the-system/styles/desk/style.json' with { type: 'json' };
import studio from '@the-system/styles/studio/style.json' with { type: 'json' };
import { Bidi } from './Bidi';
import { useDevicePlatform, useOptionalPart, useTheme } from './hooks';
import { themeAttributes } from './resolve';
import { Theme } from './Theme';

function themes(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-ds="theme"]'));
}

function attrs(el: HTMLElement | undefined) {
  if (!el) throw new Error('no theme element');
  return {
    style: el.getAttribute('data-style'),
    scheme: el.getAttribute('data-scheme'),
    density: el.getAttribute('data-density'),
    contrast: el.getAttribute('data-contrast'),
    platform: el.getAttribute('data-platform'),
    glass: el.getAttribute('data-glass'),
    dir: el.getAttribute('dir'),
    lang: el.getAttribute('lang'),
  };
}

function Probe({ id }: { id: string }) {
  const t = useTheme();
  const dir = Direction.useDirection();
  const icons = use(IconSetContext);
  const controls = useOptionalPart('window', 'controls');
  return (
    <output data-testid={id} data-style-name={t.styleData.name} data-radix-dir={dir} data-icon-set={icons.set}>
      {controls ? 'controls' : 'none'}
    </output>
  );
}

describe('Theme', () => {
  it('stamps every axis with the root defaults', () => {
    const { container } = render(<Theme>body</Theme>);
    const [el] = themes(container);
    expect(el?.tagName).toBe('DIV');
    expect(attrs(el)).toEqual({
      style: 'studio',
      scheme: studio.defaultScheme,
      density: studio.defaultDensity,
      contrast: 'default',
      platform: 'web',
      glass: 'regular',
      dir: 'ltr',
      lang: 'en',
    });
  });

  it('takes scheme and density defaults from the style.json', () => {
    const { container } = render(<Theme style="desk" />);
    const a = attrs(themes(container)[0]);
    expect(a.scheme).toBe(desk.defaultScheme);
    expect(a.density).toBe(desk.defaultDensity);
  });

  it('stamps the axes it is given', () => {
    const { container } = render(
      <Theme style="desk" scheme="light" density="compact" contrast="more" platform="ios" glass="tinted" dir="rtl" lang="ar" />,
    );
    expect(attrs(themes(container)[0])).toEqual({
      style: 'desk',
      scheme: 'light',
      density: 'compact',
      contrast: 'more',
      platform: 'ios',
      glass: 'tinted',
      dir: 'rtl',
      lang: 'ar',
    });
  });

  it('derives dir from lang', () => {
    const { container } = render(
      <Theme lang="ar">
        <Theme lang="en" />
        <Theme />
      </Theme>,
    );
    const [outer, en, inherited] = themes(container);
    expect(attrs(outer).dir).toBe('rtl');
    expect(attrs(en).dir).toBe('ltr');
    expect(attrs(inherited)).toMatchObject({ dir: 'rtl', lang: 'ar' });
  });

  it('nested Theme inherits from the parent and overrides what it is given', () => {
    const { container } = render(
      <Theme style="desk" scheme="light" density="comfortable" dir="rtl" lang="ar" glass="clear">
        <Theme scheme="dark">
          <Theme style="studio" />
        </Theme>
      </Theme>,
    );
    const [, middle, inner] = themes(container);
    expect(attrs(middle)).toEqual({
      style: 'desk',
      scheme: 'dark',
      density: 'comfortable',
      contrast: 'default',
      platform: 'web',
      glass: 'clear',
      dir: 'rtl',
      lang: 'ar',
    });
    expect(attrs(inner)).toMatchObject({ style: 'studio', scheme: 'dark', density: 'comfortable', dir: 'rtl' });
  });

  it('falls back to the default scheme and plain data for a custom style', () => {
    render(
      <Theme style="custom">
        <Probe id="p" />
      </Theme>,
    );
    const probe = screen.getByTestId('p');
    expect(probe.closest('[data-ds="theme"]')?.getAttribute('data-scheme')).toBe('dark');
    expect(probe.getAttribute('data-style-name')).toBe('custom');
    expect(probe.getAttribute('data-icon-set')).toBe('pixel');
  });

  it('passes as, className, css and other props through', () => {
    const { container } = render(
      <Theme as="main" className="app" css={{ minBlockSize: '100%' }} data-testid="root" id="top" aria-label="App" />,
    );
    const el = themes(container)[0];
    expect(el?.tagName).toBe('MAIN');
    expect(el?.className).toBe('app');
    expect(el?.style.minBlockSize).toBe('100%');
    expect(el?.id).toBe('top');
    expect(el?.getAttribute('aria-label')).toBe('App');
    expect(el?.getAttribute('data-testid')).toBe('root');
  });

  it('provides useTheme, the Radix direction and the icon set', () => {
    render(
      <Theme style="desk" dir="rtl">
        <Probe id="p" />
      </Theme>,
    );
    const probe = screen.getByTestId('p');
    expect(probe.getAttribute('data-style-name')).toBe('Desk');
    expect(probe.getAttribute('data-radix-dir')).toBe('rtl');
    expect(probe.getAttribute('data-icon-set')).toBe(desk.iconSet);
  });

  it('useTheme outside a Theme gives the root defaults', () => {
    render(<Probe id="p" />);
    expect(screen.getByTestId('p').getAttribute('data-style-name')).toBe('Studio');
  });
});

describe('useOptionalPart', () => {
  it('is true only when the active style lists the part', () => {
    render(
      <>
        <Theme style="desk">
          <Probe id="desk" />
        </Theme>
        <Theme style="studio">
          <Probe id="studio" />
        </Theme>
        <Theme style="desk">
          <Theme style="studio">
            <Probe id="nested" />
          </Theme>
        </Theme>
      </>,
    );
    expect(screen.getByTestId('desk').textContent).toBe('controls');
    expect(screen.getByTestId('studio').textContent).toBe('none');
    expect(screen.getByTestId('nested').textContent).toBe('none');
  });
});

describe('themeAttributes', () => {
  it('resolves like a root Theme', () => {
    expect(themeAttributes({ style: 'desk', lang: 'ar' })).toEqual({
      'data-ds': 'theme',
      'data-style': 'desk',
      'data-scheme': desk.defaultScheme,
      'data-density': desk.defaultDensity,
      'data-contrast': 'default',
      'data-platform': 'web',
      'data-glass': 'regular',
      dir: 'rtl',
      lang: 'ar',
    });
  });
});

describe('Bidi', () => {
  it('wraps each Latin run inside Arabic in an ltr bdi', () => {
    const { container } = render(<Bidi>نزله بصيغة JSON وأرسله في Figma.</Bidi>);
    const root = container.querySelector('[data-ds="bidi"]');
    expect(root?.tagName).toBe('SPAN');
    const runs = Array.from(root?.querySelectorAll('bdi') ?? []);
    expect(runs.map((r) => r.textContent)).toEqual(['JSON', 'Figma']);
    expect(runs.every((r) => r.getAttribute('dir') === 'ltr' && r.getAttribute('data-part') === 'run')).toBe(true);
    expect(root?.textContent).toBe('نزله بصيغة JSON وأرسله في Figma.');
  });

  it('leaves English as it is', () => {
    const { container } = render(<Bidi className="x">Export as JSON.</Bidi>);
    const root = container.querySelector('[data-ds="bidi"]');
    expect(root?.querySelector('bdi')).toBeNull();
    expect(root?.textContent).toBe('Export as JSON.');
    expect(root?.className).toBe('x');
  });
});

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const PIXEL = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

function asDevice(userAgent: string) {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);
}

function DeviceProbe() {
  return <output data-testid="device">{useDevicePlatform()}</output>;
}

describe('Theme platform', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a root Theme with no platform follows the device', () => {
    asDevice(IPHONE);
    const { container, unmount } = render(<Theme />);
    expect(attrs(themes(container)[0]).platform).toBe('ios');
    unmount();
    asDevice(PIXEL);
    const pixel = render(<Theme />);
    expect(attrs(themes(pixel.container)[0]).platform).toBe('android');
  });

  it('auto in the test browser (jsdom, a desktop agent) resolves to web', () => {
    const { container } = render(<Theme platform="auto" />);
    expect(attrs(themes(container)[0]).platform).toBe('web');
  });

  it('an explicit value wins over the device, macos included', () => {
    asDevice(IPHONE);
    const { container } = render(
      <>
        <Theme platform="web" />
        <Theme platform="android" />
        <Theme platform="macos" />
      </>,
    );
    expect(themes(container).map((el) => attrs(el).platform)).toEqual(['web', 'android', 'macos']);
  });

  it('never stamps auto', () => {
    asDevice(PIXEL);
    const { container } = render(
      <Theme platform="auto">
        <Theme platform="auto" />
      </Theme>,
    );
    expect(themes(container).map((el) => el.getAttribute('data-platform'))).toEqual(['android', 'android']);
  });

  it('a nested Theme with no platform inherits; a nested auto asks the device again', () => {
    asDevice(IPHONE);
    const { container } = render(
      <Theme platform="web">
        <Theme />
        <Theme platform="auto" />
      </Theme>,
    );
    expect(themes(container).map((el) => attrs(el).platform)).toEqual(['web', 'web', 'ios']);
  });

  it('useTheme reports the resolved platform', () => {
    asDevice(PIXEL);
    function Read() {
      return <output data-testid="p">{useTheme().platform}</output>;
    }
    render(
      <Theme>
        <Read />
      </Theme>,
    );
    expect(screen.getByTestId('p').textContent).toBe('android');
  });

  it('renders web on the server and stamps the device once on mount, with no hydration warning', async () => {
    asDevice(IPHONE);
    const html = renderToString(
      <Theme style="liquid">
        <DeviceProbe />
      </Theme>,
    );
    expect(html).toContain('data-platform="web"');
    expect(html).toContain('>web</output>');
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const recoverable = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(
        host,
        <Theme style="liquid">
          <DeviceProbe />
        </Theme>,
        { onRecoverableError: recoverable },
      );
    });
    expect(host.querySelector('[data-ds="theme"]')?.getAttribute('data-platform')).toBe('ios');
    expect(host.querySelector('output')?.textContent).toBe('ios');
    expect(errors).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
    act(() => root?.unmount());
    host.remove();
  });

  it('an explicit platform renders the same on the server and the client', () => {
    asDevice(IPHONE);
    expect(renderToString(<Theme platform="android" />)).toContain('data-platform="android"');
  });
});
