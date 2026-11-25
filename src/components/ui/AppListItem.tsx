import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { AppIcon, type IconName } from './AppIcon';
import { AppText } from './AppText';

type Props = {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  icon?: IconName;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  chevron?: boolean;
};

/** Standard tappable row used by every list (projects, messages, files, settings…). */
export function AppListItem({ title, subtitle, meta, icon, left, right, onPress, onLongPress, chevron }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, subtitle, meta].filter(Boolean).join(', ')}
      disabled={!onPress}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}
    >
      {left ?? (icon ? <AppIcon name={icon} size={22} /> : null)}
      <View style={styles.body}>
        <AppText numberOfLines={2}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {meta ? (
        <AppText variant="caption" tone="muted">
          {meta}
        </AppText>
      ) : null}
      {right}
      {chevron ? <AppIcon name="chevron-forward" size={18} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
  body: { flex: 1, gap: 2 },
});
