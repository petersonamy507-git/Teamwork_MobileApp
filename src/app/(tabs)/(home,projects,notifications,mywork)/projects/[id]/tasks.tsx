import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AppDivider, AppEmptyState, AppFab, AppListItem, AppScreen, AppSearchBar, AppText, QueryBoundary } from '../../../../../components';
import { useTaskLists } from '../../../../../features/projects';
import { ProjectSectionHeader } from '../../../../../features/shell';
import { radius, useTheme } from '../../../../../theme';

/** Task Lists page (reference): search, "All Lists", then each list with its open-task count. */
export default function TaskListsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const lists = useTaskLists(pid, false);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const all = lists.data ?? [];
    return s ? all.filter((l) => l.name.toLowerCase().includes(s)) : all;
  }, [lists.data, q]);
  const total = (lists.data ?? []).reduce((n, l) => n + (l.tasks?.length ?? 0), 0);
  const count = (n: number) => (
    <View style={[styles.count, { backgroundColor: colors.surface }]}>
      <AppText variant="caption">{String(n)}</AppText>
    </View>
  );

  return (
    <AppScreen>
      <ProjectSectionHeader projectId={pid} section="tasks" />
      <AppSearchBar value={q} onChangeText={setQ} placeholder="Search" />
      <QueryBoundary query={lists}>
        <FlatList
          data={rows}
          keyExtractor={(l) => String(l.id)}
          ListHeaderComponent={
            q ? undefined : <AppListItem title="All Lists" right={count(total)} onPress={() => router.push(`/projects/${pid}/tasklist/all`)} />
          }
          renderItem={({ item }) => (
            <AppListItem title={item.name} right={count(item.tasks?.length ?? 0)} onPress={() => router.push(`/projects/${pid}/tasklist/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <AppDivider inset={16} />}
          ListEmptyComponent={
            <AppEmptyState
              icon="list-outline"
              title={q ? 'Oops! Nothing found…' : 'No task lists'}
              message={q ? 'Try searching for something else.' : 'Task lists added on the web will show up here.'}
            />
          }
          refreshControl={<RefreshControl refreshing={lists.isRefetching} onRefresh={() => void lists.refetch()} tintColor={colors.accent} />}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
        />
      </QueryBoundary>
      <AppFab label="Add task" onPress={() => router.push(`/projects/${pid}/new-task`)} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  count: { minWidth: 28, height: 24, borderRadius: radius.pill, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
});
