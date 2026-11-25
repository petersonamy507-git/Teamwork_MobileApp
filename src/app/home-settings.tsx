import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppCard, AppCheckbox, AppIcon, AppScreen, AppText, useToast } from '../components';
import { useHomeSections, type HomeSection } from '../features/prefs';
import { radius, spacing, useTheme } from '../theme';

const INFO: Record<HomeSection['key'], { title: string; desc: string }> = {
  views: { title: 'Views', desc: 'Access to the main areas of Crewdesk' },
  recents: { title: 'Recents', desc: 'Get back to areas you recently visited' },
  shortcuts: { title: 'Shortcuts', desc: 'Navigate to saved areas of Crewdesk' },
};

/** Customise Home (reference): ✕ and Done, active sections with reorder, and "Inactive sections". */
export default function HomeSettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const home = useHomeSections();
  const [list, setList] = useState<HomeSection[]>(home.sections);
  const [saving, setSaving] = useState(false);
  const active = list.filter((s) => s.enabled);
  const inactive = list.filter((s) => !s.enabled);

  const toggle = (key: HomeSection['key']) => setList((l) => l.map((x) => (x.key === key ? { ...x, enabled: !x.enabled } : x)));
  const move = (key: HomeSection['key'], d: -1 | 1) =>
    setList((l) => {
      const on = l.filter((x) => x.enabled);
      const i = on.findIndex((x) => x.key === key);
      const j = i + d;
      if (j < 0 || j >= on.length) return l;
      [on[i], on[j]] = [on[j], on[i]];
      return [...on, ...l.filter((x) => !x.enabled)];
    });

  const done = async () => {
    setSaving(true);
    try {
      await home.save(list);
      router.back();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const row = (s: HomeSection, i: number, count: number) => (
    <View key={s.key} style={styles.row}>
      <AppCheckbox checked={s.enabled} label={`Show ${INFO[s.key].title}`} onToggle={() => toggle(s.key)} />
      <View style={{ flex: 1 }}>
        <AppText weight="600">{INFO[s.key].title}</AppText>
        <AppText variant="caption" tone="muted">
          {INFO[s.key].desc}
        </AppText>
      </View>
      {s.enabled ? (
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${INFO[s.key].title} up`}
            disabled={i === 0}
            onPress={() => move(s.key, -1)}
            hitSlop={8}
          >
            <AppIcon name="chevron-up" size={22} color={i === 0 ? colors.surfaceAlt : colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${INFO[s.key].title} down`}
            disabled={i === count - 1}
            onPress={() => move(s.key, 1)}
            hitSlop={8}
          >
            <AppIcon name="chevron-down" size={22} color={i === count - 1 ? colors.surfaceAlt : colors.text} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <AppScreen scroll padded>
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={() => router.back()}>
              <AppIcon name="close" size={24} color={colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              disabled={saving}
              onPress={() => void done()}
              style={[styles.done, { backgroundColor: colors.accentSoft }]}
            >
              {saving ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <AppText style={{ color: colors.accent }} weight="600">
                  Done
                </AppText>
              )}
            </Pressable>
          ),
        }}
      />
      <AppCard style={{ padding: 0 }}>{active.map((s, i) => row(s, i, active.length))}</AppCard>
      <AppText variant="label" tone="muted">
        Inactive sections
      </AppText>
      <AppCard style={{ padding: inactive.length ? 0 : spacing.lg }}>
        {inactive.length ? (
          inactive.map((s, i) => row(s, i, inactive.length))
        ) : (
          <AppText tone="muted" style={{ textAlign: 'center' }}>
            There are no items to show at the moment. Untick a section to move it here.
          </AppText>
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  done: { paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radius.md },
});
