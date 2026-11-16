// The Markdown a person reads after a perceive run: one table of numbers per
// run and the sentences for each interaction. No token names, only what a
// person would see.
import type { compareWithAudit } from './calibration';
import type { InteractionResult } from './types';

export interface RunInfo {
  date: string;
  style: string;
  platform: string;
  device: string;
  profile: string;
  scheme: string;
  load: number[];
  cpus: number;
  chromium: string;
  url: string;
  notes: string[];
}

const cell = (s: string) => s.replace(/\|/g, '/').replace(/\n/g, ' ');

export function runMarkdown(info: RunInfo, results: InteractionResult[]): string {
  const out: string[] = [];
  out.push(`# Perceive: ${info.style}, ${info.platform}, ${info.device}`);
  out.push('');
  out.push(`Profile ${info.profile}. ${info.scheme} scheme. Run ${info.date} in headless Chromium ${info.chromium}, real time (no slow motion), touch through CDP.`);
  out.push(`Load average at the start: ${info.load.map((l) => l.toFixed(2)).join(', ')} on ${info.cpus} cores.`);
  for (const n of info.notes) out.push(`${n}`);
  out.push('');
  out.push('| Interaction | Finger down | Latency | Headline | Moves | Scale | Main change | Fill share | Reacting | Cuts | Held 600ms | Verdict |');
  out.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of results) {
    if (!r.measured) {
      out.push(`| ${r.name} | | | | | | | | | | | error: ${cell(r.error ?? 'no measurement')} |`);
      continue;
    }
    const m = r.measured;
    const h = m.headline;
    const fails = r.checks.filter((c) => !c.pass).map((c) => c.id);
    out.push(
      `| ${r.name} | ${m.fingerMs === null ? '' : `${m.fingerMs}ms`} | ${m.latency === null ? 'none' : `${m.latency}ms${m.startsAtRelease ? ' (at release)' : ''}`} | ${cell(h?.part ?? h?.desc ?? 'not found')} | ${h ? `${Math.max(h.travel, h.ownTravel)}px` : ''} | ${h ? `${h.scaleMin} to ${h.scaleMax}` : ''} | ${m.mainMs === null ? 'none' : `${m.mainMs}ms`} | ${Math.round(m.fillShare * 100)}% | ${m.secondaries.length} | ${m.cuts.length} | ${r.hold ? (r.hold.onAfter === null ? 'not shown' : `${r.hold.shownMs}ms`) : ''} | ${r.pass ? 'pass' : `fail: ${fails.join(', ')}`}${r.call ? `; audit call ${r.call}` : ''} |`,
    );
  }
  out.push('');
  out.push('Latency is from `pointerdown` to the first frame that differs. Moves is the largest move of the headline centre from where it rests or ends. Main change is its first animation (duration plus delay), else the frames. Held 600ms is how long the press look showed while a finger stayed down for 600ms.');
  out.push('');
  for (const r of results) {
    out.push(`## ${r.name}: the finger ${r.does}`);
    out.push('');
    if (r.error) out.push(`Could not measure: ${r.error}`);
    for (const s of r.sentences) out.push(`- ${s}`);
    if (r.checks.length > 0) {
      out.push('');
      out.push('| Check | Measured | Limit | Result |');
      out.push('| --- | --- | --- | --- |');
      for (const c of r.checks) out.push(`| ${cell(c.label)} | ${cell(c.measured)} | ${cell(c.limit)} | ${c.pass ? 'pass' : 'fail'} |`);
    }
    if (r.call) out.push('', `Audit call: ${r.call} (${r.callWhy}).`);
    out.push('');
  }
  return `${out.join('\n')}\n`;
}

export function calibrationMarkdown(info: RunInfo, cal: ReturnType<typeof compareWithAudit>): string {
  const out: string[] = [];
  out.push('# Perceive calibration against the motion audit');
  out.push('');
  out.push(`Neutral, platform web, Pixel 7 profile, touch, run ${info.date}. Load average at the start: ${info.load.map((l) => l.toFixed(2)).join(', ')} on ${info.cpus} cores.`);
  out.push('');
  out.push(`Result: ${cal.pass ? 'pass' : 'fail'}. ${cal.counts.invisible} of 20 invisible (audit 9), ${cal.counts.wrong} wrong (audit 4), ${cal.counts.fine} fine (audit 7). ${cal.lines.filter((l) => l.pass).length} of ${cal.lines.length} numbers within 10 percent.`);
  out.push('');
  out.push('| Component | Number | Audit | Gate | Within 10 percent |');
  out.push('| --- | --- | --- | --- | --- |');
  for (const l of cal.lines) out.push(`| ${l.id} | ${l.what} | ${l.audit} | ${l.measured} | ${l.pass ? 'yes' : 'no'} |`);
  out.push('');
  out.push('| Component | Audit call | Gate call | Why (gate) |');
  out.push('| --- | --- | --- | --- |');
  for (const c of cal.calls) out.push(`| ${c.id} | ${c.audit} | ${c.gate} | ${cell(c.why)} |`);
  return `${out.join('\n')}\n`;
}
