import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { AppButton } from '../ui/AppButton';
import { AppIcon } from '../ui/AppIcon';
import { AppText } from '../ui/AppText';

export function AppErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <AppIcon name="cloud-offline-outline" size={40} />
      <AppText variant="heading">{"Couldn't load this"}</AppText>
      <AppText tone="muted" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {onRetry ? <AppButton title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md, minHeight: 320 },
});
