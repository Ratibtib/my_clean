// ============================================================
// CHORIFY — Composant TaskCard
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { TaskStatusView } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, STATUS_COLORS } from '../utils/colors';
import { timeAgo } from '../utils/dates';
import { getStatusLabel, getDaysRemaining } from '../utils/status';
import { StatusBadge } from './StatusBadge';
import { useTaskStore } from '../store/useTaskStore';
import { useAuthStore } from '../store/useAuthStore';
import { useHouseholdStore } from '../store/useHouseholdStore';

interface TaskCardProps {
  task: TaskStatusView;
  compact?: boolean;
}

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const completeTask = useTaskStore((s) => s.completeTask);
  const profile = useAuthStore((s) => s.profile);
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);
  const statusColors = STATUS_COLORS[task.status];

  const daysLeft = getDaysRemaining(
    task.last_completed_at,
    task.definition_created_at,
    task.max_interval_days
  );

  const handleValidate = useCallback(() => {
    if (!profile || !currentHousehold) return;

    Alert.alert(
      'Valider cette tâche ?',
      `${task.task_type_name} — ${task.target_name}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '✓ Valider',
          style: 'default',
          onPress: async () => {
            try {
              Vibration.vibrate(50);
              await completeTask(
                task.task_definition_id,
                profile.id,
                currentHousehold.id
              );
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de valider la tâche.');
            }
          },
        },
      ]
    );
  }, [task, profile, currentHousehold, completeTask]);

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { borderLeftColor: statusColors.main }]}
        onPress={handleValidate}
        activeOpacity={0.7}
      >
        <View style={styles.compactContent}>
          <Text style={styles.compactType}>{task.task_type_name}</Text>
          <Text style={styles.compactTarget}>{task.target_name}</Text>
        </View>
        <StatusBadge status={task.status} size="sm" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleValidate}
      activeOpacity={0.7}
    >
      {/* Indicateur de statut */}
      <View style={[styles.statusBar, { backgroundColor: statusColors.main }]} />

      <View style={styles.content}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.taskType}>{task.task_type_name}</Text>
            <StatusBadge status={task.status} />
          </View>
          <Text style={styles.targetName}>{task.target_name}</Text>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: statusColors.main,
                  width: `${Math.min(task.progress_ratio * 100, 100)}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Pied */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {task.last_completed_at
              ? `Fait ${timeAgo(task.last_completed_at)}`
              : 'Jamais réalisée'}
          </Text>
          <Text style={[styles.footerText, { color: statusColors.dark }]}>
            {daysLeft > 0
              ? `${Math.ceil(daysLeft)}j restants`
              : `${Math.abs(Math.floor(daysLeft))}j de retard`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  statusBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  header: {
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskType: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  targetName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: SPACING.xs,
  },
  progressBg: {
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderLeftWidth: 3,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
    ...SHADOWS.sm,
  },
  compactContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  compactType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  compactTarget: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});
