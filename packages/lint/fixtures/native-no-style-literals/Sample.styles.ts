// Fixture for ds/native-no-style-literals in a styles file. Lines 8, 9, 11, 12, 13 and 18 fail.
import { StyleSheet } from 'react-native';
import type { Theme } from '@the-system/tokens/native';

type Tone = 'red' | 'neutral';

export function createSampleStyles(theme: Theme, tone: Tone) {
  const PAD = 12;
  const ink = '#111827';
  return StyleSheet.create({
    root: { padding: 8, gap: theme.space.s, borderWidth: 1, margin: 0, width: '100%', flex: 2, opacity: 0.5 },
    label: { color: tone === 'red' ? theme.color.state.danger.text : theme.color.text.default, letterSpacing: '0.5px', textAlign: 'center' },
    edge: { borderColor: 'rgba(0, 0, 0, 0.2)', backgroundColor: 'transparent' },
    mirror: { transform: [{ scaleX: -1 }] },
    fine: { paddingStart: PAD === 0 ? 0 : theme.space.m, borderRadius: theme.radius.sm, minHeight: theme.size['target-min'] },
  });
}
export const scale = { md: 32 };
