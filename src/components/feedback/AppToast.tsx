import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../../theme';
import { AppText } from '../ui/AppText';

type Toast = { text: string; tone: 'info' | 'error' };
const ToastCtx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, tone: Toast['tone'] = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ text, tone });
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
      }, 2600);
    },
    [opacity],
  );

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { bottom: insets.bottom + 80, opacity, backgroundColor: toast.tone === 'error' ? '#b42339' : '#2b2f3d' }]}
        >
          <AppText style={{ color: '#fff' }}>{toast.text}</AppText>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: spacing.lg, right: spacing.lg, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});
