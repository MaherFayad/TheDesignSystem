import { StyleSheet } from 'react-native';
import type { Theme } from '@the-system/tokens/native';

export const createScreenStyles = (theme: Theme) =>
  StyleSheet.create({ root: { paddingStart: theme.space.l, borderWidth: 1, width: '100%', backgroundColor: theme.color.bg.surface } });
