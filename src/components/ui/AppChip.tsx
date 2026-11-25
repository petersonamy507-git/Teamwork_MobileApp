import { Fragment, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';

export function AppChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderColor: selected ? colors.accent : colors.border }]}
    >
      <AppText variant="label" style={{ color: selected ? colors.accent : colors.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Horizontally scrolling single-select filter row (All / Today / Late / Upcoming / Completed …). */
export function AppChipGroup<T extends string>({
  options,
  value,
  onChange,
  afterFirst,
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
  /** Extra chip shown right after the first option (e.g. the ✦ AI chip after "All"). */
  afterFirst?: ReactNode;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // A horizontal ScrollView inside a flex column grows to fill the height unless told not to.
      style={styles.scroll}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {options.map(([k, label], i) => (
        <Fragment key={k}>
          <AppChip label={label} selected={k === value} onPress={() => onChange(k)} />
          {i === 0 ? afterFirst : null}
        </Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, height: 34, justifyContent: 'center' },
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: 'center' },
});
