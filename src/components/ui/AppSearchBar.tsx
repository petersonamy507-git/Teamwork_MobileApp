import { StyleSheet, TextInput, View } from 'react-native';
import { fontSize, MAX_FONT_SCALE, radius, spacing, useTheme } from '../../theme';
import { AppIcon } from './AppIcon';

export function AppSearchBar({ value, onChangeText, placeholder = 'Search' }: { value: string; onChangeText: (v: string) => void; placeholder?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface }]}>
      <AppIcon name="search" size={18} />
      <TextInput
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    height: 44,
  },
  input: { flex: 1, fontSize: fontSize.md, height: '100%' },
});
