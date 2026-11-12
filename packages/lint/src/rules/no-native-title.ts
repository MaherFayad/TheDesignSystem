// ds/no-native-title: hints go through Tooltip, never the native `title`
// attribute (WCAG 1.4.13). Ported from GoBanana `design-no-title-tooltips.test.ts`
// and Figma-Killer-2 `no-native-title-tooltips.test.ts`.
//
// TSX is parsed with the TypeScript compiler: only `title` on a DOM element
// (a lowercase JSX tag) fails. A `title` prop on a component is a heading or
// data. HTML and Angular templates: `title`, `[title]` and `[attr.title]` on a
// native element (no hyphen in the tag name) fail. An SVG `<title>` element is
// fine. On an `<iframe>`, `title` is the accessible name and is required.
// On an element that carries a `ds*` directive attribute (for example
// `<div dsDialogContent [title]="t">`), `title` and `[title]` are the
// directive's input, not the native attribute, and pass. `[attr.title]`
// always writes the native attribute and still fails.
import ts from 'typescript';
import { boundName, jsxTag, parseTs, propName, readTags, templatesOf, walk } from '../markup';
import { isUiSource } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { extname, locator } from '../util';

export const NO_NATIVE_TITLE = 'ds/no-native-title';

/** Elements where `title` is not a hint but the accessible name. */
const TITLE_IS_NAME = new Set(['iframe', 'frame']);

/** A system directive attribute: `dsDialogContent`, `[dsTooltip]`, `*dsIf`. */
const DS_DIRECTIVE = /^[[*(]?ds[A-Z][\w]*\]?\)?$/;

const MESSAGE = 'native title attribute. Use the Tooltip component (WCAG 1.4.13).';

export function noNativeTitle(file: SourceFile): Finding[] {
  const ext = extname(file.path);
  if (!['.tsx', '.ts', '.html'].includes(ext)) return [];
  const out: Finding[] = [];
  const at = locator(file.content);
  const hit = (index: number, what: string) => {
    const pos = at(index);
    out.push({ ruleId: NO_NATIVE_TITLE, file: file.path, line: pos.line, column: pos.column, message: `${what}: ${MESSAGE}` });
  };

  const source = ext === '.html' ? undefined : parseTs(file.path, file.content);
  if (source) {
    walk(source, (node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const { tag, intrinsic } = jsxTag(node, source);
        if (!intrinsic || TITLE_IS_NAME.has(tag)) return;
        for (const attr of node.attributes.properties) {
          if (ts.isJsxAttribute(attr) && propName(attr.name) === 'title') hit(attr.getStart(source), `<${tag} title>`);
          if (ts.isJsxSpreadAttribute(attr) && ts.isObjectLiteralExpression(attr.expression)) {
            for (const p of attr.expression.properties) {
              if (propName(p.name) === 'title') hit(p.getStart(source), `<${tag} {...{ title }}>`);
            }
          }
        }
      }
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(source);
        const [first, second] = node.arguments;
        if (/(^|\.)setAttribute$/.test(callee) && first && ts.isStringLiteralLike(first) && first.text === 'title') {
          hit(node.getStart(source), 'setAttribute("title")');
        }
        if (
          /(^|\.)createElement$/.test(callee) &&
          first &&
          ts.isStringLiteralLike(first) &&
          !TITLE_IS_NAME.has(first.text) &&
          second &&
          ts.isObjectLiteralExpression(second) &&
          second.properties.some((p) => propName(p.name) === 'title')
        ) {
          hit(node.getStart(source), `createElement("${first.text}", { title })`);
        }
      }
      // Angular host bindings: host: { '[attr.title]': 'hint()' }.
      if (ts.isPropertyAssignment(node) && propName(node.name) === 'host' && ts.isObjectLiteralExpression(node.initializer)) {
        for (const p of node.initializer.properties) {
          const name = propName(p.name);
          if (name && boundName(name) === 'title') hit(p.getStart(source), `host ${name}`);
        }
      }
    });
  }

  for (const t of templatesOf(file.path, file.content, source)) {
    for (const tag of readTags(t.text)) {
      if (tag.name.includes('-') || TITLE_IS_NAME.has(tag.name)) continue;
      const directive = tag.attrs.some((a) => DS_DIRECTIVE.test(a.name));
      for (const a of tag.attrs) {
        if (boundName(a.name) !== 'title') continue;
        if (directive && !/^\[?attr\./i.test(a.name)) continue;
        hit(t.offset + a.index, `<${tag.name} ${a.name}>`);
      }
    }
  }
  return out;
}

export const noNativeTitleRule: Rule = {
  id: NO_NATIVE_TITLE,
  description: 'No native title attribute in TSX, HTML or Angular templates. Use Tooltip.',
  appliesTo: isUiSource,
  check: noNativeTitle,
};
