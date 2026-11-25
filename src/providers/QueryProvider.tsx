import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { isApiError } from '../services/api';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, err) => count < 2 && !(isApiError(err) && ['unauthorized', 'forbidden', 'not_found', 'config'].includes(err.kind)),
          },
          mutations: { retry: false },
        },
      }),
  );

  // Refetch stale data when the app returns to the foreground, so web edits show up on mobile.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => focusManager.setFocused(s === 'active'));
    onlineManager.setOnline(true);
    return () => sub.remove();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
