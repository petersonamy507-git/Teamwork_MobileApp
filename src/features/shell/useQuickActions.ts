import { useRouter } from 'expo-router';
import type { SpeedDialAction } from '../../components';

/** The "+" actions offered on Home, Notifications, My day and My work. */
export function useQuickActions(projectId?: number): SpeedDialAction[] {
  const router = useRouter();
  return [
    { label: 'Message', icon: 'mail-outline', onPress: () => router.push(projectId ? `/compose-message?project=${projectId}` : '/compose-message') },
    { label: 'Task', icon: 'checkbox-outline', onPress: () => router.push(projectId ? `/projects/${projectId}/new-task` : '/quick-add?kind=task') },
    { label: 'Notebook', icon: 'book-outline', onPress: () => router.push('/quick-add?kind=notebook') },
  ];
}
