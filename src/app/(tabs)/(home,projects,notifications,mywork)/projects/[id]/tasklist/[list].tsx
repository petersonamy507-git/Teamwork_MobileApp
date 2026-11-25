import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import {
  AppChip,
  AppChipGroup,
  AppEmptyState,
  AppIcon,
  AppListItem,
  AppModal,
  AppScreen,
  AppSearchBar,
  AppText,
  QueryBoundary,
  useToast,
} from '../../../../../../components';
import { AiTasksSheet } from '../../../../../../features/ai';
import { ProjectSectionHeader } from '../../../../../../features/shell';
import { useAuth } from '../../../../../../features/auth';
import { useTaskLists } from '../../../../../../features/projects';
import { applyTaskFilter, TaskRow, useUpdateTask, type TaskFilter } from '../../../../../../features/tasks';
import { radius, spacing, useTheme } from '../../../../../../theme';
import type { Task } from '../../../../../../types/models';

type Filter = TaskFilter | 'mine';
const FILTERS = [
  ['all', 'All'],
  ['mine', 'Mine'],
  ['today', 'Today'],
  ['late', 'Late'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Completed'],
] as const satisfies readonly (readonly [Filter, string])[];

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
const SORTS = {
  manual: { label: 'Manual (as on the web)', cmp: null },
  due: { label: 'Due date', cmp: (a: Task, b: Task) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') },
  priority: { label: 'Priority', cmp: (a: Task, b: Task) => (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3) },
  name: { label: 'Task name (A-Z)', cmp: (a: Task, b: Task) => a.title.localeCompare(b.title) },
  created: { label: 'Date added (newest first)', cmp: (a: Task, b: Task) => (b.created_at ?? '').localeCompare(a.created_at ?? '') },
} as const;
type SortKey = keyof typeof SORTS;

export default function ProjectTasksScreen() {
  const { id, list } = useLocalSearchParams<{ id: string; list: string }>();
  const pid = Number(id);
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('manual');
  // Opened from the Task Lists page: 'all' or one list id.
  const [listId, setListId] = useState<number | null>(list && list !== 'all' ? Number(list) : null);
  const [sheet, setSheet] = useState<'sort' | 'lists' | 'ai' | null>(null);
  const lists = useTaskLists(pid, filter === 'completed');
  const update = useUpdateTask();

  const sections = useMemo(() => {
    const s = q.trim().toLowerCase();
    const cmp = SORTS[sort].cmp;
    return (lists.data ?? [])
      .filter((l) => listId == null || l.id === listId)
      .map((l) => {
        let tasks = l.tasks ?? [];
        if (filter === 'completed') tasks = tasks.filter((t) => t.status === 'completed');
        else if (filter === 'mine') tasks = tasks.filter((t) => t.assignees?.some((a) => a.id === user?.id));
        else tasks = applyTaskFilter(tasks, filter);
        if (s) tasks = tasks.filter((t) => t.title.toLowerCase().includes(s));
        if (cmp) tasks = [...tasks].sort(cmp);
        return { key: String(l.id), title: l.name, data: tasks };
      })
      .filter((sec) => sec.data.length || (!s && filter === 'all'));
  }, [lists.data, filter, q, user?.id, sort, listId]);
  const listName = lists.data?.find((l) => l.id === listId)?.name;

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
    <AppScreen>
      <ProjectSectionHeader
        projectId={pid}
        section="tasks"
        label="Tasks"
        extra={[{ label: 'Sort by', icon: 'swap-vertical', onPress: () => setSheet('sort') }]}
      />
      <AppSearchBar value={q} onChangeText={setQ} placeholder="Search this project" />
      <View style={styles.tools}>
        <AppChip
          label={listName ? `${listName} ✕` : 'All Lists ▾'}
          selected={listId != null}
          onPress={() => (listId != null ? setListId(null) : setSheet('lists'))}
        />
        {sort !== 'manual' ? <AppChip label={`Sort: ${SORTS[sort].label} ✕`} selected onPress={() => setSort('manual')} /> : null}
      </View>
      <AppChipGroup
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        afterFirst={<AppChip label="✦" accessibilityLabel="Ask AI about these tasks" onPress={() => setSheet('ai')} />}
      />
      <QueryBoundary query={lists}>
        <SectionList
          sections={sections}
          keyExtractor={(t) => String(t.id)}
          renderSectionHeader={({ section }) => (
            <View style={[styles.head, { backgroundColor: colors.background }]}>
              <AppText variant="label">{section.title}</AppText>
              <AppText variant="caption" tone="muted">
                {section.data.length}
              </AppText>
            </View>
          )}
          renderItem={({ item }) => <TaskRow task={item} onPress={open} onToggle={toggle} showProject={false} />}
          ListEmptyComponent={
            <AppEmptyState
              icon="search-outline"
              title={q || filter !== 'all' ? 'Oops! Nothing found…' : 'No Tasks'}
              message={q || filter !== 'all' ? "We couldn't find anything matching that." : 'No tasks have been found.'}
            />
          }
          refreshControl={<RefreshControl refreshing={lists.isRefetching} onRefresh={() => void lists.refetch()} tintColor={colors.accent} />}
          stickySectionHeadersEnabled
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 110 }}
        />
      </QueryBoundary>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add task"
        onPress={() => router.push(`/projects/${pid}/new-task`)}
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <AppIcon name="add" size={28} color={colors.onAccent} />
      </Pressable>
      <AppModal visible={sheet === 'lists'} onClose={() => setSheet(null)} title="Task Lists">
        <AppListItem
          icon="list-outline"
          title="All Lists"
          right={listId == null ? <AppIcon name="checkmark" color={colors.accent} /> : undefined}
          onPress={() => {
            setListId(null);
            setSheet(null);
          }}
        />
        {(lists.data ?? []).map((l) => (
          <AppListItem
            key={l.id}
            icon="reorder-three-outline"
            title={l.name}
            meta={String(l.tasks?.length ?? 0)}
            right={listId === l.id ? <AppIcon name="checkmark" color={colors.accent} /> : undefined}
            onPress={() => {
              setListId(l.id);
              setSheet(null);
            }}
          />
        ))}
      </AppModal>
      <AiTasksSheet visible={sheet === 'ai'} onClose={() => setSheet(null)} projectId={pid} />
      <AppModal visible={sheet === 'sort'} onClose={() => setSheet(null)} title="Sort by">
        {(Object.keys(SORTS) as SortKey[]).map((k) => (
          <AppListItem
            key={k}
            title={SORTS[k].label}
            right={k === sort ? <AppIcon name="checkmark" color={colors.accent} /> : undefined}
            onPress={() => {
              setSort(k);
              setSheet(null);
            }}
          />
        ))}
      </AppModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  tools: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, flexWrap: 'wrap' },
  head: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
