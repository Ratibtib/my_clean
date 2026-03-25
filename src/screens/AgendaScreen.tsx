import React, { useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, SectionList, RefreshControl,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../utils/colors';
import { useTaskStore } from '../store/useTaskStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
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
  const { taskStatuses, refreshing, fetchAll, refresh } = useTaskStore();
  const currentHousehold = useHouseholdStore((s: any) => s.currentHousehold);

  useEffect(() => {
    if (currentHousehold) fetchAll(currentHousehold.id);
  }, [currentHousehold]);

  const handleRefresh = useCallback(() => {
    if (currentHousehold) refresh(currentHousehold.id);
  }, [currentHousehold]);

  const sections = useMemo((): AgendaSection[] => {
    const withDeadlines = taskStatuses.map((t) => ({
      task: t,
      deadline: getNextDeadline(t.last_completed_at, t.definition_created_at, t.max_interval_days),
    }));
    const byDay: Record<string, { tasks: TaskStatusView[]; date: Date }> = {};
    withDeadlines.forEach(({ task, deadline }) => {
      const key = deadline.toDateString();
      if (!byDay[key]) byDay[key] = { tasks: [], date: deadline };
      byDay[key].tasks.push(task);
    });
    const now = new Date();
    return Object.values(byDay)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ tasks, date }) => ({
        title: isToday(date) ? "Aujourd'hui" : formatShortDate(date.toISOString()),
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
          <View style={[styles.sectionHeader, section.isToday && styles.sectionToday, section.isPast && styles.sectionPast]}>
            <Text style={[styles.sectionTitle, section.isToday && styles.sectionTitleToday, section.isPast && styles.sectionTitlePast]}>
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>{section.data.length} tâche{section.data.length > 1 ? 's' : ''}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary }}>Aucune tâche planifiée</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, marginTop: 8, marginBottom: 4, borderRadius: RADIUS.sm },
  sectionToday: { backgroundColor: '#EDE9FE' },
  sectionPast: { opacity: 0.5 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionTitleToday: { color: '#8B5CF6' },
  sectionTitlePast: { color: COLORS.red },
  sectionCount: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 80 },
});
