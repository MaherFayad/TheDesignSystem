import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { REPO } from '../manifests';
import { detect } from './detect';
import { END, init, merge, START } from './init';

const temp = mkdtempSync(join(tmpdir(), 'ds-init-'));
afterAll(() => rmSync(temp, { recursive: true, force: true }));

function app(name: string, deps: Record<string, string>, extra?: (dir: string) => void): string {
  const dir = join(temp, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, dependencies: deps }));
  extra?.(dir);
  return dir;
}

const read = (dir: string, f: string) => readFileSync(join(dir, f), 'utf8');

const APPS: Record<string, Record<string, string>> = {
  next: { next: '^16.0.0', react: '^19.0.0', '@the-system/react': '0.0.0' },
  vite: { vite: '^8.0.0', react: '^19.0.0', '@the-system/react': '0.0.0' },
  react: { react: '^19.0.0', '@the-system/react': '0.0.0' },
  angular: { '@angular/core': '^22.0.0', '@the-system/angular': '0.0.0' },
  expo: { expo: '^55.0.0', react: '^19.0.0', 'react-native': '^0.83.0', '@the-system/native': '0.0.0' },
};

describe('ds init', () => {
  it.each(Object.keys(APPS))('writes AGENTS.md and DESIGN.md for %s', (framework) => {
    const dir = app(framework, APPS[framework]!);
    const first = init({ cwd: dir });
    expect(first.envelope.data.framework).toBe(framework);
    expect(first.envelope.data.files.map((f) => f.status)).toEqual(['written', 'written']);
    expect(read(dir, 'AGENTS.md')).toMatchSnapshot('AGENTS.md');
    expect(read(dir, 'DESIGN.md')).toMatchSnapshot('DESIGN.md');

    const second = init({ cwd: dir });
    expect(second.envelope.data.files.map((f) => f.status)).toEqual(['unchanged', 'unchanged']);
  });

  it('detects copied registry files', () => {
    const dir = app('registry', { vite: '^8.0.0', react: '^19.0.0' }, (d) => {
      mkdirSync(join(d, 'src/components/ds'), { recursive: true });
      writeFileSync(join(d, 'src/components/ds/ds.css'), '');
    });
    expect(detect(dir)).toEqual({ framework: 'vite', source: 'registry', registryDir: 'src/components', evidence: ['vite'] });
    init({ cwd: dir });
    expect(read(dir, 'DESIGN.md')).toContain("import './components/ds/ds.css';");
  });

  it('keeps text around the block and replaces only the block', () => {
    const dir = app('kept', APPS.vite!);
    writeFileSync(join(dir, 'AGENTS.md'), '# Team rules\n\nShip on Tuesdays.\n');
    expect(init({ cwd: dir }).envelope.data.files[0]?.status).toBe('updated');
    const once = read(dir, 'AGENTS.md');
    expect(once.startsWith('# Team rules\n\nShip on Tuesdays.\n\n<!-- ds:init start')).toBe(true);
    writeFileSync(join(dir, 'AGENTS.md'), `${once}\nFooter the team wrote.\n`);
    init({ cwd: dir });
    expect(read(dir, 'AGENTS.md')).toBe(`${once}\nFooter the team wrote.\n`);
  });

  it('merge swaps a stale block', () => {
    const old = `top\n\n${START}\n\nold text\n\n${END}\nbottom\n`;
    expect(merge(old, 'new text')).toBe(`top\n\n${START}\n\nnew text\n\n${END}\nbottom\n`);
    expect(merge(old, 'new text', true)).toBe(`${START}\n\nnew text\n\n${END}\n`);
  });

  it('fails with a stable code where it cannot tell the framework', () => {
    const dir = app('none', { lodash: '^4.0.0' });
    expect(() => init({ cwd: dir })).toThrow(expect.objectContaining({ code: 'DS_E_FRAMEWORK' }));
    expect(() => init({ cwd: join(temp, 'missing') })).toThrow(expect.objectContaining({ code: 'DS_E_CONFIG' }));
  });

  it('the files in examples/consumer-vite are what ds init writes', () => {
    // A copy, so the test never writes into the repo.
    const from = join(REPO, 'examples/consumer-vite');
    const to = join(temp, 'consumer-vite');
    mkdirSync(to, { recursive: true });
    for (const f of ['package.json', 'AGENTS.md', 'DESIGN.md']) writeFileSync(join(to, f), readFileSync(join(from, f)));
    const r = init({ cwd: to });
    expect(r.envelope.data.framework).toBe('vite');
    expect(r.envelope.data.files.map((f) => f.status), 'run ds init in examples/consumer-vite').toEqual(['unchanged', 'unchanged']);
  });
});
