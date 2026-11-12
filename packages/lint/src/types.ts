// Shared types for the lint rules. No test framework imports here: `ds doctor`
// reuses the rules in wave 1.

/** One file handed to a rule. `path` is repo relative with forward slashes. */
export interface SourceFile {
  path: string;
  content: string;
}

/** One problem a rule found. */
export interface Finding {
  ruleId: string;
  file: string;
  line: number;
  column?: number;
  message: string;
  /**
   * The key an allow list entry must name to let this finding through, for
   * example `packages/css/src/components/Button.css|[data-ds='button']|left`.
   * Rules without an allow list leave it out.
   */
  allowKey?: string;
}

/** A pure check over one file. */
export type RuleCheck = (file: SourceFile) => Finding[];

/** A rule with its id, a one line summary and the files it covers in this repo. */
export interface Rule {
  id: string;
  description: string;
  /** True when the rule covers this repo relative path. */
  appliesTo: (path: string) => boolean;
  check: RuleCheck;
}

/** An allow list entry: the exact `allowKey` it lets through and why. */
export interface AllowEntry {
  key: string;
  reason: string;
}
