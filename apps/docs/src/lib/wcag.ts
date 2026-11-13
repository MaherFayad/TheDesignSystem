// The WCAG 2.2 criteria a component page lists. Every component meets the
// base set (PLAN.md section 12); the rest follow from what its manifest
// declares: a keyboard map, announcements, an overlay role, text input,
// motion, a drag path.
import type { Manifest } from '../../scripts/manifests.ts';

export interface Criterion {
  id: string;
  name: string;
}

const all: Record<string, string> = {
  '1.3.1': 'Info and relationships',
  '1.4.1': 'Use of color',
  '1.4.3': 'Contrast (minimum)',
  '1.4.10': 'Reflow',
  '1.4.11': 'Non-text contrast',
  '1.4.13': 'Content on hover or focus',
  '2.1.1': 'Keyboard',
  '2.1.2': 'No keyboard trap',
  '2.2.2': 'Pause, stop, hide',
  '2.3.3': 'Animation from interactions',
  '2.4.3': 'Focus order',
  '2.4.7': 'Focus visible',
  '2.4.11': 'Focus not obscured (minimum)',
  '2.5.3': 'Label in name',
  '2.5.7': 'Dragging movements',
  '2.5.8': 'Target size (minimum)',
  '3.3.1': 'Error identification',
  '3.3.2': 'Labels or instructions',
  '3.3.7': 'Redundant entry',
  '4.1.2': 'Name, role, value',
  '4.1.3': 'Status messages',
};

export function criteriaFor(m: Manifest): Criterion[] {
  const ids = new Set(['1.3.1', '1.4.3', '1.4.10', '1.4.11', '4.1.2']);
  const a = m.a11y ?? {};
  const text = JSON.stringify(m).toLowerCase();
  const keys = Object.keys(a.keys ?? {});
  if (keys.length > 0) {
    ids.add('2.1.1');
    ids.add('2.4.7');
    ids.add('2.5.8');
  }
  if (keys.some((k) => /escape/i.test(k))) ids.add('2.1.2');
  if (a.announce || /role="?(status|alert)|aria-live|toast/.test(text)) ids.add('4.1.3');
  if (/dialog|popover|menu|tooltip|sheet|drawer|overlay/.test(`${a.role ?? ''} ${m.family}`.toLowerCase())) {
    ids.add('2.4.3');
    ids.add('2.4.11');
  }
  if (/tooltip|hover/.test(m.name.toLowerCase())) ids.add('1.4.13');
  if (m.family === 'forms' || /invalid|error/.test(text)) {
    ids.add('3.3.1');
    ids.add('3.3.2');
  }
  if (/\blabel\b/.test(text)) ids.add('2.5.3');
  if (/color alone|two signals|not .*color/.test(text)) ids.add('1.4.1');
  if (/drag|resiz|swipe/.test(text)) ids.add('2.5.7');
  if (/paste|password manager|otp/.test(text)) ids.add('3.3.7');
  if (m.motion && m.motion !== 'none') ids.add('2.3.3');
  if (/autoplay|plays for|carousel|marquee/.test(text)) ids.add('2.2.2');
  return [...ids]
    .sort((x, y) => {
      const a1 = x.split('.').map(Number);
      const b1 = y.split('.').map(Number);
      return (a1[0]! - b1[0]!) || (a1[1]! - b1[1]!) || (a1[2]! - b1[2]!);
    })
    .map((id) => ({ id, name: all[id] ?? id }));
}

/** The W3C Understanding page of a criterion. */
export function criterionUrl(c: Criterion): string {
  const slug = c.name
    .toLowerCase()
    .replace(/\(minimum\)/, 'minimum')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html`;
}
