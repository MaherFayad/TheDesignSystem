// Fixture for ds/native-no-style-literals. Lines 6, 7, 8, 9, 10, 14 and 19 fail.
import { Pressable, StyleSheet, View } from 'react-native';
export function Sample({ theme }: { theme: Theme }) {
  return (
    <View
      style={{ padding: 12,
        backgroundColor: '#ffffff',
        shadowOffset: { width: 0, height: 2 },
        borderRadius: -4,
        color: 'red',
        flex: 1, opacity: 0.5, margin: 0, width: '100%', gap: theme.space[2] }}
    >
      <Pressable style={({ pressed }) => [styles.root, { opacity: pressed ? 0.8 : 1 }]} />
      <View contentContainerStyle={{ marginTop: 8 }} />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { fontSize: 16 },
});
