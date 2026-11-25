import type { ReactNode } from 'react';
import { AppErrorState } from './AppErrorState';
import { AppSkeleton } from './AppSkeleton';

type QueryLike = { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };

/** Renders the shared loading / error state for a query, then the children once data is there. */
export function QueryBoundary({ query, children }: { query: QueryLike; children: ReactNode }) {
  if (query.isPending) return <AppSkeleton />;
  if (query.isError) return <AppErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <>{children}</>;
}
