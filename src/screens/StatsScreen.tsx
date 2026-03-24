// ============================================================
// CHORIFY — Écran Statistiques
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/colors';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { useStreakStore } from '../store/useStreakStore';
import { HouseholdStats } from '../types';
import { fetchHouseholdStats } from '../services/tasks';

export function StatsScreen() {
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);
  const streak = useStreakStore((s) => s.streak);
  const [stats, setStats] = useState<HouseholdStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentHousehold) return;
    setLoading(true);
    fetchHouseholdStats(currentHousehold.id)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentHousehold]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Impossible de charger les statistiques.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const greenPct = stats.total_tasks > 0
    ? Math.round((stats.green_count / stats.total_tasks) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* En-tête */}
        <Text style={styles.title}>Statistiques</Text>
        <Text style={styles.subtitle}>30 derniers jours</Text>

        {/* Score global */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>{greenPct}%</Text>
          <Text style={styles.scoreLabel}>des tâches à jour</Text>

          {/* Barre visuelle */}
          <View style={styles.barContainer}>
            {stats.green_count > 0 && (
              <View
                style={[styles.barSegment, {
                  backgroundColor: COLORS.green,
                  flex: stats.green_count,
                }]}
              />
            )}
            {stats.orange_count > 0 && (
              <View
                style={[styles.barSegment, {
                  backgroundColor: COLORS.orange,
                  flex: stats.orange_count,
                }]}
              />
            )}
            {stats.red_count > 0 && (
              <View
                style={[styles.barSegment, {
                  backgroundColor: COLORS.red,
                  flex: stats.red_count,
                }]}
              />
            )}
          </View>

          <View style={styles.barLegend}>
            <Text style={[styles.barLegendText, { color: COLORS.green }]}>
              {stats.green_count} ✓
            </Text>
            <Text style={[styles.barLegendText, { color: COLORS.orange }]}>
              {stats.orange_count} ⏳
            </Text>
            <Text style={[styles.barLegendText, { color: COLORS.red }]}>
              {stats.red_count} ⚠️
            </Text>
          </View>
        </View>

        {/* Métriques */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.completions_last_30d}</Text>
            <Text style={styles.metricLabel}>Réalisations</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: COLORS.streak }]}>
              🔥 {streak}
            </Text>
            <Text style={styles.metricLabel}>Streak (jours)</Text>
          </View>
        </View>

        {/* Contributions */}
        <Text style={styles.sectionTitle}>Contributions</Text>
        {stats.user_contributions && stats.user_contributions.length > 0 ? (
          stats.user_contributions.map((uc, i) => {
            const maxCount = stats.user_contributions![0].count;
            const pct = maxCount > 0 ? (uc.count / maxCount) * 100 : 0;

            return (
              <View key={i} style={styles.contributionRow}>
                <View style={styles.contributionInfo}>
                  <Text style={styles.contributionName}>{uc.display_name}</Text>
                  <Text style={styles.contributionCount}>{uc.count}</Text>
                </View>
                <View style={styles.contributionBarBg}>
                  <View
                    style={[styles.contributionBarFill, { width: `${pct}%` }]}
                  />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noContributions}>Aucune contribution ce mois-ci</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
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
    marginBottom: SPACING.lg,
  },
  // Score
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  barContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: COLORS.borderLight,
  },
  barSegment: {
    height: '100%',
  },
  barLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SPACING.sm,
  },
  barLegendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Métriques
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  // Contributions
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  contributionRow: {
    marginBottom: SPACING.md,
  },
  contributionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  contributionName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  contributionCount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  contributionBarBg: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  contributionBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  noContributions: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
