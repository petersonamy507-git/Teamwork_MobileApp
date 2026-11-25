import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { AppAvatar, AppChip, AppEmptyState, AppListItem, AppModal, AppSearchBar, AppText } from '../../components';
import { spacing, useTheme } from '../../theme';
import type { ActivityItem, UserRef } from '../../types/models';
import { fmtDateTime, groupByDay } from '../../utils/format';
import { useAuth } from '../auth';

type Props = {
  items: ActivityItem[];
  refreshing: boolean;
  onRefresh: () => void;
  /** Global activity groups by project (reference); a project's own feed groups by day. */ groupBy?: 'project' | 'day';
};

/** Activity grouped by day, with "Me" and "User ▾" filters like the reference app. */
export function ActivityFeed({ items, refreshing, onRefresh, groupBy = 'day' }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { user: me } = useAuth();
  const [user, setUser] = useState<UserRef | null>(null);
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState('');
  const users = useMemo(() => {
    const m = new Map<number, UserRef>();
    items.forEach((a) => a.user && m.set(a.user.id, a.user));
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  const sections = useMemo(() => {
    const shown = user ? items.filter((a) => a.user?.id === user.id) : items;
    if (groupBy === 'day') return groupByDay(shown, (a) => a.created_at);
    const m = new Map<string, ActivityItem[]>();
    for (const a of shown) {
      const k = a.project_name || 'General';
      m.set(k, [...(m.get(k) ?? []), a]);
    }
    return [...m.entries()].map(([title, data]) => ({ title, data }));
  }, [items, user, groupBy]);
  const isMe = !!user && user.id === me?.id;
  const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <View style={styles.bar}>
        <AppChip label={isMe ? 'Me ✕' : 'Me'} selected={isMe} onPress={() => (isMe ? setUser(null) : me && setUser(me))} />
        <AppChip
          label={user && !isMe ? `${user.name} ✕` : 'User ▾'}
          selected={!!user && !isMe}
          onPress={() => (user && !isMe ? setUser(null) : setPicking(true))}
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(a) => String(a.id)}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <AppText variant="label" tone="muted" style={[styles.day, { backgroundColor: colors.background }]}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item }) => (
          <AppListItem
            left={<AppAvatar user={item.user} size={34} />}
            title={`${item.user?.name ?? 'Someone'} ${item.action}`}
            subtitle={groupBy === 'project' ? null : item.project_name}
            meta={groupBy === 'project' ? fmtDateTime(item.created_at) : fmtDateTime(item.created_at).split(', ').pop()}
            onPress={item.project_id ? () => router.push(`/projects/${item.project_id}`) : undefined}
          />
        )}
        ListEmptyComponent={<AppEmptyState icon="mail-open-outline" title="No recent activity" message="You don't have any recent activity." />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ flexGrow: 1 }}
      />
      <AppModal visible={picking} onClose={() => setPicking(false)} title="Choose a user">
        <AppSearchBar value={q} onChangeText={setQ} />
        <FlatList
          data={filteredUsers}
          keyExtractor={(u) => String(u.id)}
          style={{ maxHeight: 420 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <AppListItem
              left={<AppAvatar user={item} size={30} />}
              title={item.name}
              onPress={() => {
                setUser(item);
                setPicking(false);
              }}
            />
          )}
        />
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  day: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs },
});
