// The outputs of one comparison: a Markdown table, a JSON result and the HTML
// of the sheet (source left, system right, the table under the crops), which
// run.ts renders to sheet.png in the same browser.
import type { PairFile, Row, Status } from './types';

export interface Result {
  pair: string;
  title: string;
  date: string;
  audit: PairFile['audit'];
  source: { repo: string; screen: string; how: string; reconstruction: boolean; url: string };
  system: { url: string };
  viewport: PairFile['viewport'];
  scheme: PairFile['scheme'];
  notes: string[];
  summary: Record<Status, number>;
  rows: Row[];
}

const cell = (v: string): string => v.replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function tableMarkdown(r: Result): string {
  const lines = [
    `# Compare ${r.pair}: ${r.title}`,
    '',
    `Run ${r.date}. Viewport ${r.viewport.width} by ${r.viewport.height}, ${r.scheme} scheme.`,
    `Audit: ${r.audit.file}, ${r.audit.shot}. ${r.audit.finding}`,
    '',
    `- Source (${r.source.repo}${r.source.reconstruction ? ', a reconstruction from source parts' : ''}): \`${r.source.screen}\`. ${r.source.how}`,
    `- System: \`${r.system.url}\``,
    ...r.notes.map((n) => `- ${n}`),
    '',
    `Result: ${r.summary.pass} pass, ${r.summary.fail} fail, ${r.summary.allowed} allowed.`,
    '',
    '| Region | Probe | Property | Source | System | Difference | Tolerance | Result |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...r.rows.map((row) => `| ${cell(row.region)} | ${cell(row.probe)} | ${cell(row.property)} | ${cell(row.source)} | ${cell(row.system)} | ${cell(row.difference)} | ${cell(row.tolerance)} | ${row.status}${row.note ? ` (${cell(row.note)})` : ''} |`),
    '',
  ];
  return lines.join('\n');
}

const esc = (v: string): string => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface Crop {
  region: string;
  source: string | null;
  system: string | null;
  sourceSize: string;
  systemSize: string;
  /** Widths in CSS px; crops of 400px or less are shown at twice their size. */
  sourceWidth: number;
  systemWidth: number;
}

/** The sheet: one row per region with the source crop on the left and the system crop on the right, then the table. */
export function sheetHtml(r: Result, crops: Crop[]): string {
  const img = (src: string | null, label: string, size: string, width: number) => {
    const zoom = width > 0 && width <= 400 ? 2 : 1;
    const style = zoom === 2 ? ` style="inline-size: ${Math.round(width * 2)}px"` : '';
    return `<figure><figcaption>${esc(label)} <span>${esc(size)}${zoom === 2 ? ', shown at 2x' : ''}</span></figcaption>${src ? `<img src="${src}" alt="${esc(label)}"${style}>` : '<p class="miss">Region not found</p>'}</figure>`;
  };
  const rows = r.rows
    .map(
      (row) =>
        `<tr class="${row.status}"><td>${esc(row.region)}</td><td>${esc(row.probe)}</td><td>${esc(row.source)}</td><td>${esc(row.system)}</td><td>${esc(row.difference)}</td><td>${esc(row.tolerance)}</td><td>${row.status}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
:root { color-scheme: light; }
body { margin: 0; padding: 24px; background: #8a8a8a; color: #111; font: 13px/1.4 system-ui, sans-serif; inline-size: max-content; max-inline-size: 1600px; }
h1 { font-size: 18px; margin: 0 0 4px; }
p { margin: 0 0 4px; }
section { display: grid; grid-template-columns: auto auto; gap: 16px; margin-block: 16px; align-items: start; }
h2 { grid-column: 1 / -1; font-size: 14px; margin: 0; }
figure { margin: 0; }
figcaption { font-weight: 600; margin-block-end: 4px; }
figcaption span { font-weight: 400; }
img { display: block; outline: 1px dashed #333; image-rendering: pixelated; }
.miss { padding: 24px; background: #fdd; }
table { border-collapse: collapse; margin-block-start: 16px; background: #f4f4f4; }
td, th { border: 1px solid #999; padding: 3px 6px; text-align: start; vertical-align: top; max-inline-size: 420px; word-break: break-word; }
tr.fail td { background: #f8d4d4; }
tr.allowed td { background: #fbefc4; }
tr.pass td { background: #d9f0d9; }
</style></head><body>
<h1>${esc(r.pair)}: ${esc(r.title)}</h1>
<p>Source left (${esc(r.source.repo)}${r.source.reconstruction ? ', reconstruction' : ''}, ${esc(r.source.screen)}), system right (${esc(r.system.url)}). ${r.viewport.width} by ${r.viewport.height}, ${esc(r.scheme)}.</p>
<p>${r.summary.pass} pass, ${r.summary.fail} fail, ${r.summary.allowed} allowed.</p>
${crops.map((c) => `<section><h2>Region ${esc(c.region)}</h2>${img(c.source, 'Source', c.sourceSize, c.sourceWidth)}${img(c.system, 'System', c.systemSize, c.systemWidth)}</section>`).join('')}
<table><thead><tr><th>Region</th><th>Probe</th><th>Source</th><th>System</th><th>Difference</th><th>Tolerance</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}
