import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppAvatar, AppButton, AppDivider, AppIcon, AppListItem, AppModal, AppSwitch, AppText, useToast } from '../../components';
import { spacing, useTheme } from '../../theme';
import { useAuth } from '../auth';

/** Avatar at the top-left of each tab; opens the account sheet (company, user, profile, settings, log out). */
export function AccountButton() {
  const router = useRouter();
  const { user, accounts, switchAccount, logout } = useAuth();
  const toast = useToast();
  const { dark, setAppearance } = useTheme();
  const others = accounts.filter((a) => a.userId !== user?.id);
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const go = (href: '/profile' | '/settings' | '/shortcuts' | '/add-account') => {
    setOpen(false);
    router.push(href);
  };
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Account" hitSlop={8} onPress={() => setOpen(true)} style={styles.btn}>
        <AppAvatar user={user} size={30} />
      </Pressable>
      <AppModal visible={open} onClose={() => setOpen(false)}>
        <View style={styles.head}>
          <AppAvatar user={user} size={44} />
          <View style={{ flex: 1 }}>
            {user.company?.name ? (
              <AppText variant="label" tone="muted">
                {user.company.name}
              </AppText>
            ) : null}
            <AppText weight="600">{user.name}</AppText>
            <AppText variant="caption" tone="muted">
              {user.email}
            </AppText>
          </View>
        </View>
        {others.map((a) => (
          <AppListItem
            key={a.userId}
            left={<AppAvatar user={a} size={32} />}
            title={a.name}
            subtitle={a.email}
            right={<AppIcon name="swap-horizontal" size={20} />}
            onPress={() => {
              setOpen(false);
              switchAccount(a.userId)
                .then(() => {
                  toast(`Switched to ${a.name}`);
                  router.replace('/');
                })
                .catch((e: Error) => toast(e.message, 'error'));
            }}
          />
        ))}
        <AppListItem icon="add-circle-outline" title="Add account" onPress={() => go('/add-account')} />
        <AppDivider />
        <AppListItem icon="person-circle-outline" title="My profile" onPress={() => go('/profile')} />
        <AppListItem icon="bookmark-outline" title="Shortcuts" onPress={() => go('/shortcuts')} />
        <AppListItem icon="settings-outline" title="Settings" onPress={() => go('/settings')} />
        <View style={{ paddingHorizontal: spacing.lg }}>
          <AppSwitch label="Dark mode" value={dark} onValueChange={(v) => setAppearance(v ? 'dark' : 'light')} />
        </View>
        <View style={{ padding: spacing.lg }}>
          <AppButton
            title="Log out"
            variant="danger"
            onPress={() =>
              Alert.alert('Log out', `Sign ${user.email} out of this device?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log out',
                  style: 'destructive',
                  onPress: () => {
                    setOpen(false);
                    void logout();
                  },
                },
              ])
            }
          />
        </View>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
});
