import { useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { AppCard, AppChipGroup, AppDivider, AppListItem, AppScreen, AppSwitch, AppText, useToast } from '../../../components';
import { usePrefs, useSavePrefs } from '../../../features/prefs';
import { API_URL } from '../../../config/env';
import { useAuth } from '../../../features/auth';
import { checkForUpdate, downloadAndInstall, installedVersion, installedVersionCode } from '../../../features/update';
import { spacing, useTheme, type Appearance } from '../../../theme';

export default function SettingsScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const { colors, appearance, setAppearance } = useTheme();
  const prefs = usePrefs();
  const savePrefs = useSavePrefs();
  // Saved per user on the backend (/prefs push_enabled); phones get pushes once push delivery is set up there.
  const pushOn = prefs.data?.push_enabled !== false;
  const [busy, setBusy] = useState<string | null>(null);

  const checkNow = async () => {
    setBusy('Checking…');
    try {
      const b = await checkForUpdate();
      if (!b) return toast('You have the latest version');
      setBusy('Downloading…');
      await downloadAndInstall(b, (p) => setBusy(`Downloading… ${Math.round(p * 100)}%`));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update check failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppScreen scroll padded>
      <AppCard style={{ paddingVertical: 0 }}>
        <AppSwitch
          label="Enable push notifications"
          value={pushOn}
          onValueChange={(v) => savePrefs.mutate({ push_enabled: v }, { onError: (e) => toast(e.message, 'error') })}
        />
      </AppCard>
      <AppCard style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="muted">
          Appearance
        </AppText>
        <View style={{ marginHorizontal: -spacing.lg }}>
          <AppChipGroup<Appearance>
            options={[
              ['dark', 'Dark'],
              ['light', 'Light'],
              ['system', 'Phone setting'],
            ]}
            value={appearance}
            onChange={setAppearance}
          />
        </View>
      </AppCard>
      <AppCard style={{ padding: 0 }}>
        <AppListItem icon="person-circle-outline" title="Signed in as" subtitle={user?.email} />
        <AppDivider inset={16} />
        <AppListItem icon="server-outline" title="Server" subtitle={API_URL.replace(/^https?:\/\//, '')} />
        <AppDivider inset={16} />
        <AppListItem icon="information-circle-outline" title="Version" subtitle={`${installedVersion()} (build ${installedVersionCode()})`} />
        {Platform.OS === 'android' ? (
          <>
            <AppDivider inset={16} />
            <AppListItem
              icon="cloud-download-outline"
              title="Check for updates"
              subtitle={busy ?? undefined}
              right={busy ? <ActivityIndicator color={colors.accent} /> : undefined}
              onPress={busy ? undefined : () => void checkNow()}
              chevron={!busy}
            />
          </>
        ) : null}
      </AppCard>
    </AppScreen>
  );
}
