import { ProjectSectionHeader } from '../../../../../features/shell';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppAvatarStack, AppCard, AppEmptyState, AppListItem, AppModal, AppScreen, AppText, QueryBoundary, useToast } from '../../../../../components';
import { useBoard, useMoveToColumn } from '../../../../../features/projects';
import { radius, spacing, useTheme } from '../../../../../theme';
import type { Task } from '../../../../../types/models';
import { dueState, fmtDate, PRIORITY } from '../../../../../utils/format';

/** Board view: one swipeable column per stage, like Teamwork's mobile board. Each card has a Move action to change its column. */
export default function BoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Number(id);
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const q = useBoard(pid);
  const move = useMoveToColumn(pid);
  const [moving, setMoving] = useState<Task | null>(null);
  const colW = Math.min(320, width - spacing.xxl * 2);
  const cols = q.data ?? [];

  return (
    <AppScreen>
      <ProjectSectionHeader projectId={Number(id)} section="board" />
      <QueryBoundary query={q}>
        {cols.length ? (
          <ScrollView
            horizontal
            snapToInterval={colW + spacing.md}
            decelerationRate="fast"
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
            refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.accent} />}
          >
            {cols.map((c) => (
              <View key={c.id} style={[styles.col, { width: colW, backgroundColor: colors.surface }]}>
                <View style={styles.colHead}>
                  <View style={[styles.dot, { backgroundColor: c.color || colors.accent }]} />
                  <AppText variant="label" style={{ flex: 1 }}>
                    {c.name}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {c.tasks.length}
                  </AppText>
                </View>
                <FlatList
                  data={c.tasks}
                  keyExtractor={(t) => String(t.id)}
                  ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                  renderItem={({ item: t }) => (
                    <AppCard
                      onPress={() => router.push(`/tasks/${t.id}`)}
                      accessibilityLabel={t.title}
                      style={[styles.card, { backgroundColor: colors.background }]}
                    >
                      <AppText numberOfLines={3}>{t.title}</AppText>
                      <View style={styles.meta}>
                        {t.priority !== 'none' ? <View style={[styles.dot, { backgroundColor: PRIORITY[t.priority].color }]} /> : null}
                        {t.due_date ? (
                          <AppText variant="caption" tone={dueState(t) === 'late' ? 'danger' : 'muted'}>
                            {fmtDate(t.due_date)}
                          </AppText>
                        ) : null}
                        <View style={{ flex: 1 }} />
                        {t.assignees?.length ? <AppAvatarStack users={t.assignees} max={3} size={22} /> : null}
                      </View>
                      <AppText variant="caption" tone="accent" onPress={() => setMoving(t)} accessibilityRole="button">
                        Move…
                      </AppText>
                    </AppCard>
                  )}
                  ListEmptyComponent={
                    <AppText variant="caption" tone="muted" style={{ padding: spacing.md }}>
                      No tasks
                    </AppText>
                  }
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <AppEmptyState icon="albums-outline" title="No Tasks" message="Your board columns will appear here as soon as you add them on the website!" />
        )}
      </QueryBoundary>
      <AppModal visible={!!moving} onClose={() => setMoving(null)} title="Move to column">
        {cols.map((c) => (
          <AppListItem
            key={c.id}
            icon={c.tasks.some((t) => t.id === moving?.id) ? 'radio-button-on' : 'radio-button-off'}
            title={c.name}
            onPress={() => {
              const t = moving;
              setMoving(null);
              if (t) move.mutate({ taskId: t.id, columnId: c.id }, { onSuccess: () => toast(`Moved to ${c.name}`), onError: (e) => toast(e.message, 'error') });
            }}
          />
        ))}
      </AppModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  col: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, maxHeight: '100%' },
  colHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  card: { padding: spacing.md, gap: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
