import { describe, expect, it } from 'vitest';
import { animateTransformOpacityOnly, animateTransformOpacityOnlyRule } from '../rules/animate-transform-opacity-only';
import { fixture, format, lines, runRule } from './harness';

describe('gate ds/animate-transform-opacity-only: only transform, opacity and paint properties animate', () => {
  it('finds no other animated property in packages/css or packages/styles', () => {
    expect(format(runRule(animateTransformOpacityOnlyRule)), 'animate transform or opacity').toEqual([]);
  });

  it('fails on the fixture', () => {
    expect(lines(animateTransformOpacityOnly(fixture('animate-transform-opacity-only/bad.css')))).toEqual([4, 5, 6, 7, 14, 23, 28]);
  });

  it('allows the paint properties of the motion ruling and refuses layout', () => {
    const findings = animateTransformOpacityOnly(fixture('animate-transform-opacity-only/bad.css'));
    const messages = findings.map((f) => f.message).join('\n');
    for (const ok of ['background-color', 'box-shadow', 'clip-path', 'stroke-dashoffset', 'filter\\.', 'backdrop-filter']) {
      expect(messages, ok).not.toMatch(new RegExp(`(transition on|animates) ${ok}`));
    }
    expect(messages).toMatch(/transition on margin-inline-start/);
    expect(messages).toMatch(/animates block-size/);
    expect(messages).toMatch(/transition on inline-size/);
  });
});
