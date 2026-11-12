// ds-qa review of order 1.22: one line per check from the <id>.measure.json
// files of the actions and inputs families. node qa-actions-inputs.summary.cjs [id ...]
const fs = require('fs');
const path = require('path');
const L = require('./qa-actions-inputs.lib.cjs');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(L.SPECS);
const out = {};
for (const id of ids) {
  const f = path.join(__dirname, `${id}.measure.json`);
  if (!fs.existsSync(f)) { console.log(id, 'missing'); continue; }
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  const runs = r.runs.filter((x) => !x.error);
  const errs = r.runs.filter((x) => x.error).map((x) => `${x.style}/${x.dir}/${x.motion}: ${x.error.slice(0, 80)}`);
  const full = (s, d = 'ltr') => runs.find((x) => x.style === s && x.dir === d && x.motion === 'full');
  const lines = [];
  lines.push(`## ${id} (${r.drive}, ${r.pattern})`);
  for (const s of ['studio', 'desk', 'neutral']) {
    const x = full(s);
    if (!x) continue;
    lines.push(`  ${s} full ltr: state ${x.state} stateAt ${x.stateAt} motion ${x.firstMotionAt} longest ${x.longest} movers ${x.movers} ev ${x.events}${x.text ? ' text ' + JSON.stringify(x.text) : ''}`);
    for (const a of x.anims) lines.push(`     ${a.at}ms ${a.target} ${a.kind} ${a.props} ${a.dur}${a.durTok ? '(' + a.durTok + ')' : ''}${a.delay ? ' d' + a.delay : ''} ${a.ease}${a.it ? ' it' + a.it : ''}${a.comp ? ' ' + a.comp : ''}${a.n ? ' x' + a.n : ''} ${JSON.stringify(a.kf).slice(0, 220)}`);
    const rtl = full(s, 'rtl');
    if (rtl) lines.push(`  ${s} full rtl: longest ${rtl.longest} movers ${rtl.movers} kf0 ${JSON.stringify((rtl.anims[0] || {}).kf || '').slice(0, 160)}`);
  }
  for (const x of runs.filter((y) => y.motion !== 'full')) {
    const mv = x.anims.filter((a) => a.dur > 0 || a.delay > 0);
    lines.push(`  ${x.style} ${x.dir} ${x.motion}: state ${x.state} longest ${x.longest} movers ${x.movers} ${mv.map((a) => `${a.target} ${a.props} ${a.dur}`).join('; ').slice(0, 200)}`);
  }
  const bad = runs.filter((x) => x.badProps.length).map((x) => `${x.style}/${x.dir}/${x.motion}: ${x.badProps}`);
  const hit = runs.filter((x) => x.hitFails).map((x) => `${x.style}/${x.dir}/${x.motion}: ${x.hitFails} ${JSON.stringify(x.hitSample)}`);
  const late = runs.filter((x) => x.firstMotionAt !== null && x.stateAt !== null && x.stateAt > x.firstMotionAt + 20).map((x) => `${x.style}/${x.dir}/${x.motion}: state ${x.stateAt} motion ${x.firstMotionAt}`);
  const live = runs.filter((x) => x.end.live.length).map((x) => `${x.style}/${x.dir}/${x.motion}: ${x.end.live}`);
  const inf = runs.filter((x) => x.infinite).map((x) => `${x.style}/${x.dir}/${x.motion}: ${x.infinite}`);
  lines.push(`  badProps: ${bad.join(' | ') || 'none'}`);
  lines.push(`  sweep: ${JSON.stringify(r.sweep)}`);
  lines.push(`  hit fails: ${hit.join(' | ') || 'none'}`);
  lines.push(`  state after motion (>20ms): ${late.join(' | ') || 'none'}`);
  lines.push(`  live after settle: ${live.join(' | ') || 'none'}; infinite: ${inf.join(' | ') || 'none'}`);
  if (r.held.length) lines.push(`  held: ${r.held.map((h) => `${h.style}/${h.dir}/${h.motion} ${h.held}${h.track ? ' track ' + h.track : ''}${h.neighbor ? ' nb ' + h.neighbor : ''}`).join(' | ')}`);
  lines.push(`  ring: ${Object.entries(r.ring).map(([s, v]) => `${s} fv=${v.focusVisible} atOnce=${v.atOnce} ${v.diffFirstFrame ? v.diffFirstFrame.join(',') : v.error}`).join(' | ')}`);
  lines.push(`  rapid: ${Object.entries(r.rapid).map(([s, v]) => `${s} same=${v.same}${v.same ? '' : ' fast=' + JSON.stringify(v.fast).slice(0, 300) + ' ref=' + JSON.stringify(v.ref).slice(0, 300)}`).join(' | ')}`);
  lines.push(`  interrupt: ${Object.entries(r.interrupt).map(([s, v]) => `${s} same=${v.same}${v.same ? '' : ' fast=' + JSON.stringify(v.fast).slice(0, 300) + ' ref=' + JSON.stringify(v.ref).slice(0, 300)}`).join(' | ')}`);
  lines.push(`  off: ${Object.entries(r.off).map(([s, v]) => `${s} movers=${v.movers} ${v.moving ? v.moving.join(';') : v.error} held=${v.held || ''}`).join(' | ')}`);
  if (Object.keys(r.extra).length) lines.push(`  extra: ${Object.entries(r.extra).map(([s, v]) => `${s} L=${v.longest} bad=${v.badProps} ${(v.anims || []).map((a) => `${a.target} ${a.props} ${a.dur}${a.delay ? '+' + a.delay : ''} ${a.ease} ${JSON.stringify(a.kf).slice(0, 120)}`).join('; ')}`).join(' || ')}`);
  if (errs.length) lines.push(`  errors: ${errs.join(' | ')}`);
  console.log(lines.join('\n'));
}
