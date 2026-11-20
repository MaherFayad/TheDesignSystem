import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DOCTOR_RULES, main, runDoctor, type DoctorReport } from '../doctor';
import { matchesModule } from '../doctor/elements';
import { childrenSlot, contentPart, indexManifests, slotProp } from '../doctor/manifests';
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

describe('ds doctor: slot-limits on wrappers and named props (order T1)', () => {
  const lines = (r: DoctorReport) => r.data.findings.map((f) => `${f.file}:${f.line} ${f.ruleId} ${f.message.split('.')[0]}`);

  it('reads the trigger and the content as the children of a menu, a popover, a dialog, a sheet and an action sheet', async () => {
    const r = await report('wrappers/right');
    expect(r.data.summary.files).toBe(2);
    expect(r.data.summary.skipped).toEqual([]);
    expect(lines(r)).toEqual([]);
  });

  it('still fails a real breach of the content slot and a StatusDot with no name', async () => {
    const r = await report('wrappers/wrong');
    expect(lines(r)).toEqual([
      'Menus.tsx:15 ds/slot-limits <Button> in the DropdownMenu root slot, which takes DropdownMenuQuickActions, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuSub',
      'Menus.tsx:16 ds/slot-limits <div> in the DropdownMenu root slot, which takes DropdownMenuQuickActions, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuSub',
      'Menus.tsx:23 ds/slot-limits DropdownMenuContent holds 13 items; the DropdownMenu root slot takes at most 12',
      'Menus.tsx:43 ds/slot-limits DropdownMenuContent is empty; the DropdownMenu root slot needs at least 1',
      'Menus.tsx:45 ds/slot-limits StatusDot is empty; the StatusDot label slot needs at least 1',
      'menus.html:6 ds/slot-limits <button> in the DropdownMenu root slot, which takes DropdownMenuQuickActions, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuSub',
      'menus.html:9 ds/slot-limits StatusDot is empty; the StatusDot label slot needs at least 1',
    ]);
  });

  it('finds the wrapper from the manifest parts, with no component named in the rule', () => {
    const owner = { name: 'Menu', kind: 'component', parts: { MenuContent: 'root', MenuLabel: 'label' }, slots: { root: { accepts: ['MenuItem'], max: 2 }, label: { accepts: 'text' as const, max: 1 } } };
    const dot = { name: 'Dot', kind: 'component', props: { label: { type: 'node' } }, slots: { label: { accepts: 'text' as const, min: 1 } } };
    const modal = { name: 'Modal', kind: 'component', parts: { ModalContent: 'panel', ModalFooter: 'footer' }, slots: { footer: { accepts: ['Button'], max: 2 } } };
    const index = indexManifests([owner, dot, modal]);
    expect(contentPart(index, 'Menu')).toBe('MenuContent');
    expect(contentPart(index, 'Modal')).toBe('ModalContent');
    expect(contentPart(index, 'Dot')).toBeUndefined();
    expect(childrenSlot(index, 'Menu')).toBeUndefined();
    expect(childrenSlot(index, 'MenuContent')?.slotName).toBe('root');
    expect(childrenSlot(index, 'MenuLabel')?.slotName).toBe('label');
    expect(childrenSlot(index, 'Dot')?.slotName).toBe('label');
    expect(slotProp(dot, 'label')).toBe(true);
    expect(slotProp(owner, 'root')).toBe(false);
  });
});

describe('ds doctor: slot-limits on own parts (order S1)', () => {
  const lines = (r: DoctorReport) => r.data.findings.map((f) => `${f.file}:${f.line} ${f.ruleId} ${f.message.split('.')[0]}`);

  it('takes AlertDialogCancel and AlertDialogAction in the footer, and CardLink and TileLink in their titles', async () => {
    const r = await report('slots/right');
    expect(r.data.summary.files).toBe(1);
    expect(lines(r)).toEqual([]);
  });

  it('still fails a plain element in the footer, two links in a title and a foreign link part', async () => {
    const r = await report('slots/wrong');
    expect(lines(r)).toEqual([
      'Parts.tsx:32 ds/slot-limits <div> in the AlertDialog footer slot, which takes Button, AlertDialogCancel, AlertDialogAction',
      'Parts.tsx:38 ds/slot-limits CardTitle holds 2 items; the Card title slot takes at most 1',
      'Parts.tsx:46 ds/slot-limits <CardLink> in the Tile title slot, which takes text, TileLink',
    ]);
  });
});

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
