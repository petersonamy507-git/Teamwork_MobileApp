import { ProjectSectionHeader } from '../../../../../features/shell';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppChipGroup,
  AppEmptyState,
  AppListItem,
  AppModal,
  AppScreen,
  AppText,
  QueryBoundary,
  useToast,
} from '../../../../../components';
import { useProjectMilestones, useSetMilestoneDone } from '../../../../../features/projects';
import { spacing, useTheme } from '../../../../../theme';
import type { Milestone } from '../../../../../types/models';
import { fmtDate, todayISO } from '../../../../../utils/format';

const FILTERS = [
  ['all', 'All'],
  ['late', 'Late'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Completed'],
] as const;
type F = (typeof FILTERS)[number][0];

const isLate = (m: Milestone) => !m.completed && (m.late || (!!m.due_date && m.due_date < todayISO()));

export default function MilestonesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [f, setF] = useState<F>('all');
  const q = useProjectMilestones(Number(id));
  const router = useRouter();
  const toast = useToast();
  const setDone = useSetMilestoneDone(Number(id));
  const [sel, setSel] = useState<Milestone | null>(null);
  const items = useMemo(() => {
    const all = q.data ?? [];
    if (f === 'completed') return all.filter((m) => m.completed);
    if (f === 'late') return all.filter(isLate);
    if (f === 'upcoming') return all.filter((m) => !m.completed && !isLate(m));
    return all;
  }, [q.data, f]);
  return (
    <AppScreen>
      <ProjectSectionHeader projectId={Number(id)} section="milestones" />
      <AppChipGroup options={FILTERS} value={f} onChange={setF} />
      <QueryBoundary query={q}>
        <FlatList
          data={items}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => (
            <AppListItem
              icon="flag-outline"
              title={item.name}
              subtitle={[fmtDate(item.due_date), item.task_count != null ? `${item.completed_count ?? 0}/${item.task_count} tasks` : null]
                .filter(Boolean)
                .join(' · ')}
              right={item.completed ? <AppBadge label="Done" color="#10b981" /> : isLate(item) ? <AppBadge label="Late" color="#ef4444" /> : undefined}
              onPress={() => setSel(item)}
              chevron
            />
          )}
          ListEmptyComponent={<AppEmptyState icon="flag-outline" title="No Milestones" message="There are no milestones" />}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.accent} />}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </QueryBoundary>
      <AppModal visible={!!sel} onClose={() => setSel(null)} title={sel?.name}>
        {sel ? (
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <AppText tone="muted">
              {[
                sel.due_date ? `Due ${fmtDate(sel.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No due date',
                sel.task_count != null ? `${sel.completed_count ?? 0}/${sel.task_count} tasks done` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
            {sel.owner ? <AppListItem left={<AppAvatar user={sel.owner} size={28} />} title={sel.owner.name} subtitle="Responsible" /> : null}
            <AppButton
              title={sel.completed ? 'Reopen milestone' : 'Mark as complete'}
              icon={sel.completed ? 'refresh' : 'checkmark'}
              variant={sel.completed ? 'secondary' : 'primary'}
              loading={setDone.isPending}
              onPress={() =>
                setDone.mutate(
                  { id: sel.id, completed: !sel.completed },
                  {
                    onSuccess: () => {
                      toast(sel.completed ? 'Milestone reopened' : 'Milestone completed');
                      setSel(null);
                    },
                    onError: (e) => toast(e.message, 'error'),
                  },
                )
              }
            />
            <AppButton
              title="View task lists"
              variant="ghost"
              icon="list-outline"
              onPress={() => {
                setSel(null);
                router.push(`/projects/${id}/tasks`);
              }}
            />
          </View>
        ) : null}
      </AppModal>
    </AppScreen>
  );
}
