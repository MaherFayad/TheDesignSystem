// Captures one iOS test screen in every frame (order M10.0), so every screen
// order saves the same set of pictures.
//
//   npx tsx apps/gallery-react/src/ios-screens/capture.ts <id> [--out dir]
//       [--url http://localhost:5173] [--styles liquid,neutral]
//       [--schemes light,dark] [--frames phone,duo-outer-portrait-full,...]
//       [--arabic once|all|none] [--scale 1]
//
// For each style, scheme and frame it opens /screens/ios/<id> at chrome=0
// with that frame, waits for the screen inside the frame's iframe and its
// fonts, and saves the frame's display (the screen with the drawn camera,
// home bar and Safari chrome, without the device body) as
// <id>-<frame>-<style>-<scheme>.png. Arabic: `once` (the default) adds the
// phone in the first style, light, as <id>-phone-<style>-light-ar.png;
// `all` repeats every shot in Arabic; `none` adds nothing.
//
// The default set is Liquid and Neutral, light and dark, at the five frames
// of frames.ts DEFAULT_VARIANT_KEYS: 20 pictures and the Arabic one. Reduced
// motion, device scale factor 1 (--scale changes it). Without --url it starts
// the React gallery on a free port and stops it at the end. The default
// output folder is outside git: node_modules/.cache/ios-screens/<id>/.
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { launchGallery, type Gallery } from '../../../../packages/contract-tests/src/server';
import { DEFAULT_VARIANT_KEYS, variantByKey, variantQuery, type FrameVariant } from './frames';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

interface Args {
  id: string;
  out: string;
  url?: string;
  styles: string[];
  schemes: string[];
  variants: FrameVariant[];
  arabic: 'once' | 'all' | 'none';
  scale: number;
}

function list(value: string | undefined, fallback: readonly string[]): string[] {
  return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [...fallback];
}

function parseArgs(argv: string[]): Args {
  const flags = new Map<string, string>();
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    if (arg.startsWith('--')) {
      flags.set(arg.slice(2), argv[i + 1] ?? '');
      i += 1;
    } else positional.push(arg);
  }
  const id = positional[0];
  if (!id || !/^[a-z0-9-]+$/.test(id)) throw new Error('Give a screen id, for example: npx tsx apps/gallery-react/src/ios-screens/capture.ts music-library');
  const variants = list(flags.get('frames'), DEFAULT_VARIANT_KEYS).map((key) => {
    const v = variantByKey(key);
    if (!v) throw new Error(`No frame called ${key}.`);
    return v;
  });
  const arabic = flags.get('arabic') ?? 'once';
  if (arabic !== 'once' && arabic !== 'all' && arabic !== 'none') throw new Error('--arabic is once, all or none.');
  const scale = Number(flags.get('scale') ?? 1);
  return {
    id,
    out: resolve(flags.get('out') ?? join(repo, 'node_modules/.cache/ios-screens', id)),
    url: flags.get('url'),
    styles: list(flags.get('styles'), ['liquid', 'neutral']),
    schemes: list(flags.get('schemes'), ['light', 'dark']),
    variants,
    arabic,
    scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
  };
}

interface Shot {
  file: string;
  style: string;
  scheme: string;
  variant: FrameVariant;
  ar: boolean;
}

function plan(args: Args): Shot[] {
  const shots: Shot[] = [];
  const add = (style: string, scheme: string, variant: FrameVariant, ar: boolean) =>
    shots.push({ file: `${args.id}-${variant.key}-${style}-${scheme}${ar ? '-ar' : ''}.png`, style, scheme, variant, ar });
  for (const style of args.styles) for (const scheme of args.schemes) for (const v of args.variants) add(style, scheme, v, false);
  if (args.arabic === 'all') for (const style of args.styles) for (const scheme of args.schemes) for (const v of args.variants) add(style, scheme, v, true);
  const phone = variantByKey('phone');
  if (args.arabic === 'once' && phone && args.styles[0]) add(args.styles[0], 'light', phone, true);
  return shots;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.out, { recursive: true });
  let gallery: Gallery | undefined;
  const browser = await chromium.launch();
  try {
    gallery = args.url ? { url: args.url.replace(/\/+$/, ''), close: () => undefined } : await launchGallery(repo, 'react');
    // Big enough for the widest frame with its body, so the display is never cut.
    const context = await browser.newContext({ viewport: { width: 1280, height: 1200 }, deviceScaleFactor: args.scale, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const shot of plan(args)) {
      const q = new URLSearchParams({ style: shot.style, scheme: shot.scheme, ...variantQuery(shot.variant), chrome: '0' });
      if (shot.ar) {
        q.set('lang', 'ar');
        q.set('dir', 'rtl');
      }
      await page.goto(`${gallery.url}/screens/ios/${args.id}?${q.toString()}`);
      const display = page.locator(`[data-gallery='ios-display'][data-variant='${shot.variant.key}']`);
      await display.waitFor();
      const frame = page.frameLocator(`[data-gallery='ios-display'][data-variant='${shot.variant.key}'] iframe`);
      await frame.locator(`[data-gallery='ios-screen-theme'][data-ios-screen='${args.id}']`).waitFor({ timeout: 30_000 });
      const inner = page.frames().find((f) => f.url().includes(`/screens/ios/${args.id}/screen`));
      // Fonts loaded and two frames painted, inside the iframe and on the page.
      const settle = () =>
        document.fonts.ready.then(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
      if (inner) await inner.evaluate(settle);
      await page.evaluate(settle);
      const path = join(args.out, shot.file);
      await display.screenshot({ path, animations: 'disabled' });
      console.log(`saved ${path}`);
    }
    await context.close();
  } finally {
    await browser.close();
    gallery?.close();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
