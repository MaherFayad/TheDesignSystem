import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTokens, flatten, type ContractGroup, type TokenMap } from '../../../tokens/build';
import { checkContract, contractEntries, contractModes, type ContractMode } from '../rules/contract-filled';
import { ROOT, format } from './harness';

const built = buildTokens();
const modes = contractModes(built.modes);

describe('gate ds/contract-filled: every contract name filled in every style and scheme', () => {
  it('reads the contract and every discovered style and scheme', () => {
    expect(contractEntries(built.contract).length).toBeGreaterThan(300);
    expect(modes.map((m) => m.id)).toEqual(expect.arrayContaining(['studio.dark', 'studio.light', 'desk.dark', 'desk.light']));
  });

  it('every name resolves to a concrete value of its type, and no style invents a semantic name', () => {
    expect(format(checkContract(modes, built.contract)), 'fill the name in the style, or add the name to packages/tokens/src/contract.json').toEqual([]);
  });
});

describe('gate ds/contract-filled: fixture', () => {
  const read = (p: string): unknown => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
  const contract = (read('packages/lint/fixtures/contract-filled/contract.json') as { groups: ContractGroup[] }).groups;
  const file = 'packages/lint/fixtures/contract-filled/tokens.dark.json';
  const own: TokenMap = flatten(read(file), file);
  const fake: ContractMode = { id: 'fake.dark', own, all: own, file };

  it('fails on a missing name, a broken alias, a wrong type and invented semantic names', () => {
    const found = checkContract([fake], contract);
    expect(found.every((f) => f.ruleId === 'ds/contract-filled' && f.file === file)).toBe(true);
    expect(found.map((f) => f.message.split(' ').slice(0, 2).join(' '))).toEqual([
      'fake.dark: color.bg.surface:',
      'fake.dark: color.bg.surface-2',
      'fake.dark: color.text.muted',
      'fake.dark: color.bg.extra',
      'fake.dark: color.brand.ink',
    ]);
    expect(found[0]?.message).toMatch(/does not resolve/);
    expect(found[1]?.message).toMatch(/has no value/);
    expect(found[2]?.message).toMatch(/resolves to a dimension/);
    expect(found[3]?.message).toMatch(/does not list/);
  });
});
