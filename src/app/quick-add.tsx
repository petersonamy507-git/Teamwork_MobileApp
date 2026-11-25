import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { AppChipGroup, AppListItem, AppScreen, AppSearchBar, AppText, QueryBoundary } from '../components';
import { useProjects } from '../features/projects';
import { spacing } from '../theme';

const KINDS = [
  ['task', 'Task'],
  ['message', 'Message'],
  ['notebook', 'Notebook'],
] as const;
type Kind = (typeof KINDS)[number][0];

/** "+" quick add: choose what to create, then the project it goes in. */
export default function QuickAddScreen() {
  const router = useRouter();
  const { kind: initial } = useLocalSearchParams<{ kind?: Kind }>();
  const [kind, setKind] = useState<Kind>(initial === 'message' || initial === 'notebook' ? initial : 'task');
  const [q, setQ] = useState('');
  const projects = useProjects('active');
  const list = (projects.data ?? []).filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  const go = (pid: number) => {
    const to = kind === 'task' ? `/projects/${pid}/new-task` : kind === 'message' ? `/compose-message?project=${pid}` : `/projects/${pid}/notebooks?compose=1`;
    router.replace(to as never);
  };
  return (
    <AppScreen>
      <View style={{ paddingTop: spacing.sm }}>
        <AppText variant="label" tone="muted" style={{ paddingHorizontal: spacing.lg }}>
          What do you want to add?
        </AppText>
        <AppChipGroup options={KINDS} value={kind} onChange={setKind} />
        <AppText variant="label" tone="muted" style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          Choose project
        </AppText>
        <AppSearchBar value={q} onChangeText={setQ} placeholder="Search projects" />
      </View>
      <QueryBoundary query={projects}>
        <FlatList
          data={list}
          keyExtractor={(p) => String(p.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <AppListItem icon="folder-outline" title={item.name} subtitle={item.client?.name} onPress={() => go(item.id)} chevron />}
        />
      </QueryBoundary>
    </AppScreen>
  );
}
