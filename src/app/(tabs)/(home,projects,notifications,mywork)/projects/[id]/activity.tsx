import { ProjectSectionHeader } from '../../../../../features/shell';
import { useLocalSearchParams } from 'expo-router';
import { AppScreen, QueryBoundary } from '../../../../../components';
import { ActivityFeed } from '../../../../../features/activity';
import { useProjectActivity } from '../../../../../features/projects';

export default function ProjectActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useProjectActivity(Number(id));
  return (
    <AppScreen>
      <ProjectSectionHeader projectId={Number(id)} section="activity" />
      <QueryBoundary query={q}>
        <ActivityFeed items={q.data ?? []} refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />
      </QueryBoundary>
    </AppScreen>
  );
}
