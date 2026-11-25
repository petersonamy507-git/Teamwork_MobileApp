import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon, type IconName } from '../../components';
import { useAuth } from '../../features/auth';
import { useUnreadCount } from '../../features/notifications';
import { MAX_FONT_SCALE, radius, useTheme } from '../../theme';

/** Material-style bottom bar as in the reference: icons, and the active tab gets a pill and its label. */
export default function TabsLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const unread = useUnreadCount(!!user);

  const icon = (name: IconName) =>
    function TabIconFor({ focused }: { focused: boolean }) {
      return <TabIcon name={name} focused={focused} />;
    };
  const label = (text: string) =>
    function TabLabelFor({ focused }: { focused: boolean }) {
      return focused ? <TabLabel text={text} /> : null;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border, height: 72, paddingTop: 8 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="(home)" options={{ title: 'Home', tabBarIcon: icon('home-outline'), tabBarLabel: label('Home') }} />
      <Tabs.Screen name="(projects)" options={{ title: 'Projects', tabBarIcon: icon('folder-outline'), tabBarLabel: label('Projects') }} />
      <Tabs.Screen
        name="(notifications)"
        options={{
          title: 'Notifications',
          tabBarIcon: icon('notifications-outline'),
          tabBarLabel: label('Notifications'),
          tabBarBadge: unread.data ? (unread.data > 99 ? '99+' : unread.data) : undefined,
        }}
      />
      <Tabs.Screen name="(mywork)" options={{ title: 'My work', tabBarIcon: icon('person-outline'), tabBarLabel: label('My work') }} />
    </Tabs>
  );
}

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, focused && { backgroundColor: colors.accentSoft }]}>
      <AppIcon name={name} size={22} color={focused ? colors.text : colors.textMuted} />
    </View>
  );
}

function TabLabel({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, { color: colors.text }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: { width: 56, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
