import * as DocumentPicker from 'expo-document-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppAvatar,
  AppButton,
  AppChip,
  AppIcon,
  AppInput,
  AppListItem,
  AppModal,
  AppSearchBar,
  AppSwitch,
  AppText,
  useToast,
  type IconName,
} from '../components';
import { projectsApi, useCreateMessage, useProjectPeople, useProjects } from '../features/projects';
import { fontSize, MAX_FONT_SCALE, radius, readable, spacing, useTheme } from '../theme';

type Sheet = 'project' | 'notify' | 'privacy' | 'tags' | null;
type Attachment = { id: number; name: string };

/**
 * New message, laid out like the reference app: "Choose Project ▾", subject, message, and a toolbar
 * with notify (🔔), private (🔒), tags (🏷), attach (📎) and send.
 */
export default function ComposeMessageScreen() {
  const { project } = useLocalSearchParams<{ project?: string }>();
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const projects = useProjects('active');
  const [pid, setPid] = useState<number | null>(project ? Number(project) : null);
  const people = useProjectPeople(pid ?? 0);
  const create = useCreateMessage(pid ?? 0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [q, setQ] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notify, setNotify] = useState<number[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const chosen = projects.data?.find((p) => p.id === pid);

  const needProject = () => {
    if (pid) return false;
    toast('Choose a project first', 'error');
    setSheet('project');
    return true;
  };

  const attach = async () => {
    if (needProject()) return;
    let r: DocumentPicker.DocumentPickerResult;
    try {
      r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    } catch {
      return toast('Could not open the file picker', 'error');
    }
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    if (a.size && a.size > 25 * 1024 * 1024) return toast('Files must be 25 MB or smaller', 'error');
    setUploading(true);
    try {
      // Uploaded to the project's files with the existing endpoint, then linked to the message.
      const f = await projectsApi.uploadFile(pid!, { uri: a.uri, name: a.name, type: a.mimeType || 'application/octet-stream' });
      setFiles((xs) => [...xs, { id: f.id, name: f.name }]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const send = () => {
    if (needProject()) return;
    if (!title.trim()) return toast('Add a message subject', 'error');
    if (!body.trim()) return toast('Type your message', 'error');
    // Until the backend stores attachments on messages, list them in the text so readers can find them in Files.
    const fileNote = files.length ? `\n\nAttached: ${files.map((f) => f.name).join(', ')}` : '';
    create.mutate(
      { title: title.trim(), body: body.trim() + fileNote, notify_user_ids: notify, is_private: isPrivate, tags, file_ids: files.map((f) => f.id) },
      {
        onSuccess: (m) => {
          toast('Message posted');
          // Close the composer, then open the message inside the current tab so Back works as expected.
          router.back();
          router.push(`/messages/${m.id}`);
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

  const tool = (icon: IconName, label: string, on: boolean, onPress: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} hitSlop={8} onPress={onPress} style={styles.tool}>
      <AppIcon name={icon} size={22} color={on ? colors.accent : colors.text} />
    </Pressable>
  );
  const canSend = !!pid && !!title.trim() && !!body.trim() && !create.isPending && !uploading;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: 'New message' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[readable, styles.body]} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chosen ? `Project ${chosen.name}, change` : 'Choose Project'}
            onPress={() => setSheet('project')}
            style={styles.projectRow}
          >
            <AppText tone={chosen ? 'default' : 'muted'} weight="500" numberOfLines={1} style={{ flexShrink: 1 }}>
              {chosen ? chosen.name : 'Choose Project'}
            </AppText>
            <AppIcon name="caret-down" size={14} />
          </Pressable>
          <TextInput
            accessibilityLabel="Message subject"
            value={title}
            onChangeText={setTitle}
            placeholder="Message Subject"
            placeholderTextColor={colors.textMuted}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[styles.subject, { color: colors.text }]}
          />
          <TextInput
            accessibilityLabel="Message"
            value={body}
            onChangeText={setBody}
            placeholder="Type your message here"
            placeholderTextColor={colors.textMuted}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            multiline
            textAlignVertical="top"
            style={[styles.message, { color: colors.text }]}
          />
          {notify.length || isPrivate || tags.length || files.length ? (
            <View style={styles.chips}>
              {isPrivate ? <AppChip label="🔒 Private" selected onPress={() => setSheet('privacy')} /> : null}
              {notify.length ? <AppChip label={`🔔 ${notify.length} to notify`} selected onPress={() => setSheet('notify')} /> : null}
              {tags.map((t) => (
                <AppChip key={t} label={`#${t} ✕`} onPress={() => setTags((xs) => xs.filter((x) => x !== t))} />
              ))}
              {files.map((f) => (
                <AppChip key={f.id} label={`📎 ${f.name} ✕`} onPress={() => setFiles((xs) => xs.filter((x) => x.id !== f.id))} />
              ))}
            </View>
          ) : null}
        </ScrollView>
        <View style={[styles.toolbar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {tool('notifications-outline', 'Notify people', notify.length > 0, () => !needProject() && setSheet('notify'))}
          {tool(isPrivate ? 'lock-closed' : 'lock-closed-outline', 'Privacy', isPrivate, () => setSheet('privacy'))}
          {tool('pricetag-outline', 'Tags', tags.length > 0, () => setSheet('tags'))}
          {uploading ? <ActivityIndicator color={colors.accent} style={styles.tool} /> : tool('attach', 'Attach file', files.length > 0, () => void attach())}
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post message"
            disabled={!canSend}
            onPress={send}
            style={[styles.send, { backgroundColor: canSend ? colors.accent : colors.surfaceAlt }]}
          >
            {create.isPending ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <AppIcon name="send" size={18} color={canSend ? colors.onAccent : colors.textMuted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <AppModal visible={sheet === 'project'} onClose={() => setSheet(null)} title="Choose Project">
        <AppSearchBar value={q} onChangeText={setQ} placeholder="Search projects" />
        <FlatList
          style={{ maxHeight: 420 }}
          keyboardShouldPersistTaps="handled"
          data={(projects.data ?? []).filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <AppListItem
              icon="folder-outline"
              title={item.name}
              subtitle={item.client?.name}
              right={item.id === pid ? <AppIcon name="checkmark" color={colors.accent} /> : undefined}
              onPress={() => {
                if (item.id !== pid) {
                  setNotify([]);
                  setFiles([]);
                }
                setPid(item.id);
                setSheet(null);
              }}
            />
          )}
        />
      </AppModal>

      <AppModal visible={sheet === 'notify'} onClose={() => setSheet(null)} title="Notify people">
        <ScrollView style={{ maxHeight: 420 }}>
          {(people.data ?? []).map((u) => {
            const on = notify.includes(u.id);
            return (
              <AppListItem
                key={u.id}
                left={<AppAvatar user={u} size={30} />}
                title={u.name}
                right={on ? <AppIcon name="checkmark-circle" color={colors.accent} size={22} /> : <AppIcon name="ellipse-outline" size={22} />}
                onPress={() => setNotify((xs) => (on ? xs.filter((x) => x !== u.id) : [...xs, u.id]))}
              />
            );
          })}
          {people.data && !people.data.length ? (
            <AppText tone="muted" style={{ padding: spacing.lg }}>
              Nobody else is on this project yet.
            </AppText>
          ) : null}
        </ScrollView>
        <View style={{ padding: spacing.lg }}>
          <AppButton title="Done" onPress={() => setSheet(null)} />
        </View>
      </AppModal>

      <AppModal visible={sheet === 'privacy'} onClose={() => setSheet(null)} title="Privacy">
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <AppSwitch label="Private message" value={isPrivate} onValueChange={setIsPrivate} />
          <AppText variant="caption" tone="muted">
            Only you, the people you notify and admins can see a private message.
          </AppText>
          <AppButton title="Done" onPress={() => setSheet(null)} />
        </View>
      </AppModal>

      <AppModal visible={sheet === 'tags'} onClose={() => setSheet(null)} title="Tags">
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <AppInput
            label="Add a tag"
            value={tagDraft}
            onChangeText={setTagDraft}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => {
              const t = tagDraft.trim().replace(/^#/, '');
              if (t && !tags.includes(t)) setTags((xs) => [...xs, t]);
              setTagDraft('');
            }}
          />
          <View style={styles.chips}>
            {tags.map((t) => (
              <AppChip key={t} label={`#${t} ✕`} onPress={() => setTags((xs) => xs.filter((x) => x !== t))} />
            ))}
          </View>
          <AppButton
            title="Done"
            onPress={() => {
              const t = tagDraft.trim().replace(/^#/, '');
              if (t && !tags.includes(t)) setTags((xs) => [...xs, t]);
              setTagDraft('');
              setSheet(null);
            }}
          />
        </View>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 },
  subject: { fontSize: fontSize.xl, fontWeight: '600', paddingVertical: spacing.sm },
  message: { fontSize: fontSize.md, minHeight: 200, flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tool: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  send: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
