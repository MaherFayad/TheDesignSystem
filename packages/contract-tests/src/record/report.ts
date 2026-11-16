// The pages of a pack: index.html (the clips in a grid at real speed, each
// beside its source clip where a pair exists), index.md (the same as a list
// with the contact sheets, for a reader without video), the sign sheet with
// one line per clip, and the device script for the owner's phone.
import { existsSync, readFileSync } from 'node:fs';
import { platformLabel, titleCase } from './compose';
import { frameName } from './pack';
import type { ClipResult, PackFile, PackResult } from './types';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kb = (n: number): string => `${Math.round(n / 1024)} KB`;

export function clipTitle(c: ClipResult): string {
  return `${c.name}, ${titleCase(c.style)} ${c.scheme}, ${platformLabel(c.platform, c.detected)}, ${c.deviceName}`;
}

/** One sentence on when the screen first answered the finger. */
export function answerLine(c: ClipResult): string {
  if (!c.firstChange) return 'The screen did not change after the finger landed.';
  return c.firstChange.whileDown ? `The screen first changes ${c.firstChange.afterDownMs}ms after the finger lands, while it is still down.` : `The screen first changes ${c.firstChange.afterDownMs}ms after the finger lands, after it lifted.`;
}

function videoTag(src: string, scale: number): string {
  // Width at 1x: the clip is drawn at `scale` pixels per CSS px, so half its pixels on a 2x clip.
  return `<video src="${esc(src)}" muted loop playsinline autoplay controls preload="metadata" data-scale="${scale}"></video>`;
}

export function indexHtml(pack: PackResult, scale: number): string {
  const cards = pack.clips
    .map((c) => {
      const ours = c.video ? videoTag(c.video, scale) : `<p class="none">${esc(c.cannot ?? c.error ?? 'Not recorded.')}</p>`;
      const src = c.source
        ? c.source.video
          ? `<div class="side"><h3>Source</h3>${videoTag(c.source.video, scale)}<p>${esc(c.source.note)}</p></div>`
          : `<div class="side"><h3>Source</h3><p class="none">${esc(c.source.note)}</p></div>`
        : '';
      return `<section class="card" id="${esc(c.key)}"><h2>${esc(clipTitle(c))}</h2><p>${esc(c.does)}</p>
<div class="pair"><div class="side">${c.source ? '<h3>Ours</h3>' : ''}${ours}<p class="meta">${esc(c.video ? `${answerLine(c)} ${(c.durationMs / 1000).toFixed(2)}s, ${c.frames} frames, ${kb(c.bytes.video)}.` : '')}${c.sheet ? ` <a href="${esc(c.sheet)}">Contact sheet</a>` : ''}</p></div>${src}</div></section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Recording pack ${esc(pack.order)}</title>
<style>
:root{color-scheme:light dark;--bg:#f6f7f9;--fg:#15171a;--muted:#5a606b;--card:#fff;--line:#d9dce1}
@media (prefers-color-scheme: dark){:root{--bg:#111315;--fg:#eceef1;--muted:#a3a9b3;--card:#1b1e22;--line:#30343a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.45 system-ui,sans-serif;padding:16px}
h1{font-size:22px;margin:0 0 4px}
.lead{color:var(--muted);max-inline-size:70ch}
.grid{display:flex;flex-wrap:wrap;gap:16px;margin-block-start:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;max-inline-size:100%}
.card h2{font-size:16px;margin:0}
.card p{margin:4px 0;color:var(--muted);font-size:14px;max-inline-size:60ch}
.pair{display:flex;flex-wrap:wrap;gap:12px;margin-block-start:8px}
.side h3{font-size:14px;margin:0 0 4px}
video{display:block;max-inline-size:100%;block-size:auto;background:#000;border-radius:8px}
.none{font-style:italic}
.exact .card{overflow-x:auto}
.exact video{max-inline-size:none}
label{display:inline-flex;gap:8px;align-items:center;min-block-size:44px;font-size:15px}
</style></head><body>
<h1>Recording pack ${esc(pack.order)}: ${esc(pack.title)}</h1>
<p class="lead">Every clip plays at real speed: each frame is one 60th of a second of the page's own time, drawn at 1x with no zoom. The caption above each phone names the style, the platform and what the finger does; a pink point shows where the finger is down, and a dashed ring where it lifted. ${esc(pack.note ?? '')}</p>
<label><input type="checkbox" id="exact"> Show every clip at exact 1x (on a phone narrower than the frame, the clip then scrolls sideways; unticked, it shrinks to fit)</label>
<p class="lead">Recorded ${esc(pack.date.slice(0, 16).replace('T', ' '))} UTC at commit ${esc(pack.commit)}. Sign sheet: <code>docs/reports/reset/signoff/${esc(pack.order)}.md</code>.</p>
<div class="grid">
${cards}
</div>
<script>
// Real speed, and 1x: a clip drawn at 2 pixels per CSS px is shown at half its pixel width.
for (const v of document.querySelectorAll('video')) {
  v.playbackRate = 1;
  v.defaultPlaybackRate = 1;
  v.addEventListener('loadedmetadata', () => { v.style.inlineSize = (v.videoWidth / Number(v.dataset.scale || 1)) + 'px'; });
}
document.getElementById('exact').addEventListener('change', (e) => document.body.classList.toggle('exact', e.target.checked));
</script>
</body></html>
`;
}

export function indexMarkdown(pack: PackResult): string {
  const lines = [
    `# Recording pack ${pack.order}: ${pack.title}`,
    '',
    `Recorded ${pack.date.slice(0, 16).replace('T', ' ')} UTC at commit ${pack.commit}, Chromium ${pack.chromium}, load average ${pack.load.map((l) => l.toFixed(1)).join(' ')} on ${pack.cpus} cores (the load does not change the clips: they are drawn on the page's own clock).`,
    '',
    'Open `index.html` to watch the clips in a grid at real speed. Each clip below has its contact sheet: finger down, mid press or mid drag, finger lifted, settled.',
    '',
  ];
  if (pack.note) lines.push(pack.note, '');
  for (const c of pack.clips) {
    lines.push(`## ${clipTitle(c)}`, '', c.does + '.', '');
    if (c.video) {
      lines.push(`- Clip: [${c.video}](${c.video}) (${(c.durationMs / 1000).toFixed(2)}s, ${c.frames} frames at 60 a second, ${kb(c.bytes.video)})`);
      lines.push(`- ${answerLine(c)}`);
    } else lines.push(`- Not recorded: ${c.cannot ?? c.error ?? 'unknown reason'}`);
    if (c.source) lines.push(`- Source: ${c.source.video ? `[${c.source.video}](${c.source.video}). ` : ''}${c.source.note}`);
    else lines.push('- Source: none. No compare pair covers this style and interaction.');
    if (c.sheet) lines.push('', `![Contact sheet: ${clipTitle(c)}](${c.sheet})`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

/** The answers already in a sign sheet, by clip key, so a rerun keeps what the lead wrote. */
export function readAnswers(path: string): Map<string, { answer: string; date: string }> {
  const out = new Map<string, { answer: string; date: string }>();
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const cells = line.split('|').map((s) => s.trim());
    // | n | key | clip | ... | answer | date |
    if (cells.length < 6) continue;
    const key = cells[2]?.replace(/`/g, '');
    if (!key || !/^[a-z0-9-]*[a-z][a-z0-9-]*$/.test(key)) continue;
    out.set(key, { answer: cells[cells.length - 3] ?? '', date: cells[cells.length - 2] ?? '' });
  }
  return out;
}

export function signSheet(pack: PackResult, file: PackFile, previous: Map<string, { answer: string; date: string }>, formatQuestion: string | null): string {
  const rows = pack.clips.map((c, i) => {
    const prev = previous.get(c.key);
    const what = c.video ? `[clip](../${pack.order}/record/${c.video}), [sheet](../${pack.order}/record/${c.sheet ?? ''})` : `not recorded: ${c.cannot ?? c.error ?? ''}`;
    return `| ${i + 1} | \`${c.key}\` | ${c.name} | ${titleCase(c.style)}, ${c.scheme} | ${platformLabel(c.platform, c.detected)}, ${c.deviceName} | ${what} | ${prev?.answer ?? ''} | ${prev?.date ?? ''} |`;
  });
  const lines = [
    `# Sign sheet ${pack.order}: ${pack.title}`,
    '',
    'One line per clip. The owner watches each clip at real speed (the index:',
    `\`docs/reports/reset/${pack.order}/record/index.html\`) and answers per clip: "signed", or what is wrong.`,
    'The lead writes the answer and the date here; the owner does not edit the repo.',
    'Until a clip is signed, its order is "built, waiting on the owner".',
    '',
  ];
  if (formatQuestion) {
    const prev = previous.get('pack-format');
    lines.push('## The format (asked once, on this sample pack)', '', formatQuestion, '', '| Item | Key | Question | Answer | Date |', '| --- | --- | --- | --- | --- |', `| 0 | \`pack-format\` | Approve this pack format for every later order | ${prev?.answer ?? ''} | ${prev?.date ?? ''} |`, '');
  }
  lines.push('## Clips', '', '| # | Key | Interaction | Style | Platform and frame | Files | Owner\'s answer | Date |', '| --- | --- | --- | --- | --- | --- | --- | --- |', ...rows, '');
  if (file.device?.needed) lines.push('## Device check', '', `This order needs a recording on the owner's phone: ${file.device.why}. Steps: \`docs/reports/reset/${pack.order}/record/device-script.md\`. Until the owner sends it back this is a HUMAN GATE.`, '');
  return `${lines.join('\n')}\n`;
}

/** The device script of an order, from the template. */
export function deviceScript(template: string, pack: PackResult, file: PackFile, previewUrl: string): string {
  const steps = (file.device?.steps ?? []).map((s, i) => `${i + 1}. ${s}`).join('\n');
  const clips = pack.clips.map((c) => `- ${clipTitle(c)}: ${c.does}.`).join('\n');
  return template
    .replace(/\{\{order\}\}/g, pack.order)
    .replace(/\{\{title\}\}/g, pack.title)
    .replace(/\{\{preview\}\}/g, previewUrl)
    .replace(/\{\{why\}\}/g, file.device?.why ?? 'Press timing under a real finger, which headless Chromium cannot show.')
    .replace(/\{\{steps\}\}/g, steps || '1. Open each page below on the phone and do what its line says, once slowly and once at normal speed.')
    .replace(/\{\{clips\}\}/g, clips);
}

export { frameName };
