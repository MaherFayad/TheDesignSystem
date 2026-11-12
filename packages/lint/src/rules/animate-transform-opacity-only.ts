// ds/animate-transform-opacity-only: only `transform` and `opacity` animate
// (PLAN.md 3.4). Checks `transition-property`, the `transition` shorthand and
// every declaration inside `@keyframes`. `transition: all` fails, and so does a
// transition item with no property, since that means `all`.
//
// `display` and `overlay` may appear in a transition when it also says
// `allow-discrete`: they do not animate, they flip at the end so a top layer
// element can play its exit with `@starting-style`.
import { inKeyframes, parseCss, splitCommas, splitSpaces } from '../css';
import { isSystemCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';

export const ANIMATE_TRANSFORM_OPACITY_ONLY = 'ds/animate-transform-opacity-only';

const ANIMATABLE = new Set(['transform', 'opacity']);
const DISCRETE = new Set(['display', 'overlay', 'content-visibility']);
const KEYFRAME_OK = new Set(['transform', 'opacity', 'animation-timing-function', 'animation-composition']);
const NOT_A_PROPERTY =
  /^(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|normal|allow-discrete|initial|inherit|unset|revert|revert-layer)$/i;

function isTimeOrFunction(token: string): boolean {
  return /\(/.test(token) || /^-?(\d+\.?\d*|\.\d+)(ms|s)$/i.test(token);
}

export function animateTransformOpacityOnly(file: SourceFile): Finding[] {
  const out: Finding[] = [];
  const { declarations } = parseCss(file.content);
  const discreteBlocks = new Set(
    declarations.filter((d) => d.property === 'transition-behavior' && /allow-discrete/i.test(d.value)).map((d) => d.context.join(' > ')),
  );
  for (const d of declarations) {
    const hit = (message: string) =>
      out.push({ ruleId: ANIMATE_TRANSFORM_OPACITY_ONLY, file: file.path, line: d.line, column: d.column, message });
    const value = d.value.replace(/!\s*important/i, '').trim();

    if (inKeyframes(d)) {
      if (!KEYFRAME_OK.has(d.property)) hit(`@keyframes animates ${d.property}. Only transform and opacity animate.`);
      continue;
    }
    if (d.property === 'transition-property') {
      const behavior = discreteBlocks.has(d.context.join(' > ')) ? 'allow-discrete' : '';
      for (const p of splitCommas(value)) checkProperty(p.toLowerCase(), behavior, hit);
    } else if (d.property === 'transition') {
      if (/^none$/i.test(value)) continue;
      for (const item of splitCommas(value)) {
        const tokens = splitSpaces(item);
        const props = tokens.filter((t) => !isTimeOrFunction(t) && !NOT_A_PROPERTY.test(t));
        const hasVar = tokens.some((t) => /^var\(/i.test(t));
        if (props.length === 0) {
          if (!hasVar) hit(`transition: ${item} names no property, so it means all. Name transform or opacity.`);
          continue;
        }
        for (const p of props) checkProperty(p.toLowerCase(), /allow-discrete/i.test(item) ? 'allow-discrete' : '', hit);
      }
    }
  }
  return out;
}

function checkProperty(property: string, behavior: string, hit: (message: string) => void): void {
  if (property === 'none' || property.startsWith('var(')) return;
  if (ANIMATABLE.has(property)) return;
  if (DISCRETE.has(property) && behavior === 'allow-discrete') return;
  if (property === 'all') hit('transition: all. Name transform or opacity.');
  else hit(`transition on ${property}. Only transform and opacity animate.`);
}

export const animateTransformOpacityOnlyRule: Rule = {
  id: ANIMATE_TRANSFORM_OPACITY_ONLY,
  description: 'Only transform and opacity in transitions and keyframes. No transition: all.',
  appliesTo: isSystemCss,
  check: animateTransformOpacityOnly,
};
