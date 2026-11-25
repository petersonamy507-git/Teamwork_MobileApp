import { useState } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { AppModal } from '../feedback/AppModal';
import { AppIcon, type IconName } from '../ui/AppIcon';
import { AppListItem } from '../ui/AppListItem';

export type MenuItem = { label: string; icon: IconName; onPress: () => void; hidden?: boolean };

/** The "⋮" header button and its action sheet (Add shortcut, Sort by, …). */
export function AppHeaderMenu({ items, title }: { items: MenuItem[]; title?: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const shown = items.filter((i) => !i.hidden);
  if (!shown.length) return null;
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="More options" hitSlop={10} onPress={() => setOpen(true)} style={{ paddingHorizontal: 8 }}>
        <AppIcon name="ellipsis-vertical" size={20} color={colors.text} />
      </Pressable>
      <AppModal visible={open} onClose={() => setOpen(false)} title={title}>
        {shown.map((i) => (
          <AppListItem
            key={i.label}
            icon={i.icon}
            title={i.label}
            onPress={() => {
              setOpen(false);
              i.onPress();
            }}
          />
        ))}
      </AppModal>
    </>
  );
}
