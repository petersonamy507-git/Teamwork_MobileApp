import { Stack } from 'expo-router';
import { ScreenCrash } from '../../../components';
import { AccountButton } from '../../../features/shell';
import { useTheme } from '../../../theme';

/**
 * One stack per bottom tab (Home, Projects, Notifications, My work). Every screen below is shared by
 * the four stacks, so opening a project, task or message keeps the bottom tab bar visible and
 * stays in the tab it was opened from, like the reference app.
 */
export const unstable_settings = {
  anchor: 'index',
  home: { anchor: 'index' },
  projects: { anchor: 'projects' },
  notifications: { anchor: 'notifications' },
  mywork: { anchor: 'my-work' },
};

export default function TabStack() {
  const { colors } = useTheme();
  const root = { headerLeft: () => <AccountButton /> };
  return (
    <Stack
      unstable_screenErrorBoundary={ScreenCrash}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home', ...root }} />
      <Stack.Screen name="projects" options={{ title: 'Projects', ...root }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', ...root }} />
      <Stack.Screen name="my-work" options={{ title: 'My work', ...root }} />
      <Stack.Screen name="hq" options={{ title: 'HQ' }} />
      <Stack.Screen name="activity" options={{ title: 'Activity' }} />
      <Stack.Screen name="my-day" options={{ title: 'My day' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="profile" options={{ title: '' }} />
      <Stack.Screen name="search" options={{ title: 'Search Crewdesk' }} />
      <Stack.Screen name="shortcuts" options={{ title: 'Shortcuts' }} />
      <Stack.Screen name="time" options={{ title: 'Time' }} />
      <Stack.Screen name="files/[id]" options={{ title: 'File' }} />
      <Stack.Screen name="tasks/[id]" options={{ title: 'Task' }} />
      <Stack.Screen name="messages/[id]" options={{ title: 'Message' }} />
      <Stack.Screen name="projects/[id]/index" options={{ title: 'Project' }} />
    </Stack>
  );
}
