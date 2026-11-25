import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppButton, AppCard, AppIcon, AppText } from '../../components';
import { spacing, useTheme } from '../../theme';
import { lastAnswer, useCatchMeUp } from './aiApi';

/** "Catch me up": asks the existing AI Teammate (POST /ai/ask) for a summary of recent project activity. */
export function CatchMeUpCard() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(true);
  const ask = useCatchMeUp();
  const answer = lastAnswer(ask.data);
  return (
    <AppCard style={[styles.card, { borderColor: colors.accent }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} style={styles.head}>
        <AppIcon name="sparkles" size={18} color={colors.accent} />
        <AppText weight="600" style={{ flex: 1 }}>
          Catch me up
        </AppText>
        <AppIcon name={open ? 'chevron-up' : 'chevron-down'} size={18} />
      </Pressable>
      {open ? (
        <View style={{ gap: spacing.md }}>
          {answer ? (
            <AppText>{answer}</AppText>
          ) : (
            <AppText tone="muted">Get a quick, AI-generated overview of recent project activity from the past 7 days.</AppText>
          )}
          {ask.isError ? <AppText tone="danger">{ask.error.message}</AppText> : null}
          <AppButton title={answer ? 'Refresh summary' : 'Catch me up'} variant="secondary" loading={ask.isPending} onPress={() => ask.mutate()} />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.lg, marginTop: spacing.sm, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
