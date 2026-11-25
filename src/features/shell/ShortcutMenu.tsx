import { usePathname } from 'expo-router';
import { AppHeaderMenu, useToast, type IconName, type MenuItem } from '../../components';
import { useShortcuts } from '../prefs';

/**
 * Header "⋮" menu with Add/Remove shortcut for the current screen, plus any screen-specific items.
 * Shortcuts are saved to the user's prefs on the backend and listed on Home.
 */
export function ShortcutMenu({ title, subtitle, icon, extra = [] }: { title: string; subtitle?: string | null; icon: IconName; extra?: MenuItem[] }) {
  const path = usePathname();
  const toast = useToast();
  const sc = useShortcuts();
  const pinned = sc.has(path);
  return (
    <AppHeaderMenu
      items={[
        {
          label: pinned ? 'Remove shortcut' : 'Add shortcut',
          icon: pinned ? 'bookmark' : 'bookmark-outline',
          onPress: () =>
            (pinned ? sc.remove(path) : sc.add({ key: path, href: path, title, subtitle, icon }))
              .then(() => toast(pinned ? 'Shortcut removed' : 'Shortcut added'))
              .catch((e: Error) => toast(e.message, 'error')),
        },
        ...extra,
      ]}
    />
  );
}
