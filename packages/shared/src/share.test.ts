import { afterEach, describe, expect, it, vi } from 'vitest';
import { canSystemShare, share, shareLinkLabel, type ShareNavigator } from './share';

const data = { title: 'Weekend in AlUla', url: 'https://example.com/trips/alula' };

function domError(name: string): Error {
  const e = new Error(name);
  e.name = name;
  return e;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('share', () => {
  it('calls the system sheet when it exists and resolves system', async () => {
    const nav: ShareNavigator = { share: vi.fn().mockResolvedValue(undefined), canShare: vi.fn().mockReturnValue(true) };
    await expect(share(data, { navigator: nav })).resolves.toBe('system');
    expect(nav.share).toHaveBeenCalledWith(data);
    expect(nav.canShare).toHaveBeenCalledWith(data);
  });

  it('resolves fallback without navigator.share and never throws', async () => {
    await expect(share(data, { navigator: {} })).resolves.toBe('fallback');
  });

  it('reads the global navigator at call time', async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share: shareFn });
    await expect(share(data)).resolves.toBe('system');
    expect(shareFn).toHaveBeenCalledOnce();
    vi.stubGlobal('navigator', {});
    await expect(share(data)).resolves.toBe('fallback');
  });

  it('resolves fallback when there is no navigator at all', async () => {
    vi.stubGlobal('navigator', undefined);
    await expect(share(data)).resolves.toBe('fallback');
  });

  it('a cancel (AbortError) is cancelled, not an error, and not the fallback', async () => {
    const nav: ShareNavigator = { share: vi.fn().mockRejectedValue(domError('AbortError')) };
    await expect(share(data, { navigator: nav })).resolves.toBe('cancelled');
  });

  it('a sheet already open (InvalidStateError) is cancelled, so no panel opens on top', async () => {
    const nav: ShareNavigator = { share: vi.fn().mockRejectedValue(domError('InvalidStateError')) };
    await expect(share(data, { navigator: nav })).resolves.toBe('cancelled');
  });

  it('a refused share (NotAllowedError, TypeError, anything else) resolves fallback', async () => {
    for (const reason of [domError('NotAllowedError'), new TypeError('bad data'), domError('DataError'), 'odd']) {
      const nav: ShareNavigator = { share: vi.fn().mockRejectedValue(reason) };
      await expect(share(data, { navigator: nav })).resolves.toBe('fallback');
    }
  });

  it('system never skips the system sheet', async () => {
    const nav: ShareNavigator = { share: vi.fn().mockResolvedValue(undefined) };
    await expect(share(data, { system: 'never', navigator: nav })).resolves.toBe('fallback');
    expect(nav.share).not.toHaveBeenCalled();
  });

  it('canShare false resolves fallback without calling share', async () => {
    const nav: ShareNavigator = { share: vi.fn(), canShare: () => false };
    await expect(share(data, { navigator: nav })).resolves.toBe('fallback');
    expect(nav.share).not.toHaveBeenCalled();
  });
});

describe('canSystemShare', () => {
  const file = new File(['x'], 'route.gpx', { type: 'application/gpx+xml' });

  it('is false without share', () => {
    expect(canSystemShare(data, {})).toBe(false);
    expect(canSystemShare(data, undefined)).toBe(false);
  });

  it('takes data without files when canShare is missing', () => {
    expect(canSystemShare(data, { share: async () => {} })).toBe(true);
  });

  it('needs canShare to say yes for files', () => {
    expect(canSystemShare({ files: [file] }, { share: async () => {} })).toBe(false);
    expect(canSystemShare({ files: [file] }, { share: async () => {}, canShare: () => true })).toBe(true);
  });

  it('is false when canShare throws', () => {
    expect(
      canSystemShare(data, {
        share: async () => {},
        canShare: () => {
          throw new Error('no');
        },
      }),
    ).toBe(false);
  });
});

describe('shareLinkLabel', () => {
  it('drops the scheme, www and a trailing slash', () => {
    expect(shareLinkLabel('https://www.example.com/trips/alula/')).toBe('example.com/trips/alula');
    expect(shareLinkLabel('https://example.com/')).toBe('example.com');
    expect(shareLinkLabel('https://example.com/a?b=1')).toBe('example.com/a?b=1');
  });

  it('returns text that is not a URL as it is', () => {
    expect(shareLinkLabel('not a link')).toBe('not a link');
  });
});
