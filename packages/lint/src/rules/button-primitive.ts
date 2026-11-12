// ds/button-primitive: every button comes from the system. Ported from
// Figma-Killer-2 `button-primitive-usage.test.ts`.
//
// React: no `<button>` JSX element and no `createElement('button')` outside
// the Button implementation. Angular: a `<button>` must carry a system
// directive (`dsButton`, `dsIconButton`, any `ds*` attribute); a bare one fails.
import ts from 'typescript';
import { jsxTag, parseTs, readTags, templatesOf, walk } from '../markup';
import { isUiSource } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { extname, locator } from '../util';

export const BUTTON_PRIMITIVE = 'ds/button-primitive';

/** The Button implementation: the only folders that may render a bare `<button>`. */
export const BUTTON_IMPLEMENTATION = [
  'packages/react/src/components/Button/',
  'packages/react/src/components/IconButton/',
];

export function isButtonImplementation(path: string): boolean {
  return BUTTON_IMPLEMENTATION.some((dir) => path.startsWith(dir));
}

export function buttonPrimitive(file: SourceFile): Finding[] {
  const ext = extname(file.path);
  if (!['.tsx', '.ts', '.html'].includes(ext)) return [];
  const out: Finding[] = [];
  const at = locator(file.content);
  const hit = (index: number, message: string) => {
    const pos = at(index);
    out.push({ ruleId: BUTTON_PRIMITIVE, file: file.path, line: pos.line, column: pos.column, message, allowKey: file.path });
  };
  const source = ext === '.html' ? undefined : parseTs(file.path, file.content);
  if (source && ext === '.tsx') {
    walk(source, (node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        if (jsxTag(node, source).tag === 'button') hit(node.getStart(source), 'bare <button>. Use Button or IconButton from the system.');
      }
      if (ts.isCallExpression(node) && /(^|\.)createElement$/.test(node.expression.getText(source))) {
        const first = node.arguments[0];
        if (first && ts.isStringLiteralLike(first) && first.text === 'button') {
          hit(node.getStart(source), 'createElement("button"). Use Button or IconButton from the system.');
        }
      }
    });
  }
  for (const t of templatesOf(file.path, file.content, source)) {
    for (const tag of readTags(t.text)) {
      if (tag.name !== 'button') continue;
      if (tag.attrs.some((a) => /^ds[A-Z]/.test(a.name.replace(/^\[|\]$/g, '')))) continue;
      hit(t.offset + tag.index, 'bare <button> in a template. Use <button dsButton> or <button dsIconButton>.');
    }
  }
  return out;
}

export const buttonPrimitiveRule: Rule = {
  id: BUTTON_PRIMITIVE,
  description: 'No bare <button> outside the Button implementation. Angular buttons carry a ds directive.',
  appliesTo: (path) => isUiSource(path) && !isButtonImplementation(path),
  check: buttonPrimitive,
};
