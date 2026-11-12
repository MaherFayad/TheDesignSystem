import { describe, expect, it } from 'vitest';
import { animateTransformOpacityOnly, animateTransformOpacityOnlyRule } from '../rules/animate-transform-opacity-only';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/animate-transform-opacity-only: only transform and opacity animate', () => {
  it('finds no other animated property in packages/css or packages/styles', () => {
    expect(format(runRule(animateTransformOpacityOnlyRule)), 'animate transform or opacity').toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(animateTransformOpacityOnly(fixture('animate-transform-opacity-only/bad.css')))).toEqual([4, 5, 6, 7, 14]);
  });
});
