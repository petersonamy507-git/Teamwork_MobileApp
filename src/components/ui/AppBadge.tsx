import { StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';

/** Small status label. `color` tints the dot; without it the badge uses the accent colours. */
export function AppBadge({ label, color }: { label: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: color ? colors.surfaceAlt : colors.accentSoft }]}>
      {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <AppText variant="caption" weight="600" style={{ color: color ? colors.text : colors.accent }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
