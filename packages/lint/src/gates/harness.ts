// Repo walk and helpers for the gate tests. Not a test file itself, and free
// of test framework imports.
//
// The file list is `git ls-files` plus untracked files git does not ignore,
// so a new file is covered the moment it exists. Fixtures, dependencies and
// build output never enter it.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXCLUDED_PATHS, EXCLUDED_SEGMENTS } from '../allowlist';
import type { Finding, Rule, SourceFile } from '../types';

export const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

let cached: string[] | undefined;

/** Every file in the repo, repo relative with forward slashes, sorted. */
export function repoFiles(): string[] {
  if (cached) return cached;
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const segments = new Set(EXCLUDED_SEGMENTS.map((s) => s.segment));
  cached = [...new Set(out.split('\0').filter(Boolean))]
    .filter((p) => !EXCLUDED_PATHS.some((e) => p.startsWith(e.prefix)))
    .filter((p) => !p.split('/').some((s) => segments.has(s)))
    .filter((p) => existsSync(join(ROOT, p)))
    .sort();
  return cached;
}

const texts = new Map<string, string | undefined>();

/** The file as UTF-8 text, or undefined when it holds a NUL byte (binary). */
export function readText(path: string): string | undefined {
  if (texts.has(path)) return texts.get(path);
  const buf = readFileSync(join(ROOT, path));
  const text = buf.includes(0) ? undefined : buf.toString('utf8');
  texts.set(path, text);
  return text;
}

/** The files a rule covers. */
export function filesFor(rule: Pick<Rule, 'appliesTo'>): string[] {
  return repoFiles().filter((p) => rule.appliesTo(p));
}

/** Runs a rule over every file it covers. */
export function runRule(rule: Rule): Finding[] {
  const out: Finding[] = [];
  for (const path of filesFor(rule)) {
    const content = readText(path);
    if (content !== undefined) out.push(...rule.check({ path, content }));
  }
  return out;
}

/** A fixture file under packages/lint/fixtures. */
export function fixture(name: string): SourceFile {
  const path = `packages/lint/fixtures/${name}`;
  return { path, content: readFileSync(join(ROOT, path), 'utf8') };
}

/** One line per finding: `file:line:column rule message`. */
export function format(findings: Finding[]): string[] {
  return findings.map((f) => `${f.file}:${f.line}${f.column ? `:${f.column}` : ''} ${f.ruleId} ${f.message}`);
}

/** The line numbers of the findings, for fixture assertions. */
export function lines(findings: Finding[]): number[] {
  return findings.map((f) => f.line);
}
