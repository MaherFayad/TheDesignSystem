import { describe, expect, it } from 'vitest';
import { titleInputHosts } from '../angular-inputs';
import { createNoNativeTitle, createNoNativeTitleRule, noNativeTitle } from '../rules/no-native-title';
import { fixture, format, lines, readText, repoFiles, runRule } from './harness';

const angularSources = repoFiles()
  .filter((p) => p.startsWith('packages/angular/src/'))
  .map((path) => ({ path, content: readText(path) ?? '' }));
const titleHosts = titleInputHosts(angularSources);

describe('gate ds/no-native-title: hints go through Tooltip', () => {
  it('finds the Angular directives with a title input', () => {
    expect(titleHosts.has('dsDialogContent')).toBe(true);
    expect(titleHosts.has('dsButton')).toBe(false);
  });

  it('finds no native title in TSX, HTML or Angular templates (strict: only real title inputs pass)', () => {
    expect(format(runRule(createNoNativeTitleRule(titleHosts))), 'use the Tooltip component').toEqual([]);
  });

  it('strict form: [title] passes only on a directive that declares a title input', () => {
    const check = createNoNativeTitle(new Set(['dsDialogContent']));
    const file = { path: 'sample.html', content: '<div dsDialogContent [title]="t"></div>\n<button dsButton [title]="t">x</button>\n<div [dsDialogContent]="d" title="x"></div>' };
    expect(lines(check(file))).toEqual([2]);
  });

  it('fails on the TSX fixture, and passes component props, svg <title> and iframe', () => {
    expect(lines(noNativeTitle(fixture('no-native-title/bad.tsx')))).toEqual([4, 5, 6, 7]);
  });

  it('fails on the HTML template fixture', () => {
    expect(lines(noNativeTitle(fixture('no-native-title/bad.html')))).toEqual([3, 4, 5]);
  });

  it('fails on the Angular component fixture (host binding and inline template)', () => {
    expect(lines(noNativeTitle(fixture('no-native-title/bad-angular.ts')))).toEqual([5, 9]);
  });

  it('passes title and [title] on a ds directive host, and fails them on a plain element or as [attr.title]', () => {
    expect(lines(noNativeTitle(fixture('no-native-title/directive.html')))).toEqual([6, 7, 8]);
  });

  it('passes [title] on a directive host inside an Angular inline template', () => {
    const content = "@Component({ selector: 'x-demo', template: `<div dsDialogContent [title]=\"t\"></div>` })\nexport class Demo {}";
    expect(noNativeTitle({ path: 'packages/angular/src/components/dialog/dialog.demo.ts', content })).toEqual([]);
  });
});
