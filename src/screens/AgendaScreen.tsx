// ============================================================
// CHORIFY — Écran Agenda
// ============================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, STATUS_COLORS } from '../utils/colors';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatusView } from '../types';
import { getNextDeadline, formatShortDate, isToday } from '../utils/dates';
import { TaskCard } from '../components/TaskCard';

interface AgendaSection {
  title: string;
  isToday: boolean;
  isPast: boolean;
  data: TaskStatusView[];
}

export function AgendaScreen() {
  const taskStatuses = useTaskStore((s) => s.taskStatuses);

  const sections = useMemo((): AgendaSection[] => {
    // Calculer la deadline pour chaque tâche
    const withDeadlines = taskStatuses.map((t) => ({
      task: t,
      deadline: getNextDeadline(
        t.last_completed_at,
        t.definition_created_at,
        t.max_interval_days
      ),
    }));

    // Grouper par jour
    const byDay: Record<string, { tasks: TaskStatusView[]; date: Date }> = {};

    withDeadlines.forEach(({ task, deadline }) => {
      const key = deadline.toDateString();
      if (!byDay[key]) {
        byDay[key] = { tasks: [], date: deadline };
      }
      byDay[key].tasks.push(task);
    });

    // Trier par date et créer les sections
    const now = new Date();
    return Object.values(byDay)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ tasks, date }) => ({
        title: isToday(date)
          ? "Aujourd'hui"
          : formatShortDate(date.toISOString()),
        isToday: isToday(date),
        isPast: date < now && !isToday(date),
        data: tasks,
      }));
  }, [taskStatuses]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Échéances à venir</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.task_definition_id}
        renderItem={({ item }) => <TaskCard task={item} compact />}
        renderSectionHeader={({ section }) => (
          <View style={[
            styles.sectionHeader,
            section.isToday && styles.sectionToday,
            section.isPast && styles.sectionPast,
          ]}>
            <Text style={[
              styles.sectionTitle,
              section.isToday && styles.sectionTitleToday,
              section.isPast && styles.sectionTitlePast,
            ]}>
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>
              {section.data.length} tâche{section.data.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Aucune tâche planifiée</Text>
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
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionToday: {
    backgroundColor: COLORS.streakLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  sectionPast: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionTitleToday: {
    color: COLORS.streak,
  },
  sectionTitlePast: {
    color: COLORS.red,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '500',
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
