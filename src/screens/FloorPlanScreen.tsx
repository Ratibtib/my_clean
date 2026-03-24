// ============================================================
// CHORIFY — Écran Plan Interactif (Principal)
// ============================================================

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING } from '../utils/colors';
import { FloorPlan } from '../components/FloorPlan';
import { StreakBanner } from '../components/StreakBanner';
import { useTaskStore } from '../store/useTaskStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { useStreakStore } from '../store/useStreakStore';

export function FloorPlanScreen() {
  const { loading, refreshing, fetchAll, refresh } = useTaskStore();
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);
  const fetchStreak = useStreakStore((s) => s.fetchStreak);

  useEffect(() => {
    if (currentHousehold) {
      fetchAll(currentHousehold.id);
      fetchStreak(currentHousehold.id);
    }
  }, [currentHousehold]);

  const handleRefresh = useCallback(() => {
    if (currentHousehold) {
      refresh(currentHousehold.id);
      fetchStreak(currentHousehold.id);
    }
  }, [currentHousehold]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyTitle}>Aucun foyer</Text>
          <Text style={styles.emptySubtitle}>
            Créez ou rejoignez un foyer dans les paramètres.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.householdName}>{currentHousehold.name}</Text>
          <Text style={styles.headerSubtitle}>Touchez une pièce pour agir</Text>
        </View>
      </View>

      {/* Streak */}
      <StreakBanner />

      {/* Plan */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <FloorPlan />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  householdName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xs,
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
