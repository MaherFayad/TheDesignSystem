// ds/direction: physical style keys.
import { View } from 'react-native';
import type { Theme } from '@the-system/tokens/native';

export function Row({ theme }: { theme: Theme }) {
  return <View style={{ marginLeft: theme.space.s, paddingEnd: theme.space.s }} />;
}
