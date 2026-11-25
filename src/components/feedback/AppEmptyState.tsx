import { StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { AppIcon, type IconName } from '../ui/AppIcon';
import { AppText } from '../ui/AppText';

export function AppEmptyState({ icon = 'file-tray-outline', title, message }: { icon?: IconName; title: string; message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.surface }]}>
        <AppIcon name={icon} size={36} />
      </View>
      <AppText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {message ? (
        <AppText tone="muted" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.sm, minHeight: 320 },
  icon: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
});
