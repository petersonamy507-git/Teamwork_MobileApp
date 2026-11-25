import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, radius, spacing, useTheme } from '../../theme';
import { AppText } from '../ui/AppText';

/** Bottom sheet modal (pickers, "Choose a user", "Sort by" …). Closes on backdrop tap and Android back. */
export function AppModal({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          {title ? (
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              {title}
            </AppText>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '85%', width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: spacing.sm },
  title: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
});
