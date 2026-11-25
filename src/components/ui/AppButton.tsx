import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { AppIcon, type IconName } from './AppIcon';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type AppButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ title, variant = 'primary', loading, disabled, icon, style, ...rest }: AppButtonProps) {
  const { colors } = useTheme();
  const bg = { primary: colors.accent, secondary: colors.surface, ghost: 'transparent', danger: colors.danger }[variant];
  const fg = variant === 'primary' || variant === 'danger' ? colors.onAccent : variant === 'ghost' ? colors.accent : colors.text;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.base, { backgroundColor: bg, opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1 }, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <AppIcon name={icon} size={18} color={fg} /> : null}
          <AppText variant="label" style={{ color: fg, fontSize: 15 }}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 46, borderRadius: radius.pill, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
