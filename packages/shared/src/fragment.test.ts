// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { focusFragment } from './fragment';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('focusFragment', () => {
  it('focuses a target that is focusable as it is, and leaves its tabindex alone', () => {
    document.body.innerHTML = '<a id="top" href="#x">Top</a>';
    expect(focusFragment('#top')).toBe(true);
    expect(document.activeElement?.id).toBe('top');
    expect(document.getElementById('top')?.hasAttribute('tabindex')).toBe(false);
  });

  it('gives a plain region tabindex -1 and focuses it', () => {
    document.body.innerHTML = '<main id="main">Text</main>';
    expect(focusFragment('#main')).toBe(true);
    expect(document.getElementById('main')?.getAttribute('tabindex')).toBe('-1');
  });

  it('reads an encoded id and refuses what is not a fragment or names nothing', () => {
    document.body.innerHTML = '<section id="قسم">Text</section>';
    expect(focusFragment(`#${encodeURIComponent('قسم')}`)).toBe(true);
    expect(focusFragment('#')).toBe(false);
    expect(focusFragment('main')).toBe(false);
    expect(focusFragment('#missing')).toBe(false);
  });
});
