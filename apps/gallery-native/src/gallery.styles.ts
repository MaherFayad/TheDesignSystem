// Gallery chrome styles, from the theme like every native style.
import { StyleSheet } from 'react-native';
import type { Theme } from '@the-system/tokens/native';

const cache = new WeakMap<Theme, Map<string, ReturnType<typeof build>>>();

function build(theme: Theme, dir: 'ltr' | 'rtl') {
  const text = { fontFamily: theme.font.family.sans, color: theme.color.text.default, fontSize: theme.font.size.s };
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.color.bg.body },
    scroll: { flex: 1 },
    content: { padding: theme.space.xl, gap: theme.space['3xl'] },
    stage: { direction: dir, gap: theme.space.xl },
    shell: { gap: theme.space.l, paddingBottom: theme.space.xl, borderBottomWidth: theme.border.width.default, borderColor: theme.color.border.subtle },
    group: { gap: theme.space.xs },
    groupLabel: { ...text, color: theme.color.text.muted, fontSize: theme.font.size.xs },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
    note: { ...text, color: theme.color.text.muted, lineHeight: theme.font.size.s * theme.font.leading.normal },
    heading: { ...text, color: theme.color.text.bright, fontSize: theme.font.size['2xl'], fontWeight: String(theme.font.weight.bold) as '700' },
  });
}

export function createGalleryStyles(theme: Theme, dir: 'ltr' | 'rtl') {
  let byDir = cache.get(theme);
  if (!byDir) {
    byDir = new Map();
    cache.set(theme, byDir);
  }
  let hit = byDir.get(dir);
  if (!hit) {
    hit = build(theme, dir);
    byDir.set(dir, hit);
  }
  return hit;
}
