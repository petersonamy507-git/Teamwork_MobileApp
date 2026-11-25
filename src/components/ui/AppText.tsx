import { Text, type TextProps, type TextStyle } from 'react-native';
import { fontSize, MAX_FONT_SCALE, useTheme } from '../../theme';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'muted' | 'accent' | 'danger' | 'success' | 'onAccent';

const variants: Record<Variant, TextStyle> = {
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  heading: { fontSize: fontSize.lg, fontWeight: '600' },
  body: { fontSize: fontSize.md },
  label: { fontSize: fontSize.sm, fontWeight: '600' },
  caption: { fontSize: fontSize.xs },
};

export type AppTextProps = TextProps & { variant?: Variant; tone?: Tone; weight?: TextStyle['fontWeight'] };

export function AppText({ variant = 'body', tone = 'default', weight, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    accent: colors.accent,
    danger: colors.danger,
    success: colors.success,
    onAccent: colors.onAccent,
  }[tone];
  return <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[variants[variant], { color }, weight ? { fontWeight: weight } : null, style]} {...rest} />;
}
