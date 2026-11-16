// Unit tests for the recording pack: the pack files, the clip catalogue, the
// frame plan of a stroke, the key frames of a contact sheet, the touch point
// and caption of a frame, the index with a source clip beside ours, the sign
// sheet (one line per clip, answers kept across reruns) and the device script
// template. The browser run itself is proven by the sample pack in
// docs/reports/reset/R0.9/record/.
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLIPS, findClip } from './clips';
import { captionLines, fingerStatus, frameHtml, frameState, keyFrames, platformLabel } from './compose';
import { FRAME_ARGS, FRAME_MS } from './capture';
import { clipKey, clipUrl, firstChange, frameName, sheetCells } from './pack';
import { answerLine, deviceScript, indexHtml, indexMarkdown, readAnswers, signSheet } from './report';
import { checkPack, loadPack, packIds, parseArgs, RECORD_DIR, SIGNOFF_DIR } from './run';
import { pathDelta, planStroke } from './screen';
import type { ClipResult, FrameInfo, PackResult } from './types';

/** Frames of a synthetic recording: `down` and `up` frame numbers, and the frames where the screen changes. */
function frames(n: number, strokes: [number, number][], changesAt: number[], drag = false): FrameInfo[] {
  let hash = 0;
  const out: FrameInfo[] = [];
  for (let i = 0; i < n; i += 1) {
    if (changesAt.includes(i)) hash += 1;
    const s = strokes.find(([d, u]) => i >= d && i < u);
    const lastUp = strokes.filter(([, u]) => u <= i).map(([, u]) => u).pop();
    const down = s !== undefined;
    out.push({
      index: i,
      finger: down ? 'down' : 'up',
      x: down ? 100 + (drag ? i - s[0] : 0) : null,
      y: down ? 200 : null,
      downFor: down ? (i - s[0]) * FRAME_MS : null,
      upFor: !down && lastUp !== undefined ? (i - lastUp) * FRAME_MS : null,
      edge: strokes.some(([d]) => d === i) ? 'down' : strokes.some(([, u]) => u === i) ? 'up' : null,
      hash: `h${hash}`,
    });
  }
  return out;
}

function clip(over: Partial<ClipResult> = {}): ClipResult {
  return {
    key: clipKey('switch', 'neutral', 'auto', 'pixel', 'light'),
    clip: 'switch',
    name: 'Switch',
    does: 'Taps a switch',
    style: 'neutral',
    platform: 'auto',
    detected: 'android',
    device: 'pixel',
    deviceName: frameName('pixel'),
    scheme: 'light',
    video: 'clips/switch-neutral-auto-pixel-light.mp4',
    sheet: 'sheets/switch-neutral-auto-pixel-light.png',
    source: null,
    frames: 120,
    durationMs: 2000,
    keyFrames: { down: 24, mid: 27, up: 30, settled: 40 },
    firstChange: { afterDownMs: 100, whileDown: false },
    bytes: { video: 80_000, sheet: 90_000 },
    ...over,
  };
}

function pack(clips: ClipResult[]): PackResult {
  return { order: 'R0.9', title: 'Sample', date: '2026-11-16T14:00:00.000Z', commit: 'abc1234', load: [1, 1, 1], cpus: 4, chromium: '140', clips };
}

describe('pack files', () => {
  it('every pack in ./packs is sound and names clips that exist', () => {
    expect(packIds()).toContain('R0.9');
    for (const id of packIds()) {
      const data = JSON.parse(readFileSync(join(RECORD_DIR, 'packs', `${id}.json`), 'utf8')) as unknown;
      expect(checkPack(data, id)).toEqual([]);
    }
  });

  it('the sample pack is the five clips of the order in Neutral on both phone frames, platform auto', () => {
    const p = loadPack('R0.9');
    expect(p.clips).toEqual(['button-press', 'switch', 'dialog-open', 'sheet-drag', 'toast-swipe']);
    expect(p.styles).toEqual(['neutral']);
    expect(p.platforms).toEqual(['auto']);
    expect([...p.devices].sort()).toEqual(['iphone', 'pixel']);
    expect(p.ask).toMatch(/approve the format/);
  });

  it('reports what is wrong with a pack', () => {
    expect(checkPack({ order: 'R1.1', title: '', clips: ['nope'], styles: [], platforms: ['phone'], devices: ['ipad'], schemes: ['dim'] }, 'R1.2')).toEqual([
      'order "R1.1" does not match the file name "R1.2"',
      'title is required',
      'no clip "nope" in clips.ts',
      'styles must list at least one style',
      'platforms must be some of auto, web, ios, android, macos',
      'devices must be pixel, iphone or both',
      'schemes must be light, dark or both',
    ]);
  });
});

describe('the command line', () => {
  it('reads the order and the narrowing flags', () => {
    const a = parseArgs(['--order', 'R0.9', '--clip=switch,dialog-open', '--device', 'pixel', '--scheme', 'light,dark', '--scale', '1']);
    expect(a.order).toBe('R0.9');
    expect(a.clips).toEqual(['switch', 'dialog-open']);
    expect(a.devices).toEqual(['pixel']);
    expect(a.schemes).toEqual(['light', 'dark']);
    expect(a.scale).toBe(1);
  });

  it('refuses what it does not know', () => {
    expect(() => parseArgs(['--device', 'ipad'])).toThrow(/Unknown device/);
    expect(() => parseArgs(['--platform', 'phone'])).toThrow(/Unknown platform/);
    expect(() => parseArgs(['--scale', '4'])).toThrow(/scale/);
    expect(() => parseArgs(['--fast'])).toThrow(/Unknown argument/);
  });

  it('builds the gallery page; auto leaves the platform to the page', () => {
    expect(clipUrl('http://x', 'switch', { style: 'neutral', scheme: 'light', platform: 'auto', caseId: 'variants' })).toBe('http://x/c/switch?style=neutral&scheme=light&dir=ltr&lang=en&case=variants&chrome=0');
    expect(clipUrl('http://x', 'switch', { style: 'liquid', scheme: 'dark', platform: 'ios' })).toContain('platform=ios');
  });
});

describe('clips', () => {
  it('every clip lands on a target and names what the finger does', () => {
    for (const c of CLIPS) {
      expect(c.strokes.length).toBeGreaterThan(0);
      expect(c.does.length).toBeGreaterThan(10);
      for (const s of c.strokes) expect(s.aim.selector).not.toBe('');
    }
    expect(findClip('sheet-drag')?.strokes[0]?.path).toEqual({ dx: 0, dy: 260 });
  });

  it('hold and move times are whole frames at 60 a second, so the caption says what the clip shows', () => {
    for (const c of CLIPS) {
      for (const s of [...c.strokes, ...(c.setup ?? [])]) {
        if (!('aim' in s)) continue;
        for (const ms of [s.holdMs ?? 100, s.moveMs ?? 0]) expect(Math.abs(ms / FRAME_MS - Math.round(ms / FRAME_MS))).toBeLessThan(1e-9);
      }
    }
  });
});

describe('strokes', () => {
  it('plans a tap and a drag in frames', () => {
    expect(planStroke({ aim: { selector: 'x' }, holdMs: 600 })).toEqual({ holdFrames: 36, moveFrames: 0, restFrames: 0, pauseFrames: 54 });
    expect(planStroke({ aim: { selector: 'x' }, holdMs: 100, path: { dx: 0, dy: 260 }, moveMs: 300, pauseAfterMs: 1200 })).toEqual({ holdFrames: 6, moveFrames: 18, restFrames: 0, pauseFrames: 72 });
  });

  it('a swipe follows the direction the element names', () => {
    const path = { towards: { selector: 't', attribute: 'data-swipe-direction' }, distance: 180 };
    expect(pathDelta(path, 'up')).toEqual({ dx: 0, dy: -180 });
    expect(pathDelta(path, 'right')).toEqual({ dx: 180, dy: 0 });
    expect(pathDelta(path, 'left')).toEqual({ dx: -180, dy: 0 });
    expect(pathDelta({ dx: 3, dy: 4 }, null)).toEqual({ dx: 3, dy: 4 });
  });

  it('records with begin frame control and virtual time, not a screencast', () => {
    expect(FRAME_ARGS).toContain('--enable-begin-frame-control');
    expect(FRAME_ARGS).toContain('--deterministic-mode');
  });
});

describe('frames, key frames and the touch point', () => {
  it('picks finger down, mid, lift and settled from the longest stroke', () => {
    // A tap (24 to 30), then a hold (84 to 120); the screen changes at 31 and 125 to 130.
    const f = frames(160, [[24, 30], [84, 120]], [31, 125, 128, 130]);
    expect(keyFrames(f)).toEqual({ down: 84, mid: 102, up: 120, settled: 130 });
  });

  it('a single tap settles when the screen stops changing', () => {
    const f = frames(80, [[24, 30]], [32, 40, 50]);
    expect(keyFrames(f)).toEqual({ down: 24, mid: 27, up: 30, settled: 50 });
    expect(keyFrames(frames(10, [], []))).toBeNull();
  });

  it('says when the screen first answered and whether the finger was still down', () => {
    expect(firstChange(frames(80, [[24, 30]], [31]))).toEqual({ afterDownMs: 117, whileDown: false });
    expect(firstChange(frames(80, [[24, 30]], [26]))).toEqual({ afterDownMs: 33, whileDown: true });
    expect(answerLine(clip({ firstChange: { afterDownMs: 100, whileDown: false } }))).toBe('The screen first changes 100ms after the finger lands, after it lifted.');
  });

  it('shows the finger down, held and lifted, and keeps the lift ring 300ms', () => {
    const f = frames(60, [[10, 16]], []);
    expect(fingerStatus(f[5]!)).toBe('No finger yet');
    expect(fingerStatus(f[10]!)).toBe('Finger down');
    expect(fingerStatus(f[13]!)).toBe('Finger down 50ms');
    expect(fingerStatus(f[16]!)).toBe('Finger lifted');
    expect(fingerStatus(f[22]!)).toBe('Finger lifted 100ms ago');
    expect(frameState(f, 10, 's.png', 34).dot).toEqual({ x: 100, y: 234, state: 'down', edge: true });
    expect(frameState(f, 18, 's.png', 34).dot.state).toBe('up');
    expect(frameState(f, 40, 's.png', 34).dot.state).toBe('none');
  });

  it('labels the sheet cells, mid drag when the finger moved', () => {
    const drag = frames(60, [[10, 30]], [], true);
    const cells = sheetCells(drag, { down: 10, mid: 20, up: 30, settled: 40 });
    expect(cells.map((c) => c.label)).toEqual(['Finger down', 'Mid drag', 'Finger lifted', 'Settled']);
    expect(cells[2]!.time).toBe('0.50s (333ms after the finger landed)');
    expect(sheetCells(frames(60, [[10, 16]], []), { down: 10, mid: 13, up: 16, settled: 20 })[1]!.label).toBe('Held, mid press');
  });
});

describe('captions', () => {
  it('names the style, the platform and the frame', () => {
    expect(platformLabel('auto', 'ios')).toBe('iOS (detected)');
    expect(platformLabel('android', 'android')).toBe('Android (set)');
    expect(frameName('iphone')).toBe('an iPhone 15 Pro frame');
    expect(frameName('pixel')).toBe('a Pixel 7 frame');
    expect(captionLines({ name: 'Switch', style: 'neutral', scheme: 'light', platform: 'Android (detected)', deviceName: 'a Pixel 7 frame', does: 'Taps a switch' })).toEqual(['Switch', 'Neutral, light. Android (detected) in a Pixel 7 frame', 'Taps a switch']);
  });

  it('burns the caption into the frame page and draws no vendor mark', () => {
    const html = frameHtml({ device: 'iphone', viewport: { width: 393, height: 659 }, caption: { name: 'Button press', style: 'neutral', scheme: 'light', platform: 'iOS (detected)', deviceName: 'an iPhone 15 Pro frame', does: 'Taps the button' }, frames: frames(30, [[5, 11]], []), dark: false });
    expect(html).toContain('Button press');
    expect(html).toContain('iOS (detected) in an iPhone 15 Pro frame');
    expect(html).toContain('Real time at 1x, 60 frames a second, no zoom');
    expect(html).not.toMatch(/apple|android robot|<svg/i);
  });
});

describe('the index, the sign sheet and the device script', () => {
  it('puts the source clip beside ours where a pair exists, and says when there is none', () => {
    const withSource = clip({ source: { pair: 'gb-button-desk', video: 'clips/x.source.mp4', sheet: 'sheets/x.source.png', note: 'GoBanana primitives page.' } });
    const html = indexHtml(pack([withSource, clip({ key: 'b', source: null })]), 2);
    const card = html.slice(html.indexOf(`id="${withSource.key}"`));
    expect(card.indexOf('<h3>Ours</h3>')).toBeLessThan(card.indexOf('<h3>Source</h3>'));
    expect(card).toContain('clips/x.source.mp4');
    expect(html).toContain('playbackRate = 1');
    expect(html).toContain('data-scale="2"');
    expect(indexMarkdown(pack([clip()]))).toContain('No compare pair covers this style and interaction');
  });

  it('says why a clip is missing instead of faking it', () => {
    const md = indexMarkdown(pack([clip({ video: null, sheet: null, cannot: 'Headless Chromium has no haptics.' })]));
    expect(md).toContain('Not recorded: Headless Chromium has no haptics.');
  });

  it('lists every clip once and keeps the answers the lead wrote on a rerun', () => {
    const clips = [clip(), clip({ key: 'switch-neutral-auto-iphone-light', device: 'iphone', detected: 'ios', deviceName: frameName('iphone') })];
    const file = loadPack('R0.9');
    const first = signSheet(pack(clips), file, new Map(), file.ask ?? null);
    for (const c of clips) expect(first.split('\n').filter((l) => l.includes(`\`${c.key}\``))).toHaveLength(1);
    expect(first).toContain('`pack-format`');
    const dir = mkdtempSync(join(tmpdir(), 'ds-record-test-'));
    const path = join(dir, 'R0.9.md');
    const answer = (line: string, text: string) => line.replace(/\|\s*\|\s*\|$/, `| ${text} | 2026-11-17 |`);
    const edited = first
      .split('\n')
      .map((l) => (l.includes('`switch-neutral-auto-pixel-light`') ? answer(l, 'signed') : l.includes('`pack-format`') ? answer(l, 'approve the format') : l))
      .join('\n');
    writeFileSync(path, edited);
    const answers = readAnswers(path);
    expect(answers.get('switch-neutral-auto-pixel-light')).toEqual({ answer: 'signed', date: '2026-11-17' });
    expect(answers.get('pack-format')).toEqual({ answer: 'approve the format', date: '2026-11-17' });
    const again = signSheet(pack(clips), file, answers, file.ask ?? null);
    expect(again).toMatch(/`switch-neutral-auto-pixel-light`.*\| signed \| 2026-11-17 \|/);
    expect(again).toMatch(/\| approve the format \| 2026-11-17 \|/);
  });

  it('fills the device script template', () => {
    const template = readFileSync(join(SIGNOFF_DIR, 'device-script.template.md'), 'utf8');
    const out = deviceScript(template, pack([clip()]), loadPack('R0.9'), 'https://preview.example');
    expect(out).not.toMatch(/\{\{/);
    expect(out).toContain('https://preview.example');
    expect(out).toContain('1. Turn on the phone');
    expect(out).toContain('Switch, Neutral light, Android (detected), a Pixel 7 frame');
  });
});

describe('writing rules and sources', () => {
  const files = [...readdirSync(RECORD_DIR).filter((f) => f.endsWith('.ts')).map((f) => join(RECORD_DIR, f)), join(SIGNOFF_DIR, 'device-script.template.md'), join(SIGNOFF_DIR, 'TEMPLATE.md')];

  it('no em dash or en dash in the record files and templates', () => {
    for (const f of files) expect(/[\u2013\u2014]/.test(readFileSync(f, 'utf8')), f).toBe(false);
  });

  it('no path into the third party vendor folder of Figma-Killer-2', () => {
    const vendor = ['alm', 'design', 'system'].join('-');
    for (const f of files) expect(readFileSync(f, 'utf8').includes(vendor), f).toBe(false);
  });
});
