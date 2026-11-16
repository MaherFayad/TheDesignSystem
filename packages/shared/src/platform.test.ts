import { describe, expect, it } from 'vitest';
import { PLATFORM_QUERY_KEY, PLATFORM_STORAGE_KEY, detectPlatform, deviceOf, isPlatform, platformChoice, platformInputOf, platforms, resolvePlatform, type DeviceInfo } from './platform';
import type { Platform } from './theme';

const safariMac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
const chromeMac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const chromeAndroid = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const chromeLinux = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

/** One device each, with the platform `auto` must give. */
const fixtures: readonly { name: string; device: DeviceInfo; expected: Platform }[] = [
  // The seven fixtures order R0.10 names.
  {
    name: 'iPhone Safari',
    device: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', maxTouchPoints: 5 },
    expected: 'ios',
  },
  { name: 'iPad in desktop mode (Mac agent, touch)', device: { userAgent: safariMac, maxTouchPoints: 5 }, expected: 'ios' },
  {
    name: 'Android Chrome',
    device: { userAgent: chromeAndroid, userAgentData: { platform: 'Android', mobile: true }, maxTouchPoints: 5 },
    expected: 'android',
  },
  { name: 'Mac Safari', device: { userAgent: safariMac, maxTouchPoints: 0 }, expected: 'web' },
  { name: 'Mac Chrome', device: { userAgent: chromeMac, userAgentData: { platform: 'macOS', mobile: false }, maxTouchPoints: 0 }, expected: 'web' },
  {
    name: 'Windows Chrome',
    device: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      userAgentData: { platform: 'Windows', mobile: false },
      maxTouchPoints: 0,
    },
    expected: 'web',
  },
  { name: 'Linux Firefox', device: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0', maxTouchPoints: 0 }, expected: 'web' },
  // More cases at the edges.
  {
    name: 'iPad with its own agent',
    device: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', maxTouchPoints: 5 },
    expected: 'ios',
  },
  {
    name: 'iPod touch',
    device: { userAgent: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1' },
    expected: 'ios',
  },
  {
    name: 'Chrome on iPhone',
    device: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1', maxTouchPoints: 5 },
    expected: 'ios',
  },
  { name: 'Android Chrome in desktop mode (Linux agent, hints say Android)', device: { userAgent: chromeLinux, userAgentData: { platform: 'Android', mobile: false }, maxTouchPoints: 5 }, expected: 'android' },
  { name: 'Firefox on Android (no hints)', device: { userAgent: 'Mozilla/5.0 (Android 15; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0', maxTouchPoints: 5 }, expected: 'android' },
  {
    name: 'Android tablet',
    device: { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', userAgentData: { platform: 'Android', mobile: false }, maxTouchPoints: 10 },
    expected: 'android',
  },
  {
    name: 'Windows touch laptop',
    device: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', userAgentData: { platform: 'Windows' }, maxTouchPoints: 10 },
    expected: 'web',
  },
  { name: 'Linux Chrome', device: { userAgent: chromeLinux, userAgentData: { platform: 'Linux', mobile: false } }, expected: 'web' },
  { name: 'Mac agent with one touch point', device: { userAgent: safariMac, maxTouchPoints: 1 }, expected: 'web' },
  { name: 'an empty record', device: {}, expected: 'web' },
];

describe('detectPlatform', () => {
  for (const f of fixtures) {
    it(`gives ${f.expected} for ${f.name}`, () => {
      expect(detectPlatform(f.device)).toBe(f.expected);
    });
  }

  it('never gives macos', () => {
    for (const f of fixtures) expect(detectPlatform(f.device)).not.toBe('macos');
  });

  it('gives web without a device', () => {
    expect(detectPlatform(undefined)).toBe('web');
    expect(detectPlatform(null)).toBe('web');
  });

  it('lets the client hints platform win over the agent string', () => {
    expect(detectPlatform({ userAgent: chromeLinux, userAgentData: { platform: ' android ' } })).toBe('android');
    expect(detectPlatform({ userAgent: safariMac, userAgentData: { platform: 'iOS' } })).toBe('ios');
  });
});

describe('deviceOf', () => {
  it('copies only the fields the resolver reads', () => {
    const nav = { userAgent: chromeAndroid, userAgentData: { platform: 'Android', mobile: true, brands: [] }, maxTouchPoints: 5, language: 'en' };
    expect(deviceOf(nav)).toEqual({ userAgent: chromeAndroid, userAgentData: { platform: 'Android', mobile: true }, maxTouchPoints: 5 });
  });

  it('survives a missing or odd navigator', () => {
    expect(deviceOf(undefined)).toEqual({});
    expect(deviceOf(null)).toEqual({});
    expect(deviceOf({ userAgent: 3, userAgentData: 'x', maxTouchPoints: '5' })).toEqual({ userAgent: null, userAgentData: null, maxTouchPoints: null });
    expect(detectPlatform(deviceOf({}))).toBe('web');
  });
});

describe('platform values', () => {
  it('lists the four stamped values and the contract keys', () => {
    expect(platforms).toEqual(['web', 'ios', 'android', 'macos']);
    expect(PLATFORM_QUERY_KEY).toBe('platform');
    expect(PLATFORM_STORAGE_KEY).toBe('ds-platform');
  });

  it('takes only the four values from a URL key or a stored choice', () => {
    expect(isPlatform('macos')).toBe(true);
    expect(isPlatform('auto')).toBe(false);
    expect(platformChoice('android')).toBe('android');
    expect(platformChoice('auto')).toBeUndefined();
    expect(platformChoice('windows')).toBeUndefined();
    expect(platformChoice('IOS')).toBeUndefined();
    expect(platformChoice('')).toBeUndefined();
    expect(platformChoice(null)).toBeUndefined();
  });
});

describe('resolvePlatform, the order of the contract', () => {
  it('1. a prop that is not auto wins over everything', () => {
    expect(resolvePlatform({ prop: 'web', query: 'android', stored: 'macos', device: 'ios' })).toBe('web');
    expect(resolvePlatform({ prop: 'macos', device: 'ios' })).toBe('macos');
  });

  it('2. then the URL key', () => {
    expect(resolvePlatform({ prop: 'auto', query: 'web', stored: 'android', device: 'ios' })).toBe('web');
    expect(resolvePlatform({ query: 'macos', device: 'web' })).toBe('macos');
  });

  it('2. an unknown URL value is ignored', () => {
    expect(resolvePlatform({ query: 'windows', stored: 'android', device: 'ios' })).toBe('android');
    expect(resolvePlatform({ query: 'auto', device: 'ios' })).toBe('ios');
  });

  it('3. then the stored choice', () => {
    expect(resolvePlatform({ prop: 'auto', stored: 'android', device: 'ios' })).toBe('android');
    expect(resolvePlatform({ stored: 'nonsense', device: 'ios' })).toBe('ios');
  });

  it('4. then the device', () => {
    expect(resolvePlatform({ prop: 'auto', device: 'android' })).toBe('android');
    expect(resolvePlatform({ device: 'ios' })).toBe('ios');
  });

  it('5. otherwise web', () => {
    expect(resolvePlatform({})).toBe('web');
    expect(resolvePlatform({ prop: 'auto', device: null })).toBe('web');
  });

  it('gives the input after steps 1 to 3 for a root Theme to finish', () => {
    expect(platformInputOf({})).toBe('auto');
    expect(platformInputOf({ query: 'ios' })).toBe('ios');
    expect(platformInputOf({ stored: 'macos' })).toBe('macos');
    expect(platformInputOf({ prop: 'android', query: 'ios' })).toBe('android');
  });

  it('matches the contract table', () => {
    const iphone = detectPlatform(fixtures[0]?.device);
    const pixel = detectPlatform(fixtures[2]?.device);
    const mac = detectPlatform(fixtures[3]?.device);
    expect(resolvePlatform({ device: iphone })).toBe('ios');
    expect(resolvePlatform({ device: pixel })).toBe('android');
    expect(resolvePlatform({ device: mac })).toBe('web');
    expect(resolvePlatform({ query: 'macos', device: mac })).toBe('macos');
    expect(resolvePlatform({ query: 'web', device: iphone })).toBe('web');
    expect(resolvePlatform({ stored: 'android', device: iphone })).toBe('android');
    expect(resolvePlatform({ prop: 'web', query: 'ios', stored: 'android', device: iphone })).toBe('web');
  });
});
