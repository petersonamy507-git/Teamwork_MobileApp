import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

export function AppLoader({ fill = true }: { fill?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, fill && styles.fill]} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { padding: 24, alignItems: 'center', justifyContent: 'center' }, fill: { flex: 1 } });
