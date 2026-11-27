import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  AppAvatar,
  AppAvatarStack,
  AppButton,
  AppCard,
  AppChip,
  AppIcon,
  AppInput,
  AppText,
  useToast,
  type IconName,
} from '../../../components';
import { useActivity } from '../../../features/activity';
import { isClientUser, useAuth } from '../../../features/auth';
import { useHqPrefs, useUpcomingEvents } from '../../../features/hq';
import { linkToRoute } from '../../../features/notifications';
import { useCategories, useProjects } from '../../../features/projects';
import { TaskRow, useTasks, useUpdateTask } from '../../../features/tasks';
import { radius, readable, spacing, useTheme } from '../../../theme';
import type { Task, UserRef } from '../../../types/models';
import { ageMs, fmtDate, timeAgo } from '../../../utils/format';

type Panel = 'tasks' | 'events' | 'bookmarks' | 'activity' | 'notes';
const PANELS: [Panel, string, IconName][] = [
  ['tasks', 'My Tasks', 'checkbox-outline'],
  ['events', 'My Events', 'calendar-outline'],
  ['bookmarks', 'My Bookmarks', 'bookmark-outline'],
  ['activity', 'My Activity', 'pulse-outline'],
  ['notes', 'My Notes', 'create-outline'],
];
type Folder = 'all' | 'none' | number;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

/** HQ: the web's /hq overview — greeting, your projects (pin / bookmark / folders), recent activity and "My" panels. */
export default function HqScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const projects = useProjects('active');
  const cats = useCategories();
  const activity = useActivity();
  const hq = useHqPrefs();
  const [folder, setFolder] = useState<Folder>('all');
  const [panel, setPanel] = useState<Panel>('tasks');

  const allActivity = useMemo(() => (Array.isArray(activity.data) ? activity.data : []), [activity.data]);
  const list = useMemo(() => {
    const all = Array.isArray(projects.data) ? projects.data : [];
    return all
      .filter((p) => folder === 'all' || (folder === 'none' ? !p.category_id : p.category_id === folder))
      .sort((a, b) => Number(hq.pinned.includes(b.id)) - Number(hq.pinned.includes(a.id)) || a.name.localeCompare(b.name));
  }, [projects.data, folder, hq.pinned]);
  const recent = allActivity.slice(0, 6);
  const activePeople = useMemo(() => {
    const m = new Map<number, UserRef>();
    allActivity.forEach((a) => a.user && ageMs(a.created_at) < 86400_000 && m.set(a.user.id, a.user));
    return [...m.values()];
  }, [allActivity]);
  const isNew = allActivity.some((a) => ageMs(a.created_at) < 3600_000);
  const folders = Array.isArray(cats.data) ? cats.data : [];
  // Two project cards per row once there is room (large phones in landscape, tablets).
  const twoUp = Math.min(width, 720) >= 560;
  const client = isClientUser(user);

  const refreshing = projects.isRefetching || activity.isRefetching;
  const refresh = () => {
    void projects.refetch();
    void activity.refetch();
  };
  const safe = (p: Promise<unknown>, ok?: string) =>
    p.then(() => ok && toast(ok)).catch((e: Error) => toast(e.message || 'Could not save', 'error'));

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[readable, styles.wrap]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <Stack.Screen options={{ title: 'HQ' }} />

      <View style={styles.block}>
        <View style={styles.rowBetween}>
          <AppText variant="title" style={{ flexShrink: 1 }}>{`${greeting()}, ${user?.name?.split(' ')[0] ?? ''}`}</AppText>
          {isNew ? (
            <View style={styles.newBadge}>
              <View style={[styles.dot, { backgroundColor: '#e2445c' }]} />
              <AppText variant="caption">New for you</AppText>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Go, jump, or search"
          onPress={() => router.push('/search')}
          style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppIcon name="search" size={18} />
          <AppText tone="muted">Go, jump, or search…</AppText>
        </Pressable>
        {client ? null : (
          <View style={styles.actions}>
            <AppButton title="Add new" variant="secondary" onPress={() => router.push('/quick-add')} style={styles.action} />
            <AppButton title="My work" variant="secondary" onPress={() => router.navigate('/(tabs)/(mywork)/my-work')} style={styles.action} />
          </View>
        )}
      </View>

      <View style={styles.block}>
        <AppText variant="heading" accessibilityRole="header">
          Your projects
        </AppText>
        {folders.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
            <AppChip label="All" selected={folder === 'all'} onPress={() => setFolder('all')} />
            {folders.map((c) => (
              <AppChip key={c.id} label={c.name} selected={folder === c.id} onPress={() => setFolder(c.id)} />
            ))}
            <AppChip label="No folder" selected={folder === 'none'} onPress={() => setFolder('none')} />
          </ScrollView>
        ) : null}
        {projects.isError ? (
          <AppText tone="muted">{"Couldn't load projects. Pull down to try again."}</AppText>
        ) : projects.isPending ? (
          <AppText tone="muted">Loading projects…</AppText>
        ) : list.length ? (
          <View style={styles.cards}>
            {list.map((p) => {
              const link = `/projects/${p.id}`;
              const pinned = hq.pinned.includes(p.id);
              const marked = hq.isMarked(link);
              return (
                <AppCard
                  key={p.id}
                  onPress={() => router.push(`/projects/${p.id}`)}
                  accessibilityLabel={`Project ${p.name}`}
                  style={[styles.card, { width: twoUp ? '48.5%' : '100%', borderLeftColor: p.color || colors.accent }]}
                >
                  <View style={styles.rowBetween}>
                    <AppText weight="600" numberOfLines={2} style={{ flex: 1 }}>
                      {p.name}
                    </AppText>
                    <View style={styles.tools}>
                      <ToolButton
                        icon={pinned ? 'pin' : 'pin-outline'}
                        on={pinned}
                        label={pinned ? `Unpin ${p.name}` : `Pin ${p.name} to top`}
                        onPress={() => safe(hq.togglePin(p.id))}
                      />
                      <ToolButton
                        icon={marked ? 'bookmark' : 'bookmark-outline'}
                        on={marked}
                        label={marked ? `Remove bookmark for ${p.name}` : `Bookmark ${p.name}`}
                        onPress={() => safe(hq.toggleMark(p.name, link), marked ? 'Bookmark removed' : 'Bookmarked')}
                      />
                    </View>
                  </View>
                  <AppText variant="caption" tone="muted" numberOfLines={2}>
                    {p.client ? `Client: ${p.client.name}` : p.description || 'Project'}
                  </AppText>
                  {p.members?.length ? <AppAvatarStack users={p.members} max={8} size={22} /> : null}
                </AppCard>
              );
            })}
          </View>
        ) : (
          <AppText tone="muted">{folder === 'all' ? 'You have no projects yet.' : 'No projects in this folder.'}</AppText>
        )}
      </View>

      <View style={styles.block}>
        <View style={styles.rowBetween}>
          <AppText variant="heading" accessibilityRole="header">
            Most recent activity
          </AppText>
          <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.push('/activity')}>
            <AppText tone="accent">View all</AppText>
          </Pressable>
        </View>
        <AppCard style={{ gap: spacing.md }}>
          {recent.length ? (
            recent.map((a) => (
              <Pressable
                key={a.id}
                disabled={!a.project_id}
                onPress={() => a.project_id && router.push(`/projects/${a.project_id}`)}
                style={styles.actRow}
              >
                <AppAvatar user={a.user} size={26} />
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" tone="muted">
                    {timeAgo(a.created_at)}
                  </AppText>
                  <AppText>
                    <AppText weight="600">{a.user?.name || 'Someone'}</AppText> {a.action}
                    {a.project_name ? <AppText tone="accent">{` — ${a.project_name}`}</AppText> : null}
                  </AppText>
                </View>
              </Pressable>
            ))
          ) : (
            <AppText tone="muted">{activity.isPending ? 'Loading…' : 'Nothing has happened yet.'}</AppText>
          )}
          <View style={{ gap: spacing.sm }}>
            <AppText variant="label">{`${activePeople.length} ${activePeople.length === 1 ? 'person' : 'people'} active in the last 24 hours`}</AppText>
            {activePeople.length ? <AppAvatarStack users={activePeople} max={10} size={26} /> : null}
          </View>
        </AppCard>
      </View>

      <View style={styles.block}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
          {PANELS.map(([k, label]) => (
            <AppChip key={k} label={label} selected={panel === k} onPress={() => setPanel(k)} />
          ))}
        </ScrollView>
        <AppCard style={{ gap: spacing.sm }}>
          <PanelBody kind={panel} />
        </AppCard>
      </View>
    </ScrollView>
  );
}

function ToolButton({ icon, on, label, onPress }: { icon: IconName; on: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={styles.tool}>
      <AppIcon name={icon} size={18} color={on ? colors.accent : colors.textMuted} />
    </Pressable>
  );
}

function PanelBody({ kind }: { kind: Panel }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const hq = useHqPrefs();
  const tasks = useTasks({ assignee: 'me', status: 'open' }, kind === 'tasks');
  const events = useUpcomingEvents(kind === 'events');
  const activity = useActivity();
  const update = useUpdateTask();

  if (kind === 'tasks') {
    const list = Array.isArray(tasks.data) ? tasks.data : [];
    const toggle = (t: Task) =>
      update.mutate(
        { id: t.id, patch: { status: t.status === 'completed' ? 'new' : 'completed' } },
        { onSuccess: () => toast('Task completed'), onError: (e) => toast(e.message, 'error') },
      );
    return (
      <>
        {tasks.isPending ? <AppText tone="muted">Loading…</AppText> : null}
        {list.slice(0, 15).map((t) => (
          <TaskRow key={t.id} task={t} onPress={() => router.push(`/tasks/${t.id}`)} onToggle={toggle} />
        ))}
        {!tasks.isPending && !list.length ? <AppText tone="muted">{tasks.isError ? "Couldn't load your tasks." : 'You have no open tasks.'}</AppText> : null}
        <AppButton title="Open My work" variant="secondary" onPress={() => router.navigate('/(tabs)/(mywork)/my-work')} />
      </>
    );
  }

  if (kind === 'events') {
    const list = Array.isArray(events.data) ? events.data : [];
    if (events.isPending) return <AppText tone="muted">Loading…</AppText>;
    if (events.isError) return <AppText tone="muted">{"Couldn't load your events."}</AppText>;
    if (!list.length) return <AppText tone="muted">No upcoming events.</AppText>;
    return (
      <>
        {list.map((e) => (
          <View key={e.id} style={styles.line}>
            <AppIcon name="calendar-outline" size={16} />
            <AppText weight="600" style={{ flex: 1 }} numberOfLines={2}>
              {e.title}
            </AppText>
            <AppText variant="caption" tone="muted">
              {`${fmtDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })} ${e.start_time ?? ''}`.trim()}
            </AppText>
          </View>
        ))}
      </>
    );
  }

  if (kind === 'bookmarks') {
    if (!hq.bookmarks.length)
      return <AppText tone="muted">Bookmark a project with the bookmark icon on its card to find it here.</AppText>;
    return (
      <>
        {hq.bookmarks.map((b) => {
          const to = linkToRoute(b.link);
          return (
            <Pressable
              key={b.link}
              accessibilityRole="button"
              onPress={() => (to ? router.push(to) : toast('This bookmark only opens on the web', 'error'))}
              style={styles.line}
            >
              <AppIcon name="bookmark" size={16} color="#4461d7" />
              <AppText weight="600" style={{ flex: 1 }} numberOfLines={1}>
                {b.title}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove bookmark ${b.title}`}
                hitSlop={8}
                onPress={() => void hq.toggleMark(b.title, b.link).catch((e: Error) => toast(e.message, 'error'))}
              >
                <AppIcon name="close" size={16} />
              </Pressable>
            </Pressable>
          );
        })}
      </>
    );
  }

  if (kind === 'activity') {
    const mine = (Array.isArray(activity.data) ? activity.data : []).filter((a) => a.user?.id === user?.id).slice(0, 30);
    if (activity.isPending) return <AppText tone="muted">Loading…</AppText>;
    if (!mine.length) return <AppText tone="muted">{"You haven't done anything yet."}</AppText>;
    return (
      <>
        {mine.map((a) => (
          <View key={a.id} style={styles.line}>
            <AppText style={{ flex: 1 }}>
              {a.action}
              {a.project_name ? <AppText tone="muted">{` · ${a.project_name}`}</AppText> : null}
            </AppText>
            <AppText variant="caption" tone="muted">
              {timeAgo(a.created_at)}
            </AppText>
          </View>
        ))}
      </>
    );
  }

  return <NotesPanel initial={hq.notes} loaded={hq.loaded} save={hq.saveNotes} />;
}

/** Private notes, saved to the user's prefs 600 ms after typing stops (same as the web). */
function NotesPanel({ initial, loaded, save }: { initial: string; loaded: boolean; save: (t: string) => Promise<unknown> }) {
  const [text, setText] = useState(initial);
  const [state, setState] = useState<'saved' | 'saving' | 'error'>('saved');
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) setText(initial);
  }, [initial]);
  useEffect(() => {
    if (!dirty.current) return;
    setState('saving');
    const t = setTimeout(() => {
      save(text)
        .then(() => {
          dirty.current = false;
          setState('saved');
        })
        .catch(() => setState('error'));
    }, 600);
    return () => clearTimeout(t);
  }, [text, save]);
  return (
    <>
      <AppInput
        value={text}
        editable={loaded}
        onChangeText={(v) => {
          dirty.current = true;
          setText(v);
        }}
        placeholder="Private notes only you can see. They save automatically."
        multiline
        style={{ minHeight: 140, textAlignVertical: 'top' }}
      />
      <AppText variant="caption" tone={state === 'error' ? 'danger' : 'muted'}>
        {state === 'saved' ? 'Saved' : state === 'saving' ? 'Saving…' : "Couldn't save. Keep typing to try again."}
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 48 },
  block: { gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  newBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  action: { flexGrow: 1 },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  card: { gap: spacing.sm, borderLeftWidth: 4 },
  tools: { flexDirection: 'row', gap: spacing.xs },
  tool: { padding: 4 },
  actRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
});
