import { AppScreen, QueryBoundary } from '../../../components';
import { ActivityFeed, useActivity } from '../../../features/activity';

export default function ActivityScreen() {
  const q = useActivity();
  return (
    <AppScreen>
      <QueryBoundary query={q}>
        <ActivityFeed items={q.data ?? []} refreshing={q.isRefetching} onRefresh={() => void q.refetch()} groupBy="project" />
      </QueryBoundary>
    </AppScreen>
  );
}
