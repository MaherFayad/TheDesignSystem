// The lint rules and their types. Written by hand (not generated): the gates
// in src/gates and `ds doctor` both import from here.
export type { AllowEntry, Finding, Rule, RuleCheck, SourceFile } from './types';
export { applyAllowlist, staleAllowEntries } from './util';
export { parseCss } from './css';
export type { CssDeclaration, CssSheet } from './css';
export * from './scopes';
export * from './allowlist';

export * from './rules/animate-transform-opacity-only';
export * from './rules/button-primitive';
export * from './rules/logical-properties';
export * from './rules/native-no-style-literals';
export * from './rules/no-dash';
export * from './rules/no-important';
export * from './rules/no-native-title';
export * from './rules/no-raw-color';
export * from './rules/no-raw-value';
export * from './rules/no-tailwind';
export * from './rules/token-vocabulary';

import { animateTransformOpacityOnlyRule } from './rules/animate-transform-opacity-only';
import { buttonPrimitiveRule } from './rules/button-primitive';
import { logicalPropertiesRule } from './rules/logical-properties';
import { nativeNoStyleLiteralsRule } from './rules/native-no-style-literals';
import { noDashRule } from './rules/no-dash';
import { noImportantRule } from './rules/no-important';
import { noNativeTitleRule } from './rules/no-native-title';
import { noRawColorRule } from './rules/no-raw-color';
import { noRawValueRule } from './rules/no-raw-value';
import { noTailwindRule } from './rules/no-tailwind';
import type { Rule } from './types';

/**
 * Every rule that needs nothing but the file. `ds/token-vocabulary` needs the
 * token build: make it with `createTokenVocabularyRule(names)`.
 */
export const rules: readonly Rule[] = [
  noRawColorRule,
  noRawValueRule,
  logicalPropertiesRule,
  noDashRule,
  noNativeTitleRule,
  noTailwindRule,
  buttonPrimitiveRule,
  nativeNoStyleLiteralsRule,
  animateTransformOpacityOnlyRule,
  noImportantRule,
];
