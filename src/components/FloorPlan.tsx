// ============================================================
// CHORIFY — Plan Interactif Hardcodé (Appartement réel)
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text as RNText,
} from 'react-native';
import Svg, {
  Rect,
  Circle,
  Line,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { COLORS, SPACING, RADIUS, SHADOWS, STATUS_COLORS } from '../utils/colors';
import { QuickValidate } from './QuickValidate';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatus } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PLAN_PADDING = 24;
const PLAN_WIDTH = SCREEN_WIDTH - PLAN_PADDING * 2;
const PLAN_HEIGHT = PLAN_WIDTH * 0.82;
const SCALE = PLAN_WIDTH / 400;

// ─── Room & Equipment Definitions ────────────────────────────

interface RoomDef {
  id: string;
  name: string;
  shortName?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  area?: string;
  type: 'zone' | 'equipment';
  emoji?: string;
  // Furniture hints
  furniture?: { type: 'bed' | 'sofa' | 'table' | 'tub' | 'door'; x: number; y: number; w: number; h: number }[];
}

const ROOMS: RoomDef[] = [
  {
    id: 'chambre1', name: 'Chambre 1', x: 14, y: 14, w: 104, h: 144, rx: 6,
    area: '11.4 m²', type: 'zone',
    furniture: [{ type: 'bed', x: 28, y: 100, w: 36, h: 46 }],
  },
  {
    id: 'sdb', name: 'Salle de bain', shortName: 'SdB', x: 122, y: 14, w: 66, h: 92, rx: 6,
    area: '5.9 m²', type: 'zone',
    furniture: [{ type: 'tub', x: 134, y: 70, w: 42, h: 22 }],
  },
  {
    id: 'cuisine', name: 'Cuisine', x: 267, y: 14, w: 61, h: 92, rx: 6,
    area: '8.2 m²', type: 'zone',
  },
  {
    id: 'entree', name: 'Entrée', x: 332, y: 14, w: 54, h: 92, rx: 6,
    area: '1.9 m²', type: 'zone',
    furniture: [{ type: 'door', x: 348, y: 70, w: 22, h: 28 }],
  },
  {
    id: 'couloir', name: 'Couloir', x: 122, y: 108, w: 66, h: 110, rx: 4,
    area: '6 m²', type: 'zone',
  },
  {
    id: 'chambre2', name: 'Chambre 2', x: 14, y: 162, w: 104, h: 154, rx: 6,
    area: '11.7 m²', type: 'zone',
    furniture: [{ type: 'bed', x: 24, y: 270, w: 36, h: 38 }],
  },
  {
    id: 'salon', name: 'Salon / SAM', x: 192, y: 110, w: 136, h: 198, rx: 6,
    area: '26.1 m²', type: 'zone',
    furniture: [
      { type: 'sofa', x: 210, y: 138, w: 50, h: 20 },
      { type: 'table', x: 240, y: 252, w: 40, h: 30 },
    ],
  },
  {
    id: 'balcon', name: 'Balcon', x: 332, y: 222, w: 54, h: 94, rx: 6,
    area: '2.5 m²', type: 'zone',
  },
];

interface EquipDef {
  id: string;
  name: string;
  cx: number;
  cy: number;
  r: number;
  emoji: string;
  type: 'equipment';
}

const EQUIPMENT: EquipDef[] = [
  { id: 'four', name: 'Four', cx: 278, cy: 86, r: 15, emoji: '🍳', type: 'equipment' },
  { id: 'frigo', name: 'Frigo', cx: 316, cy: 34, r: 15, emoji: '🧊', type: 'equipment' },
  { id: 'machine', name: 'Lave-linge', cx: 174, cy: 30, r: 15, emoji: '🫧', type: 'equipment' },
  { id: 'wc', name: 'WC', cx: 142, cy: 128, r: 13, emoji: '🚽', type: 'equipment' },
];

// ─── Status helpers ──────────────────────────────────────────

function getTargetStatusFromTasks(
  targetName: string,
  taskStatuses: any[]
): TaskStatus {
  const tasks = taskStatuses.filter((t) => t.target_name === targetName);
  if (tasks.length === 0) return 'green';
  if (tasks.some((t) => t.status === 'red')) return 'red';
  if (tasks.some((t) => t.status === 'orange')) return 'orange';
  return 'green';
}

// ─── Component ───────────────────────────────────────────────

export function FloorPlan() {
  const [selectedTarget, setSelectedTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const taskStatuses = useTaskStore((s) => s.taskStatuses);

  // Compute statuses
  const statuses = useMemo(() => {
    const map: Record<string, TaskStatus> = {};
    [...ROOMS, ...EQUIPMENT].forEach((item) => {
      map[item.id] = getTargetStatusFromTasks(item.name, taskStatuses);
    });
    return map;
  }, [taskStatuses]);

  const handlePress = useCallback((id: string, name: string) => {
    setSelectedTarget({ id, name });
  }, []);

  const s = SCALE; // shorthand

  return (
    <View style={styles.wrapper}>
      {/* Plan container */}
      <View style={styles.planContainer}>
        <Svg
          width={PLAN_WIDTH}
          height={PLAN_HEIGHT}
          viewBox="0 0 400 328"
        >
          {/* Floor base */}
          <Rect x={6} y={6} width={388} height={316} rx={12}
            fill="#EDEAE4" stroke="#D6D3CD" strokeWidth={1} />

          {/* ── Walls ── */}
          <G stroke="#78716C" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.35}>
            <Rect x={12} y={12} width={376} height={304} rx={6} />
            <Line x1={120} y1={12} x2={120} y2={160} />
            <Line x1={190} y1={12} x2={190} y2={160} />
            <Line x1={265} y1={12} x2={265} y2={108} />
            <Line x1={330} y1={12} x2={330} y2={190} />
            <Line x1={12} y1={160} x2={190} y2={160} />
            <Line x1={190} y1={108} x2={330} y2={108} />
            <Line x1={120} y1={220} x2={190} y2={220} />
            <Line x1={310} y1={220} x2={388} y2={220} />
          </G>
          {/* Thin wall */}
          <Line x1={190} y1={160} x2={190} y2={220}
            stroke="#A8A29E" strokeWidth={1.5} strokeLinecap="round" opacity={0.3} />

          {/* ── Rooms ── */}
          {ROOMS.map((room) => {
            const status = statuses[room.id] ?? 'green';
            const colors = STATUS_COLORS[status];
            const isBalcon = room.id === 'balcon';
            const isCouloir = room.id === 'couloir';
            const label = room.shortName ?? room.name;

            return (
              <G key={room.id} onPress={() => handlePress(room.id, room.name)}>
                {/* Room fill */}
                <Rect
                  x={room.x} y={room.y}
                  width={room.w} height={room.h}
                  rx={room.rx}
                  fill={colors.light}
                  opacity={isBalcon ? 0.25 : isCouloir ? 0.25 : 0.5}
                />
                {/* Room border */}
                <Rect
                  x={room.x} y={room.y}
                  width={room.w} height={room.h}
                  rx={room.rx}
                  fill="none"
                  stroke={colors.main}
                  strokeWidth={isBalcon ? 0.5 : isCouloir ? 0.5 : 1.5}
                  strokeDasharray={isBalcon ? '4 3' : undefined}
                  opacity={isBalcon ? 0.6 : isCouloir ? 0.4 : 0.6}
                />
                {/* Room name */}
                <SvgText
                  x={room.x + room.w / 2}
                  y={room.y + room.h * (room.h > 140 ? 0.52 : 0.46)}
                  textAnchor="middle"
                  fontSize={room.w < 60 ? 10 : 12}
                  fontWeight="700"
                  fill={colors.dark}
                >
                  {label}
                </SvgText>
                {/* Area */}
                {room.area && (
                  <SvgText
                    x={room.x + room.w / 2}
                    y={room.y + room.h * (room.h > 140 ? 0.52 : 0.46) + 14}
                    textAnchor="middle"
                    fontSize={9}
                    fill={colors.dark}
                    opacity={0.6}
                  >
                    {room.area}
                  </SvgText>
                )}

                {/* Furniture hints */}
                {room.furniture?.map((f, i) => {
                  if (f.type === 'bed') {
                    return (
                      <G key={i}>
                        <Rect x={f.x} y={f.y} width={f.w} height={f.h}
                          rx={4} fill={colors.dark} opacity={0.07} />
                        <Rect x={f.x + 2} y={f.y + 2} width={f.w - 4} height={8}
                          rx={3} fill={colors.dark} opacity={0.12} />
                      </G>
                    );
                  }
                  if (f.type === 'sofa') {
                    return (
                      <G key={i}>
                        <Rect x={f.x} y={f.y + 4} width={f.w} height={f.h - 4}
                          rx={6} fill={colors.dark} opacity={0.06} />
                        <Rect x={f.x} y={f.y} width={f.w} height={6}
                          rx={3} fill={colors.dark} opacity={0.1} />
                      </G>
                    );
                  }
                  if (f.type === 'table') {
                    return (
                      <Rect key={i} x={f.x} y={f.y} width={f.w} height={f.h}
                        rx={4} fill={colors.dark} opacity={0.06} />
                    );
                  }
                  if (f.type === 'tub') {
                    return (
                      <G key={i}>
                        <Rect x={f.x} y={f.y} width={f.w} height={f.h}
                          rx={6} fill={colors.dark} opacity={0.08} />
                        <Circle cx={f.x + 6} cy={f.y + f.h / 2} r={3}
                          fill={colors.dark} opacity={0.12} />
                      </G>
                    );
                  }
                  if (f.type === 'door') {
                    return (
                      <G key={i}>
                        <Rect x={f.x} y={f.y} width={f.w} height={f.h}
                          rx={3} fill={colors.dark} opacity={0.06} />
                        <Circle cx={f.x + f.w - 4} cy={f.y + f.h / 2} r={2}
                          fill={colors.dark} opacity={0.15} />
                      </G>
                    );
                  }
                  return null;
                })}

                {/* Pulsing red dot for overdue */}
                {status === 'red' && (
                  <Circle
                    cx={room.x + room.w - 8}
                    cy={room.y + 10}
                    r={4}
                    fill={COLORS.red}
                    opacity={0.9}
                  />
                )}
              </G>
            );
          })}

          {/* ── Equipment ── */}
          {EQUIPMENT.map((eq) => {
            const status = statuses[eq.id] ?? 'green';
            const colors = STATUS_COLORS[status];

            return (
              <G key={eq.id} onPress={() => handlePress(eq.id, eq.name)}>
                <Circle
                  cx={eq.cx} cy={eq.cy} r={eq.r}
                  fill={colors.light}
                  stroke={colors.main}
                  strokeWidth={1.5}
                />
                <SvgText
                  x={eq.cx} y={eq.cy - 3}
                  textAnchor="middle"
                  fontSize={13}
                >
                  {eq.emoji}
                </SvgText>
                <SvgText
                  x={eq.cx} y={eq.cy + eq.r - 3}
                  textAnchor="middle"
                  fontSize={6}
                  fontWeight="700"
                  fill={colors.dark}
                >
                  {eq.name}
                </SvgText>
                {/* Pulsing dot for red */}
                {status === 'red' && (
                  <Circle
                    cx={eq.cx + eq.r - 3}
                    cy={eq.cy - eq.r + 3}
                    r={3.5}
                    fill={COLORS.red}
                    opacity={0.9}
                  />
                )}
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.green }]} />
          <RNText style={styles.legendText}>À jour</RNText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.orange }]} />
          <RNText style={styles.legendText}>Bientôt</RNText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.red }]} />
          <RNText style={styles.legendText}>En retard</RNText>
        </View>
      </View>

      {/* Bottom sheet */}
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

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  planContainer: {
    marginHorizontal: PLAN_PADDING / 2,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
