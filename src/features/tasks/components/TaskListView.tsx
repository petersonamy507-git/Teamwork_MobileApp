import { useRouter } from 'expo-router';
import { useCallback, type ReactElement } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { AppEmptyState, useToast } from '../../../components';
import { useTheme } from '../../../theme';
import type { Task } from '../../../types/models';
import { useUpdateTask } from '../useTasks';
import { TaskRow } from './TaskRow';

type Props = {
  tasks: Task[];
  refreshing: boolean;
  onRefresh: () => void;
  header?: ReactElement;
  showProject?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Show nothing when empty (the header already says so, e.g. My day). */
  hideEmpty?: boolean;
};

/** Virtualised task list with complete/reopen and navigation to task details. */
export function TaskListView({
  tasks,
  refreshing,
  onRefresh,
  header,
  showProject,
  emptyTitle = 'No Tasks',
  emptyMessage = 'No tasks have been found.',
  hideEmpty,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const update = useUpdateTask();
  const open = useCallback((t: Task) => router.push(`/tasks/${t.id}`), [router]);
  const toggle = useCallback(
    (t: Task) =>
      update.mutate(
        { id: t.id, patch: { status: t.status === 'completed' ? 'new' : 'completed' } },
        { onSuccess: () => toast(t.status === 'completed' ? 'Task reopened' : 'Task completed'), onError: (e) => toast(e.message, 'error') },
      ),
    [update, toast],
  );
  return (
    <FlatList
      data={tasks}
      keyExtractor={(t) => String(t.id)}
      renderItem={({ item }) => <TaskRow task={item} onPress={open} onToggle={toggle} showProject={showProject} />}
      ListHeaderComponent={header}
      ListEmptyComponent={hideEmpty ? undefined : <AppEmptyState icon="checkmark-done-outline" title={emptyTitle} message={emptyMessage} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
      initialNumToRender={15}
      windowSize={7}
    />
  );
}
