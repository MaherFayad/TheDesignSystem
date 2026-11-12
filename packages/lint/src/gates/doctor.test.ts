import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DOCTOR_RULES, main, runDoctor, type DoctorReport } from '../doctor';
import { matchesModule } from '../doctor/elements';
import { ROOT } from './harness';

const FIXTURES = join(ROOT, 'packages/lint/fixtures/doctor');

/** The rules each framework's wrong fixture must fail, one file per rule. */
const EXPECTED: Record<'react' | 'angular' | 'native', string[]> = {
  react: [
    'ds/no-raw-color', 'ds/no-raw-value', 'ds/token-vocabulary', 'ds/logical-properties', 'ds/direction', 'ds/primitives',
    'ds/no-radix-import', 'ds/touch-target', 'ds/copy', 'ds/no-dash', 'ds/slot-limits', 'ds/shared-axes', 'ds/no-native-title',
  ],
  angular: [
    'ds/no-raw-color', 'ds/no-raw-value', 'ds/token-vocabulary', 'ds/logical-properties', 'ds/direction', 'ds/primitives',
    'ds/touch-target', 'ds/copy', 'ds/no-dash', 'ds/slot-limits', 'ds/shared-axes', 'ds/no-native-title',
  ],
  native: ['ds/direction', 'ds/touch-target', 'ds/copy', 'ds/no-dash', 'ds/slot-limits', 'ds/shared-axes', 'ds/native-no-style-literals'],
};

/** `touch/touch-target.tsx` and `primitives.component.ts` name their rule before the first dot. */
const ruleOfFile = (file: string) => `ds/${(file.split('/').pop() ?? '').split('.')[0]}`;

const reports = new Map<string, DoctorReport>();
async function report(dir: string): Promise<DoctorReport> {
  if (!reports.has(dir)) reports.set(dir, await runDoctor({ path: join(FIXTURES, dir) }));
  return reports.get(dir)!;
}

describe('ds doctor: rules', () => {
  it('every rule has a stable ds/ id and a description', () => {
    for (const r of DOCTOR_RULES) {
      expect(r.id).toMatch(/^ds\/[a-z-]+$/);
      expect(r.description.length).toBeGreaterThan(10);
    }
    expect(new Set(DOCTOR_RULES.map((r) => r.id)).size).toBe(DOCTOR_RULES.length);
  });

  it('every rule is proven by at least one wrong fixture', () => {
    const covered = new Set(Object.values(EXPECTED).flat());
    expect(DOCTOR_RULES.map((r) => r.id).filter((id) => !covered.has(id))).toEqual([]);
  });
});

for (const fw of ['react', 'angular', 'native'] as const) {
  describe(`ds doctor: ${fw} fixtures`, () => {
    it('fails every rule on its wrong fixture, and each file only on its own rule', async () => {
      const r = await report(`${fw}/wrong`);
      expect(Object.keys(r.data.summary.byRule).sort()).toEqual([...EXPECTED[fw]].sort());
      for (const f of r.data.findings) expect(f.ruleId, `${f.file}:${f.line} ${f.message}`).toBe(ruleOfFile(f.file));
      expect(r.data.summary.errors).toBeGreaterThan(0);
    });

    it('passes the right fixture', async () => {
      const r = await report(`${fw}/right`);
      expect(r.data.findings).toEqual([]);
      expect(r.data.summary.skipped).toEqual([]);
    });

    it('matches the JSON snapshot', async () => {
      const r = await report(`${fw}/wrong`);
      await expect(`${JSON.stringify(r, null, 2)}\n`).toMatchFileSnapshot(`./__snapshots__/doctor.${fw}.json`);
    });
  });
}

describe('ds doctor: the examples', () => {
  for (const example of ['consumer-next', 'consumer-vite']) {
    it(`runs clean on examples/${example}`, async () => {
      const r = await runDoctor({ path: join(ROOT, 'examples', example) });
      expect(r.data.summary.files).toBeGreaterThan(3);
      expect(r.data.findings.map((f) => `${f.file}:${f.line} ${f.ruleId} ${f.message}`)).toEqual([]);
    });
  }
});

describe('ds doctor: command line', () => {
  const run = async (args: string[]) => {
    let out = '';
    let err = '';
    const code = await main(args, (s) => (out += s), (s) => (err += s));
    return { code, out, err };
  };

  it('prints the JSON report with apiVersion, type and data, and exits 1 on errors', async () => {
    const { code, out } = await run([join(FIXTURES, 'native/wrong'), '--json']);
    const json = JSON.parse(out) as DoctorReport;
    expect(code).toBe(1);
    expect(json.apiVersion).toBe(1);
    expect(json.type).toBe('doctor.report');
    expect(Object.keys(json.data.findings[0] ?? {})).toEqual(expect.arrayContaining(['ruleId', 'severity', 'file', 'line', 'column', 'message']));
  });

  it('exits 0 on a clean folder and prints text by default', async () => {
    const { code, out } = await run([join(FIXTURES, 'react/right')]);
    expect(code).toBe(0);
    expect(out).toBe('2 files, 0 errors, 0 warnings.\n');
  });

  it('reports a missing path as DS_E_NOT_FOUND with exit 2', async () => {
    const { code, out } = await run([join(FIXTURES, 'no-such-folder'), '--json']);
    expect(code).toBe(2);
    expect(JSON.parse(out)).toEqual({ apiVersion: 1, type: 'error', data: { code: 'DS_E_NOT_FOUND', message: expect.any(String) } });
  });

  it('reports a wrong config as DS_E_CONFIG', async () => {
    const { code, err } = await run([join(FIXTURES, 'bad-config')]);
    expect(code).toBe(2);
    expect(err).toMatch(/^DS_E_CONFIG: .*unknown key "colour"/);
  });

  it('reports a wrong flag as DS_E_USAGE', async () => {
    const { code, err } = await run(['--colour']);
    expect(code).toBe(2);
    expect(err).toMatch(/^DS_E_USAGE: /);
  });

  it('turns a rule off or down through the config', async () => {
    const r = await runDoctor({ path: join(FIXTURES, 'native/wrong'), config: { rules: { 'ds/copy': 'off', 'ds/direction': 'warning' } } });
    expect(r.data.summary.byRule['ds/copy']).toBeUndefined();
    expect(r.data.findings.filter((f) => f.ruleId === 'ds/direction').every((f) => f.severity === 'warning')).toBe(true);
  });
});

describe('ds doctor: system modules', () => {
  const defaults = ['@the-system/react', '**/ds/react/components/*'];

  it('matches the package name and the registry path of copied components', () => {
    expect(matchesModule('@the-system/react', defaults)).toBe(true);
    expect(matchesModule('@/components/ds/react/components/Button', defaults)).toBe(true);
    expect(matchesModule('../ds/react/components/Dialog', defaults)).toBe(true);
  });

  it('does not match other modules or deeper paths', () => {
    expect(matchesModule('@the-system/react-extra', defaults)).toBe(false);
    expect(matchesModule('@/components/ds/react/components/Button/Button', defaults)).toBe(false);
    expect(matchesModule('radix-ui', defaults)).toBe(false);
  });
});
