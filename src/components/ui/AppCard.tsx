import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';

type Props = ViewProps & { onPress?: () => void; style?: StyleProp<ViewStyle>; accessibilityLabel?: string };

export function AppCard({ onPress, style, children, accessibilityLabel, ...rest }: Props) {
  const { colors } = useTheme();
  const base = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style];
  if (!onPress)
    return (
      <View style={base} {...rest}>
        {children}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.8 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg },
});
