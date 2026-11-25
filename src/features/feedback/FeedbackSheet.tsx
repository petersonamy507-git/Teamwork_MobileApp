import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppIcon, AppModal, AppText, useToast } from '../../components';
import { APP_VERSION } from '../../config/env';
import { apiClient, isApiError } from '../../services/api';
import { MAX_FONT_SCALE, radius, spacing, useTheme } from '../../theme';

/** Feedback sheet from Home ⋮ (reference: "We'd love to know what you think about the app!"). */
export function FeedbackSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await apiClient.post('/feedback', { message: text.trim(), app: 'mobile', app_version: APP_VERSION });
      toast('Thanks for your feedback!');
      setText('');
      onClose();
    } catch (e) {
      toast(
        isApiError(e) && e.kind === 'not_found' ? "Feedback isn't switched on for this server yet." : e instanceof Error ? e.message : 'Could not send',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppModal visible={visible} onClose={onClose} title="Feedback">
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Feedback"
          value={text}
          onChangeText={setText}
          placeholder="We'd love to know what you think about the app!"
          placeholderTextColor={colors.textMuted}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          multiline
          autoFocus
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send feedback"
          disabled={!text.trim() || busy}
          onPress={() => void send()}
          style={[styles.send, { backgroundColor: text.trim() ? colors.accent : colors.surfaceAlt }]}
        >
          <AppIcon name="send" size={16} color={text.trim() ? colors.onAccent : colors.textMuted} />
        </Pressable>
      </View>
      <AppText variant="caption" tone="muted" style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        Sent to your Crewdesk admins with the app version.
      </AppText>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.lg },
  input: { flex: 1, minHeight: 60, maxHeight: 160, fontSize: 15 },
  send: { width: 38, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
