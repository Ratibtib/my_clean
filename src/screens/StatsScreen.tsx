import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/colors';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { useStreakStore } from '../store/useStreakStore';
import { HouseholdStats } from '../types';
import { fetchHouseholdStats } from '../services/tasks';

export function StatsScreen() {
  const currentHousehold = useHouseholdStore((s: any) => s.currentHousehold);
  const streak = useStreakStore((s: any) => s.streak);
  const fetchStreak = useStreakStore((s: any) => s.fetchStreak);
  const [stats, setStats] = useState<HouseholdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!currentHousehold) return;
    try {
      const data = await fetchHouseholdStats(currentHousehold.id);
      setStats(data);
      await fetchStreak(currentHousehold.id);
    } catch (e) {
      console.warn('Stats error:', e);
    }
  }, [currentHousehold]);

  useEffect(() => {
    setLoading(true);
    loadStats().finally(() => setLoading(false));
  }, [currentHousehold]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!stats || !currentHousehold) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Aucune donnée disponible</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pct = stats.total_tasks > 0 ? Math.round((stats.green_count / stats.total_tasks) * 100) : 0;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={s.title}>Statistiques</Text>
        <Text style={s.subtitle}>30 derniers jours</Text>

        <View style={s.scoreCard}>
          <Text style={s.scoreValue}>{pct}%</Text>
          <Text style={s.scoreLabel}>des tâches à jour</Text>
          <View style={s.barContainer}>
            {stats.green_count > 0 && <View style={[s.barSeg, { backgroundColor: COLORS.green, flex: stats.green_count }]} />}
            {stats.orange_count > 0 && <View style={[s.barSeg, { backgroundColor: COLORS.orange, flex: stats.orange_count }]} />}
            {stats.red_count > 0 && <View style={[s.barSeg, { backgroundColor: COLORS.red, flex: stats.red_count }]} />}
          </View>
          <View style={s.barLegend}>
            <Text style={[s.barText, { color: COLORS.green }]}>{stats.green_count} ✓</Text>
            <Text style={[s.barText, { color: COLORS.orange }]}>{stats.orange_count} ⏳</Text>
            <Text style={[s.barText, { color: COLORS.red }]}>{stats.red_count} ⚠️</Text>
          </View>
        </View>

        <View style={s.metricsRow}>
          <View style={s.metricCard}>
            <Text style={s.metricValue}>{stats.completions_last_30d}</Text>
            <Text style={s.metricLabel}>Réalisations</Text>
          </View>
          <View style={s.metricCard}>
            <Text style={[s.metricValue, { color: '#8B5CF6' }]}>🔥 {streak}</Text>
            <Text style={s.metricLabel}>Streak (jours)</Text>
          </View>
        </View>

        <Text style={s.contribTitle}>Contributions</Text>
        {stats.user_contributions && stats.user_contributions.length > 0 ? (
          stats.user_contributions.map((uc, i) => {
            const maxCount = stats.user_contributions![0].count;
            const p = maxCount > 0 ? (uc.count / maxCount) * 100 : 0;
            return (
              <View key={i} style={s.contribRow}>
                <View style={s.contribInfo}>
                  <Text style={s.contribName}>{uc.display_name}</Text>
                  <Text style={s.contribCount}>{uc.count}</Text>
                </View>
                <View style={s.contribBarBg}>
                  <View style={[s.contribBarFill, { width: `${p}%` }]} />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={s.noData}>Aucune contribution ce mois-ci</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.lg },
  scoreCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', ...SHADOWS.md },
  scoreValue: { fontSize: 48, fontWeight: '900', color: COLORS.text, letterSpacing: -2, lineHeight: 52 },
  scoreLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500', marginBottom: SPACING.md },
  barContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', width: '100%', backgroundColor: COLORS.borderLight },
  barSeg: { height: '100%' },
  barLegend: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  barText: { fontSize: 13, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  metricCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm },
  metricValue: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  metricLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 4 },
  contribTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginTop: 24, marginBottom: 12 },
  contribRow: { marginBottom: 14 },
  contribInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  contribName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  contribCount: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  contribBarBg: { height: 6, backgroundColor: COLORS.borderLight, borderRadius: 3, overflow: 'hidden' },
  contribBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  noData: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', padding: SPACING.lg },
});
