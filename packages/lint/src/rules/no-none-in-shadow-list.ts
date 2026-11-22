// ds/no-none-in-shadow-list: a private property that the component CSS reads
// as one whole item of a list (`box-shadow: var(--_x-shadow), var(--_x-ring)`)
// is never set to `none` or to a CSS wide keyword. `none` is valid alone but
// not inside a list, so `none, <ring>` is invalid at computed value time and
// the browser drops the whole declaration, focus ring included (WCAG 2.4.7).
// Use `0 0 transparent` for "no shadow" instead.
//
// The rule has two steps. `listMembers` reads the component CSS
// (`packages/css/src/components`) and collects every private property used as
// a whole item of a comma list (box-shadow, text-shadow) or a space list
// (filter, backdrop-filter) with more than one item. A property whose value
// is only `var(--_y)` passes the membership on to `--_y`. Then
// `noneInShadowList` reads one file (component CSS, platform CSS or a recipe)
// and reports each member set to `none`.
import { parseCss } from '../css';
import type { CssSheet } from '../css';
import type { Finding, SourceFile } from '../types';

export const NO_NONE_IN_SHADOW_LIST = 'ds/no-none-in-shadow-list';

const COMMA_LISTS = new Set(['box-shadow', 'text-shadow']);
const SPACE_LISTS = new Set(['filter', 'backdrop-filter', '-webkit-backdrop-filter']);
const WHOLE_VAR = /^var\(\s*(--_[a-z0-9-]+)\s*(?:,[\s\S]*)?\)$/i;
const ONLY_VAR = /^var\(\s*(--_[a-z0-9-]+)\s*\)$/i;
const BAD_VALUE = /^(none|initial|unset)$/i;

/** Splits a value at top level separators: commas, or runs of white space. */
export function splitTopLevel(value: string, by: 'comma' | 'space'): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    const cut = depth === 0 && (by === 'comma' ? ch === ',' : /\s/.test(ch));
    if (cut) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Where a private property is read as a whole list item, for the message. */
export interface ListUse {
  file: string;
  line: number;
  property: string;
}

/** Every private property read as one whole item of a list of two or more, with one place it is read. */
export function listMembers(sheets: readonly { path: string; sheet: CssSheet }[]): Map<string, ListUse> {
  const members = new Map<string, ListUse>();
  const aliases: { from: string; to: string }[] = [];
  for (const { path, sheet } of sheets) {
    for (const d of sheet.declarations) {
      const alias = ONLY_VAR.exec(d.value.trim());
      if (d.property.startsWith('--_') && alias?.[1]) aliases.push({ from: d.property, to: alias[1] });
      const by = COMMA_LISTS.has(d.property) ? 'comma' : SPACE_LISTS.has(d.property) ? 'space' : undefined;
      if (!by) continue;
      const items = splitTopLevel(d.value, by);
      if (items.length < 2) continue;
      for (const item of items) {
        const name = WHOLE_VAR.exec(item)?.[1];
        if (name && !members.has(name)) members.set(name, { file: path, line: d.line, property: d.property });
      }
    }
  }
  let grew = true;
  while (grew) {
    grew = false;
    for (const { from, to } of aliases) {
      const use = members.get(from);
      if (use && !members.has(to)) {
        members.set(to, use);
        grew = true;
      }
    }
  }
  return members;
}

/** Each declaration in the file that sets a list member to `none`, `initial` or `unset`. */
export function noneInShadowList(file: SourceFile, members: ReadonlyMap<string, ListUse>): Finding[] {
  const out: Finding[] = [];
  for (const d of parseCss(file.content).declarations) {
    const use = members.get(d.property);
    if (!use || !BAD_VALUE.test(d.value.trim())) continue;
    out.push({
      ruleId: NO_NONE_IN_SHADOW_LIST,
      file: file.path,
      line: d.line,
      column: d.column,
      message: `${d.property}: ${d.value} sits in a ${use.property} list (${use.file}:${use.line}), so the whole declaration drops. Write 0 0 transparent for no shadow.`,
      allowKey: `${file.path}|${d.selector}|${d.property}`,
    });
  }
  return out;
}
