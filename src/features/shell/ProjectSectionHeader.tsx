import { Stack } from 'expo-router';
import { useEffect } from 'react';
import type { MenuItem } from '../../components';
import { useProject, useTrackRecent } from '../projects';
import { PROJECT_SECTIONS, ProjectSectionTitle } from './ProjectSectionTitle';
import { ShortcutMenu } from './ShortcutMenu';

/** Header for every project section: "Section ▾ / Project" title and a ⋮ menu with Add shortcut (+ extras). */
export function ProjectSectionHeader({ projectId, section, extra, label }: { projectId: number; section: string; extra?: MenuItem[]; label?: string }) {
  const project = useProject(projectId);
  const { mutate: track } = useTrackRecent();
  const loaded = project.data;
  // Opening any section of a project records it in Recents (same POST /recent the web makes).
  useEffect(() => {
    if (loaded) track(loaded);
    // once per project, not on every refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded?.id, track]);
  const s = PROJECT_SECTIONS.find((x) => x.key === section);
  return (
    <Stack.Screen
      options={{
        headerTitle: () => <ProjectSectionTitle projectId={projectId} section={section} label={label} />,
        headerRight: () => <ShortcutMenu title={label ?? s?.label ?? section} subtitle={project.data?.name} icon={s?.icon ?? 'folder-outline'} extra={extra} />,
      }}
    />
  );
}
