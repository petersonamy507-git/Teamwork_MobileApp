import { apiClient } from '../../services/api';
import type { InboxItem } from '../../types/models';
import { qs } from '../../utils/format';

export type ReadFilter = '' | 'unread' | 'read';

// The web Inbox uses these existing endpoints.
export const notificationsApi = {
  list: (read: ReadFilter) => apiClient.get<{ items: InboxItem[] }>(`/inbox2${qs({ read })}`),
  count: () => apiClient.get<{ unread: number }>('/inbox/count'),
  setRead: (id: number, read: boolean) => apiClient.post(`/inbox/${id}/read?read=${read}`),
  readAll: () => apiClient.post('/inbox/read-all'),
};
