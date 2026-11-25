import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './tokens';

/** Dark is the default, as in the reference app; users can switch in Settings › Appearance. */
export type Appearance = 'dark' | 'light' | 'system';
type Theme = { colors: ThemeColors; dark: boolean; appearance: Appearance; setAppearance: (a: Appearance) => void };

const KEY = 'crewdesk_appearance';
const ThemeCtx = createContext<Theme>({ colors: darkColors, dark: true, appearance: 'dark', setAppearance: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [appearance, setState] = useState<Appearance>('dark');

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => {
        if (v === 'dark' || v === 'light' || v === 'system') setState(v);
      })
      .catch(() => {});
  }, []);

  const setAppearance = useCallback((a: Appearance) => {
    setState(a);
    SecureStore.setItemAsync(KEY, a).catch(() => {});
  }, []);

  const value = useMemo<Theme>(() => {
    const dark = appearance === 'system' ? scheme !== 'light' : appearance === 'dark';
    return { dark, colors: dark ? darkColors : lightColors, appearance, setAppearance };
  }, [scheme, appearance, setAppearance]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
