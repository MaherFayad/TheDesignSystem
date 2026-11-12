// A small CSS reader for the gates. It handles cascade layers, at-rules and
// native nesting, skips comments and strings, and keeps line numbers. It is
// not a full parser: it only needs the declarations and where they sit.
import { locator, stripCssComments } from './util';

export interface CssDeclaration {
  property: string;
  /** Value with whitespace collapsed, `!important` included as written. */
  value: string;
  /** The innermost block prelude, for example `[data-ds='button']` or `from`. */
  selector: string;
  /** Every block prelude from the outside in, for example `['@layer ds.base', "[data-ds='button']"]`. */
  context: string[];
  line: number;
  column: number;
  /** Index of the first character of the declaration in the source. */
  index: number;
}

export interface CssStatement {
  /** An at-rule without a block, for example `@import './x.css'`. */
  text: string;
  line: number;
  column: number;
}

export interface CssSheet {
  declarations: CssDeclaration[];
  statements: CssStatement[];
  /** Every block prelude with its position. */
  blocks: CssStatement[];
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

export function parseCss(css: string): CssSheet {
  const src = stripCssComments(css);
  const at = locator(src);
  const declarations: CssDeclaration[] = [];
  const statements: CssStatement[] = [];
  const blocks: CssStatement[] = [];
  const stack: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';

  const firstNonSpace = (from: number, to: number) => {
    let i = from;
    while (i < to && /\s/.test(src[i] ?? '')) i++;
    return i;
  };

  const flush = (end: number) => {
    const raw = src.slice(start, end);
    const text = raw.trim();
    if (text) {
      const index = firstNonSpace(start, end);
      const pos = at(index);
      if (text.startsWith('@')) {
        statements.push({ text: squash(text), ...pos });
      } else if (stack.length > 0) {
        const colon = text.indexOf(':');
        if (colon > 0) {
          const property = text.slice(0, colon).trim();
          declarations.push({
            property: property.startsWith('--') ? property : property.toLowerCase(),
            value: squash(text.slice(colon + 1)),
            selector: stack[stack.length - 1] ?? '',
            context: [...stack],
            index,
            ...pos,
          });
        }
      }
    }
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth > 0) continue;
    else if (ch === '{') {
      const index = firstNonSpace(start, i);
      const prelude = squash(src.slice(start, i));
      blocks.push({ text: prelude, ...at(index) });
      stack.push(prelude);
      start = i + 1;
    } else if (ch === ';') {
      flush(i);
      start = i + 1;
    } else if (ch === '}') {
      flush(i);
      stack.pop();
      start = i + 1;
    }
  }
  flush(src.length);
  return { declarations, statements, blocks };
}

/** True when the declaration sits inside `@keyframes`. */
export function inKeyframes(d: CssDeclaration): boolean {
  return d.context.some((c) => /^@(-webkit-)?keyframes\b/i.test(c));
}

/** True when the declaration sits inside a block that describes, not styles (`@font-face`, `@property`). */
export function inDescriptorBlock(d: CssDeclaration): boolean {
  return d.context.some((c) => /^@(font-face|property|counter-style|font-palette-values|page)\b/i.test(c));
}

/** Splits a value on top level whitespace, keeping functions whole. */
export function splitSpaces(value: string): string[] {
  return splitTopLevel(value, /\s/);
}

/** Splits a value on top level commas. */
export function splitCommas(value: string): string[] {
  return splitTopLevel(value, /,/).map((s) => s.trim());
}

function splitTopLevel(value: string, sep: RegExp): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && sep.test(ch)) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
