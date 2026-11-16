// The gallery build keeps every `:dir()` selector of its source
// (wave-1-followups.md, round 5 item 1). It builds the React gallery into a
// temporary folder, counts `:dir(rtl)` and `:dir(ltr)` in the CSS it wrote,
// and compares that with the CSS the gallery imports. A second build with a
// CSS target older than `:dir()` support proves the gate fails when the
// minifier rewrites the selector.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { countDir, countFiles, cssEntries, cssImportGraph, dirLoss, type DirCounts } from '../dir-selectors';
import { ROOT, fixture } from './harness';

const GALLERY = join(ROOT, 'apps/gallery-react');
const temps: string[] = [];

afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

/**
 * Builds the gallery with its own vite.config.ts into a new temporary folder
 * and returns the `:dir()` count of the CSS it wrote. `cssTarget` replaces
 * the config's target, for the failing case.
 */
function buildGallery(cssTarget?: string[]): DirCounts {
  const outDir = mkdtempSync(join(tmpdir(), 'ds-dir-gate-'));
  temps.push(outDir);
  const script = `
    import { build, loadConfigFromFile } from 'vite';
    const [root, outDir, target] = JSON.parse(process.argv[1]);
    const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, root + '/vite.config.ts', root);
    const config = loaded.config;
    config.build = { ...config.build, outDir, emptyOutDir: true, reportCompressedSize: false, ...(target ? { cssTarget: target } : {}) };
    await build({ ...config, root, configFile: false, logLevel: 'error' });
  `;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', script, JSON.stringify([GALLERY, outDir, cssTarget ?? null])], {
    cwd: GALLERY,
    encoding: 'utf8',
    env: { ...process.env, GALLERY_BASE: '/' },
  });
  if (res.status !== 0) throw new Error(`gallery build failed:\n${res.stderr || res.stdout}`);
  const assets = join(outDir, 'assets');
  const css = readdirSync(assets).filter((f) => f.endsWith('.css')).map((f) => join(assets, f));
  expect(css.length, 'the build writes CSS').toBeGreaterThan(0);
  return countFiles(css);
}

describe('gate: the gallery build keeps every :dir() selector of its source', () => {
  const entries = cssEntries(GALLERY);
  const sourceFiles = cssImportGraph(entries);
  const source = countFiles(sourceFiles);

  it('reads the source the gallery imports: tokens, the system CSS, the styles and the shell', () => {
    const rel = sourceFiles.map((f) => f.slice(ROOT.length));
    expect(rel).toEqual(
      expect.arrayContaining([
        'packages/css/src/index.css',
        'packages/css/src/components/Slider.css',
        'packages/styles/index.css',
        'packages/styles/studio/index.css',
        'apps/gallery-react/src/gallery.css',
      ]),
    );
    expect(source.rtl, 'the source uses :dir(rtl)').toBeGreaterThan(50);
  });

  it('passes on the gallery as configured', () => {
    const output = buildGallery();
    expect(dirLoss(source, output), `source ${JSON.stringify(source)}, output ${JSON.stringify(output)}`).toEqual([]);
  }, 180_000);

  it('fails on a build with a CSS target older than :dir() support', () => {
    const output = buildGallery(['chrome100', 'safari15']);
    expect(output.rtl).toBeLessThan(source.rtl);
    expect(dirLoss(source, output)[0]).toMatch(/^:dir\(rtl\): the source has \d+, the build output \d+\./);
  }, 180_000);

  it('counts the fixtures: comments left out, imports followed, a rewrite caught', () => {
    const graph = cssImportGraph([join(ROOT, 'packages/lint/fixtures/dir-selectors/source.css')]);
    expect(graph.map((f) => f.slice(f.lastIndexOf('/') + 1))).toEqual(['source.css', 'nested.css']);
    const src = countFiles(graph);
    expect(src).toEqual({ rtl: 3, ltr: 1 });
    expect(dirLoss(src, countDir(fixture('dir-selectors/output-kept.css').content))).toEqual([]);
    expect(dirLoss(src, countDir(fixture('dir-selectors/output-rewritten.css').content))).toEqual([
      ':dir(rtl): the source has 3, the build output 1. Set build.cssTarget to versions that support :dir().',
      ':dir(ltr): the source has 1, the build output 0. Set build.cssTarget to versions that support :dir().',
    ]);
  });
});
