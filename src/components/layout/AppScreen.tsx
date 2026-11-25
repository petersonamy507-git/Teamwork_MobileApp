import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { readable, spacing, useTheme } from '../../theme';

type Props = {
  children: ReactNode;
  /** Wrap content in a ScrollView. Leave false for screens that render their own FlatList. */
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
};

/** Safe-area + keyboard-aware screen container used by every screen. */
export function AppScreen({ children, scroll, padded, edges = ['left', 'right'], contentStyle }: Props) {
  const { colors } = useTheme();
  const inner = [readable, padded && styles.padded, contentStyle];
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView contentContainerStyle={inner} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, ...inner]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { padding: spacing.lg, gap: spacing.lg },
});
