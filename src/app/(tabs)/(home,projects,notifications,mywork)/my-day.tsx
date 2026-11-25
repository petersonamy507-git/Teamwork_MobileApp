import { useMemo } from 'react';
import { View } from 'react-native';
import { AppScreen, AppSpeedDial, AppText, QueryBoundary } from '../../../components';
import { useQuickActions } from '../../../features/shell';
import { useAuth } from '../../../features/auth';
import { TaskListView, useTasks } from '../../../features/tasks';
import { spacing } from '../../../theme';

/** Tasks due today or overdue for the signed-in user (mirrors the reference "My day" view). */
export default function MyDayScreen() {
  const actions = useQuickActions();
  const { user } = useAuth();
  const params = useMemo(() => ({ assignee: user?.id, status: 'open' as const, due: 'today', limit: 200 }), [user?.id]);
  const q = useTasks(params, !!user);
  const first = user?.name.split(' ')[0] ?? '';
  const count = q.data?.length ?? 0;
  const header = (
    <View style={{ padding: spacing.lg, gap: spacing.xs }}>
      <AppText variant="title">{`Hi ${first},`}</AppText>
      <AppText tone="muted">
        {q.isPending ? ' ' : count ? `You have ${count} task${count === 1 ? '' : 's'} due today.` : 'Kick back and relax you have no tasks or events today!'}
      </AppText>
    </View>
  );
  return (
    <AppScreen>
      <QueryBoundary query={q}>
        <TaskListView
          tasks={q.data ?? []}
          refreshing={q.isRefetching}
          onRefresh={() => void q.refetch()}
          header={header}
          emptyTitle="Nothing due today"
          emptyMessage=""
        />
      </QueryBoundary>
      <AppSpeedDial actions={actions} />
    </AppScreen>
  );
}
