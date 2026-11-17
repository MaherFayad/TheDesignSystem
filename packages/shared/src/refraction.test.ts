import { describe, expect, it } from 'vitest';
import {
  REFRACTION_SELECTOR,
  buildRefractionMap,
  encodeBmp,
  refractionAt,
  refractionBand,
  refractionEnvOf,
  refractionFilter,
  refractionId,
  refractionKey,
  refractionRadius,
  refractionResolution,
  refractionSupported,
  toBase64,
} from './refraction';

const capsule = { width: 200, height: 64, radius: 999 };

describe('refraction map', () => {
  it('clamps the radius to half the short side', () => {
    expect(refractionRadius(capsule)).toBe(32);
    expect(refractionRadius({ width: 40, height: 100, radius: 8 })).toBe(8);
    expect(refractionRadius({ width: 40, height: 100, radius: -3 })).toBe(0);
  });

  it('sizes the band from the short side, within 4 and 24 px', () => {
    expect(refractionBand(capsule)).toBeCloseTo(19.2);
    expect(refractionBand({ width: 10, height: 10, radius: 5 })).toBe(4);
    expect(refractionBand({ width: 400, height: 300, radius: 26 })).toBe(24);
  });

  it('does not move the middle', () => {
    const s = refractionAt(capsule, 19.2, 100, 32);
    expect(s).toEqual({ dx: 0, dy: 0, glare: 0 });
  });

  it('moves inward near the edge, strongest at the rim', () => {
    const band = 19.2;
    const left = refractionAt(capsule, band, 1, 32);
    const right = refractionAt(capsule, band, 199, 32);
    const top = refractionAt(capsule, band, 100, 1);
    const bottom = refractionAt(capsule, band, 100, 63);
    expect(left.dx).toBeGreaterThan(0.8);
    expect(right.dx).toBeLessThan(-0.8);
    expect(top.dy).toBeGreaterThan(0.8);
    expect(bottom.dy).toBeLessThan(-0.8);
    const nearer = refractionAt(capsule, band, 100, 2).dy;
    const farther = refractionAt(capsule, band, 100, 12).dy;
    expect(nearer).toBeGreaterThan(farther);
    expect(farther).toBeGreaterThan(0);
  });

  it('follows the normal of the corner', () => {
    const rect = { width: 100, height: 100, radius: 20 };
    // On the diagonal of the top left corner the move points to the corner's centre, down and right in equal parts.
    const s = refractionAt(rect, 16, 20 - 20 * Math.SQRT1_2 + 2, 20 - 20 * Math.SQRT1_2 + 2);
    expect(s.dx).toBeGreaterThan(0);
    expect(s.dx).toBeCloseTo(s.dy, 5);
  });

  it('leaves the cut corner outside the shape untouched', () => {
    expect(refractionAt({ width: 100, height: 100, radius: 30 }, 16, 1, 1)).toEqual({ dx: 0, dy: 0, glare: 0 });
  });

  it('puts the glare on the upper leading arc more than on the lower trailing one', () => {
    const band = 19.2;
    expect(refractionAt(capsule, band, 16.4, 11.2).glare).toBeGreaterThan(refractionAt(capsule, band, 183.6, 52.8).glare);
    expect(refractionAt(capsule, band, 183.6, 52.8).glare).toBeGreaterThan(0);
  });

  it('draws a map with the neutral value in the middle and a scale of twice the deepest move', () => {
    const map = buildRefractionMap(capsule);
    expect(map.width).toBe(200);
    expect(map.height).toBe(64);
    expect(map.data.length).toBe(200 * 64 * 3);
    const mid = (32 * 200 + 100) * 3;
    expect([map.data[mid], map.data[mid + 1], map.data[mid + 2]]).toEqual([128, 128, 0]);
    expect(map.scale).toBeCloseTo(19.2);
    const left = (32 * 200 + 0) * 3;
    expect(map.data[left]).toBeGreaterThan(230);
  });

  it('halves the map of a large part', () => {
    const menu = { width: 250, height: 320, radius: 26 };
    expect(refractionResolution(menu)).toBe(0.5);
    expect(refractionResolution(capsule)).toBe(1);
    const map = buildRefractionMap(menu);
    expect([map.width, map.height]).toEqual([125, 160]);
  });

  it('never folds the band at the default depth', () => {
    // Along a row from the left edge, the sampled point (x + move) must not go backwards.
    const map = buildRefractionMap(capsule);
    let last = -Infinity;
    for (let x = 0; x < 40; x++) {
      const o = (32 * map.width + x) * 3;
      const sampled = x + 0.5 + (map.scale * (map.data[o]! - 127.5)) / 255;
      expect(sampled).toBeGreaterThanOrEqual(last - 0.6);
      last = sampled;
    }
  });
});

describe('refraction encoding', () => {
  it('encodes base 64 like the platform does', () => {
    for (const s of ['', 'a', 'ab', 'abc', 'abcd', 'refraction']) {
      const bytes = new TextEncoder().encode(s);
      expect(toBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
    }
  });

  it('writes a top down 24 bit BMP with padded rows', () => {
    const data = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
    const bmp = encodeBmp({ width: 2, height: 2, data });
    const view = new DataView(bmp.buffer);
    expect(String.fromCharCode(bmp[0]!, bmp[1]!)).toBe('BM');
    expect(view.getUint32(2, true)).toBe(bmp.length);
    expect(bmp.length).toBe(54 + 8 * 2);
    expect(view.getInt32(18, true)).toBe(2);
    expect(view.getInt32(22, true)).toBe(-2);
    expect(view.getUint16(28, true)).toBe(24);
    // First pixel, blue green red.
    expect([bmp[54], bmp[55], bmp[56]]).toEqual([30, 20, 10]);
    // Second row starts after 8 bytes (6 of pixels and 2 of padding).
    expect([bmp[62], bmp[63], bmp[64]]).toEqual([90, 80, 70]);
  });
});

describe('refraction filter', () => {
  it('keys and names a filter by whole px', () => {
    expect(refractionKey({ width: 352.6, height: 64.2, radius: 999 })).toBe('353x64r32');
    expect(refractionId({ width: 44, height: 44, radius: 22 })).toBe('ds-refraction-44x44r22');
  });

  it('builds a filter in the part own px with the map, the bend and the glare', () => {
    const f = refractionFilter({ width: 120, height: 44, radius: 22 });
    expect(f.id).toBe('ds-refraction-120x44r22');
    expect(f.node.attrs).toMatchObject({ x: '0', y: '0', width: '120', height: '44', filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
    const tags = f.node.children?.map((c) => c.tag);
    expect(tags).toEqual(['feImage', 'feDisplacementMap', 'feColorMatrix', 'feComposite']);
    const image = f.node.children![0]!;
    expect(image.attrs.href.startsWith('data:image/bmp;base64,Qk')).toBe(true);
    expect(image.attrs.preserveAspectRatio).toBe('none');
    const bend = f.node.children![1]!;
    expect(bend.attrs).toMatchObject({ in: 'SourceGraphic', in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G' });
    expect(Number(bend.attrs.scale)).toBeCloseTo(f.map.scale);
  });

  it('lists every part under an ios Theme only', () => {
    for (const part of REFRACTION_SELECTOR.split(/,\s(?=\[data-platform)/)) expect(part.startsWith("[data-platform='ios'] ")).toBe(true);
    expect(REFRACTION_SELECTOR).toContain("[data-ds='tab-bar']");
    expect(REFRACTION_SELECTOR).not.toContain("[data-ds='switch']");
  });
});

describe('refraction probe', () => {
  const supports = (p: string, v: string) => p === 'backdrop-filter' && v.startsWith('url(');
  const chromium = { css: { supports, paintWorklet: {} }, navigator: { userAgentData: { brands: [] } } };

  it('says yes in Chromium', () => {
    expect(refractionSupported(chromium)).toBe(true);
  });

  it('says no in Safari, which parses the url but has no paint worklet and no client hints', () => {
    expect(refractionSupported({ css: { supports }, navigator: {} })).toBe(false);
  });

  it('says no when only one of the two Chromium signs is there', () => {
    expect(refractionSupported({ css: { supports }, navigator: { userAgentData: {} } })).toBe(false);
    expect(refractionSupported({ css: { supports, paintWorklet: {} }, navigator: {} })).toBe(false);
  });

  it('says no when backdrop-filter does not take a url', () => {
    expect(refractionSupported({ ...chromium, css: { supports: () => false, paintWorklet: {} } })).toBe(false);
    expect(refractionSupported({ ...chromium, css: { supports: () => { throw new Error('no'); }, paintWorklet: {} } })).toBe(false);
  });

  it('says no on a server or without a window', () => {
    expect(refractionSupported(undefined)).toBe(false);
    expect(refractionSupported(refractionEnvOf(undefined))).toBe(false);
    expect(refractionEnvOf(null)).toEqual({});
  });

  it('never reads the user agent string', () => {
    const env = { css: { supports, paintWorklet: {} }, navigator: { userAgentData: {}, get userAgent(): string { throw new Error('read the user agent'); } } };
    expect(refractionSupported(env)).toBe(true);
  });
});
