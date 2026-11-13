// meter-fill, second beat (round 3, review N28). One copy for both
// frameworks (order 1.29): React's Meter (useFillOnView) and Angular's
// meter.ts play it in full mode only (the caller checks).
import { readDuration, readEasing } from '../core';

/**
 * As the fill nears its value (at --_meter-value-at of the reveal), the
 * value text settles from distance.nudge below and its colour comes up from
 * the muted text, so the number lands with the fill instead of sitting there
 * from the start. Opaque at once: only its place and colour move.
 */
export function landValue(value: Element | null | undefined, fill: HTMLElement): void {
  if (!value || typeof value.animate !== 'function') return;
  const total = readDuration(fill, 'duration.reveal');
  const at = Number.parseFloat(getComputedStyle(fill).getPropertyValue('--_meter-value-at')) || 0.6;
  value.animate([{ transform: 'translateY(var(--ds-distance-nudge))', color: 'var(--ds-color-text-muted)' }, { transform: 'none' }], {
    id: 'ds-motion:meter-value',
    duration: readDuration(fill, 'duration.spring-bouncy'),
    easing: readEasing(fill, 'ease.spring-bouncy'),
    delay: total * at,
    fill: 'backwards',
  });
}
