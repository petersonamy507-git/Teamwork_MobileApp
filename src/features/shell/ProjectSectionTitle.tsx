import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppIcon, AppListItem, AppModal, AppText, type IconName } from '../../components';
import { useTheme } from '../../theme';
import { useProject } from '../projects';

export const PROJECT_SECTIONS: { key: string; label: string; icon: IconName }[] = [
  { key: '', label: 'Overview', icon: 'speedometer-outline' },
  { key: 'tasks', label: 'Task Lists', icon: 'list-outline' },
  { key: 'board', label: 'Board', icon: 'albums-outline' },
  { key: 'messages', label: 'Messages', icon: 'mail-outline' },
  { key: 'files', label: 'Files', icon: 'document-outline' },
  { key: 'milestones', label: 'Milestones', icon: 'flag-outline' },
  { key: 'notebooks', label: 'Notebooks', icon: 'book-outline' },
  { key: 'activity', label: 'Activity', icon: 'flash-outline' },
  { key: 'people', label: 'People', icon: 'people-outline' },
];

/** Header title "Section ▾ / Project name": tap to jump to another section of the same project. */
/**
 * Header title "▣ Section ▾ / Project" (icon in a light tile, as in the reference): tap to jump to another
 * section of the same project. With `label`, it is a plain title (e.g. "Tasks") and does not switch.
 */
export function ProjectSectionTitle({ projectId, section, label }: { projectId: number; section: string; label?: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const project = useProject(projectId);
  const [open, setOpen] = useState(false);
  const cur = PROJECT_SECTIONS.find((s) => s.key === section);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? `${cur?.label ?? section}, switch section`}
        disabled={!!label}
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 260 }}
      >
        {cur && !label ? (
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name={cur.icon} size={18} color={colors.background} />
          </View>
        ) : null}
        <View style={{ flexShrink: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="heading" numberOfLines={1}>
              {label ?? cur?.label ?? section}
            </AppText>
            {!label ? <AppIcon name="chevron-down" size={16} color={colors.text} /> : null}
          </View>
          {project.data ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {project.data.name}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      <AppModal visible={open} onClose={() => setOpen(false)} title={project.data?.name}>
        {PROJECT_SECTIONS.map((s) => (
          <AppListItem
            key={s.key}
            icon={s.icon}
            title={s.label}
            right={s.key === section ? <AppIcon name="checkmark" color={colors.accent} /> : undefined}
            onPress={() => {
              setOpen(false);
              if (s.key !== section) router.replace((s.key ? `/projects/${projectId}/${s.key}` : `/projects/${projectId}`) as Href);
            }}
          />
        ))}
      </AppModal>
    </>
  );
}
