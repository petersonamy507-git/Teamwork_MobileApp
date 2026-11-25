import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppCard,
  AppCheckbox,
  AppChip,
  AppDateField,
  AppDivider,
  AppErrorState,
  AppIcon,
  AppInput,
  AppListItem,
  AppModal,
  AppSkeleton,
  AppSwitch,
  AppText,
  AppTextArea,
  useToast,
} from '../../../../components';
import { openProjectFile } from '../../../../features/files';
import { useProjectPeople } from '../../../../features/projects';
import { statusOf, STATUS, useAddComment, useCreateTask, useLogTime, useTask, useUpdateTask, type TaskPatch } from '../../../../features/tasks';
import { readable, spacing, useTheme } from '../../../../theme';
import type { TaskPriority } from '../../../../types/models';
import { fmtDate, fmtMinutes, PRIORITY, timeAgo, todayISO } from '../../../../utils/format';

const stripHtml = (s?: string | null) =>
  (s ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

/** Accepts "1h 30m", "90m", "1.5", "1:30" like the web parseDuration. */
function parseDuration(str: string) {
  const s = str.trim().toLowerCase();
  if (!s) return 0;
  if (/^\d+:\d{1,2}$/.test(s)) {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  }
  const h = s.match(/([\d.]+)\s*h/);
  const m = s.match(/([\d.]+)\s*m/);
  let total = 0;
  if (h) total += parseFloat(h[1]) * 60;
  if (m) total += parseFloat(m[1]);
  if (!h && !m && !isNaN(parseFloat(s))) total = parseFloat(s) * 60;
  return Math.round(total);
}

type Sheet = 'edit' | 'assignees' | 'time' | 'subtask' | null;

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tid = Number(id);
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const q = useTask(tid);
  const update = useUpdateTask();
  const addComment = useAddComment(tid);
  const createTask = useCreateTask();
  const logTime = useLogTime(tid);
  const people = useProjectPeople(q.data?.project_id ?? 0);
  const [comment, setComment] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [draft, setDraft] = useState({ title: '', description: '' });
  const [picked, setPicked] = useState<number[]>([]);
  const [timeForm, setTimeForm] = useState({ dur: '', desc: '', date: todayISO(), billable: true });
  const [subTitle, setSubTitle] = useState('');

  if (q.isPending) return <AppSkeleton />;
  if (q.isError) return <AppErrorState error={q.error} onRetry={() => q.refetch()} />;
  const t = q.data;
  const done = t.status === 'completed';
  const st = statusOf(t.status);

  const patch = (p: TaskPatch, msg: string, after?: () => void) =>
    update.mutate(
      { id: tid, patch: p },
      {
        onSuccess: () => {
          toast(msg);
          after?.();
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );

  const post = () => {
    if (!comment.trim()) return;
    addComment.mutate(comment.trim(), { onSuccess: () => setComment(''), onError: (e) => toast(e.message, 'error') });
  };

  const saveTime = () => {
    const minutes = parseDuration(timeForm.dur);
    if (!minutes) return toast('Enter a duration like 1h 30m', 'error');
    if (!t.project_id) return;
    logTime.mutate(
      { project_id: t.project_id, task_id: t.id, date: timeForm.date, minutes, description: timeForm.desc.trim(), billable: timeForm.billable },
      {
        onSuccess: () => {
          toast(`Logged ${fmtMinutes(minutes)}`);
          setSheet(null);
          setTimeForm({ dur: '', desc: '', date: todayISO(), billable: true });
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

  const addSubtask = () => {
    if (!subTitle.trim() || !t.project_id) return;
    createTask.mutate(
      { projectId: t.project_id, input: { title: subTitle.trim(), parent_id: t.id } },
      {
        onSuccess: () => {
          toast('Subtask added');
          setSubTitle('');
          setSheet(null);
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

  return (
    <>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[readable, styles.wrap]} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: t.project_name ?? 'Task' }} />
        <View style={{ gap: spacing.sm }}>
          {t.tasklist_name ? (
            <AppText variant="caption" tone="muted">
              {[t.project_name, t.tasklist_name].filter(Boolean).join(' › ')}
            </AppText>
          ) : null}
          <View style={styles.titleRow}>
            <AppText variant="title" style={[{ flex: 1 }, done ? { textDecorationLine: 'line-through' } : null]}>
              {t.title}
            </AppText>
            <AppButton
              title="Edit"
              variant="ghost"
              icon="create-outline"
              style={{ paddingHorizontal: spacing.sm }}
              onPress={() => {
                setDraft({ title: t.title, description: stripHtml(t.description) });
                setSheet('edit');
              }}
            />
          </View>
          <View style={styles.row}>
            <AppBadge label={st.label} color={st.color} />
            {t.priority !== 'none' ? <AppBadge label={`${PRIORITY[t.priority].label} priority`} color={PRIORITY[t.priority].color} /> : null}
          </View>
        </View>

        <AppButton
          title={done ? 'Reopen task' : 'Complete task'}
          variant={done ? 'secondary' : 'primary'}
          icon={done ? 'refresh' : 'checkmark'}
          loading={update.isPending}
          onPress={() => patch({ status: done ? 'new' : 'completed' }, done ? 'Task reopened' : 'Task completed')}
        />

        <AppCard style={{ gap: spacing.md }}>
          <AppDateField label="Start date" value={t.start_date} onChange={(v) => patch({ start_date: v }, 'Start date updated')} />
          <AppDateField label="Due date" value={t.due_date} onChange={(v) => patch({ due_date: v }, 'Due date updated')} />
        </AppCard>

        <AppCard style={{ padding: 0 }}>
          <AppListItem
            icon="people-outline"
            title="Assignees"
            subtitle={t.assignees?.length ? t.assignees.map((a) => a.name).join(', ') : 'Anyone'}
            chevron
            onPress={() => {
              setPicked(t.assignees?.map((a) => a.id) ?? []);
              setSheet('assignees');
            }}
          />
          <AppDivider inset={50} />
          <AppListItem
            icon="time-outline"
            title="Time"
            subtitle={`${fmtMinutes(t.logged_minutes)} logged${t.estimate_minutes ? ` of ${fmtMinutes(t.estimate_minutes)} estimated` : ''}`}
            right={<AppText tone="accent">Log time</AppText>}
            onPress={() => setSheet('time')}
          />
          {t.project_id ? (
            <>
              <AppDivider inset={50} />
              <AppListItem icon="folder-outline" title="Project" subtitle={t.project_name} chevron onPress={() => router.push(`/projects/${t.project_id}`)} />
            </>
          ) : null}
        </AppCard>

        <Section title="Stage">
          {Object.entries(STATUS).map(([k, v]) => (
            <AppChip key={k} label={v.label} selected={t.status === k} onPress={() => t.status !== k && patch({ status: k }, `Moved to ${v.label}`)} />
          ))}
        </Section>
        <Section title="Priority">
          {(Object.keys(PRIORITY) as TaskPriority[]).map((k) => (
            <AppChip
              key={k}
              label={PRIORITY[k].label}
              selected={t.priority === k}
              onPress={() => t.priority !== k && patch({ priority: k }, 'Priority updated')}
            />
          ))}
        </Section>

        <AppCard style={{ gap: spacing.xs }}>
          <AppText variant="label" tone="muted">
            Description
          </AppText>
          <AppText tone={t.description ? 'default' : 'muted'}>{stripHtml(t.description) || 'No description. Tap Edit to add one.'}</AppText>
        </AppCard>

        {t.tags?.length ? (
          <Section title="Tags">
            {t.tags.map((tag) => (
              <AppBadge key={tag} label={tag} />
            ))}
          </Section>
        ) : null}

        <AppCard style={{ padding: 0 }}>
          <View style={styles.cardHead}>
            <AppText variant="label" tone="muted">{`Subtasks (${t.subtasks?.length ?? 0})`}</AppText>
            <AppText tone="accent" accessibilityRole="button" onPress={() => setSheet('subtask')}>
              + Add
            </AppText>
          </View>
          {(t.subtasks ?? []).map((s) => (
            <AppListItem
              key={s.id}
              left={
                <AppCheckbox
                  checked={s.status === 'completed'}
                  label={s.status === 'completed' ? `Reopen ${s.title}` : `Complete ${s.title}`}
                  onToggle={() =>
                    update.mutate(
                      { id: s.id, patch: { status: s.status === 'completed' ? 'new' : 'completed' } },
                      { onSuccess: () => void q.refetch(), onError: (e) => toast(e.message, 'error') },
                    )
                  }
                />
              }
              title={s.title}
              chevron
              onPress={() => router.push(`/tasks/${s.id}`)}
            />
          ))}
        </AppCard>

        {t.files?.length ? (
          <AppCard style={{ padding: 0 }}>
            <View style={styles.cardHead}>
              <AppText variant="label" tone="muted">{`Files (${t.files.length})`}</AppText>
            </View>
            {t.files.map((f) => (
              <AppListItem
                key={f.id}
                icon="attach-outline"
                title={f.name}
                subtitle={fmtDate(f.created_at)}
                onPress={() => openProjectFile(f).catch((e: Error) => toast(e.message, 'error'))}
              />
            ))}
          </AppCard>
        ) : null}

        <View style={{ gap: spacing.md }}>
          <AppText variant="heading">{`Comments (${t.comments?.length ?? 0})`}</AppText>
          {(t.comments ?? []).map((c) => (
            <View key={c.id} style={styles.comment}>
              <AppAvatar user={c.user} size={30} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="label">
                  {c.user?.name ?? 'Someone'}{' '}
                  <AppText variant="caption" tone="muted">
                    {timeAgo(c.created_at)}
                  </AppText>
                </AppText>
                <AppText>{stripHtml(c.body)}</AppText>
              </View>
            </View>
          ))}
          <AppInput value={comment} onChangeText={setComment} placeholder="Write a comment" multiline />
          <AppButton title="Post comment" variant="secondary" onPress={post} loading={addComment.isPending} disabled={!comment.trim()} />
        </View>
      </ScrollView>

      <AppModal visible={sheet === 'edit'} onClose={() => setSheet(null)} title="Edit task">
        <View style={styles.sheet}>
          <AppInput label="Task name" value={draft.title} onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))} />
          <AppTextArea label="Description" value={draft.description} onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))} />
          <AppButton
            title="Save"
            loading={update.isPending}
            onPress={() => {
              if (!draft.title.trim()) return toast('Give the task a name', 'error');
              patch({ title: draft.title.trim(), description: draft.description.trim() || null }, 'Task updated', () => setSheet(null));
            }}
          />
        </View>
      </AppModal>

      <AppModal visible={sheet === 'assignees'} onClose={() => setSheet(null)} title="Assign to">
        <ScrollView style={{ maxHeight: 420 }}>
          {(people.data ?? []).map((u) => {
            const on = picked.includes(u.id);
            return (
              <AppListItem
                key={u.id}
                left={<AppAvatar user={u} size={30} />}
                title={u.name}
                right={on ? <AppIcon name="checkmark-circle" color={colors.accent} size={22} /> : <AppIcon name="ellipse-outline" size={22} />}
                onPress={() => setPicked((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))}
              />
            );
          })}
        </ScrollView>
        <View style={styles.sheet}>
          <AppButton
            title="Save assignees"
            loading={update.isPending}
            onPress={() => patch({ assignee_ids: picked }, 'Assignees updated', () => setSheet(null))}
          />
        </View>
      </AppModal>

      <AppModal visible={sheet === 'time'} onClose={() => setSheet(null)} title="Log time">
        <View style={styles.sheet}>
          <AppInput label="Duration" placeholder="e.g. 1h 30m" value={timeForm.dur} onChangeText={(v) => setTimeForm((f) => ({ ...f, dur: v }))} autoFocus />
          <AppDateField label="Date" value={timeForm.date} clearable={false} onChange={(v) => v && setTimeForm((f) => ({ ...f, date: v }))} />
          <AppInput
            label="Description"
            placeholder="What did you work on?"
            value={timeForm.desc}
            onChangeText={(v) => setTimeForm((f) => ({ ...f, desc: v }))}
          />
          <AppSwitch label="Billable" value={timeForm.billable} onValueChange={(v) => setTimeForm((f) => ({ ...f, billable: v }))} />
          <AppButton title="Log time" onPress={saveTime} loading={logTime.isPending} />
        </View>
      </AppModal>

      <AppModal visible={sheet === 'subtask'} onClose={() => setSheet(null)} title="Add subtask">
        <View style={styles.sheet}>
          <AppInput label="Subtask name" value={subTitle} onChangeText={setSubTitle} autoFocus onSubmitEditing={addSubtask} returnKeyType="done" />
          <AppButton title="Add subtask" onPress={addSubtask} loading={createTask.isPending} />
        </View>
      </AppModal>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="muted">
        {title}
      </AppText>
      <View style={styles.wrapRow}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 64 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  comment: { flexDirection: 'row', gap: spacing.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  sheet: { padding: spacing.lg, gap: spacing.md },
});
