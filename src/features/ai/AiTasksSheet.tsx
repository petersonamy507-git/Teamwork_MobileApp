import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AppButton, AppChip, AppInput, AppModal, AppText } from '../../components';
import { spacing } from '../../theme';
import { useProject } from '../projects';
import { aiApi, lastAnswer } from './aiApi';

const SUGGESTIONS = ["What's late and who owns it?", 'What should I work on next?', 'Summarise progress this week'];

/** The ✦ chip on Tasks: ask the existing AI Teammate (POST /ai/ask) about this project's tasks. */
export function AiTasksSheet({ visible, onClose, projectId }: { visible: boolean; onClose: () => void; projectId: number }) {
  const project = useProject(projectId);
  const [q, setQ] = useState('');
  const ask = useMutation({ mutationFn: (prompt: string) => aiApi.ask(`In the project "${project.data?.name ?? projectId}": ${prompt}`) });
  const run = (prompt: string) => prompt.trim() && ask.mutate(prompt.trim());
  const answer = lastAnswer(ask.data);
  return (
    <AppModal visible={visible} onClose={onClose} title="✦ Ask AI about these tasks">
      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {SUGGESTIONS.map((s) => (
            <AppChip
              key={s}
              label={s}
              onPress={() => {
                setQ(s);
                run(s);
              }}
            />
          ))}
        </View>
        <AppInput value={q} onChangeText={setQ} placeholder="Ask anything about this project's tasks" returnKeyType="send" onSubmitEditing={() => run(q)} />
        <AppButton title="Ask" icon="sparkles" loading={ask.isPending} disabled={!q.trim()} onPress={() => run(q)} />
        {ask.isError ? <AppText tone="danger">{ask.error.message}</AppText> : null}
        {answer ? <AppText selectable>{answer}</AppText> : null}
      </ScrollView>
    </AppModal>
  );
}
