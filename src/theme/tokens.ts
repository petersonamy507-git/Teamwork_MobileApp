/** Design tokens. Accent and status colours come from the Crewdesk web theme (teamwork-theme.css / format.js). */
export const palette = {
  accent: '#4461d7',
  accentDark: '#3c55bd',
  danger: '#e2445c',
  success: '#00b67a',
  warning: '#f59e0b',
  purple: '#8b5cf6',
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  success: string;
  warning: string;
  tabBar: string;
};

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f5f7fa',
  surfaceAlt: '#eef0f5',
  border: '#edeff5',
  text: '#0b0f1f',
  textMuted: '#64697d',
  accent: palette.accent,
  accentSoft: '#d8e0ff',
  onAccent: '#ffffff',
  danger: palette.danger,
  success: palette.success,
  warning: palette.warning,
  tabBar: '#ffffff',
};

/** Dark scheme mirrors the reference mobile screenshots. */
export const darkColors: ThemeColors = {
  background: '#1c1b21',
  surface: '#27262d',
  surfaceAlt: '#34333b',
  border: '#36353d',
  text: '#f2f2f5',
  textMuted: '#a8a7b0',
  accent: '#a9b8ff',
  accentSoft: '#3d4055',
  onAccent: '#0b0f1f',
  danger: '#ff6b81',
  success: '#34d399',
  warning: '#fbbf24',
  tabBar: '#232229',
};

/** Content never stretches wider than this on tablets / foldables; it is centred instead. */
export const CONTENT_MAX_WIDTH = 720;
export const readable = { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' } as const;
/** Upper bound for the system font-size setting, so very large text still fits the layout. */
export const MAX_FONT_SCALE = 1.4;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;
export const fontSize = { xs: 12, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 } as const;
