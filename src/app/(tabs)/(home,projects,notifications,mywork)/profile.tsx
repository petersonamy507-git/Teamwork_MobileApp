import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { AppAvatar, AppBadge, AppButton, AppCard, AppErrorState, AppListItem, AppSkeleton, AppText } from '../../../components';
import { useAuth } from '../../../features/auth';
import { usePerson, useWeekTime } from '../../../features/profile';
import { readable, spacing, useTheme } from '../../../theme';
import { fmtMinutes } from '../../../utils/format';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const personId = id ? Number(id) : user!.id;
  const isMe = personId === user!.id;
  const person = usePerson(personId);
  const time = useWeekTime(personId);
  // Other people: show their record once loaded; for me, fall back to the signed-in user straight away.
  const p = person.data ?? (isMe ? user! : null);
  const t = time.data;
  const billPct = t?.total ? (t.billable / t.total) * 100 : 0;

  const confirmLogout = () =>
    Alert.alert('Log out', 'Sign out of Crewdesk on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);

  if (!p) return person.isError ? <AppErrorState error={person.error} onRetry={() => person.refetch()} /> : <AppSkeleton />;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[readable, styles.wrap]}>
      <Stack.Screen options={{ title: isMe ? 'Profile' : p.name }} />
      <View style={styles.head}>
        <AppAvatar user={p} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="heading">{p.name}</AppText>
          {p.title ? <AppText tone="muted">{p.title}</AppText> : null}
          {p.company?.name ? (
            <AppText variant="caption" tone="muted">
              {p.company.name}
            </AppText>
          ) : null}
          <AppBadge label={String(p.role).replace(/^./, (c) => c.toUpperCase())} />
        </View>
      </View>

      <AppCard style={{ gap: spacing.sm }}>
        <AppText variant="heading">Logged Time</AppText>
        <AppText variant="caption" tone="muted">
          Total hours for the week
        </AppText>
        <AppText variant="title">{time.isError ? '—' : fmtMinutes(t?.total)}</AppText>
        <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
          <View style={{ width: `${billPct}%`, height: 6, backgroundColor: '#14b8a6' }} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.xl }}>
          <AppText variant="caption" tone="muted">{`${fmtMinutes(t?.billable)} Billable`}</AppText>
          <AppText variant="caption" tone="muted">{`${fmtMinutes(t?.nonBillable)} Non-billable`}</AppText>
        </View>
        {isMe ? (
          <AppButton
            title="View logged time"
            variant="ghost"
            icon="arrow-forward"
            onPress={() => router.push('/time')}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
          />
        ) : null}
      </AppCard>

      <AppCard style={{ padding: 0 }}>
        <AppText variant="heading" style={{ padding: spacing.lg, paddingBottom: 0 }}>
          Contact Details
        </AppText>
        <AppListItem icon="mail-outline" title="Email" subtitle={p.email} onPress={() => Linking.openURL(`mailto:${p.email}`).catch(() => Alert.alert('No email app', p.email))} />
        {p.phone ? <AppListItem icon="call-outline" title="Phone" subtitle={p.phone} onPress={() => Linking.openURL(`tel:${p.phone}`).catch(() => Alert.alert('Cannot place a call', p.phone))} /> : null}
      </AppCard>

      {isMe ? (
        <>
          <AppCard style={{ padding: 0 }}>
            <AppListItem icon="settings-outline" title="Settings" onPress={() => router.push('/settings')} chevron />
          </AppCard>
          <AppButton title="Log out" variant="danger" onPress={confirmLogout} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
});
