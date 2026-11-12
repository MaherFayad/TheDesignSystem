// The rules `ds doctor` runs on a consumer's code. File rules from the repo
// gates are reused as they are (raw colors and values, logical properties,
// token vocabulary, native title, no dash, React Native style literals); the
// markup rules below read the element model of elements.ts and the manifest
// index of manifests.ts, so they work the same on React, React Native and
// Angular.
import ts from 'typescript';
import { parseTs, propName, walk } from '../markup';
import { logicalProperties } from '../rules/logical-properties';
import { nativeNoStyleLiterals } from '../rules/native-no-style-literals';
import { createNoNativeTitle } from '../rules/no-native-title';
import { noDash } from '../rules/no-dash';
import { noRawColor } from '../rules/no-raw-color';
import { noRawValue } from '../rules/no-raw-value';
import { createTokenVocabulary } from '../rules/token-vocabulary';
import type { Finding, SourceFile } from '../types';
import { locator } from '../util';
import {
  allElements,
  angularTemplates,
  attr,
  readAngular,
  readImports,
  readJsx,
  stringAttr,
  type AngularCompiler,
  type Framework,
  type UiChild,
  type UiElement,
} from './elements';
import { childrenSlot, insteadUseHint, knows, propValues, type ManifestIndex } from './manifests';

export type Severity = 'error' | 'warning';

export interface DoctorFinding {
  ruleId: string;
  severity: Severity;
  /** Relative to the checked root, forward slashes. */
  file: string;
  line: number;
  column: number;
  message: string;
  /** What to write instead, when there is one answer. */
  fix?: string;
}

/** Every rule of the doctor, with its stable id. Ids never change; a retired rule keeps its id reserved. */
export const DOCTOR_RULES = [
  { id: 'ds/no-raw-color', severity: 'error', applies: 'css', description: 'No raw colors in CSS. Use a --ds-* color token.' },
  { id: 'ds/no-raw-value', severity: 'error', applies: 'css', description: 'No raw spacing, size, radius, font size, shadow, duration or z-index in CSS.' },
  { id: 'ds/token-vocabulary', severity: 'error', applies: 'css, react, native, angular', description: 'Every var(--ds-*) exists in the token build.' },
  { id: 'ds/logical-properties', severity: 'error', applies: 'css', description: 'CSS uses start and end, never left and right.' },
  { id: 'ds/direction', severity: 'error', applies: 'react, native, angular', description: 'Inline styles use start and end, never left and right.' },
  { id: 'ds/primitives', severity: 'error', applies: 'react, angular', description: 'No bare button, input, select or dialog where a system component exists.' },
  { id: 'ds/no-radix-import', severity: 'error', applies: 'react, native', description: 'App code imports system components, never radix-ui directly.' },
  { id: 'ds/touch-target', severity: 'error', applies: 'react, native, angular', description: 'No size xs on a control in a touch template.' },
  { id: 'ds/copy', severity: 'error', applies: 'react, native, angular', description: 'Button labels are a verb plus a noun, never OK, Continue, Confirm or Yes.' },
  { id: 'ds/no-dash', severity: 'error', applies: 'react, native, angular', description: 'No em dash or en dash in copy or code.' },
  { id: 'ds/slot-limits', severity: 'error', applies: 'react, native, angular', description: 'Children and slot props follow the manifest slots (accepts, max, min).' },
  { id: 'ds/shared-axes', severity: 'error', applies: 'react, native, angular', description: 'size, tone, emphasis and shape take only the values in the manifest props.' },
  { id: 'ds/no-native-title', severity: 'error', applies: 'react, angular', description: 'No native title attribute for hints. Use Tooltip.' },
  { id: 'ds/native-no-style-literals', severity: 'error', applies: 'native', description: 'React Native styles take colors and sizes from the theme.' },
] as const satisfies readonly { id: string; severity: Severity; applies: string; description: string }[];

export type DoctorRuleId = (typeof DOCTOR_RULES)[number]['id'];

export type FileKind = 'css' | 'react' | 'native' | 'angular' | 'other';

export interface DoctorContext {
  index: ManifestIndex;
  /** Names the token build declares; undefined when the build was not found (the vocabulary rule is skipped). */
  tokenNames?: ReadonlySet<string>;
  /** Directive attributes with a `title` input; undefined means any `ds*` directive. */
  titleHosts?: ReadonlySet<string>;
  angular: AngularCompiler | null;
  prefix: string;
  /** Module names that export system components. */
  packages: readonly string[];
  nativePackages: readonly string[];
}

export interface DoctorFile {
  /** Relative to the root, forward slashes. */
  path: string;
  content: string;
  /** True when the file is a touch template (config `touch`, or React Native). */
  touch: boolean;
}

const SHARED_AXES = ['size', 'tone', 'emphasis', 'shape'] as const;
const BANNED_LABELS = new Set(['ok', 'okay', 'continue', 'confirm', 'yes']);
/** Elements that hold phrasing text, allowed where a slot accepts text. */
const PHRASING = new Set(['span', 'strong', 'em', 'b', 'i', 'code', 'kbd', 'bdi', 'small', 'abbr', 'mark', 'br']);
/** Angular elements that only group: their children count, not the element. */
const TRANSPARENT = new Set(['ng-container']);

function ruleSeverity(id: string): Severity {
  return DOCTOR_RULES.find((r) => r.id === id)?.severity ?? 'error';
}

function fromFinding(f: Finding, ruleId = f.ruleId, severity: Severity = ruleSeverity(ruleId)): DoctorFinding {
  return { ruleId, severity, file: f.file, line: f.line, column: f.column ?? 1, message: f.message };
}

// ---------------------------------------------------------------- classify

export function classify(path: string, content: string, ctx: Pick<DoctorContext, 'nativePackages'>): FileKind {
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html')) return 'angular';
  if (/\.[cm]?[jt]sx?$/.test(path)) {
    if (path.endsWith('.ts') && /@Component\s*\(/.test(content)) return 'angular';
    const native = /from\s+['"]react-native['"]/.test(content) || ctx.nativePackages.some((p) => content.includes(`'${p}'`) || content.includes(`"${p}"`));
    return native ? 'native' : 'react';
  }
  return 'other';
}

// ---------------------------------------------------------------- CSS

/** `100dvh` and friends: a full viewport is layout, not a design value, so app CSS may write it. */
const FULL_VIEWPORT = /: 100(vw|vh|dvw|dvh|svw|svh|lvw|lvh|vi|vb|vmin|vmax) is a raw length/;

function checkCss(file: SourceFile, ctx: DoctorContext): DoctorFinding[] {
  const raw = noRawValue(file).filter((f) => !FULL_VIEWPORT.test(f.message));
  const out = [...noRawColor(file), ...raw, ...logicalProperties(file)].map((f) => fromFinding(f));
  if (ctx.tokenNames) out.push(...createTokenVocabulary(ctx.tokenNames, ctx.prefix)(file).map((f) => fromFinding(f)));
  return out;
}

// ---------------------------------------------------------------- markup rules

function finding(file: string, at: (i: number) => { line: number; column: number }, index: number, ruleId: DoctorRuleId, message: string, fix?: string, severity?: Severity): DoctorFinding {
  const pos = at(index);
  const f: DoctorFinding = { ruleId, severity: severity ?? ruleSeverity(ruleId), file, line: pos.line, column: pos.column, message };
  if (fix) f.fix = fix;
  return f;
}

const PRIMITIVE: Record<string, string> = { button: 'Button', select: 'Select', dialog: 'Dialog', textarea: 'Textarea' };
const INPUT_TYPES: Record<string, string | null> = {
  checkbox: 'Checkbox',
  radio: 'Radio',
  range: 'Slider',
  submit: 'Button',
  button: 'Button',
  reset: 'Button',
  hidden: null,
  file: null,
  image: null,
  color: null,
};

function hasDsAttr(el: UiElement | undefined): boolean {
  return Boolean(el?.attrs.some((a) => /^ds[A-Z]/.test(a.name)));
}

/**
 * Children with transparent wrappers opened up: Angular `ng-container`, and
 * a system wrapper that has no manifest of its own and renders its one child
 * (`DialogClose`, `DialogTrigger`, always asChild).
 */
function flatChildren(el: UiElement, index?: ManifestIndex): UiChild[] {
  return el.children.flatMap((c) => {
    if (c.kind !== 'element') return [c];
    const child = c.element;
    if (TRANSPARENT.has(child.tag)) return flatChildren(child, index);
    if (index && child.system && !knows(index, child.system)) {
      const inner = child.children.filter((k) => k.kind === 'element');
      if (inner.length === 1 && child.children.length === 1) return flatChildren(child, index);
    }
    return [c];
  });
}

/** `asChild`: the element renders its one child, so the child holds the content. */
function asChildOf(el: UiElement): UiElement | undefined {
  if (!attr(el, 'asChild')) return undefined;
  const kids = el.children.filter((c) => c.kind === 'element');
  return kids.length === 1 && kids[0]?.kind === 'element' ? kids[0].element : undefined;
}

function textOf(el: UiElement): string | undefined {
  const kids = flatChildren(el);
  if (kids.length === 0 || kids.some((c) => c.kind !== 'text')) return undefined;
  return kids.map((c) => (c.kind === 'text' ? c.text : '')).join(' ').trim();
}

function primitiveTarget(el: UiElement): string | undefined {
  if (el.tag === 'input') {
    const type = (stringAttr(el, 'type') ?? 'text').toLowerCase();
    if (type in INPUT_TYPES) return INPUT_TYPES[type] ?? undefined;
    return 'Input';
  }
  return PRIMITIVE[el.tag];
}

function systemLabel(framework: Framework, name: string): string {
  if (framework === 'angular') return `the ds${name} directive`;
  return name;
}

export function markupFindings(file: DoctorFile, roots: UiElement[], ctx: DoctorContext, framework: Framework): DoctorFinding[] {
  const at = locator(file.content);
  const out: DoctorFinding[] = [];
  const add = (index: number, ruleId: DoctorRuleId, message: string, fix?: string, severity?: Severity) => out.push(finding(file.path, at, index, ruleId, message, fix, severity));
  const { index } = ctx;

  for (const el of allElements(roots)) {
    // ds/primitives
    if (el.intrinsic && framework !== 'native') {
      const target = primitiveTarget(el);
      const angularHosted = framework === 'angular' && (hasDsAttr(el) || hasDsAttr(el.parent));
      if (target && index.components.has(target) && !angularHosted) {
        const m = index.components.get(target);
        add(el.index, 'ds/primitives', `<${el.tag}> where the system has ${target}. Use ${systemLabel(framework, target)}.${insteadUseHint(m, 2)}`, target);
      }
    }

    if (!el.system) continue;
    const m = index.components.get(el.system);

    // ds/shared-axes
    if (m) {
      for (const axis of SHARED_AXES) {
        const a = attr(el, axis);
        if (!a || a.value.kind !== 'string') continue;
        const allowed = propValues(m, axis);
        if (!m.props?.[axis]) add(a.index, 'ds/shared-axes', `${m.name} has no ${axis} prop.`);
        else if (allowed && !allowed.includes(a.value.value)) {
          add(a.index, 'ds/shared-axes', `${m.name} ${axis}="${a.value.value}" is not a value of the manifest. Use one of: ${allowed.join(', ')}.`);
        }
      }

      // ds/touch-target
      const size = stringAttr(el, 'size');
      if (size === 'xs' && (file.touch || framework === 'native')) {
        add(attr(el, 'size')!.index, 'ds/touch-target', `${m.name} size="xs" is 24px, under the 44pt (iOS) and 48dp (Android) touch target. Use sm or larger in a touch template.`, 'size="md"');
      }
    }

    // ds/copy. A label in its own language (a language switch) is a name, not an action.
    const rendered = asChildOf(el);
    if (el.system === 'Button' || el.system === 'IconButton') {
      const label = stringAttr(el, 'label') ?? (el.system === 'Button' ? textOf(rendered ?? el) : undefined);
      const named = attr(el, 'lang') ?? (rendered ? attr(rendered, 'lang') : undefined);
      if (label !== undefined && !named) {
        const plain = label.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim();
        const where = attr(el, 'label')?.index ?? el.index;
        if (BANNED_LABELS.has(plain)) {
          add(where, 'ds/copy', `"${label}" says nothing about the action. A button is a verb plus a noun, for example "Save board".`);
        } else if (/^[A-Za-z]+$/.test(plain)) {
          add(where, 'ds/copy', `"${label}" is one word. A button is a verb plus a noun, for example "Delete board".`, undefined, 'warning');
        }
      }
    }

    // ds/slot-limits: children
    const cs = rendered ? undefined : childrenSlot(index, el.system);
    if (cs) {
      const kids = flatChildren(el, index);
      const elems = kids.filter((c): c is { kind: 'element'; element: UiElement } => c.kind === 'element');
      const texts = kids.filter((c) => c.kind === 'text');
      const exprs = kids.filter((c) => c.kind === 'expr');
      const { slot, owner, slotName } = cs;
      const hint = insteadUseHint(owner, 2);
      const where = `${owner.name} ${slotName}`;
      // Where a slot takes text, text and phrasing elements together are one label.
      const takesText = slot.accepts === 'text' || (Array.isArray(slot.accepts) && slot.accepts.includes('text'));
      const phrasing = (e: UiElement) => e.system === 'Bidi' || (e.intrinsic && PHRASING.has(e.tag));
      const items = takesText
        ? elems.filter((c) => !phrasing(c.element)).length + (texts.length > 0 || elems.some((c) => phrasing(c.element)) ? 1 : 0)
        : elems.length + texts.length;
      if (slot.max !== undefined && items > slot.max) {
        add(el.index, 'ds/slot-limits', `${el.system} holds ${items} items; the ${where} slot takes at most ${slot.max}.${hint}`);
      }
      if (slot.min && items + exprs.length === 0 && !attr(el, 'children') && !el.spread) {
        add(el.index, 'ds/slot-limits', `${el.system} is empty; the ${where} slot needs at least ${slot.min}.`);
      }
      const accepts = slot.accepts ?? 'any';
      if (accepts !== 'any') {
        const list = accepts === 'text' ? ['text'] : accepts;
        const textOk = list.includes('text');
        for (const c of elems) {
          const child = c.element;
          const ok = (child.system && list.includes(child.system)) || (textOk && phrasing(child));
          if (!ok) add(child.index, 'ds/slot-limits', `<${child.tag}> in the ${where} slot, which takes ${list.join(', ')}.${hint}`);
        }
        if (!textOk) for (const t of texts) add(t.kind === 'text' ? t.index : el.index, 'ds/slot-limits', `Text in the ${where} slot, which takes ${list.join(', ')}.${hint}`);
      }
    }

    // ds/slot-limits: slot props (`start={<Icon />}`)
    if (m?.slots) {
      for (const [slotName, slot] of Object.entries(m.slots)) {
        if (slotName === 'root' || slotName === 'label' || !Array.isArray(slot.accepts)) continue;
        const a = attr(el, slotName);
        if (a?.value.kind !== 'element') continue;
        const child = a.value.element;
        if (!child.system || !slot.accepts.includes(child.system)) {
          add(a.index, 'ds/slot-limits', `${m.name} ${slotName} takes ${slot.accepts.join(', ')}, not <${child.tag}>.${insteadUseHint(m, 2)}`);
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- direction (inline styles)

const WEB_PHYSICAL: Record<string, string> = {
  left: 'insetInlineStart',
  right: 'insetInlineEnd',
  marginLeft: 'marginInlineStart',
  marginRight: 'marginInlineEnd',
  paddingLeft: 'paddingInlineStart',
  paddingRight: 'paddingInlineEnd',
  borderLeft: 'borderInlineStart',
  borderRight: 'borderInlineEnd',
  borderLeftWidth: 'borderInlineStartWidth',
  borderRightWidth: 'borderInlineEndWidth',
  borderLeftColor: 'borderInlineStartColor',
  borderRightColor: 'borderInlineEndColor',
  borderLeftStyle: 'borderInlineStartStyle',
  borderRightStyle: 'borderInlineEndStyle',
  borderTopLeftRadius: 'borderStartStartRadius',
  borderTopRightRadius: 'borderStartEndRadius',
  borderBottomLeftRadius: 'borderEndStartRadius',
  borderBottomRightRadius: 'borderEndEndRadius',
};

const NATIVE_PHYSICAL: Record<string, string> = {
  left: 'start',
  right: 'end',
  marginLeft: 'marginStart',
  marginRight: 'marginEnd',
  paddingLeft: 'paddingStart',
  paddingRight: 'paddingEnd',
  borderLeftWidth: 'borderStartWidth',
  borderRightWidth: 'borderEndWidth',
  borderLeftColor: 'borderStartColor',
  borderRightColor: 'borderEndColor',
  borderTopLeftRadius: 'borderTopStartRadius',
  borderTopRightRadius: 'borderTopEndRadius',
  borderBottomLeftRadius: 'borderBottomStartRadius',
  borderBottomRightRadius: 'borderBottomEndRadius',
};

const STYLE_PROP = /^(style|[a-z][A-Za-z]*Style)$/;

function tsDirection(file: DoctorFile, source: ts.SourceFile, native: boolean): DoctorFinding[] {
  const at = locator(file.content);
  const out: DoctorFinding[] = [];
  const map = native ? NATIVE_PHYSICAL : WEB_PHYSICAL;
  const seen = new Set<ts.Node>();
  const scan = (root: ts.Node) =>
    walk(root, (n) => {
      if (!ts.isPropertyAssignment(n) || seen.has(n)) return;
      seen.add(n);
      const key = propName(n.name);
      if (!key) return;
      if (map[key]) {
        out.push(finding(file.path, at, n.getStart(source), 'ds/direction', `${key} is physical and does not mirror in RTL. Use ${map[key]}.`, map[key]));
      } else if (!native && (key === 'textAlign' || key === 'float') && ts.isStringLiteralLike(n.initializer) && /^(left|right)$/.test(n.initializer.text)) {
        const fix = n.initializer.text === 'left' ? (key === 'float' ? 'inline-start' : 'start') : key === 'float' ? 'inline-end' : 'end';
        out.push(finding(file.path, at, n.getStart(source), 'ds/direction', `${key}: '${n.initializer.text}' is physical. Use '${fix}'.`, `'${fix}'`));
      }
    });
  walk(source, (node) => {
    if (ts.isJsxAttribute(node) && STYLE_PROP.test(propName(node.name) ?? '') && node.initializer) scan(node.initializer);
    if (ts.isCallExpression(node) && /(^|\.)StyleSheet\.create$/.test(node.expression.getText(source))) for (const a of node.arguments) scan(a);
  });
  if (native && file.path.endsWith('.styles.ts')) scan(source);
  return out;
}

function angularDirection(file: DoctorFile, roots: UiElement[]): DoctorFinding[] {
  const at = locator(file.content);
  const out: DoctorFinding[] = [];
  for (const el of allElements(roots)) {
    for (const a of el.attrs) {
      let css: string | undefined;
      if (a.binding === 'static' && a.name === 'style' && a.value.kind === 'string') css = a.value.value;
      if (a.binding === 'style') css = `${a.name.split('.')[0]}: 1`;
      if (!css) continue;
      for (const f of logicalProperties({ path: file.path, content: `x { ${css} }` })) {
        out.push(finding(file.path, at, a.index, 'ds/direction', f.message));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- per file

function tokenStrings(file: DoctorFile, ctx: DoctorContext): DoctorFinding[] {
  if (!ctx.tokenNames) return [];
  const names = ctx.tokenNames;
  const at = locator(file.content);
  const out: DoctorFinding[] = [];
  for (const m of file.content.matchAll(new RegExp(`var\\(\\s*(--${ctx.prefix}-[\\w-]+)`, 'g'))) {
    const name = m[1] ?? '';
    if (names.has(name)) continue;
    out.push(finding(file.path, at, (m.index ?? 0) + 4, 'ds/token-vocabulary', `${name} is not in the token build. Use a token from @the-system/tokens.`));
  }
  return out;
}

/** Runs every rule that applies to one file. The Angular compiler is loaded beforehand (`ctx.angular`). */
export function checkFile(file: DoctorFile, ctx: DoctorContext): DoctorFinding[] {
  const kind = classify(file.path, file.content, ctx);
  const src: SourceFile = { path: file.path, content: file.content };
  if (kind === 'css') return checkCss(src, ctx);
  if (kind === 'other') return [];

  const out: DoctorFinding[] = [];
  out.push(...noDash(src).map((f) => fromFinding(f, 'ds/no-dash')));
  out.push(...tokenStrings(file, ctx));

  if (kind === 'angular') {
    out.push(...createNoNativeTitle(ctx.titleHosts)(src).map((f) => fromFinding(f, 'ds/no-native-title')));
    if (!ctx.angular) return out;
    for (const t of angularTemplates(file.path, file.content)) {
      const { roots } = readAngular(ctx.angular, t.text, t.offset, (name) => knows(ctx.index, name));
      out.push(...markupFindings(file, roots, ctx, 'angular'));
      out.push(...angularDirection(file, roots));
    }
    return out;
  }

  const source = parseTs(file.path, file.content);
  const imports = readImports(source, ctx.packages, ctx.nativePackages);
  const at = locator(file.content);
  for (const r of imports.radix) {
    out.push(finding(file.path, at, r.index, 'ds/no-radix-import', `Import from ${r.module} in app code. Use the system component from ${ctx.packages[0] ?? '@the-system/react'}; it wires the behavior, the anatomy and the tokens.`));
  }
  const native = kind === 'native';
  if (native) out.push(...nativeNoStyleLiterals(src).map((f) => fromFinding(f)));
  else out.push(...createNoNativeTitle(ctx.titleHosts)(src).map((f) => fromFinding(f, 'ds/no-native-title')));
  out.push(...tsDirection(file, source, native));
  if (file.path.endsWith('x')) out.push(...markupFindings(file, readJsx(source, imports, native ? 'native' : 'react'), ctx, native ? 'native' : 'react'));
  return out;
}
