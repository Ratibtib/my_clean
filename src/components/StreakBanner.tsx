// ============================================================
// CHORIFY — Composant StreakBanner
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/colors';
import { useStreakStore } from '../store/useStreakStore';

export function StreakBanner() {
  const streak = useStreakStore((s) => s.streak);

  if (streak === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.flame}>🔥</Text>
      <View style={styles.textContainer}>
        <Text style={styles.count}>{streak}</Text>
        <Text style={styles.label}>jour{streak > 1 ? 's' : ''} sans retard</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.streakLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  flame: {
    fontSize: 28,
    marginRight: SPACING.sm,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  count: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.streak,
  },
  label: {
    fontSize: 14,
    color: COLORS.streak,
    fontWeight: '500',
  },
});
