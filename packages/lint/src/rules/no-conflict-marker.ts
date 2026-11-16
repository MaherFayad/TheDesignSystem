// ds/no-conflict-marker: no merge conflict marker in any text file. A line
// that starts with seven `<`, seven `=` or seven `>` characters is what git
// writes around a conflict. `npm run check` once passed with markers in
// `packages/css/src/components/Dialog.css` (wave-1-followups.md, round 3
// item 1), because the CSS reader skips what it cannot read.
//
// It reads every file the repo walk gives, the lock file and Markdown
// included: a conflict can land in any of them. Binary files are skipped by
// the walk. A Markdown heading underlined with seven `=` is also caught; use
// the `#` form instead.
import type { Finding, Rule, SourceFile } from '../types';

export const NO_CONFLICT_MARKER = 'ds/no-conflict-marker';

const MARKER = /^(<{7}|={7}|>{7})/gm;

const NAMES: Record<string, string> = {
  '<': 'conflict start (ours)',
  '=': 'conflict divider',
  '>': 'conflict end (theirs)',
};

export function noConflictMarker(file: SourceFile): Finding[] {
  const out: Finding[] = [];
  let line = 1;
  let from = 0;
  for (const m of file.content.matchAll(MARKER)) {
    const index = m.index ?? 0;
    for (let i = from; i < index; i++) if (file.content.charCodeAt(i) === 10) line++;
    from = index;
    const end = file.content.indexOf('\n', index);
    const text = file.content.slice(index, end === -1 ? undefined : end).trim().slice(0, 60);
    out.push({
      ruleId: NO_CONFLICT_MARKER,
      file: file.path,
      line,
      column: 1,
      message: `${NAMES[text[0] ?? '<'] ?? 'conflict marker'}: "${text}". Resolve the merge and remove the marker lines.`,
    });
  }
  return out;
}

/** Extensions that are never text, skipped without reading them. Any other binary file is skipped by the walk. */
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|webm|mp4|mov|woff2?|ttf|otf|eot|pdf|zip|gz|tgz)$/i;

export const noConflictMarkerRule: Rule = {
  id: NO_CONFLICT_MARKER,
  description: 'No line that starts with seven <, = or > characters (a merge conflict marker) in any text file.',
  appliesTo: (path) => !BINARY.test(path),
  check: noConflictMarker,
};
