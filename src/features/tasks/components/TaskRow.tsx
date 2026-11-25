import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppAvatarStack, AppCheckbox, AppText } from '../../../components';
import { spacing, useTheme } from '../../../theme';
import type { Task } from '../../../types/models';
import { dueState, fmtDate, PRIORITY } from '../../../utils/format';

type Props = { task: Task; onPress: (t: Task) => void; onToggle: (t: Task) => void; showProject?: boolean };

export const TaskRow = memo(function TaskRow({ task, onPress, onToggle, showProject = true }: Props) {
  const { colors } = useTheme();
  const done = task.status === 'completed';
  const due = dueState(task);
  // Inside a project's task list the project and list are already shown as headers.
  const sub = showProject ? [task.project_name, task.tasklist_name].filter(Boolean).join(' › ') : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${task.title}${done ? ', completed' : ''}`}
      onPress={() => onPress(task)}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.surface }]}
    >
      <AppCheckbox checked={done} onToggle={() => onToggle(task)} label={done ? `Reopen ${task.title}` : `Complete ${task.title}`} />
      <View style={styles.body}>
        <AppText numberOfLines={2} style={done ? { textDecorationLine: 'line-through', color: colors.textMuted } : undefined}>
          {task.title}
        </AppText>
        <View style={styles.meta}>
          {task.priority && task.priority !== 'none' ? <View style={[styles.dot, { backgroundColor: PRIORITY[task.priority].color }]} /> : null}
          {task.due_date ? (
            <AppText variant="caption" tone={due === 'late' ? 'danger' : 'muted'} style={due === 'today' ? { color: colors.warning } : undefined}>
              {fmtDate(task.due_date)}
            </AppText>
          ) : null}
          {sub ? (
            <AppText variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
              {sub}
            </AppText>
          ) : null}
        </View>
      </View>
      {task.assignees?.length ? <AppAvatarStack users={task.assignees} max={2} size={24} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
