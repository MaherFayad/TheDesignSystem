import { describe, expect, it } from 'vitest';
import { noConflictMarker, noConflictMarkerRule } from '../rules/no-conflict-marker';
import { filesFor, fixture, format, lines, plantedDialog, readText, runRule } from './harness';

const OURS = '<'.repeat(7);
const SPLIT = '='.repeat(7);
const THEIRS = '>'.repeat(7);

describe('gate ds/no-conflict-marker: no merge conflict marker in any text file', () => {
  it('reads every text file, the lock file, Markdown and CSS included, and skips images', () => {
    const files = filesFor(noConflictMarkerRule);
    expect(files).toEqual(expect.arrayContaining(['package-lock.json', 'PLAN.md', 'packages/css/src/components/Dialog.css', 'packages/lint/src/rules/no-conflict-marker.ts']));
    expect(files.some((f) => f.endsWith('.png'))).toBe(false);
    expect(files.some((f) => f.startsWith('packages/lint/fixtures/'))).toBe(false);
  });

  it('finds no conflict marker in the repo', () => {
    expect(format(runRule(noConflictMarkerRule)), 'resolve the merge').toEqual([]);
  }, 60_000);

  it('fails on the failing fixture', () => {
    expect(lines(noConflictMarker(fixture('no-conflict-marker/bad.css')))).toEqual([4, 6, 8]);
  });

  it('passes on the passing fixture: six of a kind, indented, or later in the line', () => {
    expect(noConflictMarker(fixture('no-conflict-marker/good.md'))).toEqual([]);
  });

  it('fails on a conflict planted in a copy of Dialog.css', () => {
    const planted = plantedDialog();
    expect(noConflictMarker({ path: planted.path, content: readText(planted.path) ?? '' })).toEqual([]);
    expect(lines(noConflictMarker(planted))).toEqual([planted.at, planted.at + 2, planted.at + 4]);
  });

  it('counts lines from the top of the file, CRLF included', () => {
    const found = noConflictMarker({ path: 'x.txt', content: `a\r\n${OURS} HEAD\r\nb\r\n${SPLIT}\r\nc\r\n${THEIRS} x\r\n` });
    expect(found.map((f) => f.line)).toEqual([2, 4, 6]);
  });
});
