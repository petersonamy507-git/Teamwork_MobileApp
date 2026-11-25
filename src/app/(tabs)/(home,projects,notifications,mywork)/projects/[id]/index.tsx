import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ProjectSectionHeader } from '../../../../../features/shell';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppAvatarStack, AppBadge, AppCard, AppDivider, AppErrorState, AppListItem, AppSkeleton, AppText, type IconName } from '../../../../../components';
import { useProject, useTrackRecent } from '../../../../../features/projects';
import { readable, spacing, useTheme } from '../../../../../theme';
import { fmtDate, fmtMinutes, HEALTH } from '../../../../../utils/format';

const SECTIONS: { key: string; label: string; icon: IconName }[] = [
  { key: 'tasks', label: 'Task Lists', icon: 'list-outline' },
  { key: 'board', label: 'Board', icon: 'albums-outline' },
  { key: 'messages', label: 'Messages', icon: 'mail-outline' },
  { key: 'files', label: 'Files', icon: 'document-outline' },
  { key: 'milestones', label: 'Milestones', icon: 'flag-outline' },
  { key: 'notebooks', label: 'Notebooks', icon: 'book-outline' },
  { key: 'activity', label: 'Activity', icon: 'flash-outline' },
  { key: 'people', label: 'People', icon: 'people-outline' },
];

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const q = useProject(pid);
  const track = useTrackRecent();
  const { mutate: trackRecent } = track;

  // Same "recent" record the web app writes, so Recents stay in sync across clients.
  const loadedId = q.data?.id;
  useEffect(() => {
    if (loadedId && q.data) trackRecent(q.data);
    // Track once per project opened, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedId, trackRecent]);

  if (q.isPending) return <AppSkeleton />;
  if (q.isError) return <AppErrorState error={q.error} onRetry={() => q.refetch()} />;
  const p = q.data;
  const total = p.task_count ?? 0;
  const done = p.completed_count ?? 0;
  const pct = p.progress ?? (total ? Math.round((done / total) * 100) : 0);
  const health = p.health && p.health !== 'none' ? HEALTH[p.health] : null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[readable, styles.wrap]}>
      <ProjectSectionHeader projectId={pid} section="" />
      <AppCard style={{ gap: spacing.md }}>
        <View style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: p.color || colors.accent }]} />
          <View style={{ flex: 1 }}>
            <AppText variant="heading">{p.name}</AppText>
            {p.client?.name ? <AppText tone="muted">{p.client.name}</AppText> : null}
          </View>
          {health ? <AppBadge label={health.label} color={health.color} /> : null}
        </View>
        {p.description ? <AppText tone="muted">{p.description}</AppText> : null}
        <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
          <View style={{ width: `${pct}%`, height: 6, backgroundColor: colors.success }} />
        </View>
        <View style={styles.stats}>
          <Stat label="Progress" value={`${pct}%`} />
          <Stat label="Tasks" value={`${done}/${total}`} />
          <Stat label="Late" value={String(p.late_count ?? 0)} danger={!!p.late_count} />
          <Stat label="Logged" value={fmtMinutes(p.logged_minutes)} />
        </View>
        {p.start_date || p.end_date ? (
          <AppText variant="caption" tone="muted">{`${fmtDate(p.start_date) || '—'} → ${fmtDate(p.end_date) || '—'}`}</AppText>
        ) : null}
        {p.members?.length ? <AppAvatarStack users={p.members} max={6} /> : null}
      </AppCard>
      <AppCard style={{ padding: 0 }}>
        {SECTIONS.map((s, i) => (
          <View key={s.key}>
            {i ? <AppDivider inset={50} /> : null}
            <AppListItem icon={s.icon} title={s.label} chevron onPress={() => router.push(`/projects/${pid}/${s.key}` as Href)} />
          </View>
        ))}
      </AppCard>
    </ScrollView>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <AppText weight="600" tone={danger ? 'danger' : 'default'}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  swatch: { width: 10, height: 40, borderRadius: 4 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
});
