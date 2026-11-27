import { Stack, useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppCard, AppDivider, AppHeaderMenu, AppIcon, AppListItem, AppSpeedDial, AppText, type IconName } from '../../../components';
import { FeedbackSheet } from '../../../features/feedback';
import { useRecentProjects } from '../../../features/home';
import { useHomeSections, useShortcuts } from '../../../features/prefs';
import { useQuickActions } from '../../../features/shell';
import { radius, readable, spacing, useTheme } from '../../../theme';
import { timeAgo } from '../../../utils/format';

const VIEWS: { label: string; icon: IconName; href: Href; tint: string }[] = [
  { label: 'HQ', icon: 'business-outline', href: '/hq', tint: '#4461d7' },
  { label: 'Activity', icon: 'flash-outline', href: '/activity', tint: '#14b8a6' },
  // My work lives in its own tab, as in the reference app.
  { label: 'My work', icon: 'list-outline', href: '/(tabs)/(mywork)/my-work', tint: '#6366f1' },
  { label: 'My day', icon: 'sunny-outline', href: '/my-day', tint: '#8b5cf6' },
];

function SectionHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.head}>
      <AppText variant="label" accessibilityRole="header" style={{ fontSize: 16 }}>
        {title}
      </AppText>
      {right}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, dark, setAppearance } = useTheme();
  const recents = useRecentProjects(5);
  const shortcuts = useShortcuts();
  const { sections } = useHomeSections();
  const actions = useQuickActions();
  const [feedback, setFeedback] = useState(false);
  const arrow = (label: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={10} onPress={onPress}>
      <AppIcon name="arrow-forward" size={22} color={colors.text} />
    </Pressable>
  );

  const blocks: Record<string, ReactNode> = {
    views: (
      <View key="views" style={styles.block}>
        <SectionHead
          title="Views"
          right={<AppHeaderMenu items={[{ label: 'Customise Home', icon: 'options-outline', onPress: () => router.push('/home-settings') }]} />}
        />
        <View style={styles.grid}>
          {VIEWS.map((v) => (
            <AppCard key={v.label} onPress={() => router.push(v.href)} accessibilityLabel={v.label} style={styles.view}>
              <View style={[styles.viewIcon, { backgroundColor: v.tint }]}>
                <AppIcon name={v.icon} size={18} color="#fff" />
              </View>
              <AppText weight="500">{v.label}</AppText>
            </AppCard>
          ))}
        </View>
      </View>
    ),
    recents: (
      <View key="recents" style={styles.block}>
        <SectionHead title="Recents" right={arrow('All projects', () => router.navigate('/(tabs)/(projects)/projects'))} />
        <AppCard style={{ padding: 0 }}>
          {recents.isError ? (
            <AppText tone="muted" style={{ padding: spacing.lg }}>
              {"Couldn't load recents."}
            </AppText>
          ) : recents.items.length ? (
            recents.items.map(({ project: p, viewedAt }, i) => (
              <View key={p.id}>
                {i ? <AppDivider inset={64} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Project ${p.name}`}
                  onPress={() => router.push(`/projects/${p.id}/tasks`)}
                  style={({ pressed }) => [styles.recent, pressed && { backgroundColor: colors.surfaceAlt }]}
                >
                  <View style={[styles.tile, { backgroundColor: colors.background }]}>
                    <AppIcon name="folder-outline" size={20} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.recentTop}>
                      <AppText variant="caption" tone="muted">
                        Project
                      </AppText>
                      {viewedAt ? (
                        <AppText variant="caption" tone="muted">
                          {timeAgo(viewedAt)}
                        </AppText>
                      ) : null}
                    </View>
                    <AppText numberOfLines={1}>{p.name}</AppText>
                  </View>
                </Pressable>
              </View>
            ))
          ) : (
            <AppText tone="muted" style={{ padding: spacing.lg }}>
              {recents.isPending ? 'Loading…' : 'Projects you open will appear here.'}
            </AppText>
          )}
        </AppCard>
      </View>
    ),
    shortcuts: (
      <View key="shortcuts" style={styles.block}>
        <SectionHead title="Shortcuts" right={arrow('All shortcuts', () => router.push('/shortcuts'))} />
        <AppCard style={{ padding: 0 }}>
          {shortcuts.list.length ? (
            shortcuts.list.slice(0, 6).map((s, i) => (
              <View key={s.key}>
                {i ? <AppDivider inset={50} /> : null}
                <AppListItem icon={s.icon as IconName} title={s.title} subtitle={s.subtitle} onPress={() => router.push(s.href as Href)} chevron />
              </View>
            ))
          ) : (
            <AppListItem
              left={<AppIcon name="bookmark" size={22} color={colors.accent} />}
              title="You have no pinned shortcuts right now. Go to any screen and add a shortcut from the menu."
            />
          )}
        </AppCard>
      </View>
    ),
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerBtns}>
              <Pressable accessibilityRole="button" accessibilityLabel="Search" hitSlop={10} onPress={() => router.push('/search')}>
                <AppIcon name="search" size={22} color={colors.text} />
              </Pressable>
              <AppHeaderMenu
                items={[
                  { label: 'Customise Home', icon: 'options-outline', onPress: () => router.push('/home-settings') },
                  {
                    label: dark ? 'Light mode' : 'Dark mode',
                    icon: dark ? 'sunny-outline' : 'moon-outline',
                    onPress: () => setAppearance(dark ? 'light' : 'dark'),
                  },
                  { label: 'Feedback', icon: 'chatbubble-ellipses-outline', onPress: () => setFeedback(true) },
                  { label: 'Settings', icon: 'settings-outline', onPress: () => router.push('/settings') },
                ]}
              />
            </View>
          ),
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[readable, styles.wrap]}
        refreshControl={<RefreshControl refreshing={recents.isRefetching} onRefresh={() => void recents.refetch()} tintColor={colors.accent} />}
      >
        {sections.filter((s) => s.enabled).map((s) => blocks[s.key])}
        {sections.every((s) => !s.enabled) ? (
          <AppText tone="muted" style={{ textAlign: 'center' }}>
            All Home sections are hidden. Use ⋮ › Customise Home to show them.
          </AppText>
        ) : null}
      </ScrollView>
      <AppSpeedDial actions={actions} />
      <FeedbackSheet visible={feedback} onClose={() => setFeedback(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 110 },
  block: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingRight: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  view: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  viewIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  recent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, paddingHorizontal: spacing.lg },
  recentTop: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
