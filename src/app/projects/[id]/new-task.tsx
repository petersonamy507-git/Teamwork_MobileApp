import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppChip, AppDateField, AppInput, AppScreen, AppText, AppTextArea, useToast } from '../../../components';
import { useProjectPeople, useTaskLists } from '../../../features/projects';
import { useCreateTask } from '../../../features/tasks';
import { spacing } from '../../../theme';
import type { TaskPriority } from '../../../types/models';
import { PRIORITY } from '../../../utils/format';

export default function NewTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = Number(id);
  const router = useRouter();
  const toast = useToast();
  const lists = useTaskLists(pid, false);
  const people = useProjectPeople(pid);
  const create = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listId, setListId] = useState<number | null>(null);
  const [assignees, setAssignees] = useState<number[]>([]);
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [start, setStart] = useState<string | null>(null);
  const [due, setDue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleAssignee = (uid: number) => setAssignees((a) => (a.includes(uid) ? a.filter((x) => x !== uid) : [...a, uid]));

  const submit = () => {
    if (!title.trim()) return setError('Give the task a name');
    if (start && due && due < start) return setError('The due date is before the start date');
    setError(null);
    create.mutate(
      {
        projectId: pid,
        input: {
          title: title.trim(),
          description: description.trim() || null,
          tasklist_id: listId ?? lists.data?.[0]?.id ?? null,
          assignee_ids: assignees,
          start_date: start,
          due_date: due,
          priority,
        },
      },
      {
        onSuccess: (created) => {
          toast('Task added');
          // Land on the new task, as Teamwork does, so it can be refined straight away.
          router.back();
          router.push(`/tasks/${created.id}`);
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  return (
    <AppScreen scroll padded>
      <AppInput label="Task name" value={title} onChangeText={setTitle} placeholder="What needs doing?" autoFocus error={error} />
      <AppTextArea label="Description" value={description} onChangeText={setDescription} placeholder="Add details (optional)" />
      {lists.data?.length ? (
        <Field label="Task list">
          {lists.data.map((l) => (
            <AppChip key={l.id} label={l.name} selected={(listId ?? lists.data[0].id) === l.id} onPress={() => setListId(l.id)} />
          ))}
        </Field>
      ) : null}
      <Field label="Priority">
        {(Object.keys(PRIORITY) as TaskPriority[]).map((k) => (
          <AppChip key={k} label={PRIORITY[k].label} selected={priority === k} onPress={() => setPriority(k)} />
        ))}
      </Field>
      {people.data?.length ? (
        <Field label="Assignees">
          {people.data.map((u) => (
            <AppChip key={u.id} label={u.name} selected={assignees.includes(u.id)} onPress={() => toggleAssignee(u.id)} />
          ))}
        </Field>
      ) : null}
      <AppDateField label="Start date" value={start} onChange={setStart} />
      <AppDateField label="Due date" value={due} onChange={setDue} />
      <AppButton title="Add task" onPress={submit} loading={create.isPending} />
    </AppScreen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <View style={styles.wrapRow}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
