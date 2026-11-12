import { describe, expect, it } from 'vitest';
import {
  RESIZE_STEP,
  clampSizes,
  collapsePanel,
  collapseTarget,
  evenSizes,
  expandPanel,
  isCollapsed,
  panelLimits,
  resizeBy,
  resizeToEdge,
  roundSizes,
} from './resize';

const free = panelLimits();
const side = panelLimits({ min: 20, max: 40, collapsible: true, collapsedSize: 0 });
const rail = panelLimits({ min: 20, max: 40, collapsible: true, collapsedSize: 5 });
const main = panelLimits({ min: 30 });

describe('panelLimits', () => {
  it('fills defaults and keeps the values in order', () => {
    expect(free).toEqual({ min: 0, max: 100, collapsible: false, collapsedSize: 0 });
    expect(panelLimits({ min: 50, max: 30, collapsedSize: 60 })).toEqual({ min: 50, max: 50, collapsible: false, collapsedSize: 50 });
  });
});

describe('evenSizes', () => {
  it('splits 100 evenly', () => {
    expect(evenSizes(4)).toEqual([25, 25, 25, 25]);
    expect(evenSizes(0)).toEqual([]);
  });
});

describe('clampSizes', () => {
  it('scales to 100 and keeps each panel inside its limits', () => {
    expect(clampSizes([10, 90], [side, main])).toEqual([20, 80]);
    expect(clampSizes([1, 1], [free, free])).toEqual([50, 50]);
  });

  it('falls back to even sizes for a wrong count', () => {
    expect(clampSizes([100], [free, free])).toEqual([50, 50]);
  });

  it('keeps a collapsed panel collapsed', () => {
    expect(clampSizes([0, 100], [side, main])).toEqual([0, 100]);
  });

  it('gives the rest to the last panel with room', () => {
    expect(clampSizes([50, 50], [side, main])).toEqual([40, 60]);
  });
});

describe('resizeBy', () => {
  it('moves room between the two panels next to the handle', () => {
    expect(resizeBy([30, 70], [side, main], 0, RESIZE_STEP)).toEqual([35, 65]);
    expect(resizeBy([30, 40, 30], [free, free, free], 1, -10)).toEqual([30, 30, 40]);
  });

  it('stops at the limits', () => {
    expect(resizeBy([30, 70], [side, main], 0, 50)).toEqual([40, 60]);
    expect(resizeBy([30, 70], [side, main], 0, -6)).toEqual([24, 76]);
    expect(resizeBy([30, 70], [panelLimits({ min: 20 }), main], 0, -20)).toEqual([20, 80]);
  });

  it('collapses past the threshold and opens again at the min', () => {
    expect(resizeBy([30, 70], [side, main], 0, -15)).toEqual([20, 80]);
    expect(resizeBy([30, 70], [side, main], 0, -21)).toEqual([0, 100]);
    expect(resizeBy([0, 100], [side, main], 0, 5)).toEqual([0, 100]);
    expect(resizeBy([0, 100], [side, main], 0, 12)).toEqual([20, 80]);
    expect(resizeBy([30, 70], [rail, main], 0, -25)).toEqual([5, 95]);
  });

  it('collapses the panel after the handle', () => {
    expect(resizeBy([70, 30], [main, side], 0, 21)).toEqual([100, 0]);
    expect(resizeBy([70, 30], [main, side], 0, 9)).toEqual([79, 21]);
    expect(resizeBy([70, 30], [main, side], 0, 15)).toEqual([80, 20]);
  });

  it('leaves the input alone and ignores a handle out of range', () => {
    const sizes = [50, 50];
    expect(resizeBy(sizes, [free, free], 3, 10)).toEqual([50, 50]);
    resizeBy(sizes, [free, free], 0, 10);
    expect(sizes).toEqual([50, 50]);
  });
});

describe('resizeToEdge', () => {
  it('moves the handle to its far start and far end', () => {
    expect(resizeToEdge([30, 70], [side, main], 0, 'min')).toEqual([20, 80]);
    expect(resizeToEdge([30, 70], [side, main], 0, 'max')).toEqual([40, 60]);
    expect(resizeToEdge([50, 50], [free, free], 0, 'max')).toEqual([100, 0]);
  });
});

describe('collapse and expand', () => {
  it('picks the panel before, then the panel after', () => {
    expect(collapseTarget([side, main], 0)).toBe(0);
    expect(collapseTarget([main, side], 0)).toBe(1);
    expect(collapseTarget([main, main], 0)).toBe(-1);
  });

  it('collapses a panel and gives its room to the neighbor', () => {
    expect(collapsePanel([30, 70], [side, main], 0)).toEqual([0, 100]);
    expect(collapsePanel([70, 30], [main, side], 1)).toEqual([100, 0]);
    expect(collapsePanel([30, 70], [main, main], 0)).toEqual([30, 70]);
    expect(isCollapsed(0, side)).toBe(true);
    expect(isCollapsed(0, free)).toBe(false);
  });

  it('opens a panel to a size, taking room from the neighbor down to its min', () => {
    expect(expandPanel([0, 100], [side, main], 0)).toEqual([20, 80]);
    expect(expandPanel([0, 100], [side, main], 0, 35)).toEqual([35, 65]);
    expect(expandPanel([0, 100], [side, panelLimits({ min: 90 })], 0, 35)).toEqual([10, 90]);
  });
});

describe('roundSizes', () => {
  it('rounds to whole percents', () => {
    expect(roundSizes([33.333, 66.667])).toEqual([33, 67]);
    expect(roundSizes([33.333], 1)).toEqual([33.3]);
  });
});
