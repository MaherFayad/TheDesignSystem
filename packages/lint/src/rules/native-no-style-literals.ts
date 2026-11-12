// ds/native-no-style-literals: React Native components take color and size
// from the theme, through `create<Name>Styles(theme, variants)` in
// `<Name>.styles.ts`. Outside `*.styles.ts`, a style object may not hold a
// color or size literal: not inline (`style={{ padding: 12 }}`), not in a
// `StyleSheet.create` call.
//
// Allowed: 0, percentages, and unitless layout numbers that are not sizes
// (`flex`, `flexGrow`, `flexShrink`, `opacity`, `aspectRatio`).
import ts from 'typescript';
import { parseTs, propName, walk } from '../markup';
import { isNativeSource } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { extname, locator, looksLikeColor } from '../util';

export const NATIVE_NO_STYLE_LITERALS = 'ds/native-no-style-literals';

const UNITLESS_OK = new Set(['flex', 'flexGrow', 'flexShrink', 'opacity', 'aspectRatio', 'fontWeight']);

/** `style`, `contentContainerStyle`, `labelStyle` and so on. */
const STYLE_PROP = /^(style|[a-z][A-Za-z]*Style)$/;

function numericValue(node: ts.Expression): number | undefined {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
    return -Number(node.operand.text);
  }
  return undefined;
}

export function nativeNoStyleLiterals(file: SourceFile): Finding[] {
  const ext = extname(file.path);
  if (!['.tsx', '.ts'].includes(ext) || file.path.endsWith('.styles.ts')) return [];
  const source = parseTs(file.path, file.content);
  const at = locator(file.content);
  const out: Finding[] = [];
  const seen = new Set<ts.Node>();

  const scan = (root: ts.Node) => {
    walk(root, (n) => {
      if (!ts.isPropertyAssignment(n) || seen.has(n)) return;
      seen.add(n);
      const key = propName(n.name) ?? n.name.getText(source);
      const init = n.initializer;
      const num = numericValue(init);
      let literal: string | undefined;
      if (num !== undefined && num !== 0 && !UNITLESS_OK.has(key)) literal = init.getText(source);
      if (ts.isStringLiteralLike(init) && (looksLikeColor(init.text) || /^-?\d*\.?\d+(px|pt|dp)$/i.test(init.text.trim()))) {
        literal = init.getText(source);
      }
      if (literal === undefined) return;
      const pos = at(n.getStart(source));
      out.push({
        ruleId: NATIVE_NO_STYLE_LITERALS,
        file: file.path,
        line: pos.line,
        column: pos.column,
        message: `${key}: ${literal} is a literal in a style. Read it from the theme in <Name>.styles.ts.`,
      });
    });
  };

  walk(source, (node) => {
    if (ts.isJsxAttribute(node) && STYLE_PROP.test(propName(node.name) ?? '') && node.initializer) scan(node.initializer);
    if (ts.isCallExpression(node) && /(^|\.)StyleSheet\.create$/.test(node.expression.getText(source))) {
      for (const arg of node.arguments) scan(arg);
    }
  });
  return out;
}

export const nativeNoStyleLiteralsRule: Rule = {
  id: NATIVE_NO_STYLE_LITERALS,
  description: 'No color or size literals in React Native style objects outside *.styles.ts.',
  appliesTo: isNativeSource,
  check: nativeNoStyleLiterals,
};
