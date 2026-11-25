import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AppIcon } from './AppIcon';

export function AppCheckbox({ checked, onToggle, label, disabled }: { checked: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={10}
      onPress={onToggle}
      style={[
        styles.box,
        { borderColor: checked ? colors.success : colors.textMuted, backgroundColor: checked ? colors.success : 'transparent', opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {checked ? <AppIcon name="checkmark" size={15} color="#fff" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
