import { ProjectSectionHeader } from '../../../../../features/shell';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import {
  AppButton,
  AppEmptyState,
  AppFab,
  AppInput,
  AppListItem,
  AppModal,
  AppScreen,
  AppText,
  AppTextArea,
  QueryBoundary,
  useToast,
} from '../../../../../components';
import { useNotebooks, useSaveNotebook } from '../../../../../features/projects';
import { spacing, useTheme } from '../../../../../theme';
import type { Notebook } from '../../../../../types/models';
import { timeAgo } from '../../../../../utils/format';

const plain = (html?: string | null) =>
  (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

export default function NotebooksScreen() {
  const { id, compose } = useLocalSearchParams<{ id: string; compose?: string }>();
  const pid = Number(id);
  const toast = useToast();
  const { colors } = useTheme();
  const q = useNotebooks(pid);
  const save = useSaveNotebook(pid);
  const [viewing, setViewing] = useState<Notebook | null>(null);
  // Opened from quick add with ?compose=1 → start with the editor open.
  const [editing, setEditing] = useState<{ id?: number; title: string; body: string } | null>(compose ? { title: '', body: '' } : null);

  const submit = () => {
    if (!editing?.title.trim()) return toast('Give the notebook a title', 'error');
    save.mutate(
      { id: editing.id, title: editing.title.trim(), body: editing.body },
      {
        onSuccess: (n) => {
          toast(editing.id ? 'Notebook saved' : 'Notebook added');
          setEditing(null);
          if (viewing) setViewing(n);
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

  return (
    <AppScreen>
      <ProjectSectionHeader projectId={Number(id)} section="notebooks" />
      <QueryBoundary query={q}>
        <FlatList
          data={q.data}
          keyExtractor={(n) => String(n.id)}
          renderItem={({ item }) => (
            <AppListItem
              icon="book-outline"
              title={item.title}
              subtitle={[item.category, item.created_by?.name].filter(Boolean).join(' · ')}
              meta={timeAgo(item.updated_at)}
              onPress={() => setViewing(item)}
            />
          )}
          ListEmptyComponent={<AppEmptyState icon="book-outline" title="No Notebooks Yet" message="No notebooks have been added yet." />}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.accent} />}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
        />
      </QueryBoundary>
      <AppFab label="Add notebook" onPress={() => setEditing({ title: '', body: '' })} />

      <AppModal visible={!!viewing && !editing} onClose={() => setViewing(null)} title={viewing?.title}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <AppText>{plain(viewing?.body) || 'This notebook is empty.'}</AppText>
          <AppButton
            title="Edit"
            variant="secondary"
            icon="create-outline"
            onPress={() => viewing && setEditing({ id: viewing.id, title: viewing.title, body: plain(viewing.body) })}
          />
        </ScrollView>
      </AppModal>

      <AppModal visible={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit notebook' : 'New notebook'}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <AppInput label="Title" value={editing?.title ?? ''} onChangeText={(t) => setEditing((e) => e && { ...e, title: t })} />
          <AppTextArea label="Content" value={editing?.body ?? ''} onChangeText={(t) => setEditing((e) => e && { ...e, body: t })} style={{ minHeight: 180 }} />
          <AppButton title="Save" onPress={submit} loading={save.isPending} />
        </View>
      </AppModal>
    </AppScreen>
  );
}
