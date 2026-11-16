// The platform axis in the docs site (docs/contracts/frameworks.md,
// "Platform axis"). The site is static, so the built HTML says `web` and the
// head script resolves the URL key, the stored choice and the device before
// the first paint.
//
// The head script runs the shared resolver itself: the source of
// packages/shared/src/platform.ts is read at build time, its types are
// stripped, and it is wrapped in a function. There is no second resolver in
// the docs.
import ts from 'typescript';
import source from '../../../../packages/shared/src/platform.ts?raw';
import { pageText, type Lang } from './i18n.ts';

/** The values the switcher offers: `auto` first, then the four platforms. */
export const platformValues = ['auto', 'web', 'ios', 'android', 'macos'] as const;
export type PlatformValue = (typeof platformValues)[number];

/** The four values `data-platform` may hold, in the order of the menu. */
export const platformIds = ['web', 'ios', 'android', 'macos'] as const;

const names: Record<(typeof platformIds)[number], string> = { web: 'Web', ios: 'iOS', android: 'Android', macos: 'macOS' };

/** The label of a platform value. `auto` gets a detail per detected platform. */
export function platformLabel(lang: Lang, value: string): string {
  return pageText[lang].axisValues[value] ?? names[value as keyof typeof names] ?? value;
}

/**
 * The menu items of a platform switcher. The `auto` item carries one detail
 * per platform the device can resolve to; CSS shows the one the head script
 * stamped as `data-platform-detected`, so the item reads "Auto: iOS".
 */
export function platformItems(lang: Lang) {
  return platformValues.map((v) => ({
    value: v,
    label: platformLabel(lang, v),
    lang: v !== 'auto' && v !== 'web' && lang === 'ar' ? 'en' : undefined,
    details: v === 'auto' ? platformIds.filter((p) => p !== 'macos').map((p) => ({ value: p, label: platformLabel(lang, p), lang: lang === 'ar' && p !== 'web' ? 'en' : undefined })) : undefined,
  }));
}

/**
 * The shared resolver as a script expression: an object with the exports of
 * packages/shared/src/platform.ts. Type only imports go away in the
 * transpile; the module has no other import.
 */
function resolverExpression(): string {
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, removeComments: true } }).outputText;
  if (/^\s*import\s|\brequire\(/m.test(js)) throw new Error('packages/shared/src/platform.ts gained a runtime import; the docs head script cannot inline it.');
  const exported = [...js.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
  const needed = ['PLATFORM_QUERY_KEY', 'PLATFORM_STORAGE_KEY', 'deviceOf', 'detectPlatform', 'platformChoice', 'resolvePlatform'];
  for (const name of needed) if (!exported.includes(name)) throw new Error(`packages/shared/src/platform.ts no longer exports ${name}.`);
  const body = js.replace(/^export \{\s*\};?\s*$/gm, '').replace(/^export /gm, '');
  return `(() => {\n${body}\nreturn { ${exported.join(', ')} };\n})()`;
}

/**
 * The platform part of the head script. It sets on <html>:
 *
 * - `data-platform`: the resolved value (URL key, stored choice, device, web);
 * - `data-platform-detected`: what the device resolves to (`auto`);
 * - `data-platform-choice`: what the switcher shows checked: the URL key, the
 *   stored choice, or `auto`;
 * - `data-platform-source`: `url`, `stored` or `device`.
 *
 * It also leaves the resolver on `window.dsPlatform` for public/docs.js,
 * which resolves again when the person picks a platform. `get` is the head
 * script's guarded localStorage read.
 */
export const platformHeadScript = `const P = ${resolverExpression()};
  const pq = P.platformChoice(new URLSearchParams(location.search).get(P.PLATFORM_QUERY_KEY));
  const ps = P.platformChoice(get(P.PLATFORM_STORAGE_KEY));
  const pd = P.detectPlatform(P.deviceOf(navigator));
  r.dataset.platform = P.resolvePlatform({ query: pq, stored: ps, device: pd });
  r.dataset.platformDetected = pd;
  r.dataset.platformChoice = pq || ps || 'auto';
  r.dataset.platformSource = pq ? 'url' : ps ? 'stored' : 'device';
  window.dsPlatform = P;`;

/** CSS that shows the current value of every platform switcher, from the attributes above. */
export const platformCss = [
  platformValues.map((v) => `:root[data-platform-choice='${v}'] [data-setting='platform'] .mv>[data-v='${v}']`).join(',') + '{visibility:visible}',
  // The detail of the auto item: the detected platform, else plain "Auto" (no script).
  `[data-pd]{display:none}`,
  `:root:not([data-platform-detected]) [data-pd='none'],` + platformIds.map((p) => `:root[data-platform-detected='${p}'] [data-pd='${p}']`).join(',') + '{display:inline}',
].join('\n');
