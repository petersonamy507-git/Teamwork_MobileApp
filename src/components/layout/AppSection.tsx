import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { AppIcon } from '../ui/AppIcon';
import { AppText } from '../ui/AppText';

/** Titled block on a screen, e.g. "Views", "Recents" on Home, with an optional "see all" arrow. */
export function AppSection({ title, onMore, children }: { title: string; onMore?: () => void; children: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText variant="label" accessibilityRole="header" style={{ fontSize: 15 }}>
          {title}
        </AppText>
        {onMore ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`See all ${title}`} hitSlop={10} onPress={onMore}>
            <AppIcon name="arrow-forward" size={20} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
