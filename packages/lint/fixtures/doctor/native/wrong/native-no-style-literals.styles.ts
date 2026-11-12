// ds/native-no-style-literals in a styles file: a size literal.
import { StyleSheet } from 'react-native';
import type { Theme } from '@the-system/tokens/native';

export const createCardStyles = (theme: Theme) => StyleSheet.create({ root: { padding: 12, gap: theme.space.s } });
