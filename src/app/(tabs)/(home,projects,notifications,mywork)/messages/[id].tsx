import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppAvatar, AppButton, AppCard, AppErrorState, AppInput, AppSkeleton, AppText, useToast } from '../../../../components';
import { useMessage, useReply } from '../../../../features/projects';
import { readable, spacing, useTheme } from '../../../../theme';
import { fmtDateTime, timeAgo } from '../../../../utils/format';

const plain = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mid = Number(id);
  const toast = useToast();
  const { colors } = useTheme();
  const q = useMessage(mid);
  const reply = useReply(mid);
  const [text, setText] = useState('');

  if (q.isPending) return <AppSkeleton />;
  if (q.isError) return <AppErrorState error={q.error} onRetry={() => q.refetch()} />;
  const m = q.data;
  const send = () => text.trim() && reply.mutate(text.trim(), { onSuccess: () => setText(''), onError: (e) => toast(e.message, 'error') });

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[readable, styles.wrap]} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: m.project_name ?? 'Message' }} />
      <AppText variant="title">{m.title}</AppText>
      <AppCard style={{ gap: spacing.md }}>
        <View style={styles.head}>
          <AppAvatar user={m.user} size={34} />
          <View>
            <AppText variant="label">{m.user?.name}</AppText>
            <AppText variant="caption" tone="muted">
              {fmtDateTime(m.created_at)}
            </AppText>
          </View>
        </View>
        <AppText>{plain(m.body)}</AppText>
      </AppCard>
      {(m.replies ?? []).map((r) => (
        <View key={r.id} style={styles.reply}>
          <AppAvatar user={r.user} size={30} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="label">
              {r.user?.name}{' '}
              <AppText variant="caption" tone="muted">
                {timeAgo(r.created_at)}
              </AppText>
            </AppText>
            <AppText>{plain(r.body)}</AppText>
          </View>
        </View>
      ))}
      <AppInput value={text} onChangeText={setText} placeholder="Write a reply" multiline />
      <AppButton title="Reply" onPress={send} loading={reply.isPending} disabled={!text.trim()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 64 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reply: { flexDirection: 'row', gap: spacing.md },
});
