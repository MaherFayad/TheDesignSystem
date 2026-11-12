// ds/no-tailwind: no Tailwind inside the system. Ported from Figma-Killer-2
// `no-tailwind-deps.test.ts` and `noTailwindUtilities.test.ts`.
//
// - package.json: no Tailwind package in any dependency field.
// - CSS: no `@tailwind`, `@apply` or `@import "tailwindcss"`.
// - Framework source (TSX, Angular templates): no utility class soup in
//   `className`, `class`, `[class]` or `[ngClass]`. One utility token is
//   enough to fail, as in the source test.
// - React Native source: no `className` at all (that is NativeWind).
//
// The Tailwind v4 `@theme` bridge for consumers lives in `packages/tokens/dist`
// and is build output, so it is out of scope.
import ts from 'typescript';
import { boundName, parseTs, propName, readTags, templatesOf, walk } from '../markup';
import { isFrameworkSource, isNativeSource, isSystemCss } from '../scopes';
import type { Finding, Rule, SourceFile } from '../types';
import { extname, locator, stripCssComments } from '../util';

export const NO_TAILWIND = 'ds/no-tailwind';

const BANNED_PACKAGES = [
  /^tailwindcss$/,
  /^@tailwindcss\//,
  /^tailwind-merge$/,
  /^tailwind-variants$/,
  /^tailwindcss-/,
  /^class-variance-authority$/,
  /^nativewind$/,
  /^uniwind$/,
  /^twrnc$/,
  /^twin\.macro$/,
];
const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/** Named Tailwind utilities, anchored to one class token. From the source test, widened a little. */
const UTILITY =
  /^(?:sr-only|not-sr-only|container|static|fixed|absolute|relative|sticky|isolate|flex|inline-flex|grid|inline-grid|block|inline-block|hidden|contents|flow-root|h-screen|min-h-screen|w-screen|min-w-screen|w-full|h-full|mx-auto|inset-\d+|z-\d+|items-[a-z-]+|justify-[a-z-]+|content-[a-z-]+|self-[a-z-]+|place-[a-z-]+|gap(?:-[xy])?-\d+|space-[xy]-\d+|p[trblxyse]?-\d+(?:\.\d+)?|m[trblxyse]?-(?:\d+(?:\.\d+)?|auto)|size-\d+|w-\d+(?:\/\d+)?|h-\d+(?:\/\d+)?|min-w-\d+|min-h-\d+|max-w-[a-z0-9]+|max-h-\d+|rounded(?:-[a-z0-9]+)?|border(?:-[a-z0-9]+)?|bg-[a-z]+(?:-\d{2,3})?|text-(?:[a-z]+-\d{2,3}|xs|sm|base|lg|\d?xl|left|center|right|start|end|white|black)|font-[a-z0-9]+|leading-[a-z0-9]+|tracking-[a-z0-9]+|shadow(?:-[a-z0-9]+)?|overflow-[a-z-]+|animate-[a-z0-9-]+|backdrop-[a-z0-9-]+|opacity-\d+|transition(?:-[a-z]+)?|duration-\d+|ease-[a-z-]+|cursor-[a-z-]+|select-[a-z]+|truncate|uppercase|lowercase|capitalize)$/;
/** Arbitrary values: `min-h-[44px]`, `bg-[#fff]`. */
const ARBITRARY = /^[a-z]+(?:-[a-z]+)*-\[[^\]]+\]$/;

/** The utility a class token names, after variant prefixes (`md:`, `hover:`) and `!` or `-` are removed. */
function utilityIn(classes: string): string | undefined {
  for (const token of classes.split(/\s+/)) {
    if (!token) continue;
    const bare = token.replace(/^(?:[^:[\]]+:|\[[^\]]*\]:)+/, '').replace(/^[!-]+/, '');
    if (UTILITY.test(bare) || ARBITRARY.test(bare)) return token;
  }
  return undefined;
}

function checkPackageJson(file: SourceFile): Finding[] {
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(file.content) as Record<string, unknown>;
  } catch {
    return [];
  }
  const out: Finding[] = [];
  const at = locator(file.content);
  for (const field of DEP_FIELDS) {
    const deps = pkg[field];
    if (!deps || typeof deps !== 'object') continue;
    for (const name of Object.keys(deps)) {
      if (!BANNED_PACKAGES.some((re) => re.test(name))) continue;
      const pos = at(Math.max(0, file.content.indexOf(`"${name}"`)));
      out.push({ ruleId: NO_TAILWIND, file: file.path, line: pos.line, column: pos.column, message: `${field} has ${name}. No Tailwind inside the system.` });
    }
  }
  return out;
}

function checkCss(file: SourceFile): Finding[] {
  const src = stripCssComments(file.content);
  const at = locator(src);
  const out: Finding[] = [];
  for (const m of src.matchAll(/@(tailwind|apply)\b|@import\s+(?:url\()?\s*["']tailwindcss[^"']*["']/g)) {
    const pos = at(m.index ?? 0);
    out.push({ ruleId: NO_TAILWIND, file: file.path, line: pos.line, column: pos.column, message: `${m[0]} is a Tailwind directive. Use tokens and plain CSS.` });
  }
  return out;
}

const EQUALITY = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);

function checkSource(file: SourceFile): Finding[] {
  const ext = extname(file.path);
  const native = isNativeSource(file.path);
  const out: Finding[] = [];
  const at = locator(file.content);
  const hit = (index: number, message: string) => {
    const pos = at(index);
    out.push({ ruleId: NO_TAILWIND, file: file.path, line: pos.line, column: pos.column, message });
  };
  const source = ext === '.html' ? undefined : parseTs(file.path, file.content);
  if (source) {
    walk(source, (node) => {
      if (!ts.isJsxAttribute(node)) return;
      const name = propName(node.name);
      if (name !== 'className' && name !== 'class') return;
      if (native) {
        hit(node.getStart(source), 'className in React Native source is NativeWind. Use a create<Name>Styles function.');
        return;
      }
      if (!node.initializer) return;
      walk(node.initializer, (n) => {
        let text: string | undefined;
        if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) text = n.text;
        else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) text = n.text;
        if (text === undefined) return;
        if (ts.isBinaryExpression(n.parent) && EQUALITY.has(n.parent.operatorToken.kind)) return;
        const utility = utilityIn(text);
        if (utility) hit(n.getStart(source), `${name} has the utility class "${utility}". Style through data attributes and tokens.`);
      });
    });
  }
  for (const t of templatesOf(file.path, file.content, source)) {
    for (const tag of readTags(t.text)) {
      for (const a of tag.attrs) {
        const bound = boundName(a.name);
        if (!['class', 'classname', 'ngclass'].includes(bound) || a.value === undefined) continue;
        const isBinding = a.name.startsWith('[') || a.name.startsWith('bind-');
        const texts = isBinding ? [...a.value.matchAll(/(["'])([^"']*)\1/g)].map((m) => m[2] ?? '') : [a.value];
        for (const text of texts) {
          const utility = utilityIn(text);
          if (utility) hit(t.offset + a.index, `${a.name} has the utility class "${utility}". Style through data attributes and tokens.`);
        }
      }
    }
  }
  return out;
}

export function noTailwind(file: SourceFile): Finding[] {
  if (file.path.endsWith('package.json')) return checkPackageJson(file);
  const ext = extname(file.path);
  if (ext === '.css') return checkCss(file);
  if (['.tsx', '.ts', '.html'].includes(ext)) return checkSource(file);
  return [];
}

export const noTailwindRule: Rule = {
  id: NO_TAILWIND,
  description: 'No Tailwind dependency, directive or utility class soup in the system.',
  appliesTo: (path) => /^packages\/(.+\/)?package\.json$/.test(path) || isSystemCss(path) || isFrameworkSource(path),
  check: noTailwind,
};
