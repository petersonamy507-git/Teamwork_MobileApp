import type { ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { AppButton } from '../ui/AppButton';
import { AppIcon } from '../ui/AppIcon';
import { AppText } from '../ui/AppText';

/**
 * Shown in place of a screen that threw while rendering. Without it a render error closes the whole
 * app in release builds; with it only that screen is replaced, and the header back button still works.
 */
export function ScreenCrash({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <AppIcon name="warning-outline" size={40} />
      <AppText variant="heading">Something went wrong</AppText>
      <AppText tone="muted" style={{ textAlign: 'center' }}>
        {error?.message || 'This screen could not be shown.'}
      </AppText>
      <AppButton title="Try again" variant="secondary" onPress={() => void retry()} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
});
