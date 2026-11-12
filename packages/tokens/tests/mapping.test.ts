// No source token is dropped: every name in the committed fixture (the --st-*
// tokens of GoBanana studio-tokens.css) has a row in token-mapping.md, and every
// new name a row points at exists in the token build.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTokens } from '../build';

const root = join(import.meta.dirname, '..', '..', '..');
const fixture = JSON.parse(readFileSync(join(import.meta.dirname, 'source-tokens.json'), 'utf8')) as { names: string[] };
const doc = readFileSync(join(root, 'docs/contracts/token-mapping.md'), 'utf8');

const rows = new Map<string, string[]>();
for (const line of doc.split('\n')) {
  const m = /^\| `(--st-[\w-]+)` \| ([^|]+) \|/.exec(line);
  if (!m) continue;
  rows.set(m[1]!, [...m[2]!.matchAll(/`([^`]+)`/g)].map((x) => x[1]!));
}

describe('token mapping', () => {
  it('the fixture lists the source tokens', () => {
    expect(fixture.names.length).toBe(427);
    expect(new Set(fixture.names).size).toBe(fixture.names.length);
  });

  it('every source token has a row', () => {
    const missing = fixture.names.filter((n) => !rows.has(n));
    expect(missing).toEqual([]);
  });

  it('has no row for a name that is not in the source', () => {
    const extra = [...rows.keys()].filter((n) => !fixture.names.includes(n));
    expect(extra).toEqual([]);
  });

  it('every row points at a token that exists', () => {
    const result = buildTokens({ root });
    const known = new Set<string>(result.base.keys());
    for (const m of result.modes) for (const k of m.own.keys()) known.add(k);
    for (const [old, news] of rows) {
      expect(news.length, old).toBeGreaterThan(0);
      for (const n of news) expect(known.has(n), `${old} -> ${n}`).toBe(true);
    }
  });
});
