// Prints a compact summary of the <id>.measure.json files of qa-navigation-feedback.run.cjs.
const fs = require('fs');
const path = require('path');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(require('./qa-navigation-feedback.lib.cjs').ids);
for (const id of ids) {
  const f = path.join(__dirname, `${id}.measure.json`);
  if (!fs.existsSync(f)) { console.log(`## ${id}: no file`); continue; }
  const o = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(`## ${id} (${o.drive}, ${o.pattern}${o.primitive ? ', ' + o.primitive : ''})`);
  for (const [s, v] of Object.entries(o.styles)) {
    const f0 = v.full;
    const durs = [...new Set(f0.anims.map((a) => `${a.target} ${a.props.join('+')} ${a.duration}${a.delay ? '+d' + a.delay : ''}${a.iterations !== 1 ? 'x' + a.iterations : ''} ${a.easing}`))];
    console.log(` ${s}: anims ${f0.animCount} longest ${f0.longest} bad [${f0.badProps}] state@${f0.stateAt} motion@${f0.firstMotionAt} inf [${f0.infinite}] sweep [${v.transitionSweep}] [${v.transitionSweepAfter}]`);
    for (const d of durs.slice(0, 10)) console.log('    ' + d);
    if (v.fullExtra) console.log(`  extra: ${v.fullExtra.animCount} longest ${v.fullExtra.longest} ` + [...new Set(v.fullExtra.anims.map((a) => `${a.target} ${a.duration} ${a.easing}`))].slice(0, 6).join(' | '));
    if (v.focus) console.log(`  focus: ${v.focus.at0 && v.focus.at0.el} atOnce=${v.focus.ringAtOnce} outline ${v.focus.at0 && v.focus.at0.outline} shadow ${(v.focus.at0 && v.focus.at0.boxShadow || '').slice(0, 70)} anims ${v.focus.at0 && v.focus.at0.anims}`);
    console.log(`  seek: hit missed [${v.seek.hit.missed.slice(0, 4)}] maxShift ${v.seek.hit.maxShift} parts: ` + v.seek.parts.slice(0, 8).map((p) => `${p.part} s${p.scale.join('..')} t${p.travelPx} op${p.opacityMin} os${p.scaleOvershoot}/${p.travelOvershootPx} until${p.movesUntil}`).join(' | '));
    if (v.seek.readable.length) console.log('  readable: ' + v.seek.readable.map((r) => `${r.text}@${r.readableAt}`).join(' | '));
    const rc = (r) => r ? `left[${r.left}] held[${r.held}] inline[${r.inline}] ghosts ${r.ghosts} nodes ${r.nodesBefore ?? ''}->${r.nodes} ind ${JSON.stringify(r.indicators)} ${r.custom ? JSON.stringify(r.custom).slice(0, 200) : ''}` : '-';
    console.log(`  rapid: ${rc(v.rapid)}`);
    console.log(`  interrupt: ${rc(v.interrupt)}`);
    if (v.tenFast) console.log(`  tenFast: before ${JSON.stringify(v.tenFast.before).slice(0, 150)} after ${JSON.stringify(v.tenFast.after).slice(0, 200)} starts [${v.tenFast.motionStarts}] rest ${JSON.stringify(v.tenFast.rest)}`);
    if (v.flash) console.log(`  flash: maxChanged ${v.flash.maxChangedPixels}/${v.flash.stageArea} peaks/s ${v.flash.changePeaksPerSecond}`);
    if (v.pause) console.log(`  pause: ${JSON.stringify(v.pause).slice(0, 300)}`);
    if (v.off) console.log(`  off: anims ${v.off.animations} moving [${v.off.moving}] fading [${v.off.fading}]`);
    for (const k of ['full.rtl', 'media.ltr', 'media.rtl', 'attr.ltr', 'attr.rtl']) {
      const r = v[k];
      if (!r) continue;
      const anim = r.anims.map((a) => `${a.target} ${a.duration}${a.iterations !== 1 ? 'x' + a.iterations : ''}`);
      console.log(`  ${k}: anims ${r.animCount} (zero ${r.zeroDurationAnims}) longest ${r.longest} bad [${r.badProps}] state@${r.stateAt} motion@${r.firstMotionAt} ${k.startsWith('full') ? '' : '[' + anim.slice(0, 4) + ']'} ${r.restOffTransforms ? 'rest[' + r.restOffTransforms.slice(0, 5) + ']' : ''} ${r.rapid ? 'rapid left[' + r.rapid.left + '] held[' + r.rapid.held + ']' : ''}`);
    }
  }
}
