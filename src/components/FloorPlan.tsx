import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  RefreshControl, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/colors';
import { FloorPlan } from '../components/FloorPlan';
import { StreakBanner } from '../components/StreakBanner';
import { useTaskStore } from '../store/useTaskStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { useStreakStore } from '../store/useStreakStore';
import { useAuthStore } from '../store/useAuthStore';

export function FloorPlanScreen({ navigation }: any) {
  const { loading, refreshing, fetchAll, refresh } = useTaskStore();
  const { currentHousehold, fetchHouseholds } = useHouseholdStore();
  const fetchStreak = useStreakStore((s: any) => s.fetchStreak);
  const profile = useAuthStore((s: any) => s.profile);

  useEffect(() => {
    if (profile?.id) {
      fetchHouseholds(profile.id);
    }
  }, [profile]);

  useEffect(() => {
    if (currentHousehold) {
      fetchAll(currentHousehold.id);
      fetchStreak(currentHousehold.id);
    }
  }, [currentHousehold]);

  const handleRefresh = useCallback(() => {
    if (profile?.id) fetchHouseholds(profile.id);
    if (currentHousehold) {
      refresh(currentHousehold.id);
      fetchStreak(currentHousehold.id);
    }
  }, [currentHousehold, profile]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏠</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
            Bienvenue sur Chorify !
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32, marginBottom: 24 }}>
            Pour commencer, créez votre foyer ou rejoignez-en un dans l'onglet Admin.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: RADIUS.md }}
            onPress={() => navigation?.navigate?.('Admin')}
          >
            <Text style={{ color: COLORS.surface, fontWeight: '700', fontSize: 15 }}>
              ⚙️ Aller dans Admin
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.householdName}>{currentHousehold.name}</Text>
        <Text style={styles.headerSubtitle}>Touchez une pièce pour agir</Text>
      </View>
      <StreakBanner />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <FloorPlan />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  householdName: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.xs, paddingBottom: SPACING.xxl },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12 },
});
