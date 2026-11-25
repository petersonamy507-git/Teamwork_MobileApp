import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';

/** Pulsing placeholder rows shown while a list loads for the first time. */
export function AppSkeleton({ rows = 6 }: { rows?: number }) {
  const { colors } = useTheme();
  const [pulse] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.wrap} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <Animated.View key={i} style={[styles.row, { opacity: pulse, backgroundColor: colors.surface }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.md },
  row: { height: 52, borderRadius: radius.md },
});
