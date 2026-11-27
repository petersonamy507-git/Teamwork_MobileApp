import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppAvatar, AppButton, AppCard, AppErrorState, AppIcon, AppInput, AppSkeleton, AppText, useToast, type IconName } from '../../../../components';
import { isApiError } from '../../../../services/api';
import { openProjectFile, useAddFileComment, useFileComments } from '../../../../features/files';
import { useProjectFiles } from '../../../../features/projects';
import { radius, readable, spacing } from '../../../../theme';
import { fmtDate, timeAgo } from '../../../../utils/format';

const kind = (name: string): { color: string; icon: IconName; label: string } =>
  /\.pdf$/i.test(name)
    ? { color: '#e8375f', icon: 'document-text', label: 'PDF' }
    : /\.(png|jpe?g|gif|webp|heic)$/i.test(name)
      ? { color: '#14b8a6', icon: 'image', label: 'Image' }
      : /\.(docx?|txt|rtf|md)$/i.test(name)
        ? { color: '#4461d7', icon: 'document', label: 'Document' }
        : /\.(xlsx?|csv)$/i.test(name)
          ? { color: '#16a34a', icon: 'grid', label: 'Spreadsheet' }
          : { color: '#64748b', icon: 'document-attach', label: 'File' };

const size = (n?: number) => (n == null ? '' : n < 1024 ? `${n} B` : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} kB`);

/** File details (reference app's File screen): coloured preview header, Open file, name, uploader, date, size. */
export default function FileScreen() {
  const { id, project } = useLocalSearchParams<{ id: string; project: string }>();
  const toast = useToast();
  const files = useProjectFiles(Number(project));
  const [opening, setOpening] = useState(false);
  const [comment, setComment] = useState('');
  const comments = useFileComments(Number(id));
  const addComment = useAddFileComment(Number(id));
  const commentsOff = comments.isError && isApiError(comments.error) && comments.error.kind === 'not_found';
  const commentList = Array.isArray(comments.data) ? comments.data : [];
  if (files.isPending) return <AppSkeleton />;
  if (files.isError) return <AppErrorState error={files.error} onRetry={() => files.refetch()} />;
  const f = (Array.isArray(files.data) ? files.data : []).find((x) => String(x.id) === id);
  if (!f) return <AppErrorState error={new Error('This file no longer exists.')} />;
  const k = kind(f.name);
  const open = async () => {
    setOpening(true);
    try {
      await openProjectFile(f);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not open the file', 'error');
    } finally {
      setOpening(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={[readable, { paddingBottom: 48 }]}>
      <Stack.Screen options={{ title: 'File' }} />
      <View style={[styles.hero, { backgroundColor: k.color }]}>
        <View style={styles.badge}>
          <AppIcon name={k.icon} size={40} color={k.color} />
        </View>
        <AppButton title="Open file" variant="secondary" loading={opening} onPress={() => void open()} style={styles.openBtn} />
      </View>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <AppText variant="heading" selectable>
          {f.name}
        </AppText>
        <View style={styles.meta}>
          <AppAvatar user={f.user} size={22} />
          <AppText variant="caption" tone="muted">
            {[f.user?.name, fmtDate(f.created_at), k.label, size(f.size)].filter(Boolean).join(' • ')}
          </AppText>
        </View>
        {f.description ? (
          <AppCard>
            <AppText>{f.description}</AppText>
          </AppCard>
        ) : null}
        <AppText variant="heading">{`Comments (${commentList.length})`}</AppText>
        {commentsOff ? (
          <AppText tone="muted">{"Comments on files will appear here once they're switched on for your Crewdesk server."}</AppText>
        ) : (
          <>
            {commentList.map((c) => (
              <View key={c.id} style={styles.comment}>
                <AppAvatar user={c.user} size={28} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="label">
                    {c.user?.name ?? 'Someone'}{' '}
                    <AppText variant="caption" tone="muted">
                      {timeAgo(c.created_at)}
                    </AppText>
                  </AppText>
                  <AppText>{String(c.body ?? '').replace(/<[^>]+>/g, '')}</AppText>
                </View>
              </View>
            ))}
            <AppInput value={comment} onChangeText={setComment} placeholder="Write a comment" multiline />
            <AppButton
              title="Post comment"
              variant="secondary"
              disabled={!comment.trim()}
              loading={addComment.isPending}
              onPress={() => addComment.mutate(comment.trim(), { onSuccess: () => setComment(''), onError: (e) => toast(e.message, 'error') })}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  badge: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  openBtn: { minHeight: 38, paddingHorizontal: spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  comment: { flexDirection: 'row', gap: spacing.md },
});
