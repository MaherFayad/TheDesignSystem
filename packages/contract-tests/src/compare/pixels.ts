// The pixel probe of a template region: both crops get their text, images
// and named parts painted over, then pixelmatch counts the pixels that
// differ. Pure on PNG buffers, so tolerance.test.ts covers it without a page.
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Paints each box in one flat colour, the same on both sides, so masked areas never count. */
export function paintMasks(png: PNG, boxes: Box[]): void {
  for (const b of boxes) {
    const x0 = Math.max(0, Math.floor(b.x));
    const y0 = Math.max(0, Math.floor(b.y));
    const x1 = Math.min(png.width, Math.ceil(b.x + b.width));
    const y1 = Math.min(png.height, Math.ceil(b.y + b.height));
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * png.width + x) * 4;
        png.data[i] = 255;
        png.data[i + 1] = 0;
        png.data[i + 2] = 255;
        png.data[i + 3] = 255;
      }
    }
  }
}

/** A copy cropped to width by height, so masks never touch the caller's image. */
function cropTo(png: PNG, width: number, height: number): PNG {
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, 0, 0, width, height, 0, 0);
  return out;
}

export interface PixelResult {
  /** Share of the compared pixels that differ, 0 to 1; null when the crops could not be compared. */
  share: number | null;
  differing: number;
  total: number;
  note: string;
}

/**
 * Compares two crops of one region. Crops whose sizes differ by more than
 * `sizeSlack` px are not compared (the box probes already fail them); a
 * smaller difference is cropped away from the end and bottom edges.
 */
export function diffPixels(source: PNG, system: PNG, opts: { threshold: number; sizeSlack: number; masks?: { source: Box[]; system: Box[] } }): PixelResult {
  if (Math.abs(source.width - system.width) > opts.sizeSlack || Math.abs(source.height - system.height) > opts.sizeSlack) {
    return { share: null, differing: 0, total: 0, note: `sizes differ: ${source.width}x${source.height} against ${system.width}x${system.height}` };
  }
  const w = Math.min(source.width, system.width);
  const h = Math.min(source.height, system.height);
  const a = cropTo(source, w, h);
  const b = cropTo(system, w, h);
  if (opts.masks) {
    // Each side's masks go on both crops, so a label that moves still hides on both.
    const all = [...opts.masks.source, ...opts.masks.system];
    paintMasks(a, all);
    paintMasks(b, all);
  }
  const differing = pixelmatch(a.data, b.data, null, w, h, { threshold: opts.threshold });
  const total = w * h;
  return { share: total === 0 ? null : differing / total, differing, total, note: `${differing} of ${total} pixels differ` };
}
