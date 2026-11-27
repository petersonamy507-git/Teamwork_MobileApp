import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import {
  AppChip,
  AppDivider,
  AppHeaderMenu,
  AppEmptyState,
  AppIcon,
  AppListItem,
  AppModal,
  AppScreen,
  AppSearchBar,
  AppText,
  QueryBoundary,
  useToast,
} from '../../../components';
import { useActivity } from '../../../features/activity';
import { useRecents } from '../../../features/home';
import { useCategories, useProjects, useToggleStar } from '../../../features/projects';
import { spacing, useTheme } from '../../../theme';
import type { Project } from '../../../types/models';

const STATUS = [
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['all', 'All'],
] as const;
type Status = (typeof STATUS)[number][0];

// Same sort options as the reference app's "Sort by" sheet, applied to the fields the API returns.
const SORTS = {
  starred: {
    label: 'Company (Starred First)',
    cmp: (a: Project, b: Project) =>
      Number(!!b.is_starred) - Number(!!a.is_starred) || (a.client?.name ?? '').localeCompare(b.client?.name ?? '') || a.name.localeCompare(b.name),
  },
  last_worked: { label: 'Last Worked On', cmp: null },
  latest_activity: { label: 'Latest Activity', cmp: null },
  name_asc: { label: 'Project Name (A-Z)', cmp: (a: Project, b: Project) => a.name.localeCompare(b.name) },
  name_desc: { label: 'Project Name (Z-A)', cmp: (a: Project, b: Project) => b.name.localeCompare(a.name) },
  start_new: { label: 'Start Date (Newest First)', cmp: (a: Project, b: Project) => (b.start_date ?? '').localeCompare(a.start_date ?? '') },
  start_old: { label: 'Start Date (Oldest First)', cmp: (a: Project, b: Project) => (a.start_date ?? '9').localeCompare(b.start_date ?? '9') },
  end_new: { label: 'End Date (Newest First)', cmp: (a: Project, b: Project) => (b.end_date ?? '').localeCompare(a.end_date ?? '') },
  end_old: { label: 'End Date (Oldest First)', cmp: (a: Project, b: Project) => (a.end_date ?? '9').localeCompare(b.end_date ?? '9') },
  created_new: { label: 'Date Created (Newest First)', cmp: (a: Project, b: Project) => (b.created_at ?? '').localeCompare(a.created_at ?? '') },
  created_old: { label: 'Date Created (Oldest First)', cmp: (a: Project, b: Project) => (a.created_at ?? '').localeCompare(b.created_at ?? '') },
} as const;
type SortKey = keyof typeof SORTS;

export default function ProjectsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const [status, setStatus] = useState<Status>('active');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('starred');
  const [category, setCategory] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'sort' | 'category' | null>(null);
  const query = useProjects(status);
  const recents = useRecents();
  const activity = useActivity();
  const cats = useCategories();
  const star = useToggleStar();

  const projects = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = query.data ?? [];
    if (category != null) list = list.filter((p) => p.category_id === category);
    if (s) list = list.filter((p) => p.name.toLowerCase().includes(s) || p.client?.name?.toLowerCase().includes(s));
    // "Last Worked On" uses the user's recent project visits; "Latest Activity" the newest activity per project.
    const rank = (pairs: [number, string][]) => {
      const m = new Map<number, string>();
      for (const [id, at] of pairs) if (!m.has(id) || (m.get(id) ?? '') < at) m.set(id, at);
      return (a: Project, b: Project) => (m.get(b.id) ?? '').localeCompare(m.get(a.id) ?? '') || a.name.localeCompare(b.name);
    };
    const cmp =
      sort === 'last_worked'
        ? rank((recents.data ?? []).map((r) => [r.ref_id, r.viewed_at ?? r.updated_at ?? r.created_at ?? '']))
        : sort === 'latest_activity'
          ? rank((activity.data ?? []).filter((a) => a.project_id).map((a) => [a.project_id as number, a.created_at]))
          : SORTS[sort].cmp;
    return [...list].sort(cmp ?? undefined);
  }, [query.data, q, sort, category, recents.data, activity.data]);

  // "Company (Starred First)" groups projects under their company, like the reference app.
  const sections = useMemo(() => {
    if (sort !== 'starred') return [{ title: '', data: projects }];
    const starred = projects.filter((p) => p.is_starred);
    const groups = new Map<string, Project[]>();
    for (const p of projects.filter((x) => !x.is_starred)) {
      const k = p.client?.name || 'No company';
      groups.set(k, [...(groups.get(k) ?? []), p]);
    }
    return [...(starred.length ? [{ title: 'Starred', data: starred }] : []), ...[...groups.entries()].map(([title, data]) => ({ title, data }))];
  }, [projects, sort]);

  const open = useCallback((p: Project) => router.push(`/projects/${p.id}`), [router]);
  const toggleStar = useCallback(
    (p: Project) => star.mutate({ project: p, starred: !p.is_starred }, { onError: (e) => toast(e.message, 'error') }),
    [star, toast],
  );
  const catName = cats.data?.find((c) => c.id === category)?.name;

  return (
    <AppScreen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <AppHeaderMenu
              items={[
                { label: 'Sort by', icon: 'swap-vertical', onPress: () => setSheet('sort') },
                ...STATUS.filter(([k]) => k !== status).map(([k, l]) => ({
                  label: `Show ${l.toLowerCase()} projects`,
                  icon: 'eye-outline' as const,
                  onPress: () => setStatus(k),
                })),
              ]}
            />
          ),
        }}
      />
      <AppSearchBar value={q} onChangeText={setQ} placeholder="Search Projects" />
      <View style={styles.tools}>
        <AppChip
          label={catName ? `${catName} ✕` : 'Category ▾'}
          selected={category != null}
          onPress={() => (category != null ? setCategory(null) : setSheet('category'))}
        />
      </View>
      {status !== 'active' ? (
        <View style={styles.tools}>
          <AppChip label={`${STATUS.find((x) => x[0] === status)?.[1]} projects ✕`} selected onPress={() => setStatus('active')} />
        </View>
      ) : null}
      <QueryBoundary query={query}>
        <SectionList
          sections={projects.length ? sections : []}
          keyExtractor={(p) => String(p.id)}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <AppText variant="label" tone="muted" style={styles.groupHead}>
                {section.title}
              </AppText>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Project ${item.name}`}
              onPress={() => open(item)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.is_starred ? `Unstar ${item.name}` : `Star ${item.name}`}
                accessibilityState={{ selected: !!item.is_starred }}
                hitSlop={12}
                onPress={() => toggleStar(item)}
              >
                <AppIcon name={item.is_starred ? 'star' : 'star-outline'} size={22} color={item.is_starred ? colors.warning : colors.textMuted} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <AppText numberOfLines={2}>{item.name}</AppText>
                {item.task_count ? (
                  <AppText variant="caption" tone="muted">{`${item.completed_count ?? 0}/${item.task_count} tasks · ${item.progress ?? 0}%`}</AppText>
                ) : null}
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <AppDivider inset={56} />}
          ListEmptyComponent={
            <AppEmptyState
              icon="folder-open-outline"
              title="No projects"
              message={q || category != null ? 'Nothing matches your filters.' : 'There are no projects here yet.'}
            />
          }
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
        />
      </QueryBoundary>

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
      <AppModal visible={sheet === 'category'} onClose={() => setSheet(null)} title="Project categories">
        {cats.data?.length ? (
          cats.data.map((c) => (
            <AppListItem
              key={c.id}
              icon="pricetag-outline"
              title={c.name}
              onPress={() => {
                setCategory(c.id);
                setSheet(null);
              }}
            />
          ))
        ) : (
          <AppEmptyState icon="pricetags-outline" title="No results" message="No project categories have been set up." />
        )}
      </AppModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  tools: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  groupHead: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
});
