// ============================================================
// CHORIFY — Écran Liste des Tâches
// ============================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { COLORS, SPACING, RADIUS, STATUS_COLORS } from '../utils/colors';
import { TaskCard } from '../components/TaskCard';
import { StreakBanner } from '../components/StreakBanner';
import { useTaskStore } from '../store/useTaskStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { TaskStatus, TaskStatusView } from '../types';
import { getStatusPriority } from '../utils/status';

type GroupBy = 'status' | 'zone';

export function TaskListScreen() {
  const { taskStatuses, refreshing, fetchAll, refresh } = useTaskStore();
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);
  const [groupBy, setGroupBy] = useState<GroupBy>('status');

  useEffect(() => {
    if (currentHousehold) {
      fetchAll(currentHousehold.id);
    }
  }, [currentHousehold]);

  const handleRefresh = useCallback(() => {
    if (currentHousehold) refresh(currentHousehold.id);
  }, [currentHousehold]);

  // Regroupement
  const sections = useMemo(() => {
    if (groupBy === 'status') {
      const grouped: Record<TaskStatus, TaskStatusView[]> = {
        red: [],
        orange: [],
        green: [],
      };

      taskStatuses.forEach((t) => {
        grouped[t.status].push(t);
      });

      return [
        { title: '🔴 En retard', data: grouped.red, status: 'red' as TaskStatus },
        { title: '🟠 Bientôt', data: grouped.orange, status: 'orange' as TaskStatus },
        { title: '🟢 À jour', data: grouped.green, status: 'green' as TaskStatus },
      ].filter((s) => s.data.length > 0);
    }

    // Par zone
    const byZone: Record<string, TaskStatusView[]> = {};
    taskStatuses.forEach((t) => {
      const zone = t.target_name;
      if (!byZone[zone]) byZone[zone] = [];
      byZone[zone].push(t);
    });

    return Object.entries(byZone)
      .map(([title, data]) => ({
        title,
        data: data.sort(
          (a, b) => getStatusPriority(a.status) - getStatusPriority(b.status)
        ),
        status: undefined,
      }))
      .sort((a, b) => {
        const worstA = Math.min(...a.data.map((d) => getStatusPriority(d.status)));
        const worstB = Math.min(...b.data.map((d) => getStatusPriority(d.status)));
        return worstA - worstB;
      });
  }, [taskStatuses, groupBy]);

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Tâches</Text>
        <Text style={styles.count}>
          {taskStatuses.length} tâche{taskStatuses.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Streak */}
      <StreakBanner />

      {/* Toggle groupement */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, groupBy === 'status' && styles.toggleActive]}
          onPress={() => setGroupBy('status')}
        >
          <Text style={[styles.toggleText, groupBy === 'status' && styles.toggleTextActive]}>
            Par statut
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, groupBy === 'zone' && styles.toggleActive]}
          onPress={() => setGroupBy('zone')}
        >
          <Text style={[styles.toggleText, groupBy === 'zone' && styles.toggleTextActive]}>
            Par zone
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.task_definition_id}
        renderItem={({ item }) => <TaskCard task={item} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyText}>Aucune tâche configurée</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  toggleActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  toggleTextActive: {
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
