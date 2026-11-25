import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AppAvatar, AppButton, AppSpeedDial, AppChipGroup, AppEmptyState, AppListItem, AppScreen, QueryBoundary, useToast } from '../../../components';
import { CatchMeUpCard } from '../../../features/ai';
import { useQuickActions } from '../../../features/shell';
import { linkToRoute, useMarkAllRead, useMarkRead, useNotifications, type ReadFilter } from '../../../features/notifications';
import { spacing, useTheme } from '../../../theme';
import type { InboxItem } from '../../../types/models';
import { timeAgo } from '../../../utils/format';

const FILTERS = [
  ['unread', 'Unread'],
  ['read', 'Read'],
  ['', 'All'],
] as const satisfies readonly (readonly [ReadFilter, string])[];

export default function NotificationsScreen() {
  const router = useRouter();
  const actions = useQuickActions();
  const toast = useToast();
  const { colors } = useTheme();
  const [read, setRead] = useState<ReadFilter>('unread');
  const q = useNotifications(read);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const open = (n: InboxItem) => {
    if (!n.is_read) markRead.mutate({ id: n.id, read: true });
    const to = linkToRoute(n.link);
    if (to) router.push(to);
  };

  return (
    <AppScreen>
      <View style={styles.bar}>
        <View style={{ flex: 1 }}>
          <AppChipGroup options={FILTERS} value={read} onChange={setRead} />
        </View>
        {read !== 'read' && q.data?.some((n) => !n.is_read) ? (
          <AppButton
            title="Mark all read"
            variant="ghost"
            loading={markAll.isPending}
            onPress={() => markAll.mutate(undefined, { onSuccess: () => toast('All marked as read'), onError: (e) => toast(e.message, 'error') })}
            style={{ paddingHorizontal: spacing.md }}
          />
        ) : null}
      </View>
      <QueryBoundary query={q}>
        <FlatList
          data={q.data}
          keyExtractor={(n) => String(n.id)}
          ListHeaderComponent={<CatchMeUpCard />}
          renderItem={({ item }) => (
            <View style={!item.is_read ? { backgroundColor: colors.accentSoft + '55' } : undefined}>
              <AppListItem left={<AppAvatar user={item.actor} size={34} />} title={item.message} meta={timeAgo(item.created_at)} onPress={() => open(item)} />
            </View>
          )}
          ListEmptyComponent={<AppEmptyState icon="notifications-outline" title="Woohoo!" message="You're all up to date!" />}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.accent} />}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </QueryBoundary>
      <AppSpeedDial actions={actions} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({ bar: { flexDirection: 'row', alignItems: 'center' } });
