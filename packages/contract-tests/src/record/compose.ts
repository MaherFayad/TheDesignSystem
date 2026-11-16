// Puts each captured screen frame into a phone frame with its caption, the
// touch point and a timeline, and builds the contact sheet. Both are plain
// HTML pages drawn by a second, ordinary Chromium and captured per frame, so
// the caption is burned into every frame of the clip. The phone frames are
// plain shapes (a rounded body, a camera cut out, a home bar); no maker's
// mark or symbol is drawn.
import type { Device } from '../perceive/types';
import type { FrameInfo, KeyFrames } from './types';
import { FRAME_MS } from './capture';

/** The look of each phone frame, in CSS px. */
export type FrameKind = Device | 'window';

/** The look of each frame, in CSS px. `window` is a plain window for a source screen that is not a phone screen. */
export const PHONE: Record<FrameKind, { bezel: number; radius: number; top: number; bottom: number; camera: 'pill' | 'hole' | 'none' }> = {
  iphone: { bezel: 12, radius: 54, top: 50, bottom: 30, camera: 'pill' },
  pixel: { bezel: 10, radius: 34, top: 34, bottom: 26, camera: 'hole' },
  window: { bezel: 6, radius: 12, top: 24, bottom: 0, camera: 'none' },
};

export const PLATFORM_NAMES: Record<string, string> = { ios: 'iOS', android: 'Android', web: 'Web', macos: 'macOS' };

export interface Caption {
  name: string;
  style: string;
  scheme: string;
  /** "iOS (detected)" or "Android (set)". */
  platform: string;
  deviceName: string;
  does: string;
}

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const titleCase = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** The platform as a caption says it: what the page used, and whether it was detected or set. */
export function platformLabel(asked: string, detected: string | null): string {
  const used = detected ?? asked;
  const name = PLATFORM_NAMES[used] ?? used;
  return asked === 'auto' ? `${name} (detected)` : `${name} (set)`;
}

export function captionLines(c: Caption): [string, string, string] {
  return [c.name, `${titleCase(c.style)}, ${c.scheme}. ${c.platform} in ${c.deviceName}`, c.does];
}

/** The sentence under the phone for one frame: where the finger is. */
export function fingerStatus(f: FrameInfo): string {
  if (f.finger === 'down') return f.edge === 'down' ? 'Finger down' : `Finger down ${Math.round(f.downFor ?? 0)}ms`;
  if (f.edge === 'up') return 'Finger lifted';
  if (f.upFor !== null) return `Finger lifted ${Math.round(f.upFor)}ms ago`;
  return 'No finger yet';
}

export const seconds = (index: number): string => `${((index * FRAME_MS) / 1000).toFixed(2)}s`;

/** The page a frame is drawn on. Sizes in CSS px; the screen image is drawn at viewport size. */
export function frameHtml(opts: { device: FrameKind; viewport: { width: number; height: number }; caption: Caption; frames: FrameInfo[]; dark: boolean }): string {
  const p = PHONE[opts.device];
  const vw = opts.viewport.width;
  const vh = opts.viewport.height;
  const phoneW = vw + p.bezel * 2;
  const phoneH = vh + p.top + p.bottom + p.bezel * 2;
  const pageW = phoneW + 32;
  const [l1, l2, l3] = captionLines(opts.caption).map(escapeHtml);
  const total = Math.max(1, opts.frames.length);
  // Finger down spans on the timeline.
  const spans: string[] = [];
  let start: number | null = null;
  opts.frames.forEach((f, i) => {
    if (f.finger === 'down' && start === null) start = i;
    if ((f.finger !== 'down' || i === opts.frames.length - 1) && start !== null) {
      spans.push(`<i style="inset-inline-start:${((start / total) * 100).toFixed(2)}%;inline-size:${(((i - start) / total) * 100).toFixed(2)}%"></i>`);
      start = null;
    }
  });
  const camera = p.camera === 'pill' ? '<b class="pill"></b>' : p.camera === 'hole' ? '<b class="hole"></b>' : '';
  const clockText = p.camera === 'none' ? '' : '9:41';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
html,body{background:${opts.dark ? '#0d0e10' : '#202226'};color:#f2f3f5;font:14px/1.35 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main{inline-size:${pageW}px;padding:14px 16px 14px}
h1{font-size:18px;font-weight:650;letter-spacing:0}
.l2{font-size:14px;color:#d4d7dd;margin-block-start:2px}
.l3{font-size:13px;color:#b7bcc5;margin-block:2px 10px;min-block-size:36px}
.phone{position:relative;inline-size:${phoneW}px;block-size:${phoneH}px;border-radius:${p.radius}px;background:#050506;box-shadow:0 0 0 2px #3b3e45 inset;padding:${p.bezel}px}
.glass{position:relative;inline-size:${vw}px;block-size:${vh + p.top + p.bottom}px;border-radius:${p.radius - p.bezel}px;overflow:hidden;background:${opts.dark ? '#000' : '#fff'}}
.bar{block-size:${p.top}px;position:relative}
.bar b{position:absolute;background:#050506}
.pill{inline-size:118px;block-size:32px;border-radius:16px;inset-block-start:10px;inset-inline-start:${(vw - 118) / 2}px}
.hole{inline-size:20px;block-size:20px;border-radius:50%;inset-block-start:8px;inset-inline-start:${(vw - 20) / 2}px}
.time{position:absolute;inset-block-start:${p.camera === 'pill' ? 17 : 9}px;inset-inline-start:${p.camera === 'pill' ? 34 : 18}px;font-size:13px;font-weight:600;color:${opts.dark ? '#fff' : '#111'}}
.screen{display:block;inline-size:${vw}px;block-size:${vh}px}
.home{block-size:${p.bottom}px;position:relative}
.home:empty{display:none}
.home b{position:absolute;inset-inline-start:${(vw - 120) / 2}px;inset-block-start:${p.bottom - 13}px;inline-size:120px;block-size:4px;border-radius:2px;background:${opts.dark ? '#fff' : '#111'};opacity:.85}
.dot{position:absolute;inline-size:34px;block-size:34px;margin:-17px 0 0 -17px;border-radius:50%;pointer-events:none;display:none}
.dot.down{display:block;background:rgba(255,45,120,.14);border:3px solid #ff2d78;box-shadow:0 0 0 1.5px rgba(255,255,255,.95)}
.dot.down::after{content:"";position:absolute;inset:11px;border-radius:50%;background:#ff2d78;box-shadow:0 0 0 1.5px #fff}
.dot.up{display:block;border:3px dashed #ff2d78;background:transparent}
.dot.edge{box-shadow:0 0 0 5px rgba(255,45,120,.5),0 0 0 1.5px rgba(255,255,255,.95)}
.live{display:flex;justify-content:space-between;align-items:baseline;margin-block-start:10px;font-variant-numeric:tabular-nums}
.clock{font-size:16px;font-weight:650}
.status{font-size:15px;font-weight:600;color:#ff7aa8}
.status.idle{color:#b7bcc5}
.track{position:relative;block-size:10px;border-radius:5px;background:#3b3e45;margin-block-start:8px;overflow:hidden}
.track i{position:absolute;inset-block:0;background:#ff2d78}
.head{position:absolute;inset-block:-2px;inline-size:2px;background:#fff}
.foot{font-size:11px;color:#9aa0a9;margin-block-start:6px}
</style></head><body><main>
<h1>${l1}</h1><div class="l2">${l2}</div><div class="l3">${l3}</div>
<div class="phone"><div class="glass"><div class="bar">${camera}<span class="time">${clockText}</span></div><img class="screen" id="screen" alt=""><div class="home">${p.bottom > 0 ? '<b></b>' : ''}</div>
<div class="dot" id="dot"></div></div></div>
<div class="live"><span class="clock" id="clock">0.00s</span><span class="status idle" id="status"></span></div>
<div class="track">${spans.join('')}<span class="head" id="head"></span></div>
<div class="foot">Real time at 1x, 60 frames a second, no zoom. Pink: the finger is down. Dashed ring: where it lifted.</div>
</main></body></html>`;
}

export interface FrameState {
  src: string;
  dot: { x: number; y: number; state: 'down' | 'up' | 'none'; edge: boolean };
  clock: string;
  status: string;
  idle: boolean;
  head: number;
}

/** What the frame page shows for frame i. The lift ring stays for 300ms. */
export function frameState(frames: FrameInfo[], i: number, src: string, topOffset: number): FrameState {
  const f = frames[i]!;
  let dot: FrameState['dot'] = { x: 0, y: 0, state: 'none', edge: false };
  if (f.finger === 'down' && f.x !== null && f.y !== null) dot = { x: f.x, y: f.y + topOffset, state: 'down', edge: f.edge === 'down' || (f.downFor ?? 0) < 100 };
  else if (f.upFor !== null && f.upFor <= 300) {
    // Where the finger lifted: the last frame it was down.
    for (let j = i; j >= 0; j -= 1) {
      const g = frames[j]!;
      if (g.x !== null && g.y !== null) {
        dot = { x: g.x, y: g.y + topOffset, state: 'up', edge: false };
        break;
      }
    }
  }
  return { src, dot, clock: seconds(i), status: fingerStatus(f), idle: f.finger !== 'down' && f.edge !== 'up' && (f.upFor === null || f.upFor > 300), head: (i / Math.max(1, frames.length)) * 100 };
}

/** Runs in the frame page. */
export async function applyFrame(s: FrameState): Promise<void> {
  const img = document.getElementById('screen') as HTMLImageElement;
  img.src = s.src;
  await img.decode();
  const dot = document.getElementById('dot') as HTMLElement;
  dot.className = `dot${s.dot.state === 'none' ? '' : ` ${s.dot.state}`}${s.dot.edge ? ' edge' : ''}`;
  dot.style.left = `${s.dot.x}px`;
  dot.style.top = `${s.dot.y}px`;
  (document.getElementById('clock') as HTMLElement).textContent = s.clock;
  const st = document.getElementById('status') as HTMLElement;
  st.textContent = s.status;
  st.className = `status${s.idle ? ' idle' : ''}`;
  (document.getElementById('head') as HTMLElement).style.insetInlineStart = `${s.head}%`;
}

/** The four moments of a contact sheet: finger down, mid, release, settled. */
export function keyFrames(frames: FrameInfo[]): KeyFrames | null {
  // The strokes, as [down edge, up edge]. The sheet shows the longest one (the hold, when a clip taps then holds).
  const strokes: [number, number][] = [];
  frames.forEach((f, i) => {
    if (f.edge === 'down') strokes.push([i, frames.length - 1]);
    if (f.edge === 'up' && strokes.length > 0) strokes[strokes.length - 1]![1] = i;
  });
  if (strokes.length === 0) return null;
  const [down, up] = strokes.reduce((best, s) => (s[1] - s[0] > best[1] - best[0] ? s : best));
  const mid = Math.round((down + up) / 2);
  // Settled: the first frame after the lift from which the screen stays the same until the next stroke or the end.
  const next = strokes.find((s) => s[0] > up)?.[0] ?? frames.length;
  let settled = next - 1;
  while (settled > up && frames[settled - 1]!.hash === frames[settled]!.hash) settled -= 1;
  return { down, mid, up, settled: Math.max(settled, up) };
}

/** The page of a contact sheet: four composed frames side by side with what they are. */
export function sheetHtml(opts: { title: string; sub: string; cells: { src: string; label: string; time: string }[]; cellWidth: number; dark: boolean }): string {
  const cells = opts.cells
    .map((c) => `<figure><img src="${escapeHtml(c.src)}" alt=""><figcaption><b>${escapeHtml(c.label)}</b> ${escapeHtml(c.time)}</figcaption></figure>`)
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
html,body{background:${opts.dark ? '#0d0e10' : '#202226'};color:#f2f3f5;font:13px/1.35 Inter,system-ui,sans-serif}
main{padding:12px;display:inline-block}
h1{font-size:15px;font-weight:650}
p{color:#c6cad1;margin-block:2px 10px}
.row{display:flex;gap:10px}
figure{inline-size:${opts.cellWidth}px}
img{display:block;inline-size:100%}
figcaption{margin-block-start:4px;font-size:13px}
</style></head><body><main><h1>${escapeHtml(opts.title)}</h1><p>${escapeHtml(opts.sub)}</p><div class="row">${cells}</div></main></body></html>`;
}
