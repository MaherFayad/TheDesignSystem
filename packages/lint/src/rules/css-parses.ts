// ds/css-parses: every stylesheet under `packages/css/src/` and
// `packages/styles/` parses as CSS. The gates' own reader (`../css.ts`) is
// tolerant on purpose and skips what it cannot read, so a broken file passed
// every other gate (wave-1-followups.md, round 3 item 1).
//
// Two passes:
// 1. Balance: every comment, string, `{`, `(` and `[` is closed, and no
//    closer comes without its opener. CSS closes open blocks at the end of a
//    file without an error, so a parser alone does not see a lost `}`.
// 2. Lightning CSS with error recovery off: a selector, at-rule or
//    declaration it cannot read is an error. Unknown property names are not.
//
// Lightning CSS comes from the dev tree (Vite depends on it). This rule is
// kept out of `rules` in `../index.ts` so `ds doctor` does not load it.
import { transform } from 'lightningcss';
import type { Finding, Rule, SourceFile } from '../types';
import { locator } from '../util';

export const CSS_PARSES = 'ds/css-parses';

const CLOSE: Record<string, string> = { '}': '{', ')': '(', ']': '[' };

/** Unclosed comments, strings and brackets, and closers without an opener. */
export function cssBalance(file: SourceFile): Finding[] {
  const src = file.content;
  const at = locator(src);
  const out: Finding[] = [];
  const stack: { ch: string; index: number }[] = [];
  const push = (index: number, message: string) => out.push({ ruleId: CSS_PARSES, file: file.path, ...at(index), message });
  for (let i = 0; i < src.length; i++) {
    const ch = src[i] ?? '';
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end === -1) {
        push(i, 'comment is never closed with */');
        return out;
      }
      i = end + 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== ch && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      if (src[j] !== ch) {
        push(i, `string opened with ${ch} is not closed on its line`);
        i = j;
        continue;
      }
      i = j;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') stack.push({ ch, index: i });
    else if (ch in CLOSE) {
      const top = stack[stack.length - 1];
      if (!top) push(i, `${ch} has no opener`);
      else if (top.ch !== CLOSE[ch]) {
        push(i, `${ch} closes ${top.ch} opened at line ${at(top.index).line}`);
        stack.pop();
      } else stack.pop();
    }
  }
  for (const open of stack) push(open.index, `${open.ch} is never closed`);
  return out;
}

interface LightningError {
  message?: string;
  loc?: { line: number; column: number };
}

/** The first error Lightning CSS reports, with error recovery off. */
export function cssSyntax(file: SourceFile): Finding[] {
  try {
    transform({ filename: file.path, code: Buffer.from(file.content), errorRecovery: false, minify: false });
    return [];
  } catch (err) {
    const e = err as LightningError;
    return [
      {
        ruleId: CSS_PARSES,
        file: file.path,
        line: e.loc?.line ?? 1,
        column: e.loc?.column,
        message: `does not parse: ${e.message ?? String(err)}`,
      },
    ];
  }
}

export function cssParses(file: SourceFile): Finding[] {
  return [...cssBalance(file), ...cssSyntax(file)];
}

/** `packages/css/src/` and `packages/styles/`, the scope of order R0.5. */
export function isParsedCss(path: string): boolean {
  return /^packages\/(css\/src|styles)\/.+\.css$/.test(path);
}

export const cssParsesRule: Rule = {
  id: CSS_PARSES,
  description: 'Every stylesheet under packages/css/src and packages/styles parses: balanced, and read by Lightning CSS without error recovery.',
  appliesTo: isParsedCss,
  check: cssParses,
};
