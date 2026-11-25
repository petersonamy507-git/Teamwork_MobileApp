import { useRouter, type Href } from 'expo-router';
import { FlatList, Pressable } from 'react-native';
import { AppEmptyState, AppIcon, AppListItem, AppScreen, useToast, type IconName } from '../../../components';
import { useShortcuts } from '../../../features/prefs';

export default function ShortcutsScreen() {
  const router = useRouter();
  const toast = useToast();
  const sc = useShortcuts();
  return (
    <AppScreen>
      <FlatList
        data={sc.list}
        keyExtractor={(s) => s.key}
        renderItem={({ item }) => (
          <AppListItem
            icon={item.icon as IconName}
            title={item.title}
            subtitle={item.subtitle}
            onPress={() => router.push(item.href as Href)}
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove shortcut ${item.title}`}
                hitSlop={10}
                onPress={() =>
                  sc
                    .remove(item.key)
                    .then(() => toast('Shortcut removed'))
                    .catch((e: Error) => toast(e.message, 'error'))
                }
              >
                <AppIcon name="close" size={20} />
              </Pressable>
            }
          />
        )}
        ListEmptyComponent={
          <AppEmptyState
            icon="bookmark-outline"
            title="No shortcuts"
            message="You have no shortcuts at the moment. Find a screen you'd like to shortcut and add it from the ⋮ menu."
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </AppScreen>
  );
}
