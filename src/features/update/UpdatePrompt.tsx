import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { AppButton, AppModal, AppText } from '../../components';
import { spacing, useTheme } from '../../theme';
import { checkForUpdate, downloadAndInstall, installedVersion, type LatestBuild } from './appUpdate';

const RECHECK_MS = 6 * 60 * 60 * 1000;

/** Checks for a newer APK at launch and when the app returns to the foreground (at most every 6 h). */
export function UpdatePrompt() {
  const { colors } = useTheme();
  const [build, setBuild] = useState<LatestBuild | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastCheck = useRef(0);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android' || Date.now() - lastCheck.current < RECHECK_MS) return;
    lastCheck.current = Date.now();
    try {
      setBuild(await checkForUpdate());
    } catch {
      // Offline or backend without update support: try again later, quietly.
      lastCheck.current = 0;
    }
  }, []);

  useEffect(() => {
    // First check shortly after launch so it never competes with the first screen's data.
    const t = setTimeout(() => void check(), 3000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void check());
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [check]);

  const install = async () => {
    if (!build) return;
    setError(null);
    setProgress(0);
    try {
      await downloadAndInstall(build, setProgress);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The update could not be downloaded.');
    } finally {
      setProgress(null);
    }
  };

  const visible = !!build && (!dismissed || !!build.mandatory);
  return (
    <AppModal visible={visible} onClose={() => !build?.mandatory && setDismissed(true)} title="Update available">
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <AppText>{`Crewdesk ${build?.version} is ready. You have ${installedVersion()}.`}</AppText>
        {build?.notes ? <AppText tone="muted">{build.notes}</AppText> : null}
        {progress != null ? (
          <View style={{ gap: spacing.xs }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${Math.round(progress * 100)}%`, backgroundColor: colors.accent }} />
            </View>
            <AppText variant="caption" tone="muted">{`Downloading… ${Math.round(progress * 100)}%`}</AppText>
          </View>
        ) : null}
        {error ? <AppText tone="danger">{error}</AppText> : null}
        <AppText variant="caption" tone="muted">
          Android will ask you to confirm the install. If it asks, allow Crewdesk to install apps.
        </AppText>
        <AppButton title="Update now" icon="download-outline" loading={progress != null} onPress={() => void install()} />
        {!build?.mandatory ? <AppButton title="Later" variant="ghost" onPress={() => setDismissed(true)} /> : null}
      </View>
    </AppModal>
  );
}
