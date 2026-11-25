import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SectionList, TextInput } from 'react-native';
import { AppAvatar, AppEmptyState, AppListItem, AppScreen, AppSkeleton, AppText } from '../../../components';
import { useSearch } from '../../../features/search';
import { MAX_FONT_SCALE, spacing, useTheme } from '../../../theme';

type Row = {
  key: string;
  title: string;
  subtitle?: string | null;
  icon?: 'checkbox-outline' | 'folder-outline' | 'mail-outline';
  person?: { name: string; color?: string | null };
  go?: () => void;
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const r = useSearch(debounced);

  const sections = r.data
    ? [
        {
          title: 'Tasks',
          data: (r.data.tasks ?? []).map<Row>((t) => ({
            key: `t${t.id}`,
            title: t.title,
            subtitle: t.project_name,
            icon: 'checkbox-outline',
            go: () => router.push(`/tasks/${t.id}`),
          })),
        },
        {
          title: 'Projects',
          data: (r.data.projects ?? []).map<Row>((p) => ({
            key: `p${p.id}`,
            title: p.name,
            subtitle: p.client?.name,
            icon: 'folder-outline',
            go: () => router.push(`/projects/${p.id}`),
          })),
        },
        {
          title: 'Messages',
          data: (r.data.messages ?? []).map<Row>((m) => ({
            key: `m${m.id}`,
            title: m.title,
            subtitle: m.project_name,
            icon: 'mail-outline',
            go: () => router.push(`/messages/${m.id}`),
          })),
        },
        {
          title: 'People',
          data: (r.data.people ?? []).map<Row>((u) => ({
            key: `u${u.id}`,
            title: u.name,
            subtitle: u.email,
            person: u,
            go: () => router.push(`/profile?id=${u.id}`),
          })),
        },
      ].filter((s) => s.data.length)
    : [];

  return (
    <AppScreen>
      {/* The field sits right under the back arrow, like "Search Teamwork" in the reference. It lives in the
          screen (not the header) so it keeps focus while results update. */}
      <Stack.Screen options={{ title: '' }} />
      <TextInput
        accessibilityRole="search"
        accessibilityLabel="Search Crewdesk"
        autoFocus
        value={q}
        onChangeText={setQ}
        placeholder="Search Crewdesk"
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        returnKeyType="search"
        style={{ color: colors.text, fontSize: 20, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
      />
      {debounced.length < 2 ? (
        <AppEmptyState icon="search-outline" title="Search Crewdesk" message="Type at least two characters." />
      ) : r.isPending ? (
        <AppSkeleton />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(x) => x.key}
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }) => (
            <AppText variant="label" tone="muted" style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
              {section.title}
            </AppText>
          )}
          renderItem={({ item }) => (
            <AppListItem
              icon={item.icon}
              left={item.person ? <AppAvatar user={item.person} size={30} /> : undefined}
              title={item.title}
              subtitle={item.subtitle}
              onPress={item.go}
              chevron={!!item.go}
            />
          )}
          ListEmptyComponent={
            <AppEmptyState
              icon="search-outline"
              title="Oops! Nothing found…"
              message="We couldn't find anything matching that, try searching for something else."
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        />
      )}
    </AppScreen>
  );
}
