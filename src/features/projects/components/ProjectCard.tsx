import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppAvatarStack, AppBadge, AppCard, AppIcon, AppText } from '../../../components';
import { radius, spacing, useTheme } from '../../../theme';
import type { Project } from '../../../types/models';
import { HEALTH } from '../../../utils/format';

type Props = { project: Project; onPress: (p: Project) => void; onToggleStar?: (p: Project) => void };

export const ProjectCard = memo(function ProjectCard({ project, onPress, onToggleStar }: Props) {
  const { colors } = useTheme();
  const total = project.task_count ?? 0;
  const done = project.completed_count ?? 0;
  const pct = project.progress ?? (total ? Math.round((done / total) * 100) : 0);
  const health = project.health && project.health !== 'none' ? HEALTH[project.health] : null;
  return (
    <AppCard onPress={() => onPress(project)} accessibilityLabel={`Project ${project.name}, ${pct}% complete`} style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.swatch, { backgroundColor: project.color || colors.accent }]} />
        <View style={{ flex: 1 }}>
          <AppText weight="600" numberOfLines={2}>
            {project.name}
          </AppText>
          {project.client?.name ? (
            <AppText variant="caption" tone="muted">
              {project.client.name}
            </AppText>
          ) : null}
          {health ? (
            <View style={{ marginTop: 4 }}>
              <AppBadge label={health.label} color={health.color} />
            </View>
          ) : null}
        </View>
        {onToggleStar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={project.is_starred ? `Unstar ${project.name}` : `Star ${project.name}`}
            accessibilityState={{ selected: !!project.is_starred }}
            hitSlop={10}
            onPress={() => onToggleStar(project)}
          >
            <AppIcon name={project.is_starred ? 'star' : 'star-outline'} size={20} color={project.is_starred ? colors.warning : undefined} />
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: colors.success }]} />
      </View>
      <View style={styles.foot}>
        <AppText variant="caption" tone="muted">
          {`${done}/${total} tasks · ${pct}%`}
          {project.late_count ? ` · ${project.late_count} late` : ''}
        </AppText>
        {project.members?.length ? <AppAvatarStack users={project.members} size={22} /> : null}
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.lg, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  swatch: { width: 10, height: 36, borderRadius: radius.sm },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
