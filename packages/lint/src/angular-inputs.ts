// Reads Angular sources for the directive attributes that declare a given
// input, for example the hosts where `[title]` is an input and not the native
// attribute. Pure: takes file contents, returns attribute names such as
// `dsDialogContent`. Used by the no-native-title gate and by `ds doctor`.
import ts from 'typescript';
import { parseTs, propName } from './markup';

/** Attribute names in a selector: `button[dsButton], a[dsButton]` gives `dsButton`. */
export function selectorAttributes(selector: string): string[] {
  return [...new Set([...selector.matchAll(/\[([\w-]+)(?:[~|^$*]?=[^\]]*)?\]/g)].map((m) => m[1] ?? ''))].filter(Boolean);
}

function decoratorSelector(node: ts.ClassDeclaration, source: ts.SourceFile): string | undefined {
  for (const d of ts.getDecorators(node) ?? []) {
    if (!ts.isCallExpression(d.expression)) continue;
    const name = d.expression.expression.getText(source);
    if (name !== 'Component' && name !== 'Directive') continue;
    const arg = d.expression.arguments[0];
    if (!arg || !ts.isObjectLiteralExpression(arg)) continue;
    for (const p of arg.properties) {
      if (ts.isPropertyAssignment(p) && propName(p.name) === 'selector' && ts.isStringLiteralLike(p.initializer)) return p.initializer.text;
    }
  }
  return undefined;
}

function declaresInput(node: ts.ClassDeclaration, input: string, source: ts.SourceFile): boolean {
  for (const m of node.members) {
    if (!ts.isPropertyDeclaration(m) || propName(m.name) !== input) continue;
    const init = m.initializer?.getText(source) ?? '';
    if (/^input(\.required)?\s*(<[\s\S]*>)?\s*\(/.test(init) || /^model(\.required)?\s*(<[\s\S]*>)?\s*\(/.test(init)) return true;
    if ((ts.getDecorators(m) ?? []).some((d) => /^Input\b/.test(d.expression.getText(source)))) return true;
  }
  return false;
}

/** Every directive attribute whose class declares the input `input` (default `title`). */
export function inputHosts(files: Iterable<{ path: string; content: string }>, input = 'title'): Set<string> {
  const out = new Set<string>();
  for (const f of files) {
    if (!f.path.endsWith('.ts') || f.path.endsWith('.spec.ts') || !f.content.includes(input)) continue;
    const source = parseTs(f.path, f.content);
    ts.forEachChild(source, (node) => {
      if (!ts.isClassDeclaration(node)) return;
      const selector = decoratorSelector(node, source);
      if (selector && declaresInput(node, input, source)) for (const a of selectorAttributes(selector)) out.add(a);
    });
  }
  return out;
}

export const titleInputHosts = (files: Iterable<{ path: string; content: string }>): Set<string> => inputHosts(files, 'title');
