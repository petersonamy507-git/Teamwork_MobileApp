import type { Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { fontSize, MAX_FONT_SCALE, radius, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';

export type AppInputProps = Omit<TextInputProps, 'ref'> & { label?: string; error?: string | null; ref?: Ref<TextInputInstance> };

export function AppInput({ label, error, style, multiline, ref, ...rest }: AppInputProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="label" tone="muted">
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        accessibilityLabel={label ?? rest.placeholder}
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

/** Multi-line variant of AppInput. */
export function AppTextArea(props: AppInputProps) {
  return <AppInput multiline textAlignVertical="top" {...props} />;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  input: { minHeight: 46, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: fontSize.md },
  multiline: { minHeight: 110, paddingTop: spacing.md },
});
