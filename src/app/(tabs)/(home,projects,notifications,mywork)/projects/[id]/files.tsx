import * as DocumentPicker from 'expo-document-picker';
import { ProjectSectionHeader } from '../../../../../features/shell';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList } from 'react-native';
import { AppEmptyState, AppFab, AppListItem, AppScreen, AppSearchBar, AppText, QueryBoundary, useToast } from '../../../../../components';
import { openProjectFile } from '../../../../../features/files';
import { useProjectFiles, useUploadFile } from '../../../../../features/projects';
import { spacing, useTheme } from '../../../../../theme';
import type { ProjectFile } from '../../../../../types/models';
import { groupByDay } from '../../../../../utils/format';

const kb = (n?: number) => (n == null ? '' : n < 1024 ? `${n} B` : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} kB`);
const MAX_BYTES = 25 * 1024 * 1024;

export default function ProjectFilesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Number(id);
  const toast = useToast();
  const router = useRouter();
  const { colors } = useTheme();
  const q = useProjectFiles(pid);
  const [search, setSearch] = useState('');
  const sections = useMemo(() => {
    const t = search.trim().toLowerCase();
    return groupByDay(
      (q.data ?? []).filter((f) => !t || f.name.toLowerCase().includes(t) || (f.user?.name ?? '').toLowerCase().includes(t)),
      (f) => f.created_at,
    );
  }, [q.data, search]);
  const upload = useUploadFile(pid);
  const [opening, setOpening] = useState<number | null>(null);

  const open = async (f: ProjectFile) => {
    setOpening(f.id);
    try {
      await openProjectFile(f);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not open the file', 'error');
    } finally {
      setOpening(null);
    }
  };

  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    if (a.size && a.size > MAX_BYTES) return toast('Files must be 25 MB or smaller', 'error');
    upload.mutate(
      { uri: a.uri, name: a.name, type: a.mimeType || 'application/octet-stream' },
      {
        onSuccess: () => toast('File uploaded'),
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

  return (
    <AppScreen>
      <ProjectSectionHeader projectId={Number(id)} section="files" />
      <AppSearchBar value={search} onChangeText={setSearch} placeholder="Search" />
      <QueryBoundary query={q}>
        <SectionList
          sections={sections}
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
          keyExtractor={(f) => String(f.id)}
          renderItem={({ item }) => (
            <AppListItem
              icon={
                /\.pdf$/i.test(item.name) ? 'document-text-outline' : /\.(png|jpe?g|gif|webp|heic)$/i.test(item.name) ? 'image-outline' : 'document-outline'
              }
              title={item.name}
              subtitle={[item.user?.name, kb(item.size)].filter(Boolean).join(' ')}
              right={opening === item.id ? <ActivityIndicator color={colors.accent} /> : undefined}
              onPress={() => router.push(`/files/${item.id}?project=${pid}`)}
              onLongPress={() => void open(item)}
              chevron
            />
          )}
          ListEmptyComponent={
            <AppEmptyState
              icon="document-outline"
              title={search ? 'Oops! Nothing found…' : 'No files'}
              message={search ? 'Try searching for something else.' : 'Tap + to upload a file to this project.'}
            />
          }
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.accent} />}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
        />
      </QueryBoundary>
      {upload.isPending ? null : <AppFab label="Upload file" onPress={() => void pick()} />}
    </AppScreen>
  );
}
