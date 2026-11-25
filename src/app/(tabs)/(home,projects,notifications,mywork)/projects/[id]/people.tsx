import { ProjectSectionHeader } from '../../../../../features/shell';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import { AppAvatar, AppEmptyState, AppListItem, AppScreen, QueryBoundary } from '../../../../../components';
import { useProjectPeople } from '../../../../../features/projects';

export default function ProjectPeopleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useProjectPeople(Number(id));
  return (
    <AppScreen>
      <ProjectSectionHeader projectId={Number(id)} section="people" />
      <QueryBoundary query={q}>
        <FlatList
          data={q.data}
          keyExtractor={(u) => String(u.id)}
          renderItem={({ item }) => (
            <AppListItem
              left={<AppAvatar user={item} size={34} />}
              title={item.name}
              subtitle={item.email}
              chevron
              onPress={() => router.push(`/profile?id=${item.id}`)}
            />
          )}
          ListEmptyComponent={<AppEmptyState icon="people-outline" title="No people" message="Nobody has been added to this project yet." />}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </QueryBoundary>
    </AppScreen>
  );
}
