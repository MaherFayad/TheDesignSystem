// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { REFRACTION_ATTRIBUTE, REFRACTION_PROPERTY } from './refraction';
import { acquireRefraction, shapeOf } from './refraction-dom';

const flush = () => new Promise((r) => setTimeout(r, 30));

function sized(el: HTMLElement, w: number, h: number) {
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: w });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: h });
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(REFRACTION_ATTRIBUTE);
});

function mount(glass = true) {
  document.body.innerHTML = `<div data-platform="ios" style="${glass ? '--_ios-glass: regular' : ''}"><nav data-ds="tab-bar" style="border-radius: 999px"></nav></div>`;
  const bar = document.querySelector<HTMLElement>("[data-ds='tab-bar']")!;
  sized(bar, 353, 64);
  return bar;
}

describe('refraction in the DOM', () => {
  it('reads a part layout box and corner', () => {
    const bar = mount();
    expect(shapeOf(bar, window)).toEqual({ width: 353, height: 64, radius: 999 });
    sized(bar, 2, 2);
    expect(shapeOf(bar, window)).toBeNull();
  });

  it('mounts one filter, points the part at it and then sets the attribute', async () => {
    const bar = mount();
    const release = acquireRefraction(document);
    await flush();
    expect(document.querySelectorAll('[data-ds-refraction] filter')).toHaveLength(1);
    expect(bar.style.getPropertyValue(REFRACTION_PROPERTY)).toBe('url(#ds-refraction-353x64r32)');
    expect(document.documentElement.getAttribute(REFRACTION_ATTRIBUTE)).toBe('true');
    release();
    expect(document.documentElement.hasAttribute(REFRACTION_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[data-ds-refraction]')).toBeNull();
    expect(bar.style.getPropertyValue(REFRACTION_PROPERTY)).toBe('');
  });

  it('skips parts whose style does not take the glass', async () => {
    const bar = mount(false);
    const release = acquireRefraction(document);
    await flush();
    expect(bar.style.getPropertyValue(REFRACTION_PROPERTY)).toBe('');
    expect(document.querySelectorAll('[data-ds-refraction] filter')).toHaveLength(0);
    release();
  });

  it('shares one instance between callers until the last one lets go', async () => {
    mount();
    const a = acquireRefraction(document);
    const b = acquireRefraction(document);
    await flush();
    expect(document.querySelectorAll('[data-ds-refraction]')).toHaveLength(1);
    a();
    a();
    expect(document.documentElement.getAttribute(REFRACTION_ATTRIBUTE)).toBe('true');
    b();
    expect(document.documentElement.hasAttribute(REFRACTION_ATTRIBUTE)).toBe(false);
  });

  it('shares a filter between parts of the same size', async () => {
    document.body.innerHTML = `<div data-platform="ios" style="--_ios-glass: regular"><div data-ds="toast" style="border-radius: 20px"></div><div data-ds="toast" style="border-radius: 20px"></div></div>`;
    for (const el of document.querySelectorAll<HTMLElement>("[data-ds='toast']")) sized(el, 300, 80);
    const release = acquireRefraction(document);
    await flush();
    expect(document.querySelectorAll('[data-ds-refraction] filter')).toHaveLength(1);
    release();
  });
});
