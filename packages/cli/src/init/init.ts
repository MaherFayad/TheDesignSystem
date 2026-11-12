// ds init: writes AGENTS.md and DESIGN.md for the app in the current folder.
//
// The text sits between two markers. A second run replaces only what is
// between them, so it changes nothing when nothing changed, and text the team
// wrote above or below the block stays. A file without the markers gets the
// block appended.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../manifests';
import { ok, type Result } from '../output';
import { styleIds } from '../commands/style';
import { detect, type Detected } from './detect';
import { agentsMd, designMd, type TemplateContext } from './templates';

/**
 * Where llms.txt is: the root of the docs site (order 1.15). The docs site
 * has no fixed host yet, so the path is given from the site root.
 */
export const LLMS_PATH = '/llms.txt';

export const START = '<!-- ds:init start. Written by `ds init`. A new run replaces the text up to the end marker. -->';
export const END = '<!-- ds:init end -->';

export interface InitOptions {
  cwd: string;
  /** Replace the whole file, not only the block. */
  force?: boolean;
}

export interface InitData extends Detected {
  llms: string;
  files: { path: string; status: 'written' | 'unchanged' | 'updated' }[];
}

function block(body: string): string {
  return `${START}\n\n${body.trim()}\n\n${END}\n`;
}

/** The new file text, from the old one and the block. */
export function merge(old: string | null, body: string, force = false): string {
  const fresh = block(body);
  if (old === null || force) return fresh;
  const start = old.indexOf(START);
  const end = old.indexOf(END);
  if (start !== -1 && end > start) return old.slice(0, start) + fresh.trimEnd() + old.slice(end + END.length);
  return `${old.trimEnd()}\n\n${fresh}`;
}

export function init(o: InitOptions): Result<InitData> {
  const config = loadConfig();
  const detected = detect(o.cwd);
  const ctx: TemplateContext = { ...detected, name: config.name, bin: config.cliName, scope: config.scope, llms: LLMS_PATH, styles: styleIds() };
  const files: InitData['files'] = [];
  for (const [name, body] of [
    ['AGENTS.md', agentsMd(ctx)],
    ['DESIGN.md', designMd(ctx)],
  ] as const) {
    const file = join(o.cwd, name);
    const old = existsSync(file) ? readFileSync(file, 'utf8') : null;
    const next = merge(old, body, o.force);
    if (old === next) files.push({ path: name, status: 'unchanged' });
    else {
      writeFileSync(file, next);
      files.push({ path: name, status: old === null ? 'written' : 'updated' });
    }
  }
  const text = [
    `Framework: ${detected.framework} (from ${detected.evidence.join(', ')}). System source: ${detected.source}.`,
    ...files.map((f) => `  ${f.status.padEnd(9)} ${f.path}`),
    `llms.txt: ${LLMS_PATH} on the docs site root.`,
  ].join('\n');
  return ok('init.result', { ...detected, llms: LLMS_PATH, files }, `${text}\n`);
}
