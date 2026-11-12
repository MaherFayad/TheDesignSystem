// One element model for the doctor's markup rules, read from React and
// React Native TSX (TypeScript compiler API) and from Angular templates
// (`@angular/compiler`, loaded on demand). The rules in checks.ts only see
// this model, so each rule is written once for every framework.
import ts from 'typescript';
import { inlineTemplates, parseTs, propName } from '../markup';
import { extname } from '../util';

export type Framework = 'react' | 'native' | 'angular';

/** A prop or attribute value. `element` is a JSX element passed as a prop (`start={<Icon />}`). */
export type AttrValue =
  | { kind: 'string'; value: string }
  | { kind: 'element'; element: UiElement }
  | { kind: 'expr' }
  | { kind: 'none' };

export interface UiAttr {
  /** The prop or input name, brackets removed: `[size]` gives `size`. */
  name: string;
  /** As written: `[size]`, `size`, `[style.left.px]`, `*ngIf`. */
  raw: string;
  value: AttrValue;
  /** Angular binding kind, or `prop` for JSX. */
  binding: 'prop' | 'static' | 'property' | 'attribute' | 'style' | 'class' | 'event' | 'other';
  /** Offset in the file. */
  index: number;
}

export type UiChild = { kind: 'element'; element: UiElement } | { kind: 'text'; text: string; index: number } | { kind: 'expr'; index: number };

export interface UiElement {
  framework: Framework;
  /** The tag as written: `Button`, `DS.Button`, `button`, `div`, `ng-template`. */
  tag: string;
  /** True for a DOM element (React lowercase tag, or any Angular element). */
  intrinsic: boolean;
  /** The system name: a component (`Button`) or a part component (`DialogFooter`). Set by the reader. */
  system?: string;
  attrs: UiAttr[];
  children: UiChild[];
  /** True when JSX spreads props (`{...rest}`): unknown props may be set. */
  spread: boolean;
  /** Offset of the tag in the file. */
  index: number;
  parent?: UiElement;
}

export function attr(el: UiElement, name: string): UiAttr | undefined {
  return el.attrs.find((a) => a.name === name);
}

export function stringAttr(el: UiElement, name: string): string | undefined {
  const a = attr(el, name);
  return a?.value.kind === 'string' ? a.value.value : undefined;
}

// ---------------------------------------------------------------- React and React Native

/** Local names bound to system exports: `import { Button as B } from '@the-system/react'`. */
export interface SystemImports {
  /** Local name to export name. */
  named: Map<string, string>;
  /** Namespace imports: `import * as DS from '@the-system/react'`. */
  namespaces: Set<string>;
  /** True when the file imports `react-native` or a native system package. */
  native: boolean;
  /** `radix-ui` and `@radix-ui/*` imports, with their offsets. */
  radix: { module: string; index: number }[];
}

export function readImports(source: ts.SourceFile, packages: readonly string[], nativePackages: readonly string[]): SystemImports {
  const out: SystemImports = { named: new Map(), namespaces: new Set(), native: false, radix: [] };
  for (const st of source.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const mod = st.moduleSpecifier.text;
    if (mod === 'react-native' || nativePackages.includes(mod)) out.native = true;
    if (mod === 'radix-ui' || mod.startsWith('@radix-ui/')) out.radix.push({ module: mod, index: st.getStart(source) });
    if (!packages.includes(mod) && !nativePackages.includes(mod)) continue;
    const clause = st.importClause;
    if (!clause || clause.isTypeOnly) continue;
    const b = clause.namedBindings;
    if (b && ts.isNamespaceImport(b)) out.namespaces.add(b.name.text);
    if (b && ts.isNamedImports(b)) {
      for (const e of b.elements) {
        if (e.isTypeOnly) continue;
        out.named.set(e.name.text, (e.propertyName ?? e.name).text);
      }
    }
  }
  return out;
}

function systemName(tag: string, imports: SystemImports): string | undefined {
  const dot = tag.indexOf('.');
  if (dot > 0) return imports.namespaces.has(tag.slice(0, dot)) ? tag.slice(dot + 1) : undefined;
  return imports.named.get(tag);
}

function jsxText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Reads every JSX element of a TSX file into the model. Roots are the outermost elements. */
export function readJsx(source: ts.SourceFile, imports: SystemImports, framework: Framework): UiElement[] {
  const roots: UiElement[] = [];

  const fromJsx = (node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment, parent?: UiElement): UiElement[] => {
    if (ts.isJsxFragment(node)) {
      // A fragment is transparent: its children belong to the parent.
      return childrenOf(node.children, parent).flatMap((c) => (c.kind === 'element' ? [c.element] : []));
    }
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const tag = opening.tagName.getText(source);
    const intrinsic = /^[a-z]/.test(tag) && !tag.includes('.');
    const el: UiElement = { framework, tag, intrinsic, attrs: [], children: [], spread: false, index: opening.getStart(source) };
    if (parent) el.parent = parent;
    const sys = intrinsic ? undefined : systemName(tag, imports);
    if (sys) el.system = sys;
    for (const a of opening.attributes.properties) {
      if (ts.isJsxSpreadAttribute(a)) {
        el.spread = true;
        continue;
      }
      const name = propName(a.name) ?? a.name.getText(source);
      el.attrs.push({ name, raw: name, value: jsxValue(a.initializer, el), binding: 'prop', index: a.getStart(source) });
    }
    if (ts.isJsxElement(node)) el.children = childrenOf(node.children, el);
    return [el];
  };

  const jsxValue = (init: ts.JsxAttributeValue | undefined, owner: UiElement): AttrValue => {
    if (!init) return { kind: 'none' };
    if (ts.isStringLiteral(init)) return { kind: 'string', value: init.text };
    if (ts.isJsxExpression(init)) {
      const e = init.expression;
      if (!e) return { kind: 'none' };
      if (ts.isStringLiteralLike(e)) return { kind: 'string', value: e.text };
      const inner = ts.isParenthesizedExpression(e) ? e.expression : e;
      if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner)) {
        const [element] = fromJsx(inner, owner);
        if (element) return { kind: 'element', element };
      }
      return { kind: 'expr' };
    }
    if (ts.isJsxElement(init) || ts.isJsxSelfClosingElement(init)) {
      const [element] = fromJsx(init, owner);
      if (element) return { kind: 'element', element };
    }
    return { kind: 'expr' };
  };

  const childrenOf = (nodes: ts.NodeArray<ts.JsxChild>, parent: UiElement | undefined): UiChild[] => {
    const out: UiChild[] = [];
    for (const c of nodes) {
      if (ts.isJsxText(c)) {
        const text = jsxText(c.text);
        if (text) out.push({ kind: 'text', text, index: c.getStart(source) });
      } else if (ts.isJsxExpression(c)) {
        const e = c.expression;
        if (!e) continue;
        if (ts.isStringLiteralLike(e)) out.push({ kind: 'text', text: e.text, index: e.getStart(source) });
        else out.push({ kind: 'expr', index: c.getStart(source) });
      } else {
        for (const element of fromJsx(c, parent)) out.push({ kind: 'element', element });
      }
    }
    return out;
  };

  // Outermost JSX only; nested JSX is read through its parent. JSX inside an
  // expression child (a `.map`, a condition) starts a new root.
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      roots.push(...fromJsx(node));
      // Still look inside expressions for JSX the model does not hold.
      ts.forEachChild(node, (child) => visitExpressions(child));
      return;
    }
    ts.forEachChild(node, visit);
  };
  const visitExpressions = (node: ts.Node) => {
    if (ts.isJsxExpression(node)) {
      if (node.expression && !isDirectJsx(node.expression)) ts.forEachChild(node.expression, visit);
      return;
    }
    if (ts.isJsxAttribute(node) || ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node) || ts.isJsxOpeningElement(node) || ts.isJsxAttributes(node)) {
      ts.forEachChild(node, visitExpressions);
    }
  };
  visit(source);
  return roots;
}

function isDirectJsx(e: ts.Expression): boolean {
  const inner = ts.isParenthesizedExpression(e) ? e.expression : e;
  return ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner) || ts.isJsxFragment(inner);
}

// ---------------------------------------------------------------- Angular

/** The part of `@angular/compiler` the doctor uses. */
export interface AngularCompiler {
  parseTemplate(template: string, url: string, options?: { preserveWhitespaces?: boolean }): { nodes: unknown[]; errors: unknown[] | null };
}

let compiler: AngularCompiler | null | undefined;

/** Loads `@angular/compiler` once. Null when it is not installed. */
export async function loadAngularCompiler(): Promise<AngularCompiler | null> {
  if (compiler !== undefined) return compiler;
  try {
    compiler = (await import('@angular/compiler')) as unknown as AngularCompiler;
  } catch {
    compiler = null;
  }
  return compiler;
}

interface NgSpan {
  start: { offset: number };
  end: { offset: number };
}
interface NgNode {
  name?: string;
  tagName?: string;
  value?: unknown;
  attributes?: { name: string; value: string; sourceSpan: NgSpan }[];
  inputs?: { name: string; type: number; value: { ast?: { value?: unknown; constructor: { name: string } } }; sourceSpan: NgSpan }[];
  outputs?: { name: string; sourceSpan: NgSpan }[];
  templateAttrs?: unknown[];
  children?: NgNode[];
  branches?: NgNode[];
  cases?: NgNode[];
  empty?: NgNode | null;
  sourceSpan: NgSpan;
  constructor: { name: string };
}

/** `dsDialogFooter` gives `DialogFooter`. */
export function angularSystemName(attrName: string): string | undefined {
  const m = /^ds([A-Z]\w*)$/.exec(attrName);
  return m?.[1];
}

/** Every Angular template in a file: the whole `.html`, or the inline `template:` strings of a `.ts`. */
export function angularTemplates(path: string, content: string): { text: string; offset: number }[] {
  if (extname(path) === '.html') return [{ text: content, offset: 0 }];
  if (extname(path) === '.ts' && /@Component\s*\(/.test(content)) return inlineTemplates(parseTs(path, content));
  return [];
}

/** Reads one Angular template into the model. `known` names the system components and parts. */
export function readAngular(ng: AngularCompiler, text: string, offset: number, known: (name: string) => boolean): { roots: UiElement[]; errors: number } {
  const parsed = ng.parseTemplate(text, 'template.html', { preserveWhitespaces: false });
  const raw = (span: NgSpan) => text.slice(span.start.offset, span.end.offset);

  const toElement = (n: NgNode, tag: string, parent?: UiElement): UiElement => {
    const el: UiElement = { framework: 'angular', tag, intrinsic: true, attrs: [], children: [], spread: false, index: offset + n.sourceSpan.start.offset };
    if (parent) el.parent = parent;
    for (const a of n.attributes ?? []) {
      el.attrs.push({ name: a.name, raw: a.name, value: { kind: 'string', value: a.value }, binding: 'static', index: offset + a.sourceSpan.start.offset });
    }
    for (const i of n.inputs ?? []) {
      const rawText = raw(i.sourceSpan);
      const rawName = rawText.split('=')[0]?.trim() ?? i.name;
      const lit = i.value?.ast?.constructor.name === 'LiteralPrimitive' && typeof i.value.ast.value === 'string' ? (i.value.ast.value as string) : undefined;
      const binding = /^\[?attr\./.test(rawName) ? 'attribute' : /^\[?style\./.test(rawName) ? 'style' : /^\[?class\./.test(rawName) ? 'class' : i.type === 0 || i.type === 5 ? 'property' : 'other';
      el.attrs.push({
        name: i.name,
        raw: rawName,
        value: lit !== undefined ? { kind: 'string', value: lit } : { kind: 'expr' },
        binding,
        index: offset + i.sourceSpan.start.offset,
      });
    }
    for (const o of n.outputs ?? []) el.attrs.push({ name: o.name, raw: `(${o.name})`, value: { kind: 'expr' }, binding: 'event', index: offset + o.sourceSpan.start.offset });
    for (const a of el.attrs) {
      const sys = angularSystemName(a.name);
      if (sys && known(sys)) {
        el.system = sys;
        break;
      }
    }
    el.children = nodesToChildren(n.children ?? [], el);
    return el;
  };

  const nodesToChildren = (nodes: NgNode[], parent: UiElement | undefined): UiChild[] => {
    const out: UiChild[] = [];
    for (const n of nodes) {
      const kind = n.constructor.name;
      if (kind === 'Text') {
        const t = String(n.value ?? '').replace(/\s+/g, ' ').trim();
        if (t) out.push({ kind: 'text', text: t, index: offset + n.sourceSpan.start.offset });
      } else if (kind === 'BoundText') {
        out.push({ kind: 'expr', index: offset + n.sourceSpan.start.offset });
      } else if (kind === 'Element' || kind === 'Element$1') {
        out.push({ kind: 'element', element: toElement(n, n.name ?? '', parent) });
      } else if (kind === 'Template' && n.tagName === 'ng-template') {
        out.push({ kind: 'element', element: toElement(n, 'ng-template', parent) });
      } else {
        // Structural directives and control flow blocks are transparent.
        const nested = [...(n.children ?? []), ...(n.branches ?? []), ...(n.cases ?? []), ...(n.empty ? [n.empty] : [])];
        if (nested.length) out.push(...nodesToChildren(nested, parent));
      }
    }
    return out;
  };

  const roots = nodesToChildren(parsed.nodes as NgNode[], undefined).flatMap((c) => (c.kind === 'element' ? [c.element] : []));
  return { roots, errors: parsed.errors?.length ?? 0 };
}

/** Every element under the roots, depth first. */
export function allElements(roots: UiElement[]): UiElement[] {
  const out: UiElement[] = [];
  const visit = (el: UiElement) => {
    out.push(el);
    for (const c of el.children) if (c.kind === 'element') visit(c.element);
    for (const a of el.attrs) if (a.value.kind === 'element') visit(a.value.element);
  };
  roots.forEach(visit);
  return out;
}
