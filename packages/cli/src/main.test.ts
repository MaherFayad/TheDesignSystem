import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { add, type AddData } from './commands/add';
import { run } from './main';
import { REPO } from './manifests';

/** A small repo with Angular and native packages, read by the snapshots of `ds add`. */
const FIXTURE = join(import.meta.dirname, '../fixtures/repo');

interface Envelope {
  apiVersion: number;
  type: string;
  data: Record<string, unknown>;
}

async function ds(args: string[], cwd = REPO): Promise<{ code: number; json: Envelope; stderr: string }> {
  let out = '';
  let err = '';
  const code = await run([...args, '--json'], { cwd, out: (s) => (out += s), err: (s) => (err += s) });
  return { code, json: JSON.parse(out) as Envelope, stderr: err };
}

const temp = mkdtempSync(join(tmpdir(), 'ds-cli-'));
afterAll(() => rmSync(temp, { recursive: true, force: true }));

function app(name: string): string {
  const dir = join(temp, name);
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, dependencies: { react: '^19.0.0', 'radix-ui': '^1.8.1' } }));
  return dir;
}

describe('ds --json', () => {
  it('help and version', async () => {
    const help = await ds(['--help']);
    expect(help.code).toBe(0);
    expect(help.json.type).toBe('help');
    expect((await ds(['--version'])).json).toMatchSnapshot();
  });

  it('search', async () => {
    const r = await ds(['search', 'keyboard', 'shortcut']);
    expect(r.code).toBe(0);
    expect(r.json.type).toBe('search.results');
    const results = r.json.data.results as { name: string }[];
    expect(results[0]?.name).toBe('Kbd');
    expect({ ...r.json, data: { ...r.json.data, results: results.slice(0, 3) } }).toMatchSnapshot();
  });

  it('search with a framework keeps components ready there', async () => {
    const r = await ds(['search', 'button', '--framework', 'angular']);
    const results = r.json.data.results as { frameworks: { angular: string } }[];
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((x) => x.frameworks.angular === 'ready')).toBe(true);
  });

  it('docs', async () => {
    const r = await ds(['docs', 'kbd']);
    expect(r.code).toBe(0);
    expect(r.json).toMatchSnapshot();
  });

  it('manifest', async () => {
    const r = await ds(['manifest', 'Kbd']);
    expect(r.code).toBe(0);
    expect(r.json.type).toBe('manifest');
    expect(r.json.data).toEqual(JSON.parse(readFileSync(join(REPO, 'packages/manifest/src/component/Kbd.manifest.json'), 'utf8')));
  });

  it('add, react: writes the registry item and its dependencies, then changes nothing on a second run', async () => {
    const dir = app('react-app');
    const first = await ds(['add', 'kbd', '--framework', 'react'], dir);
    expect(first.code).toBe(0);
    const files = first.json.data.files as { path: string; status: string }[];
    expect(files.every((f) => f.status === 'written')).toBe(true);
    expect(files.map((f) => f.path)).toEqual(
      expect.arrayContaining(['src/components/ds/react/components/Kbd/index.ts', 'src/components/ds/css/components/Kbd.css', 'src/components/ds/ds.css', 'src/components/ds/style-studio.css', 'ds.doctor.json']),
    );
    const { files: _files, ...rest } = first.json.data;
    expect({ ...first.json, data: rest }).toMatchSnapshot();

    const second = await ds(['add', 'kbd', '--framework', 'react'], dir);
    expect((second.json.data.files as { status: string }[]).every((f) => f.status === 'unchanged')).toBe(true);

    writeFileSync(join(dir, 'src/components/ds/ds.css'), '/* edited */\n');
    const third = await ds(['add', 'kbd', '--framework', 'react'], dir);
    expect(third.code).toBe(1);
    expect((third.json.data.files as { path: string; status: string }[]).filter((f) => f.status === 'conflict')).toEqual([{ path: 'src/components/ds/ds.css', status: 'conflict' }]);
  });

  // The snapshots of the copy path read the fixture repo, so a merge in
  // packages/angular or packages/native never changes them. The real packages
  // are checked for shape and a few known files only.
  it('add, angular, fixture: copies the folder and what it imports, without specs and demos', async () => {
    const dir = app('angular-fixture-app');
    const r = await add({ name: 'button', framework: 'angular', cwd: dir, dryRun: true, repo: FIXTURE });
    expect(r.exitCode).toBe(0);
    expect(r.envelope).toMatchSnapshot();

    const written = await add({ name: 'button', framework: 'angular', cwd: dir, repo: FIXTURE });
    expect((written.envelope.data as AddData).files.every((f) => f.status === 'written')).toBe(true);
    expect(readFileSync(join(dir, 'src/ds/angular/components/button/button-base.ts'), 'utf8')).toBe(
      readFileSync(join(FIXTURE, 'packages/angular/src/components/button/button-base.ts'), 'utf8'),
    );
  });

  it('add, native, fixture', async () => {
    const r = await add({ name: 'IconButton', framework: 'native', cwd: app('native-fixture-app'), dryRun: true, repo: FIXTURE });
    expect(r.exitCode).toBe(0);
    expect(r.envelope).toMatchSnapshot();
  });

  it.each([
    ['angular', 'button', ['src/ds/angular/components/button/index.ts', 'src/ds/angular/components/button/button.ts', 'src/ds/angular/theme/theme.ts']],
    ['native', 'IconButton', ['src/ds/native/components/IconButton/index.ts', 'src/ds/native/components/IconButton/IconButton.tsx']],
  ] as const)('add, %s, real package: the shape and a few known files', async (fw, name, known) => {
    const r = await ds(['add', name, '--framework', fw, '--dry-run'], app(`${fw}-app`));
    expect(r.code).toBe(0);
    expect(r.json.type).toBe('add.result');
    const files = r.json.data.files as { path: string; status: string }[];
    expect(files.map((f) => f.path)).toEqual(expect.arrayContaining([...known]));
    expect(files.map((f) => f.path)).toEqual([...files.map((f) => f.path)].sort());
    for (const f of files) {
      expect(f.status, f.path).toBe('planned');
      expect(f.path.startsWith(`src/ds/${fw}/`), f.path).toBe(true);
      expect(f.path, f.path).not.toMatch(/\.(spec|test|demo)\.tsx?$/);
    }
    const { files: _files, ...rest } = r.json.data;
    expect(rest).toMatchObject({ framework: fw, install: null, shadcn: null });
  });

  it('style list', async () => {
    const r = await ds(['style', 'list']);
    expect(r.code).toBe(0);
    expect(r.json).toMatchSnapshot();
  });

  it.each(['studio', 'desk', 'neutral'])('style check %s passes', async (id) => {
    const r = await ds(['style', 'check', id]);
    expect(r.code).toBe(0);
    const checks = r.json.data.checks as { id: string; ok: boolean; checked: number; findings: string[] }[];
    for (const c of checks) expect(c.checked, c.id).toBeGreaterThan(0);
    expect({ ...r.json, data: { ...r.json.data, checks: checks.map((c) => ({ id: c.id, ok: c.ok, findings: c.findings })) } }).toMatchSnapshot();
  });

  it('doctor is the checker of order 1.12', async () => {
    const r = await ds(['doctor', 'examples/consumer-vite']);
    expect(r.code).toBe(0);
    expect(r.json.type).toBe('doctor.report');
    expect(r.json.data.summary).toMatchObject({ errors: 0 });
  });

  it('errors carry a stable code and exit 2', async () => {
    const cases: [string[], string][] = [
      [['docs', 'Buton'], 'DS_E_NOT_FOUND'],
      [['add', 'Button'], 'DS_E_FRAMEWORK'],
      [['add', 'Button', '--framework', 'vue'], 'DS_E_FRAMEWORK'],
      [['add', 'Tabs', '--framework', 'angular'], 'DS_E_NOT_READY'],
      [['add', 'Window', '--framework', 'native'], 'DS_E_FRAMEWORK'],
      [['style', 'check', 'paper'], 'DS_E_STYLE'],
      [['nothing'], 'DS_E_USAGE'],
      [['search'], 'DS_E_USAGE'],
    ];
    const seen = [];
    for (const [args, code] of cases) {
      const r = await ds(args);
      expect(r.code, args.join(' ')).toBe(2);
      expect(r.json.type).toBe('error');
      expect(r.json.data.code, args.join(' ')).toBe(code);
      seen.push(r.json);
    }
    expect(seen).toMatchSnapshot();
  });
});
