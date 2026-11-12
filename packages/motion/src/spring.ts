// Springs as timed curves for the web. A spring token (stiffness, damping,
// mass) becomes a CSS `linear()` easing and a duration in ms, sampled from
// the damped spring that starts at rest and settles on its target. The Web
// Animations API takes the result as `easing` and `duration`. Native plays
// the spring itself (Reanimated `withSpring`) from the same token.
//
// CSS cannot compute this. A component whose CSS wants a spring reads an ease
// token; the token build would need `ease.spring-*` tokens written from the
// spring tokens (requested in docs/reports/interactions.md). Until then the
// CSS uses ease.emphasized, the nearest existing curve.
import { springValue, type Spring, type SpringName } from './tokens';

export interface SpringCurve {
  /** A CSS `linear()` easing function. */
  easing: string;
  /** The time the spring takes to settle within `settle` of its target, in ms. */
  durationMs: number;
}

/** The position of a damped spring from 0 to 1 at time t (seconds). */
export function springAt(s: Spring, t: number): number {
  const w0 = Math.sqrt(s.stiffness / s.mass);
  const zeta = s.damping / (2 * Math.sqrt(s.stiffness * s.mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  // Critically damped or over damped: the critical form is close enough for a UI curve.
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

/**
 * The spring as a `linear()` curve. It samples until the spring stays within
 * `settle` (default 0.001) of its target, then writes `points` evenly spaced
 * stops (default 24), which is smooth at 60 and 120 frames a second.
 */
export function springCurve(spring: Spring | SpringName, opts: { settle?: number; points?: number } = {}): SpringCurve {
  const s = typeof spring === 'string' ? springValue[spring] : spring;
  const settle = opts.settle ?? 0.001;
  const points = Math.max(4, opts.points ?? 24);
  let end = 0;
  const step = 1 / 240;
  for (let t = 0; t < 4; t += step) if (Math.abs(1 - springAt(s, t)) > settle) end = t + step;
  const stops: string[] = [];
  for (let i = 0; i <= points; i++) {
    const v = i === points ? 1 : springAt(s, (end * i) / points);
    stops.push(String(Math.round(v * 1000) / 1000));
  }
  return { easing: `linear(${stops.join(', ')})`, durationMs: Math.round(end * 1000) };
}

/** The largest overshoot past the target, as a share of the travel (0 for none). */
export function springOvershoot(spring: Spring | SpringName): number {
  const s = typeof spring === 'string' ? springValue[spring] : spring;
  let max = 0;
  for (let t = 0; t < 4; t += 1 / 480) max = Math.max(max, springAt(s, t) - 1);
  return Math.round(max * 10000) / 10000;
}
