// ============================================================
// CHORIFY — Composant TargetNode (nœud sur le plan SVG)
// ============================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Target, TaskStatus } from '../types';
import { STATUS_COLORS, COLORS, SPACING, RADIUS, SHADOWS } from '../utils/colors';

interface TargetNodeProps {
  target: Target;
  status: TaskStatus;
  onPress: (target: Target) => void;
  scale?: number;
}

export function TargetNode({ target, status, onPress, scale = 1 }: TargetNodeProps) {
  const colors = STATUS_COLORS[status];
  const isZone = target.type === 'zone';
  const size = isZone ? 72 * scale : 52 * scale;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          left: target.position_x * scale - size / 2,
          top: target.position_y * scale - size / 2,
          width: size,
          height: size,
          borderRadius: isZone ? RADIUS.lg * scale : size / 2,
          backgroundColor: colors.light,
          borderColor: colors.main,
          borderWidth: 2,
        },
      ]}
      onPress={() => onPress(target)}
      activeOpacity={0.7}
    >
      {/* Indicateur pulsant si rouge */}
      {status === 'red' && (
        <View style={[
          styles.pulse,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: isZone ? (RADIUS.lg + 4) * scale : (size + 8) / 2,
            borderColor: colors.main,
          },
        ]} />
      )}

      <Text
        style={[
          styles.label,
          { fontSize: isZone ? 11 * scale : 9 * scale, color: colors.dark },
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {target.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    ...SHADOWS.sm,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
  pulse: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.3,
  },
});
