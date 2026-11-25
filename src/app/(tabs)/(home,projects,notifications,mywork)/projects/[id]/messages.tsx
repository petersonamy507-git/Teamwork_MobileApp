import { ProjectSectionHeader } from '../../../../../features/shell';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, View } from 'react-native';
import { AppAvatar, AppEmptyState, AppFab, AppScreen, AppSearchBar, AppText, QueryBoundary } from '../../../../../components';
import { useProjectMessages } from '../../../../../features/projects';
import { spacing, useTheme } from '../../../../../theme';
import { fmtDateTime, groupByDay } from '../../../../../utils/format';

export default function ProjectMessagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const q = useProjectMessages(pid);
  const [search, setSearch] = useState('');
  const plain = (h?: string | null) =>
    (h ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const sections = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = (q.data ?? []).filter(
      (m) => !s || m.title.toLowerCase().includes(s) || plain(m.body).toLowerCase().includes(s) || (m.user?.name ?? '').toLowerCase().includes(s),
    );
    return groupByDay(list, (m) => m.created_at);
  }, [q.data, search]);
  return (
    <AppScreen>
      <ProjectSectionHeader projectId={Number(id)} section="messages" />
      <AppSearchBar value={search} onChangeText={setSearch} placeholder="Search" />
      <QueryBoundary query={q}>
        <SectionList
          sections={sections}
          keyExtractor={(m) => String(m.id)}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <AppText
              variant="label"
              tone="muted"
              style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs, backgroundColor: colors.background }}
            >
              {section.title}
            </AppText>
          )}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title} by ${item.user?.name ?? 'someone'}`}
              onPress={() => router.push(`/messages/${item.id}`)}
              style={({ pressed }) => [
                { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, paddingVertical: spacing.md },
                pressed && { backgroundColor: colors.surface },
              ]}
            >
              <AppAvatar user={item.user} size={34} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                  <AppText variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {item.user?.name ?? ''}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {fmtDateTime(item.created_at).split(', ').pop()}
                  </AppText>
                </View>
                <AppText weight="600">{item.title}</AppText>
                {item.body ? (
                  <AppText tone="muted" numberOfLines={2}>
                    {plain(item.body)}
                  </AppText>
                ) : null}
                {item.reply_count ? (
                  <AppText variant="caption" tone="muted">
                    {`${item.reply_count} ${item.reply_count === 1 ? 'reply' : 'replies'}`}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<AppEmptyState icon="mail-outline" title="No messages" message="Start a conversation with the project team." />}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.accent} />}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
        />
      </QueryBoundary>
      <AppFab label="New message" onPress={() => router.push(`/compose-message?project=${pid}`)} />
    </AppScreen>
  );
}
