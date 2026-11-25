import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import type { ActivityItem } from '../../types/models';
import { qk } from '../queryKeys';

export const activityApi = { list: () => apiClient.get<ActivityItem[]>('/activity') };
export const useActivity = () => useQuery({ queryKey: qk.activity, queryFn: activityApi.list });
