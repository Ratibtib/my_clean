// ============================================================
// CHORIFY — Composant StatusBadge
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TaskStatus } from '../types';
import { STATUS_COLORS, SPACING, RADIUS } from '../utils/colors';
import { getStatusLabel } from '../utils/status';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: colors.light },
      isSmall && styles.badgeSmall,
    ]}>
      <View style={[styles.dot, { backgroundColor: colors.main }, isSmall && styles.dotSmall]} />
      <Text style={[
        styles.label,
        { color: colors.dark },
        isSmall && styles.labelSmall,
      ]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    gap: SPACING.xs + 1,
  },
  badgeSmall: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 11,
  },
});
