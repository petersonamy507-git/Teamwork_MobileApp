import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { fmtDate } from '../../utils/format';
import { AppModal } from '../feedback/AppModal';
import { AppButton } from './AppButton';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = (s?: string | null) => (s ? new Date(`${s}T00:00:00`) : new Date());

type Props = { label: string; value?: string | null; onChange: (iso: string | null) => void; clearable?: boolean };

/** Date field using the native picker (dialog on Android, sheet on iOS). Values are YYYY-MM-DD like the backend. */
export function AppDateField({ label, value, onChange, clearable = true }: Props) {
  const { colors } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(fromISO(value));

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: fromISO(value), mode: 'date', onValueChange: (_e, d) => d && onChange(toISO(d)) });
    } else {
      setDraft(fromISO(value));
      setIosOpen(true);
    }
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? fmtDate(value) : 'not set'}`}
          onPress={open}
          style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppIcon name="calendar-outline" size={18} />
          <AppText tone={value ? 'default' : 'muted'}>{value ? fmtDate(value, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</AppText>
        </Pressable>
        {clearable && value ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${label}`} hitSlop={10} onPress={() => onChange(null)}>
            <AppIcon name="close-circle" size={22} />
          </Pressable>
        ) : null}
      </View>
      {Platform.OS === 'ios' ? (
        <AppModal visible={iosOpen} onClose={() => setIosOpen(false)} title={label}>
          <DateTimePicker value={draft} mode="date" display="inline" onValueChange={(_e, d) => d && setDraft(d)} />
          <View style={{ padding: spacing.lg }}>
            <AppButton
              title="Done"
              onPress={() => {
                onChange(toISO(draft));
                setIosOpen(false);
              }}
            />
          </View>
        </AppModal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
});
