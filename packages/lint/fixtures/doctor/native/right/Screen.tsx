// A screen that follows every rule.
import { Text, View } from 'react-native';
import { Button } from '@the-system/native';
import type { Theme } from '@the-system/tokens/native';

export function Screen({ theme, name }: { theme: Theme; name: string }) {
  return (
    <View style={{ paddingStart: theme.space.l, flex: 1 }}>
      <Text>{name}</Text>
      <Button size="md" tone="accent" emphasis="solid" start="plus">
        Create board
      </Button>
    </View>
  );
}
