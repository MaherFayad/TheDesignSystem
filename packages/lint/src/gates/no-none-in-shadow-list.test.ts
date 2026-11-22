import { describe, expect, it } from 'vitest';
import { parseCss } from '../css';
import { listMembers, noneInShadowList } from '../rules/no-none-in-shadow-list';
import { isComponentBaseCss, isComponentCss } from '../scopes';
import { fixture, format, lines, readText, repoFiles } from './harness';

// Reported on 2026-11-22 (reset round 2, lane F3): `--_button-shadow: none`
// in a style or platform file turned `box-shadow: var(--_button-shadow),
// var(--_button-ring)` invalid and the focus ring vanished. Button now draws
// its ring alone; this gate keeps every other list safe.
describe('gate ds/no-none-in-shadow-list: no private property in a shadow list is set to none', () => {
  const sheets = repoFiles()
    .filter(isComponentBaseCss)
    .map((path) => ({ path, sheet: parseCss(readText(path) ?? '') }));
  const members = listMembers(sheets);

  it('finds the list members in the component CSS', () => {
    expect(members.size).toBeGreaterThan(0);
  });

  it('no style pack, platform file or component sets a list member to none', () => {
    const found = repoFiles()
      .filter(isComponentCss)
      .flatMap((path) => noneInShadowList({ path, content: readText(path) ?? '' }, members));
    expect(format(found), 'write 0 0 transparent for no shadow, or draw the item outside the list').toEqual([]);
  });

  it('fails on the fixture', () => {
    const own = listMembers([{ path: 'component.css', sheet: parseCss(fixture('no-none-in-shadow-list/component.css').content) }]);
    expect([...own.keys()].sort()).toEqual(['--_thing-blur', '--_thing-edge', '--_thing-ring', '--_thing-shadow']);
    expect(lines(noneInShadowList(fixture('no-none-in-shadow-list/bad.css'), own))).toEqual([2, 3, 4]);
  });
});
