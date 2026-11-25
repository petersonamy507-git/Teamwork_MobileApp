import { Pressable, StyleSheet, Switch } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { AppText } from './AppText';

/** Labelled switch; the whole row is tappable. */
export function AppSwitch({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={styles.row}
    >
      <AppText style={{ flex: 1 }}>{label}</AppText>
      <Switch
        importantForAccessibility="no-hide-descendants"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 } });
