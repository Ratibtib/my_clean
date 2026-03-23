// ============================================================
// CHORIFY — Composant FloorPlan (Plan interactif)
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Target, TaskStatus } from '../types';
import { COLORS, SPACING } from '../utils/colors';
import { TargetNode } from './TargetNode';
import { QuickValidate } from './QuickValidate';
import { useTaskStore } from '../store/useTaskStore';

interface FloorPlanProps {
  targets: Target[];
  planWidth?: number;
  planHeight?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function FloorPlan({ targets, planWidth = 800, planHeight = 600 }: FloorPlanProps) {
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const taskStatuses = useTaskStore((s) => s.taskStatuses);

  // Calculer l'échelle pour que le plan tienne à l'écran
  const scale = useMemo(() => {
    const padding = SPACING.md * 2;
    const availableWidth = SCREEN_WIDTH - padding;
    return Math.min(availableWidth / planWidth, 1);
  }, [planWidth]);

  // Calculer le statut agrégé de chaque cible
  const targetStatuses = useMemo(() => {
    const map: Record<string, TaskStatus> = {};

    targets.forEach((target) => {
      const tasks = taskStatuses.filter((t) => t.target_name === target.name);

      if (tasks.length === 0) {
        map[target.id] = 'green';
        return;
      }

      if (tasks.some((t) => t.status === 'red')) {
        map[target.id] = 'red';
      } else if (tasks.some((t) => t.status === 'orange')) {
        map[target.id] = 'orange';
      } else {
        map[target.id] = 'green';
      }
    });

    return map;
  }, [targets, taskStatuses]);

  const handleTargetPress = (target: Target) => {
    setSelectedTarget(target);
  };

  // Séparer zones et équipements
  const zones = targets.filter((t) => t.type === 'zone');
  const equipment = targets.filter((t) => t.type === 'equipment');

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.planContainer,
          {
            width: planWidth * scale,
            height: planHeight * scale,
          },
        ]}
      >
        {/* Grille de fond */}
        <View style={[styles.grid, { width: planWidth * scale, height: planHeight * scale }]}>
          {/* Zones en arrière-plan */}
          {zones.map((zone) => (
            <TargetNode
              key={zone.id}
              target={zone}
              status={targetStatuses[zone.id] ?? 'green'}
              onPress={handleTargetPress}
              scale={scale}
            />
          ))}

          {/* Équipements au-dessus */}
          {equipment.map((eq) => (
            <TargetNode
              key={eq.id}
              target={eq}
              status={targetStatuses[eq.id] ?? 'green'}
              onPress={handleTargetPress}
              scale={scale}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom sheet de validation rapide */}
      {selectedTarget && (
        <QuickValidate
          targetId={selectedTarget.id}
          targetName={selectedTarget.name}
          onClose={() => setSelectedTarget(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  planContainer: {
    position: 'relative',
  },
  grid: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Motif de grille simulé via ombre intérieure
    overflow: 'hidden',
  },
});
