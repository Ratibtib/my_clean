import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Vibration, Alert, Dimensions,
} from 'react-native';
import { TaskStatusView } from '../types';
import { COLORS, SPACING, RADIUS, STATUS_COLORS } from '../utils/colors';
import { getStatusLabel } from '../utils/status';
import { timeAgo } from '../utils/dates';
import { useTaskStore } from '../store/useTaskStore';
import { useAuthStore } from '../store/useAuthStore';
import { useHouseholdStore } from '../store/useHouseholdStore';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface QuickValidateProps {
  targetId: string;
  targetName: string;
  onClose: () => void;
}

export function QuickValidate({ targetId, targetName, onClose }: QuickValidateProps) {
  const taskStatuses = useTaskStore((s: any) => s.taskStatuses);
  const completeTask = useTaskStore((s: any) => s.completeTask);
  const profile = useAuthStore((s: any) => s.profile);
  const currentHousehold = useHouseholdStore((s: any) => s.currentHousehold);

  const tasks = taskStatuses.filter((t: TaskStatusView) => t.target_name === targetName);

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
          <Text style={styles.taskMeta}>
            {item.last_completed_at ? timeAgo(item.last_completed_at) : 'Jamais fait'}
          </Text>
        </View>
        <View style={styles.taskRight}>
          <View style={[styles.statusPill, { backgroundColor: colors.light }]}>
            <Text style={[styles.statusText, { color: colors.dark }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <View style={[styles.validateBtn, { backgroundColor: colors.light }]}>
            <Text style={[styles.validateText, { color: colors.dark }]}>✓</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{targetName}</Text>
            <Text style={styles.subtitle}>
              {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeX}>
            <Text style={styles.closeXText}>✕</Text>
          </TouchableOpacity>
        </View>

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
            <Text style={styles.emptyHint}>Ajoutez-en dans Admin → Tâches</Text>
          </View>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 32,
    minHeight: SCREEN_HEIGHT * 0.3,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeX: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
  },
  closeXText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  taskMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  validateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateText: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  emptyHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  closeBtn: {
    marginTop: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
