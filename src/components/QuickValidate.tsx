// ============================================================
// CHORIFY — Composant QuickValidate (Bottom Sheet)
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Vibration,
  Alert,
} from 'react-native';
import { TaskStatusView } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, STATUS_COLORS } from '../utils/colors';
import { getStatusLabel } from '../utils/status';
import { useTaskStore } from '../store/useTaskStore';
import { useAuthStore } from '../store/useAuthStore';
import { useHouseholdStore } from '../store/useHouseholdStore';

interface QuickValidateProps {
  targetId: string;
  targetName: string;
  onClose: () => void;
}

export function QuickValidate({ targetId, targetName, onClose }: QuickValidateProps) {
  const taskStatuses = useTaskStore((s) => s.taskStatuses);
  const completeTask = useTaskStore((s) => s.completeTask);
  const profile = useAuthStore((s) => s.profile);
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);

  // Filtrer les tâches de cette cible
  const tasks = taskStatuses.filter((t) => {
    return t.target_name === targetName;
  });

  const handleValidate = useCallback(async (task: TaskStatusView) => {
    if (!profile || !currentHousehold) return;

    try {
      Vibration.vibrate(50);
      await completeTask(task.task_definition_id, profile.id, currentHousehold.id);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de valider la tâche.');
    }
  }, [profile, currentHousehold, completeTask]);

  const renderTask = ({ item }: { item: TaskStatusView }) => {
    const colors = STATUS_COLORS[item.status];

    return (
      <TouchableOpacity
        style={[styles.taskRow, { borderLeftColor: colors.main }]}
        onPress={() => handleValidate(item)}
        activeOpacity={0.6}
      >
        <View style={styles.taskInfo}>
          <Text style={styles.taskName}>{item.task_type_name}</Text>
          <Text style={[styles.taskStatus, { color: colors.dark }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
        <View style={[styles.validateBtn, { backgroundColor: colors.light }]}>
          <Text style={[styles.validateText, { color: colors.dark }]}>✓</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Poignée */}
        <View style={styles.handle} />

        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>{targetName}</Text>
          <Text style={styles.subtitle}>
            {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Liste des tâches — 1 tap pour valider */}
        {tasks.length > 0 ? (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.task_definition_id}
            renderItem={renderTask}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune tâche pour cette cible</Text>
          </View>
        )}

        {/* Bouton fermer */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    maxHeight: '70%',
    ...SHADOWS.lg,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  validateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  validateText: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  closeBtn: {
    marginTop: SPACING.md,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
