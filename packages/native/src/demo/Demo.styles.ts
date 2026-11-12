// Styles of the demo layout: page, case, row. From the theme like every
// native style. Not part of the package API.
import { StyleSheet } from 'react-native';
import type { Theme } from '@the-system/tokens/native';
import { lineHeightOf } from '../theme/units';

type Dir = 'ltr' | 'rtl';

const cache = new WeakMap<Theme, Map<string, ReturnType<typeof build>>>();

function build(theme: Theme, arabic: boolean, dir: Dir) {
  const family = arabic ? theme.font.family.arabic : theme.font.family.sans;
  const leading = arabic ? theme.font.leading.arabic.normal : theme.font.leading.normal;
  const text = (size: number) => ({
    ...(family !== undefined ? { fontFamily: family } : {}),
    fontSize: size,
    lineHeight: lineHeightOf(size, leading),
    writingDirection: dir,
  });
  return StyleSheet.create({
    page: { direction: dir, gap: theme.space['4xl'] },
    case: { direction: dir, gap: theme.space.l },
    title: { ...text(theme.font.size.l), color: theme.color.text.bright, fontWeight: String(theme.font.weight.semibold) as '600' },
    row: { direction: dir, gap: theme.space.xs },
    rowLabel: { ...text(theme.font.size.xs), color: theme.color.text.muted },
    items: { direction: dir, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space.s },
    narrow: { maxWidth: theme.menu.width.min },
  });
}

export function createDemoStyles(theme: Theme, arabic: boolean, dir: Dir) {
  let byKey = cache.get(theme);
  if (!byKey) {
    byKey = new Map();
    cache.set(theme, byKey);
  }
  const key = `${arabic}|${dir}`;
  let hit = byKey.get(key);
  if (!hit) {
    hit = build(theme, arabic, dir);
    byKey.set(key, hit);
  }
  return hit;
}
