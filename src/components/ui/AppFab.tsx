import { Pressable, StyleSheet } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { AppIcon, type IconName } from './AppIcon';

/** Floating action button, bottom-right (Teamwork's "+" button). */
export function AppFab({ onPress, label, icon = 'add' }: { onPress: () => void; label: string; icon?: IconName }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
    >
      <AppIcon name={icon} size={28} color={colors.onAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
