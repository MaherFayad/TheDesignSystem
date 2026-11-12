// Samples the Web Animations of each code driven interaction in both
// galleries and writes what it saw, for the timing table of the Angular
// motion report (docs/reports/lanes/angular-motion.md).
//
// node docs/reports/shots/angular-motion/sample-timing.mjs [react url] [angular url] [id ...]
//
// For each interaction id with drive 'waapi', it opens
// `/interactions?focus=<id>&style=neutral` in each gallery, presses the
// stage's `[data-interaction-trigger]` (a focus or a hover is not sampled:
// it says so), then reads `document.getAnimations()` every frame for 1.5 s
// and keeps each animation it sees once: the part it runs on (data-ds,
// data-part, pseudo element), the animated properties, the duration, the
// delay and the easing (the effect easing, or the keyframe easing when the
// effect has none). It writes timing.json and timing.md next to itself.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const [reactUrl = 'http://localhost:5301', angularUrl = 'http://localhost:5302', ...only] = process.argv.slice(2);

const ids = await (async () => {
  const { interactions } = await import('../../../../packages/motion/src/interactions.ts').catch(() => ({ interactions: null }));
  if (interactions) return interactions.filter((i) => i.drive === 'waapi').map((i) => i.id);
  throw new Error('Run with tsx: npx tsx docs/reports/shots/angular-motion/sample-timing.mjs');
})();
const wanted = only.length ? ids.filter((id) => only.includes(id)) : ids;

const browser = await chromium.launch();

async function sample(base, id) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(`${base}/interactions?focus=${id}&style=neutral`, { waitUntil: 'networkidle' });
    const stage = await page.$('[data-interaction-stage]');
    if (!stage) return { status: 'no page' };
    const text = (await stage.textContent()) ?? '';
    if (/^No stage for/.test(text.trim())) return { status: 'no stage' };
    await page.waitForTimeout(600);
    const trigger = await page.$('[data-interaction-stage] [data-interaction-trigger]');
    if (!trigger) return { status: 'no trigger' };
    await page.evaluate(() => {
      window.__seen = new Map();
      const describe = (a) => {
        const e = a.effect;
        const t = e?.target;
        const host = t && t.nodeType === 1 ? t : null;
        const owner = host?.closest('[data-ds]');
        const part = host?.getAttribute('data-part') ?? (host === owner ? 'root' : host?.tagName.toLowerCase());
        const frames = e?.getKeyframes?.() ?? [];
        const props = [...new Set(frames.flatMap((f) => Object.keys(f).filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k))))].sort();
        const timing = e?.getTiming?.() ?? {};
        const frameEase = [...new Set(frames.map((f) => f.easing).filter((x) => x && x !== 'linear'))];
        const ease = timing.easing && timing.easing !== 'linear' ? timing.easing : frameEase[0] ?? 'linear';
        return {
          on: `${owner?.getAttribute('data-ds') ?? '?'}/${part ?? '?'}${e?.pseudoElement ?? ''}`,
          kind: a.constructor.name,
          props: props.join(' '),
          duration: Math.round(Number(timing.duration) || 0),
          delay: Math.round(Number(timing.delay) || 0),
          iterations: timing.iterations,
          easing: ease,
          frames: frames.length,
        };
      };
      const tick = () => {
        for (const a of document.getAnimations()) {
          const d = describe(a);
          const key = `${d.kind}|${d.on}|${d.props}|${d.duration}|${d.delay}|${d.easing}`;
          if (!window.__seen.has(key)) window.__seen.set(key, d);
        }
        if (performance.now() < window.__until) requestAnimationFrame(tick);
      };
      window.__until = performance.now() + 1500;
      requestAnimationFrame(tick);
    });
    await trigger.click();
    await page.waitForTimeout(1700);
    const seen = await page.evaluate(() => [...window.__seen.values()]);
    // A CSS transition is the shared CSS: the same in both by construction. Keep the script animations.
    const script = seen.filter((d) => d.kind === 'Animation');
    return { status: script.length ? 'played' : 'nothing played', animations: script, css: seen.length - script.length };
  } catch (err) {
    return { status: `error: ${String(err).split('\n')[0]}` };
  } finally {
    await page.close();
  }
}

const rows = [];
for (const id of wanted) {
  const react = await sample(reactUrl, id);
  const angular = await sample(angularUrl, id);
  const sig = (r) => (r.animations ?? []).map((a) => `${a.props}|${a.duration}|${a.delay}|${a.easing}`).sort().join('\n');
  const same = react.status === 'played' && angular.status === 'played' && sig(react) === sig(angular);
  rows.push({ id, same, react, angular });
  console.log(`${id}: react ${react.status}, angular ${angular.status}${same ? ', same' : ''}`);
}
await browser.close();

writeFileSync(join(here, 'timing.json'), `${JSON.stringify(rows, null, 2)}\n`);

const short = (e) => (e.length > 48 ? `${e.slice(0, 45)}...` : e);
const cell = (r) =>
  r.status !== 'played'
    ? r.status
    : [...new Map(r.animations.map((a) => [`${a.props}, ${a.duration} ms${a.delay ? ` after ${a.delay} ms` : ''}, ${short(a.easing)}`, 1])).keys()].join('<br>');
const md = [
  '| Interaction | Same | React | Angular |',
  '| --- | --- | --- | --- |',
  ...rows.map((r) => `| ${r.id} | ${r.same ? 'yes' : 'no'} | ${cell(r.react)} | ${cell(r.angular)} |`),
].join('\n');
writeFileSync(join(here, 'timing.md'), `${md}\n`);
