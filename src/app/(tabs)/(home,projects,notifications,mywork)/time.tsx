import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AppBarChart, AppCard, AppChip, AppEmptyState, AppIcon, AppListItem, AppModal, AppScreen, AppSkeleton, AppText } from '../../../components';
import { useAuth } from '../../../features/auth';
import { usePerson } from '../../../features/profile';
import { useTimeSummary, type Range } from '../../../features/time';
import { CONTENT_MAX_WIDTH, spacing, useTheme } from '../../../theme';
import { fmtDate, fmtMinutes } from '../../../utils/format';

const RANGES: [Range, string][] = [
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
  ['quarterly', 'Quarterly'],
];
// Pages: two previous periods and the current one (current is last, like the reference's dots).
const OFFSETS = [-2, -1, 0];

function PeriodCard({ userId, range, offset, capacity, width }: { userId: number; range: Range; offset: number; capacity: number; width: number }) {
  const { colors } = useTheme();
  const q = useTimeSummary(userId, range, capacity, offset);
  const d = q.data;
  return (
    <View style={{ width, paddingHorizontal: spacing.lg }}>
      <AppCard style={{ gap: spacing.sm, minHeight: 300 }}>
        {!d ? (
          <AppSkeleton rows={3} />
        ) : (
          <>
            <AppText tone="muted">{d.range.label}</AppText>
            <AppText variant="title">{fmtMinutes(d.total)}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg, rowGap: 4 }}>
              <Legend color={colors.accent} label="Billable" value={fmtMinutes(d.billable)} />
              <Legend color="#94a3b8" label="Non-billable" value={fmtMinutes(d.nonBillable)} />
              <Legend color="#f97316" label="Work hours" value={fmtMinutes(d.workTotal)} />
            </View>
            <AppBarChart
              bars={d.bars.map((b) => ({ label: b.label, value: b.minutes, target: b.work }))}
              width={width - spacing.lg * 4}
              color={colors.accent}
            />
          </>
        )}
      </AppCard>
    </View>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      </View>
      <AppText variant="caption">{value}</AppText>
    </View>
  );
}

export default function TimeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { width: screen } = useWindowDimensions();
  const width = Math.min(screen, CONTENT_MAX_WIDTH);
  const [range, setRange] = useState<Range>('weekly');
  const [picking, setPicking] = useState(false);
  const [page, setPage] = useState(OFFSETS.length - 1);
  const person = usePerson(user!.id);
  const capacity = person.data?.capacity_minutes || 480;
  const current = useTimeSummary(user!.id, range, capacity, OFFSETS[page]);
  // Track the visible page from the scroll position once a swipe settles.
  const onSettle = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width)), [width]);

  const header = (
    <View style={{ gap: spacing.md, paddingVertical: spacing.sm }}>
      <View style={{ paddingHorizontal: spacing.lg, flexDirection: 'row' }}>
        <AppChip label={`${RANGES.find((r) => r[0] === range)?.[1]} ▾`} selected onPress={() => setPicking(true)} />
      </View>
      <FlatList
        key={range}
        data={OFFSETS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={OFFSETS.length - 1}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        keyExtractor={(o) => `${range}${o}`}
        renderItem={({ item }) => <PeriodCard userId={user!.id} range={range} offset={item} capacity={capacity} width={width} />}
        onMomentumScrollEnd={onSettle}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessibilityLabel={`Page ${page + 1} of ${OFFSETS.length}`}>
        {OFFSETS.map((o, i) => (
          <View key={o} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === page ? colors.text : colors.surfaceAlt }} />
        ))}
      </View>
      <AppText variant="heading" style={{ paddingHorizontal: spacing.lg }}>
        Time entries
      </AppText>
    </View>
  );

  return (
    <AppScreen>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View>
              <AppText variant="heading">Time</AppText>
              <AppText variant="caption" tone="muted">
                {user?.name}
              </AppText>
            </View>
          ),
        }}
      />
      <FlatList
        data={current.data?.entries ?? []}
        keyExtractor={(e) => String(e.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <AppListItem
            icon={item.billable ? 'cash-outline' : 'time-outline'}
            title={item.description || item.task_title || item.project_name || 'Time entry'}
            subtitle={[item.description ? item.task_title : null, item.project_name, fmtDate(item.date)].filter(Boolean).join(' · ')}
            meta={fmtMinutes(item.minutes)}
            onPress={
              item.task_id ? () => router.push(`/tasks/${item.task_id}`) : item.project_id ? () => router.push(`/projects/${item.project_id}`) : undefined
            }
          />
        )}
        ListEmptyComponent={
          current.isPending ? undefined : <AppEmptyState icon="time-outline" title="No time logged" message="Time logged in this period shows up here." />
        }
        contentContainerStyle={{ paddingBottom: 48 }}
      />
      <AppModal visible={picking} onClose={() => setPicking(false)} title="Show time">
        {RANGES.map(([k, l]) => (
          <AppListItem
            key={k}
            title={l}
            right={k === range ? <AppIcon name="checkmark" color={colors.accent} /> : undefined}
            onPress={() => {
              setRange(k);
              setPage(OFFSETS.length - 1);
              setPicking(false);
            }}
          />
        ))}
      </AppModal>
    </AppScreen>
  );
}
