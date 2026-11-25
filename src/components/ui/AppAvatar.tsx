import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { initials } from '../../utils/format';
import { AppText } from './AppText';

type Person = { name: string; color?: string | null } | null | undefined;

export function AppAvatar({ user, size = 32 }: { user: Person; size?: number }) {
  return (
    <View
      accessibilityLabel={user?.name ?? 'Unknown user'}
      style={[styles.av, { width: size, height: size, borderRadius: size / 2, backgroundColor: user?.color || '#6366f1' }]}
    >
      <AppText style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '600' }}>{initials(user?.name)}</AppText>
    </View>
  );
}

export function AppAvatarStack({ users, max = 4, size = 26 }: { users: Person[]; max?: number; size?: number }) {
  const { colors } = useTheme();
  const shown = users.slice(0, max);
  return (
    <View style={styles.stack}>
      {shown.map((u, i) => (
        // A ring in the surface colour keeps overlapping avatars readable.
        <View key={`${u?.name}-${i}`} style={{ marginLeft: i ? -size / 3 : 0, borderWidth: 2, borderColor: colors.surface, borderRadius: size }}>
          <AppAvatar user={u} size={size} />
        </View>
      ))}
      {users.length > max ? <AppText variant="caption" tone="muted" style={{ marginLeft: 4 }}>{`+${users.length - max}`}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  av: { alignItems: 'center', justifyContent: 'center' },
  stack: { flexDirection: 'row', alignItems: 'center' },
});
