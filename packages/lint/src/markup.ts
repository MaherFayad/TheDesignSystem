// Markup helpers: a light tag reader for HTML and Angular templates, and the
// TypeScript parse shared by the rules that read TS and TSX.
import ts from 'typescript';
import { extname } from './util';

export interface Attr {
  name: string;
  value: string | undefined;
  /** Index of the attribute name inside the template text. */
  index: number;
}

export interface Tag {
  name: string;
  attrs: Attr[];
  /** Index of `<` inside the template text. */
  index: number;
}

const TAG = /<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTR = /\s+([^\s"'>/=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;

/** Every opening tag in an HTML or Angular template, comments skipped. */
export function readTags(html: string): Tag[] {
  const src = html.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  const out: Tag[] = [];
  for (const m of src.matchAll(TAG)) {
    const index = m.index ?? 0;
    const attrText = m[2] ?? '';
    const attrStart = index + 1 + (m[1] ?? '').length;
    const attrs: Attr[] = [];
    for (const a of attrText.matchAll(ATTR)) {
      const raw = a[2];
      const value = raw === undefined ? undefined : raw.replace(/^(["'])([\s\S]*)\1$/, '$2');
      const lead = (a[0] ?? '').length - (a[0] ?? '').trimStart().length;
      attrs.push({ name: a[1] ?? '', value, index: attrStart + (a.index ?? 0) + lead });
    }
    out.push({ name: (m[1] ?? '').toLowerCase(), attrs, index });
  }
  return out;
}

/** Angular binding names reduced to the attribute they set: `[attr.title]` and `bind-title` become `title`. */
export function boundName(name: string): string {
  return name
    .replace(/^\[(.*)\]$/, '$1')
    .replace(/^bind-/, '')
    .replace(/^attr\./, '')
    .toLowerCase();
}

/** A template and where its text starts in the file. */
export interface Template {
  text: string;
  offset: number;
}

export function parseTs(path: string, content: string): ts.SourceFile {
  const kind = extname(path) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, kind);
}

/** Inline Angular templates: `template: \`...\`` properties in a TS file. */
export function inlineTemplates(source: ts.SourceFile): Template[] {
  const out: Template[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && propName(node.name) === 'template') {
      const init = node.initializer;
      if (ts.isNoSubstitutionTemplateLiteral(init) || ts.isStringLiteral(init) || ts.isTemplateExpression(init)) {
        const start = init.getStart(source) + 1;
        const end = init.getEnd() - 1;
        out.push({ text: source.text.slice(start, end), offset: start });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

/** The templates a file holds: the whole file for `.html`, inline templates for `.ts`. */
export function templatesOf(path: string, content: string, source?: ts.SourceFile): Template[] {
  const ext = extname(path);
  if (ext === '.html') return [{ text: content, offset: 0 }];
  if (ext === '.ts' && content.includes('template')) return inlineTemplates(source ?? parseTs(path, content));
  return [];
}

export function propName(name: ts.PropertyName | ts.JsxAttributeName | undefined): string | undefined {
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
    return name.text;
  }
  if (ts.isJsxNamespacedName(name)) return `${name.namespace.text}:${name.name.text}`;
  return undefined;
}

/** The tag name of a JSX element, and whether it is a DOM element (lowercase, no dot). */
export function jsxTag(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement, source: ts.SourceFile): { tag: string; intrinsic: boolean } {
  const tag = node.tagName.getText(source);
  return { tag, intrinsic: /^[a-z]/.test(tag) && !tag.includes('.') && !tag.includes('-') };
}

export function walk(node: ts.Node, visit: (n: ts.Node) => void): void {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
}
