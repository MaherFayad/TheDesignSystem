// The spring eases of order 1.22 in every style file match that style's
// spring tokens: each `ease.spring-<name>` is the `linear()` curve of
// `spring.<name>` (Studio, flat, writes steps and a plain curve instead), and
// each `duration.spring-<name>` is the settle time of that spring.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { springCurve, springOvershoot } from './spring';
import { SPRING_NAMES } from './primitives';

type Node = { $value?: unknown } & Record<string, unknown>;
const stylesDir = new URL('../../styles/', import.meta.url);
const styles = readdirSync(stylesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

function files(style: string): [string, Record<string, Node>][] {
  return readdirSync(new URL(`${style}/`, stylesDir))
    .filter((f) => /^tokens\.[a-z]+\.json$/.test(f))
    .map((f) => [f, JSON.parse(readFileSync(new URL(`${style}/${f}`, stylesDir), 'utf8')) as Record<string, Node>]);
}

const get = (t: Record<string, Node>, path: string): unknown => path.split('.').reduce<unknown>((n, k) => (n as Record<string, unknown> | undefined)?.[k], t);

describe.each(styles)('%s springs', (style) => {
  for (const [file, t] of files(style)) {
    for (const name of SPRING_NAMES) {
      it(`${file} fills ease.spring-${name}, duration.spring-${name} and spring.${name}`, () => {
        const ease = (get(t, `ease.spring-${name}`) as Node).$value as string;
        const dur = ((get(t, `duration.spring-${name}`) as Node).$value as { value: number }).value;
        const s = { stiffness: (get(t, `spring.${name}.stiffness`) as Node).$value as number, damping: (get(t, `spring.${name}.damping`) as Node).$value as number, mass: 1 };
        expect(dur).toBeGreaterThan(0);
        if (style === 'studio') {
          // Flat: steps and a plain curve, no overshoot.
          expect(ease).toMatch(/^(steps|cubic-bezier)\(/);
          expect(springOvershoot(s)).toBeLessThan(0.01);
          return;
        }
        expect(ease).toBe(springCurve(s, { settle: 0.005, points: 20 }).easing);
        expect(Math.abs(springCurve(s, { settle: 0.005 }).durationMs - dur)).toBeLessThanOrEqual(5);
      });
    }
  }
});

describe('the styles keep their character', () => {
  const over = (style: string, name: string) => {
    const t = files(style)[0]![1];
    return springOvershoot({ stiffness: (get(t, `spring.${name}.stiffness`) as Node).$value as number, damping: (get(t, `spring.${name}.damping`) as Node).$value as number, mass: 1 });
  };
  it('Desk overshoots most, Neutral a little, Studio not at all', () => {
    expect(over('desk', 'bouncy')).toBeGreaterThan(0.2);
    expect(over('neutral', 'bouncy')).toBeLessThan(0.08);
    expect(over('studio', 'bouncy')).toBeLessThan(0.01);
  });
  it('Neutral springs settle within 150 to 220ms', () => {
    const t = files('neutral')[0]![1];
    for (const name of SPRING_NAMES) {
      const v = ((get(t, `duration.spring-${name}`) as Node).$value as { value: number }).value;
      expect(v).toBeGreaterThanOrEqual(150);
      expect(v).toBeLessThanOrEqual(220);
    }
  });
});
