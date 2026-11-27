import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Image, View } from 'react-native';
import { ScreenCrash, ToastProvider } from '../components';
import { AuthProvider, useAuth } from '../features/auth';
import { QueryProvider } from '../providers/QueryProvider';
import { ThemeProvider, useTheme } from '../theme';
import { UpdatePrompt } from '../features/update';

/** Last-resort catch for anything a screen boundary misses: shows a retry screen instead of closing the app. */
export const ErrorBoundary = ScreenCrash;

function RootStack() {
  const { user, restoring } = useAuth();
  const { colors, dark } = useTheme();
  if (restoring)
    return (
      // Same look as the native splash: Crewdesk mark with a spinner while the saved session is checked.
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32, backgroundColor: colors.background }}>
        <Image source={require('../../assets/splash-icon.png')} style={{ width: 96, height: 96 }} accessibilityLabel="Crewdesk" />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
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
        {/* Signed-out users can only reach the login screen; signed-in users never see it. */}
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-account" options={{ title: 'Add account', presentation: 'modal' }} />
          <Stack.Screen name="compose-message" options={{ title: 'New message', presentation: 'modal' }} />
          <Stack.Screen name="home-settings" options={{ title: 'Customise Home', presentation: 'modal' }} />
          <Stack.Screen name="quick-add" options={{ title: 'Add new', presentation: 'modal' }} />
          <Stack.Screen name="projects/[id]/new-task" options={{ title: 'New task', presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
      {user ? <UpdatePrompt /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <RootStack />
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
