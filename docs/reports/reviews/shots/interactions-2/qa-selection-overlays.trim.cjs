// ds-qa review of order 1.22: folds the raw runs and checks of one id into
// <id>.measure.json next to this script, with eases named by their token,
// and prints a compact digest.
//   node qa-selection-overlays.trim.cjs <rawDir> <checksDir> [ids...]
const fs = require('fs');
const path = require('path');
const L = require('./qa-selection-overlays.lib.cjs');

const root = path.resolve(__dirname, '../../../../..');
const eases = [];
// A linear() ease: compare the first four output values of its stops (the raw text was cut at 48 characters).
const sig = (e) => { const t = e.replace(/\s+/g, ' ').trim(); if (!t.startsWith('linear(')) return null; return t.slice(7).replace(/\)$/, '').split(',').map((p) => parseFloat(p.trim().split(' ')[0])).slice(0, 4).map((v) => v.toFixed(2)).join(','); };
for (const s of ['studio', 'desk', 'neutral']) {
  const css = fs.readFileSync(path.join(root, 'packages/tokens/dist/css', s + '.css'), 'utf8');
  for (const m of css.matchAll(/--ds-ease-([a-z-]+):\s*([^;]+);/g)) eases.push({ name: 'ease.' + m[1], style: s, sig: sig(m[2]), raw: m[2].replace(/\s+/g, '') });
}
const easeName = (e) => {
  if (!e) return e;
  const g = sig(e);
  if (g) {
    const hits = eases.filter((x) => x.sig === g);
    if (!hits.length) return 'RAW ' + e.slice(0, 30);
    const variants = new Set(eases.filter((x) => x.name === hits[0].name && x.sig).map((x) => x.sig));
    return hits[0].name + (variants.size > 1 ? (g.startsWith('0.00,0.15') || g.startsWith('0.00,0.09') ? '/desk' : g.startsWith('0.00,0.06,0.18,0.34') ? '/desk' : '/neutral') : '');
  }
  const k = e.replace(/\s+/g, '');
  const hit = eases.find((x) => x.raw === k);
  if (hit) return hit.name;
  return k.slice(0, 28);
};

const [rawDir, checksDir, ...only] = process.argv.slice(2);
const ids = only.length ? only : Object.keys(L.scenarios);
for (const id of ids) {
  const out = { id, note: 'Durations are effect timing (getComputedTiming), ms. Rows: style, scheme, dir, motion. kf: first, middle and last keyframe. seen: first and last frame (wall clock ms, machine loaded).', runs: {}, checks: {} };
  const digest = [];
  for (const f of fs.readdirSync(rawDir).filter((f) => f.startsWith(id + '.') && f.endsWith('.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(rawDir, f), 'utf8'));
    if (d.id !== id) continue;
    const key = `${d.style}.${d.dir}.${d.motion}`;
    out.runs[key] = (d.runs || []).map((r) => {
      if (r.error) return r;
      const anims = r.anims.map((a) => ({ ...a, ease: easeName(a.ease) }));
      const o = { run: r.run, stateAt: r.stateAt, firstMotionAt: r.firstMotionAt, focusAt: r.focusAt, activeAfter: r.activeAfter, stateAfter: r.stateAfter, longest: r.longest, badProps: r.badProps, infinite: r.infinite, transitionCheck: r.transitionCheck, rest: r.rest, anims };
      if (r.readable) o.readable = r.readable;
      if (r.inspect !== undefined) o.inspect = r.inspect;
      if (r.err) o.err = r.err;
      return o;
    });
    if (d.error) out.runs[key] = { error: d.error };
    for (const r of out.runs[key].map ? out.runs[key] : []) {
      if (r.error) { digest.push(`${key} ${r.run} ERROR ${r.error}`); continue; }
      const a = r.anims.map((a) => `${a.target}${a.n > 1 ? 'x' + a.n : ''}:${a.name === a.props.join() ? '' : a.name + ':'}${a.props.join('+')} ${a.dur}${a.delay ? '+' + JSON.stringify(a.delay) : ''} ${a.ease}${a.iter !== 1 ? ' it=' + a.iter : ''}`).join(' | ');
      digest.push(`${key} ${r.run} st=${r.stateAt} mo=${r.firstMotionAt} fo=${r.focusAt} bad=${r.badProps.join()} tc=${(r.transitionCheck || []).length} held=${r.rest && r.rest.heldCount} run=${r.rest && r.rest.running.length}${r.readable ? ' read=' + JSON.stringify(r.readable.readableAt) : ''}${r.inspect !== undefined ? ' insp=' + JSON.stringify(r.inspect) : ''}${r.err ? ' ERR=' + r.err : ''} :: ${a}`);
    }
  }
  if (checksDir && fs.existsSync(checksDir)) for (const f of fs.readdirSync(checksDir).filter((f) => f.startsWith(id + '.') && f.endsWith('.checks.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(checksDir, f), 'utf8'));
    if (d.id !== id) continue;
    if (d.off && d.off.runs) d.off.runs.forEach((r) => r.anims.forEach((a) => { delete a.seen; }));
    out.checks[`${d.style}.${d.dir}`] = d;
  }
  const file = path.join(__dirname, `${id}.measure.json`);
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(`##### ${id} (${Math.round(fs.statSync(file).size / 1024)} KB)\n` + digest.sort().join('\n'));
}
