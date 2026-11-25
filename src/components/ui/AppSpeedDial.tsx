import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { AppIcon, type IconName } from './AppIcon';
import { AppText } from './AppText';

export type SpeedDialAction = { label: string; icon: IconName; onPress: () => void };
type Frame = { x: number; y: number; w: number; h: number };

/** The reference app's "+" button: tap to fan out labelled actions, tap ✕ or outside to close. */
export function AppSpeedDial({ actions, bottomOffset = 0 }: { actions: SpeedDialAction[]; bottomOffset?: number }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  // Where the + sits on screen, so the open menu's ✕ lands exactly on top of it.
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const show = () => {
    const node = anchor.current;
    if (!node) return setOpen(true);
    node.measureInWindow((x: number, y: number, w: number, h: number) => {
      setFrame({ x, y, w, h });
      setOpen(true);
    });
  };
  // Menu column whose bottom-right corner is the + button's bottom-right corner.
  const menuPos = frame ? { left: frame.x + frame.w - MENU_W, top: frame.y + frame.h - MENU_H } : { right: spacing.xl, bottom: spacing.xl + 80 };
  return (
    <>
      <View ref={anchor} collapsable={false} style={[styles.anchor, { bottom: spacing.xl + bottomOffset }]}>
        <Fab icon="add" label="Add new" onPress={show} />
      </View>
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close menu">
          <View style={[styles.menu, menuPos]}>
            {actions.map((a) => (
              <Pressable
                key={a.label}
                accessibilityRole="button"
                accessibilityLabel={a.label}
                onPress={() => {
                  setOpen(false);
                  a.onPress();
                }}
                style={styles.item}
              >
                <AppText style={{ color: '#fff' }} weight="500">
                  {a.label}
                </AppText>
                <View style={[styles.mini, { backgroundColor: colors.surface }]}>
                  <AppIcon name={a.icon} size={20} color={colors.text} />
                </View>
              </Pressable>
            ))}
            <Fab icon="close" label="Close" onPress={() => setOpen(false)} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function Fab({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
    >
      <AppIcon name={icon} size={28} color={colors.onAccent} />
    </Pressable>
  );
}

const MENU_W = 260;
const MENU_H = 360;

const styles = StyleSheet.create({
  anchor: { position: 'absolute', right: spacing.xl },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  menu: { position: 'absolute', width: MENU_W, height: MENU_H, alignItems: 'flex-end', justifyContent: 'flex-end', gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  mini: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
});
